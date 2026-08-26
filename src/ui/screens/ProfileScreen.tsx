import { useMemo, useState } from 'react';
import { CONTENT } from '@/content';
import type { CardRarity } from '@/content/schemas';
import { CARD_RARITIES } from '@/content/schemas';
import { createRng, deriveSeed } from '@/engine/rng';
import { rollReward, type RewardBundle } from '@/engine/economy/rewards';
import {
  achievementStates,
  claimableAchievements,
  earnedCount,
  groupAchievements,
  type AchievementState,
} from '@/engine/records/achievements';
import { profileRecord, STARS_PER_LEVEL, type ProfileRecord } from '@/engine/records/profile';
import { usePlayerStore } from '@/state/playerStore';
import { useRunStore } from '@/state/runStore';
import { cardRarityColor } from '@/ui/design/rarity';
import { Button, IconChip, Modal, Panel, StarRow, TitleBanner } from '@/ui/design/primitives';
import { RewardList } from '@/ui/components/RewardList';
import { PLACEHOLDER_AVATAR } from '@/ui/art/artManifest';
import styles from './ProfileScreen.module.css';

const GROUP_LABELS = {
  journey: 'The journey',
  collection: 'The collection',
  mastery: 'Mastery',
} as const;

function formatDate(ms: number): string {
  return new Date(ms).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * The player's record (Q23).
 *
 * Nearly everything here is *derived* from the save rather than tallied as the
 * player goes — stars, clears, the collection and the summon counters already know
 * what happened. Only losses are stored, because a loss leaves no other trace.
 */
export function ProfileScreen() {
  const save = usePlayerStore((s) => s.save);
  const [claimed, setClaimed] = useState<{ name: string; rewards: RewardBundle } | null>(null);
  const [renaming, setRenaming] = useState(false);

  const record = useMemo(() => (save ? profileRecord(CONTENT, save) : null), [save]);
  const achievements = useMemo(
    () =>
      record && save ? achievementStates(CONTENT, record, save.player.claimedAchievements) : [],
    [record, save],
  );

  if (!save || !record) return null;

  const groups = groupAchievements(achievements);
  const claimable = claimableAchievements(achievements);

  const claim = (state: AchievementState) => {
    const player = usePlayerStore.getState();
    const reward = state.def.reward;
    if (!reward || !player.claimAchievement(state.def.id)) return;

    // Derived from the run seed and the achievement, so the payout for a given
    // achievement is the same whenever it is taken.
    const seed = deriveSeed(useRunStore.getState().seed, `achievement:${state.def.id}`);
    const rewards = rollReward(CONTENT, reward, createRng(seed));
    player.applyRewards(rewards);
    setClaimed({ name: state.def.name, rewards });
  };

  return (
    <div className={`${styles.screen} u-scroll-y`}>
      <TitleBanner title="Profile" />

      <Panel className={styles.identity}>
        <img className={styles.avatar} src={PLACEHOLDER_AVATAR} alt="" />
        <div className={styles.identityText}>
          <button type="button" className={styles.name} onClick={() => setRenaming(true)}>
            {record.name}
            <IconChip name="ui.settings" size={16} />
          </button>
          <span className={styles.levelRow}>
            <span className={styles.level}>Level {record.level}</span>
            <span className={styles.muted}>
              {record.starsIntoLevel}/{STARS_PER_LEVEL} stars to the next
            </span>
          </span>
          <div className={styles.levelBar} aria-hidden="true">
            <span style={{ width: `${(record.starsIntoLevel / STARS_PER_LEVEL) * 100}%` }} />
          </div>
          <span className={styles.muted}>
            Walking the road since {formatDate(record.createdAtMs)}
          </span>
        </div>
      </Panel>

      <Journey record={record} />
      <Collection record={record} />

      <section className={styles.group}>
        <h2 className={styles.groupTitle}>
          Achievements
          <span className={styles.groupCount}>
            {earnedCount(achievements)}/{achievements.length}
          </span>
        </h2>
        {claimable.length > 0 ? (
          <p className={styles.claimHint}>
            {claimable.length} reward{claimable.length === 1 ? '' : 's'} waiting to be taken.
          </p>
        ) : null}

        {groups.map(({ group, states }) => (
          <div key={group} className={styles.achievementGroup}>
            <h3 className={styles.subTitle}>{GROUP_LABELS[group]}</h3>
            {states.map((state) => (
              <AchievementRow key={state.def.id} state={state} onClaim={() => claim(state)} />
            ))}
          </div>
        ))}
      </section>

      <p className={styles.footnote}>
        Everything above is read from your save as it stands. There are no accounts and no
        leaderboards — this record is yours, on this device.
      </p>

      {renaming ? <RenameSheet current={record.name} onClose={() => setRenaming(false)} /> : null}

      {claimed ? (
        <Modal title={claimed.name} onClose={() => setClaimed(null)} placement="centered">
          <div className={styles.claimSheet}>
            <IconChip name="award.trophy" size={44} background="var(--accent-warning)" />
            <RewardList rewards={claimed.rewards} />
            <Button variant="positive" block onClick={() => setClaimed(null)}>
              Nice
            </Button>
          </div>
        </Modal>
      ) : null}
    </div>
  );
}

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className={styles.stat}>
      <span className={styles.statValue}>{value}</span>
      <span className={styles.statLabel}>{label}</span>
      {hint ? <span className={styles.statHint}>{hint}</span> : null}
    </div>
  );
}

