import type { ReactNode } from 'react';
import { NotificationDot } from './NotificationDot';
import styles from './Tabs.module.css';

export interface TabItem<T extends string> {
  id: T;
  label: ReactNode;
  /** Secondary line, e.g. "42/70". */
  count?: string;
  notifications?: number;
}

export interface TabsProps<T extends string> {
  items: readonly TabItem<T>[];
  value: T;
  onChange: (id: T) => void;
  /** Skewed by default (reference style); straight where skew would hurt reading. */
  straight?: boolean;
  ariaLabel?: string;
  className?: string;
}

export function Tabs<T extends string>({
  items,
  value,
  onChange,
  straight,
  ariaLabel,
  className,
}: TabsProps<T>) {
  return (
    <div
      className={[styles.tabs, className ?? ''].filter(Boolean).join(' ')}
      role="tablist"
      aria-label={ariaLabel}
    >
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          role="tab"
          aria-selected={item.id === value}
          className={[
            styles.tab,
            item.id === value ? styles.active : '',
            straight ? styles.straight : '',
          ]
            .filter(Boolean)
            .join(' ')}
          onClick={() => onChange(item.id)}
        >
          <span className={styles.inner}>
            <span>{item.label}</span>
            {item.count ? <span className={styles.count}>{item.count}</span> : null}
          </span>
          {item.notifications ? <NotificationDot count={item.notifications} /> : null}
        </button>
      ))}
    </div>
  );
}
