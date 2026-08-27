import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { CONTENT, ENERGY_CONFIG } from '@/content';
import type { ElementId, ForkBranch, GeneratedStage } from '@/content/schemas';
import {
  countersElement,
  ELEMENT_AFFINITY_PERCENT,
  elementIconKey,
  stageKindIconKey,
  statusIconKey,
} from '@/content/schemas';
import { regionForStage } from '@/engine/map/generate';
import { chestKey, claimableChests, regionProgressForStage } from '@/engine/map/chests';
import { rollLoot, type RewardBundle } from '@/engine/economy/rewards';
import { createRng, deriveSeed } from '@/engine/rng';
import { formatDuration } from '@/engine/economy/energy';
import { useDeckStore } from '@/state/deckStore';
import { useEconomyStore } from '@/state/economyStore';
import { usePlayerStore } from '@/state/playerStore';
import { useRunStore } from '@/state/runStore';
import { useScreenStore } from '@/state/screenStore';
import { PLACEHOLDER_AVATAR, mapWallpaper } from '@/ui/art/artManifest';
import { Button, IconChip, Modal, Panel, StarRow } from '@/ui/design/primitives';
import { RewardList } from '@/ui/components/RewardList';
import { useSfx } from '@/ui/audio/audioContext';
import { elementLabel, stageKindLabel } from '@/ui/text/labels';
import { EncounterSheet } from './EncounterSheet';
import styles from './MapScreen.module.css';

/** One entry in the road: a single stage, or the two roads out of a fork (Q2). */
type Row =
  | { kind: 'stage'; stage: GeneratedStage }
  | { kind: 'fork'; start: number; stages: Record<ForkBranch, GeneratedStage[]> };

/**
 * The map: a linear, numbered chain of stage medallions climbing the screen (Q2),
 * with the occasional 2-way fork that rejoins a few stages later.
 *
 * A stage is playable once the one before it has been cleared; beaten stages stay
 * open for farming (Q17).
 */
