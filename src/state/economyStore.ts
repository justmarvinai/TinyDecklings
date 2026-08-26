/**
 * Economy: energy, summoning and the shop.
 *
 * All three read and write the player's save through `playerStore`; the maths lives
 * in `engine/economy`. Nothing here talks to a server, and nothing costs real money
 * (Q13) — every price is in a currency the player earns by playing.
 */
import { create } from 'zustand';
import {
  CONTENT,
  DAILY_OFFER_COUNT,
  DUPLICATE_FRAGMENTS,
  ENERGY_CONFIG,
  FRAGMENT_EXCHANGE_COST,
} from '@/content';
import type { CardRarity, CurrencyId, ShopOfferDef, StageKind } from '@/content/schemas';
import { createRng, deriveSeed } from '@/engine/rng';
import {
  canAfford,
  energyView,
  grantEnergy,
  spendEnergy,
  type EnergyView,
} from '@/engine/economy/energy';
import {
  pityProgress,
  summonCost,
  summonMany,
  type PityCounters,
  type SummonResult,
} from '@/engine/economy/summon';
import {
  canBuy,
  purchasesLeft,
  recordPurchase,
  rolloverShop,
  stockedOffers,
} from '@/engine/economy/shop';
import type { Clock } from '@/services/clock';
import { systemClock } from '@/services/clock';
import { usePlayerStore } from './playerStore';

export interface SummonOutcome extends SummonResult {
  /** True when the player already owned this card; duplicates pay fragments. */
  duplicate: boolean;
  fragments: number;
}

export interface EconomyState {
  /** Injected so tests can fast-forward hours without waiting. */
  clock: Clock;
  setClock: (clock: Clock) => void;

  energy: () => EnergyView;
  canEnterStage: (kind: StageKind) => boolean;
  spendForStage: (kind: StageKind) => boolean;
  grantEnergy: (amount: number) => void;

  pityFor: (poolId: string) => PityCounters;
  pityMeters: (poolId: string) => { rarity: CardRarity; count: number; threshold: number }[];
  canSummon: (poolId: string, count: number) => boolean;
  summonCostFor: (poolId: string, count: number) => number;
  summon: (poolId: string, count: number) => SummonOutcome[];

  exchangeCost: (cardId: string) => number;
  canExchange: (cardId: string) => boolean;
  exchangeFragments: (cardId: string) => boolean;

  shopOffers: () => ShopOfferDef[];
  offerPurchasesLeft: (offerId: string) => number;
  canBuyOffer: (offerId: string) => boolean;
  buyOffer: (offerId: string) => boolean;
}

const rarityOf = (cardId: string): CardRarity | undefined => CONTENT.cards.get(cardId)?.rarity;

