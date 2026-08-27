/**
 * The save document.
 *
 * Saves are sacred (CLAUDE.md rule 8): any shape change needs a version bump, a
 * migration and a fixture test in the same commit. Everything here is plain JSON —
 * no class instances, no Maps — so a save is always serialisable and diffable.
 */
import { z } from 'zod';
import { CURRENCY_IDS, GEAR_SLOTS, forkBranch, statKey, statusId } from '@/content/schemas';

/** Bump on every shape change and add a migration in migrations.ts. */
export const CURRENT_SAVE_VERSION = 5;

export const ownedGear = z.strictObject({
  uid: z.string().min(1),
  defId: z.string().min(1),
  enhanceLevel: z.number().int().min(0).default(0),
  substats: z
    .array(z.strictObject({ stat: statKey, value: z.number(), isPercent: z.boolean() }))
    .default([]),
});

export const ownedCard = z.strictObject({
  uid: z.string().min(1),
  defId: z.string().min(1),
  level: z.number().int().min(1).default(1),
  xp: z.number().int().min(0).default(0),
  stars: z.number().int().min(1).max(6),
  skillLevels: z.array(z.number().int().min(1)).default([]),
  /** slot -> OwnedGear.uid */
  equippedGear: z.partialRecord(z.enum(GEAR_SLOTS), z.string()).default({}),
  favorite: z.boolean().default(false),
});

export const deckConfig = z.strictObject({
  name: z.string().default('Deck 1'),
  /** OwnedCard uid of the hero, or null while the deck is being built. */
  heroUid: z.string().nullable().default(null),
  /** Up to 8 unit slots; null marks an empty slot (Q6). */
  unitUids: z.array(z.string().nullable()).max(8).default([]),
});

/**
 * Energy (Q14b). `current` may exceed the cap when rewards grant energy; regen is
 * derived from `regenAnchorMs` on read, so no timer runs and closing the app never
 * loses progress.
 */
export const energyState = z.strictObject({
  current: z.number().min(0),
  regenAnchorMs: z.number().int().min(0),
});

/**
 * The handful of records that cannot be derived from the rest of the save (v4).
 *
 * Everything the profile screen shows is worked out from what is already stored —
 * stars, clears, the collection, summon counts. Only a loss leaves no trace
 * anywhere else, so only a loss is counted here. Resist growing this: a number
 * that can be derived should be.
 */
export const trackedStats = z.strictObject({
  battlesLost: z.number().int().min(0),
});

/**
 * What the shop needs to remember. The line-up itself is derived from the day and
 * the run seed, so only purchases are stored (save v2).
 */
export const shopState = z.strictObject({
  dayKey: z.string(),
  purchased: z.record(z.string(), z.number().int().min(0)),
});

