import { useState, useRef } from 'react';
import { decodeSign } from '../services/signDecoder';
import styles from './SignDecoder.module.css';

export default function SignDecoder() {
  const [state, setState] = useState('idle'); // idle | loading | result | error
  const [result, setResult] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [previewUrl, setPreviewUrl] = useState(null);
  const inputRef = useRef(null);

  async function handleFile(file) {
    if (!file) return;
    setPreviewUrl(URL.createObjectURL(file));
    setState('loading');
    setResult('');
    setErrorMsg('');
    try {
      const interpretation = await decodeSign(file);
      setResult(interpretation);
      setState('result');
    } catch (err) {
      setErrorMsg(err.message || 'Could not decode the sign.');
      setState('error');
    }
  }

  function handleInputChange(e) {
    handleFile(e.target.files?.[0]);
    // Reset so same file can be re-selected
    e.target.value = '';
  }

  function handleReset() {
    setState('idle');
    setResult('');
    setErrorMsg('');
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
  }

  // Format the markdown-ish response from Claude into clean HTML
  function formatResult(text) {
    return text
      .split('\n')
      .map((line, i) => {
        // Bold **text**
        const formatted = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        if (!line.trim()) return null;
        return <p key={i} dangerouslySetInnerHTML={{ __html: formatted }} />;
      })
      .filter(Boolean);
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.header}>
        <span className={styles.icon}>📸</span>
        <div>
          <div className={styles.title}>Sign Decoder</div>
          <div className={styles.subtitle}>Point your camera at a parking sign for an instant plain-English read</div>
        </div>
      </div>

      {state === 'idle' && (
        <div className={styles.captureArea} onClick={() => inputRef.current?.click()}>
          <div className={styles.captureIcon}>🪧</div>
          <div className={styles.captureLabel}>Tap to take a photo or upload a sign</div>
          <div className={styles.captureHint}>Works with confusing stacked signs too</div>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className={styles.hiddenInput}
            onChange={handleInputChange}
          />
        </div>
      )}

      {state === 'loading' && (
        <div className={styles.loadingArea}>
          {previewUrl && <img src={previewUrl} alt="Parking sign" className={styles.preview} />}
          <div className={styles.loadingRow}>
            <div className={styles.spinner} />
            <span>Reading the sign…</span>
          </div>
        </div>
      )}

      {state === 'result' && (
        <div className={styles.resultArea}>
          {previewUrl && <img src={previewUrl} alt="Parking sign" className={styles.preview} />}
          <div className={styles.resultCard}>
            {formatResult(result)}
          </div>
          <button className={styles.resetBtn} onClick={handleReset}>
            📸 Decode another sign
          </button>
        </div>
      )}

      {state === 'error' && (
        <div className={styles.errorArea}>
          <div className={styles.errorIcon}>⚠️</div>
          <div className={styles.errorMsg}>{errorMsg}</div>
          {(errorMsg.toLowerCase().includes('api key') || errorMsg.toLowerCase().includes('anthropic') || errorMsg.toLowerCase().includes('no_key')) && (
            <div className={styles.errorHelp}>
              Add <code>ANTHROPIC_API_KEY</code> to your Vercel environment variables,
              or enter your own key in <strong>⚙️ Settings</strong>.
            </div>
          )}
          <button className={styles.resetBtn} onClick={handleReset}>Try again</button>
        </div>
      )}
    </div>
  );
}
