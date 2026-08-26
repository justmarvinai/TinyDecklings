/**
 * User-facing labels, in one place.
 *
 * Strings live centralized rather than scattered through components, so the later
 * i18n pass is a translation job rather than an archaeology one (Q30, CLAUDE.md
 * conventions). The engine never builds prose — it hands back structured facts and
 * this module turns them into words.
 */
import type { CardRarity, CurrencyId, ElementId, GearRarity, StageKind } from '@/content/schemas';

export const CURRENCY_LABELS: Readonly<Record<CurrencyId, string>> = {
  gold: 'Gold',
  gems: 'Gems',
  energy: 'Energy',
  token_unit_t1: 'Recruit tokens',
  token_unit_t2: 'Veteran tokens',
  token_unit_t3: 'Champion tokens',
  token_hero: 'Hero tokens',
  fragment: 'Fragments',
  tome: 'Tomes',
};

export function currencyLabel(currency: CurrencyId | string): string {
  return CURRENCY_LABELS[currency as CurrencyId] ?? String(currency).replace(/_/g, ' ');
}

export const ELEMENT_LABELS: Readonly<Record<ElementId, string>> = {
  nature: 'Nature',
  fire: 'Fire',
  ice: 'Ice',
  lightning: 'Lightning',
  dark: 'Dark',
};

export function elementLabel(element: ElementId): string {
  return ELEMENT_LABELS[element];
}

export const STAGE_KIND_LABELS: Readonly<Record<StageKind, string>> = {
  battle: 'Battle',
  elite: 'Elite',
  boss: 'Boss',
  event: 'Event',
  treasure: 'Treasure',
  camp: 'Camp',
};

export function stageKindLabel(kind: StageKind): string {
  return STAGE_KIND_LABELS[kind];
}

/**
 * Card rarity names.
 *
 * Rarity is shown in colour everywhere, so it also has to be shown in words:
 * colour is a cue, never the only one (Q28).
 */
export const CARD_RARITY_LABELS: Readonly<Record<CardRarity, string>> = {
  common: 'Common',
  uncommon: 'Uncommon',
  rare: 'Rare',
  epic: 'Epic',
  legendary: 'Legendary',
};

export function cardRarityLabel(rarity: CardRarity): string {
  return CARD_RARITY_LABELS[rarity];
}

/** Gear rarity names — a separate ladder from cards (CLAUDE.md rule 4). */
export const GEAR_RARITY_LABELS: Readonly<Record<GearRarity, string>> = {
  worn: 'Worn',
  sturdy: 'Sturdy',
  refined: 'Refined',
  ornate: 'Ornate',
  exalted: 'Exalted',
  mythic: 'Mythic',
};

export function gearRarityLabel(rarity: GearRarity): string {
  return GEAR_RARITY_LABELS[rarity];
}
