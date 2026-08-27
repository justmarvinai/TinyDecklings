/**
 * Semantic sound key -> placeholder audio.
 *
 * The same arrangement as the icon manifest (`ui/icons/iconManifest.ts`): the game
 * only ever names a *meaning*, and this module is the single place that says what
 * that meaning sounds like. Every entry today is a **synthesized placeholder** —
 * short Web Audio envelopes rather than files — so the game is audible now with no
 * asset licensing and nothing to download.
 *
 * When the owner's real audio arrives it is dropped in as files and each entry
 * gains a `src`; no call site changes (CLAUDE.md rule 6). A key with both plays
 * the file and ignores the synth.
 */

/** A short synthesized voice: an oscillator (or noise) through a gain envelope. */
export interface SynthVoice {
  /** `noise` is filtered white noise — impacts, deaths, coins. */
  wave: OscillatorType | 'noise';
  /** Start frequency in Hz. Ignored for noise. */
  freq: number;
  /** Frequency to glide to over the voice's life, if it moves. */
  toFreq?: number;
  /** Seconds. Kept short: these are punctuation, not music. */
  duration: number;
  /** Peak gain before the mix, 0-1. */
  gain: number;
  /** Attack in seconds; the rest of the duration decays. */
  attack?: number;
  /** Low-pass corner in Hz, mostly to take the edge off noise. */
  lowpass?: number;
  /** Delay before this voice starts, for two-note stings. */
  delay?: number;
}

export interface SoundDef {
  /** Real audio, once it exists. Takes precedence over `synth`. */
  src?: readonly string[];
  /** Placeholder voices, played together. */
  synth?: readonly SynthVoice[];
  volume?: number;
}

export type SoundKey =
  | 'ui.tap'
  | 'ui.back'
  | 'ui.error'
  | 'battle.hit'
  | 'battle.heavyHit'
  | 'battle.skill'
  | 'battle.death'
  | 'battle.deploy'
  | 'battle.victory'
  | 'battle.defeat'
  | 'reward.coin'
  | 'reward.levelUp'
  | 'reward.summon'
  | 'reward.chest';

export const SOUND_MANIFEST: Record<SoundKey, SoundDef> = {
  'ui.tap': {
    synth: [{ wave: 'triangle', freq: 660, toFreq: 880, duration: 0.07, gain: 0.16 }],
  },
  'ui.back': {
    synth: [{ wave: 'triangle', freq: 520, toFreq: 360, duration: 0.09, gain: 0.14 }],
  },
  'ui.error': {
    synth: [{ wave: 'square', freq: 200, toFreq: 150, duration: 0.13, gain: 0.1, lowpass: 1200 }],
  },

  'battle.hit': {
    synth: [
      { wave: 'noise', freq: 0, duration: 0.11, gain: 0.2, lowpass: 2400 },
      { wave: 'triangle', freq: 240, toFreq: 120, duration: 0.09, gain: 0.14 },
    ],
  },
  'battle.heavyHit': {
    synth: [
      { wave: 'noise', freq: 0, duration: 0.2, gain: 0.28, lowpass: 1400 },
      { wave: 'sine', freq: 150, toFreq: 60, duration: 0.22, gain: 0.26 },
    ],
  },
  'battle.skill': {
    synth: [
      { wave: 'sawtooth', freq: 320, toFreq: 780, duration: 0.2, gain: 0.13, lowpass: 3000 },
      { wave: 'sine', freq: 640, toFreq: 1560, duration: 0.22, gain: 0.09, delay: 0.03 },
    ],
  },
  'battle.death': {
    synth: [
      { wave: 'noise', freq: 0, duration: 0.3, gain: 0.18, lowpass: 900 },
      { wave: 'sine', freq: 300, toFreq: 70, duration: 0.34, gain: 0.16 },
    ],
  },
  'battle.deploy': {
    synth: [
      { wave: 'triangle', freq: 300, toFreq: 600, duration: 0.13, gain: 0.14 },
      { wave: 'sine', freq: 900, duration: 0.08, gain: 0.07, delay: 0.06 },
    ],
  },
  'battle.victory': {
    synth: [
      { wave: 'triangle', freq: 523, duration: 0.16, gain: 0.16 },
      { wave: 'triangle', freq: 659, duration: 0.16, gain: 0.16, delay: 0.14 },
      { wave: 'triangle', freq: 784, duration: 0.34, gain: 0.18, delay: 0.28 },
      { wave: 'sine', freq: 1046, duration: 0.4, gain: 0.1, delay: 0.28 },
    ],
  },
  'battle.defeat': {
    synth: [
      { wave: 'triangle', freq: 440, duration: 0.2, gain: 0.14 },
      { wave: 'triangle', freq: 330, duration: 0.24, gain: 0.14, delay: 0.16 },
      { wave: 'sine', freq: 220, toFreq: 165, duration: 0.5, gain: 0.14, delay: 0.34 },
    ],
  },

  'reward.coin': {
    synth: [
      { wave: 'square', freq: 1046, duration: 0.06, gain: 0.09 },
      { wave: 'square', freq: 1568, duration: 0.1, gain: 0.08, delay: 0.05 },
    ],
  },
  'reward.levelUp': {
    synth: [
      { wave: 'triangle', freq: 587, duration: 0.1, gain: 0.14 },
      { wave: 'triangle', freq: 880, duration: 0.1, gain: 0.14, delay: 0.09 },
      { wave: 'triangle', freq: 1174, duration: 0.26, gain: 0.15, delay: 0.18 },
    ],
  },
  'reward.summon': {
    synth: [
      { wave: 'sine', freq: 180, toFreq: 1200, duration: 0.5, gain: 0.12, attack: 0.3 },
      { wave: 'triangle', freq: 1568, duration: 0.3, gain: 0.12, delay: 0.42 },
    ],
  },
  'reward.chest': {
    synth: [
      { wave: 'noise', freq: 0, duration: 0.14, gain: 0.14, lowpass: 3000 },
      { wave: 'triangle', freq: 784, duration: 0.14, gain: 0.14, delay: 0.1 },
      { wave: 'triangle', freq: 1174, duration: 0.28, gain: 0.14, delay: 0.2 },
    ],
  },
};

