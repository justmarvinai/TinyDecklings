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
      backend.setItem(PREFIX + key, value);
    },
    async remove(key) {
      backend.removeItem(PREFIX + key);
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
