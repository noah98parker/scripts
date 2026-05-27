/**
 * Vercel Serverless Function — GET /api/parking-rates
 *
 * Given a parking garage's website URL, fetches the site and uses Claude
 * to extract actual hourly/daily/evening rates from the page text.
 *
 * Strategy (all requests fire in parallel):
 *  1. Fetch the homepage
 *  2. Simultaneously try common rates subpages: /rates, /pricing, /parking-rates, /parking
 *  3. Extract any JSON-LD structured data (schema.org pricing)
 *  4. Feed combined text to Claude Haiku for structured rate extraction
 *
 * Query params:
 *   website — full URL of the garage website
 *   name    — garage name (used in Claude prompt)
 */

export const config = { maxDuration: 30 };

// Common paths where parking operators publish their rate sheets
const RATES_PATHS = [
  '/rates',
  '/rate',
  '/pricing',
  '/prices',
  '/parking-rates',
  '/parking-pricing',
  '/rates-and-hours',
  '/hours-and-rates',
  '/daily-rates',
  '/parking',
  '/park',
];

const BROWSER_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 ' +
    '(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
  'Cache-Control': 'no-cache',
};

/** Fetch a URL and return raw HTML, or null on timeout/error. */
async function fetchPage(url, timeoutMs = 7000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: BROWSER_HEADERS,
      redirect: 'follow',
    });
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/** Extract all JSON-LD blocks from HTML (often contains structured pricing). */
function extractJsonLd(html) {
  const blocks = [];
  const re = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let m;
  while ((m = re.exec(html)) !== null) {
    try {
      const obj = JSON.parse(m[1]);
      // Only keep objects that might contain parking or pricing info
      const str = JSON.stringify(obj);
      if (/price|rate|park|hour|day|month|fee|cost/i.test(str)) {
        blocks.push(str);
      }
    } catch {/* bad JSON — skip */}
  }
  return blocks.join('\n');
}

/**
 * Find internal links in a page that are likely rate/pricing pages.
 * Returns up to 3 absolute URLs on the same domain.
 */
function findRateLinks(html, baseUrl) {
  const base = new URL(baseUrl);
  const links = new Set();
  // Match hrefs near rate/pricing-related text
  const re = /href=["']([^"'#?]+)["'][^>]*>([^<]{0,80})/gi;
  let m;
  while ((m = re.exec(html)) !== null) {
    const href = m[1];
    const text = m[2].toLowerCase();
    if (!/rate|price|pric|fee|hour|daily|park/i.test(href + text)) continue;
    try {
      const abs = href.startsWith('http')
        ? new URL(href)
        : new URL(href, base);
      if (abs.hostname === base.hostname && abs.pathname !== '/') {
        links.add(abs.toString().split('?')[0]); // strip query string
      }
    } catch {/* bad URL */}
    if (links.size >= 3) break;
  }
  return [...links];
}

/** Strip HTML tags and decode entities; keep numbers and $ in context. */
function cleanHtml(html) {
  // Remove scripts, styles, nav, footer, header blocks (rarely contain rates)
  let text = html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, ' ')
    .replace(/<nav[\s\S]*?<\/nav>/gi, ' ')
    .replace(/<footer[\s\S]*?<\/footer>/gi, ' ')
    .replace(/<header[\s\S]*?<\/header>/gi, ' ');

  // Strip remaining tags
  text = text.replace(/<[^>]+>/g, ' ');

  // Decode common entities
  text = text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&#\d+;/g, ' ');

  return text.replace(/\s+/g, ' ').trim();
}

