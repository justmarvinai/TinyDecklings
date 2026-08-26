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
    id: 'loot.isles_battle',
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
    id: 'loot.isles_boss',
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

  // --- Ashfall Reach (stages 11-20) ------------------------------------------
  {
    id: 'loot.ashfall_battle',
    guaranteed: [
      { kind: 'currency', currency: 'gold', amount: { min: 110, max: 190 } },
      { kind: 'cardXp', amount: { min: 90, max: 140 } },
    ],
    rolls: 2,
    entries: [
      { weight: 36, reward: { kind: 'currency', currency: 'gold', amount: { min: 50, max: 110 } } },
      { weight: 16, reward: { kind: 'currency', currency: 'gems', amount: { min: 2, max: 5 } } },
      { weight: 12, reward: { kind: 'currency', currency: 'tome', amount: { min: 1, max: 2 } } },
      {
        weight: 8,
        reward: { kind: 'currency', currency: 'token_unit_t1', amount: { min: 1, max: 2 } },
      },
      {
        weight: 6,
        reward: { kind: 'currency', currency: 'token_unit_t2', amount: { min: 1, max: 1 } },
      },
      {
        weight: 6,
        reward: { kind: 'currency', currency: 'fragment', amount: { min: 8, max: 16 } },
      },
      {
        weight: 22,
        reward: {
          kind: 'gearDrop',
          slots: ['weapon', 'helmet', 'armor', 'boots', 'shield', 'gauntlets', 'ring', 'amulet'],
          rarityWeights: { worn: 24, sturdy: 40, refined: 28, ornate: 8 },
        },
      },
    ],
  },
  {
    id: 'loot.ashfall_boss',
    guaranteed: [
      { kind: 'currency', currency: 'gold', amount: { min: 520, max: 720 } },
      { kind: 'currency', currency: 'gems', amount: { min: 20, max: 32 } },
      { kind: 'cardXp', amount: { min: 320, max: 460 } },
      { kind: 'currency', currency: 'tome', amount: { min: 4, max: 7 } },
      { kind: 'currency', currency: 'token_unit_t2', amount: { min: 1, max: 2 } },
      {
        kind: 'gearDrop',
        slots: ['weapon', 'helmet', 'armor', 'boots', 'shield', 'gauntlets', 'ring', 'amulet'],
        rarityWeights: { refined: 40, ornate: 42, exalted: 18 },
      },
    ],
    rolls: 2,
    entries: [
      {
        weight: 30,
        reward: { kind: 'currency', currency: 'token_unit_t3', amount: { min: 1, max: 1 } },
      },
      {
        weight: 24,
        reward: { kind: 'currency', currency: 'token_hero', amount: { min: 1, max: 2 } },
      },
      {
        weight: 16,
        reward: { kind: 'currency', currency: 'fragment', amount: { min: 40, max: 70 } },
      },
      {
        weight: 30,
        reward: {
          kind: 'gearDrop',
          slots: ['weapon', 'helmet', 'armor', 'boots', 'shield', 'gauntlets', 'ring', 'amulet'],
          rarityWeights: { ornate: 50, exalted: 40, mythic: 10 },
        },
      },
    ],
  },

  // --- Verdant Wound (stages 21-30) ------------------------------------------
  {
    id: 'loot.verdant_battle',
    guaranteed: [
      { kind: 'currency', currency: 'gold', amount: { min: 210, max: 340 } },
      { kind: 'cardXp', amount: { min: 180, max: 260 } },
    ],
    rolls: 2,
    entries: [
      { weight: 32, reward: { kind: 'currency', currency: 'gold', amount: { min: 90, max: 180 } } },
      { weight: 16, reward: { kind: 'currency', currency: 'gems', amount: { min: 3, max: 7 } } },
      { weight: 12, reward: { kind: 'currency', currency: 'tome', amount: { min: 2, max: 3 } } },
      {
        weight: 8,
        reward: { kind: 'currency', currency: 'token_unit_t2', amount: { min: 1, max: 2 } },
      },
      {
        weight: 6,
        reward: { kind: 'currency', currency: 'token_unit_t3', amount: { min: 1, max: 1 } },
      },
      {
        weight: 6,
        reward: { kind: 'currency', currency: 'fragment', amount: { min: 14, max: 26 } },
      },
      {
        weight: 24,
        reward: {
          kind: 'gearDrop',
          slots: ['weapon', 'helmet', 'armor', 'boots', 'shield', 'gauntlets', 'ring', 'amulet'],
          rarityWeights: { sturdy: 26, refined: 40, ornate: 26, exalted: 8 },
        },
      },
    ],
  },
  {
    id: 'loot.verdant_boss',
    guaranteed: [
      { kind: 'currency', currency: 'gold', amount: { min: 900, max: 1300 } },
      { kind: 'currency', currency: 'gems', amount: { min: 34, max: 52 } },
      { kind: 'cardXp', amount: { min: 560, max: 780 } },
      { kind: 'currency', currency: 'tome', amount: { min: 6, max: 10 } },
      { kind: 'currency', currency: 'token_unit_t3', amount: { min: 1, max: 2 } },
      {
        kind: 'gearDrop',
        slots: ['weapon', 'helmet', 'armor', 'boots', 'shield', 'gauntlets', 'ring', 'amulet'],
        rarityWeights: { ornate: 40, exalted: 44, mythic: 16 },
      },
    ],
    rolls: 2,
    entries: [
      {
        weight: 28,
        reward: { kind: 'currency', currency: 'token_hero', amount: { min: 1, max: 2 } },
      },
      {
        weight: 26,
        reward: { kind: 'currency', currency: 'token_unit_t3', amount: { min: 1, max: 2 } },
      },
      {
        weight: 16,
        reward: { kind: 'currency', currency: 'fragment', amount: { min: 70, max: 120 } },
      },
      {
        weight: 30,
        reward: {
          kind: 'gearDrop',
          slots: ['weapon', 'helmet', 'armor', 'boots', 'shield', 'gauntlets', 'ring', 'amulet'],
          rarityWeights: { exalted: 60, mythic: 40 },
        },
      },
    ],
  },

  // --- vignette payouts (event / treasure / camp) ----------------------------
  {
    id: 'loot.vignette_small',
    guaranteed: [
      { kind: 'currency', currency: 'gold', amount: { min: 40, max: 90 } },
      { kind: 'cardXp', amount: { min: 20, max: 45 } },
    ],
    rolls: 0,
    entries: [],
  },
  {
    id: 'loot.vignette_gold',
    guaranteed: [{ kind: 'currency', currency: 'gold', amount: { min: 180, max: 320 } }],
    rolls: 0,
    entries: [],
  },
  {
    id: 'loot.vignette_rich',
    guaranteed: [
      { kind: 'currency', currency: 'gold', amount: { min: 380, max: 620 } },
      { kind: 'currency', currency: 'gems', amount: { min: 4, max: 10 } },
    ],
    rolls: 0,
    entries: [],
  },
  {
    id: 'loot.vignette_tomes',
    guaranteed: [{ kind: 'currency', currency: 'tome', amount: { min: 2, max: 4 } }],
    rolls: 0,
    entries: [],
  },
  {
    id: 'loot.vignette_xp',
    guaranteed: [{ kind: 'cardXp', amount: { min: 180, max: 300 } }],
    rolls: 0,
    entries: [],
  },
  {
    id: 'loot.treasure_chest',
    guaranteed: [
      { kind: 'currency', currency: 'gold', amount: { min: 120, max: 240 } },
      {
        kind: 'gearDrop',
        slots: ['weapon', 'helmet', 'armor', 'boots', 'shield', 'gauntlets', 'ring', 'amulet'],
        rarityWeights: { sturdy: 34, refined: 42, ornate: 20, exalted: 4 },
      },
    ],
    rolls: 0,
    entries: [],
  },
  {
    id: 'loot.treasure_rich',
    guaranteed: [
      { kind: 'currency', currency: 'gold', amount: { min: 260, max: 420 } },
      { kind: 'currency', currency: 'gems', amount: { min: 8, max: 16 } },
      {
        kind: 'gearDrop',
        slots: ['weapon', 'helmet', 'armor', 'boots', 'shield', 'gauntlets', 'ring', 'amulet'],
        rarityWeights: { refined: 32, ornate: 44, exalted: 20, mythic: 4 },
      },
    ],
    rolls: 0,
    entries: [],
  },
  {
    id: 'loot.treasure_tokens',
    guaranteed: [
      { kind: 'currency', currency: 'token_unit_t1', amount: { min: 2, max: 4 } },
      { kind: 'currency', currency: 'token_unit_t2', amount: { min: 1, max: 2 } },
      { kind: 'currency', currency: 'fragment', amount: { min: 15, max: 35 } },
    ],
    rolls: 0,
    entries: [],
  },
  {
    id: 'loot.camp_rest',
    guaranteed: [
      { kind: 'currency', currency: 'energy', amount: { min: 4, max: 8 } },
      { kind: 'cardXp', amount: { min: 60, max: 110 } },
    ],
    rolls: 0,
    entries: [],
  },
  {
    id: 'loot.camp_train',
    guaranteed: [
      { kind: 'cardXp', amount: { min: 220, max: 340 } },
      { kind: 'currency', currency: 'tome', amount: { min: 1, max: 2 } },
    ],
    rolls: 0,
    entries: [],
  },
  {
    id: 'loot.camp_energy',
    guaranteed: [{ kind: 'currency', currency: 'energy', amount: { min: 10, max: 18 } }],
    rolls: 0,
    entries: [],
  },

  // --- region star chests ----------------------------------------------------
  {
    id: 'loot.chest_isles',
    guaranteed: [
      { kind: 'currency', currency: 'gold', amount: { min: 400, max: 400 } },
      { kind: 'currency', currency: 'gems', amount: { min: 15, max: 15 } },
      { kind: 'currency', currency: 'token_unit_t1', amount: { min: 3, max: 3 } },
      {
        kind: 'gearDrop',
        slots: ['weapon', 'helmet', 'armor', 'boots', 'shield', 'gauntlets', 'ring', 'amulet'],
        rarityWeights: { refined: 50, ornate: 40, exalted: 10 },
      },
    ],
    rolls: 0,
    entries: [],
  },
  {
    id: 'loot.chest_ashfall',
    guaranteed: [
      { kind: 'currency', currency: 'gold', amount: { min: 900, max: 900 } },
      { kind: 'currency', currency: 'gems', amount: { min: 30, max: 30 } },
      { kind: 'currency', currency: 'token_unit_t2', amount: { min: 3, max: 3 } },
      { kind: 'currency', currency: 'tome', amount: { min: 4, max: 4 } },
      {
        kind: 'gearDrop',
        slots: ['weapon', 'helmet', 'armor', 'boots', 'shield', 'gauntlets', 'ring', 'amulet'],
        rarityWeights: { ornate: 50, exalted: 42, mythic: 8 },
      },
    ],
    rolls: 0,
    entries: [],
  },
  {
    id: 'loot.chest_verdant',
    guaranteed: [
      { kind: 'currency', currency: 'gold', amount: { min: 1600, max: 1600 } },
      { kind: 'currency', currency: 'gems', amount: { min: 50, max: 50 } },
      { kind: 'currency', currency: 'token_hero', amount: { min: 2, max: 2 } },
      { kind: 'currency', currency: 'tome', amount: { min: 8, max: 8 } },
      {
        kind: 'gearDrop',
        slots: ['weapon', 'helmet', 'armor', 'boots', 'shield', 'gauntlets', 'ring', 'amulet'],
        rarityWeights: { exalted: 62, mythic: 38 },
      },
    ],
    rolls: 0,
    entries: [],
  },
];
