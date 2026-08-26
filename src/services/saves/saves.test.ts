import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createMemoryStorageService, type StorageService } from '../storage';
import { createFixedClock } from '../clock';
import { SaveService, SAVE_KEY } from './saveService';
import { CURRENT_SAVE_VERSION, createNewSave, saveDoc } from './saveSchema';
import { MIGRATIONS, SaveMigrationError, migrate, type UnknownSave } from './migrations';

const ENERGY_CAP = 30;

function makeService(storage: StorageService = createMemoryStorageService()) {
  const clock = createFixedClock(1_700_000_000_000);
  return { service: new SaveService({ storage, clock, energyCap: ENERGY_CAP }), storage, clock };
}

describe('save round-trip', () => {
  it('creates a fresh save when storage is empty', async () => {
    const { service } = makeService();
    const result = await service.load(123);
    expect(result.status).toBe('new');
    expect(result.save.saveVersion).toBe(CURRENT_SAVE_VERSION);
    expect(result.save.run.seed).toBe(123);
    expect(result.save.player.energy.current).toBe(ENERGY_CAP);
  });

  it('writes and reads back an identical document', async () => {
    const { service, storage } = makeService();
    const fresh = (await service.load(7)).save;
    const edited = {
      ...fresh,
      player: {
        ...fresh.player,
        currencies: { ...fresh.player.currencies, gold: 4321 },
        stageRecords: { '3': { bestStars: 3, clears: 2 } },
      },
    };
    await service.save(edited);

    const reloaded = await new SaveService({
      storage,
      clock: createFixedClock(1),
      energyCap: ENERGY_CAP,
    }).load(7);
    expect(reloaded.status).toBe('loaded');
    expect(reloaded.save.player.currencies.gold).toBe(4321);
    expect(reloaded.save.player.stageRecords['3']).toEqual({ bestStars: 3, clears: 2 });
  });

  it('stamps updatedAt from the injected clock, never ambient time', async () => {
    const { service, clock } = makeService();
    const fresh = (await service.load(1)).save;
    clock.advance(60_000);
    await service.save(fresh);
    const reloaded = await service.load(1);
    expect(reloaded.save.updatedAtMs).toBe(1_700_000_000_000 + 60_000);
  });

  it('exports and imports a save losslessly', async () => {
    const { service } = makeService();
    const fresh = (await service.load(99)).save;
    expect(service.import(service.export(fresh))).toEqual(fresh);
  });
});

describe('corrupt saves', () => {
  it('keeps a backup instead of overwriting unreadable data', async () => {
    const storage = createMemoryStorageService();
    await storage.write(SAVE_KEY, '{ not json at all');
    const { service } = makeService(storage);

    const result = await service.load(5);
    expect(result.status).toBe('corrupt');
    if (result.status === 'corrupt') {
      expect(await storage.read(result.backupKey)).toBe('{ not json at all');
    }
  });

  it('treats a schema-invalid save as corrupt rather than crashing', async () => {
    const storage = createMemoryStorageService();
    await storage.write(SAVE_KEY, JSON.stringify({ saveVersion: 1, nonsense: true }));
    const { service } = makeService(storage);
    expect((await service.load(5)).status).toBe('corrupt');
  });
});

describe('autosave', () => {
  beforeEach(() => vi.useFakeTimers());

  it('debounces bursts into a single write and flushes on demand', async () => {
    const storage = createMemoryStorageService();
    const writeSpy = vi.spyOn(storage, 'write');
    const service = new SaveService({
      storage,
      clock: createFixedClock(0),
      energyCap: ENERGY_CAP,
      autosaveDelayMs: 500,
    });
    const doc = createNewSave(0, 1, ENERGY_CAP);

    service.autosave(doc);
    service.autosave(doc);
    service.autosave(doc);
    expect(writeSpy).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(500);
    expect(writeSpy).toHaveBeenCalledTimes(1);

    vi.useRealTimers();
  });

  it('flush is a no-op when nothing is pending', async () => {
    const storage = createMemoryStorageService();
    const writeSpy = vi.spyOn(storage, 'write');
    const service = new SaveService({ storage, clock: createFixedClock(0), energyCap: ENERGY_CAP });
    await service.flush();
    expect(writeSpy).not.toHaveBeenCalled();
    vi.useRealTimers();
  });
});

