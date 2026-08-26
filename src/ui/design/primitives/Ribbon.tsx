import type { ReactNode } from 'react';
import styles from './Ribbon.module.css';

export interface RibbonProps {
  children: ReactNode;
  /** `gold` = BOSS/level banners, `danger` = NEW/discount, `info` = neutral tags. */
  tone?: 'danger' | 'gold' | 'info';
  side?: 'left' | 'right';
  className?: string;
}

/** Notched corner banner (NEW, -10%, BOSS, DECK 1) — absolutely positioned on a card. */
export function Ribbon({ children, tone = 'danger', side = 'left', className }: RibbonProps) {
  return (
    <span
      className={[
        styles.ribbon,
        tone === 'gold' ? styles.gold : '',
        tone === 'info' ? styles.info : '',
        side === 'right' ? styles.right : '',
        className ?? '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {children}
    </span>
  );
}
