import styles from './LoadingOverlay.module.css';

export default function LoadingOverlay({ message }) {
  return (
    <div className={styles.overlay}>
      <div className={styles.spinner}></div>
      <p className={styles.message}>{message || 'Loading…'}</p>
    </div>
  );
}
