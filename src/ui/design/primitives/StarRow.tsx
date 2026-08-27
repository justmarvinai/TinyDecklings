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
  /**
   * Fill the container rather than measuring a fixed width.
   *
   * For rows in a grid cell that has no room to spare — the deck builder's slots —
   * where a fixed row is the one thing on the card that cannot shrink. `size`
   * becomes a maximum instead of an exact width.
   */
  fluid?: boolean;
  label?: string;
  className?: string;
}

export function StarRow({
  value,
  max = 3,
  size = 14,
  variant = 'gold',
  fluid = false,
  label,
  className,
}: StarRowProps) {
  const classes = [
    styles.row,
    fluid ? styles.fluid : '',
    variant === 'ascension' ? styles.ascension : '',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ');
  return (
    <span className={classes} role="img" aria-label={label ?? `${value} of ${max} stars`}>
      {Array.from({ length: max }, (_, i) => (
        <Icon
          key={i}
          name="ui.star"
          size={size}
          style={fluid ? { maxWidth: size } : undefined}
          className={[styles.star, i < value ? styles.filled : ''].filter(Boolean).join(' ')}
        />
      ))}
    </span>
  );
}
