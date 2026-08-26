import type { HTMLAttributes, ReactNode } from 'react';
import styles from './Pill.module.css';

export interface PillProps extends HTMLAttributes<HTMLSpanElement> {
  /** Icon chip or similar, rendered flush against the left edge. */
  leading?: ReactNode;
  label?: string;
  value?: ReactNode;
  children?: ReactNode;
}

export function Pill({ leading, label, value, children, className, ...rest }: PillProps) {
  const classes = [styles.pill, leading ? styles.withLeadingChip : '', className ?? '']
    .filter(Boolean)
    .join(' ');
  return (
    <span className={classes} {...rest}>
      {leading}
      {label ? <span className={styles.label}>{label}</span> : null}
      {value !== undefined ? <span className={styles.value}>{value}</span> : null}
      {children}
    </span>
  );
}
