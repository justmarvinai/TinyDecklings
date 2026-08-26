import { useEffect } from 'react';
import type { SaveService } from '@/services/saves';

/**
 * Flushes any debounced autosave when the app is backgrounded.
 *
 * `visibilitychange` (plus `pagehide` for iOS Safari, which often skips the former
 * when the tab is discarded) is the last reliable moment to write on mobile.
 */
export function useAutosaveLifecycle(saves: SaveService): void {
  useEffect(() => {
    const flush = () => void saves.flush();
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') flush();
    };

    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('pagehide', flush);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('pagehide', flush);
      flush();
    };
  }, [saves]);
}
