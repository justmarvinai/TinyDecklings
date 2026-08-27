/**
 * Audio service.
 *
 * The rest of the app only ever names a sound — `audio.play('battle.hit')` — and
 * this decides what that means. Two backends sit behind that name:
 *
 * - **Files**, once the owner's audio arrives: played through Howler, cached.
 * - **Synth**, today: short Web Audio envelopes built from the manifest. No assets
 *   to license, nothing to download, and swapping in real audio is a manifest
 *   change with no call site touched (CLAUDE.md rule 6).
 *
 * Mobile browsers refuse to start audio before a user gesture, so everything is a
 * safe no-op until the first tap unlocks it — callers never have to care.
 */
import { Howl, Howler } from 'howler';
import {
  MUSIC_MANIFEST,
  SOUND_MANIFEST,
  type MusicKey,
  type SoundKey,
  type SynthVoice,
} from './soundManifest';

export interface AudioSettings {
  sfx: boolean;
  music: boolean;
  /** 0-1 mix levels (Q26). */
  sfxVolume: number;
  musicVolume: number;
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

const DEFAULTS: AudioSettings = { sfx: true, music: true, sfxVolume: 0.8, musicVolume: 0.45 };

type AudioContextCtor = typeof AudioContext;

function audioContextCtor(): AudioContextCtor | null {
  if (typeof window === 'undefined') return null;
  const w = window as unknown as {
    AudioContext?: AudioContextCtor;
    webkitAudioContext?: AudioContextCtor;
  };
  return w.AudioContext ?? w.webkitAudioContext ?? null;
}

/** A second of white noise, generated once and reused by every noise voice. */
function noiseBuffer(ctx: AudioContext): AudioBuffer {
  const buffer = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  return buffer;
}

export function createAudioService(initial: AudioSettings = DEFAULTS): AudioService {
  const howls = new Map<string, Howl>();
  let settings = initial;
  let unlocked = false;
  let ctx: AudioContext | null = null;
  let noise: AudioBuffer | null = null;
  let sfxBus: GainNode | null = null;
  let musicBus: GainNode | null = null;
  let currentMusic: { key: MusicKey; stop: () => void } | null = null;

  const ensureContext = (): AudioContext | null => {
    if (ctx) return ctx;
    const Ctor = audioContextCtor();
    if (!Ctor) return null;
    ctx = new Ctor();
    noise = noiseBuffer(ctx);
    sfxBus = ctx.createGain();
    musicBus = ctx.createGain();
    sfxBus.gain.value = settings.sfxVolume;
    musicBus.gain.value = settings.musicVolume;
    sfxBus.connect(ctx.destination);
    musicBus.connect(ctx.destination);
    return ctx;
  };

  let howlerWoken = false;
  const wakeHowler = (): void => {
    if (howlerWoken) return;
    howlerWoken = true;
    Howler.volume(1);
  };

  const howl = (key: string, src: readonly string[], volume: number, loop: boolean): Howl => {
    let existing = howls.get(key);
    if (!existing) {
      existing = new Howl({ src: [...src], volume, loop });
      howls.set(key, existing);
    }
    return existing;
  };

  /** One oscillator (or noise burst) through its own envelope, into a bus. */
  const playVoice = (voice: SynthVoice, bus: GainNode, at: number, scale: number): void => {
    const context = ctx;
    if (!context) return;

    const start = at + (voice.delay ?? 0);
    const gain = context.createGain();
    const attack = Math.min(voice.attack ?? 0.005, voice.duration * 0.5);
    const peak = voice.gain * scale;

    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.linearRampToValueAtTime(peak, start + attack);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + voice.duration);

    let node: AudioNode;
    if (voice.wave === 'noise') {
      const source = context.createBufferSource();
      source.buffer = noise;
      source.start(start);
      source.stop(start + voice.duration);
      node = source;
    } else {
      const osc = context.createOscillator();
      osc.type = voice.wave;
      osc.frequency.setValueAtTime(voice.freq, start);
      if (voice.toFreq !== undefined) {
        osc.frequency.exponentialRampToValueAtTime(
          Math.max(1, voice.toFreq),
          start + voice.duration,
        );
      }
      osc.start(start);
      osc.stop(start + voice.duration);
      node = osc;
    }

    if (voice.lowpass !== undefined) {
      const filter = context.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = voice.lowpass;
      node.connect(filter);
      filter.connect(gain);
    } else {
      node.connect(gain);
    }
    gain.connect(bus);
  };

