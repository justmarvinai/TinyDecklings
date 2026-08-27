import styles from './Toggle.module.css';

export interface ToggleProps {
  value: boolean;
  onChange: (next: boolean) => void;
  onLabel?: string;
  offLabel?: string;
  /** Label for assistive tech — the visible label usually sits above the control. */
  ariaLabel: string;
  /**
   * `switch` is on/off — green when on, red when off. `choice` is two equal options
   * where neither is a negative, so the active side takes the info accent instead.
   */
  tone?: 'switch' | 'choice';
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
  tone = 'switch',
  className,
}: ToggleProps) {
  const onTone = tone === 'choice' ? styles.choiceActive : styles.onActive;
  const offTone = tone === 'choice' ? styles.choiceActive : styles.offActive;
  return (
    <div
      className={[styles.group, className ?? ''].filter(Boolean).join(' ')}
      role="group"
      aria-label={ariaLabel}
    >
      <button
        type="button"
        className={[styles.option, value ? `${styles.active} ${onTone}` : '']
          .filter(Boolean)
          .join(' ')}
        aria-pressed={value}
        onClick={() => onChange(true)}
      >
        {onLabel}
      </button>
      <button
        type="button"
        className={[styles.option, !value ? `${styles.active} ${offTone}` : '']
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
