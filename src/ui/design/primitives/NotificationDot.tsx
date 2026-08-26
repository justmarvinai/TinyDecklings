import styles from './NotificationDot.module.css';

export interface NotificationDotProps {
  /** Omit or pass 0 for a bare dot with no number. */
  count?: number;
  className?: string;
}

export function NotificationDot({ count, className }: NotificationDotProps) {
  const showCount = typeof count === 'number' && count > 0;
  return (
    <span
      className={[styles.dot, showCount ? '' : styles.bare, className ?? '']
        .filter(Boolean)
        .join(' ')}
      aria-hidden="true"
    >
      {showCount ? count : null}
    </span>
  );
}
