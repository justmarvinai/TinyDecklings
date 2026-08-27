# Map wallpaper

Drop an image in here and it becomes the background of the map screen. Nothing else
to change — no import, no map entry, no code.

**The simplest version:** name one file `default` and it wallpapers the whole road.

```
src/ui/art/map/default.jpg          ->  every region
```

**Per biome**, if you want each region to look like itself — name the file after the
region's `themeToken`:

```
src/ui/art/map/theme-isles.jpg      ->  Sunken Isles
src/ui/art/map/theme-ashfall.png    ->  Ashfall Reach
src/ui/art/map/theme-verdant.webp   ->  Verdant Hollow
```

A region with its own file uses it; any region without one falls back to `default`;
with no files at all the map keeps its painted gradient. So you can do one image now
and the other two later, and it looks finished the whole way.

- **Names** must match a `themeToken` in `src/content/map/regions.ts`, or be
  `default`. A name that matches neither — `theme-isle.jpg` — fails `npm run test`
  and tells you the file, rather than quietly doing nothing.
- **Formats**: `.jpg`, `.png`, `.webp`, `.avif`.
- **Shape**: portrait, phone-shaped. Around **1080×2160** covers every phone at 2×
  without being wasteful. It is drawn with `cover`, so it fills the screen and crops
  the overflow — keep anything you care about away from the very edges.
- **Weight**: `.webp` or a well-compressed `.jpg`. This is the largest single asset
  in the game; under ~400 KB per image keeps the map instant on a phone.
- The image is anchored to the screen, not to the scroller, so the road travels
  across a still backdrop rather than dragging it along.
- A slight darkening is applied at the top and bottom edges only — the stage name
  pills and medallions carry their own contrast, but the dotted path between them is
  translucent and would disappear into a busy photograph. The middle of your image is
  left alone.

Run `npm run dev` and it appears; the dev panel's **Art coverage** button lists which
regions still have no wallpaper.
