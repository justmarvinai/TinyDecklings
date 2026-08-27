import { useMemo, useState } from 'react';
import { CONTENT } from '@/content';
import { achievementStates, claimableAchievements } from '@/engine/records/achievements';
import { commanderLevel, profileRecord, totalStarsOf } from '@/engine/records/profile';
import { usePlayerStore } from '@/state/playerStore';
import { useScreenStore, type Screen } from '@/state/screenStore';
import { IconChip, Panel, TitleBanner } from '@/ui/design/primitives';
import { LockedFeatureSheet } from '@/ui/components/LockedFeatureSheet';
import { PLACEHOLDER_AVATAR } from '@/ui/art/artManifest';
import { DEFERRED_FEATURES, type DeferredFeatureId } from '@/ui/text/deferred';
import styles from './MoreScreen.module.css';

const DEFERRED_HERE: readonly DeferredFeatureId[] = ['events', 'seasonPass', 'records'];

/**
 * The More tab: everything that is not the loop.
 *
 * Profile and Settings are the only meta screens in the first release (Q23). The
 * systems that were deliberately cut are listed underneath, visible but locked,
 * because a player who saw them in a screenshot deserves an answer rather than a
 * missing row.
 */
export function MoreScreen() {
  const save = usePlayerStore((s) => s.save);
  const push = useScreenStore((s) => s.push);
  const [locked, setLocked] = useState<DeferredFeatureId | null>(null);

  const waiting = useMemo(() => {
    if (!save) return 0;
    const record = profileRecord(CONTENT, save);
    return claimableAchievements(
      achievementStates(CONTENT, record, save.player.claimedAchievements),
    ).length;
  }, [save]);

  if (!save) return null;

  const open = (screen: Screen) => push(screen);

  return (
    <div className={`${styles.screen} u-scroll-y`}>
      <TitleBanner title="More" />

      {/* Informational: the rows below are the navigation, so this stays a panel
          rather than a second tappable target for the same screen. */}
      <Panel className={styles.identity}>
        <img className={styles.avatar} src={PLACEHOLDER_AVATAR} alt="" />
        <div className={styles.identityText}>
          <span className={styles.name}>{save.player.profile.name}</span>
          <span className={styles.muted}>
            Level {commanderLevel(totalStarsOf(save))} · {totalStarsOf(save)} stars earned
          </span>
        </div>
        <IconChip name="profile.player" size={34} shape="square" />
      </Panel>

      <div className={styles.rows}>
        <Row
          icon="record.progress"
          label="Profile"
          hint="Your record, and what you have earned"
          badge={waiting > 0 ? waiting : undefined}
          onClick={() => open({ kind: 'profile' })}
        />
        <Row
          icon="ui.settings"
          label="Settings"
          hint="Audio, battle speed, motion and language"
          onClick={() => open({ kind: 'settings' })}
        />
      </div>

      <section className={styles.group}>
        <h2 className={styles.groupTitle}>Not in this release</h2>
        <p className={styles.muted}>
          These were cut on purpose. Tap one to see what it would have been.
        </p>
        <div className={styles.rows}>
          {DEFERRED_HERE.map((id) => (
            <Row
              key={id}
              icon={DEFERRED_FEATURES[id].icon}
              label={DEFERRED_FEATURES[id].name}
              hint={DEFERRED_FEATURES[id].blurb}
              locked
              onClick={() => setLocked(id)}
            />
          ))}
        </div>
      </section>

      <p className={styles.footnote}>
        TinyDecklings is single-player and offline. Your progress lives on this device, there are no
        accounts, and nothing here costs real money.
      </p>

      {locked ? <LockedFeatureSheet feature={locked} onClose={() => setLocked(null)} /> : null}
    </div>
  );
}

function Row({
  icon,
  label,
  hint,
  badge,
  locked,
  onClick,
}: {
  icon: Parameters<typeof IconChip>[0]['name'];
  label: string;
  hint: string;
  badge?: number;
  locked?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className={[styles.row, locked ? styles.rowLocked : ''].filter(Boolean).join(' ')}
      onClick={onClick}
    >
      <IconChip name={locked ? 'ui.lock' : icon} size={30} shape="square" />
      <span className={styles.rowText}>
        <span className={styles.rowLabel}>{label}</span>
        <span className={styles.rowHint}>{hint}</span>
      </span>
      {badge ? <span className={styles.badge}>{badge}</span> : null}
    </button>
  );
}
