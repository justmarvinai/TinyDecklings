/**
 * Effects — the data-driven core.
 *
 * New card behaviour is composed from these primitives in content data; adding a
 * card must never mean writing engine or UI code (CLAUDE.md rule 3). Genuinely
 * unique behaviour uses the `scripted` action, which resolves against a small
 * typed registry and is expected to stay rare.
 */
import { z } from 'zod';
import { attackType, element, statKey } from './stats';
import { id, percent, ratio, ref, rounds } from './primitives';
import { ICON_KEYS } from './iconKeys';

export const EFFECT_TRIGGERS = [
  'onCast',
  'onAttack',
  'onHit',
  'onKill',
  'onDamaged',
  'onDeath',
  'onDeploy',
  'onRoundStart',
  'onRoundEnd',
  'passive',
] as const;
export type EffectTrigger = (typeof EFFECT_TRIGGERS)[number];
export const effectTrigger = z.enum(EFFECT_TRIGGERS);

export const STATUS_IDS = [
  'burn',
  'poison',
  'freeze',
  'stun',
  'taunt',
  'weaken',
  'strengthen',
  'regen',
  'shield',
] as const;
export type StatusId = (typeof STATUS_IDS)[number];
export const statusId = z.enum(STATUS_IDS);

export const TARGET_SCOPES = [
  'single',
  'row',
  'column',
  'all',
  'random',
  'lowestHp',
  'highestHp',
  'pattern',
] as const;
export const targetScope = z.enum(TARGET_SCOPES);

export const targetFilter = z
  .strictObject({
    side: z.enum(['ally', 'enemy', 'self']),
    scope: targetScope,
    pattern: ref('pattern').optional(),
    where: z
      .strictObject({
        attackType: attackType.optional(),
        element: element.optional(),
        hasStatus: statusId.optional(),
      })
      .optional(),
  })
  .refine((t) => t.scope !== 'pattern' || t.pattern !== undefined, {
    message: 'scope "pattern" requires a pattern id',
  });
export type TargetFilter = z.infer<typeof targetFilter>;

/** How big an effect is — expressive, but still pure data. */
export const magnitude = z.union([
  z.strictObject({ base: z.number() }),
  z.strictObject({ percentOfAttack: percent }),
  z.strictObject({ percentOfStrength: percent, of: z.enum(['self', 'target']) }),
]);
export type Magnitude = z.infer<typeof magnitude>;

export const effectAction = z.discriminatedUnion('kind', [
  z.strictObject({ kind: z.literal('damage'), amount: magnitude }),
  z.strictObject({ kind: z.literal('heal'), amount: magnitude }),
  z.strictObject({ kind: z.literal('shield'), amount: magnitude, duration: rounds }),
  z.strictObject({
    kind: z.literal('applyStatus'),
    status: statusId,
    duration: rounds,
    potency: magnitude.optional(),
  }),
  z.strictObject({
    kind: z.literal('cleanse'),
    statuses: z.union([z.array(statusId).min(1), z.literal('all')]),
  }),
  z.strictObject({
    kind: z.literal('modifyStat'),
    stat: statKey,
    percent,
    duration: rounds,
  }),
  z.strictObject({
    kind: z.literal('summon'),
    cardId: ref('card'),
    slotPreference: z.enum(['front', 'back']),
  }),
  z.strictObject({ kind: z.literal('taunt'), duration: rounds }),
  /** Escape hatch for truly unique behaviour; every script id is documented. */
  z.strictObject({ kind: z.literal('scripted'), scriptId: id('script') }),
]);
export type EffectAction = z.infer<typeof effectAction>;

export const effectDef = z.strictObject({
  trigger: effectTrigger,
  target: targetFilter,
  action: effectAction,
  chance: ratio.optional(),
});
export type EffectDef = z.infer<typeof effectDef>;

export const statusDef = z.strictObject({
  id: statusId,
  name: z.string().min(1),
  /**
   * What it does to whoever is carrying it, in one sentence.
   *
   * Authored rather than derived: the UI could assemble something from `tick` and
   * `blocksAction`, but "deals 4% of their strength at the end of every round" is a
   * rules dump, and the engine is not allowed to write prose anyway.
   */
  description: z.string().min(1),
  iconKey: z.enum(ICON_KEYS),
  stacking: z.enum(['refresh', 'stack', 'ignore']),
  maxStacks: z.number().int().positive().optional(),
  tick: z.strictObject({ on: z.enum(['roundStart', 'roundEnd']), action: effectAction }).optional(),
  /** Freeze and stun block the card's action for the duration. */
  blocksAction: z.boolean().default(false),
});
export type StatusDef = z.infer<typeof statusDef>;

/** Grid shapes over the 2x3 board, anchored on the chosen target. */
export const attackPatternDef = z.strictObject({
  id: id('pattern'),
  name: z.string().min(1),
  cells: z.array(z.tuple([z.number().int(), z.number().int()])).min(1),
  falloff: ratio.optional(),
});
export type AttackPatternDef = z.infer<typeof attackPatternDef>;
