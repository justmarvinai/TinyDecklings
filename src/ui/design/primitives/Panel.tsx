import type { HTMLAttributes } from 'react';
import styles from './Panel.module.css';

export interface PanelProps extends HTMLAttributes<HTMLDivElement> {
  tone?: 'default' | 'raised' | 'slot';
  /** Remove padding and clip children — for panels whose content bleeds to the edge. */
  flush?: boolean;
}

export function Panel({ tone = 'default', flush, className, children, ...rest }: PanelProps) {
  const classes = [
    styles.panel,
    tone === 'raised' ? styles.raised : '',
    tone === 'slot' ? styles.slot : '',
    flush ? styles.flush : '',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ');
  return (
    <div className={classes} {...rest}>
      {children}
    </div>
  );
}
