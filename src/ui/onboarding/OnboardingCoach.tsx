import { useCallback, useEffect, useMemo, useState } from 'react';
import { usePlayerStore } from '@/state/playerStore';
import { currentScreen, useScreenStore } from '@/state/screenStore';
import { Button } from '@/ui/design/primitives';
import { useModalOpen } from '@/ui/design/primitives/modalState';
import { BEATS, TUTORIAL_FINISHED, beatAt, type CoachContext } from './beats';
import styles from './OnboardingCoach.module.css';

interface Rect {
  top: number;
  left: number;
  width: number;
  height: number;
}

/**
 * Follows an anchored element as the map scrolls under it.
 *
 * A rAF loop rather than a resize/scroll listener: the anchor can move because a
 * list scrolled, a sheet opened or a medallion animated, and one cheap read per
 * frame is simpler than chasing every cause. State is only written from inside the
 * frame callback, never synchronously from the effect body.
 */
function useAnchorRect(anchor: string | undefined): Rect | null {
  const [rect, setRect] = useState<Rect | null>(null);

  useEffect(() => {
    if (!anchor) return;
    // Bring the thing being pointed at into the middle of the screen once: the
    // coach card owns the bottom of the viewport, and a ring the player has to
    // scroll to find is worse than no ring.
    let centred = false;
    let frame = requestAnimationFrame(function measure() {
      const el = document.querySelector<HTMLElement>(`[data-coach="${anchor}"]`);
      if (el && !centred) {
        centred = true;
        el.scrollIntoView({ block: 'center' });
      }
      const next = el
        ? (() => {
            const r = el.getBoundingClientRect();
            return { top: r.top, left: r.left, width: r.width, height: r.height };
          })()
        : null;
      setRect((prev) => {
        if (prev === next) return prev;
        if (
          prev &&
          next &&
          prev.top === next.top &&
          prev.left === next.left &&
          prev.width === next.width
        ) {
          return prev;
        }
        return next;
      });
      frame = requestAnimationFrame(measure);
    });
    return () => cancelAnimationFrame(frame);
  }, [anchor]);

  // Ignored entirely when nothing is anchored, so a stale measurement from the
  // previous beat can never draw a ring around the wrong thing.
  return anchor ? rect : null;
}

/**
 * The guided first two stages (Q25).
 *
 * A card at the bottom of the screen with one thought in it, and a ring around
 * whatever it is talking about. Every beat is skippable, and the whole thing is
 * skippable, because a tutorial that traps you is worse than no tutorial: the
 * script guides, it never blocks a tap.
 */
export function OnboardingCoach() {
  const save = usePlayerStore((s) => s.save);
  const stack = useScreenStore((s) => s.stack);
  const modalOpen = useModalOpen();

  const step = save?.player.tutorialStep ?? TUTORIAL_FINISHED;
  const screen = currentScreen({ stack }).kind;
  const beat = beatAt(step);

  const advance = useCallback((from: number) => {
    const next = from + 1 >= BEATS.length ? TUTORIAL_FINISHED : from + 1;
    usePlayerStore.getState().setTutorialStep(next);
  }, []);

  /**
   * Beats that wait on the game rather than on a tap.
   *
   * Driven from store subscriptions rather than a render effect: the stores are the
   * external system here, and reacting to their changes is exactly what a
   * subscription is for. A beat whose work is already done — a stage cleared out of
   * order, a returning player — passes immediately, so nothing can get stuck.
   */
  useEffect(() => {
    const check = () => {
      const player = usePlayerStore.getState();
      const at = player.tutorialStep();
      const current = beatAt(at);
      if (!current) return;

      const records = player.save?.player.stageRecords ?? {};
      const highestCleared = Object.entries(records).reduce(
        (max, [stage, record]) => (record.bestStars > 0 ? Math.max(max, Number(stage)) : max),
        0,
      );
      const ctx: CoachContext = {
        screen: currentScreen(useScreenStore.getState()).kind,
        highestCleared,
        acknowledged: false,
      };
      if (current.done(ctx)) advance(at);
    };

    check();
    const unsubScreen = useScreenStore.subscribe(check);
    const unsubPlayer = usePlayerStore.subscribe(check);
    return () => {
      unsubScreen();
      unsubPlayer();
    };
  }, [advance]);

  const highestCleared = useMemo(() => {
    const records = save?.player.stageRecords ?? {};
    return Object.entries(records).reduce(
      (max, [stage, record]) => (record.bestStars > 0 ? Math.max(max, Number(stage)) : max),
      0,
    );
  }, [save]);

  const ctx: CoachContext = { screen, highestCleared, acknowledged: false };

  // While a sheet is up it owns the screen, and the thing the coach is pointing at
  // is behind a backdrop anyway. Stepping aside is not optional: the coach used to
  // sit on top of the stage sheet's Fight button.
  const anchored = beat?.screen === screen && !modalOpen ? beat.anchor : undefined;
  const rect = useAnchorRect(anchored);

  if (!save || !beat || modalOpen) return null;
  // The beat waits quietly until the player is where it can speak.
  if (beat.screen !== screen) return null;
  if (beat.ready && !beat.ready(ctx)) return null;

  const isAction = beat.action !== undefined;

  return (
    <>
      {rect ? (
        <div
          className={styles.ring}
          aria-hidden="true"
          style={{
            top: rect.top - 6,
            left: rect.left - 6,
            width: rect.width + 12,
            height: rect.height + 12,
          }}
        />
      ) : null}

      <div className={styles.card} role="status">
        <div className={styles.head}>
          <span className={styles.step}>
            {step + 1} of {BEATS.length}
          </span>
          <button type="button" className={styles.skip} onClick={() => advance(TUTORIAL_FINISHED)}>
            Skip
          </button>
        </div>

        <p className={styles.text}>{beat.text}</p>

        {isAction ? (
          <span className={styles.action}>{beat.action}</span>
        ) : (
          <Button variant="positive" block onClick={() => advance(step)}>
            Got it
          </Button>
        )}
      </div>
    </>
  );
}
