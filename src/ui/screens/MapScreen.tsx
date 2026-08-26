import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { CONTENT, ENERGY_CONFIG } from '@/content';
import type { GeneratedStage } from '@/content/schemas';
import { regionForStage } from '@/engine/map/generate';
import { useEconomyStore } from '@/state/economyStore';
import { usePlayerStore } from '@/state/playerStore';
import { useRunStore } from '@/state/runStore';
import { useScreenStore } from '@/state/screenStore';
import { PLACEHOLDER_AVATAR } from '@/ui/art/artManifest';
import { formatDuration } from '@/engine/economy/energy';
import { Button, IconChip, Modal, Panel, StarRow } from '@/ui/design/primitives';
import styles from './MapScreen.module.css';

const STAGE_KIND_ICON = {
  battle: 'stage.battle',
  elite: 'stage.elite',
  boss: 'stage.boss',
  event: 'stage.event',
  treasure: 'stage.treasure',
  camp: 'stage.camp',
} as const;

/**
 * The map: a linear, numbered chain of stage medallions climbing the screen (Q2).
 *
 * A stage is playable once the one before it has been cleared; beaten stages stay
 * open for farming (Q17).
 */
export function MapScreen() {
  const window_ = useRunStore((s) => s.window);
  const currentStage = useRunStore((s) => s.currentStage);
  const bestStars = usePlayerStore((s) => s.bestStars);
  const save = usePlayerStore((s) => s.save);
  const push = useScreenStore((s) => s.push);
  const [selected, setSelected] = useState<GeneratedStage | null>(null);
  const currentRef = useRef<HTMLButtonElement>(null);

  const region = useMemo(() => regionForStage(CONTENT, currentStage), [currentStage]);

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

  const isUnlocked = (stage: GeneratedStage) => stage.number <= highestCleared + 1;

  return (
    <div className={styles.screen}>
      <div className={styles.header}>
        <span className={styles.regionName}>{region.name}</span>
        <span className={styles.muted}>Stage {currentStage}</span>
      </div>

      <div className={`${styles.scroll} u-scroll-y`}>
        {[...window_].reverse().map((stage) => {
          const stars = bestStars(stage.number);
          const unlocked = isUnlocked(stage);
          const isCurrent = stage.number === highestCleared + 1;

          return (
            <div key={stage.number}>
              <div className={styles.trail} aria-hidden="true">
                {Array.from({ length: 4 }, (_, i) => (
                  <span key={i} className={styles.dot} />
                ))}
              </div>

              <div className={styles.node}>
                <button
                  type="button"
                  ref={isCurrent ? currentRef : undefined}
                  className={[
                    styles.medallion,
                    stars > 0 ? styles.cleared : '',
                    isCurrent ? styles.current : '',
                    stage.kind === 'boss' ? styles.boss : '',
                    unlocked ? '' : styles.locked,
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  disabled={!unlocked}
                  onClick={() => setSelected(stage)}
                  aria-label={`Stage ${stage.number}, ${stage.name}, ${stars} of 3 stars${unlocked ? '' : ', locked'}`}
                >
                  <img className={styles.medallionArt} src={PLACEHOLDER_AVATAR} alt="" />
                </button>

                <span className={styles.plate}>
                  <span className={styles.namePill}>
                    <IconChip
                      name={STAGE_KIND_ICON[stage.kind]}
                      size={18}
                      background={stage.kind === 'boss' ? 'var(--accent-warning)' : undefined}
                    />
                    <span className={stage.kind === 'boss' ? styles.bossTag : undefined}>
                      {stage.number}. {stage.name}
                    </span>
                  </span>
                  <StarRow value={stars} max={3} size={13} />
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {selected ? (
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
      ) : null}
    </div>
  );
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
  const economy = useEconomyStore.getState();
  void save; // re-read energy whenever the save changes

  const cost = ENERGY_CONFIG.costs[stage.kind] ?? 0;
  const energy = economy.energy();
  const affordable = economy.canEnterStage(stage.kind);

  return (
    <Modal title={`${stage.number}. ${stage.name}`} onClose={onClose}>
      <div className={styles.sheet}>
        <div className={styles.sheetRow}>
          <span className={styles.muted}>{group?.name ?? 'Unknown foes'}</span>
          <StarRow value={stars} max={3} size={16} />
        </div>

        {group ? (
          <div className={styles.enemyRow}>
            {group.members.slice(0, 3).map((member, i) => {
              const def = CONTENT.cards.get(member.cardId);
              return (
                <div key={i} style={{ textAlign: 'center' } as CSSProperties}>
                  <span className={styles.muted}>{def?.name ?? member.cardId}</span>
                </div>
              );
            })}
          </div>
        ) : null}

        <p className={styles.muted}>
          {stage.kind === 'boss'
            ? 'A boss holds this stage. Bring your strongest cards — the payout matches the risk.'
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
