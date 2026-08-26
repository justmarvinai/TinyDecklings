import type { CSSProperties } from 'react';
import type { IconKey } from '@/content/schemas/iconKeys';
import { IconChip } from './IconChip';
import styles from './StatBar.module.css';

export interface StatBarProps {
  label?: string;
  /** Current value; with `max` it drives the fill/segment count. */
  value: number;
  max: number;
  /** Segmented blocks (UI_Stats reference) or a continuous fill (XP bars). */
  variant?: 'segmented' | 'fill';
  segments?: number;
  icon?: IconKey;
  /** Any CSS colour token for label, fill and icon chip. */
  color?: string;
  showValue?: boolean;
  className?: string;
}

export function StatBar({
  label,
  value,
  max,
  variant = 'fill',
  segments = 5,
  icon,
  color,
  showValue,
  className,
}: StatBarProps) {
  const ratio = max > 0 ? Math.min(Math.max(value / max, 0), 1) : 0;
  const filledSegments = Math.round(ratio * segments);

  return (
    <div
      className={[styles.wrap, className ?? ''].filter(Boolean).join(' ')}
      style={color ? ({ '--bar-color': color } as CSSProperties) : undefined}
    >
      {icon ? <IconChip name={icon} size={26} shape="square" background={color} /> : null}
      <div className={styles.body}>
        {label ? <span className={styles.label}>{label}</span> : null}
        <div
          className={styles.track}
          role="meter"
          aria-valuenow={value}
          aria-valuemin={0}
          aria-valuemax={max}
          aria-label={label}
        >
          {variant === 'fill' ? (
            <div className={styles.fill} style={{ width: `${ratio * 100}%` }} />
          ) : (
            <div className={styles.segments}>
              {Array.from({ length: segments }, (_, i) => (
                <span
                  key={i}
                  className={[styles.segment, i < filledSegments ? styles.segmentOn : '']
                    .filter(Boolean)
                    .join(' ')}
                />
              ))}
            </div>
          )}
        </div>
      </div>
      {showValue ? (
        <span className={styles.value}>
          {value}/{max}
        </span>
      ) : null}
    </div>
  );
}
