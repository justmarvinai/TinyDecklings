import { useSyncExternalStore } from 'react';

/**
 * How many modals are open.
 *
 * A modal owns the screen while it is up, so anything that floats over the app —
 * the onboarding coach, most obviously — needs to know to get out of the way. A
 * tiny counter with subscribers rather than a DOM flag or a context, because
 * `Modal` is a single primitive and this is the one fact anyone needs from it.
 */
let openCount = 0;
const listeners = new Set<() => void>();

function emit(): void {
  for (const listener of listeners) listener();
}

export function pushModal(): () => void {
  openCount += 1;
  emit();
  let released = false;
  return () => {
    if (released) return;
    released = true;
    openCount = Math.max(0, openCount - 1);
    emit();
  };
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

const isOpen = () => openCount > 0;
const serverIsOpen = () => false;

export function useModalOpen(): boolean {
  return useSyncExternalStore(subscribe, isOpen, serverIsOpen);
}
