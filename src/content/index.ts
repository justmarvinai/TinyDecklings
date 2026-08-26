/**
 * The validated content registry — the single entry point for all game data.
 *
 * Importing this module validates every entry against its schema and checks all
 * cross-references, so bad data fails at start-up (and in tests) with a readable
 * message rather than surfacing mid-battle.
 *
 * Phase 0 registers the system-level content (gear slots, attack patterns, status
 * effects, growth curves). Cards, gear items, enemies, regions and encounters are
 * authored in Phase 1.
 */
import { buildContent, type Content, type ContentSource } from './registry';
import { GEAR_SLOT_DEFS } from './gear/slots';
import { ATTACK_PATTERN_DEFS } from './battle/patterns';
import { STATUS_DEFS } from './battle/statuses';
import { GROWTH_CURVE_DEFS } from './economy/growth';

export const CONTENT_SOURCE: ContentSource = {
  cards: [],
  gear: [],
  gearSlots: GEAR_SLOT_DEFS,
  skills: [],
  statuses: STATUS_DEFS,
  patterns: ATTACK_PATTERN_DEFS,
  enemies: [],
  regions: [],
  encounters: [],
  lootTables: [],
  summonPools: [],
  growthCurves: GROWTH_CURVE_DEFS,
};

export const CONTENT: Content = buildContent(CONTENT_SOURCE);

export { ENERGY_CONFIG } from './economy/energy';
export { DIFFICULTY_CURVE } from './economy/difficulty';
export { buildContent, validateContent, ContentValidationError } from './registry';
export type { Content, ContentSource } from './registry';
export * from './schemas';
