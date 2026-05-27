/**
 * Sign Decoder — mobile
 * Sends a parking sign image to the /api/decode-sign Vercel serverless function
 * and returns a plain-English interpretation from Claude AI.
 *
 * Set EXPO_PUBLIC_API_URL to your Vercel deployment URL (no trailing slash),
 * e.g. https://the-know-company.vercel.app
 *
 * Users can also supply their own Anthropic key via settings.
 */

import * as FileSystem from 'expo-file-system';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = process.env.EXPO_PUBLIC_API_URL || '';
const ANTHROPIC_KEY_STORAGE = 'tkc_anthropic_key';

export async function getAnthropicApiKey() {
  try { return (await AsyncStorage.getItem(ANTHROPIC_KEY_STORAGE)) || ''; }
  catch { return ''; }
}
export async function setAnthropicApiKey(key) {
  await AsyncStorage.setItem(ANTHROPIC_KEY_STORAGE, key);
}

/**
 * Decode a parking sign from a local image URI (from expo-image-picker).
 * @param {string} imageUri  — local file:// URI
 * @returns {Promise<string>} plain-English interpretation
 */
export async function decodeSign(imageUri) {
  if (!API_URL) {
    throw new Error(
      'API URL not configured. Add EXPO_PUBLIC_API_URL=https://your-app.vercel.app to your .env file.'
    );
  }

  // Read the file as base64
  const base64 = await FileSystem.readAsStringAsync(imageUri, {
    encoding: FileSystem.EncodingType.Base64,
  });

  // Guess media type from extension
  const ext = imageUri.split('.').pop()?.toLowerCase();
  const mediaType = ext === 'png' ? 'image/png'
    : ext === 'gif' ? 'image/gif'
    : ext === 'webp' ? 'image/webp'
    : 'image/jpeg';

  const userApiKey = await getAnthropicApiKey();

  const res = await fetch(`${API_URL}/api/decode-sign`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      imageBase64: base64,
      mediaType,
      userApiKey: userApiKey || undefined,
    }),
  });

  const data = await res.json();

  if (!res.ok) {
    if (data.error === 'no_key') throw new Error(data.message);
    throw new Error(data.error || 'Sign decoder failed');
  }

  return data.interpretation;
}
