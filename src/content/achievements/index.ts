/**
 * Achievements-lite (Q23).
 *
 * Every one names a metric from `PROFILE_METRICS` and a target. Those metrics are
 * derived from the save, so an achievement earns itself the moment the save says
 * so — there is no tally to keep in step, and an achievement added later is
 * correctly earned by a player who already did the thing.
 *
 * Rewards are small and in currency the player earns (CLAUDE.md rule 12). The
 * registry refuses a target the shipped content could never reach.
 */
import type { AchievementDef } from '../schemas';

export const ACHIEVEMENT_DEFS: readonly AchievementDef[] = [
  // --- the journey -----------------------------------------------------------
  {
    id: 'achievement.first_steps',
    name: 'First Steps',
    description: 'Win your first battle.',
    iconKey: 'record.steps',
    group: 'journey',
    metric: 'battlesWon',
    target: 1,
    reward: { kind: 'currency', currency: 'gold', amount: { min: 200, max: 200 } },
  },
  {
    id: 'achievement.isles_behind_you',
    name: 'The Isles Behind You',
    description: 'Clear a whole region, boss and all.',
    iconKey: 'stage.boss',
    group: 'journey',
    metric: 'regionsCleared',
    target: 1,
    reward: { kind: 'currency', currency: 'gems', amount: { min: 25, max: 25 } },
  },
  {
    id: 'achievement.three_roads',
    name: 'Three Roads Walked',
    description: 'Clear all three regions.',
    iconKey: 'award.laurels',
    group: 'journey',
    metric: 'regionsCleared',
    target: 3,
    reward: { kind: 'currency', currency: 'token_hero', amount: { min: 2, max: 2 } },
  },
  {
    id: 'achievement.endless_walker',
    name: 'The Road Goes On',
    description: 'Walk past the end of the authored road, to stage 31.',
    iconKey: 'record.progress',
    group: 'journey',
    metric: 'furthestStage',
    target: 31,
    reward: { kind: 'currency', currency: 'gems', amount: { min: 50, max: 50 } },
  },
  {
    id: 'achievement.road_not_taken',
    name: 'The Road Not Taken',
    description: 'Walk the risky side of a fork.',
    iconKey: 'map.fork',
    group: 'journey',
    metric: 'riskyForksWalked',
    target: 1,
    reward: { kind: 'currency', currency: 'gold', amount: { min: 600, max: 600 } },
  },
  {
    id: 'achievement.wanderer',
    name: 'Wanderer',
    description: 'Resolve ten vignettes on the road.',
    iconKey: 'stage.event',
    group: 'journey',
    metric: 'vignettesResolved',
    target: 10,
    reward: { kind: 'currency', currency: 'tome', amount: { min: 5, max: 5 } },
  },
  {
    id: 'achievement.chest_hunter',
    name: 'Chest Hunter',
    description: 'Open six region star chests.',
    iconKey: 'map.chest',
    group: 'journey',
    metric: 'chestsOpened',
    target: 6,
    reward: { kind: 'currency', currency: 'gems', amount: { min: 40, max: 40 } },
  },

  // --- the collection --------------------------------------------------------
  {
    id: 'achievement.collector',
    name: 'Collector',
    description: 'Own ten different cards.',
    iconKey: 'nav.cards',
    group: 'collection',
    metric: 'distinctCards',
    target: 10,
    reward: { kind: 'currency', currency: 'token_unit_t2', amount: { min: 3, max: 3 } },
  },
  {
    id: 'achievement.full_roster',
    name: 'Full Roster',
    description: 'Own every collectible card.',
    iconKey: 'award.trophy',
    group: 'collection',
    metric: 'distinctCards',
    // Pinned to the whole collectible roster by a test — adding a card bumps this.
    target: 36,
    reward: { kind: 'currency', currency: 'gems', amount: { min: 100, max: 100 } },
  },
  {
    id: 'achievement.leaders',
    name: 'Leaders',
    description: 'Own three heroes.',
    iconKey: 'award.medal',
    group: 'collection',
    metric: 'heroesOwned',
    target: 3,
    reward: { kind: 'currency', currency: 'token_hero', amount: { min: 1, max: 1 } },
  },
  {
    id: 'achievement.legend',
    name: 'Legend',
    description: 'Own a legendary card.',
    iconKey: 'award.spark',
    group: 'collection',
    metric: 'legendaryCards',
    target: 1,
    reward: { kind: 'currency', currency: 'gems', amount: { min: 30, max: 30 } },
  },
  {
    id: 'achievement.quartermaster',
    name: 'Quartermaster',
    description: 'Hold forty pieces of gear at once.',
    iconKey: 'gear.armor',
    group: 'collection',
    metric: 'gearOwned',
    target: 40,
    reward: { kind: 'currency', currency: 'gold', amount: { min: 1500, max: 1500 } },
  },

  // --- mastery ---------------------------------------------------------------
  {
    id: 'achievement.flawless',
    name: 'Flawless',
    description: 'Clear ten stages without losing a card.',
    iconKey: 'ui.star',
    group: 'mastery',
    metric: 'flawlessClears',
    target: 10,
    reward: { kind: 'currency', currency: 'tome', amount: { min: 6, max: 6 } },
  },
  {
    id: 'achievement.star_gatherer',
    name: 'Star Gatherer',
    description: 'Earn fifty stars.',
    iconKey: 'ui.star',
    group: 'mastery',
    metric: 'totalStars',
    target: 50,
    reward: { kind: 'currency', currency: 'gems', amount: { min: 35, max: 35 } },
  },
  {
    id: 'achievement.ascendant',
    name: 'Ascendant',
    description: 'Raise a card to six stars.',
    iconKey: 'stat.power',
    group: 'mastery',
    metric: 'sixStarCards',
    target: 1,
    reward: { kind: 'currency', currency: 'token_unit_t3', amount: { min: 2, max: 2 } },
  },
  {
    id: 'achievement.well_equipped',
    name: 'Well Equipped',
    description: 'Fill every gear slot on one card.',
    iconKey: 'gear.weapon',
    group: 'mastery',
    metric: 'fullyGearedCards',
    target: 1,
    reward: { kind: 'currency', currency: 'gold', amount: { min: 1000, max: 1000 } },
  },
  {
    id: 'achievement.summoner',
    name: 'Summoner',
    description: 'Make fifty summons.',
    iconKey: 'nav.summon',
    group: 'mastery',
    metric: 'summonsMade',
    target: 50,
    reward: { kind: 'currency', currency: 'fragment', amount: { min: 200, max: 200 } },
  },
];