  /**
   * A generative music bed.
   *
   * Three oscillators hold a chord, and a timer walks them through the progression
   * with a long crossfade. It is deliberately slow and quiet: this sits under the
   * game rather than in front of it.
   */
  const startBed = (key: MusicKey): (() => void) | null => {
    const context = ensureContext();
    const bed = MUSIC_MANIFEST[key];
    if (!context || !musicBus) return null;

    const filter = context.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = bed.lowpass;
    const bedGain = context.createGain();
    bedGain.gain.value = 0.0001;
    filter.connect(bedGain);
    bedGain.connect(musicBus);
    bedGain.gain.linearRampToValueAtTime(bed.gain, context.currentTime + 2);

    const voices = bed.chords[0].map((freq) => {
      const osc = context.createOscillator();
      osc.type = bed.wave;
      osc.frequency.value = freq;
      // A touch of detune keeps three plain oscillators from sounding like a test tone.
      osc.detune.value = (Math.random() - 0.5) * 8;
      osc.connect(filter);
      osc.start();
      return osc;
    });

    let index = 0;
    const step = () => {
      const live = ctx;
      if (!live) return;
      index = (index + 1) % bed.chords.length;
      const chord = bed.chords[index];
      voices.forEach((osc, i) => {
        const target = chord[i % chord.length];
        osc.frequency.linearRampToValueAtTime(target, live.currentTime + bed.chordSeconds * 0.4);
      });
    };
    const timer = setInterval(step, bed.chordSeconds * 1000);

    return () => {
      clearInterval(timer);
      if (ctx) bedGain.gain.linearRampToValueAtTime(0.0001, ctx.currentTime + 0.6);
      for (const osc of voices) {
        try {
          osc.stop(ctx ? ctx.currentTime + 0.7 : 0);
        } catch {
          // Already stopped; nothing to do.
        }
      }
    };
  };

  return {
    get unlocked() {
      return unlocked;
    },

    unlock() {
      if (unlocked) return;
      unlocked = true;
      // Deliberately not touching Howler here: it builds an AudioContext of its own
      // the moment it is asked for anything, and while every sound is synthesized
      // that would be a second idle context on the player's phone for nothing. It
      // wakes up the first time a file-backed sound is actually played.
      void ensureContext()?.resume();
    },

    play(key) {
      if (!settings.sfx || !unlocked) return;
      const def = SOUND_MANIFEST[key];
      if (!def) return;

      if (def.src) {
        wakeHowler();
        howl(key, def.src, (def.volume ?? 1) * settings.sfxVolume, false).play();
        return;
      }
      const context = ensureContext();
      if (!context || !sfxBus || !def.synth) return;
      const now = context.currentTime;
      for (const voice of def.synth) playVoice(voice, sfxBus, now, def.volume ?? 1);
    },

    playMusic(key) {
      if (currentMusic?.key === key) return;
      currentMusic?.stop();
      currentMusic = null;
      if (!settings.music || !unlocked) return;

      const bed = MUSIC_MANIFEST[key];
      if (bed?.src) {
        wakeHowler();
        const track = howl(key, bed.src, settings.musicVolume, true);
        track.play();
        currentMusic = { key, stop: () => track.stop() };
        return;
      }
      const stop = startBed(key);
      if (stop) currentMusic = { key, stop };
    },

    stopMusic() {
      currentMusic?.stop();
      currentMusic = null;
    },

    setSettings(next) {
      const wasPlaying = currentMusic?.key ?? null;
      settings = next;
      if (sfxBus) sfxBus.gain.value = next.sfxVolume;
      if (musicBus) musicBus.gain.value = next.musicVolume;
      for (const track of howls.values()) track.volume(next.sfxVolume);

      if (!next.music && currentMusic) {
        currentMusic.stop();
        currentMusic = null;
      } else if (next.music && !currentMusic && wasPlaying) {
        this.playMusic(wasPlaying);
      }
    },
  };
}
