import type { IconKey } from '@/content/schemas/iconKeys';
import { Icon } from '@/ui/icons/Icon';
import { NotificationDot } from '@/ui/design/primitives';
import styles from './TabBar.module.css';

export interface TabBarItem<T extends string> {
  id: T;
  label: string;
  icon: IconKey;
  notifications?: number;
  disabled?: boolean;
}

export interface TabBarProps<T extends string> {
  items: readonly TabBarItem<T>[];
  value: T;
  onChange: (id: T) => void;
}

/** Bottom navigation: MAP · CARDS · SUMMON · SHOP · MORE (Q24). */
export function TabBar<T extends string>({ items, value, onChange }: TabBarProps<T>) {
  return (
    <nav className={styles.bar} aria-label="Main navigation">
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          className={[styles.tab, item.id === value ? styles.active : ''].filter(Boolean).join(' ')}
          aria-current={item.id === value ? 'page' : undefined}
          disabled={item.disabled}
          onClick={() => onChange(item.id)}
        >
          <Icon name={item.icon} size={24} />
          <span>{item.label}</span>
          {item.notifications ? <NotificationDot count={item.notifications} /> : null}
        </button>
      ))}
    </nav>
  );
}
