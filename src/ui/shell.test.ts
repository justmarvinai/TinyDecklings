import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

// Vitest runs from the repo root, and the document under test is its `index.html`.
const html = readFileSync(resolve(process.cwd(), 'index.html'), 'utf8');

/**
 * The first paint.
 *
 * Every pixel of this game is drawn by React, so without markup in `#root` there is
 * nothing on screen until the bundle has downloaded and parsed — measured at ~5.6
 * seconds of blank screen on slow 3G with a throttled CPU, which reads as a broken
 * app rather than a loading one. It is easy to delete by accident while tidying the
 * document, and nothing else would notice: the app still works, it just looks
 * broken for the first few seconds of a player's first visit.
 */
describe('the boot shell', () => {
  it('puts something inside #root for the browser to paint', () => {
    const root = html.slice(html.indexOf('<div id="root">'), html.indexOf('</body>'));
    expect(root).toContain('class="boot"');
    expect(root).toMatch(/TinyDecklings/);
  });

  it('styles it inline, so it does not wait on a stylesheet either', () => {
    const head = html.slice(0, html.indexOf('</head>'));
    expect(head).toContain('.boot {');
    // Whatever it needs must be in the document; a request would defeat the point.
    const bootStyles = head.slice(head.indexOf('<style>'), head.indexOf('</style>'));
    expect(bootStyles).not.toMatch(/url\(|@import/);
  });

  it('holds still when motion is reduced', () => {
    expect(html).toMatch(/prefers-reduced-motion[\s\S]*?boot-bar/);
  });
});

/**
 * The chrome colour, in the three places that have to agree.
 *
 * In an installed app the system paints the status bar and the strip behind the
 * gesture bar with `theme_color`. The tab bar directly above that strip is painted
 * with `--bg-hud`. When the two drift apart — they had, by one shade — the result is
 * a band of slightly different dark along the bottom edge, which reads as the app
 * failing to fill the screen. Nothing in a build or a browser complains about it,
 * so this does.
 */
describe('the chrome colour', () => {
  const tokens = readFileSync(resolve(process.cwd(), 'src/ui/design/tokens.css'), 'utf8');
  const manifest = JSON.parse(
    readFileSync(resolve(process.cwd(), 'public/manifest.webmanifest'), 'utf8'),
  ) as { theme_color: string; background_color: string };

  const bgHud = /--bg-hud:\s*(#[0-9a-fA-F]{3,8})/.exec(tokens)?.[1];
  const meta = /<meta name="theme-color" content="(#[0-9a-fA-F]{3,8})"/.exec(html)?.[1];

  it('is the HUD colour in the document', () => {
    expect(bgHud).toBeTruthy();
    expect(meta?.toLowerCase()).toBe(bgHud?.toLowerCase());
  });

  it('is the same colour in the manifest', () => {
    expect(manifest.theme_color.toLowerCase()).toBe(bgHud?.toLowerCase());
  });

  it('splashes on the ground the boot screen paints, so the two do not jump', () => {
    const boot = /linear-gradient\(180deg,\s*(#[0-9a-fA-F]{6}),\s*(#[0-9a-fA-F]{6})/.exec(html);
    expect(boot).toBeTruthy();
    expect(manifest.background_color.toLowerCase()).toBe(boot![2].toLowerCase());
  });
});
