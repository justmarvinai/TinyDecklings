/**
 * The content registry.
 *
 * Content is data (CLAUDE.md rule 3). Everything the game can reference is
 * declared here, validated against the Zod schemas, and cross-checked for
 * referential integrity. Validation runs at dev start-up and in tests, so a typo
 * in a card's skill id fails loudly with a readable message instead of surfacing
 * as a mysterious runtime crash mid-battle.
 */
import { z } from 'zod';
import {
  achievementDef,
  attackPatternDef,
  cardDef,
  encounterDef,
  enemyGroupDef,
  gearDef,
  gearSlotDef,
  growthCurveDef,
  lootTableDef,
  regionDef,
  skillDef,
  stageModifierDef,
  statusDef,
  summonPoolDef,
  shopOfferDef,
  type AchievementDef,
  type AttackPatternDef,
  type CardDef,
  type EncounterDef,
  type EnemyGroupDef,
  type GearDef,
  type GearSlotDef,
  type GrowthCurveDef,
  type LootTableDef,
  type RegionDef,
  type SkillDef,
  type StageModifierDef,
  type StatusDef,
  type SummonPoolDef,
  type ShopOfferDef,
} from './schemas';
import { maxRegionStars, regionPlanFor } from './schemas/map';
import { ICON_KEYS, type IconKey } from './schemas/iconKeys';

export interface ContentSource {
  cards: readonly unknown[];
  gear: readonly unknown[];
  gearSlots: readonly unknown[];
  skills: readonly unknown[];
  statuses: readonly unknown[];
  patterns: readonly unknown[];
  enemies: readonly unknown[];
  regions: readonly unknown[];
  encounters: readonly unknown[];
  stageModifiers: readonly unknown[];
  achievements: readonly unknown[];
  lootTables: readonly unknown[];
  summonPools: readonly unknown[];
  growthCurves: readonly unknown[];
  shopOffers: readonly unknown[];
}

export interface Content {
  cards: ReadonlyMap<string, CardDef>;
  gear: ReadonlyMap<string, GearDef>;
  gearSlots: ReadonlyMap<string, GearSlotDef>;
  skills: ReadonlyMap<string, SkillDef>;
  statuses: ReadonlyMap<string, StatusDef>;
  patterns: ReadonlyMap<string, AttackPatternDef>;
  enemies: ReadonlyMap<string, EnemyGroupDef>;
  regions: ReadonlyMap<string, RegionDef>;
  encounters: ReadonlyMap<string, EncounterDef>;
  stageModifiers: ReadonlyMap<string, StageModifierDef>;
  achievements: ReadonlyMap<string, AchievementDef>;
  lootTables: ReadonlyMap<string, LootTableDef>;
  summonPools: ReadonlyMap<string, SummonPoolDef>;
  growthCurves: ReadonlyMap<string, GrowthCurveDef>;
  shopOffers: ReadonlyMap<string, ShopOfferDef>;
}

export class ContentValidationError extends Error {
  constructor(readonly problems: readonly string[]) {
    super(`Content validation failed:\n  - ${problems.join('\n  - ')}`);
    this.name = 'ContentValidationError';
  }
}

function parseTable<T extends { id: string }>(
  label: string,
  schema: z.ZodType<T>,
  entries: readonly unknown[],
  problems: string[],
): Map<string, T> {
  const table = new Map<string, T>();
  entries.forEach((raw, index) => {
    const result = schema.safeParse(raw);
    if (!result.success) {
      const where =
        raw && typeof raw === 'object' && 'id' in raw ? String(raw.id) : `${label}[${index}]`;
      for (const issue of result.error.issues) {
        const path = issue.path.length > 0 ? issue.path.join('.') : '(root)';
        problems.push(`${label} "${where}": ${path} — ${issue.message}`);
      }
      return;
    }
    if (table.has(result.data.id)) {
      problems.push(`${label} "${result.data.id}": duplicate id`);
      return;
    }
    table.set(result.data.id, result.data);
  });
  return table;
}