export function MapScreen() {
  const window_ = useRunStore((s) => s.window);
  const currentStage = useRunStore((s) => s.currentStage);
  const branches = useRunStore((s) => s.branches);
  const save = usePlayerStore((s) => s.save);
  const bestStars = usePlayerStore((s) => s.bestStars);
  const push = useScreenStore((s) => s.push);
  const [selected, setSelected] = useState<GeneratedStage | null>(null);
  const [chestOpen, setChestOpen] = useState(false);
  const currentRef = useRef<HTMLButtonElement>(null);

  const region = useMemo(() => regionForStage(CONTENT, currentStage), [currentStage]);
  const wallpaper = mapWallpaper(region.themeToken);

  const progress = useMemo(
    () =>
      regionProgressForStage(
        CONTENT,
        currentStage,
        save?.player.stageRecords ?? {},
        branches,
        save?.player.claimedChests ?? [],
      ),
    [currentStage, save, branches],
  );

  // Drop the player at their position rather than at the top of the road.
  useEffect(() => {
    currentRef.current?.scrollIntoView({ block: 'center' });
  }, [currentStage]);

  const highestCleared = useMemo(() => {
    const records = save?.player.stageRecords ?? {};
    return Object.entries(records).reduce(
      (max, [stage, record]) => (record.bestStars > 0 ? Math.max(max, Number(stage)) : max),
      0,
    );
  }, [save]);

  /** Fork stages collapse into one row showing both roads. */
  const rows = useMemo<Row[]>(() => {
    const run = useRunStore.getState();
    const out: Row[] = [];
    const seenForks = new Set<number>();
    for (const stage of window_) {
      if (stage.forkOf === undefined) {
        out.push({ kind: 'stage', stage });
        continue;
      }
      if (seenForks.has(stage.forkOf)) continue;
      seenForks.add(stage.forkOf);
      out.push({ kind: 'fork', start: stage.forkOf, stages: run.forkOptions(stage.forkOf) });
    }
    return out;
  }, [window_]);

  const isUnlocked = (stage: GeneratedStage) => stage.number <= highestCleared + 1;
  const openStage = (stage: GeneratedStage) => setSelected(stage);
  const claimable = progress ? claimableChests(progress) : [];

  return (
    <div
      className={[styles.screen, wallpaper ? styles.wallpapered : ''].filter(Boolean).join(' ')}
      data-theme={region.themeToken}
      // The URL is per-region and hashed at build time, so it has to reach CSS as a
      // custom property; the styling itself stays in the stylesheet.
      style={wallpaper ? ({ '--wallpaper': `url("${wallpaper}")` } as CSSProperties) : undefined}
    >
      <div className={styles.header}>
        <div className={styles.headerText}>
          <span className={styles.regionName}>{region.name}</span>
          <span className={styles.tagline}>{region.tagline}</span>
        </div>
        <div className={styles.headerRight}>
          <span className={styles.muted}>Stage {currentStage}</span>
          {progress ? (
            <button
              type="button"
              className={styles.chestButton}
              onClick={() => setChestOpen(true)}
              aria-label={`Region chests, ${progress.stars} of ${progress.maxStars} stars`}
            >
              <IconChip
                name={claimable.length > 0 ? 'map.chest' : 'map.chestLocked'}
                size={22}
                background={claimable.length > 0 ? 'var(--accent-warning)' : undefined}
              />
              <span className={styles.chestCount}>
                {progress.stars}/{progress.maxStars}
              </span>
            </button>
          ) : null}
        </div>
      </div>

      <div className={`${styles.scroll} u-scroll-y`}>
        {/*
          Rendered in ascending order into a `column-reverse` list, which is what
          puts stage 1 at the bottom and the road climbing away above it. Reversing
          here as well would cancel that out and have the player walking *down* the
          screen as they progress.
        */}
        {rows.map((row) =>
          row.kind === 'stage' ? (
            <div key={`s${row.stage.number}`}>
              <Trail />
              <StageNode
                stage={row.stage}
                stars={bestStars(row.stage.number)}
                unlocked={isUnlocked(row.stage)}
                isCurrent={row.stage.number === highestCleared + 1}
                nodeRef={row.stage.number === highestCleared + 1 ? currentRef : undefined}
                onOpen={() => openStage(row.stage)}
              />
            </div>
          ) : (
            <div key={`f${row.start}`}>
              <Trail />
              <ForkBlock
                start={row.start}
                options={row.stages}
                chosen={branches[String(row.start)] ?? 'a'}
                highestCleared={highestCleared}
                onOpen={openStage}
              />
            </div>
          ),
        )}
      </div>

      {selected ? (
        selected.kind === 'event' || selected.kind === 'treasure' || selected.kind === 'camp' ? (
          <EncounterSheet stage={selected} onClose={() => setSelected(null)} />
        ) : (
          <StageSheet
            stage={selected}
            stars={bestStars(selected.number)}
            onClose={() => setSelected(null)}
            onFight={() => {
              // Energy is spent on entry, not on victory: a lost fight still costs
              // the attempt (Q14b).
              if (!useEconomyStore.getState().spendForStage(selected.kind)) return;
              setSelected(null);
              push({ kind: 'battle', stage: selected.number });
            }}
          />
        )
      ) : null}

      {chestOpen && progress ? (
        <ChestSheet regionId={progress.region.id} onClose={() => setChestOpen(false)} />
      ) : null}
    </div>
  );
}

function Trail() {
  return (
    <div className={styles.trail} aria-hidden="true">
      {Array.from({ length: 4 }, (_, i) => (
        <span key={i} className={styles.dot} />
      ))}
    </div>
  );
}

