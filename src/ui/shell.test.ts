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
