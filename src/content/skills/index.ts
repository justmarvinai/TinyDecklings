/**
 * Slice skills (Q18: one skill per card in the vertical slice).
 *
 * Every skill is a bundle of effect primitives — no bespoke engine code per card
 * (CLAUDE.md rule 3). Cooldowns are in rounds; the battle card's badge counts them
 * down (Q4).
 */
import type { SkillDef } from '../schemas';

export const SKILL_DEFS: readonly SkillDef[] = [
  {
    id: 'skill.cinder_volley',
    name: 'Cinder Volley',
    description: 'Scorches an enemy row, setting them alight.',
    iconKey: 'status.burn',
    cooldown: 3,
    maxLevel: 5,
    attackPattern: 'pattern.row',
    effects: [
      {
        trigger: 'onCast',
        target: { side: 'enemy', scope: 'pattern', pattern: 'pattern.row' },
        action: { kind: 'damage', amount: { percentOfAttack: 90 } },
      },
      {
        trigger: 'onCast',
        target: { side: 'enemy', scope: 'pattern', pattern: 'pattern.row' },
        action: { kind: 'applyStatus', status: 'burn', duration: 2 },
        chance: 0.6,
      },
    ],
    scaling: { flatPerLevel: 0, multiplierPerLevel: 1.12 },
  },
  {
    id: 'skill.frost_lance',
    name: 'Frost Lance',
    description: 'A piercing shard that can freeze its target solid.',
    iconKey: 'status.freeze',
    cooldown: 3,
    maxLevel: 5,
    effects: [
      {
        trigger: 'onCast',
        target: { side: 'enemy', scope: 'single' },
        action: { kind: 'damage', amount: { percentOfAttack: 140 } },
      },
      {
        trigger: 'onCast',
        target: { side: 'enemy', scope: 'single' },
        action: { kind: 'applyStatus', status: 'freeze', duration: 1 },
        chance: 0.35,
      },
    ],
    scaling: { flatPerLevel: 0, multiplierPerLevel: 1.14 },
  },
  {
    id: 'skill.guard_stance',
    name: 'Guard Stance',
    description: 'Raises a shield over the front line.',
    iconKey: 'status.shield',
    cooldown: 4,
    maxLevel: 5,
    effects: [
      {
        trigger: 'onCast',
        target: { side: 'ally', scope: 'row' },
        action: { kind: 'shield', amount: { percentOfStrength: 18, of: 'self' }, duration: 2 },
      },
    ],
    scaling: { flatPerLevel: 0, multiplierPerLevel: 1.1 },
  },
  {
    id: 'skill.rally_cry',
    name: 'Rally Cry',
    description: 'Steels every ally, raising their attack.',
    iconKey: 'status.strengthen',
    cooldown: 4,
    maxLevel: 5,
    effects: [
      {
        trigger: 'onCast',
        target: { side: 'ally', scope: 'all' },
        action: { kind: 'modifyStat', stat: 'attack', percent: 20, duration: 2 },
      },
      {
        trigger: 'onCast',
        target: { side: 'ally', scope: 'all' },
        action: { kind: 'applyStatus', status: 'strengthen', duration: 2 },
      },
    ],
    scaling: { flatPerLevel: 2, multiplierPerLevel: 1 },
  },
  {
    id: 'skill.venom_bite',
    name: 'Venom Bite',
    description: 'A foul bite that keeps working after it lands.',
    iconKey: 'status.poison',
    cooldown: 2,
    maxLevel: 5,
    effects: [
      {
        trigger: 'onCast',
        target: { side: 'enemy', scope: 'single' },
        action: { kind: 'damage', amount: { percentOfAttack: 100 } },
      },
      {
        trigger: 'onCast',
        target: { side: 'enemy', scope: 'single' },
        action: { kind: 'applyStatus', status: 'poison', duration: 3 },
      },
    ],
    scaling: { flatPerLevel: 0, multiplierPerLevel: 1.12 },
  },
  {
    id: 'skill.thunder_clap',
    name: 'Thunder Clap',
    description: 'A shockwave across the whole enemy board.',
    iconKey: 'status.stun',
    cooldown: 5,
    maxLevel: 5,
    attackPattern: 'pattern.all',
    effects: [
      {
        trigger: 'onCast',
        target: { side: 'enemy', scope: 'all' },
        action: { kind: 'damage', amount: { percentOfAttack: 70 } },
      },
      {
        trigger: 'onCast',
        target: { side: 'enemy', scope: 'all' },
        action: { kind: 'applyStatus', status: 'stun', duration: 1 },
        chance: 0.25,
      },
    ],
    scaling: { flatPerLevel: 0, multiplierPerLevel: 1.15 },
  },
  {
    id: 'skill.tide_surge',
    name: 'Tide Surge',
    description: 'The boss drags the battlefield under, weakening all who stand.',
    iconKey: 'status.weaken',
    cooldown: 3,
    maxLevel: 5,
    effects: [
      {
        trigger: 'onCast',
        target: { side: 'enemy', scope: 'all' },
        action: { kind: 'damage', amount: { percentOfAttack: 85 } },
      },
      {
        trigger: 'onCast',
        target: { side: 'enemy', scope: 'all' },
        action: { kind: 'modifyStat', stat: 'attack', percent: -15, duration: 2 },
      },
    ],
    scaling: { flatPerLevel: 0, multiplierPerLevel: 1.1 },
  },
  {
    id: 'skill.mend_spore',
    name: 'Mend Spore',
    description: 'Restores the most wounded ally.',
    iconKey: 'status.regen',
    cooldown: 3,
    maxLevel: 5,
    effects: [
      {
        trigger: 'onCast',
        target: { side: 'ally', scope: 'lowestHp' },
        action: { kind: 'heal', amount: { percentOfStrength: 22, of: 'target' } },
      },
      {
        trigger: 'onCast',
        target: { side: 'ally', scope: 'lowestHp' },
        action: { kind: 'applyStatus', status: 'regen', duration: 2 },
      },
    ],
    scaling: { flatPerLevel: 0, multiplierPerLevel: 1.12 },
  },
];
