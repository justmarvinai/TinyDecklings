/**
 * Loot tables for the slice.
 *
 * Guaranteed rewards keep every fight worth finishing; the weighted roll is where
 * gear comes from. Numbers here are initial tunables — balancing them is a content
 * change, never an engine change.
 */
import type { LootTableDef } from '../schemas';

export const LOOT_TABLE_DEFS: readonly LootTableDef[] = [
  {
    id: 'loot.slice_battle',
    guaranteed: [
      { kind: 'currency', currency: 'gold', amount: { min: 45, max: 90 } },
      { kind: 'cardXp', amount: { min: 30, max: 55 } },
    ],
    rolls: 1,
    entries: [
      // Most fights pay in gold; roughly one in four drops a piece of gear.
      { weight: 55, reward: { kind: 'currency', currency: 'gold', amount: { min: 20, max: 45 } } },
      { weight: 20, reward: { kind: 'currency', currency: 'gems', amount: { min: 1, max: 3 } } },
      {
        weight: 25,
        reward: {
          kind: 'gearDrop',
          slots: ['weapon', 'helmet', 'armor', 'boots'],
          rarityWeights: { worn: 55, sturdy: 30, refined: 13, ornate: 2 },
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
      {
        kind: 'gearDrop',
        slots: ['weapon', 'helmet', 'armor', 'boots'],
        rarityWeights: { sturdy: 30, refined: 45, ornate: 20, exalted: 5 },
      },
    ],
    rolls: 1,
    entries: [
      {
        weight: 60,
        reward: { kind: 'currency', currency: 'token_unit_t1', amount: { min: 1, max: 2 } },
      },
      {
        weight: 40,
        reward: {
          kind: 'gearDrop',
          slots: ['weapon', 'helmet', 'armor', 'boots'],
          rarityWeights: { refined: 50, ornate: 40, exalted: 10 },
        },
      },
    ],
  },
];
