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
    expect(() => migrate({ saveVersion: CURRENT_SAVE_VERSION - 1 }, CURRENT_SAVE_VERSION)).toThrow(
      /add one in migrations\.ts/,
    );
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
