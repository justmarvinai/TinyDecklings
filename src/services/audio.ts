/**
 * Audio service.
 *
 * Wraps Howler so the rest of the app only ever names a sound key. Mobile browsers
 * refuse to start audio before a user gesture, so playback is a safe no-op until
 * the first tap unlocks it — callers never have to care (TECH_STACK.md).
 *
 * Sound files arrive in Phase 6 (Q26); until then every key resolves to nothing and
 * calls are silently ignored, which keeps the call sites honest from the slice on.
 */
import { Howl, Howler } from 'howler';

export type SoundKey =
  | 'ui.tap'
  | 'ui.back'
  | 'ui.error'
  | 'battle.hit'
  | 'battle.skill'
  | 'battle.death'
  | 'battle.victory'
  | 'battle.defeat'
  | 'reward.coin'
  | 'reward.levelUp';

export type MusicKey = 'music.map' | 'music.battle' | 'music.boss';

interface SoundDef {
  src: readonly string[];
  volume?: number;
  loop?: boolean;
}

/** Empty until Phase 6 ships the audio pass; keys already exist so calls are real. */
const SOUNDS: Partial<Record<SoundKey | MusicKey, SoundDef>> = {};

export interface AudioSettings {
  sfx: boolean;
  music: boolean;
}

export interface AudioService {
  /** Call once from the first user gesture. */
  unlock(): void;
  play(key: SoundKey): void;
  playMusic(key: MusicKey): void;
  stopMusic(): void;
  setSettings(settings: AudioSettings): void;
  readonly unlocked: boolean;
}

export function createAudioService(
  initial: AudioSettings = { sfx: true, music: true },
): AudioService {
  const cache = new Map<string, Howl>();
  let settings = initial;
  let unlocked = false;
  let currentMusic: { key: MusicKey; howl: Howl } | null = null;

  const load = (key: SoundKey | MusicKey): Howl | null => {
    const def = SOUNDS[key];
    if (!def) return null;
    let howl = cache.get(key);
    if (!howl) {
      howl = new Howl({ src: [...def.src], volume: def.volume ?? 1, loop: def.loop ?? false });
      cache.set(key, howl);
    }
    return howl;
  };

  return {
    get unlocked() {
      return unlocked;
    },

    unlock() {
      if (unlocked) return;
      unlocked = true;
      // Howler resumes its context on the first gesture-driven play.
      Howler.volume(1);
    },

    play(key) {
      if (!settings.sfx || !unlocked) return;
      load(key)?.play();
    },

    playMusic(key) {
      if (currentMusic?.key === key) return;
      currentMusic?.howl.stop();
      currentMusic = null;
      if (!settings.music || !unlocked) return;
      const howl = load(key);
      if (!howl) return;
      howl.loop(true);
      howl.play();
      currentMusic = { key, howl };
    },

    stopMusic() {
      currentMusic?.howl.stop();
      currentMusic = null;
    },

    setSettings(next) {
      settings = next;
      if (!next.music) {
        currentMusic?.howl.stop();
        currentMusic = null;
      }
    },
  };
}
