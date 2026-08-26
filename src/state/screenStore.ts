/**
 * Screen-stack navigation.
 *
 * Screens are game states, not URLs (ARCHITECTURE.md AD-4): a wrapped mobile app
 * has no meaningful address bar, so a typed stack replaces a router. Tabs are
 * stack roots; details and modals push on top; hardware/browser back pops.
 */
import { create } from 'zustand';

export type TabId = 'map' | 'cards' | 'summon' | 'shop' | 'more';

export type Screen =
  // tab roots
  | { kind: 'map' }
  | { kind: 'cards' }
  | { kind: 'summon' }
  | { kind: 'shop' }
  | { kind: 'more' }
  // pushed screens
  | { kind: 'battle'; stage: number }
  | { kind: 'cardDetail'; cardUid: string }
  | { kind: 'settings' }
  | { kind: 'profile' }
  | { kind: 'devKitchenSink' };

export type ScreenKind = Screen['kind'];

export interface ScreenEntry {
  screen: Screen;
  /** Modals render over the entry below instead of replacing it. */
  modal: boolean;
}

/** Which tab a screen belongs to, so the tab bar keeps the right item lit. */
const SCREEN_TAB: Readonly<Record<ScreenKind, TabId>> = {
  map: 'map',
  battle: 'map',
  cards: 'cards',
  cardDetail: 'cards',
  summon: 'summon',
  shop: 'shop',
  more: 'more',
  settings: 'more',
  profile: 'more',
  devKitchenSink: 'more',
};

const TAB_ROOT: Readonly<Record<TabId, Screen>> = {
  map: { kind: 'map' },
  cards: { kind: 'cards' },
  summon: { kind: 'summon' },
  shop: { kind: 'shop' },
  more: { kind: 'more' },
};

export interface ScreenState {
  stack: ScreenEntry[];
  push: (screen: Screen, options?: { modal?: boolean }) => void;
  replace: (screen: Screen) => void;
  pop: () => void;
  /** Switch tab: returns to that tab's root, dropping anything stacked above. */
  switchTab: (tab: TabId) => void;
  reset: (screen?: Screen) => void;
}

export const useScreenStore = create<ScreenState>((set) => ({
  stack: [{ screen: { kind: 'map' }, modal: false }],

  push: (screen, options) =>
    set((s) => ({ stack: [...s.stack, { screen, modal: options?.modal ?? false }] })),

  replace: (screen) =>
    set((s) => ({
      stack: [...s.stack.slice(0, -1), { screen, modal: false }],
    })),

  pop: () => set((s) => (s.stack.length > 1 ? { stack: s.stack.slice(0, -1) } : s)),

  switchTab: (tab) => set({ stack: [{ screen: TAB_ROOT[tab], modal: false }] }),

  reset: (screen) => set({ stack: [{ screen: screen ?? { kind: 'map' }, modal: false }] }),
}));

/** The entry the player is interacting with. */
export function currentEntry(state: Pick<ScreenState, 'stack'>): ScreenEntry {
  return state.stack[state.stack.length - 1];
}

/** The topmost non-modal entry — what renders behind an open modal. */
export function currentScreen(state: Pick<ScreenState, 'stack'>): Screen {
  for (let i = state.stack.length - 1; i >= 0; i--) {
    const entry = state.stack[i];
    if (!entry.modal) return entry.screen;
  }
  return state.stack[0].screen;
}

export function activeTab(state: Pick<ScreenState, 'stack'>): TabId {
  return SCREEN_TAB[currentScreen(state).kind];
}

export function canPop(state: Pick<ScreenState, 'stack'>): boolean {
  return state.stack.length > 1;
}

export { SCREEN_TAB, TAB_ROOT };
