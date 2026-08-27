/**
 * The player's record, derived.
 *
 * Almost nothing here is stored: stars, clears, the collection and the summon
 * counters already say what the player has done, so the profile reads them rather
 * than keeping a parallel tally that can drift out of step with the save. The only
 * tracked number is losses, because a loss leaves no other trace (`TrackedStats`).
 *
 * Pure and content-driven, so the same numbers back the profile screen, the
 * achievement checks and their tests.
 */
import type { Content } from '@/content';
import type { CardRarity, ForkBranch, ProfileMetric, StageKind } from '@/content/schemas';
import { CARD_RARITIES, isCombatStage } from '@/content/schemas';
import { authoredStageCount, forkSpanFor, generateStage } from '../map/generate';
import { regionRanges } from '../map/chests';

/**
 * Everything the record reads, described structurally.
 *
 * The engine never imports the save module (CLAUDE.md rule 7): the state layer
 * hands it a save, which happens to satisfy this. Writing the shape out also makes
 * plain how little of the save the profile actually needs.
 */
export interface ProfileSource {
  createdAtMs: number;
  player: {
    profile: { name: string };
    currencies: Partial<Record<string, number>>;
    cards: readonly {
      defId: string;
      level: number;
      stars: number;
      equippedGear: Readonly<Record<string, string | undefined>>;
    }[];
    gear: readonly unknown[];
    stageRecords: Readonly<Record<string, { bestStars: number; clears: number }>>;
    summonCounts: Readonly<Record<string, number>>;
    claimedChests: readonly string[];
    stats: { battlesLost: number };
  };
  run: { seed: number; branches: Readonly<Record<string, ForkBranch>> };
}

export interface CollectionRecord {
  /** Distinct collectible cards owned, and how many exist to own. */
  distinct: number;
  collectible: number;
  copies: number;
  heroes: number;
  byRarity: Record<CardRarity, number>;
  sixStar: number;
  highestLevel: number;
  gearOwned: number;
  fullyGeared: number;
}

export interface JourneyRecord {
  furthestStage: number;
  stagesCleared: number;
  totalStars: number;
  flawlessClears: number;
  battlesWon: number;
  battlesLost: number;
  vignettesResolved: number;
  regionsCleared: number;
  regionsAuthored: number;
  chestsOpened: number;
  chestsAuthored: number;
  riskyForksWalked: number;
  /** Laps completed over the authored regions; 0 while still on the first road. */
  loopsCompleted: number;
}

/**
 * Stars per commander level.
 *
 * The badge on the HUD is a summary of the journey rather than a second currency:
 * it is derived from stars earned, so it can never drift out of step with what the
 * player has actually done, and there is nothing to migrate when the maths change.
 */
export const STARS_PER_LEVEL = 3;

export function commanderLevel(totalStars: number): number {
  return 1 + Math.floor(totalStars / STARS_PER_LEVEL);
}

/** Total stars across the whole road — the cheap read the HUD badge needs. */
export function totalStarsOf(save: Pick<ProfileSource, 'player'>): number {
  return Object.values(save.player.stageRecords).reduce((sum, r) => sum + r.bestStars, 0);
}

export interface ProfileRecord {
  name: string;
  /** Derived from stars earned; see `commanderLevel`. */
  level: number;
  /** Stars into the current level, out of `STARS_PER_LEVEL`. */
  starsIntoLevel: number;
  createdAtMs: number;
  journey: JourneyRecord;
  collection: CollectionRecord;
  summonsMade: number;
  goldHeld: number;
  metrics: Record<ProfileMetric, number>;
}

/** Stage numbers the player has cleared at least once, ascending. */
function clearedStages(save: ProfileSource): number[] {
  return Object.entries(save.player.stageRecords)
    .filter(([, record]) => record.bestStars > 0)
    .map(([stage]) => Number(stage))
    .sort((a, b) => a - b);
}

function kindOf(
  content: Content,
  save: ProfileSource,
  stageNumber: number,
  branches: Readonly<Record<string, ForkBranch>>,
): StageKind {
  const span = forkSpanFor(content, stageNumber);
  const branch = span ? (branches[String(span.start)] ?? 'a') : 'a';
  return generateStage(content, save.run.seed, stageNumber, branch).kind;
}

