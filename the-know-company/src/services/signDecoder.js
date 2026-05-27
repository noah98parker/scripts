/**
 * Sign Decoder service
 * Sends a captured parking sign image to /api/decode-sign (Vercel serverless)
 * and returns a plain-English interpretation.
 */

export function getAnthropicApiKey() {
  return localStorage.getItem('tkc_anthropic_key') || '';
}

export function setAnthropicApiKey(key) {
  localStorage.setItem('tkc_anthropic_key', key);
}

/**
 * Convert a File or Blob to a base64 string (without the data: prefix).
 */
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      // result is "data:image/jpeg;base64,XXXX" — strip the prefix
      const base64 = reader.result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Decode a parking sign image.
 * @param {File} imageFile  — from <input type="file"> or camera capture
 * @returns {Promise<string>} plain-English interpretation
 */
export async function decodeSign(imageFile) {
  const imageBase64 = await fileToBase64(imageFile);
  const mediaType = imageFile.type || 'image/jpeg';
  const userApiKey = getAnthropicApiKey();

  const res = await fetch('/api/decode-sign', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ imageBase64, mediaType, userApiKey: userApiKey || undefined }),
  });

  const data = await res.json();

  if (!res.ok) {
    if (data.error === 'no_key') throw new Error(data.message);
    throw new Error(data.error || 'Sign decoder failed');
  }

  return data.interpretation;
}
