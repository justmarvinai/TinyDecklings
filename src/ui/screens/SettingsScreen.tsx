import { useState } from 'react';
import { CONTENT } from '@/content';
import { usePlayerStore } from '@/state/playerStore';
import { useSettingsStore } from '@/state/settingsStore';
import { Button, Panel, Toggle } from '@/ui/design/primitives';
import { TitleBanner } from '@/ui/design/primitives';
import type { SaveService } from '@/services/saves';
import { BackupSection } from './BackupSection';
import styles from './SettingsScreen.module.css';

/**
 * Something to hand over when something is wrong.
 *
 * The crash net already offers this, but most problems do not crash — they just
 * behave oddly. This is the same blob, reachable on purpose rather than by
 * accident. It carries no personal data: a version, a seed, some counts.
 */
function Diagnostics() {
  const save = usePlayerStore((s) => s.save);
  const [copied, setCopied] = useState(false);
  if (!save) return null;

  const blob = () =>
    JSON.stringify(
      {
        app: 'TinyDecklings',
        saveVersion: save.saveVersion,
        runSeed: save.run.seed,
        currentStage: save.run.currentStage,
        cards: save.player.cards.length,
        gear: save.player.gear.length,
        stagesRecorded: Object.keys(save.player.stageRecords).length,
        settings: save.settings,
        userAgent: navigator.userAgent,
        viewport: `${window.innerWidth}x${window.innerHeight}`,
      },
      null,
      2,
    );

  return (
    <div className={styles.row}>
      <Button
        variant="info"
        onClick={() => {
          void navigator.clipboard?.writeText(blob()).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          });
        }}
      >
        {copied ? 'Copied' : 'Copy diagnostics'}
      </Button>
      <span className={styles.hint}>
        Version, seed and a few counts — no personal data, and nothing is sent anywhere. Paste it
        wherever you are reporting the problem.
      </span>
    </div>
  );
}

/**
 * A mix control (Q26).
 *
 * A native range input rather than a bespoke one: it is keyboard- and
 * screen-reader-native, and the thumb is easy to hit on a phone.
 */
function Slider({
  label,
  value,
  disabled,
  onChange,
}: {
  label: string;
  value: number;
  disabled?: boolean;
  onChange: (value: number) => void;
}) {
  return (
    <label className={styles.slider}>
      <input
        type="range"
        min={0}
        max={100}
        step={5}
        value={Math.round(value * 100)}
        disabled={disabled}
        aria-label={label}
        onChange={(e) => onChange(Number(e.target.value) / 100)}
      />
      <span className={styles.sliderValue}>{Math.round(value * 100)}%</span>
    </label>
  );
}

/**
 * Settings, in the reference's label-above-control layout.
 *
 * Nothing here talks to a server: there are no accounts, no sign-in and no social
 * links, because the game is single-player and fully offline (CLAUDE.md rule 11).
 */
export function SettingsScreen({ saves }: { saves: SaveService }) {
  const settings = useSettingsStore();
  const cards = usePlayerStore((s) => s.cards().length);
  const gear = usePlayerStore((s) => s.gear().length);

  return (
    <div className={styles.screen}>
      <TitleBanner title="Settings" />
      <div className={`${styles.body} u-scroll-y`}>
        <div className={styles.group}>
          <h2 className={styles.groupTitle}>Audio</h2>

          <div className={styles.row}>
            <span className={styles.label}>Sound effects</span>
            <Toggle value={settings.sfx} onChange={settings.setSfx} ariaLabel="Sound effects" />
            <Slider
              label="Effects volume"
              value={settings.sfxVolume}
              disabled={!settings.sfx}
              onChange={settings.setSfxVolume}
            />
          </div>

          <div className={styles.row}>
            <span className={styles.label}>Music</span>
            <Toggle value={settings.music} onChange={settings.setMusic} ariaLabel="Music" />
            <Slider
              label="Music volume"
              value={settings.musicVolume}
              disabled={!settings.music}
              onChange={settings.setMusicVolume}
            />
            <span className={styles.hint}>
              Everything you hear is placeholder sound, generated on the fly rather than shipped as
              files. Final audio drops in later without changing a thing here.
            </span>
          </div>
        </div>

        <div className={styles.group}>
          <h2 className={styles.groupTitle}>Battle</h2>

          <div className={styles.row}>
            <span className={styles.label}>Speed</span>
            <Toggle
              value={settings.battleSpeed === 1}
              onChange={(one) => settings.setBattleSpeed(one ? 1 : 2)}
              onLabel="×1"
              offLabel="×2"
              tone="choice"
              ariaLabel="Battle speed"
            />
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
              Calms battle effects and transitions. Your device's own reduced-motion setting is
              always respected too.
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
          <h2 className={styles.groupTitle}>Your save</h2>
          <BackupSection saves={saves} />
        </div>

        <div className={styles.group}>
          <h2 className={styles.groupTitle}>Report a problem</h2>
          <Diagnostics />
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
    </div>
  );
}
