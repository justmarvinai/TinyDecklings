import type { ReactNode } from 'react';
import { Button } from './Button';
import styles from './TitleBanner.module.css';

export interface TitleBannerProps {
  title: string;
  /** Optional left slot — e.g. the reference's UNIT ribbon tab. */
  leading?: ReactNode;
  onClose?: () => void;
  className?: string;
}

/** The purple band under the HUD carrying an outlined all-caps screen title. */
export function TitleBanner({ title, leading, onClose, className }: TitleBannerProps) {
  return (
    <div className={[styles.banner, className ?? ''].filter(Boolean).join(' ')}>
      {leading ? <div className={styles.leading}>{leading}</div> : null}
      <h1 className={styles.title}>{title}</h1>
      {onClose ? (
        <Button
          variant="danger"
          icon="ui.close"
          iconOnly
          className={styles.close}
          aria-label="Close"
          onClick={onClose}
        />
      ) : null}
    </div>
  );
}
