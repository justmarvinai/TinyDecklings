import type { CSSProperties } from 'react';
import { CONTENT } from '@/content';
import type { CurrencyId } from '@/content/schemas';
import { currencyIconKey } from '@/content/schemas';
import type { RewardBundle } from '@/engine/economy/rewards';
import { IconChip, StarRow } from '@/ui/design/primitives';
import { GearSlotIcon } from '@/ui/icons/Icon';
import { gearRarityColor } from '@/ui/design/rarity';
import { currencyLabel } from '@/ui/text/labels';
import styles from './RewardList.module.css';

/**
 * What a payout looks like, everywhere it is shown.
 *
 * Victory, a vignette and a region chest all pay in the same currency, so they all
 * read the same way — one component rather than three drifting copies.
 */
export function RewardList({ rewards, empty }: { rewards: RewardBundle; empty?: string }) {
  // Rows stagger in on their index; see the `land` animation in the stylesheet.
  let index = 0;
  const next = () => ({ '--index': index++ }) as CSSProperties;
  const currencies = Object.entries(rewards.currencies).filter(([, amount]) => (amount ?? 0) > 0);
  const isEmpty =
    currencies.length === 0 &&
    rewards.cardXp === 0 &&
    rewards.gear.length === 0 &&
    rewards.cards.length === 0 &&
    rewards.fragments.length === 0;

  if (isEmpty) {
    return empty ? <p className="u-prose">{empty}</p> : null;
  }

  return (
    <div className={styles.list}>
      {currencies.map(([currency, amount]) => (
        <div key={currency} className={styles.row} style={next()}>
          <IconChip name={currencyIconKey(currency)} size={26} />
          <span>{currencyLabel(currency as CurrencyId)}</span>
          <span className={styles.value}>+{amount}</span>
        </div>
      ))}

      {rewards.cardXp > 0 ? (
        <div className={styles.row} style={next()}>
          <IconChip name="stat.power" size={26} />
          <span>Card XP</span>
          <span className={styles.value}>+{rewards.cardXp}</span>
        </div>
      ) : null}

      {rewards.gear.map((drop, i) => {
        const def = CONTENT.gear.get(drop.defId);
        if (!def) return null;
        return (
          <div key={`gear-${i}`} className={styles.row} style={next()}>
            <span
              className={styles.gearTile}
              style={{ '--tile': gearRarityColor(def.rarity) } as CSSProperties}
            >
              <GearSlotIcon slot={def.slot} size={24} />
            </span>
            <span className={styles.gearName}>{def.name}</span>
            <StarRow value={def.stars} max={5} size={11} className={styles.value} />
          </div>
        );
      })}

      {rewards.cards.map((cardId, i) => (
        <div key={`card-${i}`} className={styles.row} style={next()}>
          <IconChip name="nav.cards" size={26} />
          <span>{CONTENT.cards.get(cardId)?.name ?? cardId}</span>
          <span className={styles.value}>NEW</span>
        </div>
      ))}

      {rewards.fragments.map((entry, i) => (
        <div key={`frag-${i}`} className={styles.row} style={next()}>
          <IconChip name="currency.fragment" size={26} />
          <span>{CONTENT.cards.get(entry.cardId)?.name ?? entry.cardId} fragments</span>
          <span className={styles.value}>+{entry.amount}</span>
        </div>
      ))}
    </div>
  );
}
