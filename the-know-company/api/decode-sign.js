/**
 * Vercel Serverless Function — POST /api/decode-sign
 *
 * Accepts a base64-encoded parking sign image and returns a plain-English
 * interpretation using Claude's vision API.
 *
 * Body: { imageBase64: string, mediaType: string, userApiKey?: string }
 *
 * Set ANTHROPIC_API_KEY in Vercel → Settings → Environment Variables.
 * Users can also supply their own key (passed as userApiKey in the body).
 */

export default async function handler(req, res) {
  // CORS headers so the browser can call this
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { imageBase64, mediaType = 'image/jpeg', userApiKey } = req.body || {};

  if (!imageBase64) {
    return res.status(400).json({ error: 'imageBase64 is required' });
  }

  const apiKey = userApiKey || process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(503).json({
      error: 'no_key',
      message: 'Sign Decoder requires an Anthropic API key. Add ANTHROPIC_API_KEY to your Vercel environment variables, or enter your own key in ⚙️ Settings.',
    });
  }

  try {
    const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 512,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image',
                source: { type: 'base64', media_type: mediaType, data: imageBase64 },
              },
              {
                type: 'text',
                text: `This is a photo of a parking sign or signs. Interpret it clearly for someone who just wants to know if they can park here. Answer in this exact format:

**Can I park here?** (Yes / No / Conditional)

**When:** (e.g. "Weekdays 8am–6pm, 2-hour limit" or "No parking anytime")

**How long:** (e.g. "2 hours max" or "No limit" or "N/A")

**Tow risk:** (Low / Medium / High — and one sentence why)

**Plain English summary:** (1–2 sentences a friend would say)

Be direct and specific. If the sign is unclear or hard to read, say so.`,
              },
            ],
          },
        ],
      }),
    });

    if (!anthropicRes.ok) {
      const errText = await anthropicRes.text();
      console.error('Anthropic API error:', anthropicRes.status, errText);
      return res.status(502).json({ error: 'Anthropic API error', detail: errText });
    }

    const data = await anthropicRes.json();
    const text = data.content?.[0]?.text || 'Could not interpret the sign.';

    return res.status(200).json({ interpretation: text });
  } catch (err) {
    console.error('decode-sign error:', err);
    return res.status(500).json({ error: err.message });
  }
}