function collectionRecord(content: Content, save: ProfileSource): CollectionRecord {
  const collectible = [...content.cards.values()].filter((c) => !c.enemyOnly);
  const byRarity = Object.fromEntries(CARD_RARITIES.map((r) => [r, 0])) as Record<
    CardRarity,
    number
  >;

  const seen = new Set<string>();
  let heroes = 0;
  let sixStar = 0;
  let highestLevel = 0;

  for (const owned of save.player.cards) {
    const def = content.cards.get(owned.defId);
    if (!def) continue;
    if (!seen.has(def.id)) {
      seen.add(def.id);
      byRarity[def.rarity] += 1;
      if (def.cardClass === 'hero') heroes += 1;
    }
    if (owned.stars >= 6) sixStar += 1;
    highestLevel = Math.max(highestLevel, owned.level);
  }

  // "Fully geared" means every slot the card has unlocked is filled, which is what
  // the equipment grid actually asks of the player.
  const activeSlots = [...content.gearSlots.values()].filter((s) => s.id !== 'artifact').length;
  const fullyGeared = save.player.cards.filter(
    (c) => Object.keys(c.equippedGear).length >= activeSlots,
  ).length;

  return {
    distinct: seen.size,
    collectible: collectible.length,
    copies: save.player.cards.length,
    heroes,
    byRarity,
    sixStar,
    highestLevel,
    gearOwned: save.player.gear.length,
    fullyGeared,
  };
}

function journeyRecord(content: Content, save: ProfileSource): JourneyRecord {
  const branches = save.run.branches;
  const cleared = clearedStages(save);

  let totalStars = 0;
  let flawlessClears = 0;
  let battlesWon = 0;
  let vignettesResolved = 0;

  for (const [stage, record] of Object.entries(save.player.stageRecords)) {
    totalStars += record.bestStars;
    if (record.bestStars === 3) flawlessClears += 1;
    if (record.clears === 0) continue;
    // Clears count wins on a fight and visits on a vignette; the profile keeps
    // those apart, because "battles won" should mean battles.
    if (isCombatStage(kindOf(content, save, Number(stage), branches))) {
      battlesWon += record.clears;
    } else {
      vignettesResolved += record.clears;
    }
  }

  const ranges = regionRanges(content);
  const regionsCleared = ranges.filter(
    ({ region, start }) =>
      (save.player.stageRecords[String(start + region.stageCount - 1)]?.bestStars ?? 0) > 0,
  ).length;

  // A fork counts as walked only once the player has actually cleared something on
  // it — flipping the choice back and forth on the map is not a road taken.
  const riskyForksWalked = Object.entries(branches).filter(([start, branch]) => {
    if (branch !== 'b') return false;
    const span = forkSpanFor(content, Number(start));
    if (!span) return false;
    for (let n = span.start; n < span.start + span.length; n++) {
      if ((save.player.stageRecords[String(n)]?.bestStars ?? 0) > 0) return true;
    }
    return false;
  }).length;

  const furthestStage = cleared.length > 0 ? cleared[cleared.length - 1] : 0;
  const chestsAuthored = ranges.reduce((sum, { region }) => sum + region.chestThresholds.length, 0);

  return {
    furthestStage,
    stagesCleared: cleared.length,
    totalStars,
    flawlessClears,
    battlesWon,
    battlesLost: save.player.stats.battlesLost,
    vignettesResolved,
    regionsCleared,
    regionsAuthored: ranges.length,
    chestsOpened: save.player.claimedChests.length,
    chestsAuthored,
    riskyForksWalked,
    loopsCompleted: Math.floor(furthestStage / authoredStageCount(content)),
  };
}

export function profileRecord(content: Content, save: ProfileSource): ProfileRecord {
  const journey = journeyRecord(content, save);
  const collection = collectionRecord(content, save);
  const summonsMade = Object.values(save.player.summonCounts).reduce((sum, n) => sum + n, 0);
  const goldHeld = save.player.currencies.gold ?? 0;

  return {
    name: save.player.profile.name,
    level: commanderLevel(journey.totalStars),
    starsIntoLevel: journey.totalStars % STARS_PER_LEVEL,
    createdAtMs: save.createdAtMs,
    journey,
    collection,
    summonsMade,
    goldHeld,
    metrics: {
      furthestStage: journey.furthestStage,
      stagesCleared: journey.stagesCleared,
      totalStars: journey.totalStars,
      flawlessClears: journey.flawlessClears,
      battlesWon: journey.battlesWon,
      regionsCleared: journey.regionsCleared,
      chestsOpened: journey.chestsOpened,
      vignettesResolved: journey.vignettesResolved,
      riskyForksWalked: journey.riskyForksWalked,
      distinctCards: collection.distinct,
      heroesOwned: collection.heroes,
      legendaryCards: collection.byRarity.legendary,
      sixStarCards: collection.sixStar,
      highestCardLevel: collection.highestLevel,
      gearOwned: collection.gearOwned,
      fullyGearedCards: collection.fullyGeared,
      summonsMade,
      goldHeld,
    },
  };
}
