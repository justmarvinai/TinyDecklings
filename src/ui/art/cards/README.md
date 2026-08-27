# Per-card art

Drop a file in here named after the card's `artKey` and it becomes that card's art.
Nothing else to change — no import, no map entry, no code.

```
src/ui/art/cards/card.ember_drake.png     ->  Ember Drake
src/ui/art/cards/card.oracle_vess.webp    ->  Oracle Vess
```

- **Names** must match the `artKey` in `src/content/cards/index.ts` exactly. Every
  card's `artKey` is its own id, so `card.ember_drake` is the file name too.
- **Formats**: `.png`, `.jpg`, `.jpeg`, `.webp`, `.avif`, `.svg`.
- **Shape**: portrait, roughly 3:4. The frame crops with `object-fit: cover`, so
  keep the subject centred and leave a little room at the edges.
- **Size**: around 512×683 is plenty — cards render at most ~200px wide on a phone.
  `.webp` keeps the download small.
- Cards with no file here fall back to the shared placeholder avatar, so you can
  drop art in a few at a time.

Run `npm run dev` and the art appears — Vite picks up a new file without a restart.

The dev panel (the **DEV** button, dev builds only) has an **Art coverage** button
under Diagnostics: it counts how many cards have real art and lists the `artKey`s
still on the placeholder, which is the list to work down.

A file named after nothing — `card.embr_drake.png` — would sit here doing nothing,
so `npm run test` fails on it and names the file. That is the only way this can go
wrong, and it is caught before you go looking for the portrait on screen.
