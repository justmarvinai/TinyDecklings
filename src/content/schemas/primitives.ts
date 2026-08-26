/**
 * Shared schema building blocks.
 *
 * Every content schema in this folder is built from these, so id conventions and
 * numeric guards are enforced in exactly one place (CONTENT_SCHEMA.md §11).
 */
import { z } from 'zod';

/** Ids are `domain.snake_case` — e.g. `card.ember_drake` (CLAUDE.md conventions). */
export const idPattern = /^[a-z][a-z0-9]*\.[a-z][a-z0-9_]*$/;

export function id(domain: string) {
  return z
    .string()
    .regex(idPattern, `must look like "${domain}.snake_case"`)
    .refine((v) => v.startsWith(`${domain}.`), { message: `must start with "${domain}."` });
}

/** A reference to an id in another table; integrity is checked by the registry. */
export function ref(domain: string) {
  return id(domain);
}

export const positiveInt = z.number().int().positive();
export const nonNegativeInt = z.number().int().nonnegative();
export const ratio = z.number().min(0).max(1);
export const percent = z.number();

/** Inclusive integer range used by rewards and rolls. */
export const numberRange = z
  .strictObject({ min: z.number().int(), max: z.number().int() })
  .refine((r) => r.max >= r.min, { message: 'max must be >= min' });
export type NumberRange = z.infer<typeof numberRange>;

/** Duration in battle rounds; `battle` lasts until the fight ends. */
export const rounds = z.union([positiveInt, z.literal('battle')]);
export type Rounds = z.infer<typeof rounds>;

export const displayName = z.string().min(1).max(40);
