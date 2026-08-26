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
      const px = Math.min(10, 4 * intensity);
      running.current = el.animate(
        [
          { transform: 'translate3d(0, 0, 0)' },
          { transform: `translate3d(${-px}px, ${px * 0.4}px, 0)` },
          { transform: `translate3d(${px * 0.8}px, ${-px * 0.3}px, 0)` },
          { transform: `translate3d(${-px * 0.4}px, 0, 0)` },
          { transform: 'translate3d(0, 0, 0)' },
        ],
        { duration: 160 + intensity * 60, easing: 'ease-out' },
      );
    },
    [reduced],
  );

  return { ref, shake };
}
