import { useCallback, useEffect, useRef, useState, type PointerEvent, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { TipBubble, type TipAnchor } from './TipBubble';

/** How long a press has to last before it counts as "tell me about this". */
const HOLD_MS = 320;
/** Past this much movement the press was a scroll, not a hold. */
const SLOP_PX = 12;

export interface HoldTipBind {
  onPointerDown: (e: PointerEvent<HTMLElement>) => void;
  onPointerMove: (e: PointerEvent<HTMLElement>) => void;
  onPointerUp: (e: PointerEvent<HTMLElement>) => void;
  onPointerCancel: (e: PointerEvent<HTMLElement>) => void;
  onPointerLeave: (e: PointerEvent<HTMLElement>) => void;
  onContextMenu: (e: { preventDefault: () => void }) => void;
  onClickCapture: (e: { preventDefault: () => void; stopPropagation: () => void }) => void;
}

/**
 * Press and hold to be told more.
 *
 * Touch has no hover, so the information a desktop game would put in a tooltip has
 * nowhere to live: it ends up behind a tap that costs a screen transition, or it
 * does not get shown at all. A hold is the gesture people already try.
 *
 * Two rules make it safe to put on things that also do something when tapped:
 *
 *   - **A hold never also fires the tap.** Holding an enemy to read its stats must
 *     not swing at it. The click that follows the hold is swallowed in the capture
 *     phase, before it reaches the button underneath.
 *   - **Release closes it.** Held open rather than toggled, so reading costs exactly
 *     as long as you hold and nothing has to be dismissed afterwards. A tooltip that
 *     lingers turns the next tap into a dismissal, which in a fight is a tap that
 *     looks like it did nothing.
 *
 * Returns handlers to spread on the trigger and the bubble to render; the trigger
 * measures itself from the event, so no ref plumbing is needed at the call site.
 */
export function useHoldTip(content: ReactNode | null): { bind: HoldTipBind; tip: ReactNode } {
  const [anchor, setAnchor] = useState<TipAnchor | null>(null);
  const timer = useRef<number | null>(null);
  const start = useRef<{ x: number; y: number } | null>(null);
  // Set the moment the bubble opens, cleared by the click it has to eat.
  const swallowClick = useRef(false);

  const cancelTimer = useCallback(() => {
    if (timer.current !== null) {
      clearTimeout(timer.current);
      timer.current = null;
    }
    start.current = null;
  }, []);

  const close = useCallback(() => setAnchor(null), []);

  // Lifting the finger ends it, wherever the finger happens to be by then — the
  // element's own pointerup does not fire if the press wandered off it.
  useEffect(() => {
    if (!anchor) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    document.addEventListener('pointerup', close, true);
    document.addEventListener('pointercancel', close, true);
    window.addEventListener('keydown', onKey);
    window.addEventListener('resize', close);
    return () => {
      document.removeEventListener('pointerup', close, true);
      document.removeEventListener('pointercancel', close, true);
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('resize', close);
    };
  }, [anchor, close]);

  useEffect(() => cancelTimer, [cancelTimer]);

  const bind: HoldTipBind = {
    onPointerDown: (e) => {
      if (!content || anchor) return;
      const rect = e.currentTarget.getBoundingClientRect();
      start.current = { x: e.clientX, y: e.clientY };
      timer.current = window.setTimeout(() => {
        timer.current = null;
        swallowClick.current = true;
        setAnchor({ top: rect.top, bottom: rect.bottom, centerX: rect.left + rect.width / 2 });
      }, HOLD_MS);
    },
    onPointerMove: (e) => {
      const from = start.current;
      if (!from) return;
      if (Math.abs(e.clientX - from.x) > SLOP_PX || Math.abs(e.clientY - from.y) > SLOP_PX) {
        cancelTimer();
      }
    },
    onPointerUp: cancelTimer,
    onPointerCancel: cancelTimer,
    onPointerLeave: cancelTimer,
    // The platform's own long-press menu is exactly what this replaces.
    onContextMenu: (e) => e.preventDefault(),
    onClickCapture: (e) => {
      if (!swallowClick.current) return;
      swallowClick.current = false;
      e.preventDefault();
      e.stopPropagation();
    },
  };

  const tip =
    anchor && content
      ? createPortal(<TipBubble anchor={anchor}>{content}</TipBubble>, document.body)
      : null;

  return { bind, tip };
}
