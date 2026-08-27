/**
 * Builds the service worker, with the shell it has to precache baked in.
 *
 * TinyDecklings is single-player, offline and local-save, and installs to a home
 * screen — but until this existed, opening it without a network failed outright.
 * "The save is local" and "the app is delivered" are different problems, and only
 * the first one was solved.
 *
 * The precache list is generated from the actual bundle rather than hand-written,
 * because a hand-written one goes stale silently: the app keeps working online and
 * breaks only for the player on a train.
 *
 * Deliberately not a dependency. The whole policy is thirty lines and it is worth
 * being able to read them: a cache this game controls badly is one players cannot
 * clear themselves.
 */
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));

/**
 * What is worth precaching: the code and styles needed to reach the first screen.
 *
 * Fonts and images are left to runtime caching — they are fetched on first use and
 * then available offline, which beats making every player download every weight and
 * every biome up front for a trip they may never take.
 */
const PRECACHE_EXT = /\.(js|css|html|webmanifest|svg)$/;
/** Source maps are for us, not for the player's phone. */
const SKIP = /\.map$/;

export function serviceWorkerPlugin() {
  return {
    name: 'tinydecklings-service-worker',
    apply: 'build',
    generateBundle(_options, bundle) {
      const assets = Object.keys(bundle)
        .filter((name) => PRECACHE_EXT.test(name) && !SKIP.test(name))
        .map((name) => `/${name}`);

      // index.html is emitted by the html plugin and may not be in `bundle` yet.
      const shell = ['/', '/index.html', '/manifest.webmanifest', '/favicon.svg'];
      const precache = [...new Set([...shell, ...assets])].sort();

      // The one way this goes wrong quietly: a bundling change renames or moves the
      // entry, the list still looks full, and the game only breaks for the player
      // with no signal. Fail the build instead.
      const entries = Object.values(bundle).filter((c) => c.type === 'chunk' && c.isEntry);
      for (const entry of entries) {
        if (!precache.includes(`/${entry.fileName}`)) {
          this.error(
            `service worker: entry chunk "${entry.fileName}" is not in the precache list, ` +
              'so the app would not open offline.',
          );
        }
      }

      // The cache name changes whenever the shell does, which is what makes the
      // old one safe to delete on activate.
      const version = hash(precache.join('|'));

      const template = readFileSync(join(here, 'sw-template.js'), 'utf8');
      this.emitFile({
        type: 'asset',
        fileName: 'sw.js',
        source: template
          .replace('__PRECACHE__', JSON.stringify(precache, null, 2))
          .replace('__VERSION__', JSON.stringify(version)),
      });
    },
  };
}

/** Small stable hash — this names a cache, it is not defending anything. */
function hash(input) {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(36);
}
