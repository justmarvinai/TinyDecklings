import { useSyncExternalStore } from 'react';

/**
 * The stack of open modals.
 *
 * Two things need to know about it. Anything that floats over the app — the
 * onboarding coach, most obviously — needs to know a modal owns the screen and get
 * out of the way; and Escape needs to close *one* sheet rather than all of them. A
 * bare counter answered the first question and got the second wrong: every modal
 * listened for Escape on the window, so one press collapsed the whole stack and a
 * player backing out of the gear picker lost the card sheet underneath it too.
 *
 * Ids rather than a count, so each modal can ask whether it is the frontmost one.
 */
let nextId = 1;
let stack: readonly number[] = [];
const listeners = new Set<() => void>();

function emit(): void {
  for (const listener of listeners) listener();
}

export interface ModalHandle {
  /** True while this modal is frontmost — the only one a dismiss should reach. */
  isTop: () => boolean;
  release: () => void;
}

export function pushModal(): ModalHandle {
  const id = nextId++;
  stack = [...stack, id];
  emit();
  let released = false;
  return {
    isTop: () => stack[stack.length - 1] === id,
    release: () => {
      if (released) return;
      released = true;
      stack = stack.filter((open) => open !== id);
      emit();
    },
  };
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

const isOpen = () => stack.length > 0;
const serverIsOpen = () => false;

export function useModalOpen(): boolean {
  return useSyncExternalStore(subscribe, isOpen, serverIsOpen);
}