function StageNode({
  stage,
  stars,
  unlocked,
  isCurrent,
  nodeRef,
  onOpen,
  compact,
}: {
  stage: GeneratedStage;
  stars: 0 | 1 | 2 | 3;
  unlocked: boolean;
  isCurrent: boolean;
  nodeRef?: React.RefObject<HTMLButtonElement | null>;
  onOpen: () => void;
  compact?: boolean;
}) {
  const twisted = stage.modifiers.length > 0;
  return (
    <div className={compact ? styles.compactNode : styles.node}>
      <button
        type="button"
        ref={nodeRef}
        className={[
          styles.medallion,
          compact ? styles.medallionSmall : '',
          stars > 0 ? styles.cleared : '',
          isCurrent ? styles.current : '',
          stage.kind === 'boss' ? styles.boss : '',
          stage.kind === 'elite' ? styles.elite : '',
          unlocked ? '' : styles.locked,
        ]
          .filter(Boolean)
          .join(' ')}
        disabled={!unlocked}
        onClick={onOpen}
        data-coach={isCurrent ? 'stage-current' : undefined}
        aria-label={`Stage ${stage.number}, ${stage.name}, ${stageKindLabel(stage.kind)}, ${stars} of 3 stars${unlocked ? '' : ', locked'}`}
      >
        <img className={styles.medallionArt} src={PLACEHOLDER_AVATAR} alt="" />
        {stage.elementBias ? (
          <span className={styles.elementBadge}>
            <IconChip name={elementIconKey(stage.elementBias)} size={compact ? 16 : 20} />
          </span>
        ) : null}
      </button>

      <span className={styles.plate}>
        <span className={styles.namePill}>
          <IconChip
            name={stageKindIconKey(stage.kind)}
            size={18}
            background={
              stage.kind === 'boss'
                ? 'var(--accent-warning)'
                : stage.kind === 'elite'
                  ? 'var(--accent-danger)'
                  : undefined
            }
          />
          <span className={stage.kind === 'boss' ? styles.bossTag : undefined}>
            {stage.number}. {stage.name}
          </span>
        </span>
        <span className={styles.plateRow}>
          <StarRow value={stars} max={3} size={13} />
          {twisted ? (
            <span className={styles.twistTag}>
              {stage.modifiers.map((id) => {
                const def = CONTENT.stageModifiers.get(id);
                return def ? (
                  <IconChip key={id} name={def.iconKey} size={16} title={def.name} />
                ) : null;
              })}
              <span className={styles.bonus}>+{stage.rewardBonusPercent}%</span>
            </span>
          ) : null}
        </span>
      </span>
    </div>
  );
}

/**
 * The road splits (Q2).
 *
 * Both sides sit over the same stage numbers and rejoin afterwards. The choice is
 * changeable right up until the player actually walks it — once a fork stage is
 * cleared, the road you took is the road you took.
 */
function ForkBlock({
  start,
  options,
  chosen,
  highestCleared,
  onOpen,
}: {
  start: number;
  options: Record<ForkBranch, GeneratedStage[]>;
  chosen: ForkBranch;
  highestCleared: number;
  onOpen: (stage: GeneratedStage) => void;
}) {
  const chooseBranch = useRunStore((s) => s.chooseBranch);
  const bestStars = usePlayerStore((s) => s.bestStars);
  const length = options.a.length;
  const locked = Array.from({ length }, (_, i) => start + i).some((n) => bestStars(n) > 0);

  // The headline is what taking this road is worth per stage, not the sum across
  // it — the medallions below already carry their own numbers.
  const region = CONTENT.regions.get(options.a[0]?.regionId ?? '');
  const bonusOf = (branch: ForkBranch) =>
    branch === 'b' ? (region?.fork?.riskyRewardBonusPercent ?? 0) : 0;

  return (
    <Panel tone="raised" className={styles.fork}>
      <div className={styles.forkHead}>
        <IconChip name="map.fork" size={22} />
        <span className={styles.forkTitle}>The road splits</span>
        <span className={styles.muted}>
          {locked ? 'Road taken' : `Rejoins at ${start + length}`}
        </span>
      </div>

      <div className={styles.forkColumns}>
        {(['a', 'b'] as const).map((branch) => {
          const isChosen = branch === chosen;
          const bonus = bonusOf(branch);
          return (
            <div
              key={branch}
              className={[styles.forkColumn, isChosen ? styles.forkChosen : styles.forkDim]
                .filter(Boolean)
                .join(' ')}
            >
              <div className={styles.forkLabel}>
                <span>{branch === 'a' ? 'The road' : 'The detour'}</span>
                {bonus > 0 ? <span className={styles.bonus}>+{bonus}%</span> : null}
              </div>

              {options[branch].map((stage) => (
                <StageNode
                  key={stage.number}
                  stage={stage}
                  stars={bestStars(stage.number)}
                  unlocked={isChosen && stage.number <= highestCleared + 1}
                  isCurrent={isChosen && stage.number === highestCleared + 1}
                  onOpen={() => onOpen(stage)}
                  compact
                />
              ))}

              {isChosen ? (
                <span className={styles.forkTaken}>Chosen</span>
              ) : (
                <Button
                  variant="info"
                  block
                  disabled={locked}
                  onClick={() => chooseBranch(start, branch)}
                >
                  {locked ? 'Closed' : 'Take this road'}
                </Button>
              )}
            </div>
          );
        })}
      </div>
    </Panel>
  );
}

