import { CONTENT } from '@/content';
import { usePlayerStore } from '@/state/playerStore';
import { useSettingsStore } from '@/state/settingsStore';
import { Button, Panel, Toggle } from '@/ui/design/primitives';
import styles from './SettingsScreen.module.css';

/**
 * Settings, in the reference's label-above-control layout.
 *
 * Nothing here talks to a server: there are no accounts, no sign-in and no social
 * links, because the game is single-player and fully offline (CLAUDE.md rule 11).
 */
export function SettingsScreen() {
  const settings = useSettingsStore();
  const cards = usePlayerStore((s) => s.cards().length);
  const gear = usePlayerStore((s) => s.gear().length);

  return (
    <div className={`${styles.screen} u-scroll-y`}>
      <div className={styles.group}>
        <h2 className={styles.groupTitle}>Audio</h2>

        <div className={styles.row}>
          <span className={styles.label}>Sound effects</span>
          <Toggle value={settings.sfx} onChange={settings.setSfx} ariaLabel="Sound effects" />
        </div>

        <div className={styles.row}>
          <span className={styles.label}>Music</span>
          <Toggle value={settings.music} onChange={settings.setMusic} ariaLabel="Music" />
          <span className={styles.hint}>Music and the full sound set arrive in a later phase.</span>
        </div>
      </div>

      <div className={styles.group}>
        <h2 className={styles.groupTitle}>Battle</h2>

        <div className={styles.row}>
          <span className={styles.label}>Speed</span>
          <Button
            variant="info"
            onClick={() => settings.setBattleSpeed(settings.battleSpeed === 1 ? 2 : 1)}
          >
            <span className={styles.value}>×{settings.battleSpeed}</span>
          </Button>
          <span className={styles.hint}>Also switchable from the battle screen.</span>
        </div>

        <div className={styles.row}>
          <span className={styles.label}>Reduced motion</span>
          <Toggle
            value={settings.reducedMotion}
            onChange={settings.setReducedMotion}
            onLabel="On"
            offLabel="Off"
            ariaLabel="Reduced motion"
          />
          <span className={styles.hint}>
            Calms battle effects and transitions. Your device's own reduced-motion setting is always
            respected too.
          </span>
        </div>
      </div>

      <div className={styles.group}>
        <h2 className={styles.groupTitle}>Language</h2>
        <div className={styles.row}>
          <Button variant="neutral" disabled>
            English
          </Button>
          <span className={styles.hint}>
            More languages may follow; every string lives in one place.
          </span>
        </div>
      </div>

      <div className={styles.group}>
        <h2 className={styles.groupTitle}>About</h2>
        <Panel tone="raised">
          <p className={styles.about}>
            TinyDecklings is a single-player game. Your progress is saved on this device only —
            there are no accounts and nothing is sent anywhere. You own {cards} card
            {cards === 1 ? '' : 's'} and {gear} piece{gear === 1 ? '' : 's'} of gear across{' '}
            {CONTENT.regions.size} region
            {CONTENT.regions.size === 1 ? '' : 's'}.
          </p>
        </Panel>
      </div>
    </div>
  );
}