function Journey({ record }: { record: ProfileRecord }) {
  const j = record.journey;
  const fights = j.battlesWon + j.battlesLost;
  const winRate = fights === 0 ? null : Math.round((j.battlesWon / fights) * 100);

  return (
    <section className={styles.group}>
      <h2 className={styles.groupTitle}>The journey</h2>
      <div className={styles.statGrid}>
        <Stat label="Furthest stage" value={String(j.furthestStage)} />
        <Stat label="Stages cleared" value={String(j.stagesCleared)} />
        <Stat
          label="Stars earned"
          value={String(j.totalStars)}
          hint={`${j.flawlessClears} flawless`}
        />
        <Stat
          label="Regions cleared"
          value={`${j.regionsCleared}/${j.regionsAuthored}`}
          hint={
            j.loopsCompleted > 0
              ? `${j.loopsCompleted} lap${j.loopsCompleted === 1 ? '' : 's'}`
              : undefined
          }
        />
        <Stat
          label="Battles won"
          value={String(j.battlesWon)}
          hint={winRate === null ? 'No fights yet' : `${winRate}% of ${fights}`}
        />
        <Stat label="Battles lost" value={String(j.battlesLost)} />
        <Stat label="Vignettes" value={String(j.vignettesResolved)} />
        <Stat label="Chests opened" value={`${j.chestsOpened}/${j.chestsAuthored}`} />
        <Stat label="Risky roads" value={String(j.riskyForksWalked)} />
      </div>
    </section>
  );
}

function Collection({ record }: { record: ProfileRecord }) {
  const c = record.collection;
  return (
    <section className={styles.group}>
      <h2 className={styles.groupTitle}>The collection</h2>

      <Panel tone="slot">
        <div className={styles.collectionHead}>
          <span className={styles.collectionCount}>
            {c.distinct}/{c.collectible}
          </span>
          <span className={styles.muted}>different cards owned</span>
        </div>
        <div className={styles.levelBar} aria-hidden="true">
          <span style={{ width: `${(c.distinct / Math.max(1, c.collectible)) * 100}%` }} />
        </div>
        <div className={styles.rarityRow}>
          {CARD_RARITIES.map((rarity: CardRarity) => (
            <span
              key={rarity}
              className={styles.rarityChip}
              style={{ borderColor: cardRarityColor(rarity) }}
              title={rarity}
            >
              <span className={styles.rarityDot} style={{ background: cardRarityColor(rarity) }} />
              {c.byRarity[rarity]}
            </span>
          ))}
        </div>
      </Panel>

      <div className={styles.statGrid}>
        <Stat label="Copies held" value={String(c.copies)} />
        <Stat label="Heroes" value={String(c.heroes)} />
        <Stat label="Six-star cards" value={String(c.sixStar)} />
        <Stat label="Highest level" value={String(c.highestLevel)} />
        <Stat label="Gear held" value={String(c.gearOwned)} />
        <Stat label="Fully geared" value={String(c.fullyGeared)} hint="every slot filled" />
        <Stat label="Summons made" value={String(record.summonsMade)} />
      </div>
    </section>
  );
}

function AchievementRow({ state, onClaim }: { state: AchievementState; onClaim: () => void }) {
  const { def, earned, claimed, progress, target, ratio } = state;
  const claimable = earned && !claimed && def.reward !== undefined;

  return (
    <div className={[styles.achievement, earned ? styles.earned : ''].filter(Boolean).join(' ')}>
      <IconChip
        name={earned ? def.iconKey : 'ui.lock'}
        size={34}
        shape="square"
        background={earned ? 'var(--accent-warning)' : undefined}
      />
      <div className={styles.achievementText}>
        <span className={styles.achievementName}>{def.name}</span>
        <span className={styles.achievementDesc}>{def.description}</span>
        {earned ? null : (
          <>
            <div className={styles.progressBar} aria-hidden="true">
              <span style={{ width: `${ratio * 100}%` }} />
            </div>
            <span className={styles.achievementDesc}>
              {Math.min(progress, target)} / {target}
            </span>
          </>
        )}
      </div>
      {claimable ? (
        <Button variant="warning" onClick={onClaim}>
          Claim
        </Button>
      ) : earned ? (
        <StarRow value={1} max={1} size={18} />
      ) : null}
    </div>
  );
}

function RenameSheet({ current, onClose }: { current: string; onClose: () => void }) {
  const [value, setValue] = useState(current);
  const trimmed = value.trim();

  return (
    <Modal title="Your name" onClose={onClose} placement="centered">
      <div className={styles.renameSheet}>
        <input
          className={styles.input}
          value={value}
          maxLength={24}
          autoFocus
          aria-label="Commander name"
          onChange={(e) => setValue(e.target.value)}
        />
        <span className={styles.muted}>Up to 24 characters. Stored on this device only.</span>
        <Button
          variant="positive"
          block
          disabled={trimmed.length === 0}
          onClick={() => {
            usePlayerStore.getState().setName(trimmed);
            onClose();
          }}
        >
          Save
        </Button>
      </div>
    </Modal>
  );
}
