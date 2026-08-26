/**
 * Card art resolution.
 *
 * Every card currently resolves to one shared placeholder avatar (CLAUDE.md rule 6).
 * The owner supplies final per-card art later; that is an asset drop plus one entry
 * in CARD_ART here — content data keeps referencing the same `artKey`, and no
 * schema, engine or component changes.
 */
import placeholderAvatar from './placeholder-avatar.svg';

/** artKey -> art URL. Empty until the owner's per-card art arrives. */
const CARD_ART: Readonly<Record<string, string>> = {};

export const PLACEHOLDER_AVATAR = placeholderAvatar;

export function resolveCardArt(artKey: string): string {
  return CARD_ART[artKey] ?? PLACEHOLDER_AVATAR;
}

/** True once real art exists for this key — lets UI badge placeholder art in dev. */
export function hasFinalArt(artKey: string): boolean {
  return artKey in CARD_ART;
}