/** Which of the player's lineup counter the stage's element (Q21). */
function useCounterCount(element: ElementId | undefined): number {
  const save = usePlayerStore((s) => s.save);
  return useMemo(() => {
    if (!element || !save) return 0;
    const lineup = useDeckStore.getState().lineup();
    const uids = lineup.length > 0 ? lineup : save.player.cards.map((c) => c.uid);
    return uids.filter((uid) => {
      const owned = save.player.cards.find((c) => c.uid === uid);
      const def = owned ? CONTENT.cards.get(owned.defId) : undefined;
      return countersElement(def?.element, element);
    }).length;
  }, [element, save]);
}

function StageSheet({
  stage,
  stars,
  onClose,
  onFight,
}: {
  stage: GeneratedStage;
  stars: 0 | 1 | 2 | 3;
  onClose: () => void;
  onFight: () => void;
}) {
  const group = CONTENT.enemies.get(stage.encounterRef);
  const deckSize = usePlayerStore((s) => s.cards().length);
  const save = usePlayerStore((s) => s.save);
  const boon = useRunStore((s) => s.pendingBoon);
  const counters = useCounterCount(stage.elementBias);
  const economy = useEconomyStore.getState();
  void save; // re-read energy whenever the save changes

  const cost = ENERGY_CONFIG.costs[stage.kind] ?? 0;
  const energy = economy.energy();
  const affordable = economy.canEnterStage(stage.kind);

  return (
    <Modal title={`${stage.number}. ${stage.name}`} onClose={onClose}>
      <div className={styles.sheet}>
        <div className={styles.sheetRow}>
          <span className={styles.sheetKind}>
            <IconChip name={stageKindIconKey(stage.kind)} size={20} />
            {stageKindLabel(stage.kind)}
          </span>
          <StarRow value={stars} max={3} size={16} />
        </div>

        <div className={styles.sheetRow}>
          <span className={styles.muted}>{group?.name ?? 'Unknown foes'}</span>
          <span className={styles.muted}>{group ? `${group.members.length} enemies` : ''}</span>
        </div>

        {stage.elementBias ? (
          <Panel tone="slot">
            <div className={styles.elementRow}>
              <IconChip name={elementIconKey(stage.elementBias)} size={26} />
              <span className="u-prose">
                {elementLabel(stage.elementBias)} ground. Cards that counter it attack{' '}
                {ELEMENT_AFFINITY_PERCENT}% harder —{' '}
                {counters > 0
                  ? `${counters} in your deck ${counters === 1 ? 'does' : 'do'}.`
                  : 'none of your deck does.'}
              </span>
            </div>
          </Panel>
        ) : null}

        {stage.modifiers.length > 0 ? (
          <Panel tone="slot">
            <div className={styles.modifierList}>
              {stage.modifiers.map((id) => {
                const def = CONTENT.stageModifiers.get(id);
                if (!def) return null;
                return (
                  <div key={id} className={styles.modifierRow}>
                    <IconChip name={def.iconKey} size={26} background="var(--accent-danger)" />
                    <span className={styles.modifierName}>{def.name}</span>
                    <span className={styles.modifierText}>{def.description}</span>
                  </div>
                );
              })}
              <div className={styles.modifierBonus}>
                <span className={styles.muted}>Extra loot for the risk</span>
                <span className={styles.bonus}>+{stage.rewardBonusPercent}%</span>
              </div>
            </div>
          </Panel>
        ) : null}

        {boon ? (
          <div className={styles.sheetRow}>
            <span className={styles.sheetKind}>
              <IconChip name={statusIconKey(boon.status)} size={20} />
              Carried in
            </span>
            <span className={styles.muted}>
              {boon.side === 'player' ? 'Your cards' : 'The enemy'} start with {boon.status}.
            </span>
          </div>
        ) : null}

        <p className={styles.muted}>
          {stage.kind === 'boss'
            ? 'A boss holds this stage. Bring your strongest cards — the payout matches the risk.'
            : stage.kind === 'elite'
              ? 'An elite band, and they have brought something with them. Clear them all to win.'
              : 'Clear every enemy to win. Lose no cards at all for three stars.'}
        </p>

        {cost > 0 ? (
          <div className={styles.sheetRow}>
            <span className={styles.muted}>Costs</span>
            <span className={styles.costPill}>
              <IconChip name="currency.energy" size={20} background="var(--accent-info)" />
              {cost}
            </span>
          </div>
        ) : null}

        {deckSize === 0 ? (
          <Panel tone="raised">
            <p className={styles.muted}>
              You have no cards to send. Summon or win one first — the Cards tab shows everything
              you own.
            </p>
          </Panel>
        ) : null}

        {!affordable && cost > 0 ? (
          <Panel tone="raised">
            <p className={styles.muted}>
              Not enough energy — you have {energy.current} of {cost}.{' '}
              {energy.msToNext !== null
                ? `The next point arrives in ${formatDuration(energy.msToNext)}.`
                : ''}{' '}
              Energy refills on its own, or you can trade gems for a flask in the shop.
            </p>
          </Panel>
        ) : null}

        <Button variant="positive" block onClick={onFight} disabled={deckSize === 0 || !affordable}>
          {!affordable ? 'Not enough energy' : stars > 0 ? 'Fight again' : 'Fight'}
        </Button>
      </div>
    </Modal>
  );
}

