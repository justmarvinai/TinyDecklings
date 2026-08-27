/**
 * Status effects (Q20). The slice ships burn, shield and stun; the rest are
 * authored now so content and UI can reference them from Phase 2 onward.
 */
import type { StatusDef } from '../schemas';

export const STATUS_DEFS: readonly StatusDef[] = [
  {
    id: 'burn',
    name: 'Burn',
    description: 'Burning away at the end of every round, and it stacks.',
    iconKey: 'status.burn',
    stacking: 'stack',
    maxStacks: 3,
    tick: {
      on: 'roundEnd',
      action: { kind: 'damage', amount: { percentOfStrength: 4, of: 'target' } },
    },
    blocksAction: false,
  },
  {
    id: 'poison',
    name: 'Poison',
    description: 'Losing health every round, and it stacks deeper than burn.',
    iconKey: 'status.poison',
    stacking: 'stack',
    maxStacks: 5,
    tick: { on: 'roundEnd', action: { kind: 'damage', amount: { base: 20 } } },
    blocksAction: false,
  },
  {
    id: 'freeze',
    name: 'Freeze',
    description: 'Frozen solid — cannot act until it thaws.',
    iconKey: 'status.freeze',
    stacking: 'refresh',
    blocksAction: true,
  },
  {
    id: 'stun',
    name: 'Stun',
    description: 'Stunned — loses its turn entirely.',
    iconKey: 'status.stun',
    stacking: 'refresh',
    blocksAction: true,
  },
  {
    id: 'taunt',
    name: 'Taunt',
    description: 'Drawing every attack it can: enemies go for this one first.',
    iconKey: 'status.taunt',
    stacking: 'refresh',
    blocksAction: false,
  },
  {
    id: 'weaken',
    name: 'Weaken',
    description: 'Hitting softer than it should.',
    iconKey: 'status.weaken',
    stacking: 'refresh',
    blocksAction: false,
  },
  {
    id: 'strengthen',
    name: 'Strengthen',
    description: 'Hitting harder than it should.',
    iconKey: 'status.strengthen',
    stacking: 'refresh',
    blocksAction: false,
  },
  {
    id: 'regen',
    name: 'Regen',
    description: 'Healing a little at the start of every round.',
    iconKey: 'status.regen',
    stacking: 'refresh',
    tick: {
      on: 'roundStart',
      action: { kind: 'heal', amount: { percentOfStrength: 6, of: 'self' } },
    },
    blocksAction: false,
  },
  {
    id: 'shield',
    name: 'Shield',
    description: 'Soaking damage until the shield is spent.',
    iconKey: 'status.shield',
    stacking: 'refresh',
    blocksAction: false,
  },
];
