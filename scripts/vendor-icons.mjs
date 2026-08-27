/**
 * Vendors the placeholder icon set (Game Icons / Open Game Icons, CC BY 3.0) and
 * regenerates the inline-path module the <Icon> component reads.
 *
 * Two steps, deliberately separate so the owner's final art can replace icons
 * without touching code (CLAUDE.md rule 6):
 *   1. extract  — write src/ui/icons/svg/<source-name>.svg for every entry in the
 *                 manifest. EXISTING FILES ARE NEVER OVERWRITTEN (pass --force to
 *                 refresh), so hand-editing a vendored file and re-running is safe.
 *   2. generate — read that folder into ICON_PATHS, and read src/ui/icons/custom/
 *                 into ICON_OVERRIDES.
 *
 * The two folders differ in how files are named, and that is the whole point:
 *   svg/     is named after the placeholder's source art  (broadsword.svg)
 *   custom/  is named after the *meaning*                 (gear.weapon.svg)
 * The owner should only ever need custom/: name a file after the semantic icon key
 * and it wins over the placeholder, with no manifest edit. See custom/README.md.
 *
 * Usage: npm run vendor:icons [-- --force]
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const svgDir = join(root, 'src/ui/icons/svg');
const customDir = join(root, 'src/ui/icons/custom');
const outFile = join(root, 'src/ui/icons/generated/iconPaths.ts');
const force = process.argv.includes('--force');

const iconSet = JSON.parse(
  readFileSync(join(root, 'node_modules/@iconify-json/game-icons/icons.json'), 'utf8'),
);
const GRID = iconSet.width ?? 512;

/** Every source icon this project vendors. Semantic mapping lives in iconManifest.ts. */
const SOURCES = [
  // gear slots — one canonical icon per slot type (owner directive)
  'broadsword',
  'crested-helmet',
  'bordered-shield',
  'gauntlet',
  'armor-vest',
  'boots',
  'diamond-ring',
  'gem-pendant',
  'crystal-shine',
  // currencies & resources
  'two-coins',
  'gems',
  'electric',
  'medal',
  'fragmented-meteor',
  'book-cover',
  // stats
  'health-normal',
  'piercing-sword',
  'sprint',
  'fist',
  // attack types
  'plain-dagger',
  'high-shot',
  // statuses
  'flame',
  'poison',
  'frozen-orb',
  'knocked-out-stars',
  'shield-reflect',
  'shouting',
  'health-decrease',
  'muscle-up',
  'health-increase',
  // stage kinds
  'crossed-swords',
  'barbed-star',
  'crowned-skull',
  'scroll-unfurled',
  'open-treasure-chest',
  'campfire',
  // elements (Q21 stage affinity)
  'oak-leaf',
  'fire-bowl',
  'snowflake-2',
  'lightning-trio',
  'evil-moon',
  // stage modifiers
  'enrage',
  'spiked-armor',
  'hive-mind',
  'hazard-sign',
  'dust-cloud',
  'stopwatch',
  'heart-plus',
  // map furniture
  'crossroad',
  'chest',
  'locked-chest',
  // profile & achievements (Phase 5)
  'person',
  'trophy',
  'laurels',
  'footsteps',
  'progression',
  'ribbon-medal',
  'sparkles',
  // navigation & ui
  'treasure-map',
  'card-play',
  'portal',
  'shop',
  'hamburger-menu',
  'return-arrow',
  'cross-mark',
  'padlock',
  'round-star',
  'info',
  'settings-knobs',
  'funnel',
  'upgrade',
  'check-mark',
];

mkdirSync(svgDir, { recursive: true });
mkdirSync(customDir, { recursive: true });
mkdirSync(dirname(outFile), { recursive: true });

let written = 0;
let kept = 0;
for (const name of SOURCES) {
  const icon = iconSet.icons[name];
  if (!icon) throw new Error(`Icon "${name}" is not in @iconify-json/game-icons.`);
  const file = join(svgDir, `${name}.svg`);
  if (existsSync(file) && !force) {
    kept++;
    continue;
  }
  const w = icon.width ?? GRID;
  const h = icon.height ?? GRID;
  writeFileSync(
    file,
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}">${icon.body}</svg>\n`,
  );
  written++;
}

// --- generate the inline-path module from whatever is on disk -----------------
/** Inline every .svg in a folder as { name, viewBox, body }, name = filename stem. */
function readFolder(dir) {
  return readdirSync(dir)
    .filter((f) => f.endsWith('.svg'))
    .sort()
    .map((file) => {
      const svg = readFileSync(join(dir, file), 'utf8');
      const viewBox = /viewBox="([^"]+)"/.exec(svg)?.[1] ?? `0 0 ${GRID} ${GRID}`;
      const body = svg
        .replace(/^[\s\S]*?<svg[^>]*>/, '')
        .replace(/<\/svg>\s*$/, '')
        .replace(/<!--[\s\S]*?-->/g, '')
        .replace(/\s+/g, ' ')
        .trim();
      return { name: file.replace(/\.svg$/, ''), viewBox, body };
    });
}

const entries = readFolder(svgDir);
const overrides = readFolder(customDir);
const literal = (e) =>
  `  '${e.name}': { viewBox: '${e.viewBox}', body: '${e.body.replace(/'/g, "\\'")}' },`;
/** Object literal for a folder — `{}` when empty, so the output stays Prettier-clean. */
const block = (list) => (list.length ? `{\n${list.map(literal).join('\n')}\n}` : '{}');

const ts = `// GENERATED FILE — do not edit by hand. Run \`npm run vendor:icons\` to regenerate.
// Source art: Game Icons (game-icons.net / Open Game Icons), CC BY 3.0 — see CREDITS.md.
// All of it is placeholder art. Two ways to replace a piece, neither touching code:
//   - drop <icon-key>.svg into src/ui/icons/custom/  (preferred — named by meaning)
//   - overwrite src/ui/icons/svg/<source-name>.svg   (edits the vendored placeholder)
// then re-run the script.

export interface IconPath {
  readonly viewBox: string;
  readonly body: string;
}

export const ICON_PATHS = ${block(entries)} as const satisfies Record<string, IconPath>;

export type IconSourceName = keyof typeof ICON_PATHS;

/**
 * Owner art from src/ui/icons/custom/, keyed by semantic icon key.
 *
 * Deliberately a loose Record rather than a const object: these files come and go
 * as the art lands, and \`iconPath()\` falls back to the placeholder for any key
 * that has none. \`iconManifest.test.ts\` rejects a file whose name is not a real
 * icon key, so a typo fails the build rather than silently doing nothing.
 */
export const ICON_OVERRIDES: Readonly<Record<string, IconPath>> = ${block(overrides)};
`;

writeFileSync(outFile, ts);
console.log(
  `icons: ${written} extracted, ${kept} kept (already on disk), ${entries.length} placeholders` +
    `, ${overrides.length} owner override(s) from custom/`,
);
if (overrides.length) console.log(`  overriding: ${overrides.map((o) => o.name).join(', ')}`);
