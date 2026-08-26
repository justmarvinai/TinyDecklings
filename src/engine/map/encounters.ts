/**
 * Resolving a vignette (Q16).
 *
 * A choice is a weighted table of outcomes, so the same node can pay out, cost, or
 * bite. Nothing here reaches into the player's save: the caller passes in what the
 * requirements need to read and applies whatever comes back, which keeps this pure
 * and testable (CLAUDE.md rule 7).
 */
import type { Content } from '@/content';
import type { CurrencyId, EncounterDef, Requirement, WeightedOutcome } from '@/content/schemas';
import type { Rng } from '../rng';
import { mergeBundles, rollLoot, type RewardBundle } from '../economy/rewards';

/** What a requirement needs to know about the player to answer. */
export interface EncounterContext {
  currencyOf: (currency: CurrencyId) => number;
  ownsCardClass: (cardClass: 'unit' | 'hero') => boolean;
  highestStage: number;
}

/** A `currency` requirement is a price: it gates the choice *and* is deducted. */
export function priceOf(requirement: Requirement | undefined): {
  currency: CurrencyId;
  amount: number;
} | null {
  if (!requirement || requirement.kind !== 'currency') return null;
  return { currency: requirement.currency as CurrencyId, amount: requirement.amount };
}

export function meetsRequirement(
  requirement: Requirement | undefined,
  context: EncounterContext,
): boolean {
  if (!requirement) return true;
  switch (requirement.kind) {
    case 'currency':
      return context.currencyOf(requirement.currency as CurrencyId) >= requirement.amount;
    case 'hasCardClass':
      return context.ownsCardClass(requirement.cardClass);
    case 'minStage':
      return context.highestStage >= requirement.stage;
  }
}

/** Why a choice is closed, as data — the UI writes the sentence (rule: no prose in the engine). */
export type ChoiceBlock =
  | { kind: 'currency'; currency: CurrencyId; needed: number; have: number }
  | { kind: 'hasCardClass'; cardClass: 'unit' | 'hero' }
  | { kind: 'minStage'; stage: number };

export interface ChoiceState {
  index: number;
  label: string;
  hint?: string;
  available: boolean;
  blocked?: ChoiceBlock;
  price: { currency: CurrencyId; amount: number } | null;
}

function describeBlock(requirement: Requirement, context: EncounterContext): ChoiceBlock {
  switch (requirement.kind) {
    case 'currency':
      return {
        kind: 'currency',
        currency: requirement.currency as CurrencyId,
        needed: requirement.amount,
        have: context.currencyOf(requirement.currency as CurrencyId),
      };
    case 'hasCardClass':
      return { kind: 'hasCardClass', cardClass: requirement.cardClass };
    case 'minStage':
      return { kind: 'minStage', stage: requirement.stage };
  }
}

/** Every choice on an encounter, with whether the player can actually take it. */
export function choiceStates(encounter: EncounterDef, context: EncounterContext): ChoiceState[] {
  return encounter.choices.map((choice, index) => {
    const available = meetsRequirement(choice.requires, context);
    return {
      index,
      label: choice.label,
      ...(choice.hint === undefined ? {} : { hint: choice.hint }),
      available,
      ...(available || !choice.requires
        ? {}
        : { blocked: describeBlock(choice.requires, context) }),
      price: priceOf(choice.requires),
    };
  });
}

export interface EncounterResolution {
  outcome: WeightedOutcome;
  rewards: RewardBundle;
  /** Deducted by the caller — a `currency` requirement is a price, not just a gate. */
  price: { currency: CurrencyId; amount: number } | null;
}

/**
 * Takes a choice and rolls its outcome.
 *
 * Throws on an unavailable choice rather than silently doing nothing: the UI is
 * responsible for disabling what the player cannot afford, and a silent no-op
 * there would look like a lost tap.
 */
export function resolveChoice(
  content: Content,
  encounter: EncounterDef,
  choiceIndex: number,
  context: EncounterContext,
  rng: Rng,
): EncounterResolution {
  const choice = encounter.choices[choiceIndex];
  if (!choice) throw new Error(`Encounter "${encounter.id}" has no choice ${choiceIndex}`);
  if (!meetsRequirement(choice.requires, context)) {
    throw new Error(`Choice "${choice.label}" on "${encounter.id}" is not available`);
  }

  const outcome = rng.pickWeighted(choice.outcomes, (o) => o.weight);
  const bundles = outcome.rewards
    .map((id) => content.lootTables.get(id))
    .filter((table): table is NonNullable<typeof table> => table !== undefined)
    .map((table) => rollLoot(content, table, rng));

  return { outcome, rewards: mergeBundles(bundles), price: priceOf(choice.requires) };
}
