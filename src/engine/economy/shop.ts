/**
 * Shop rotation.
 *
 * The daily line-up is *derived*, not stored: a day key plus the run seed picks the
 * offers, so the same day always shows the same shop and no scheduler has to run.
 * Only what the player has bought needs saving.
 *
 * Prices are all in earned currency — there is no real-money path (Q13).
 */
import type { ShopOfferDef } from '@/content/schemas';
import { createRng, deriveSeed } from '../rng';

/** `2026-08-26` in UTC — stable across time zones and cheap to compare. */
export function dayKey(nowMs: number): string {
  return new Date(nowMs).toISOString().slice(0, 10);
}

export interface ShopState {
  /** The day the current line-up belongs to. */
  dayKey: string;
  /** offer id -> purchases made during this rotation. */
  purchased: Record<string, number>;
}

export function emptyShopState(nowMs: number): ShopState {
  return { dayKey: dayKey(nowMs), purchased: {} };
}

/** Clears the purchase log when the day turns over. */
export function rolloverShop(state: ShopState, nowMs: number): ShopState {
  const today = dayKey(nowMs);
  if (state.dayKey === today) return state;
  return { dayKey: today, purchased: {} };
}

/**
 * The offers stocked right now: every permanent offer, plus a weighted daily
 * selection that is stable for the whole day.
 */
export function stockedOffers(
  offers: readonly ShopOfferDef[],
  seed: number,
  nowMs: number,
  dailyCount: number,
): ShopOfferDef[] {
  const permanent = offers.filter((o) => o.rotation === 'permanent');
  const pool = offers.filter((o) => o.rotation === 'daily');
  if (pool.length === 0) return permanent;

  const rng = createRng(deriveSeed(seed, `shop:${dayKey(nowMs)}`));
  const remaining = [...pool];
  const picked: ShopOfferDef[] = [];

  while (picked.length < Math.min(dailyCount, pool.length) && remaining.length > 0) {
    const choice = rng.pickWeighted(remaining, (o) => o.weight);
    picked.push(choice);
    remaining.splice(remaining.indexOf(choice), 1);
  }

  return [...permanent, ...picked];
}

export function purchasesLeft(offer: ShopOfferDef, state: ShopState): number {
  if (offer.limit === 0) return Infinity;
  return Math.max(0, offer.limit - (state.purchased[offer.id] ?? 0));
}

export function canBuy(offer: ShopOfferDef, state: ShopState, walletAmount: number): boolean {
  return purchasesLeft(offer, state) > 0 && walletAmount >= offer.price.amount;
}

export function recordPurchase(state: ShopState, offerId: string): ShopState {
  return {
    ...state,
    purchased: { ...state.purchased, [offerId]: (state.purchased[offerId] ?? 0) + 1 },
  };
}
