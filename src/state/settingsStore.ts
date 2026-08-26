/**
 * Player settings. Mirrors `SaveDoc.settings` and is the source the audio service
 * and battle sequencer read from.
 */
import { create } from 'zustand';
import type { SaveDoc } from '@/services/saves';

export type BattleSpeed = 1 | 2;

export interface SettingsState {
  sfx: boolean;
  music: boolean;
  battleSpeed: BattleSpeed;
  /** Explicit opt-in; the OS `prefers-reduced-motion` is honoured independently (Q28). */
  reducedMotion: boolean;
  language: string;
  setSfx: (on: boolean) => void;
  setMusic: (on: boolean) => void;
  setBattleSpeed: (speed: BattleSpeed) => void;
  setReducedMotion: (on: boolean) => void;
  hydrate: (settings: SaveDoc['settings']) => void;
  toSave: () => SaveDoc['settings'];
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  sfx: true,
  music: true,
  battleSpeed: 1,
  reducedMotion: false,
  language: 'en',

  setSfx: (on) => set({ sfx: on }),
  setMusic: (on) => set({ music: on }),
  setBattleSpeed: (speed) => set({ battleSpeed: speed }),
  setReducedMotion: (on) => set({ reducedMotion: on }),

  hydrate: (settings) =>
    set({
      sfx: settings.sfx,
      music: settings.music,
      battleSpeed: settings.battleSpeed,
      reducedMotion: settings.reducedMotion,
      language: settings.language,
    }),

  toSave: () => {
    const { sfx, music, battleSpeed, reducedMotion, language } = get();
    return { sfx, music, battleSpeed, reducedMotion, language };
  },
}));
