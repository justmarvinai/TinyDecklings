import { describe, expect, it } from 'vitest';
import { CONTENT } from '@/content';
import {
  MUSIC_MANIFEST,
  SOUND_MANIFEST,
  musicForTheme,
  type MusicKey,
  type SoundKey,
} from './soundManifest';

/**
 * The audio manifest is the single place that says what a *meaning* sounds like,
 * exactly as the icon manifest says what one looks like. These guard the contract
 * rather than the taste: every key resolves to something, every region has a bed,
 * and the placeholder synth stays quiet enough to sit under the game.
 */

describe('every sound key resolves to something audible', () => {
  it('has a file or a synth voice for each key', () => {
    for (const [key, def] of Object.entries(SOUND_MANIFEST)) {
      const audible = (def.src?.length ?? 0) > 0 || (def.synth?.length ?? 0) > 0;
      expect(audible, `${key} is silent`).toBe(true);
    }
  });

  it('keeps placeholder voices short — punctuation, not music', () => {
    for (const [key, def] of Object.entries(SOUND_MANIFEST)) {
      for (const voice of def.synth ?? []) {
        expect(voice.duration, `${key} runs long`).toBeLessThanOrEqual(0.6);
        expect(voice.gain, `${key} is loud`).toBeLessThanOrEqual(0.3);
        if (voice.attack !== undefined) {
          expect(voice.attack, `${key} attack outlasts the voice`).toBeLessThanOrEqual(
            voice.duration,
          );
        }
      }
    }
  });

  it('never glides to zero hertz, which would silence the ramp', () => {
    for (const [key, def] of Object.entries(SOUND_MANIFEST)) {
      for (const voice of def.synth ?? []) {
        if (voice.wave === 'noise') continue;
        expect(voice.freq, `${key} starts at 0Hz`).toBeGreaterThan(0);
        if (voice.toFreq !== undefined) expect(voice.toFreq, key).toBeGreaterThan(0);
      }
    }
  });
});

describe('music beds cover the game', () => {
  it('gives every authored region a bed of its own', () => {
    for (const region of CONTENT.regions.values()) {
      const key = musicForTheme(region.themeToken);
      expect(key, `${region.id} falls back`).toBe(`music.${region.themeToken}`);
      expect(MUSIC_MANIFEST[key as MusicKey]).toBeDefined();
    }
  });

  it('falls back rather than going silent on an unknown theme', () => {
    expect(MUSIC_MANIFEST[musicForTheme('theme-does-not-exist')]).toBeDefined();
  });

  it('keeps beds slow and quiet — they sit under the game, not in front of it', () => {
    for (const [key, bed] of Object.entries(MUSIC_MANIFEST)) {
      expect(bed.chords.length, `${key} has no progression`).toBeGreaterThan(1);
      expect(bed.chordSeconds, `${key} moves fast`).toBeGreaterThanOrEqual(3);
      expect(bed.gain, `${key} is loud`).toBeLessThanOrEqual(0.12);
      for (const chord of bed.chords) {
        expect(chord.length, `${key} chord is thin`).toBeGreaterThanOrEqual(2);
        for (const note of chord) expect(note).toBeGreaterThan(20);
      }
    }
  });
});

describe('the keys the game actually plays all exist', () => {
  it('covers the battle beats the screen emits', () => {
    const played: SoundKey[] = [
      'ui.tap',
      'ui.error',
      'battle.hit',
      'battle.heavyHit',
      'battle.skill',
      'battle.death',
      'battle.deploy',
      'battle.victory',
      'battle.defeat',
      'reward.coin',
      'reward.levelUp',
      'reward.summon',
      'reward.chest',
    ];
    for (const key of played) expect(SOUND_MANIFEST[key], key).toBeDefined();
  });
});
