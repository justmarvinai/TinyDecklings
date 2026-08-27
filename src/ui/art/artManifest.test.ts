import { describe, expect, it } from 'vitest';
import { CONTENT } from '@/content';
import {
  PLACEHOLDER_AVATAR,
  artCoverage,
  cardArtKeys,
  hasFinalArt,
  mapWallpaper,
  mapWallpaperKeys,
  resolveCardArt,
} from './artManifest';

/**
 * The card-art drop-in contract.
 *
 * Art lands by filename in `src/ui/art/cards/` — `card.ember_drake.png` is Ember
 * Drake's portrait. Nothing imports it and nothing lists it, so the mistakes worth
 * catching are a file named after something that is not a card, and a card whose
 * art silently stops resolving.
 */
describe('card art', () => {
  const cards = [...CONTENT.cards.values()];

  it('gives every card art — real or placeholder', () => {
    for (const card of cards) {
      expect(resolveCardArt(card.artKey), card.id).toBeTruthy();
    }
  });

  it('falls back to the shared avatar for a card with no file yet', () => {
    expect(resolveCardArt('card.not_drawn_yet')).toBe(PLACEHOLDER_AVATAR);
    expect(hasFinalArt('card.not_drawn_yet')).toBe(false);
  });

  it('reports coverage over the roster', () => {
    const keys = cards.map((c) => c.artKey);
    const { done, total } = artCoverage(keys);
    expect(total).toBe(cards.length);
    expect(done).toBe(keys.filter(hasFinalArt).length);
    expect(done).toBeLessThanOrEqual(total);
  });

  it('has no art file that belongs to no card', () => {
    // A portrait named `card.embr_drake.png` would sit in the folder doing nothing.
    const keys = new Set(cards.map((c) => c.artKey));
    expect(cardArtKeys().filter((k) => !keys.has(k))).toEqual([]);
  });
});

/**
 * The map-wallpaper drop-in contract.
 *
 * A file in `src/ui/art/map/` named after a region's `themeToken` becomes that
 * biome's backdrop; one named `default` covers every biome without its own. As with
 * portraits, the mistake worth catching is a name that matches nothing — it lands,
 * it is inlined, and the map keeps its gradient with no clue why.
 */
describe('map wallpaper', () => {
  const themes = [...new Set([...CONTENT.regions.values()].map((r) => r.themeToken))];

  it('has a theme token for every authored region', () => {
    expect(themes.length).toBeGreaterThan(0);
  });

  it('falls back to the shared wallpaper, then to the painted gradient', () => {
    const unknown = mapWallpaper('theme.not_a_region');
    if (mapWallpaperKeys().includes('default')) {
      expect(unknown).toBe(mapWallpaper('default'));
    } else {
      expect(unknown).toBeNull();
    }
  });

  it('has no wallpaper that belongs to no region', () => {
    // `theme-isle.jpg` for `theme-isles` would sit in the folder doing nothing.
    const allowed = new Set([...themes, 'default']);
    expect(mapWallpaperKeys().filter((k) => !allowed.has(k))).toEqual([]);
  });
});