export const useEconomyStore = create<EconomyState>((set, get) => ({
  clock: systemClock,
  setClock: (clock) => set({ clock }),

  // ---------------------------------------------------------------- energy ---

  energy: () => {
    const save = usePlayerStore.getState().save;
    if (!save) return { current: 0, cap: ENERGY_CONFIG.cap, msToNext: null, msToFull: null };
    return energyView(save.player.energy, ENERGY_CONFIG, get().clock.now());
  },

  canEnterStage: (kind) => {
    const save = usePlayerStore.getState().save;
    if (!save) return false;
    return canAfford(save.player.energy, ENERGY_CONFIG, kind, get().clock.now());
  },

  spendForStage: (kind) => {
    const player = usePlayerStore.getState();
    const save = player.save;
    if (!save) return false;

    const result = spendEnergy(save.player.energy, ENERGY_CONFIG, kind, get().clock.now());
    // Write back even on failure: the settle step is real progress the player earned.
    usePlayerStore.setState({
      save: { ...save, player: { ...save.player, energy: result.state } },
    });
    return result.ok;
  },

  grantEnergy: (amount) => {
    const player = usePlayerStore.getState();
    const save = player.save;
    if (!save) return;
    const next = grantEnergy(save.player.energy, ENERGY_CONFIG, amount, get().clock.now());
    usePlayerStore.setState({ save: { ...save, player: { ...save.player, energy: next } } });
  },

  // ---------------------------------------------------------------- summon ---

  pityFor: (poolId) => {
    const save = usePlayerStore.getState().save;
    return (save?.player.pity[poolId] ?? {}) as PityCounters;
  },

  pityMeters: (poolId) => {
    const pool = CONTENT.summonPools.get(poolId);
    if (!pool) return [];
    return pityProgress(pool, get().pityFor(poolId));
  },

  summonCostFor: (poolId, count) => {
    const pool = CONTENT.summonPools.get(poolId);
    return pool ? summonCost(pool, count) : 0;
  },

  canSummon: (poolId, count) => {
    const pool = CONTENT.summonPools.get(poolId);
    if (!pool) return false;
    return usePlayerStore.getState().currency(pool.tokenCurrency) >= summonCost(pool, count);
  },

  summon: (poolId, count) => {
    const pool = CONTENT.summonPools.get(poolId);
    const player = usePlayerStore.getState();
    const save = player.save;
    if (!pool || !save || !get().canSummon(poolId, count)) return [];

    if (!player.spendCurrency(pool.tokenCurrency, summonCost(pool, count))) return [];

    // Each batch draws its own stream, keyed by the pool and how many pulls have
    // been made, so reloading a save can never re-roll the same lucky batch.
    const drawn = save.player.summonCounts[poolId] ?? 0;
    const rng = createRng(deriveSeed(save.run.seed, `summon:${poolId}:${drawn}`));

    const { results, pity } = summonMany(pool, get().pityFor(poolId), rarityOf, rng, count);

    const owned = new Set(
      usePlayerStore
        .getState()
        .cards()
        .map((c) => c.defId),
    );
    const outcomes: SummonOutcome[] = results.map((result) => {
      const duplicate = owned.has(result.cardId);
      const fragments = duplicate ? (DUPLICATE_FRAGMENTS[result.rarity] ?? 0) : 0;
      owned.add(result.cardId);
      return { ...result, duplicate, fragments };
    });

    for (const outcome of outcomes) {
      usePlayerStore.getState().grantCard(outcome.cardId);
      if (outcome.fragments > 0)
        usePlayerStore.getState().addCurrency('fragment', outcome.fragments);
    }

    const after = usePlayerStore.getState().save;
    if (after) {
      usePlayerStore.setState({
        save: {
          ...after,
          player: {
            ...after.player,
            pity: { ...after.player.pity, [poolId]: pity as Record<string, number> },
            summonCounts: { ...after.player.summonCounts, [poolId]: drawn + count },
          },
        },
      });
    }

    return outcomes;
  },

  // ------------------------------------------------------------- fragments ---

  exchangeCost: (cardId) => {
    const rarity = rarityOf(cardId);
    return rarity ? (FRAGMENT_EXCHANGE_COST[rarity] ?? 0) : 0;
  },

  canExchange: (cardId) => {
    const def = CONTENT.cards.get(cardId);
    if (!def || def.enemyOnly) return false;
    const cost = get().exchangeCost(cardId);
    return cost > 0 && usePlayerStore.getState().currency('fragment') >= cost;
  },

  exchangeFragments: (cardId) => {
    if (!get().canExchange(cardId)) return false;
    const player = usePlayerStore.getState();
    if (!player.spendCurrency('fragment', get().exchangeCost(cardId))) return false;
    player.grantCard(cardId);
    return true;
  },

  // ------------------------------------------------------------------ shop ---

  shopOffers: () => {
    const save = usePlayerStore.getState().save;
    if (!save) return [];
    return stockedOffers(
      [...CONTENT.shopOffers.values()],
      save.run.seed,
      get().clock.now(),
      DAILY_OFFER_COUNT,
    );
  },

  offerPurchasesLeft: (offerId) => {
    const offer = CONTENT.shopOffers.get(offerId);
    const save = usePlayerStore.getState().save;
    if (!offer || !save) return 0;
    return purchasesLeft(offer, rolloverShop(save.player.shop, get().clock.now()));
  },

  canBuyOffer: (offerId) => {
    const offer = CONTENT.shopOffers.get(offerId);
    const save = usePlayerStore.getState().save;
    if (!offer || !save) return false;
    const wallet = usePlayerStore.getState().currency(offer.price.currency);
    return canBuy(offer, rolloverShop(save.player.shop, get().clock.now()), wallet);
  },

  buyOffer: (offerId) => {
    const offer = CONTENT.shopOffers.get(offerId);
    if (!offer || !get().canBuyOffer(offerId)) return false;

    const player = usePlayerStore.getState();
    if (!player.spendCurrency(offer.price.currency, offer.price.amount)) return false;

    // Energy is not a wallet entry — it lives in its own regen-aware state.
    if (offer.reward.kind === 'currency' && offer.reward.currency === 'energy') {
      get().grantEnergy(offer.reward.amount.min);
    } else {
      const rng = createRng(usePlayerStore.getState().save?.run.seed ?? 1, get().clock.now() >>> 0);
      player.applyRewards(rewardToBundle(offer, rng));
    }

    const after = usePlayerStore.getState().save;
    if (after) {
      const rolled = rolloverShop(after.player.shop, get().clock.now());
      usePlayerStore.setState({
        save: { ...after, player: { ...after.player, shop: recordPurchase(rolled, offerId) } },
      });
    }
    return true;
  },
}));

/** Turns a single shop reward into the bundle shape `applyRewards` understands. */
function rewardToBundle(offer: ShopOfferDef, rng: ReturnType<typeof createRng>) {
  const bundle = {
    currencies: {} as Partial<Record<CurrencyId, number>>,
    cardXp: 0,
    gear: [] as { defId: string; substats: [] }[],
    cards: [] as string[],
    fragments: [] as { cardId: string; amount: number }[],
  };

  const reward = offer.reward;
  switch (reward.kind) {
    case 'currency':
      bundle.currencies[reward.currency] = rng.int(reward.amount.min, reward.amount.max);
      break;
    case 'cardXp':
      bundle.cardXp = rng.int(reward.amount.min, reward.amount.max);
      break;
    case 'card':
      bundle.cards.push(reward.cardId);
      break;
    case 'fragment':
      bundle.fragments.push({
        cardId: reward.cardId,
        amount: rng.int(reward.amount.min, reward.amount.max),
      });
      break;
    case 'gearDrop': {
      const slot = rng.pick(reward.slots);
      const entries = Object.entries(reward.rarityWeights).filter(([, w]) => (w ?? 0) > 0);
      const rarity =
        entries.length > 0 ? rng.pickWeighted(entries, ([, w]) => w ?? 0)[0] : undefined;
      const pool = [...CONTENT.gear.values()].filter(
        (g) => g.slot === slot && (!rarity || g.rarity === rarity),
      );
      const fallback = [...CONTENT.gear.values()].filter((g) => g.slot === slot);
      const chosen =
        pool.length > 0 ? rng.pick(pool) : fallback.length > 0 ? rng.pick(fallback) : null;
      if (chosen) bundle.gear.push({ defId: chosen.id, substats: [] });
      break;
    }
  }

  return bundle;
}
