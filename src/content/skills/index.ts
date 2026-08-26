/**
 * Skills.
 *
 * Every skill is a bundle of effect primitives — no bespoke engine code per card
 * (CLAUDE.md rule 3). Cooldowns are in rounds; the battle card's badge counts them
 * down (Q4).
 *
 * Cards carry up to five, each gated behind a star grade, so ascension always
 * unlocks something concrete (Q18).
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
  {
    id: 'skill.riptide_slash',
    name: 'Riptide Slash',
    description: 'One brutal strike that ignores nothing and forgives less.',
    iconKey: 'attackType.melee',
    cooldown: 3,
    maxLevel: 5,
    effects: [
      {
        trigger: 'onCast',
        target: { side: 'enemy', scope: 'single' },
        action: { kind: 'damage', amount: { percentOfAttack: 210 } },
      },
    ],
    scaling: { flatPerLevel: 0, multiplierPerLevel: 1.14 },
  },
  {
    id: 'skill.chill_wind',
    name: 'Chill Wind',
    description: 'Saps the strength from every enemy on the board.',
    iconKey: 'status.weaken',
    cooldown: 4,
    maxLevel: 5,
    effects: [
      {
        trigger: 'onCast',
        target: { side: 'enemy', scope: 'all' },
        action: { kind: 'modifyStat', stat: 'attack', percent: -22, duration: 2 },
      },
      {
        trigger: 'onCast',
        target: { side: 'enemy', scope: 'all' },
        action: { kind: 'applyStatus', status: 'weaken', duration: 2 },
      },
    ],
    scaling: { flatPerLevel: 0, multiplierPerLevel: 1.06 },
  },
  {
    id: 'skill.spore_burst',
    name: 'Spore Burst',
    description: 'Chokes an enemy column with creeping rot.',
    iconKey: 'status.poison',
    cooldown: 3,
    maxLevel: 5,
    effects: [
      {
        trigger: 'onCast',
        target: { side: 'enemy', scope: 'column' },
        action: { kind: 'damage', amount: { percentOfAttack: 80 } },
      },
      {
        trigger: 'onCast',
        target: { side: 'enemy', scope: 'column' },
        action: { kind: 'applyStatus', status: 'poison', duration: 3 },
      },
    ],
    scaling: { flatPerLevel: 0, multiplierPerLevel: 1.12 },
  },
  {
    id: 'skill.second_wind',
    name: 'Second Wind',
    description: 'Shakes off what ails you and closes your wounds.',
    iconKey: 'status.regen',
    cooldown: 4,
    maxLevel: 5,
    effects: [
      {
        trigger: 'onCast',
        target: { side: 'self', scope: 'single' },
        action: { kind: 'cleanse', statuses: 'all' },
      },
      {
        trigger: 'onCast',
        target: { side: 'self', scope: 'single' },
        action: { kind: 'heal', amount: { percentOfStrength: 30, of: 'self' } },
      },
    ],
    scaling: { flatPerLevel: 0, multiplierPerLevel: 1.1 },
  },
  {
    id: 'skill.bulwark_call',
    name: 'Bulwark Call',
    description: 'Plants your feet and dares them to come.',
    iconKey: 'status.taunt',
    cooldown: 4,
    maxLevel: 5,
    effects: [
      {
        trigger: 'onCast',
        target: { side: 'self', scope: 'single' },
        action: { kind: 'taunt', duration: 2 },
      },
      {
        trigger: 'onCast',
        target: { side: 'self', scope: 'single' },
        action: { kind: 'shield', amount: { percentOfStrength: 25, of: 'self' }, duration: 2 },
      },
    ],
    scaling: { flatPerLevel: 0, multiplierPerLevel: 1.1 },
  },

  // --- Phase 7: the breadth pass ---------------------------------------------
  // Ten more, so a thirty-card roster is not five skills wearing thirty names.
  // Every one is still a composition of the same primitives (rule 3).
  {
    id: 'skill.searing_lash',
    name: 'Searing Lash',
    description: 'A whipcrack of flame across the enemy front.',
    iconKey: 'status.burn',
    cooldown: 3,
    maxLevel: 5,
    attackPattern: 'pattern.row',
    effects: [
      {
        trigger: 'onCast',
        target: { side: 'enemy', scope: 'pattern', pattern: 'pattern.row' },
        action: { kind: 'damage', amount: { percentOfAttack: 85 } },
      },
      {
        trigger: 'onCast',
        target: { side: 'enemy', scope: 'lowestHp' },
        action: { kind: 'applyStatus', status: 'burn', duration: 3 },
      },
    ],
    scaling: { flatPerLevel: 0, multiplierPerLevel: 1.11 },
  },
  {
    id: 'skill.stone_skin',
    name: 'Stone Skin',
    description: 'Hardens an ally until the blows stop landing.',
    iconKey: 'status.shield',
    cooldown: 4,
    maxLevel: 5,
    effects: [
      {
        trigger: 'onCast',
        target: { side: 'ally', scope: 'lowestHp' },
        action: { kind: 'shield', amount: { percentOfStrength: 22, of: 'self' }, duration: 3 },
      },
      {
        trigger: 'onCast',
        target: { side: 'ally', scope: 'lowestHp' },
        action: { kind: 'modifyStat', stat: 'strength', percent: 10, duration: 3 },
      },
    ],
    scaling: { flatPerLevel: 0, multiplierPerLevel: 1.09 },
  },
  {
    id: 'skill.gale_step',
    name: 'Gale Step',
    description: 'The whole line moves quicker than it has any right to.',
    iconKey: 'stat.speed',
    cooldown: 4,
    maxLevel: 5,
    effects: [
      {
        trigger: 'onCast',
        target: { side: 'ally', scope: 'all' },
        action: { kind: 'modifyStat', stat: 'speed', percent: 25, duration: 3 },
      },
      {
        trigger: 'onCast',
        target: { side: 'ally', scope: 'all' },
        action: { kind: 'applyStatus', status: 'strengthen', duration: 3 },
      },
    ],
    scaling: { flatPerLevel: 2, multiplierPerLevel: 1 },
  },
  {
    id: 'skill.hollow_grasp',
    name: 'Hollow Grasp',
    description: 'Drags the life out of one target and hands it back.',
    iconKey: 'status.regen',
    cooldown: 3,
    maxLevel: 5,
    effects: [
      {
        trigger: 'onCast',
        target: { side: 'enemy', scope: 'highestHp' },
        action: { kind: 'damage', amount: { percentOfAttack: 130 } },
      },
      {
        trigger: 'onCast',
        target: { side: 'self', scope: 'single' },
        action: { kind: 'heal', amount: { percentOfStrength: 12, of: 'self' } },
      },
    ],
    scaling: { flatPerLevel: 0, multiplierPerLevel: 1.13 },
  },
  {
    id: 'skill.static_field',
    name: 'Static Field',
    description: 'Charge jumps the whole enemy column and stuns what it finds.',
    iconKey: 'status.stun',
    cooldown: 4,
    maxLevel: 5,
    effects: [
      {
        trigger: 'onCast',
        target: { side: 'enemy', scope: 'column' },
        action: { kind: 'damage', amount: { percentOfAttack: 95 } },
      },
      {
        trigger: 'onCast',
        target: { side: 'enemy', scope: 'column' },
        action: { kind: 'applyStatus', status: 'stun', duration: 1 },
        chance: 0.3,
      },
    ],
    scaling: { flatPerLevel: 0, multiplierPerLevel: 1.12 },
  },
  {
    id: 'skill.warding_hymn',
    name: 'Warding Hymn',
    description: 'Clears what is eating at the party and shields them.',
    iconKey: 'status.shield',
    cooldown: 5,
    maxLevel: 5,
    effects: [
      {
        trigger: 'onCast',
        target: { side: 'ally', scope: 'all' },
        action: { kind: 'cleanse', statuses: ['burn', 'poison'] },
      },
      {
        trigger: 'onCast',
        target: { side: 'ally', scope: 'all' },
        action: { kind: 'shield', amount: { percentOfStrength: 12, of: 'self' }, duration: 2 },
      },
    ],
    scaling: { flatPerLevel: 0, multiplierPerLevel: 1.08 },
  },
  {
    id: 'skill.avalanche',
    name: 'Avalanche',
    description: 'Brings the whole slope down on them.',
    iconKey: 'status.freeze',
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
        target: { side: 'enemy', scope: 'random' },
        action: { kind: 'applyStatus', status: 'freeze', duration: 1 },
      },
    ],
    scaling: { flatPerLevel: 0, multiplierPerLevel: 1.15 },
  },
  {
    id: 'skill.iron_vow',
    name: 'Iron Vow',
    description: 'Draws every blade toward the one who can take them.',
    iconKey: 'status.taunt',
    cooldown: 4,
    maxLevel: 5,
    effects: [
      {
        trigger: 'onCast',
        target: { side: 'self', scope: 'single' },
        action: { kind: 'taunt', duration: 2 },
      },
      {
        trigger: 'onCast',
        target: { side: 'self', scope: 'single' },
        action: { kind: 'shield', amount: { percentOfStrength: 25, of: 'self' }, duration: 2 },
      },
    ],
    scaling: { flatPerLevel: 0, multiplierPerLevel: 1.1 },
  },
  {
    id: 'skill.blight_bloom',
    name: 'Blight Bloom',
    description: 'Rot opens across the enemy board and keeps opening.',
    iconKey: 'status.poison',
    cooldown: 4,
    maxLevel: 5,
    effects: [
      {
        trigger: 'onCast',
        target: { side: 'enemy', scope: 'all' },
        action: { kind: 'applyStatus', status: 'poison', duration: 4 },
      },
      {
        trigger: 'onCast',
        target: { side: 'enemy', scope: 'all' },
        action: { kind: 'modifyStat', stat: 'attack', percent: -12, duration: 2 },
      },
    ],
    scaling: { flatPerLevel: 0, multiplierPerLevel: 1.07 },
  },
  {
    id: 'skill.last_light',
    name: 'Last Light',
    description: 'Pulls the whole party back from the edge at once.',
    iconKey: 'status.regen',
    cooldown: 6,
    maxLevel: 5,
    effects: [
      {
        trigger: 'onCast',
        target: { side: 'ally', scope: 'all' },
        action: { kind: 'heal', amount: { percentOfStrength: 18, of: 'target' } },
      },
      {
        trigger: 'onCast',
        target: { side: 'ally', scope: 'all' },
        action: { kind: 'applyStatus', status: 'regen', duration: 3 },
      },
    ],
    scaling: { flatPerLevel: 0, multiplierPerLevel: 1.1 },
  },
];
