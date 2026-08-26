/**
 * Status effects (Q20). The slice ships burn, shield and stun; the rest are
 * authored now so content and UI can reference them from Phase 2 onward.
 */
import type { StatusDef } from '../schemas';

export const STATUS_DEFS: readonly StatusDef[] = [
  {
    id: 'burn',
    name: 'Burn',
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
    iconKey: 'status.poison',
    stacking: 'stack',
    maxStacks: 5,
    tick: { on: 'roundEnd', action: { kind: 'damage', amount: { base: 20 } } },
    blocksAction: false,
  },
  {
    id: 'freeze',
    name: 'Freeze',
    iconKey: 'status.freeze',
    stacking: 'refresh',
    blocksAction: true,
  },
  { id: 'stun', name: 'Stun', iconKey: 'status.stun', stacking: 'refresh', blocksAction: true },
  { id: 'taunt', name: 'Taunt', iconKey: 'status.taunt', stacking: 'refresh', blocksAction: false },
  {
    id: 'weaken',
    name: 'Weaken',
    iconKey: 'status.weaken',
    stacking: 'refresh',
    blocksAction: false,
  },
  {
    id: 'strengthen',
    name: 'Strengthen',
    iconKey: 'status.strengthen',
    stacking: 'refresh',
    blocksAction: false,
  },
  {
    id: 'regen',
    name: 'Regen',
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
    iconKey: 'status.shield',
    stacking: 'refresh',
    blocksAction: false,
  },
];