/**
 * Region star chests: what the region pays for clearing it well (Phase 4).
 *
 * A first-lap reward — the endless loops replay the fights, not the chests.
 */
function ChestSheet({ regionId, onClose }: { regionId: string; onClose: () => void }) {
  const sfx = useSfx();
  const save = usePlayerStore((s) => s.save);
  const branches = useRunStore((s) => s.branches);
  const seed = useRunStore((s) => s.seed);
  const [opened, setOpened] = useState<{ key: string; rewards: RewardBundle } | null>(null);

  const region = CONTENT.regions.get(regionId);
  const progress = useMemo(() => {
    if (!region) return null;
    const start = [...CONTENT.regions.values()]
      .slice(
        0,
        [...CONTENT.regions.values()].findIndex((r) => r.id === regionId),
      )
      .reduce((sum, r) => sum + r.stageCount, 1);
    return regionProgressForStage(
      CONTENT,
      start,
      save?.player.stageRecords ?? {},
      branches,
      save?.player.claimedChests ?? [],
    );
  }, [region, regionId, save, branches]);

  if (!region || !progress) return null;

  const open = (threshold: number) => {
    const player = usePlayerStore.getState();
    const key = chestKey(region.id, threshold);
    const table = region.chestLootTable ? CONTENT.lootTables.get(region.chestLootTable) : undefined;
    if (!table || !player.claimChest(key)) return;
    const rewards = rollLoot(CONTENT, table, createRng(deriveSeed(seed, `chest:${key}`)));
    player.applyRewards(rewards);
    sfx('reward.chest');
    setOpened({ key, rewards });
  };

  return (
    <Modal title={`${region.name} chests`} onClose={onClose}>
      <div className={styles.sheet}>
        <p className="u-prose">
          Every star earned in {region.name} counts toward these. You have {progress.stars} of{' '}
          {progress.maxStars}.
        </p>

        {opened ? <RewardList rewards={opened.rewards} /> : null}

        <div className={styles.chestList}>
          {progress.chests.map((chest) => (
            <div key={chest.key} className={styles.chestRow}>
              <IconChip
                name={chest.claimed || chest.unlocked ? 'map.chest' : 'map.chestLocked'}
                size={30}
                background={chest.unlocked && !chest.claimed ? 'var(--accent-warning)' : undefined}
              />
              <span className={styles.chestLabel}>{chest.threshold} stars</span>
              {chest.claimed ? (
                <span className={styles.muted}>Opened</span>
              ) : (
                <Button
                  variant="warning"
                  disabled={!chest.unlocked}
                  onClick={() => open(chest.threshold)}
                >
                  {chest.unlocked ? 'Open' : `${progress.stars}/${chest.threshold}`}
                </Button>
              )}
            </div>
          ))}
        </div>

        <Button variant="neutral" block onClick={onClose}>
          Close
        </Button>
      </div>
    </Modal>
  );
}
