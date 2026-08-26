import type { ButtonHTMLAttributes, ReactNode } from 'react';
import type { IconKey } from '@/content/schemas/iconKeys';
import { Icon } from '@/ui/icons/Icon';
import { NotificationDot } from './NotificationDot';
import styles from './Button.module.css';

export type ButtonVariant = 'positive' | 'info' | 'warning' | 'danger' | 'neutral' | 'header';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  /** Icon above the label, as in the card-detail action bar. */
  icon?: IconKey;
  stacked?: boolean;
  block?: boolean;
  iconOnly?: boolean;
  /** Renders the neutral locked look with a padlock and an unlock hint (e.g. "6★"). */
  locked?: boolean;
  lockHint?: string;
  notifications?: number;
  children?: ReactNode;
}

export function Button({
  variant = 'positive',
  icon,
  stacked,
  block,
  iconOnly,
  locked,
  lockHint,
  notifications,
  children,
  className,
  disabled,
  ...rest
}: ButtonProps) {
  const classes = [
    styles.button,
    styles[locked ? 'neutral' : variant],
    stacked ? styles.stacked : '',
    block ? styles.block : '',
    iconOnly ? styles.iconOnly : '',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button type="button" className={classes} disabled={disabled ?? locked} {...rest}>
      {locked ? <Icon name="ui.lock" size={stacked ? 20 : 16} /> : null}
      {!locked && icon ? <Icon name={icon} size={stacked ? 22 : 18} /> : null}
      {children}
      {locked && lockHint ? <span className={styles.lockHint}>{lockHint}</span> : null}
      {notifications ? <NotificationDot count={notifications} /> : null}
    </button>
  );
}
