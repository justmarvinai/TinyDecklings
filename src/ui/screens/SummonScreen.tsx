import { useState, type CSSProperties } from 'react';
import { CONTENT } from '@/content';
import { CARD_RARITY_LABEL, type CardRarity } from '@/content/schemas';
import type { SummonOutcome } from '@/state/economyStore';
import { useEconomyStore } from '@/state/economyStore';
import { usePlayerStore } from '@/state/playerStore';
import { CARD_RARITY_VAR } from '@/ui/design/rarity';
import { Button, IconChip, Ribbon, StarRow } from '@/ui/design/primitives';
import { CardFrame } from '@/ui/components/CardFrame';
import { useSfx } from '@/ui/audio/audioContext';
import styles from './SummonScreen.module.css';

const POOL_ORDER = ['pool.unit_t1', 'pool.unit_t2', 'pool.unit_t3', 'pool.hero'] as const;

/**
 * Summoning, after `Card_Summon.png`.
 *
 * Everything on this screen is bought with tokens the player earned in battle —
 * there is no real-money purchase anywhere in this game (Q13). The pity meters are
 * the honest part: they show exactly how close a guaranteed pull is.
 */
export function SummonScreen() {
  const [poolId, setPoolId] = useState<string>(POOL_ORDER[0]);
  const [revealed, setRevealed] = useState<SummonOutcome[]>([]);
  const sfx = useSfx();
  const save = usePlayerStore((s) => s.save);
  const currency = usePlayerStore((s) => s.currency);
  const economy = useEconomyStore.getState();
  void save; // re-render when tokens or pity change

  const pool = CONTENT.summonPools.get(poolId);
  if (!pool) return null;

  const meters = economy.pityMeters(poolId);
  const singleCost = economy.summonCostFor(poolId, 1);
  const tenCost = economy.summonCostFor(poolId, 10);
  const tokens = currency(pool.tokenCurrency);

  const pull = (count: number) => {
    const results = useEconomyStore.getState().summon(poolId, count);
    if (results.length === 0) {
      sfx('ui.error');
      return;
    }
    sfx('reward.summon');
    setRevealed(results);
  };

  return (
    <div className={styles.screen}>
      <div className={styles.pools}>
        {POOL_ORDER.map((id) => {
          const p = CONTENT.summonPools.get(id);
          if (!p) return null;
          return (
            <button
              key={id}
              type="button"
              className={[styles.pool, id === poolId ? styles.poolActive : '']
                .filter(Boolean)
                .join(' ')}
              onClick={() => {
                setPoolId(id);
                setRevealed([]);
              }}
            >
              <IconChip name="currency.token" size={22} />
              <span className={styles.poolCount}>{currency(p.tokenCurrency)}</span>
              <span>{p.name}</span>
            </button>
          );
        })}
      </div>

      <div className={styles.meters}>
        {meters.map((meter) => (
          <div key={meter.rarity} className={styles.meter}>
            <span
              className={styles.meterLabel}
              style={{ '--meter-color': `var(${CARD_RARITY_VAR[meter.rarity]})` } as CSSProperties}
            >
              {CARD_RARITY_LABEL[meter.rarity]}
            </span>
            <span className={styles.meterTrack}>
              <span
                className={styles.meterFill}
                style={
                  {
                    width: `${(meter.count / meter.threshold) * 100}%`,
                    '--meter-color': `var(${CARD_RARITY_VAR[meter.rarity]})`,
                  } as CSSProperties
                }
              />
            </span>
            <span className={styles.meterValue}>
              {meter.count}/{meter.threshold}
            </span>
          </div>
        ))}
      </div>

      <div className={styles.stage}>
        {revealed.length === 0 ? (
          <p className={styles.emptyStage}>
            Spend tokens to summon from the {pool.name} pool. Tokens come from battles and the shop
            — this game never asks for money.
          </p>
        ) : revealed.length === 1 ? (
          <SingleReveal outcome={revealed[0]} />
        ) : (
          <BatchReveal outcomes={revealed} />
        )}
      </div>

      <div className={styles.actions}>
        <Button
          variant="positive"
          className={styles.cta}
          disabled={tokens < singleCost}
          onClick={() => pull(1)}
        >
          Summon
          <span className={styles.ctaCost}>{singleCost} token</span>
        </Button>
        <Button
          variant="info"
          className={styles.cta}
          disabled={tokens < tenCost}
          onClick={() => pull(10)}
        >
          {pool.x10Discount > 0 ? (
            <Ribbon side="right" className={styles.discount}>
              -{Math.round(pool.x10Discount * 100)}%
            </Ribbon>
          ) : null}
          Summon ×10
          <span className={styles.ctaCost}>{tenCost} tokens</span>
        </Button>
      </div>

      <p className={styles.note}>
        Duplicates are never wasted — they become fragments, or feed an evolution.
      </p>
    </div>
  );
}

function SingleReveal({ outcome }: { outcome: SummonOutcome }) {
  const def = CONTENT.cards.get(outcome.cardId);
  if (!def) return null;
  return (
    <>
      <div className={styles.revealCard}>
        <CardFrame defId={def.id} rarity={def.rarity} />
      </div>
      <StarRow value={starsFor(def.rarity)} max={5} size={20} />
      <span className={styles.revealName}>{def.name}</span>
      <span
        className={styles.revealTag}
        style={{ '--tag': `var(${CARD_RARITY_VAR[def.rarity]})` } as CSSProperties}
      >
        {CARD_RARITY_LABEL[def.rarity]}
      </span>
      {outcome.fromPity ? <span className={styles.dupeNote}>Guaranteed by pity</span> : null}
      {outcome.duplicate ? (
        <span className={styles.dupeNote}>Duplicate — +{outcome.fragments} fragments</span>
      ) : null}
    </>
  );
}

function BatchReveal({ outcomes }: { outcomes: SummonOutcome[] }) {
  const fragments = outcomes.reduce((sum, o) => sum + o.fragments, 0);
  return (
    <>
      <div className={styles.batchGrid}>
        {outcomes.map((outcome, i) => {
          const def = CONTENT.cards.get(outcome.cardId);
          if (!def) return null;
          return (
            <span key={i} className={styles.batchTile}>
              <CardFrame defId={def.id} rarity={def.rarity} size="small" />
              {outcome.duplicate ? <span className={styles.dupeMark}>DUP</span> : null}
            </span>
          );
        })}
      </div>
      {fragments > 0 ? (
        <span className={styles.dupeNote}>+{fragments} fragments from duplicates</span>
      ) : null}
    </>
  );
}

/** Base stars for a rarity, for the reveal ceremony's star row. */
function starsFor(rarity: CardRarity): number {
  return { common: 1, uncommon: 2, rare: 3, epic: 4, legendary: 5 }[rarity];
}
