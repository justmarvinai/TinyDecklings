/**
 * Rarity — two independent systems.
 *
 * Cards and Gear deliberately never share an enum, a tier name, a tier count or a
 * colour token (owner directive / CLAUDE.md rule 4). Keeping them as separate types
 * means the compiler rejects any accidental crossover.
 */

export const CARD_RARITIES = ['common', 'uncommon', 'rare', 'epic', 'legendary'] as const;
export type CardRarity = (typeof CARD_RARITIES)[number];

export const GEAR_RARITIES = ['worn', 'sturdy', 'refined', 'ornate', 'exalted', 'mythic'] as const;
export type GearRarity = (typeof GEAR_RARITIES)[number];

/** Card rarity fixes the base star grade; ascension can raise stars above it (Q8). */
export const CARD_RARITY_BASE_STARS: Readonly<Record<CardRarity, 1 | 2 | 3 | 4 | 5>> = {
  common: 1,
  uncommon: 2,
  rare: 3,
  epic: 4,
  legendary: 5,
};

export const CARD_RARITY_LABEL: Readonly<Record<CardRarity, string>> = {
  common: 'Common',
  uncommon: 'Uncommon',
  rare: 'Rare',
  epic: 'Epic',
  legendary: 'Legendary',
};

export const GEAR_RARITY_LABEL: Readonly<Record<GearRarity, string>> = {
  worn: 'Worn',
  sturdy: 'Sturdy',
  refined: 'Refined',
  ornate: 'Ornate',
  exalted: 'Exalted',
  mythic: 'Mythic',
};

/** Number of substats rolled on a gear item, by rarity (Q11). Tunable. */
export const GEAR_RARITY_SUBSTATS: Readonly<Record<GearRarity, number>> = {
  worn: 0,
  sturdy: 1,
  refined: 2,
  ornate: 3,
  exalted: 4,
  mythic: 4,
};
