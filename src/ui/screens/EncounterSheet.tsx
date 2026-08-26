import { useMemo, useState } from 'react';
import { CONTENT } from '@/content';
import type { CurrencyId, GeneratedStage, ModifierSide, StatusId } from '@/content/schemas';
import { currencyIconKey, stageKindIconKey, statusIconKey } from '@/content/schemas';
import { createRng, deriveSeed } from '@/engine/rng';
import {
  choiceStates,
  resolveChoice,
  type ChoiceBlock,
  type EncounterContext,
} from '@/engine/map/encounters';
import type { RewardBundle } from '@/engine/economy/rewards';
import { usePlayerStore } from '@/state/playerStore';
import { useRunStore } from '@/state/runStore';
import { Button, IconChip, Modal, Panel } from '@/ui/design/primitives';
import { RewardList } from '@/ui/components/RewardList';
import { currencyLabel, stageKindLabel } from '@/ui/text/labels';
import styles from './EncounterSheet.module.css';

function blockedText(block: ChoiceBlock): string {
  switch (block.kind) {
    case 'currency':
      return `Needs ${block.needed} ${currencyLabel(block.currency).toLowerCase()} — you have ${block.have}.`;
    case 'hasCardClass':
      return `Needs a ${block.cardClass} in your collection.`;
    case 'minStage':
      return `Opens once you reach stage ${block.stage}.`;
  }
}

interface Resolved {
  description: string;
  rewards: RewardBundle;
  carried: { status: StatusId; side: ModifierSide } | null;
}

/**
 * A vignette: the event, treasure or camp nodes between fights (Q16).
 *
 * Costs are visible before the tap and closed choices say why, so the player never
 * spends into a surprise. Resolving one records the node, banks the payout, and
 * hands any carried status to the next fight.
 */
export function EncounterSheet({ stage, onClose }: { stage: GeneratedStage; onClose: () => void }) {
  const save = usePlayerStore((s) => s.save);
  const [resolved, setResolved] = useState<Resolved | null>(null);

  const encounter = CONTENT.encounters.get(stage.encounterRef);

  const context = useMemo<EncounterContext>(() => {
    const player = save?.player;
    return {
      currencyOf: (currency: CurrencyId) => player?.currencies[currency] ?? 0,
      ownsCardClass: (cardClass) =>
        (player?.cards ?? []).some((c) => CONTENT.cards.get(c.defId)?.cardClass === cardClass),
      highestStage: Object.entries(player?.stageRecords ?? {}).reduce(
        (max, [n, record]) => (record.bestStars > 0 ? Math.max(max, Number(n)) : max),
        0,
      ),
    };
  }, [save]);

  if (!encounter) {
    return (
      <Modal title={stage.name} onClose={onClose}>
        <p className="u-prose">This part of the road is empty. Move on.</p>
        <Button variant="positive" block onClick={onClose}>
          Continue
        </Button>
      </Modal>
    );
  }

  const states = choiceStates(encounter, context);

  const take = (index: number) => {
    const player = usePlayerStore.getState();
    const run = useRunStore.getState();

    // Derived from the stage seed and the choice, so the same decision on the same
    // node always plays out the same way.
    const rng = createRng(deriveSeed(stage.seed, `encounter:${encounter.id}:${index}`));
    const result = resolveChoice(CONTENT, encounter, index, context, rng);

    if (result.price) player.spendCurrency(result.price.currency, result.price.amount);
    player.applyRewards(result.rewards);
    // A vignette is walked, not scored: one star marks the node done (Q17).
    player.recordStage(stage.number, 1);
    run.setBoon(result.outcome.carriedStatus ?? null);
    run.advanceTo(stage.number + 1);

    setResolved({
      description: result.outcome.description,
      rewards: result.rewards,
      carried: result.outcome.carriedStatus
        ? { status: result.outcome.carriedStatus.status, side: result.outcome.carriedStatus.side }
        : null,
    });
  };

  return (
    <Modal title={`${stage.number}. ${stage.name}`} onClose={onClose}>
      <div className={styles.sheet}>
        <div className={styles.kindRow}>
          <IconChip name={stageKindIconKey(encounter.kind)} size={22} />
          <span className={styles.kind}>{stageKindLabel(encounter.kind)}</span>
          <span className={styles.title}>{encounter.title}</span>
        </div>

        {resolved ? (
          <>
            <p className="u-prose">{resolved.description}</p>
            <RewardList rewards={resolved.rewards} empty="You leave with nothing but the walk." />
            {resolved.carried ? (
              <Panel tone="raised">
                <div className={styles.carried}>
                  <IconChip name={statusIconKey(resolved.carried.status)} size={24} />
                  <span className="u-prose">
                    Your {resolved.carried.side === 'player' ? 'cards' : 'enemies'} carry{' '}
                    {resolved.carried.status} into the next fight.
                  </span>
                </div>
              </Panel>
            ) : null}
            <Button variant="positive" block onClick={onClose}>
              Continue
            </Button>
          </>
        ) : (
          <>
            <p className="u-prose">{encounter.prompt}</p>
            <div className={styles.choices}>
              {states.map((choice) => (
                <div key={choice.index} className={styles.choice}>
                  <Button
                    variant={choice.index === 0 ? 'positive' : 'neutral'}
                    block
                    disabled={!choice.available}
                    onClick={() => take(choice.index)}
                  >
                    {choice.label}
                    {choice.price ? (
                      <span className={styles.price}>
                        <IconChip name={currencyIconKey(choice.price.currency)} size={18} />
                        {choice.price.amount}
                      </span>
                    ) : null}
                  </Button>
                  {choice.available ? (
                    choice.hint ? (
                      <span className={styles.hint}>{choice.hint}</span>
                    ) : null
                  ) : (
                    <span className={styles.blocked}>{blockedText(choice.blocked!)}</span>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
