import { describe, expect, it } from 'vitest';
import { BEATS, TUTORIAL_FINISHED, beatAt, type CoachContext } from './beats';

/**
 * The guided opening is a script, and a script that can get stuck is worse than no
 * script at all. These walk it the way a player would and assert it always ends.
 */

const ctx = (over: Partial<CoachContext> = {}): CoachContext => ({
  screen: 'map',
  highestCleared: 0,
  acknowledged: false,
  ...over,
});

describe('the tutorial script', () => {
  it('runs the first two stages and no further (Q25)', () => {
    expect(BEATS.length).toBeGreaterThan(0);
    const gates = BEATS.map((b) => b.ready).filter(Boolean);
    expect(gates.length).toBeGreaterThan(0);
    // Nothing waits on a stage past the second: the guide ends where freedom starts.
    for (const beat of BEATS) {
      expect(beat.ready?.(ctx({ highestCleared: 2 })) ?? true).toBe(true);
    }
  });

  it('gives every beat a way to finish', () => {
    for (const beat of BEATS) {
      const byTap = beat.done(ctx({ acknowledged: true }));
      const byAction = beat.done(ctx({ screen: 'battle', highestCleared: 2 }));
      expect(byTap || byAction, `${beat.id} can never finish`).toBe(true);
    }
  });

  it('asks for an action only where it has told the player what to do', () => {
    for (const beat of BEATS) {
      const waitsForTheGame = !beat.done(ctx({ acknowledged: true }));
      if (waitsForTheGame) {
        expect(beat.action, `${beat.id} waits silently`).toBeTruthy();
        expect(beat.anchor, `${beat.id} points at nothing`).toBeTruthy();
      }
    }
  });

  it('walks end to end when the player does what it asks', () => {
    let step = 0;
    let cleared = 0;
    for (let guard = 0; guard < 50 && step < BEATS.length; guard++) {
      const beat = beatAt(step)!;
      // The player is wherever the beat wants them, and does the thing.
      const doing = ctx({
        screen: beat.action ? 'battle' : beat.screen,
        highestCleared: cleared,
        acknowledged: true,
      });
      expect(beat.ready?.(ctx({ highestCleared: cleared })) ?? true, `${beat.id} never opens`).toBe(
        true,
      );
      expect(beat.done(doing), `${beat.id} never closes`).toBe(true);
      if (beat.action) cleared += 1; // that fight gets won
      step += 1;
    }
    expect(step).toBe(BEATS.length);
  });

  it('is over once the step runs past the end', () => {
    expect(beatAt(BEATS.length)).toBeNull();
    expect(beatAt(TUTORIAL_FINISHED)).toBeNull();
    expect(TUTORIAL_FINISHED).toBeGreaterThan(BEATS.length);
  });

  it('names every beat once', () => {
    expect(new Set(BEATS.map((b) => b.id)).size).toBe(BEATS.length);
  });
});
