/**
 * Loot tables for the slice.
 *
 * Guaranteed rewards keep every fight worth finishing; the weighted roll is where
 * gear, tokens and tomes come from. Numbers here are initial tunables — balancing
 * them is a content change, never an engine change.
 *
 * Economy shape (Q13): summon tokens, gems and tomes all drop from ordinary play,
 * because there is no other way to get them — nothing in this game is for sale for
 * real money.
 */
import type { LootTableDef } from '../schemas';

export const LOOT_TABLE_DEFS: readonly LootTableDef[] = [
  {
    id: 'loot.slice_battle',
    guaranteed: [
      { kind: 'currency', currency: 'gold', amount: { min: 45, max: 90 } },
      { kind: 'cardXp', amount: { min: 30, max: 55 } },
    ],
    rolls: 2,
    entries: [
      // Most fights pay in gold; the rest seed the systems that need feeding.
      { weight: 40, reward: { kind: 'currency', currency: 'gold', amount: { min: 20, max: 45 } } },
      { weight: 16, reward: { kind: 'currency', currency: 'gems', amount: { min: 1, max: 3 } } },
      { weight: 10, reward: { kind: 'currency', currency: 'tome', amount: { min: 1, max: 1 } } },
      {
        weight: 8,
        reward: { kind: 'currency', currency: 'token_unit_t1', amount: { min: 1, max: 1 } },
      },
      { weight: 6, reward: { kind: 'currency', currency: 'fragment', amount: { min: 3, max: 8 } } },
      {
        weight: 20,
        reward: {
          kind: 'gearDrop',
          slots: ['weapon', 'helmet', 'armor', 'boots', 'shield', 'gauntlets', 'ring', 'amulet'],
          rarityWeights: { worn: 50, sturdy: 32, refined: 15, ornate: 3 },
        },
      },
    ],
  },
  {
    id: 'loot.slice_boss',
    guaranteed: [
      { kind: 'currency', currency: 'gold', amount: { min: 220, max: 320 } },
      { kind: 'currency', currency: 'gems', amount: { min: 10, max: 18 } },
      { kind: 'cardXp', amount: { min: 140, max: 200 } },
      { kind: 'currency', currency: 'tome', amount: { min: 2, max: 4 } },
      { kind: 'currency', currency: 'token_unit_t1', amount: { min: 1, max: 2 } },
      {
        kind: 'gearDrop',
        slots: ['weapon', 'helmet', 'armor', 'boots', 'shield', 'gauntlets', 'ring', 'amulet'],
        rarityWeights: { sturdy: 30, refined: 45, ornate: 20, exalted: 5 },
      },
    ],
    rolls: 2,
    entries: [
      {
        weight: 34,
        reward: { kind: 'currency', currency: 'token_unit_t2', amount: { min: 1, max: 1 } },
      },
      {
        weight: 20,
        reward: { kind: 'currency', currency: 'token_hero', amount: { min: 1, max: 1 } },
      },
      {
        weight: 16,
        reward: { kind: 'currency', currency: 'fragment', amount: { min: 20, max: 40 } },
      },
      {
        weight: 30,
        reward: {
          kind: 'gearDrop',
          slots: ['weapon', 'helmet', 'armor', 'boots', 'shield', 'gauntlets', 'ring', 'amulet'],
          rarityWeights: { refined: 45, ornate: 40, exalted: 15 },
        },
      },
    ],
  },
];
