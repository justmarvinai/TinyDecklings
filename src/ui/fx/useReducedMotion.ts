import { useCallback, useEffect, useSyncExternalStore } from 'react';
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

/**
 * Publishes the reduced-motion preference to CSS.
 *
 * `prefers-reduced-motion` covers the player who set it on their phone; the
 * in-game switch (Q28) had no way to reach a stylesheet, so flipping it calmed the
 * screen shake and nothing else — every keyframe in the app kept running. Stamping
 * the merged answer on the document root gives CSS one selector to honour, and
 * `:root[data-motion='reduced']` sits next to each `@media` block that already
 * asks the same question.
 */
export function useMotionPreference(): void {
  const reduced = useReducedMotion();
  useEffect(() => {
    document.documentElement.dataset.motion = reduced ? 'reduced' : 'full';
  }, [reduced]);
}
