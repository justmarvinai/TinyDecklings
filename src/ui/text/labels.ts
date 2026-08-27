/**
 * User-facing labels, in one place.
 *
 * Strings live centralized rather than scattered through components, so the later
 * i18n pass is a translation job rather than an archaeology one (Q30, CLAUDE.md
 * conventions). The engine never builds prose — it hands back structured facts and
 * this module turns them into words.
 */
import type {
  AttackType,
  CardRarity,
  CurrencyId,
  ElementId,
  GearRarity,
  StageKind,
} from '@/content/schemas';
import { CARD_RARITY_LABEL, GEAR_RARITY_LABEL } from '@/content/schemas';

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

/**
 * How a card fights, said in words rather than in an icon.
 *
 * "Melee" and "ranged" are jargon for where a unit stands; the reference calls them
 * what they are, and so does the collection tile the player reads at a glance.
 */
export const ATTACK_TYPE_LABELS: Readonly<Record<AttackType, string>> = {
  melee: 'Front row',
  ranged: 'Ranged',
};

export function attackTypeLabel(type: AttackType): string {
  return ATTACK_TYPE_LABELS[type];
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
 * Rarity names live in `content/schemas/rarity.ts` beside the ladders themselves,
 * re-exported here so screens have one import for "what do I call this".
 * Rarity is shown in colour everywhere, so it also has to be shown in words:
 * colour is a cue, never the only one (Q28).
 */
export { CARD_RARITY_LABEL, GEAR_RARITY_LABEL } from '@/content/schemas';

export function cardRarityLabel(rarity: CardRarity): string {
  return CARD_RARITY_LABEL[rarity];
}

export function gearRarityLabel(rarity: GearRarity): string {
  return GEAR_RARITY_LABEL[rarity];
}
