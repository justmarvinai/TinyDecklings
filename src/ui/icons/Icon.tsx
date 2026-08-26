import type { CSSProperties } from 'react';
import type { GearSlot, IconKey } from '@/content/schemas/iconKeys';
import { gearSlotIcon, iconPath } from './iconManifest';
import type { IconPath } from './generated/iconPaths';

export interface IconProps {
  /** Semantic key — never a file name (ARCHITECTURE.md §6). */
  name: IconKey;
  /** Rendered box in px; icons are square. */
  size?: number;
  className?: string;
  style?: CSSProperties;
  /** Accessible label. Omit for purely decorative icons (they are hidden from AT). */
  title?: string;
}

function Svg({
  path,
  size,
  className,
  style,
  title,
}: { path: IconPath } & Omit<IconProps, 'name'>) {
  return (
    <svg
      viewBox={path.viewBox}
      width={size ?? 24}
      height={size ?? 24}
      className={className}
      style={style}
      fill="currentColor"
      role={title ? 'img' : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      focusable="false"
      dangerouslySetInnerHTML={{
        __html: title ? `<title>${title}</title>${path.body}` : path.body,
      }}
    />
  );
}

export function Icon({ name, ...rest }: IconProps) {
  return <Svg path={iconPath(name)} {...rest} />;
}

/**
 * Gear art, always resolved from the slot type.
 *
 * There is no per-item variant on purpose: every Boots shows the boots icon,
 * every Helmet the helmet icon, everywhere (owner directive / CLAUDE.md rule 5).
 */
export function GearSlotIcon({ slot, ...rest }: { slot: GearSlot } & Omit<IconProps, 'name'>) {
  return <Svg path={gearSlotIcon(slot)} {...rest} />;
}
