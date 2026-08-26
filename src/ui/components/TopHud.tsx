import type { IconKey } from '@/content/schemas/iconKeys';
import { PLACEHOLDER_AVATAR } from '@/ui/art/artManifest';
import { Button, IconChip, NotificationDot, Pill } from '@/ui/design/primitives';
import styles from './TopHud.module.css';

export interface HudResource {
  key: string;
  icon: IconKey;
  value: string;
  /** Tint for the icon chip, e.g. a currency colour token. */
  color?: string;
  label?: string;
}

export interface TopHudProps {
  playerLevel: number;
  resources: readonly HudResource[];
  hasNews?: boolean;
  onAvatarPress?: () => void;
  onAddPress?: () => void;
}

/**
 * The persistent top bar: avatar + level, resource pills, and the green add button
 * (UI_STYLE_GUIDE.md §6). Presentational only — stores wire it up.
 */
export function TopHud({
  playerLevel,
  resources,
  hasNews,
  onAvatarPress,
  onAddPress,
}: TopHudProps) {
  return (
    <header className={styles.hud}>
      <button
        type="button"
        className={styles.avatar}
        onClick={onAvatarPress}
        aria-label={`Profile, level ${playerLevel}`}
      >
        <img className={styles.avatarImg} src={PLACEHOLDER_AVATAR} alt="" />
        <span className={styles.level}>{playerLevel}</span>
        {hasNews ? <NotificationDot /> : null}
      </button>

      <div className={styles.currencies}>
        {resources.map((r) => (
          <Pill
            key={r.key}
            leading={<IconChip name={r.icon} size={24} background={r.color} title={r.label} />}
            value={r.value}
          />
        ))}
      </div>

      <Button variant="positive" className={styles.add} onClick={onAddPress} aria-label="Get more">
        +
      </Button>
    </header>
  );
}
