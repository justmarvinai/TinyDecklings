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
