/**
 * Vercel Serverless Function — GET /api/places
 *
 * Server-side proxy for Google Places API so the key never reaches the client.
 * Set GOOGLE_PLACES_KEY in Vercel → Settings → Environment Variables.
 *
 * Query params:
 *   action=nearby  lat=<lat>  lon=<lon>  radius=<meters>
 *   action=details placeId=<id>
 */

const PLACES_BASE = 'https://maps.googleapis.com/maps/api/place';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const key = process.env.GOOGLE_PLACES_KEY;
  if (!key) {
    // Return empty results gracefully — app works fine with OSM data alone
    return res.status(200).json({ results: [], status: 'NO_KEY' });
  }

  const { action, lat, lon, radius = 1000, placeId } = req.query;

  try {
    if (action === 'nearby') {
      if (!lat || !lon) return res.status(400).json({ error: 'lat and lon required' });

      const url = `${PLACES_BASE}/nearbysearch/json?location=${lat},${lon}&radius=${radius}&type=parking&key=${key}`;
      const upstream = await fetch(url);
      const data = await upstream.json();

      // Strip the API key from any error messages before forwarding
      return res.status(200).json({
        results: data.results || [],
        status: data.status,
      });
    }

    if (action === 'details') {
      if (!placeId) return res.status(400).json({ error: 'placeId required' });

      const fields = 'name,formatted_address,formatted_phone_number,website,opening_hours,price_level,rating,user_ratings_total,geometry';
      const url = `${PLACES_BASE}/details/json?place_id=${placeId}&fields=${fields}&key=${key}`;
      const upstream = await fetch(url);
      const data = await upstream.json();

      return res.status(200).json({
        result: data.result || null,
        status: data.status,
      });
    }

    return res.status(400).json({ error: 'action must be "nearby" or "details"' });
  } catch (err) {
    console.error('[api/places] error:', err);
    return res.status(500).json({ error: err.message });
  }
}
