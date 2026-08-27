/**
 * Art resolution — card portraits and map wallpapers.
 *
 * **Drop-in by folder.** Anything in `src/ui/art/cards/` named after a card's
 * `artKey` becomes that card's art — `card.ember_drake.png` is Ember Drake. No
 * import to add, no map to edit, no schema or engine change (CLAUDE.md rule 6):
 * content keeps referencing the same key and this finds the file.
 *
 * Cards with no file fall back to the shared placeholder avatar, so a half-finished
 * art pass still runs.
 */
import placeholderAvatar from './placeholder-avatar.svg';

/**
 * Every file in `cards/`, resolved to a URL at build time.
 *
 * `eager` because the set is small and the map screen wants art immediately; Vite
 * hashes and copies each file into the build like any other asset.
 */
const files = import.meta.glob<string>('./cards/*.{png,jpg,jpeg,webp,avif,svg}', {
  eager: true,
  query: '?url',
  import: 'default',
});

/** artKey -> art URL, keyed by filename with the extension dropped. */
const CARD_ART: Readonly<Record<string, string>> = Object.fromEntries(
  Object.entries(files).map(([path, url]) => [
    path.replace(/^\.\/cards\//, '').replace(/\.[^.]+$/, ''),
    url,
  ]),
);

export const PLACEHOLDER_AVATAR = placeholderAvatar;

export function resolveCardArt(artKey: string): string {
  return CARD_ART[artKey] ?? PLACEHOLDER_AVATAR;
}

/** True once a real file exists for this key. */
export function hasFinalArt(artKey: string): boolean {
  return artKey in CARD_ART;
}

/**
 * Every key the folder currently supplies.
 *
 * `artManifest.test.ts` uses it to reject a file that matches no card — the one
 * mistake this scheme is prone to, since a misspelt portrait is silently inert.
 */
export function cardArtKeys(): readonly string[] {
  return Object.keys(CARD_ART);
}

/** How much of the roster has real art — surfaced in the dev panel. */
export function artCoverage(artKeys: readonly string[]): { done: number; total: number } {
  return { done: artKeys.filter(hasFinalArt).length, total: artKeys.length };
}

/**
 * Map wallpapers.
 *
 * **Drop-in by folder**, same rule as card art: a file in `src/ui/art/map/` named
 * after a region's `themeToken` becomes that biome's backdrop — `theme-isles.jpg`
 * is the Sunken Isles. A file named `default` is the backdrop for every biome that
 * has none of its own, so one image is enough to wallpaper the whole road.
 *
 * With no file at all the map keeps its painted gradient, so this is additive: the
 * game looks finished either way.
 */
const wallpapers = import.meta.glob<string>('./map/*.{png,jpg,jpeg,webp,avif}', {
  eager: true,
  query: '?url',
  import: 'default',
});

/** themeToken (or 'default') -> wallpaper URL, keyed by filename without extension. */
const MAP_ART: Readonly<Record<string, string>> = Object.fromEntries(
  Object.entries(wallpapers).map(([path, url]) => [
    path.replace(/^\.\/map\//, '').replace(/\.[^.]+$/, ''),
    url,
  ]),
);

/** The biome's own wallpaper, the shared one, or nothing — in that order. */
export function mapWallpaper(themeToken: string): string | null {
  return MAP_ART[themeToken] ?? MAP_ART.default ?? null;
}

/** True when this biome resolves to a real file rather than the gradient. */
export function hasMapWallpaper(themeToken: string): boolean {
  return mapWallpaper(themeToken) !== null;
}

/**
 * Every key the map folder currently supplies.
 *
 * `artManifest.test.ts` uses it to reject a wallpaper named after no region — the
 * one way this scheme goes wrong, since a misspelt file is silently inert.
 */
export function mapWallpaperKeys(): readonly string[] {
  return Object.keys(MAP_ART);
}
