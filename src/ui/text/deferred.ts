/**
 * Systems that are deliberately not in the first release (Q22, Q23).
 *
 * They are shown, locked, rather than hidden: the reference screens have these
 * affordances and a player who taps one deserves an honest answer instead of a
 * dead button. One description per system, used everywhere it appears, so the
 * card sheet and the More tab never tell different stories.
 */
import type { IconKey } from '@/content/schemas';

export interface DeferredFeature {
  name: string;
  /** For compact rows where the full name does not fit. */
  short?: string;
  icon: IconKey;
  /** What it will do, in the player's terms. */
  blurb: string;
  /** Why it is not here yet. */
  when: string;
}

export const DEFERRED_FEATURES = {
  rank: {
    name: 'Rank',
    icon: 'award.medal',
    blurb:
      'A separate promotion track for a card, raising its ceiling beyond what levelling and stars reach.',
    when: 'Deferred past the first release so levelling, evolving and gear stay the systems you learn first.',
  },
  trait: {
    name: 'Trait',
    icon: 'award.spark',
    blurb:
      'A rollable personality on each card — a small permanent bias toward attack, health or speed.',
    when: 'Deferred past the first release.',
  },
  foil: {
    name: 'Foil',
    icon: 'ui.star',
    blurb: 'A cosmetic finish for a card you have invested in. Looks different, plays the same.',
    when: 'Deferred past the first release, and cosmetic when it lands — never a power purchase.',
  },
  artifactSet: {
    name: 'Artifact sets',
    short: 'Sets',
    icon: 'gear.artifact',
    blurb:
      'Bonuses for wearing several pieces from the same set, on top of what each piece already gives.',
    when: 'Deferred past the first release. The artifact slot itself is live at six stars.',
  },
  events: {
    name: 'Events',
    icon: 'stage.event',
    blurb: 'Limited-time runs with their own rules and rewards.',
    when: 'Backlog. The endless road is the whole game for now.',
  },
  seasonPass: {
    name: 'Season pass',
    icon: 'currency.tome',
    blurb: 'A track of rewards earned by playing through a season.',
    when: 'Backlog — and if it ever lands it stays fully earnable, like everything else here.',
  },
  records: {
    name: 'Local records',
    icon: 'record.progress',
    blurb: 'A table of your own best runs, kept on this device.',
    when: 'Backlog. There is no leaderboard: this game has no server and no accounts.',
  },
} as const satisfies Record<string, DeferredFeature>;

export type DeferredFeatureId = keyof typeof DEFERRED_FEATURES;

/** The name to print, shortened where a compact row demands it. */
export function deferredLabel(id: DeferredFeatureId, compact = false): string {
  const def: DeferredFeature = DEFERRED_FEATURES[id];
  return compact ? (def.short ?? def.name) : def.name;
}
