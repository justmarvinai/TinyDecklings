/**
 * User-facing labels, in one place.
 *
 * Strings live centralized rather than scattered through components, so the later
 * i18n pass is a translation job rather than an archaeology one (Q30, CLAUDE.md
 * conventions). The engine never builds prose — it hands back structured facts and
 * this module turns them into words.
 */
import type { CurrencyId, ElementId, StageKind } from '@/content/schemas';

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
