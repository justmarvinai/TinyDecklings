/**
 * Save migrations.
 *
 * Endless meta progression must survive every update (ARCHITECTURE.md AD-8), so a
 * save is never discarded because it is old: it is walked forward one version at a
 * time by pure functions, each with a fixture test.
 *
 * To add one: bump CURRENT_SAVE_VERSION, add `N: (doc) => ...` here converting
 * version N into N+1, and add a fixture test in saves.test.ts — same commit.
 */

export type UnknownSave = Record<string, unknown>;

/**
 * A tutorial step past every beat.
 *
 * Kept here rather than imported from the UI: a migration must keep meaning the
 * same thing forever, so it cannot depend on a number that later phases might
 * grow (adding a beat must not un-finish an old save).
 */
const TUTORIAL_FINISHED = 999;

/** Keyed by the version being migrated FROM. */
export const MIGRATIONS: Readonly<Record<number, (doc: UnknownSave) => UnknownSave>> = {
  /**
   * v1 → v2: the shop and summoning arrived (Phase 3), so the save gained
   * `player.shop` and `player.summonCounts`.
   *
   * An empty day key means "no rotation seen yet"; the shop rolls over on first
   * read, which is exactly what a returning player should get.
   */
  1: (doc) => {
    const player = (doc.player ?? {}) as Record<string, unknown>;
    return {
      ...doc,
      saveVersion: 2,
      player: { ...player, shop: { dayKey: '', purchased: {} }, summonCounts: {} },
    };
  },

  /**
   * v2 → v3: the endless road arrived (Phase 4). Forks became a decision worth
   * remembering, vignettes can hand a status to the next fight, and regions pay
   * out star chests — so the save gained `run.branches`, `run.pendingBoon` and
   * `player.claimedChests`.
   *
   * An older save has walked no forks, carries nothing, and has opened no chests,
   * which is exactly what the empty defaults mean.
   */
  2: (doc) => {
    const player = (doc.player ?? {}) as Record<string, unknown>;
    const run = (doc.run ?? {}) as Record<string, unknown>;
    return {
      ...doc,
      saveVersion: 3,
      player: { ...player, claimedChests: [] },
      run: { ...run, branches: {}, pendingBoon: null },
    };
  },

  /**
   * v3 → v4: the profile arrived (Phase 5). Almost everything it shows is derived
   * from what the save already held, so this adds only what cannot be: the
   * achievements whose reward has been taken, and the battles lost.
   *
   * It also *drops* `profile.level` and `profile.xp`. Nothing is lost: the
   * commander level is now derived from stars earned, which the save has kept all
   * along, and those two fields never advanced.
   *
   * An older save has claimed nothing. Its losses are genuinely unknown, so they
   * start at zero rather than being invented.
   */
  3: (doc) => {
    const player = (doc.player ?? {}) as Record<string, unknown>;
    const profile = (player.profile ?? {}) as Record<string, unknown>;
    return {
      ...doc,
      saveVersion: 4,
      player: {
        ...player,
        profile: { name: profile.name, avatarKey: profile.avatarKey },
        claimedAchievements: [],
        stats: { battlesLost: 0 },
      },
    };
  },

  /**
   * v4 → v5: the polish pass arrived (Phase 6). Audio gained a mix rather than
   * only an on/off, and the guided opening (Q25) needs to know how far the player
   * got.
   *
   * A save from before the tutorial existed belongs to someone who has already
   * played, so they are marked as having finished it rather than being walked
   * through the first two stages again.
   */
  4: (doc) => {
    const player = (doc.player ?? {}) as Record<string, unknown>;
    const settings = (doc.settings ?? {}) as Record<string, unknown>;
    return {
      ...doc,
      saveVersion: 5,
      player: { ...player, tutorialStep: TUTORIAL_FINISHED },
      settings: { ...settings, sfxVolume: 0.8, musicVolume: 0.45 },
    };
  },
};

export class SaveMigrationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SaveMigrationError';
  }
}

export type MigrationTable = Readonly<Record<number, (doc: UnknownSave) => UnknownSave>>;

/** `table` is injectable so the runner itself stays testable before real migrations exist. */
export function migrate(
  doc: UnknownSave,
  targetVersion: number,
  table: MigrationTable = MIGRATIONS,
): UnknownSave {
  let current = doc;
  let guard = 0;

  while (typeof current.saveVersion === 'number' && current.saveVersion < targetVersion) {
    const from = current.saveVersion;
    const step = table[from];
    if (!step) {
      throw new SaveMigrationError(
        `No migration from save version ${from} to ${from + 1}. Saves are never silently dropped — add one in migrations.ts.`,
      );
    }
    current = step(current);
    if (typeof current.saveVersion !== 'number' || current.saveVersion <= from) {
      throw new SaveMigrationError(`Migration from version ${from} did not advance saveVersion.`);
    }
    if (++guard > 100) throw new SaveMigrationError('Migration loop did not terminate.');
  }

  if (typeof current.saveVersion === 'number' && current.saveVersion > targetVersion) {
    throw new SaveMigrationError(
      `Save is from a newer version (${current.saveVersion} > ${targetVersion}). Refusing to downgrade and risk data loss.`,
    );
  }

  return current;
}
