import { useEffect, type ReactNode } from 'react';
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
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  // A modal owns the screen while it is up; anything floating over the app steps
  // aside (see `modalState.ts`).
  useEffect(() => pushModal(), []);

  return (
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
    </div>
  );
}
