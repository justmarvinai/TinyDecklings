import type { CSSProperties } from 'react';
import type { IconKey } from '@/content/schemas/iconKeys';
import { Icon } from '@/ui/icons/Icon';
import styles from './IconChip.module.css';

export interface IconChipProps {
  name: IconKey;
  size?: number;
  shape?: 'round' | 'square';
  /** Any CSS colour — pass rarity helpers for gear/card tinting. */
  background?: string;
  foreground?: string;
  title?: string;
  className?: string;
  style?: CSSProperties;
}

/**
 * An icon in the reference's "chip" treatment — icons never float bare in this UI
 * (UI_STYLE_GUIDE.md §8).
 */
export function IconChip({
  name,
  size = 28,
  shape = 'round',
  background,
  foreground,
  title,
  className,
  style,
}: IconChipProps) {
  return (
    <span
      className={[styles.chip, styles[shape], className ?? ''].filter(Boolean).join(' ')}
      style={
        {
          width: size,
          height: size,
          ...(background ? { '--chip-bg': background } : {}),
          ...(foreground ? { '--chip-fg': foreground } : {}),
          ...style,
        } as CSSProperties
      }
    >
      <Icon name={name} size={Math.round(size * 0.62)} title={title} />
    </span>
  );
}