/** Score how useful a text block is for rate extraction (higher = better). */
function rateScore(text) {
  const lower = text.toLowerCase();
  let score = 0;
  if (/\$\s*\d/.test(text))                       score += 10; // has dollar amounts
  if (/per\s+hour|\/\s*hr|hourly/i.test(lower))   score += 8;
  if (/per\s+day|daily|day\s+rate/i.test(lower))  score += 8;
  if (/parking\s+rates?/i.test(lower))            score += 5;
  if (/monthly/i.test(lower))                      score += 3;
  if (/evening|weekend|flat\s+rate/i.test(lower)) score += 3;
  return score;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  if (!anthropicKey) {
    return res.status(200).json({ found_rates: false, error: 'Not configured' });
  }

  const { website, name = 'Parking Garage' } = req.query;
  if (!website) return res.status(400).json({ error: 'website param required' });

  // ── Phase 1: Fetch homepage + known rates paths in parallel ────────────────
  let base;
  try { base = new URL(website); }
  catch { return res.status(200).json({ found_rates: false, error: 'Invalid URL' }); }

  const candidateUrls = [
    website,
    ...RATES_PATHS.map(p => `${base.protocol}//${base.hostname}${p}`),
  ];

  // Fire first 6 candidates in parallel (homepage + top 5 paths)
  const fetchResults = await Promise.allSettled(
    candidateUrls.slice(0, 6).map(url => fetchPage(url, 7000))
  );

  const homepageHtml = fetchResults[0].status === 'fulfilled' ? fetchResults[0].value : null;

  if (!homepageHtml) {
    return res.status(200).json({
      found_rates: false,
      error: 'Could not reach the parking website',
    });
  }

  // ── Phase 2: Build best text to send Claude ────────────────────────────────
  const segments = [];

  // 1. JSON-LD structured data from homepage (most reliable)
  const jsonLd = extractJsonLd(homepageHtml);
  if (jsonLd) segments.push(`=== STRUCTURED DATA (JSON-LD) ===\n${jsonLd}`);

  // 2. Scored page texts — pick best 3 by rate-relevance
  const pageTexts = fetchResults
    .filter(r => r.status === 'fulfilled' && r.value)
    .map(r => cleanHtml(r.value))
    .filter(t => t.length > 100)
    .sort((a, b) => rateScore(b) - rateScore(a))
    .slice(0, 3);

  segments.push(...pageTexts.map((t, i) => `=== PAGE ${i + 1} ===\n${t.slice(0, 3000)}`));

  // 3. Also look for rate page links in homepage and add any we didn't already fetch
  const extraLinks = findRateLinks(homepageHtml, website)
    .filter(url => !candidateUrls.includes(url))
    .slice(0, 2);

  if (extraLinks.length > 0) {
    const extraResults = await Promise.allSettled(
      extraLinks.map(url => fetchPage(url, 5000))
    );
    extraResults
      .filter(r => r.status === 'fulfilled' && r.value)
      .forEach((r, i) => {
        const t = cleanHtml(r.value);
        if (t.length > 100 && rateScore(t) > 5) {
          segments.push(`=== RATES PAGE ${i + 1} ===\n${t.slice(0, 3000)}`);
        }
      });
  }

  const combinedText = segments.join('\n\n').slice(0, 10000);

  // ── Phase 3: Claude extracts structured rates ──────────────────────────────
  const prompt = `You are extracting parking rates from website content for a parking app.
Garage name: ${name}
Website: ${website}

Content fetched from the website (may include multiple pages and structured data):
${combinedText}

Extract the parking rates and return ONLY a JSON object in this exact structure — no explanation, no markdown, just the JSON:
{
  "hourly": "exact rate string like '$4/hr' or '$4.00 per 30 min' or null",
  "daily_max": "exact rate string like '$28 max' or '$28/day' or null",
  "evening": "flat rate after business hours like '$10 after 5pm' or null",
  "weekend": "weekend flat rate like '$12 flat rate Sat-Sun' or null",
  "monthly": "monthly contract rate like '$175/month' or null",
  "early_bird": "early bird rate like '$15 in before 9am' or null",
  "validation": "validation deal like '2 hours free with $10 purchase' or null",
  "notes": "important info like 'in/out privileges, cash only, accessible, EV charging' or null",
  "found_rates": true or false
}

Rules:
- Copy rates EXACTLY as shown on the site (dollar signs, slashes, units)
- Set found_rates to true only if you found at least one actual dollar amount
- If the page is about parking but shows no prices, set found_rates to false
- Do not guess or estimate — only report what is explicitly stated`;

  try {
    const claudeRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': anthropicKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 600,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    const claudeData = await claudeRes.json();
    const rawText = claudeData.content?.[0]?.text || '';

    // Parse the JSON object from Claude's response
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return res.status(200).json({ found_rates: false, error: 'Could not parse rates' });
    }

    const parsed = JSON.parse(jsonMatch[0]);
    return res.status(200).json(parsed);
  } catch (err) {
    console.error('[api/parking-rates] error:', err);
    return res.status(200).json({ found_rates: false, error: 'Rate extraction failed' });
  }
}
