import { useState, type CSSProperties } from 'react';
import { CONTENT } from '@/content';
import type { CurrencyId, RewardDef, ShopOfferDef } from '@/content/schemas';
import { useEconomyStore } from '@/state/economyStore';
import { usePlayerStore } from '@/state/playerStore';
import { Button, IconChip } from '@/ui/design/primitives';
import { currencyLabel } from '@/ui/text/labels';
import styles from './ShopScreen.module.css';

const CURRENCY_ICON: Partial<
  Record<
    CurrencyId,
    | 'currency.gold'
    | 'currency.gems'
    | 'currency.energy'
    | 'currency.token'
    | 'currency.fragment'
    | 'currency.tome'
  >
> = {
  gold: 'currency.gold',
  gems: 'currency.gems',
  energy: 'currency.energy',
  fragment: 'currency.fragment',
  tome: 'currency.tome',
  token_unit_t1: 'currency.token',
  token_unit_t2: 'currency.token',
  token_unit_t3: 'currency.token',
  token_hero: 'currency.token',
};

/**
 * The shop, after `Shop.png`.
 *
 * Every price is in a currency the player earns by playing. There is no real-money
 * purchase, no bundle and no countdown pressuring a wallet (Q13) — the daily
 * rotation exists to vary what is useful, not to create urgency.
 */
export function ShopScreen() {
  const save = usePlayerStore((s) => s.save);
  const [flash, setFlash] = useState<string | null>(null);
  const economy = useEconomyStore.getState();
  void save; // re-render when the wallet or purchases change

  const offers = economy.shopOffers();
  const permanent = offers.filter((o) => o.rotation === 'permanent');
  const daily = offers.filter((o) => o.rotation === 'daily');

  const buy = (offer: ShopOfferDef) => {
    if (useEconomyStore.getState().buyOffer(offer.id)) {
      setFlash(offer.id);
      setTimeout(() => setFlash(null), 700);
    }
  };

  return (
    <div className={`${styles.screen} u-scroll-y`}>
      <h2 className={styles.sectionTitle}>Always stocked</h2>
      <div className={styles.grid}>
        {permanent.map((offer) => (
          <OfferCard
            key={offer.id}
            offer={offer}
            bought={flash === offer.id}
            onBuy={() => buy(offer)}
          />
        ))}
      </div>

      <h2 className={styles.sectionTitle}>Today&rsquo;s deals</h2>
      <div className={styles.grid}>
        {daily.map((offer) => (
          <OfferCard
            key={offer.id}
            offer={offer}
            bought={flash === offer.id}
            onBuy={() => buy(offer)}
          />
        ))}
      </div>

      <p className={styles.note}>
        Everything here is bought with gold and gems you earn by playing. TinyDecklings has no
        real-money purchases.
      </p>
    </div>
  );
}

function OfferCard({
  offer,
  bought,
  onBuy,
}: {
  offer: ShopOfferDef;
  bought: boolean;
  onBuy: () => void;
}) {
  const economy = useEconomyStore.getState();
  const left = economy.offerPurchasesLeft(offer.id);
  const canBuy = economy.canBuyOffer(offer.id);
  const soldOut = left <= 0;

  const band =
    offer.price.currency === 'gems' ? 'var(--rarity-card-epic)' : 'var(--accent-warning)';

  return (
    <div
      className={[styles.offer, soldOut ? styles.soldOut : ''].filter(Boolean).join(' ')}
      style={{ '--band': band } as CSSProperties}
    >
      <div className={styles.offerHeader}>{offer.name}</div>
      {offer.limit > 0 ? (
        <span className={styles.limit}>{soldOut ? 'Sold out' : `${left} left`}</span>
      ) : null}

      <div className={styles.offerBody}>
        <RewardPreview reward={offer.reward} />
      </div>

      <div className={styles.offerFoot}>
        <Button
          variant={soldOut ? 'neutral' : 'positive'}
          className={styles.priceButton}
          disabled={!canBuy}
          onClick={onBuy}
          icon={CURRENCY_ICON[offer.price.currency]}
        >
          {bought ? 'Bought!' : soldOut ? 'Sold out' : `${offer.price.amount}`}
        </Button>
      </div>
    </div>
  );
}

function RewardPreview({ reward }: { reward: RewardDef }) {
  if (reward.kind === 'currency') {
    return (
      <>
        <IconChip name={CURRENCY_ICON[reward.currency] ?? 'currency.gold'} size={40} />
        <span className={styles.offerAmount}>{reward.amount.min}</span>
        <span className={styles.offerWhat}>{currencyLabel(reward.currency)}</span>
      </>
    );
  }

  if (reward.kind === 'gearDrop') {
    return (
      <>
        <IconChip name="gear.weapon" size={40} />
        <span className={styles.offerAmount}>1</span>
        <span className={styles.offerWhat}>Random gear</span>
      </>
    );
  }

  if (reward.kind === 'cardXp') {
    return (
      <>
        <IconChip name="stat.power" size={40} />
        <span className={styles.offerAmount}>{reward.amount.min}</span>
        <span className={styles.offerWhat}>Card XP</span>
      </>
    );
  }

  const cardId = reward.kind === 'card' ? reward.cardId : reward.cardId;
  return (
    <>
      <IconChip name="nav.cards" size={40} />
      <span className={styles.offerWhat}>{CONTENT.cards.get(cardId)?.name ?? cardId}</span>
    </>
  );
}
