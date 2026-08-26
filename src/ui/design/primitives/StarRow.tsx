import { Icon } from '@/ui/icons/Icon';
import styles from './StarRow.module.css';

export interface StarRowProps {
  /** Stars earned. */
  value: number;
  /** Total slots drawn; unearned slots render dark. */
  max?: number;
  size?: number;
  /** Card-sheet ascension styling (magenta) versus the default gold. */
  variant?: 'gold' | 'ascension';
  label?: string;
  className?: string;
}

export function StarRow({
  value,
  max = 3,
  size = 14,
  variant = 'gold',
  label,
  className,
}: StarRowProps) {
  const classes = [styles.row, variant === 'ascension' ? styles.ascension : '', className ?? '']
    .filter(Boolean)
    .join(' ');
  return (
    <span className={classes} role="img" aria-label={label ?? `${value} of ${max} stars`}>
      {Array.from({ length: max }, (_, i) => (
        <Icon
          key={i}
          name="ui.star"
          size={size}
          className={[styles.star, i < value ? styles.filled : ''].filter(Boolean).join(' ')}
        />
      ))}
    </span>
  );
}
