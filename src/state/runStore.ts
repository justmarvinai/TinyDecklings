/**
 * The journey: where the player is on the endless road and what lies around them.
 *
 * Stages are generated from the run seed on demand, so the save only ever holds a
 * rolling window rather than an ever-growing list (CONTENT_SCHEMA.md §10). Two
 * things are *not* derived, because they are decisions rather than geography: the
 * side of each fork the player took (Q2), and any boon a vignette hung on the
 * party for its next fight.
 */
import { create } from 'zustand';
import { CONTENT } from '@/content';
import type { ForkBranch, GeneratedStage, StatusId } from '@/content/schemas';
import {
  forkSpanFor,
  generateForkOptions,
  generateStage,
  generateWindow,
  lootTableForStage,
} from '@/engine/map/generate';
import type { SaveDoc } from '@/services/saves';

/** A status a vignette handed to the next fight. */
export interface PendingBoon {
  status: StatusId;
  side: 'player' | 'enemy';
  stacks: number;
}

export interface RunState {
  seed: number;
  currentStage: number;
  window: GeneratedStage[];
  branches: Record<string, ForkBranch>;
  pendingBoon: PendingBoon | null;

  hydrate: (save: SaveDoc) => void;
  stage: (number: number) => GeneratedStage;
  lootTableFor: (stage: GeneratedStage) => string;
  /** Furthest stage the player may enter — one past their best clear. */
  advanceTo: (stageNumber: number) => void;
  refreshWindow: () => void;

  /** The fork span a stage sits in, or null. */
  forkAt: (stageNumber: number) => { start: number; length: number } | null;
  /** Which side of the fork starting at `forkStart` the player is on. */
  branchFor: (forkStart: number) => ForkBranch;
  /** Both roads out of a fork, for the map's choice UI. */
  forkOptions: (forkStart: number) => Record<ForkBranch, GeneratedStage[]>;
  chooseBranch: (forkStart: number, branch: ForkBranch) => void;

  setBoon: (boon: PendingBoon | null) => void;
  /** Reads the boon and clears it — a boon is spent by the fight that uses it. */
  takeBoon: () => PendingBoon | null;

  toSave: () => Pick<
    SaveDoc['run'],
    'seed' | 'currentStage' | 'generatedWindow' | 'branches' | 'pendingBoon'
  >;
}

export const useRunStore = create<RunState>((set, get) => ({
  seed: 1,
  currentStage: 1,
  window: [],
  branches: {},
  pendingBoon: null,

  hydrate: (save) => {
    const { seed, currentStage, branches, pendingBoon } = save.run;
    set({
      seed,
      currentStage,
      branches: { ...branches },
      pendingBoon,
      window: generateWindow(CONTENT, seed, currentStage, branches),
    });
  },

  stage: (number) => {
    const { window, seed, branches } = get();
    const found = window.find((s) => s.number === number);
    if (found) return found;
    const span = forkSpanFor(CONTENT, number);
    const branch = span ? (branches[String(span.start)] ?? 'a') : 'a';
    return generateStage(CONTENT, seed, number, branch);
  },

  lootTableFor: (stage) => lootTableForStage(CONTENT, stage),

  advanceTo: (stageNumber) => {
    const next = Math.max(1, stageNumber);
    set((s) => ({
      currentStage: next,
      window: generateWindow(CONTENT, s.seed, next, s.branches),
    }));
  },

  refreshWindow: () =>
    set((s) => ({ window: generateWindow(CONTENT, s.seed, s.currentStage, s.branches) })),

  forkAt: (stageNumber) => forkSpanFor(CONTENT, stageNumber),

  branchFor: (forkStart) => get().branches[String(forkStart)] ?? 'a',

  forkOptions: (forkStart) => generateForkOptions(CONTENT, get().seed, forkStart),

  chooseBranch: (forkStart, branch) =>
    set((s) => {
      const branches = { ...s.branches, [String(forkStart)]: branch };
      return { branches, window: generateWindow(CONTENT, s.seed, s.currentStage, branches) };
    }),

  setBoon: (boon) => set({ pendingBoon: boon }),

  takeBoon: () => {
    const boon = get().pendingBoon;
    if (boon) set({ pendingBoon: null });
    return boon;
  },

  toSave: () => {
    const { seed, currentStage, window, branches, pendingBoon } = get();
    return { seed, currentStage, generatedWindow: window, branches, pendingBoon };
  },
}));
