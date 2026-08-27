import { useCallback, useRef } from 'react';
import { useReducedMotion } from './useReducedMotion';

/**
 * Screen shake for the hits that deserve it.
 *
 * Transform-only and driven by the Web Animations API, so it stays on the
 * compositor and cancels cleanly when a second hit lands before the first has
 * settled. Silent when motion is reduced (Q28) — the sound and the numbers still
 * carry the impact, so nothing is lost but the wobble.
 */
export function useScreenShake<T extends HTMLElement>(): {
  ref: React.RefObject<T | null>;
  shake: (intensity?: number) => void;
} {
  const ref = useRef<T>(null);
  const running = useRef<Animation | null>(null);
  const reduced = useReducedMotion();

  const shake = useCallback(
    (intensity = 1) => {
      const el = ref.current;
      if (!el || reduced || typeof el.animate !== 'function') return;

      running.current?.cancel();
      // Bigger and with more steps than it used to be: three keyframes read as a
      // wobble, six read as a jolt that decays. Still capped, because a phone held
      // at arm's length does not need the whole screen leaving the frame.
      const px = Math.min(16, 6 * intensity);
      const rot = Math.min(1.2, 0.5 * intensity);
      running.current = el.animate(
        [
          { transform: 'translate3d(0, 0, 0) rotate(0deg)' },
          { transform: `translate3d(${-px}px, ${px * 0.5}px, 0) rotate(${-rot}deg)` },
          { transform: `translate3d(${px * 0.9}px, ${-px * 0.4}px, 0) rotate(${rot}deg)` },
          { transform: `translate3d(${-px * 0.55}px, ${px * 0.2}px, 0) rotate(${-rot * 0.5}deg)` },
          { transform: `translate3d(${px * 0.3}px, 0, 0) rotate(${rot * 0.3}deg)` },
          { transform: 'translate3d(0, 0, 0) rotate(0deg)' },
        ],
        { duration: 200 + intensity * 120, easing: 'cubic-bezier(0.2, 0.8, 0.3, 1)' },
      );
    },
    [reduced],
  );

  return { ref, shake };
}
