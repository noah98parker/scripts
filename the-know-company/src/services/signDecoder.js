/**
 * Sign Decoder service — calls the server-side Vercel proxy (/api/decode-sign).
 * The Anthropic API key lives in Vercel environment variables, not the browser.
 */

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Decode a parking sign image.
 * @param {File} imageFile — from <input type="file"> or camera capture
 * @returns {Promise<string>} plain-English interpretation
 */
export async function decodeSign(imageFile) {
  const imageBase64 = await fileToBase64(imageFile);
  const mediaType = imageFile.type || 'image/jpeg';

  const res = await fetch('/api/decode-sign', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ imageBase64, mediaType }),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || 'Sign decoder failed. Please try again.');
  }

  return data.interpretation;
}
