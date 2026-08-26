/**
 * Loading, saving and autosaving.
 *
 * Autosave runs on every meaningful transition and flushes when the app is hidden,
 * so a killed app never loses more than the current animation (ARCHITECTURE.md §7).
 */
import type { StorageService } from '../storage';
import type { Clock } from '../clock';
import { CURRENT_SAVE_VERSION, createNewSave, saveDoc, type SaveDoc } from './saveSchema';
import { migrate, type UnknownSave } from './migrations';

export const SAVE_KEY = 'save.v1';

export type LoadResult =
  | { status: 'loaded'; save: SaveDoc }
  | { status: 'new'; save: SaveDoc }
  | { status: 'corrupt'; save: SaveDoc; reason: string; backupKey: string };

export interface SaveServiceOptions {
  storage: StorageService;
  clock: Clock;
  /** Starting energy for a fresh save (ENERGY_CONFIG.cap). */
  energyCap: number;
  /** Debounce for autosave writes. */
  autosaveDelayMs?: number;
  /** Called the first time a write fails, and on every failure after that. */
  onWriteError?: (error: unknown) => void;
  /** Called once a write succeeds again after failures. */
  onWriteRecovered?: () => void;
}

export class SaveService {
  private pending: SaveDoc | null = null;
  private timer: ReturnType<typeof setTimeout> | null = null;
  private failing = false;

  constructor(private readonly options: SaveServiceOptions) {}

  async load(seed: number): Promise<LoadResult> {
    const raw = await this.options.storage.read(SAVE_KEY);
    if (!raw) {
      return { status: 'new', save: this.fresh(seed) };
    }

    try {
      const parsed = JSON.parse(raw) as UnknownSave;
      const migrated = migrate(parsed, CURRENT_SAVE_VERSION);
      return { status: 'loaded', save: saveDoc.parse(migrated) };
    } catch (error) {
      // Never overwrite a save we failed to read: keep it aside so it can be recovered.
      const backupKey = `${SAVE_KEY}.corrupt.${this.options.clock.now()}`;
      await this.options.storage.write(backupKey, raw);
      return {
        status: 'corrupt',
        save: this.fresh(seed),
        reason: error instanceof Error ? error.message : String(error),
        backupKey,
      };
    }
  }

  private fresh(seed: number): SaveDoc {
    return createNewSave(this.options.clock.now(), seed, this.options.energyCap);
  }

  /**
   * Immediate, awaited write — use at hard checkpoints (battle end, purchase).
   *
   * A device that refuses the write (full storage, private browsing) is reported
   * rather than swallowed: a game that has quietly stopped saving is the worst
   * possible failure, so the player is told once and the pending document is kept
   * so a later attempt can still land.
   */
  async save(doc: SaveDoc): Promise<void> {
    const stamped: SaveDoc = { ...doc, updatedAtMs: this.options.clock.now() };
    try {
      await this.options.storage.write(SAVE_KEY, JSON.stringify(stamped));
    } catch (error) {
      this.pending = stamped;
      this.failing = true;
      this.options.onWriteError?.(error);
      return;
    }
    if (this.failing) {
      this.failing = false;
      this.options.onWriteRecovered?.();
    }
    this.pending = null;
  }

  /** True while the last write attempt failed and none has succeeded since. */
  get writesFailing(): boolean {
    return this.failing;
  }

  /** Debounced write for chatty transitions (equip, map scroll). */
  autosave(doc: SaveDoc): void {
    this.pending = doc;
    if (this.timer) clearTimeout(this.timer);
    this.timer = setTimeout(() => void this.flush(), this.options.autosaveDelayMs ?? 800);
  }

  /** Writes any debounced save immediately; safe to call when nothing is pending. */
  async flush(): Promise<void> {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    const doc = this.pending;
    if (doc) await this.save(doc);
  }

  async clear(): Promise<void> {
    if (this.timer) clearTimeout(this.timer);
    this.timer = null;
    this.pending = null;
    await this.options.storage.remove(SAVE_KEY);
  }

  /** Manual backup — the Phase 7 export/import feature (Q27) builds on this. */
  export(doc: SaveDoc): string {
    return JSON.stringify(doc, null, 2);
  }

  import(text: string): SaveDoc {
    return saveDoc.parse(migrate(JSON.parse(text) as UnknownSave, CURRENT_SAVE_VERSION));
  }
}