describe('migrations', () => {
  it('passes a current-version save through untouched', () => {
    const doc = createNewSave(0, 1, ENERGY_CAP) as unknown as Record<string, unknown>;
    expect(migrate(doc, CURRENT_SAVE_VERSION)).toEqual(doc);
  });

  it('refuses to downgrade a save from a newer build', () => {
    expect(() => migrate({ saveVersion: 99 }, CURRENT_SAVE_VERSION)).toThrow(SaveMigrationError);
    expect(() => migrate({ saveVersion: 99 }, CURRENT_SAVE_VERSION)).toThrow(/newer version/);
  });

  it('explains itself when a migration step is missing', () => {
    // An empty table stands in for a version nobody wrote a migration for.
    expect(() => migrate({ saveVersion: 1 }, 2, {})).toThrow(/add one in migrations\.ts/);
  });

  it('migrates a real v1 save forward to v2, gaining the shop', () => {
    const v1 = {
      saveVersion: 1,
      createdAtMs: 0,
      updatedAtMs: 0,
      player: {
        profile: { name: 'Deckling', avatarKey: 'placeholder', level: 3, xp: 40 },
        currencies: {
          gold: 1234,
          gems: 20,
          energy: 0,
          token_unit_t1: 2,
          token_unit_t2: 0,
          token_unit_t3: 0,
          token_hero: 0,
          fragment: 0,
          tome: 5,
        },
        energy: { current: 12, regenAnchorMs: 0 },
        cards: [
          {
            uid: 'c1',
            defId: 'card.ember_drake',
            level: 8,
            xp: 3,
            stars: 3,
            skillLevels: [2],
            equippedGear: {},
            favorite: false,
          },
        ],
        gear: [],
        decks: [{ name: 'Deck 1', heroUid: null, unitUids: ['c1'] }],
        activeDeckIndex: 0,
        stageRecords: { '4': { bestStars: 2, clears: 3 } },
        unlocks: [],
        pity: {},
      },
      run: { seed: 99, currentStage: 5, generatedWindow: [], pendingBattle: null },
      settings: { sfx: true, music: false, battleSpeed: 2, reducedMotion: false, language: 'en' },
    };

    const migrated = saveDoc.parse(migrate(v1, CURRENT_SAVE_VERSION));

    expect(migrated.saveVersion).toBe(CURRENT_SAVE_VERSION);
    // Everything the player had is untouched...
    expect(migrated.player.currencies.gold).toBe(1234);
    expect(migrated.player.cards[0].skillLevels).toEqual([2]);
    expect(migrated.player.stageRecords['4']).toEqual({ bestStars: 2, clears: 3 });
    expect(migrated.run.currentStage).toBe(5);
    expect(migrated.settings.battleSpeed).toBe(2);
    // ...and every field the newer versions added is present and empty.
    expect(migrated.player.shop).toEqual({ dayKey: '', purchased: {} });
    expect(migrated.player.summonCounts).toEqual({});
    expect(migrated.player.claimedChests).toEqual([]);
    expect(migrated.player.claimedAchievements).toEqual([]);
    expect(migrated.player.stats).toEqual({ battlesLost: 0 });
    expect(migrated.run.branches).toEqual({});
    expect(migrated.run.pendingBoon).toBeNull();
  });

  it('migrates a v2 save forward to v3, gaining forks, boons and chests', () => {
    const v2 = {
      ...createNewSave(0, 7, ENERGY_CAP),
      saveVersion: 2,
    } as Record<string, unknown>;
    const player = v2.player as Record<string, unknown>;
    const run = v2.run as Record<string, unknown>;
    player.currencies = { ...(player.currencies as object), gold: 777 };
    player.stageRecords = { '6': { bestStars: 3, clears: 1 } };
    run.currentStage = 7;
    delete player.claimedChests;
    delete run.branches;
    delete run.pendingBoon;

    const migrated = saveDoc.parse(migrate(v2, CURRENT_SAVE_VERSION));

    expect(migrated.saveVersion).toBe(CURRENT_SAVE_VERSION);
    // A v2 save has walked no forks, carries nothing and has opened no chests...
    expect(migrated.run.branches).toEqual({});
    expect(migrated.run.pendingBoon).toBeNull();
    expect(migrated.player.claimedChests).toEqual([]);
    // ...and everything it did have survives.
    expect(migrated.player.currencies.gold).toBe(777);
    expect(migrated.player.stageRecords['6']).toEqual({ bestStars: 3, clears: 1 });
    expect(migrated.run.currentStage).toBe(7);
    expect(migrated.player.shop).toEqual(
      (createNewSave(0, 7, ENERGY_CAP) as { player: { shop: unknown } }).player.shop,
    );
  });

  it('migrates a v3 save forward to v4, gaining the profile records', () => {
    const v3 = {
      ...createNewSave(0, 7, ENERGY_CAP),
      saveVersion: 3,
    } as Record<string, unknown>;
    const player = v3.player as Record<string, unknown>;
    player.currencies = { ...(player.currencies as object), gems: 42 };
    player.stageRecords = { '12': { bestStars: 3, clears: 4 } };
    delete player.claimedAchievements;
    delete player.stats;

    const migrated = saveDoc.parse(migrate(v3, CURRENT_SAVE_VERSION));

    expect(migrated.saveVersion).toBe(4);
    // Losses are genuinely unknown for an older save, so they start at zero rather
    // than being invented.
    expect(migrated.player.stats).toEqual({ battlesLost: 0 });
    expect(migrated.player.claimedAchievements).toEqual([]);
    // Everything the profile derives from is untouched.
    expect(migrated.player.currencies.gems).toBe(42);
    expect(migrated.player.stageRecords['12']).toEqual({ bestStars: 3, clears: 4 });
  });

  it('loads a stored v1 save through the service without losing progress', async () => {
    const storage = createMemoryStorageService();
    const v1 = {
      ...createNewSave(0, 7, ENERGY_CAP),
      saveVersion: 1,
    } as Record<string, unknown>;
    delete (v1.player as Record<string, unknown>).shop;
    delete (v1.player as Record<string, unknown>).summonCounts;
    delete (v1.player as Record<string, unknown>).claimedChests;
    delete (v1.player as Record<string, unknown>).claimedAchievements;
    delete (v1.player as Record<string, unknown>).stats;
    delete (v1.run as Record<string, unknown>).branches;
    delete (v1.run as Record<string, unknown>).pendingBoon;
    await storage.write(SAVE_KEY, JSON.stringify(v1));

    const { service } = makeService(storage);
    const result = await service.load(7);

    expect(result.status).toBe('loaded');
    expect(result.save.saveVersion).toBe(CURRENT_SAVE_VERSION);
    expect(result.save.player.shop.purchased).toEqual({});
  });

  it('walks a fixture forward through a chain of migrations', () => {
    // Exercises the real runner with throwaway steps, so the mechanism stays
    // covered until the first genuine migration exists.
    const table = {
      1: (d: UnknownSave) => ({ ...d, saveVersion: 2, added: 'a' }),
      2: (d: UnknownSave) => ({ ...d, saveVersion: 3, added2: 'b' }),
    };
    expect(migrate({ saveVersion: 1, keep: true }, 3, table)).toEqual({
      saveVersion: 3,
      keep: true,
      added: 'a',
      added2: 'b',
    });
  });

  it('refuses a migration step that fails to advance the version', () => {
    const table = { 1: (d: UnknownSave) => ({ ...d, saveVersion: 1 }) };
    expect(() => migrate({ saveVersion: 1 }, 2, table)).toThrow(/did not advance/);
  });

  it('has a migration registered for every version below the current one', () => {
    for (let v = 1; v < CURRENT_SAVE_VERSION; v++) {
      expect(MIGRATIONS[v], `missing migration from save version ${v}`).toBeTypeOf('function');
    }
  });
});

