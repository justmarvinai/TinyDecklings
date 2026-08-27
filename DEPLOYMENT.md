# Deploying TinyDecklings

The game is a **static, fully offline single-player web app** — no backend, no API routes, no database.

It is also offline in the sense that matters on a phone: `dist/sw.js` is generated at build time from the
real bundle (`scripts/sw-plugin.mjs`) and precaches the shell, so the home-screen icon opens with no network.
Two things follow for deploys:

- **Every build gets a new cache name**, derived from the shell it precaches, and the old cache is deleted on
  activate. There is no manual cache-busting step.
- **A new build does not take over a live session.** The worker installs and waits; the running app shows an
  "Update ready" notice and the new version takes over the next time the app is opened fresh. That is
  deliberate — swapping code out mid-battle is worse than one more session on yesterday's build.
  Deployment is therefore just "serve `dist/`", which is why Vercel needs almost no configuration.

## One-time setup

1. Sign in to <https://vercel.com> and **Add New → Project**.
2. Import `justmarvinai/TinyDecklings` from GitHub.
3. Vercel reads `vercel.json` and detects Vite; the defaults it shows should already be:
   - **Framework preset:** Vite
   - **Build command:** `npm run build`
   - **Output directory:** `dist`
   - **Install command:** `npm ci`
4. **Environment variables:** none. The game has no secrets, no API keys and no runtime configuration.
5. Deploy.

That is the whole setup. There is nothing to configure per environment because there is no environment —
everything the game needs ships in the bundle.

## What you get

| Branch                                   | URL                                   |
| ---------------------------------------- | ------------------------------------- |
| `main`                                   | the production URL                    |
| any other branch (e.g. a feature branch) | an automatic **preview URL** per push |
| every pull request                       | a preview URL commented on the PR     |

Preview deployments are the point of this setup: push the current work branch and open the preview link to
see the live state of development on a real phone.

## Testing on a phone

The preview URL works on any device. On iOS/Android, "Add to Home Screen" gives a chrome-less window, which
is the closest thing to the eventual Capacitor build — useful for checking safe areas and one-handed reach.

## Why the config looks the way it does

- **`rewrites` → `/index.html`** — screens are a state machine, not routes (`ARCHITECTURE.md` AD-4), so the
  app only ever needs `/`. The catch-all rewrite means a refresh or a shared deep link still lands on the
  app instead of a 404.
- **Immutable caching for `/assets/*`** — Vite fingerprints every bundle, font and icon, so those files can
  be cached forever. `index.html` is `no-cache` so a new deploy is picked up immediately.
- **`.vercelignore`** excludes `assets/examples/` — the reference screenshots are internal design material
  (see `CREDITS.md`) and must not be published with the game.
- **No `functions`, no `regions`, no runtime config** — there is no server-side code to place anywhere.

## Local checks before deploying

```bash
npm run verify    # typecheck + lint + tests
npm run build     # exactly what Vercel runs
npm run preview   # serves dist/ locally on :4173 — the production bundle
```

If `npm run build` succeeds locally, the Vercel build will too: it runs the same command on the same
lockfile.

## Not deployed here

- **Capacitor / native builds** — a separate future delivery path (`TECH_STACK.md` §4). The static bundle
  Vercel serves is the same artefact Capacitor will eventually wrap, so nothing done here has to be undone.
- **Anything server-side** — saves live in the player's own browser (`localStorage` via the storage service
  seam). Clearing site data resets a player's progress; that is expected for a local-save game, and manual
  save export/import lands in Phase 7 (Q27).
