import { useEffect } from 'react';
import styles from './NotificationBanner.module.css';

const TYPE_STYLES = {
  error: { bg: 'var(--red)', icon: '🚨' },
  warning: { bg: 'var(--yellow)', icon: '⚠️' },
  success: { bg: 'var(--green)', icon: '✅' },
  info: { bg: 'var(--blue)', icon: 'ℹ️' },
};

export default function NotificationBanner({ notification, onClose }) {
  const cfg = TYPE_STYLES[notification?.type] || TYPE_STYLES.info;

  useEffect(() => {
    const t = setTimeout(onClose, 6000);
    return () => clearTimeout(t);
  }, [notification, onClose]);

  if (!notification) return null;

  return (
    <div className={styles.banner} style={{ background: cfg.bg }}>
      <span className={styles.icon}>{cfg.icon}</span>
      <span className={styles.message}>{notification.message}</span>
      <button className={styles.close} onClick={onClose}>✕</button>
    </div>
  );
}
