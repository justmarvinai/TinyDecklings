import { useCallback, useSyncExternalStore } from 'react';
import { useSettingsStore } from '@/state/settingsStore';

const QUERY = '(prefers-reduced-motion: reduce)';

function subscribe(onChange: () => void): () => void {
  if (typeof window === 'undefined' || !window.matchMedia) return () => {};
  const query = window.matchMedia(QUERY);
  query.addEventListener('change', onChange);
  return () => query.removeEventListener('change', onChange);
}

function systemPrefersReduced(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia(QUERY).matches;
}

/**
 * Whether motion should be calmed (Q28).
 *
 * True when the player asked for it in settings **or** when the device already
 * says so through `prefers-reduced-motion`. Either alone is enough: a player who
 * set it system-wide should not have to find it again in here. The media query is
 * read through `useSyncExternalStore`, so it is never a state write in an effect.
 */
export function useReducedMotion(): boolean {
  const setting = useSettingsStore((s) => s.reducedMotion);
  const system = useSyncExternalStore(
    subscribe,
    systemPrefersReduced,
    useCallback(() => false, []),
  );
  return setting || system;
}
