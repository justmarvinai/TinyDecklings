/**
 * The journey: where the player is on the endless road and what lies around them.
 *
 * Stages are generated from the run seed on demand, so the save only ever holds a
 * rolling window rather than an ever-growing list (CONTENT_SCHEMA.md §10).
 */
import { create } from 'zustand';
import { CONTENT } from '@/content';
import type { GeneratedStage } from '@/content/schemas';
import { generateStage, generateWindow, lootTableForStage } from '@/engine/map/generate';
import type { SaveDoc } from '@/services/saves';

export interface RunState {
  seed: number;
  currentStage: number;
  window: GeneratedStage[];

  hydrate: (save: SaveDoc) => void;
  stage: (number: number) => GeneratedStage;
  lootTableFor: (stage: GeneratedStage) => string;
  /** Furthest stage the player may enter — one past their best clear. */
  advanceTo: (stageNumber: number) => void;
  refreshWindow: () => void;
  toSave: () => Pick<SaveDoc['run'], 'seed' | 'currentStage' | 'generatedWindow'>;
}

export const useRunStore = create<RunState>((set, get) => ({
  seed: 1,
  currentStage: 1,
  window: [],

  hydrate: (save) => {
    const seed = save.run.seed;
    const currentStage = save.run.currentStage;
    set({ seed, currentStage, window: generateWindow(CONTENT, seed, currentStage) });
  },

  stage: (number) => {
    const { window, seed } = get();
    return window.find((s) => s.number === number) ?? generateStage(CONTENT, seed, number);
  },

  lootTableFor: (stage) => lootTableForStage(CONTENT, stage),

  advanceTo: (stageNumber) => {
    const next = Math.max(1, stageNumber);
    set({ currentStage: next, window: generateWindow(CONTENT, get().seed, next) });
  },

  refreshWindow: () => set((s) => ({ window: generateWindow(CONTENT, s.seed, s.currentStage) })),

  toSave: () => {
    const { seed, currentStage, window } = get();
    return { seed, currentStage, generatedWindow: window };
  },
}));
