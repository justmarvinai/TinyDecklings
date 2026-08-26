/**
 * Player settings. Mirrors `SaveDoc.settings` and is the source the audio service
 * and battle sequencer read from.
 */
import { create } from 'zustand';
import type { SaveDoc } from '@/services/saves';

export type BattleSpeed = 1 | 2;

const clamp = (v: number) => Math.min(1, Math.max(0, v));

export interface SettingsState {
  sfx: boolean;
  music: boolean;
  /** Mix levels, 0-1. The booleans above are on/off; these are how loud (Q26). */
  sfxVolume: number;
  musicVolume: number;
  battleSpeed: BattleSpeed;
  /** Explicit opt-in; the OS `prefers-reduced-motion` is honoured independently (Q28). */
  reducedMotion: boolean;
  language: string;
  setSfx: (on: boolean) => void;
  setMusic: (on: boolean) => void;
  setSfxVolume: (volume: number) => void;
  setMusicVolume: (volume: number) => void;
  setBattleSpeed: (speed: BattleSpeed) => void;
  setReducedMotion: (on: boolean) => void;
  hydrate: (settings: SaveDoc['settings']) => void;
  toSave: () => SaveDoc['settings'];
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  sfx: true,
  music: true,
  sfxVolume: 0.8,
  musicVolume: 0.45,
  battleSpeed: 1,
  reducedMotion: false,
  language: 'en',

  setSfx: (on) => set({ sfx: on }),
  setMusic: (on) => set({ music: on }),
  setSfxVolume: (volume) => set({ sfxVolume: clamp(volume) }),
  setMusicVolume: (volume) => set({ musicVolume: clamp(volume) }),
  setBattleSpeed: (speed) => set({ battleSpeed: speed }),
  setReducedMotion: (on) => set({ reducedMotion: on }),

  hydrate: (settings) =>
    set({
      sfx: settings.sfx,
      music: settings.music,
      sfxVolume: settings.sfxVolume,
      musicVolume: settings.musicVolume,
      battleSpeed: settings.battleSpeed,
      reducedMotion: settings.reducedMotion,
      language: settings.language,
    }),

  toSave: () => {
    const { sfx, music, sfxVolume, musicVolume, battleSpeed, reducedMotion, language } = get();
    return { sfx, music, sfxVolume, musicVolume, battleSpeed, reducedMotion, language };
  },
}));
