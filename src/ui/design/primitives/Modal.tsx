import { useEffect, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { TitleBanner } from './TitleBanner';
import { pushModal } from './modalState';
import styles from './Modal.module.css';

export interface ModalProps {
  title: string;
  onClose: () => void;
  children: ReactNode;
  /** Bottom sheet by default (thumb-reachable); centered for short confirmations. */
  placement?: 'sheet' | 'centered';
}

export function Modal({ title, onClose, children, placement = 'sheet' }: ModalProps) {
  // Held in a ref so the registration below can run once. Re-running it on a new
  // `onClose` identity would pop this modal off the stack and push it back on,
  // which would reorder a stack whose whole job is to remember the order.
  const closeRef = useRef(onClose);
  useEffect(() => {
    closeRef.current = onClose;
  }, [onClose]);

  // A modal owns the screen while it is up: anything floating over the app steps
  // aside, and Escape reaches the frontmost sheet only (see `modalState.ts`).
  useEffect(() => {
    const handle = pushModal();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && handle.isTop()) closeRef.current();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      handle.release();
    };
  }, []);

  /*
   * Portalled to the body rather than rendered where it was opened.
   *
   * A sheet is `position: fixed` and sized against the viewport (`88svh`), so it has
   * to be laid out against the viewport too. Rendered in place, one transformed
   * ancestor — a screen-transition animation, a `will-change`, a container — makes
   * that ancestor the containing block instead, and the sheet quietly overflows the
   * screen's box rather than the phone's. React events still bubble through the
   * portal, so nothing at the call site changes.
   */
  return createPortal(
    <div
      className={[styles.backdrop, placement === 'centered' ? styles.centered : '']
        .filter(Boolean)
        .join(' ')}
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={onClose}
    >
      <div className={styles.sheet} onClick={(e) => e.stopPropagation()}>
        <TitleBanner title={title} onClose={onClose} />
        <div className={styles.body}>{children}</div>
      </div>
    </div>,
    document.body,
  );
}
