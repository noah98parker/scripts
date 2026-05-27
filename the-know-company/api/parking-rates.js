/**
 * Vercel Serverless Function — GET /api/parking-rates
 *
 * Fetches a parking garage's website, strips HTML, and uses Claude Haiku
 * to extract structured hourly/daily/evening rates from the page text.
 *
 * Query params:
 *   website - the URL of the garage's website
 *   name    - the garage name (used in the Claude prompt)
 */

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

function setCors(res) {
  for (const [k, v] of Object.entries(CORS_HEADERS)) {
    res.setHeader(k, v);
  }
}

function cleanHtml(html) {
  // Strip script, style, noscript blocks with their content
  let text = html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, '');

  // Strip remaining tags
  text = text.replace(/<[^>]+>/g, ' ');

  // Decode common HTML entities
  text = text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ');

  // Normalize whitespace
  text = text.replace(/\s+/g, ' ').trim();

  return text;
}

export default async function handler(req, res) {
  setCors(res);

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  if (!anthropicKey) {
    return res.status(200).json({ found_rates: false, error: 'Not configured' });
  }

  const { website, name = 'Parking Garage' } = req.query;
  if (!website) {
    return res.status(400).json({ error: 'website param is required' });
  }

  // 1. Fetch website HTML with timeout and browser-like headers
  let cleanedText;
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    let fetchResponse;
    try {
      fetchResponse = await fetch(website, {
        signal: controller.signal,
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          Accept: 'text/html,application/xhtml+xml',
          'Accept-Language': 'en-US,en;q=0.9',
        },
      });
    } finally {
      clearTimeout(timeoutId);
    }

    const html = await fetchResponse.text();
    cleanedText = cleanHtml(html).slice(0, 6000);
  } catch (err) {
    const isTimeout = err.name === 'AbortError';
    return res.status(200).json({
      found_rates: false,
      error: isTimeout ? 'Could not reach website' : 'Could not reach website',
    });
  }

  // 2. Call Claude Haiku to extract rates
  const prompt = `You are extracting parking rates from a garage operator's website text.
Garage name: ${name}

Website text:
${cleanedText}

Extract parking rates and return ONLY valid JSON in this exact structure:
{
  "hourly": "e.g. $3/hr or $3.00/30 min or null",
  "daily_max": "e.g. $25 max or $25/day or null",
  "evening": "e.g. $10 flat after 5pm or null",
  "weekend": "e.g. $12 flat Sat-Sun or null",
  "monthly": "e.g. $150/month or null",
  "validation": "e.g. 2 hours free with validation or null",
  "notes": "e.g. in/out privileges included, cash only, etc. or null",
  "found_rates": true or false
}

If no parking rates or pricing information is visible in the text, set found_rates to false and all other fields to null.
Return only the JSON object, no explanation.`;

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
        max_tokens: 512,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    const claudeData = await claudeRes.json();
    const rawText = claudeData.content?.[0]?.text || '';

    // Parse JSON from Claude's response
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return res.status(200).json({ found_rates: false, error: 'Could not parse rates' });
    }

    const parsed = JSON.parse(jsonMatch[0]);
    return res.status(200).json(parsed);
  } catch (err) {
    console.error('[api/parking-rates] Claude error:', err);
    return res.status(200).json({ found_rates: false, error: 'Rate extraction failed' });
  }
}