/** Validates schemas first, then every cross-table reference. */
export function buildContent(source: ContentSource): Content {
  const problems: string[] = [];

  const cards = parseTable('card', cardDef, source.cards, problems);
  const gear = parseTable('gear', gearDef, source.gear, problems);
  const gearSlots = parseTable('gearSlot', gearSlotDef, source.gearSlots, problems);
  const skills = parseTable('skill', skillDef, source.skills, problems);
  const statuses = parseTable('status', statusDef, source.statuses, problems);
  const patterns = parseTable('pattern', attackPatternDef, source.patterns, problems);
  const enemies = parseTable('enemy', enemyGroupDef, source.enemies, problems);
  const regions = parseTable('region', regionDef, source.regions, problems);
  const encounters = parseTable('encounter', encounterDef, source.encounters, problems);
  const stageModifiers = parseTable('modifier', stageModifierDef, source.stageModifiers, problems);
  const achievements = parseTable('achievement', achievementDef, source.achievements, problems);
  const lootTables = parseTable('loot', lootTableDef, source.lootTables, problems);
  const summonPools = parseTable('pool', summonPoolDef, source.summonPools, problems);
  const growthCurves = parseTable('growth', growthCurveDef, source.growthCurves, problems);
  const shopOffers = parseTable('offer', shopOfferDef, source.shopOffers, problems);

  const iconKeys = new Set<string>(ICON_KEYS);
  const need = (ok: boolean, message: string): void => {
    if (!ok) problems.push(message);
  };

  for (const card of cards.values()) {
    need(
      patterns.has(card.attackPattern),
      `card "${card.id}": unknown pattern "${card.attackPattern}"`,
    );
    need(growthCurves.has(card.growth), `card "${card.id}": unknown growth curve "${card.growth}"`);
    for (const s of card.skills) {
      need(skills.has(s.skillId), `card "${card.id}": unknown skill "${s.skillId}"`);
    }
  }

  for (const skill of skills.values()) {
    need(iconKeys.has(skill.iconKey), `skill "${skill.id}": unknown icon key "${skill.iconKey}"`);
    if (skill.attackPattern) {
      need(
        patterns.has(skill.attackPattern),
        `skill "${skill.id}": unknown pattern "${skill.attackPattern}"`,
      );
    }
    for (const effect of skill.effects) {
      if (effect.action.kind === 'summon') {
        need(
          cards.has(effect.action.cardId),
          `skill "${skill.id}": summons unknown card "${effect.action.cardId}"`,
        );
      }
      if (effect.target.pattern) {
        need(
          patterns.has(effect.target.pattern),
          `skill "${skill.id}": unknown target pattern "${effect.target.pattern}"`,
        );
      }
    }
  }

  for (const status of statuses.values()) {
    need(
      iconKeys.has(status.iconKey),
      `status "${status.id}": unknown icon key "${status.iconKey}"`,
    );
  }

  /**
   * Gear icons come from the slot, never the item (owner directive). Every slot
   * must therefore name a valid icon key, and every item must sit in a known slot.
   */
  for (const slot of gearSlots.values()) {
    need(iconKeys.has(slot.iconKey), `gearSlot "${slot.id}": unknown icon key "${slot.iconKey}"`);
    need(
      slot.iconKey === `gear.${slot.id}`,
      `gearSlot "${slot.id}": icon key must be "gear.${slot.id}" so every item in the slot shares one icon`,
    );
  }
  for (const item of gear.values()) {
    need(gearSlots.has(item.slot), `gear "${item.id}": unknown slot "${item.slot}"`);
  }

  for (const enemy of enemies.values()) {
    const slotsUsed = new Set<number>();
    for (const m of enemy.members) {
      need(cards.has(m.cardId), `enemy "${enemy.id}": unknown card "${m.cardId}"`);
      need(!slotsUsed.has(m.slot), `enemy "${enemy.id}": two members share slot ${m.slot}`);
      slotsUsed.add(m.slot);
    }
    for (const r of enemy.reinforcements) {
      need(cards.has(r), `enemy "${enemy.id}": unknown reinforcement card "${r}"`);
    }
    if (enemy.bossCardId) {
      need(
        cards.has(enemy.bossCardId),
        `enemy "${enemy.id}": unknown boss card "${enemy.bossCardId}"`,
      );
    }
  }

  for (const modifier of stageModifiers.values()) {
    need(
      iconKeys.has(modifier.iconKey),
      `modifier "${modifier.id}": unknown icon key "${modifier.iconKey}"`,
    );
    for (const effect of modifier.effects) {
      if (effect.kind !== 'startingStatus') continue;
      const status = statuses.get(effect.status);
      need(status !== undefined, `modifier "${modifier.id}": unknown status "${effect.status}"`);
      // A stage twist must never lock a side out of its own fight.
      need(
        !status?.blocksAction,
        `modifier "${modifier.id}": "${effect.status}" blocks actions and would make the stage unplayable`,
      );
    }
  }

  for (const region of regions.values()) {
    for (const [label, table] of [
      ['lootTable', region.lootTable],
      ['bossLootTable', region.bossLootTable],
    ] as const) {
      need(lootTables.has(table), `region "${region.id}": ${label} names unknown table "${table}"`);
    }
    for (const [poolName, pool] of [
      ['enemyPool', region.enemyPool],
      ['elitePool', region.elitePool],
      ['bossPool', region.bossPool],
    ] as const) {
      for (const e of pool) {
        need(enemies.has(e), `region "${region.id}": ${poolName} references unknown enemy "${e}"`);
      }
    }
    for (const e of region.eventPool) {
      need(encounters.has(e), `region "${region.id}": unknown encounter "${e}"`);
    }
    for (const m of region.modifierPool) {
      need(stageModifiers.has(m), `region "${region.id}": unknown modifier "${m}"`);
    }

    /**
     * A region's road must be walkable on both sides of its fork. These checks
     * exist because the cheapest way to ship a dead node is to plan a kind the
     * region has no content for — a boss stage with an empty boss pool, or a camp
     * with no camp encounters authored.
     */
    need(
      region.nodePlan.length === region.stageCount,
      `region "${region.id}": nodePlan has ${region.nodePlan.length} entries but stageCount is ${region.stageCount}`,
    );
    if (region.fork) {
      const { startIndex, length, risky } = region.fork;
      need(
        risky.length === length,
        `region "${region.id}": fork length is ${length} but the risky branch has ${risky.length} stages`,
      );
      need(
        startIndex + length - 1 <= region.stageCount,
        `region "${region.id}": fork starting at ${startIndex} runs past the end of the region`,
      );
      need(startIndex > 1, `region "${region.id}": a fork cannot open on the region's first stage`);
    }

    for (const branch of ['a', 'b'] as const) {
      const plan = regionPlanFor(region, branch);
      const kinds = new Set(plan);
      if (kinds.has('elite')) {
        need(
          region.elitePool.length > 0,
          `region "${region.id}": branch ${branch} plans an elite but elitePool is empty`,
        );
      }
      if (kinds.has('boss')) {
        need(
          region.bossPool.length > 0,
          `region "${region.id}": branch ${branch} plans a boss but bossPool is empty`,
        );
      }
      for (const kind of ['event', 'treasure', 'camp'] as const) {
        if (!kinds.has(kind)) continue;
        const available = region.eventPool.filter((e) => encounters.get(e)?.kind === kind);
        need(
          available.length > 0,
          `region "${region.id}": branch ${branch} plans a ${kind} node but no ${kind} encounter is in its eventPool`,
        );
      }
    }

    if (region.chestThresholds.length > 0) {
      need(
        region.chestLootTable !== undefined && lootTables.has(region.chestLootTable),
        `region "${region.id}": chestThresholds need a valid chestLootTable`,
      );
      const ascending = region.chestThresholds.every(
        (t, i) => i === 0 || t > region.chestThresholds[i - 1],
      );
      need(ascending, `region "${region.id}": chestThresholds must ascend`);
      // Reachable on the *safe* road too, or the last chest is a lie on branch a.
      const safeMax = maxRegionStars(region, 'a');
      const highest = region.chestThresholds[region.chestThresholds.length - 1];
      need(
        highest <= safeMax,
        `region "${region.id}": chest threshold ${highest} is above the ${safeMax} stars branch a can earn`,
      );
    }
  }

  for (const table of lootTables.values()) {
    for (const reward of [...table.guaranteed, ...table.entries.map((e) => e.reward)]) {
      if (reward.kind === 'card' || reward.kind === 'fragment') {
        need(cards.has(reward.cardId), `loot "${table.id}": unknown card "${reward.cardId}"`);
      }
      if (reward.kind === 'gearDrop') {
        for (const slot of reward.slots) {
          need(gearSlots.has(slot), `loot "${table.id}": unknown gear slot "${slot}"`);
        }
      }
    }
    need(
      table.rolls === 0 || table.entries.length > 0,
      `loot "${table.id}": rolls > 0 but no weighted entries`,
    );
  }

  for (const pool of summonPools.values()) {
    for (const entry of pool.entries) {
      const card = cards.get(entry.cardId);
      need(card !== undefined, `pool "${pool.id}": unknown card "${entry.cardId}"`);
      if (card) {
        need(
          !card.enemyOnly,
          `pool "${pool.id}": enemy-only card "${card.id}" cannot be summonable`,
        );
      }
    }
  }

  for (const encounter of encounters.values()) {
    for (const choice of encounter.choices) {
      for (const outcome of choice.outcomes) {
        for (const rewardId of outcome.rewards) {
          need(
            lootTables.has(rewardId),
            `encounter "${encounter.id}": unknown loot table "${rewardId}"`,
          );
        }
        if (!outcome.carriedStatus) continue;
        const status = statuses.get(outcome.carriedStatus.status);
        need(
          status !== undefined,
          `encounter "${encounter.id}": unknown status "${outcome.carriedStatus.status}"`,
        );
        /**
         * A boon rides into the next fight on its own, so it has to mean something
         * on its own — and it must never be one that stops a side acting, which
         * would hand the player an unwinnable stage for taking a vignette.
         */
        need(
          !status?.blocksAction,
          `encounter "${encounter.id}": "${outcome.carriedStatus.status}" blocks actions and would carry an unwinnable fight`,
        );
        need(
          status?.tick !== undefined,
          `encounter "${encounter.id}": "${outcome.carriedStatus.status}" does nothing on its own — carry a status that ticks`,
        );
      }
    }
  }

  // Shop offers must pay out something the game can actually grant.
  for (const offer of shopOffers.values()) {
    if (offer.reward.kind === 'card' || offer.reward.kind === 'fragment') {
      need(
        cards.has(offer.reward.cardId),
        `offer "${offer.id}": unknown card "${offer.reward.cardId}"`,
      );
    }
    if (offer.reward.kind === 'gearDrop') {
      for (const slot of offer.reward.slots) {
        need(gearSlots.has(slot), `offer "${offer.id}": unknown gear slot "${slot}"`);
      }
    }
  }

  /**
   * Achievements must be earnable by the content that actually ships.
   *
   * Some metrics have a ceiling the game itself sets — there are only so many
   * collectible cards, regions or chests — and a target above it is a task the
   * player can never finish. Metrics with no ceiling (stars, wins, summons) are
   * left alone, since those climb forever.
   */
  const collectible = [...cards.values()].filter((c) => !c.enemyOnly);
  const ceilings: Partial<Record<string, { limit: number; what: string }>> = {
    distinctCards: { limit: collectible.length, what: 'collectible cards' },
    heroesOwned: {
      limit: collectible.filter((c) => c.cardClass === 'hero').length,
      what: 'collectible heroes',
    },
    legendaryCards: {
      limit: collectible.filter((c) => c.rarity === 'legendary').length,
      what: 'collectible legendary cards',
    },
    regionsCleared: { limit: regions.size, what: 'authored regions' },
    chestsOpened: {
      limit: [...regions.values()].reduce((sum, r) => sum + r.chestThresholds.length, 0),
      what: 'region chests',
    },
  };

  for (const achievement of achievements.values()) {
    const ceiling = ceilings[achievement.metric];
    if (ceiling) {
      need(
        achievement.target <= ceiling.limit,
        `achievement "${achievement.id}": asks for ${achievement.target} but the game only has ${ceiling.limit} ${ceiling.what}`,
      );
    }
    const reward = achievement.reward;
    if (reward?.kind === 'card' || reward?.kind === 'fragment') {
      need(
        cards.has(reward.cardId),
        `achievement "${achievement.id}": unknown card "${reward.cardId}"`,
      );
    }
    if (reward?.kind === 'gearDrop') {
      for (const slot of reward.slots) {
        need(gearSlots.has(slot), `achievement "${achievement.id}": unknown gear slot "${slot}"`);
      }
    }
  }

  if (problems.length > 0) throw new ContentValidationError(problems);

  return {
    cards,
    gear,
    gearSlots,
    skills,
    statuses,
    patterns,
    enemies,
    regions,
    encounters,
    stageModifiers,
    achievements,
    lootTables,
    summonPools,
    growthCurves,
    shopOffers,
  };
}

/** Non-throwing variant for the dev panel's "validate content" button. */
export function validateContent(
  source: ContentSource,
): { ok: true } | { ok: false; problems: readonly string[] } {
  try {
    buildContent(source);
    return { ok: true };
  } catch (error) {
    if (error instanceof ContentValidationError) return { ok: false, problems: error.problems };
    throw error;
  }
}

export type { IconKey };
