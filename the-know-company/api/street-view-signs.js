/**
 * Vercel Serverless Function — GET /api/street-view-signs
 *
 * Fetches Google Street View panoramas at 4 compass headings around a
 * coordinate, then uses Claude Haiku vision to read every visible parking
 * restriction sign and return structured JSON.
 *
 * Strategy:
 *  1. Metadata check (free) — abort early if no Street View coverage
 *  2. Fetch images at N / E / S / W in parallel (catches signs on all curbs)
 *  3. Send all images + a structured extraction prompt to Claude Haiku
 *  4. Return parsed restriction objects + summary
 *
 * Query params:
 *   lat — latitude
 *   lon — longitude
 */

export const config = { maxDuration: 30 };

const SV_BASE = 'https://maps.googleapis.com/maps/api/streetview';

const DIR_NAME = { 0: 'North', 90: 'East', 180: 'South', 270: 'West' };

/** Fetch a Street View image and return it as a base64 string, or null. */
async function fetchSvImage(lat, lon, heading, key) {
  const url =
    `${SV_BASE}?size=640x400` +
    `&location=${lat},${lon}` +
    `&heading=${heading}` +
    `&pitch=5` +
    `&fov=80` +
    `&source=outdoor` +
    `&key=${key}`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 9000);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) return null;
    const buf = await res.arrayBuffer();
    // Google returns a small placeholder image when no imagery exists (~4 KB)
    if (buf.byteLength < 8000) return null;
    return Buffer.from(buf).toString('base64');
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const googleKey    = process.env.GOOGLE_PLACES_KEY;
  const anthropicKey = process.env.ANTHROPIC_API_KEY;

  if (!googleKey || !anthropicKey) {
    return res.status(200).json({ signs_found: false, error: 'Not configured' });
  }

  const { lat, lon } = req.query;
  if (!lat || !lon) return res.status(400).json({ error: 'lat and lon required' });

  // ── Step 1: Check Street View coverage (free metadata call) ───────────────
  try {
    const metaRes  = await fetch(
      `${SV_BASE}/metadata?location=${lat},${lon}&source=outdoor&key=${googleKey}`
    );
    const meta = await metaRes.json();
    if (meta.status !== 'OK') {
      return res.status(200).json({ signs_found: false, no_coverage: true });
    }
  } catch {
    return res.status(200).json({ signs_found: false, error: 'Coverage check failed' });
  }

  // ── Step 2: Fetch panoramas at 4 headings in parallel ─────────────────────
  const HEADINGS = [0, 90, 180, 270];

  const rawResults = await Promise.allSettled(
    HEADINGS.map(h => fetchSvImage(lat, lon, h, googleKey))
  );

  const images = rawResults
    .map((r, i) => ({ heading: HEADINGS[i], b64: r.status === 'fulfilled' ? r.value : null }))
    .filter(img => img.b64 !== null);

  if (images.length === 0) {
    return res.status(200).json({ signs_found: false, error: 'No Street View imagery returned' });
  }

  // ── Step 3: Build Claude message — label + image for each heading ──────────
  const contentBlocks = [];

  for (const img of images) {
    contentBlocks.push({
      type: 'text',
      text: `=== Street View facing ${DIR_NAME[img.heading] ?? img.heading + '°'} ===`,
    });
    contentBlocks.push({
      type: 'image',
      source: { type: 'base64', media_type: 'image/jpeg', data: img.b64 },
    });
  }

  contentBlocks.push({
    type: 'text',
    text: `You are reading parking restriction signs from Google Street View images.
The images show the same location from ${images.length} compass directions.

Find EVERY parking sign visible in ANY image. Look carefully for:
- No parking / no stopping / no standing (with times and days)
- Time-limited parking (e.g. "2 Hour Parking 8am–6pm Mon–Sat")
- Street cleaning schedules
- Permit / RPP zones
- Tow-away zones
- Metered parking signs and rates
- Loading zones, fire hydrant zones

Return ONLY a JSON object — no explanation, no markdown:
{
  "signs_found": true or false,
  "restrictions": [
    {
      "type": "no_parking|time_limit|street_cleaning|permit|tow_away|meter|loading|other",
      "text": "exact text copied from the sign",
      "times": "time restriction if shown, else null",
      "days": "days restriction if shown, else null",
      "notes": "any extra context or null"
    }
  ],
  "summary": "one plain-English sentence describing what you see on the signs",
  "confidence": "high|medium|low"
}`,
  });

  // ── Step 4: Claude Haiku vision ────────────────────────────────────────────
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
        max_tokens: 1024,
        messages: [{ role: 'user', content: contentBlocks }],
      }),
    });

    const claudeData = await claudeRes.json();
    const rawText    = claudeData.content?.[0]?.text || '';
    const match      = rawText.match(/\{[\s\S]*\}/);

    if (!match) {
      return res.status(200).json({ signs_found: false, error: 'Could not parse Claude response' });
    }

    const parsed = JSON.parse(match[0]);
    return res.status(200).json({
      ...parsed,
      headings_analyzed: images.map(i => i.heading),
    });
  } catch (err) {
    console.error('[api/street-view-signs] error:', err);
    return res.status(200).json({ signs_found: false, error: 'Sign analysis failed' });
  }
}
