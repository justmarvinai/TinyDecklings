import { useEffect, useRef, useState, type ReactNode } from 'react';
import styles from './HoldTip.module.css';

export interface TipAnchor {
  top: number;
  bottom: number;
  centerX: number;
}

/**
 * The bubble itself, placed on whichever side of the trigger has room.
 *
 * Same rule as the onboarding coach: never cover the thing you are describing. It
 * measures itself once mounted rather than guessing a height, because these carry
 * anything from two stats to a full skill list.
 */
export function TipBubble({ anchor, children }: { anchor: TipAnchor; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [placed, setPlaced] = useState<{ top: number; left: number } | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const { width, height } = el.getBoundingClientRect();
    const gap = 10;
    const margin = 8;
    const above = anchor.top - gap - height;
    const below = anchor.bottom + gap;
    const top = above >= margin ? above : Math.min(below, window.innerHeight - height - margin);
    const left = Math.max(
      margin,
      Math.min(anchor.centerX - width / 2, window.innerWidth - width - margin),
    );
    setPlaced({ top: Math.max(margin, top), left });
  }, [anchor]);

  return (
    <div
      ref={ref}
      className={styles.bubble}
      role="tooltip"
      // Hidden until measured, so it never flashes in the wrong place.
      style={placed ? { top: placed.top, left: placed.left } : { opacity: 0, top: 0, left: 0 }}
    >
      {children}
    </div>
  );
}
