/**
 * Vignettes: the event, treasure and camp nodes between fights (Q16).
 *
 * Every one is a prompt and up to three choices, and every choice is a weighted
 * table of outcomes — so a vignette can pay out, cost, or bite. A `currency`
 * requirement is a *price*: it gates the choice and is deducted when taken.
 * `minStage` and `hasCardClass` only gate.
 *
 * Prose is written in normal case on purpose; ALL CAPS hurts readability here
 * (CLAUDE.md rule 9).
 */
import type { EncounterDef } from '../schemas';

export const ENCOUNTER_DEFS: readonly EncounterDef[] = [
  // --- events ----------------------------------------------------------------
  {
    id: 'encounter.wrecked_caravan',
    kind: 'event',
    title: 'Wrecked Caravan',
    prompt:
      'A supply cart lies split open across the path. Most of it is ruined, but something under the tarp is still dry.',
    choices: [
      {
        label: 'Search it',
        hint: 'Takes time. Something is usually still worth taking.',
        outcomes: [
          {
            weight: 65,
            description: 'You pry up the tarp and find the crates underneath untouched.',
            rewards: ['loot.vignette_gold'],
          },
          {
            weight: 35,
            description: 'Whatever was worth taking was taken days ago. You leave with scraps.',
            rewards: ['loot.vignette_small'],
          },
        ],
      },
      {
        label: 'Move on',
        hint: 'Lose nothing, gain nothing.',
        outcomes: [{ weight: 1, description: 'You leave the wreck to the road.', rewards: [] }],
      },
    ],
  },
  {
    id: 'encounter.old_shrine',
    kind: 'event',
    title: 'Old Shrine',
    prompt:
      'A shrine leans against the rock, its bowl half full of rainwater. Older offerings are still visible at the bottom.',
    choices: [
      {
        label: 'Make an offering',
        hint: 'Costs 400 gold.',
        requires: { kind: 'currency', currency: 'gold', amount: 400 },
        outcomes: [
          {
            weight: 60,
            description:
              'The water stills. Your cards go into the next fight steady, and mending as they go.',
            rewards: ['loot.vignette_rich'],
            carriedStatus: { status: 'regen', side: 'player', stacks: 1 },
          },
          {
            weight: 40,
            description: 'Nothing answers, but the road ahead is a little easier to read.',
            rewards: ['loot.vignette_gold'],
          },
        ],
      },
      {
        label: 'Take the offerings',
        hint: 'Rude. Occasionally expensive.',
        outcomes: [
          {
            weight: 55,
            description: 'Coins, and no consequences you can see yet.',
            rewards: ['loot.vignette_rich'],
          },
          {
            weight: 45,
            description: 'Something notices. Your side starts the next fight poisoned.',
            rewards: ['loot.vignette_gold'],
            carriedStatus: { status: 'poison', side: 'player', stacks: 1 },
          },
        ],
      },
      {
        label: 'Leave it alone',
        outcomes: [{ weight: 1, description: 'You pass without touching it.', rewards: [] }],
      },
    ],
  },
  {
    id: 'encounter.wandering_scholar',
    kind: 'event',
    title: 'Wandering Scholar',
    prompt:
      'Someone is sitting on a milestone with a stack of books far too heavy to be carrying alone. They offer a trade.',
    choices: [
      {
        label: 'Buy a tome',
        hint: 'Costs 800 gold.',
        requires: { kind: 'currency', currency: 'gold', amount: 800 },
        outcomes: [
          {
            weight: 1,
            description: 'They hand over a tome and go back to reading.',
            rewards: ['loot.vignette_tomes'],
          },
        ],
      },
      {
        label: 'Trade stories instead',
        hint: 'Costs nothing. Your hero learns something.',
        requires: { kind: 'hasCardClass', cardClass: 'hero' },
        outcomes: [
          {
            weight: 1,
            description: 'They listen closely, and pay you back in what they know.',
            rewards: ['loot.vignette_xp'],
          },
        ],
      },
      {
        label: 'Walk past',
        outcomes: [{ weight: 1, description: 'They do not look up.', rewards: [] }],
      },
    ],
  },
  {
    id: 'encounter.collapsed_bridge',
    kind: 'event',
    title: 'Collapsed Bridge',
    prompt:
      'The bridge is down. There is a long way around, and a short way across the wreckage of it.',
    choices: [
      {
        label: 'Cross the wreckage',
        hint: 'Fast, and it costs you something.',
        outcomes: [
          {
            weight: 55,
            description: 'You pick your way over and find a cache wedged in the pilings.',
            rewards: ['loot.vignette_rich'],
          },
          {
            weight: 45,
            description:
              'Half the party goes into the water, and whatever was in it goes in with them.',
            rewards: ['loot.vignette_gold'],
            carriedStatus: { status: 'poison', side: 'player', stacks: 1 },
          },
        ],
      },
      {
        label: 'Take the long way',
        hint: 'Safe, and there is time to forage.',
        outcomes: [
          {
            weight: 1,
            description: 'The detour costs you a day and pays you in supplies.',
            rewards: ['loot.vignette_small'],
          },
        ],
      },
    ],
  },

  // --- treasure --------------------------------------------------------------
  {
    id: 'encounter.buried_cache',
    kind: 'treasure',
    title: 'Buried Cache',
    prompt: 'Someone hid this well, and then never came back for it.',
    choices: [
      {
        label: 'Open it',
        outcomes: [
          {
            weight: 1,
            description: 'Gear, wrapped in oilcloth and still sound.',
            rewards: ['loot.treasure_chest'],
          },
        ],
      },
    ],
  },
  {
    id: 'encounter.sealed_strongbox',
    kind: 'treasure',
    title: 'Sealed Strongbox',
    prompt: 'The lock is good work. Forcing it will ruin some of what is inside.',
    choices: [
      {
        label: 'Pay a locksmith',
        hint: 'Costs 600 gold. Nothing gets broken.',
        requires: { kind: 'currency', currency: 'gold', amount: 600 },
        outcomes: [
          {
            weight: 1,
            description: 'The lid comes up clean and everything inside is intact.',
            rewards: ['loot.treasure_rich'],
          },
        ],
      },
      {
        label: 'Force it',
        hint: 'Free, and you will lose some of it.',
        outcomes: [
          {
            weight: 70,
            description: 'The lid splinters. Most of what was inside survives.',
            rewards: ['loot.treasure_chest'],
          },
          {
            weight: 30,
            description: 'You crack it open onto the rocks. Half of it is scrap now.',
            rewards: ['loot.vignette_gold'],
          },
        ],
      },
    ],
  },
  {
    id: 'encounter.drowned_hoard',
    kind: 'treasure',
    title: 'Drowned Hoard',
    prompt: 'A chest sits in clear water, deeper down than it looks.',
    choices: [
      {
        label: 'Dive for it',
        outcomes: [
          {
            weight: 60,
            description: 'You come up with the whole thing.',
            rewards: ['loot.treasure_rich'],
          },
          {
            weight: 40,
            description:
              'You come up with what you could carry. Something came up with you, and it burns.',
            rewards: ['loot.treasure_chest'],
            carriedStatus: { status: 'burn', side: 'player', stacks: 1 },
          },
        ],
      },
      {
        label: 'Fish it out from the bank',
        hint: 'Slower, safer, smaller.',
        outcomes: [
          {
            weight: 1,
            description: 'You hook it and drag it in. Some of it stayed down there.',
            rewards: ['loot.treasure_chest'],
          },
        ],
      },
    ],
  },
  {
    id: 'encounter.tribute_pile',
    kind: 'treasure',
    title: 'Tribute Pile',
    prompt:
      'Coins, blades and small carved things, heaped at the foot of a standing stone. A tribute, and nobody watching it.',
    choices: [
      {
        label: 'Take the summoning tokens',
        outcomes: [
          {
            weight: 1,
            description: 'You pocket the medallions and leave the rest.',
            rewards: ['loot.treasure_tokens'],
          },
        ],
      },
      {
        label: 'Take the gear',
        outcomes: [
          {
            weight: 1,
            description: 'You take the blades and leave the medallions.',
            rewards: ['loot.treasure_chest'],
          },
        ],
      },
    ],
  },

  // --- camp ------------------------------------------------------------------
  {
    id: 'encounter.roadside_camp',
    kind: 'camp',
    title: 'Roadside Camp',
    prompt: 'Flat ground, dry wood, and no reason to keep walking tonight.',
    choices: [
      {
        label: 'Rest',
        hint: 'Everyone starts the next fight rested.',
        outcomes: [
          {
            weight: 1,
            description: 'You put out the fire at dawn and go on rested.',
            rewards: ['loot.camp_rest'],
            carriedStatus: { status: 'regen', side: 'player', stacks: 1 },
          },
        ],
      },
      {
        label: 'Train instead',
        hint: 'No rest. Your cards learn something.',
        outcomes: [
          {
            weight: 1,
            description: 'Nobody sleeps much, but everyone is sharper for it.',
            rewards: ['loot.camp_train'],
          },
        ],
      },
    ],
  },
  {
    id: 'encounter.hot_spring',
    kind: 'camp',
    title: 'Hot Spring',
    prompt: 'Steam off the rocks, and water hot enough to hurt in a good way.',
    choices: [
      {
        label: 'Soak',
        outcomes: [
          {
            weight: 1,
            description: 'You climb out an hour later feeling like a different party.',
            rewards: ['loot.camp_rest'],
            carriedStatus: { status: 'regen', side: 'player', stacks: 1 },
          },
        ],
      },
      {
        label: 'Fill every flask',
        hint: 'Carry the heat with you.',
        outcomes: [
          {
            weight: 1,
            description: 'The flasks go into packs still steaming.',
            rewards: ['loot.camp_energy'],
          },
        ],
      },
    ],
  },
  {
    id: 'encounter.old_watchtower',
    kind: 'camp',
    title: 'Old Watchtower',
    prompt: 'Half the roof is gone, but the walls are thick and the door still bars.',
    choices: [
      {
        label: 'Hold up for the night',
        outcomes: [
          {
            weight: 1,
            description: 'Nothing gets in. Everyone wakes up whole and stays that way a while.',
            rewards: ['loot.camp_rest'],
            carriedStatus: { status: 'regen', side: 'player', stacks: 1 },
          },
        ],
      },
      {
        label: 'Strip it for parts',
        hint: 'No rest, but the fittings are worth something.',
        outcomes: [
          {
            weight: 1,
            description: 'You leave with the hinges, the lamp brackets and the good nails.',
            rewards: ['loot.vignette_gold'],
          },
        ],
      },
    ],
  },
  {
    id: 'encounter.quiet_grove',
    kind: 'camp',
    title: 'Quiet Grove',
    prompt: 'Nothing moves here, and after the last few stages that is almost unsettling.',
    choices: [
      {
        label: 'Rest under the trees',
        outcomes: [
          {
            weight: 1,
            description: 'You sleep properly for the first time in days.',
            rewards: ['loot.camp_rest'],
            carriedStatus: { status: 'regen', side: 'player', stacks: 1 },
          },
        ],
      },
      {
        label: 'Read by the fire',
        hint: 'Study instead of sleep.',
        requires: { kind: 'minStage', stage: 5 },
        outcomes: [
          {
            weight: 1,
            description: 'You get through more of the tomes than you expected.',
            rewards: ['loot.vignette_tomes'],
          },
        ],
      },
    ],
  },
];
