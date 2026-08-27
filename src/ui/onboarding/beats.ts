import type { ScreenKind } from '@/state/screenStore';

/**
 * The guided opening (Q25): the first two stages, then free.
 *
 * A beat advances when its own `done` predicate is true of the app, rather than by
 * screens firing events at a tutorial engine. That keeps the whole script readable
 * in one place and means nothing can get stuck: if a beat's condition is already
 * satisfied — a returning player, a stage cleared out of order — it simply passes.
 */
export interface CoachContext {
  screen: ScreenKind;
  /** Furthest stage with at least one star. */
  highestCleared: number;
  /** True once the player has tapped "Got it" on the current beat. */
  acknowledged: boolean;
}

export interface Beat {
  id: string;
  /** Prose, in normal case — caps hurt readability here (rule 9). */
  text: string;
  /** The beat waits quietly until the player is on this screen. */
  screen: ScreenKind;
  /** Element to ring, by its `data-coach` attribute. */
  anchor?: string;
  /** Shown under the text when the beat asks for an action rather than a tap. */
  action?: string;
  /** Nothing before this is true even starts the beat. */
  ready?: (ctx: CoachContext) => boolean;
  /** When this is true the beat is finished. */
  done: (ctx: CoachContext) => boolean;
}

const acknowledged = (ctx: CoachContext) => ctx.acknowledged;

export const BEATS: readonly Beat[] = [
  {
    id: 'welcome',
    screen: 'map',
    text: 'This is the road. Every medallion is a stage, and you walk it upward — the further you go, the harder it gets.',
    done: acknowledged,
  },
  {
    id: 'openStage',
    screen: 'map',
    anchor: 'stage-current',
    text: 'The lit medallion is where you are. Open it and take the fight.',
    action: 'Tap stage 1',
    done: (ctx) => ctx.screen === 'battle',
  },
  {
    id: 'attack',
    screen: 'battle',
    text: 'Your cards hold the bottom half, theirs the top. The card with the gold ring is up: tap an enemy to swing at it.',
    done: acknowledged,
  },
  {
    id: 'auto',
    screen: 'battle',
    anchor: 'auto',
    text: 'Or let AUTO play it out and watch. You can switch back mid-fight, and ×2 doubles the speed.',
    done: acknowledged,
  },
  {
    id: 'stars',
    screen: 'map',
    ready: (ctx) => ctx.highestCleared >= 1,
    text: 'Stars are how well you did: three means you lost nobody. Records are permanent, and a beaten stage stays open to farm.',
    done: acknowledged,
  },
  {
    id: 'secondStage',
    screen: 'map',
    anchor: 'stage-current',
    ready: (ctx) => ctx.highestCleared >= 1,
    text: 'Stage 2 is open. Everything you win goes to your collection.',
    action: 'Tap stage 2',
    done: (ctx) => ctx.screen === 'battle',
  },
  {
    id: 'free',
    screen: 'map',
    ready: (ctx) => ctx.highestCleared >= 2,
    text: 'That is the loop. Cards, Summon and Shop are yours to explore from here — the road does not end.',
    done: acknowledged,
  },
];

/** A step past every beat. Matches the sentinel the v4 → v5 migration writes. */
export const TUTORIAL_FINISHED = 999;

export function beatAt(step: number): Beat | null {
  return step >= 0 && step < BEATS.length ? BEATS[step] : null;
}

/** Which half of the screen the coach card speaks from. */
export type CoachPlacement = 'top' | 'bottom';

/**
 * The card takes the half the thing it is ringing is not in.
 *
 * Centring the anchor first is the usual answer, and it is not enough: stage 1 is
 * the last node on the road, so the map runs out of scroll with it still low on the
 * screen — right where a bottom card lives. Pointing at something and then covering
 * it is the one mistake a coach cannot make, so the side is chosen from where the
 * anchor actually ended up.
 */
export function coachPlacement(
  anchor: { top: number; height: number },
  viewportHeight: number,
): CoachPlacement {
  return anchor.top + anchor.height / 2 > viewportHeight / 2 ? 'top' : 'bottom';
}
