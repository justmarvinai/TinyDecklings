# Your icons

Drop an `.svg` in here named after the **meaning** it replaces and it wins over the
placeholder everywhere that meaning is drawn.

```
src/ui/icons/custom/gear.weapon.svg    ->  every Weapon, in inventory, on the
                                           equipment grid, in drops, in rewards
src/ui/icons/custom/currency.gold.svg  ->  every gold amount in the game
src/ui/icons/custom/nav.map.svg        ->  the Map tab
```

Then run:

```bash
npm run vendor:icons
```

That inlines whatever is in this folder into `generated/iconPaths.ts`. There is no
manifest to edit and no component to touch.

- **Names** must be a semantic icon key. The full list is `ICON_KEYS` in
  `src/content/schemas/iconKeys.ts`, and the dev panel's **Art coverage** button
  prints the ones still on placeholder art. A name that is not a key — `gear.wepon`,
  or `boots` — fails `npm run test` with the file name, rather than silently
  changing nothing.
- **Format is SVG only.** Icons are inlined as vector paths so they can take the UI's
  colour, scale to any size and cost nothing to download. A PNG will not work here.
- **Shape**: square, any `viewBox`. The `viewBox` on your file is kept as-is, so
  there is no grid to match — a 24×24 icon and a 512×512 icon both render correctly.
- **Colour**: paint with `fill="currentColor"` and the icon takes the colour of
  whatever draws it — rarity tints, disabled states, the active tab. Hard-coded
  colours are kept, so use them only when the icon is meant to be multi-coloured.
- Avoid `<style>` blocks and `id`s inside the file: every icon ends up inlined in
  the same page, so class names and gradient ids can collide. Presentation
  attributes (`fill`, `stroke`) on the shapes are the safe way.

## Gear icons are per slot, not per item

There are nine gear icons in total — one for each slot. Every Boots item shows THE
boots icon, every Helmet THE helmet icon; items are told apart by name, stats,
rarity colour and stars. So nine files replace all gear art in the game:

```
gear.weapon  gear.helmet  gear.shield  gear.gauntlets  gear.armor
gear.boots   gear.ring    gear.amulet  gear.artifact
```

## The other folder

`../svg/` holds the vendored placeholders, named after their source art
(`broadsword.svg`, `crested-helmet.svg`). You should not need it: it exists so
`npm run vendor:icons` can re-fetch the placeholder set, and editing a file there
works but means matching someone else's file names. Name by meaning here instead.
