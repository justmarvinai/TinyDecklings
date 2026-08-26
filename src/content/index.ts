/**
 * The validated content registry — the single entry point for all game data.
 *
 * Importing this module validates every entry against its schema and checks all
 * cross-references, so bad data fails at start-up (and in tests) with a readable
 * message rather than surfacing mid-battle.
 *
 * Registered here: the card roster, gear, skills, enemy formations, the three
 * authored biomes with their encounters, stage modifiers and loot tables, the
 * economy (summon pools, shop, energy) and the Phase 0 system content (gear slots,
 * attack patterns, statuses, growth curves).
 */
import { buildContent, type Content, type ContentSource } from './registry';
import { GEAR_SLOT_DEFS } from './gear/slots';
import { GEAR_DEFS } from './gear/items';
import { ATTACK_PATTERN_DEFS } from './battle/patterns';
import { STATUS_DEFS } from './battle/statuses';
import { GROWTH_CURVE_DEFS } from './economy/growth';
import { LOOT_TABLE_DEFS } from './economy/loot';
import { SUMMON_POOL_DEFS } from './economy/summon';
import { SHOP_OFFER_DEFS } from './economy/shop';
import { CARD_DEFS } from './cards';
import { SKILL_DEFS } from './skills';
import { ENEMY_GROUP_DEFS } from './enemies';
import { REGION_DEFS } from './map/regions';
import { ENCOUNTER_DEFS } from './map/encounters';
import { STAGE_MODIFIER_DEFS } from './map/modifiers';
import { ACHIEVEMENT_DEFS } from './achievements';

export const CONTENT_SOURCE: ContentSource = {
  cards: CARD_DEFS,
  gear: GEAR_DEFS,
  gearSlots: GEAR_SLOT_DEFS,
  skills: SKILL_DEFS,
  statuses: STATUS_DEFS,
  patterns: ATTACK_PATTERN_DEFS,
  enemies: ENEMY_GROUP_DEFS,
  regions: REGION_DEFS,
  encounters: ENCOUNTER_DEFS,
  stageModifiers: STAGE_MODIFIER_DEFS,
  achievements: ACHIEVEMENT_DEFS,
  lootTables: LOOT_TABLE_DEFS,
  summonPools: SUMMON_POOL_DEFS,
  growthCurves: GROWTH_CURVE_DEFS,
  shopOffers: SHOP_OFFER_DEFS,
};

export const CONTENT: Content = buildContent(CONTENT_SOURCE);

export { ENERGY_CONFIG } from './economy/energy';
export { STARTER_CARD_IDS } from './cards';
export { DUPLICATE_FRAGMENTS, FRAGMENT_EXCHANGE_COST } from './economy/summon';
export { DAILY_OFFER_COUNT } from './economy/shop';
export { MODIFIER_COUNTS } from './map/modifiers';
export { DIFFICULTY_CURVE } from './economy/difficulty';
export { buildContent, validateContent, ContentValidationError } from './registry';
export type { Content, ContentSource } from './registry';
export * from './schemas';
