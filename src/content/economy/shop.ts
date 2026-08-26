/**
 * The shop (Q13).
 *
 * Every price is in a currency the player earns by playing. There is no real-money
 * purchase, no bundle, no "special offer" timer pressuring a wallet — the shop is a
 * currency converter and an energy tap, nothing more.
 */
import type { ShopOfferDef } from '../schemas';

export const SHOP_OFFER_DEFS: readonly ShopOfferDef[] = [
  // --- always stocked ---
  {
    id: 'offer.energy_small',
    name: 'Flask of Vigour',
    price: { currency: 'gems', amount: 30 },
    reward: { kind: 'currency', currency: 'energy', amount: { min: 30, max: 30 } },
    rotation: 'permanent',
    limit: 0,
    weight: 1,
  },
  {
    id: 'offer.tome_bundle',
    name: 'Tome Bundle',
    price: { currency: 'gems', amount: 40 },
    reward: { kind: 'currency', currency: 'tome', amount: { min: 5, max: 5 } },
    rotation: 'permanent',
    limit: 0,
    weight: 1,
  },
  {
    id: 'offer.token_t1',
    name: 'Unit Token',
    price: { currency: 'gems', amount: 60 },
    reward: { kind: 'currency', currency: 'token_unit_t1', amount: { min: 1, max: 1 } },
    rotation: 'permanent',
    limit: 0,
    weight: 1,
  },

  // --- daily rotation ---
  {
    id: 'offer.daily_gold',
    name: 'Purse of Gold',
    price: { currency: 'gems', amount: 20 },
    reward: { kind: 'currency', currency: 'gold', amount: { min: 2500, max: 2500 } },
    rotation: 'daily',
    limit: 2,
    weight: 3,
  },
  {
    id: 'offer.daily_tokens_t2',
    name: 'Veteran Token',
    price: { currency: 'gems', amount: 150 },
    reward: { kind: 'currency', currency: 'token_unit_t2', amount: { min: 1, max: 1 } },
    rotation: 'daily',
    limit: 1,
    weight: 2,
  },
  {
    id: 'offer.daily_hero_token',
    name: 'Hero Token',
    price: { currency: 'gems', amount: 250 },
    reward: { kind: 'currency', currency: 'token_hero', amount: { min: 1, max: 1 } },
    rotation: 'daily',
    limit: 1,
    weight: 1,
  },
  {
    id: 'offer.daily_fragments',
    name: 'Handful of Shards',
    price: { currency: 'gold', amount: 4000 },
    reward: { kind: 'currency', currency: 'fragment', amount: { min: 40, max: 40 } },
    rotation: 'daily',
    limit: 2,
    weight: 3,
  },
  {
    id: 'offer.daily_gear',
    name: 'Salvaged Gear',
    price: { currency: 'gold', amount: 6000 },
    reward: {
      kind: 'gearDrop',
      slots: ['weapon', 'helmet', 'armor', 'boots', 'shield', 'gauntlets', 'ring', 'amulet'],
      rarityWeights: { sturdy: 30, refined: 45, ornate: 20, exalted: 5 },
    },
    rotation: 'daily',
    limit: 1,
    weight: 3,
  },
  {
    id: 'offer.daily_tomes',
    name: 'Scholar Cache',
    price: { currency: 'gold', amount: 5000 },
    reward: { kind: 'currency', currency: 'tome', amount: { min: 4, max: 4 } },
    rotation: 'daily',
    limit: 1,
    weight: 2,
  },
];

/** How many daily offers are stocked at once. */
export const DAILY_OFFER_COUNT = 4;
