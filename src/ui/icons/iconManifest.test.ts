import { describe, expect, it } from 'vitest';
import { ICON_KEYS, GEAR_SLOTS, gearSlotIconKey } from '@/content/schemas/iconKeys';
import { ICON_MANIFEST, ICON_OVERRIDES, gearSlotIcon, iconPath } from './iconManifest';

/**
 * The icon drop-in contract.
 *
 * The owner replaces placeholder art by dropping `<icon-key>.svg` into
 * `src/ui/icons/custom/` and re-running `npm run vendor:icons`. The failure mode
 * that costs an afternoon is a *misspelt* file: it lands, the script inlines it,
 * and nothing changes on screen because no key matches. These make that a failing
 * build instead of a mystery.
 */
describe('icon manifest', () => {
  it('names every semantic key exactly once', () => {
    expect(Object.keys(ICON_MANIFEST).sort()).toEqual([...ICON_KEYS].sort());
  });

  it('resolves every key to art with a body', () => {
    for (const key of ICON_KEYS) {
      const path = iconPath(key);
      expect(path.body.length, key).toBeGreaterThan(0);
      expect(path.viewBox, key).toMatch(/^[-\d.]+ [-\d.]+ [-\d.]+ [-\d.]+$/);
    }
  });

  it('only accepts owner overrides named after a real icon key', () => {
    // A typo — `gear.wepon.svg`, `boots.svg` — would otherwise be silently inert.
    for (const key of Object.keys(ICON_OVERRIDES)) {
      expect(ICON_KEYS, `src/ui/icons/custom/${key}.svg is not a semantic icon key`).toContain(key);
    }
  });

  it('prefers owner art over the placeholder', () => {
    for (const [key, art] of Object.entries(ICON_OVERRIDES)) {
      expect(iconPath(key as (typeof ICON_KEYS)[number])).toBe(art);
    }
  });

  it('resolves gear art from the slot and nothing else', () => {
    // Owner directive / CLAUDE.md rule 5: one icon per slot, everywhere.
    for (const slot of GEAR_SLOTS) {
      expect(gearSlotIcon(slot)).toBe(iconPath(gearSlotIconKey(slot)));
    }
    const distinct = new Set(GEAR_SLOTS.map((s) => gearSlotIcon(s).body));
    expect(distinct.size).toBe(GEAR_SLOTS.length);
  });
});
