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
import type { DifficultyBand } from '@/engine/map/difficulty';

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

/**
 * How a fight is going to go, in words.
 *
 * The engine hands back a band; these are the sentence. Deliberately about the
 * fight rather than about the player — "outmatched" describes the odds, where
 * "you are too weak" describes them.
 */
export const DIFFICULTY_LABELS: Readonly<Record<DifficultyBand, string>> = {
  comfortable: 'Comfortable',
  fair: 'A fair fight',
  stretch: 'A stretch',
  outmatched: 'Outmatched',
};

export function difficultyLabel(band: DifficultyBand): string {
  return DIFFICULTY_LABELS[band];
}

/** The tone each band is drawn in — green through red, as everywhere else. */
export const DIFFICULTY_TONES: Readonly<Record<DifficultyBand, string>> = {
  comfortable: 'var(--accent-positive-bright)',
  fair: 'var(--accent-info-bright)',
  stretch: 'var(--accent-warning)',
  outmatched: 'var(--accent-danger-bright)',
};

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

/**
 * A number sized to fit in a card corner.
 *
 * The road never ends (Q11), so strength and attack keep climbing and no fixed
 * layout survives being handed an unbounded digit count — a five-figure strength
 * either pushes the attack pill off the card or gets clipped to `7…`, and the
 * number the whole fight is about is the last one that should go. Capping the
 * width at five characters keeps both readable forever: exact where exactness is
 * legible, rounded once it stops being.
 */
export function compactNumber(value: number): string {
  const n = Math.round(value);
  const sign = n < 0 ? '-' : '';
  let abs = Math.abs(n);
  if (abs < 10_000) return `${sign}${abs}`;
  let tier = 0;
  // 999.5 rather than 1000, so a number that rounds to four digits climbs a tier
  // instead of printing "1000K".
  while (abs >= 999.5 && tier < SUFFIXES.length - 1) {
    abs /= 1000;
    tier++;
  }
  // Past the last suffix there is nothing left to say but "more than this".
  if (abs >= 999.5) return `${sign}999${SUFFIXES[tier]}+`;
  return `${sign}${scaled(abs)}${SUFFIXES[tier]}`;
}

/** Thousands, millions, billions, trillions — and then the game has other problems. */
const SUFFIXES = ['', 'K', 'M', 'B', 'T'] as const;

/** One decimal while it still says something, none once it does not. */
function scaled(value: number): string {
  return value < 100 ? value.toFixed(1).replace(/\.0$/, '') : String(Math.round(value));
}
