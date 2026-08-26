import styles from './Toggle.module.css';

export interface ToggleProps {
  value: boolean;
  onChange: (next: boolean) => void;
  onLabel?: string;
  offLabel?: string;
  /** Label for assistive tech — the visible label usually sits above the control. */
  ariaLabel: string;
  className?: string;
}

/**
 * The reference's twin ON/OFF buttons (Settings screen): the active side is filled —
 * green when on, red when off — and the inactive side stays dark.
 */
export function Toggle({
  value,
  onChange,
  onLabel = 'On',
  offLabel = 'Off',
  ariaLabel,
  className,
}: ToggleProps) {
  return (
    <div
      className={[styles.group, className ?? ''].filter(Boolean).join(' ')}
      role="group"
      aria-label={ariaLabel}
    >
      <button
        type="button"
        className={[styles.option, value ? `${styles.active} ${styles.onActive}` : '']
          .filter(Boolean)
          .join(' ')}
        aria-pressed={value}
        onClick={() => onChange(true)}
      >
        {onLabel}
      </button>
      <button
        type="button"
        className={[styles.option, !value ? `${styles.active} ${styles.offActive}` : '']
          .filter(Boolean)
          .join(' ')}
        aria-pressed={!value}
        onClick={() => onChange(false)}
      >
        {offLabel}
      </button>
    </div>
  );
}
