/**
 * Sign Decoder — mobile
 * Sends a parking sign image to the /api/decode-sign Vercel serverless function
 * and returns a plain-English interpretation from Claude AI.
 *
 * Set EXPO_PUBLIC_API_URL=https://your-app.vercel.app in your .env file.
 * The Anthropic API key lives in Vercel environment variables — users don't need one.
 */

import * as FileSystem from 'expo-file-system';

const API_URL = process.env.EXPO_PUBLIC_API_URL || '';

/**
 * Decode a parking sign from a local image URI (from expo-image-picker).
 * @param {string} imageUri — local file:// URI
 * @returns {Promise<string>} plain-English interpretation
 */
export async function decodeSign(imageUri) {
  if (!API_URL) {
    throw new Error('Sign Decoder is not configured. Please contact support.');
  }

  const base64 = await FileSystem.readAsStringAsync(imageUri, {
    encoding: FileSystem.EncodingType.Base64,
  });

  const ext = imageUri.split('.').pop()?.toLowerCase();
  const mediaType = ext === 'png' ? 'image/png'
    : ext === 'gif' ? 'image/gif'
    : ext === 'webp' ? 'image/webp'
    : 'image/jpeg';

  const res = await fetch(`${API_URL}/api/decode-sign`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ imageBase64: base64, mediaType }),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || 'Sign decoder failed. Please try again.');
  }

  return data.interpretation;
}
