/**
 * GET /api/admin/status
 *
 * Returns current configuration status (which API keys are set,
 * which features are available). Requires a valid admin token.
 *
 * Headers: Authorization: Bearer <token>
 */

import { verifyToken } from './auth.js';

export const config = { maxDuration: 10 };

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword) return res.status(503).json({ error: 'Admin not configured' });

  const token = (req.headers.authorization || '').replace('Bearer ', '');
  if (!verifyToken(token, adminPassword)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const hasGoogle    = !!process.env.GOOGLE_PLACES_KEY;
  const hasAnthropic = !!process.env.ANTHROPIC_API_KEY;

  return res.status(200).json({
    env:       process.env.VERCEL_ENV || 'local',
    region:    process.env.VERCEL_REGION || 'unknown',
    timestamp: new Date().toISOString(),

    keys: {
      google_places: hasGoogle,
      anthropic:     hasAnthropic,
    },

    features: {
      osm_parking:       { enabled: true,                   label: 'OSM Street Parking',      icon: '🗺️' },
      city_open_data:    { enabled: true,                   label: 'City Open Data',           icon: '🏙️' },
      garage_search:     { enabled: hasGoogle,              label: 'Garage Search',            icon: '🏢' },
      parking_rates:     { enabled: hasAnthropic,           label: 'AI Rate Scraping',         icon: '💵' },
      ai_sign_decoder:   { enabled: hasAnthropic,           label: 'AI Sign Decoder',          icon: '📸' },
      street_view_ocr:   { enabled: hasGoogle && hasAnthropic, label: 'Street View Sign OCR', icon: '📷' },
    },
  });
}
