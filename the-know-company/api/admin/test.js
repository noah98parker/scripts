/**
 * POST /api/admin/test
 *
 * Makes a live API call to verify a key actually works (not just that it exists).
 * Returns latency and any error message.
 *
 * Headers: Authorization: Bearer <token>
 * Body: { api: 'google' | 'anthropic' }
 */

import { verifyToken } from './auth.js';

export const config = { maxDuration: 20 };

async function testGoogle(key) {
  const start = Date.now();
  // Minimal Places Nearby Search — radius 1m so it returns no results but validates the key
  const url =
    'https://maps.googleapis.com/maps/api/place/nearbysearch/json' +
    `?location=40.7580,-73.9855&radius=1&type=parking&key=${key}`;
  const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
  const data = await res.json();

  if (data.status === 'REQUEST_DENIED') {
    return { ok: false, latency: Date.now() - start, error: data.error_message || 'Key denied' };
  }
  return { ok: true, latency: Date.now() - start };
}

async function testAnthropic(key) {
  const start = Date.now();
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': key,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1,
      messages: [{ role: 'user', content: 'Hi' }],
    }),
    signal: AbortSignal.timeout(10000),
  });
  const data = await res.json();

  if (data.error) {
    return { ok: false, latency: Date.now() - start, error: data.error.message || 'API error' };
  }
  return { ok: true, latency: Date.now() - start };
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword) return res.status(503).json({ error: 'Admin not configured' });

  const token = (req.headers.authorization || '').replace('Bearer ', '');
  if (!verifyToken(token, adminPassword)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { api } = req.body || {};

  try {
    if (api === 'google') {
      const key = process.env.GOOGLE_PLACES_KEY;
      if (!key) return res.status(200).json({ ok: false, error: 'GOOGLE_PLACES_KEY not set' });
      return res.status(200).json(await testGoogle(key));
    }

    if (api === 'anthropic') {
      const key = process.env.ANTHROPIC_API_KEY;
      if (!key) return res.status(200).json({ ok: false, error: 'ANTHROPIC_API_KEY not set' });
      return res.status(200).json(await testAnthropic(key));
    }

    return res.status(400).json({ error: 'api must be "google" or "anthropic"' });
  } catch (err) {
    return res.status(200).json({ ok: false, error: err.message });
  }
}
