/**
 * Rarity -> CSS custom property.
 *
 * Two lookup tables that must never converge: cards carry rarity on the frame,
 * gear carries it as the tile background behind the fixed slot icon. A test
 * asserts the two maps share no token (CLAUDE.md rule 4).
 */
import type { CardRarity, GearRarity } from '@/content/schemas/rarity';

export const CARD_RARITY_VAR: Readonly<Record<CardRarity, string>> = {
  common: '--rarity-card-common',
  uncommon: '--rarity-card-uncommon',
  rare: '--rarity-card-rare',
  epic: '--rarity-card-epic',
  legendary: '--rarity-card-legendary',
};

export const GEAR_RARITY_VAR: Readonly<Record<GearRarity, string>> = {
  worn: '--rarity-gear-worn',
  sturdy: '--rarity-gear-sturdy',
  refined: '--rarity-gear-refined',
  ornate: '--rarity-gear-ornate',
  exalted: '--rarity-gear-exalted',
  mythic: '--rarity-gear-mythic',
};

/** Colour for a CARD's rarity frame. Never pass gear rarity here — it will not type-check. */
export function cardRarityColor(rarity: CardRarity): string {
  return `var(${CARD_RARITY_VAR[rarity]})`;
}

/** Colour for a GEAR tile background. Never pass card rarity here — it will not type-check. */
export function gearRarityColor(rarity: GearRarity): string {
  return `var(${GEAR_RARITY_VAR[rarity]})`;
}
