/**
 * Stage modifiers — the twist printed on an elite or boss medallion (Phase 4).
 *
 * Every one is a composition of the three modifier primitives, so a new twist is a
 * data entry and never an engine branch (rule 3). The player reads them on the
 * stage sheet before spending energy: risk is always visible before it is bought,
 * and every one pays a matching loot bonus.
 */
import type { StageModifierDef } from '../schemas';

export const STAGE_MODIFIER_DEFS: readonly StageModifierDef[] = [
  {
    id: 'modifier.frenzied',
    name: 'Frenzied',
    description: 'Enemies hit 25% harder.',
    iconKey: 'modifier.frenzied',
    appliesTo: ['elite', 'boss'],
    effects: [{ kind: 'statScale', side: 'enemy', stat: 'attack', percent: 25 }],
    rewardBonusPercent: 15,
  },
  {
    id: 'modifier.ironhide',
    name: 'Ironhide',
    description: 'Enemies carry 30% more Strength.',
    iconKey: 'modifier.ironhide',
    appliesTo: ['elite', 'boss'],
    effects: [{ kind: 'statScale', side: 'enemy', stat: 'strength', percent: 30 }],
    rewardBonusPercent: 15,
  },
  {
    id: 'modifier.endless_tide',
    name: 'Endless Tide',
    description: 'Two more enemies wait in reserve.',
    iconKey: 'modifier.endless_tide',
    appliesTo: ['battle', 'elite', 'boss'],
    effects: [{ kind: 'extraReinforcements', count: 2 }],
    rewardBonusPercent: 12,
  },
  {
    id: 'modifier.scorched',
    name: 'Scorched',
    description: 'Your whole side starts the fight burning.',
    iconKey: 'modifier.scorched',
    appliesTo: ['elite', 'boss'],
    effects: [{ kind: 'startingStatus', side: 'player', status: 'burn', stacks: 1 }],
    rewardBonusPercent: 18,
  },
  {
    id: 'modifier.choking_dust',
    name: 'Choking Dust',
    description: 'Grit in the air: your Attack drops 15%.',
    iconKey: 'modifier.choking_dust',
    appliesTo: ['elite', 'boss'],
    effects: [
      { kind: 'statScale', side: 'player', stat: 'attack', percent: -15 },
      { kind: 'startingStatus', side: 'player', status: 'weaken', stacks: 1 },
    ],
    rewardBonusPercent: 20,
  },
  {
    id: 'modifier.quickened',
    name: 'Quickened',
    description: 'Enemies move 40% faster and act first more often.',
    iconKey: 'modifier.quickened',
    appliesTo: ['elite', 'boss'],
    effects: [{ kind: 'statScale', side: 'enemy', stat: 'speed', percent: 40 }],
    rewardBonusPercent: 10,
  },
  {
    id: 'modifier.blessed_ground',
    name: 'Blessed Ground',
    description: 'Enemies regenerate every round.',
    iconKey: 'modifier.blessed_ground',
    appliesTo: ['elite', 'boss'],
    effects: [{ kind: 'startingStatus', side: 'enemy', status: 'regen', stacks: 1 }],
    rewardBonusPercent: 16,
  },
];

/**
 * How many modifiers a stage rolls, by kind and depth.
 *
 * The endless road gets stranger the further it goes: an elite in region one wears
 * one twist, an elite past stage 60 wears three.
 */
export const MODIFIER_COUNTS = {
  elite: { base: 1, perStages: 30, max: 3 },
  boss: { base: 1, perStages: 20, max: 3 },
} as const;
