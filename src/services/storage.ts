/**
 * Storage seam.
 *
 * Everything persistent goes through this interface so the web implementation can
 * be swapped for Capacitor Preferences/Filesystem later without touching game code
 * (TECH_STACK.md §4). The API is async-shaped even over synchronous localStorage
 * precisely so that swap stays additive.
 */

export interface StorageService {
  read(key: string): Promise<string | null>;
  write(key: string, value: string): Promise<void>;
  remove(key: string): Promise<void>;
  keys(): Promise<string[]>;
}

const PREFIX = 'tinydecklings:';

export function createLocalStorageService(
  backend: Storage | undefined = typeof localStorage === 'undefined' ? undefined : localStorage,
): StorageService {
  if (!backend) return createMemoryStorageService();
  return {
    async read(key) {
      try {
        return backend.getItem(PREFIX + key);
      } catch {
        // Private mode and storage-disabled browsers throw rather than return null.
        return null;
      }
    },
    async write(key, value) {
      // Quota exhaustion and storage-disabled browsers both throw here. Rethrowing
      // a recognisable error lets the save layer tell the player their progress is
      // not being kept, instead of the write vanishing into a rejected promise.
      try {
        backend.setItem(PREFIX + key, value);
      } catch (error) {
        throw new StorageWriteError(key, error);
      }
    },
    async remove(key) {
      try {
        backend.removeItem(PREFIX + key);
      } catch {
        // Nothing useful to do: the key is either gone or unreachable.
      }
    },
    async keys() {
      const out: string[] = [];
      for (let i = 0; i < backend.length; i++) {
        const k = backend.key(i);
        if (k?.startsWith(PREFIX)) out.push(k.slice(PREFIX.length));
      }
      return out;
    },
  };
}

/** Thrown when the device refuses a write — full storage, or private browsing. */
export class StorageWriteError extends Error {
  constructor(
    readonly key: string,
    override readonly cause: unknown,
  ) {
    super(`Could not write "${key}" to storage`);
    this.name = 'StorageWriteError';
  }
}

/** In-memory fallback: tests, SSR-ish contexts, and browsers with storage blocked. */
export function createMemoryStorageService(): StorageService {
  const map = new Map<string, string>();
  return {
    async read(key) {
      return map.get(key) ?? null;
    },
    async write(key, value) {
      map.set(key, value);
    },
    async remove(key) {
      map.delete(key);
    },
    async keys() {
      return [...map.keys()];
    },
  };
}