/**
 * Music beds, one per region theme plus the two battle moods.
 *
 * Also placeholder, and generative rather than sampled: a slow chord bed built
 * from the notes below, so the map has an atmosphere without shipping a single
 * megabyte. Real tracks replace this the same way — drop in files, keep the keys.
 */
export type MusicKey =
  | 'music.theme-isles'
  | 'music.theme-ashfall'
  | 'music.theme-verdant'
  | 'music.battle'
  | 'music.boss';

export interface MusicBed {
  src?: readonly string[];
  /** Chords as frequencies in Hz; the bed drifts through them in order. */
  chords: readonly (readonly number[])[];
  /** Seconds per chord. Slow on purpose — this sits under everything. */
  chordSeconds: number;
  wave: OscillatorType;
  lowpass: number;
  gain: number;
}

/** A minor, B♭ minor and D minor beds; battle moods sit lower and move faster. */
export const MUSIC_MANIFEST: Record<MusicKey, MusicBed> = {
  'music.theme-isles': {
    chords: [
      [110, 164.81, 220],
      [98, 146.83, 196],
      [123.47, 185, 246.94],
      [98, 146.83, 196],
    ],
    chordSeconds: 7,
    wave: 'sine',
    lowpass: 700,
    gain: 0.1,
  },
  'music.theme-ashfall': {
    chords: [
      [116.54, 174.61, 233.08],
      [103.83, 155.56, 207.65],
      [87.31, 130.81, 174.61],
      [103.83, 155.56, 207.65],
    ],
    chordSeconds: 6,
    wave: 'triangle',
    lowpass: 620,
    gain: 0.09,
  },
  'music.theme-verdant': {
    chords: [
      [146.83, 220, 293.66],
      [130.81, 196, 261.63],
      [116.54, 174.61, 233.08],
      [130.81, 196, 261.63],
    ],
    chordSeconds: 8,
    wave: 'sine',
    lowpass: 800,
    gain: 0.09,
  },
  'music.battle': {
    chords: [
      [82.41, 123.47, 164.81],
      [87.31, 130.81, 174.61],
      [73.42, 110, 146.83],
      [87.31, 130.81, 174.61],
    ],
    chordSeconds: 4,
    wave: 'sawtooth',
    lowpass: 420,
    gain: 0.08,
  },
  'music.boss': {
    chords: [
      [65.41, 98, 130.81],
      [69.3, 103.83, 138.59],
      [61.74, 92.5, 123.47],
      [69.3, 103.83, 138.59],
    ],
    chordSeconds: 3.5,
    wave: 'sawtooth',
    lowpass: 380,
    gain: 0.09,
  },
};

/** Region theme token -> its music key, so the map plays what the biome is. */
export function musicForTheme(themeToken: string): MusicKey {
  const key = `music.${themeToken}` as MusicKey;
  return key in MUSIC_MANIFEST ? key : 'music.theme-isles';
}
