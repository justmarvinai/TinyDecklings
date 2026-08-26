/**
 * Vendors the placeholder icon set (Game Icons / Open Game Icons, CC BY 3.0) and
 * regenerates the inline-path module the <Icon> component reads.
 *
 * Two steps, deliberately separate so the owner's final art can replace icons
 * without touching code (CLAUDE.md rule 6):
 *   1. extract  — write src/ui/icons/svg/<name>.svg for every key in the manifest.
 *                 EXISTING FILES ARE NEVER OVERWRITTEN (pass --force to refresh),
 *                 so dropping in hand-made art and re-running is safe.
 *   2. generate — read that folder and emit generated/iconPaths.ts.
 *
 * Usage: npm run vendor:icons [-- --force]
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const svgDir = join(root, 'src/ui/icons/svg');
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
const files = readdirSync(svgDir)
  .filter((f) => f.endsWith('.svg'))
  .sort();
const entries = files.map((file) => {
  const svg = readFileSync(join(svgDir, file), 'utf8');
  const viewBox = /viewBox="([^"]+)"/.exec(svg)?.[1] ?? `0 0 ${GRID} ${GRID}`;
  const body = svg
    .replace(/^[\s\S]*?<svg[^>]*>/, '')
    .replace(/<\/svg>\s*$/, '')
    .replace(/\s+/g, ' ')
    .trim();
  return { name: file.replace(/\.svg$/, ''), viewBox, body };
});

const ts = `// GENERATED FILE — do not edit by hand. Run \`npm run vendor:icons\` to regenerate.
// Source art: Game Icons (game-icons.net / Open Game Icons), CC BY 3.0 — see CREDITS.md.
// All of it is placeholder art; dropping a replacement .svg into src/ui/icons/svg
// and re-running the script swaps it with no code change.

export interface IconPath {
  readonly viewBox: string;
  readonly body: string;
}

export const ICON_PATHS = {
${entries.map((e) => `  '${e.name}': { viewBox: '${e.viewBox}', body: '${e.body.replace(/'/g, "\\'")}' },`).join('\n')}
} as const satisfies Record<string, IconPath>;

export type IconSourceName = keyof typeof ICON_PATHS;
`;

writeFileSync(outFile, ts);
console.log(
  `icons: ${written} extracted, ${kept} kept (already on disk), ${entries.length} in generated module`,
);