export const saveDoc = z.strictObject({
  saveVersion: z.number().int().positive(),
  createdAtMs: z.number().int().min(0),
  updatedAtMs: z.number().int().min(0),

  player: z.strictObject({
    /**
     * Only what cannot be worked out from the rest of the save (v4). The commander
     * level used to live here and is now derived from stars earned, so it can no
     * longer disagree with the stage records.
     */
    profile: z.strictObject({
      name: z.string().min(1).max(24).default('Deckling'),
      avatarKey: z.string().default('placeholder'),
    }),
    currencies: z.record(z.enum(CURRENCY_IDS), z.number().min(0)),
    energy: energyState,
    cards: z.array(ownedCard).default([]),
    gear: z.array(ownedGear).default([]),
    decks: z.array(deckConfig).max(6).default([]),
    activeDeckIndex: z.number().int().min(0).default(0),
    /** stage number -> record. Keys are strings because JSON has no int keys. */
    stageRecords: z
      .record(
        z.string(),
        z.strictObject({
          bestStars: z.number().int().min(0).max(3),
          clears: z.number().int().min(0),
        }),
      )
      .default({}),
    unlocks: z.array(z.string()).default([]),
    /** pool id -> rarity -> pulls since the last hit. */
    pity: z.record(z.string(), z.record(z.string(), z.number().int().min(0))).default({}),
    /** pool id -> total pulls made, so each batch draws a fresh rng stream. */
    summonCounts: z.record(z.string(), z.number().int().min(0)).default({}),
    shop: shopState,
    /** Region star chests already opened, as `<regionId>#<threshold>` (save v3). */
    claimedChests: z.array(z.string()).default([]),
    /** Achievement ids whose reward has been taken (save v4). */
    claimedAchievements: z.array(z.string()).default([]),
    stats: trackedStats,
    /**
     * How far through the guided opening the player is (Q25, save v5).
     *
     * An index into the beat list; once it reaches the end the tutorial never runs
     * again. Skipping jumps straight there, so "skipped" and "finished" are the
     * same state — there is nothing to resume.
     */
    tutorialStep: z.number().int().min(0).default(0),
  }),

  run: z.strictObject({
    seed: z.number().int(),
    currentStage: z.number().int().min(1).default(1),
    /** Rolling window of generated stages around the player's position. */
    generatedWindow: z.array(z.unknown()).default([]),
    /**
     * Which side of each fork the player took, keyed by the fork's first stage
     * number (save v3). The road itself is derived from the seed; this is the one
     * part of it that is a decision, so it is the one part that is stored.
     */
    branches: z.record(z.string(), forkBranch).default({}),
    /**
     * A status a vignette hung on the party, waiting for the next fight to spend
     * it (save v3).
     */
    pendingBoon: z
      .strictObject({
        status: statusId,
        side: z.enum(['player', 'enemy']),
        stacks: z.number().int().positive(),
      })
      .nullable()
      .default(null),
    /** Mid-battle resume: replaying the intent log restores the exact state. */
    pendingBattle: z
      .strictObject({
        stage: z.number().int().min(1),
        attempt: z.number().int().min(1),
        seed: z.number().int(),
        intentLog: z.array(z.unknown()).default([]),
      })
      .nullable()
      .default(null),
  }),

  settings: z.strictObject({
    sfx: z.boolean().default(true),
    music: z.boolean().default(true),
    /** Mix, 0-1 (save v5). The toggles above are the on/off; these are the level. */
    sfxVolume: z.number().min(0).max(1).default(0.8),
    musicVolume: z.number().min(0).max(1).default(0.45),
    battleSpeed: z.union([z.literal(1), z.literal(2)]).default(1),
    reducedMotion: z.boolean().default(false),
    language: z.string().default('en'),
  }),
});

export type SaveDoc = z.infer<typeof saveDoc>;
export type OwnedCard = z.infer<typeof ownedCard>;
export type OwnedGear = z.infer<typeof ownedGear>;
export type DeckConfig = z.infer<typeof deckConfig>;
export type EnergyState = z.infer<typeof energyState>;
export type ShopState = z.infer<typeof shopState>;
export type TrackedStats = z.infer<typeof trackedStats>;

export function createNewSave(nowMs: number, seed: number, energyCap: number): SaveDoc {
  const today = new Date(nowMs).toISOString().slice(0, 10);
  return saveDoc.parse({
    saveVersion: CURRENT_SAVE_VERSION,
    createdAtMs: nowMs,
    updatedAtMs: nowMs,
    player: {
      profile: { name: 'Deckling', avatarKey: 'placeholder' },
      currencies: {
        gold: 0,
        gems: 0,
        energy: 0,
        token_unit_t1: 0,
        token_unit_t2: 0,
        token_unit_t3: 0,
        token_hero: 0,
        fragment: 0,
        tome: 0,
      },
      energy: { current: energyCap, regenAnchorMs: nowMs },
      cards: [],
      gear: [],
      decks: [],
      activeDeckIndex: 0,
      stageRecords: {},
      unlocks: [],
      pity: {},
      summonCounts: {},
      shop: { dayKey: today, purchased: {} },
      claimedChests: [],
      claimedAchievements: [],
      stats: { battlesLost: 0 },
      tutorialStep: 0,
    },
    run: {
      seed,
      currentStage: 1,
      generatedWindow: [],
      branches: {},
      pendingBoon: null,
      pendingBattle: null,
    },
    settings: {},
  });
}
