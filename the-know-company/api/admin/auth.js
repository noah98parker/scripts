/**
 * POST /api/admin/auth
 *
 * Validates ADMIN_PASSWORD and returns a signed session token.
 * Token format: base64url(payload).base64url(hmac-sha256)
 * Expires after 8 hours.
 *
 * Body: { password: string }
 * Response: { token: string }
 */

import { createHmac, timingSafeEqual } from 'crypto';

export const config = { maxDuration: 10 };

export function signToken(secret) {
  const payload = Buffer.from(
    JSON.stringify({ exp: Date.now() + 8 * 3600_000 })
  ).toString('base64url');
  const sig = createHmac('sha256', secret).update(payload).digest('base64url');
  return `${payload}.${sig}`;
}

export function verifyToken(token, secret) {
  if (!token || !token.includes('.')) return false;
  const dot = token.lastIndexOf('.');
  const payload = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  const expected = createHmac('sha256', secret).update(payload).digest('base64url');
  try {
    if (!timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return false;
  } catch {
    return false;
  }
  const { exp } = JSON.parse(Buffer.from(payload, 'base64url').toString());
  return exp > Date.now();
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword) {
    return res.status(503).json({
      error: 'Admin access is not configured. Set ADMIN_PASSWORD in your Vercel environment variables.',
    });
  }

  const { password } = req.body || {};
  if (!password) return res.status(400).json({ error: 'Password required' });

  // Hash both sides to a fixed length before timing-safe compare
  const given    = createHmac('sha256', 'know-co').update(password).digest();
  const expected = createHmac('sha256', 'know-co').update(adminPassword).digest();

  if (!timingSafeEqual(given, expected)) {
    return res.status(401).json({ error: 'Incorrect password' });
  }

  return res.status(200).json({ token: signToken(adminPassword) });
}
