/**
 * Vercel Serverless Function — GET /api/street-view-image
 *
 * Secure proxy for the Google Street View Static API.
 * The GOOGLE_PLACES_KEY never leaves the server; browsers receive only the
 * final JPEG. Images are cached by the browser for 24 hours.
 *
 * Query params:
 *   lat     — latitude
 *   lon     — longitude
 *   heading — compass heading 0–360 (default 0 = North)
 *   size    — WxH in pixels, e.g. "640x400" (default "640x400")
 */

const SV_BASE = 'https://maps.googleapis.com/maps/api/streetview';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const key = process.env.GOOGLE_PLACES_KEY;
  if (!key) return res.status(404).end();

  const { lat, lon, heading = '0', size = '640x400' } = req.query;
  if (!lat || !lon) return res.status(400).end();

  const url =
    `${SV_BASE}?size=${size}` +
    `&location=${lat},${lon}` +
    `&heading=${heading}` +
    `&pitch=5` +
    `&fov=80` +
    `&source=outdoor` +
    `&key=${key}`;

  try {
    const svRes = await fetch(url);
    if (!svRes.ok) return res.status(404).end();

    const buffer = await svRes.arrayBuffer();

    res.setHeader('Content-Type', 'image/jpeg');
    res.setHeader('Cache-Control', 'public, max-age=86400'); // 24h browser cache
    res.send(Buffer.from(buffer));
  } catch (err) {
    console.error('[api/street-view-image] error:', err);
    res.status(500).end();
  }
}