describe('save schema guards', () => {
  it('rejects unknown top-level fields so stale keys cannot linger', () => {
    const doc = { ...createNewSave(0, 1, ENERGY_CAP), rogueField: true };
    expect(saveDoc.safeParse(doc).success).toBe(false);
  });

  it('allows energy above the cap (rewards may overflow it — Q14b)', () => {
    const doc = createNewSave(0, 1, ENERGY_CAP);
    doc.player.energy.current = ENERGY_CAP + 15;
    expect(saveDoc.safeParse(doc).success).toBe(true);
  });

  it('caps decks at six (Q6)', () => {
    const doc = createNewSave(0, 1, ENERGY_CAP);
    doc.player.decks = Array.from({ length: 7 }, () => ({
      name: 'Deck',
      heroUid: null,
      unitUids: [],
    }));
    expect(saveDoc.safeParse(doc).success).toBe(false);
  });
});

describe('phase 2 progression survives a save round-trip', () => {
  it('keeps decks, skill levels, ascension grade and gear enhancement', async () => {
    const storage = createMemoryStorageService();
    const { service } = makeService(storage);
    const fresh = (await service.load(1)).save;

    const rich = {
      ...fresh,
      player: {
        ...fresh.player,
        currencies: { ...fresh.player.currencies, tome: 12 },
        cards: [
          {
            uid: 'c1',
            defId: 'card.ember_drake',
            level: 24,
            xp: 40,
            stars: 5,
            skillLevels: [3, 2, 1, 1, 1],
            equippedGear: { weapon: 'g1', boots: 'g2' },
            favorite: true,
          },
        ],
        gear: [
          { uid: 'g1', defId: 'gear.coral_edge', enhanceLevel: 7, substats: [] },
          {
            uid: 'g2',
            defId: 'gear.tidewalkers',
            enhanceLevel: 2,
            substats: [{ stat: 'speed' as const, value: 4, isPercent: true }],
          },
        ],
        decks: [
          {
            name: 'Front Line',
            heroUid: 'c1',
            unitUids: [null, 'c1', null, null, null, null, null, null],
          },
        ],
        activeDeckIndex: 0,
      },
    };

    await service.save(rich);
    const reloaded = await new SaveService({
      storage,
      clock: createFixedClock(1),
      energyCap: ENERGY_CAP,
    }).load(1);

    expect(reloaded.status).toBe('loaded');
    const card = reloaded.save.player.cards[0];
    expect(card.stars).toBe(5);
    expect(card.skillLevels).toEqual([3, 2, 1, 1, 1]);
    expect(card.favorite).toBe(true);
    expect(card.equippedGear.weapon).toBe('g1');
    expect(reloaded.save.player.gear[0].enhanceLevel).toBe(7);
    expect(reloaded.save.player.gear[1].substats[0]).toEqual({
      stat: 'speed',
      value: 4,
      isPercent: true,
    });
    expect(reloaded.save.player.decks[0].name).toBe('Front Line');
    expect(reloaded.save.player.currencies.tome).toBe(12);
  });

  it('accepts a deck with all eight unit slots filled', () => {
    const doc = createNewSave(0, 1, ENERGY_CAP);
    doc.player.decks = [
      {
        name: 'Full',
        heroUid: 'h',
        unitUids: ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h2'],
      },
    ];
    expect(saveDoc.safeParse(doc).success).toBe(true);
  });

  it('rejects a ninth unit slot', () => {
    const doc = createNewSave(0, 1, ENERGY_CAP);
    doc.player.decks = [
      { name: 'Too big', heroUid: null, unitUids: ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i'] },
    ];
    expect(saveDoc.safeParse(doc).success).toBe(false);
  });
});
