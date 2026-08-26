import { describe, expect, it } from 'vitest';
import {
  CONTENT,
  CONTENT_SOURCE,
  ContentValidationError,
  buildContent,
  validateContent,
} from './index';
import { gearDef } from './schemas';
import { GEAR_SLOTS } from './schemas/iconKeys';
import { ICON_KEYS } from './schemas/iconKeys';

const emptySource = {
  cards: [],
  gear: [],
  gearSlots: [],
  skills: [],
  statuses: [],
  patterns: [],
  enemies: [],
  regions: [],
  encounters: [],
  lootTables: [],
  summonPools: [],
  growthCurves: [],
  shopOffers: [],
};

const validCard = {
  id: 'card.test_drake',
  name: 'Test Drake',
  cardClass: 'unit',
  rarity: 'rare',
  attackType: 'melee',
  baseStats: { strength: 100, attack: 20, speed: 10 },
  growth: 'growth.rare',
  attackPattern: 'pattern.single',
  skills: [],
  artKey: 'card.test_drake',
};

const baseTables = {
  ...emptySource,
  patterns: [{ id: 'pattern.single', name: 'Default', cells: [[0, 0]] }],
  growthCurves: [
    { id: 'growth.rare', statPerLevel: 1.08, xpBase: 110, xpExponent: 1.55, levelsPerStar: 10 },
  ],
};

describe('shipped content validates', () => {
  it('builds without errors', () => {
    expect(() => buildContent(CONTENT_SOURCE)).not.toThrow();
    expect(validateContent(CONTENT_SOURCE)).toEqual({ ok: true });
  });

  it('registers the system content Phase 0 ships', () => {
    expect(CONTENT.gearSlots.size).toBe(GEAR_SLOTS.length);
    expect(CONTENT.patterns.size).toBeGreaterThan(0);
    expect(CONTENT.statuses.size).toBe(9);
    expect(CONTENT.growthCurves.size).toBe(5);
  });

  it('names an icon key that exists for every status and gear slot', () => {
    const keys = new Set<string>(ICON_KEYS);
    for (const status of CONTENT.statuses.values()) expect(keys.has(status.iconKey)).toBe(true);
    for (const slot of CONTENT.gearSlots.values()) expect(keys.has(slot.iconKey)).toBe(true);
  });
});

describe('gear icons are fixed per slot (owner directive / CLAUDE.md rule 5)', () => {
  it('rejects a gear item that tries to carry its own icon', () => {
    const withIcon = {
      id: 'gear.sneaky_boots',
      name: 'Sneaky Boots',
      slot: 'boots',
      rarity: 'sturdy',
      stars: 2,
      mainStatBase: 12,
      iconKey: 'gear.weapon',
    };
    const result = gearDef.safeParse(withIcon);
    expect(result.success).toBe(false);
    expect(JSON.stringify(result.error?.issues)).toContain('iconKey');
  });

  it('rejects bespoke art fields on gear too', () => {
    for (const field of ['icon', 'artKey', 'image']) {
      const result = gearDef.safeParse({
        id: 'gear.test_boots',
        name: 'Test Boots',
        slot: 'boots',
        rarity: 'worn',
        stars: 1,
        mainStatBase: 5,
        [field]: 'anything',
      });
      expect(result.success, `gear must not accept "${field}"`).toBe(false);
    }
  });

  it('accepts a well-formed gear item with no art of its own', () => {
    expect(
      gearDef.safeParse({
        id: 'gear.springstep_boots',
        name: 'Springstep Boots',
        slot: 'boots',
        rarity: 'refined',
        stars: 3,
        mainStatBase: 18,
      }).success,
    ).toBe(true);
  });

  it('fails a slot whose icon key does not match its own slot', () => {
    expect(() =>
      buildContent({
        ...baseTables,
        gearSlots: [{ id: 'boots', name: 'Boots', iconKey: 'gear.helmet', mainStat: 'speed' }],
      }),
    ).toThrow(/must be "gear.boots"/);
  });
});

describe('broken fixtures fail loudly and readably', () => {
  it('reports the card, the field and the reason for a schema error', () => {
    try {
      buildContent({
        ...baseTables,
        cards: [{ ...validCard, baseStats: { strength: -5, attack: 20, speed: 10 } }],
      });
      expect.unreachable('should have thrown');
    } catch (error) {
      expect(error).toBeInstanceOf(ContentValidationError);
      const message = (error as ContentValidationError).message;
      expect(message).toContain('card.test_drake');
      expect(message).toContain('baseStats.strength');
    }
  });

  it('catches a dangling skill reference', () => {
    expect(() =>
      buildContent({
        ...baseTables,
        cards: [{ ...validCard, skills: [{ skillId: 'skill.nope', unlockStars: 1 }] }],
      }),
    ).toThrow(/unknown skill "skill.nope"/);
  });

  it('catches a dangling growth curve and pattern', () => {
    expect(() =>
      buildContent({ ...baseTables, cards: [{ ...validCard, growth: 'growth.ghost' }] }),
    ).toThrow(/unknown growth curve/);
    expect(() =>
      buildContent({ ...baseTables, cards: [{ ...validCard, attackPattern: 'pattern.ghost' }] }),
    ).toThrow(/unknown pattern/);
  });

  it('rejects duplicate ids', () => {
    expect(() => buildContent({ ...baseTables, cards: [validCard, validCard] })).toThrow(
      /duplicate id/,
    );
  });

  it('rejects ids that break the domain.snake_case convention', () => {
    expect(() =>
      buildContent({ ...baseTables, cards: [{ ...validCard, id: 'EmberDrake' }] }),
    ).toThrow(/card\.snake_case|must start with/);
  });

  it('requires heroes to have a leader skill and units not to', () => {
    expect(() =>
      buildContent({ ...baseTables, cards: [{ ...validCard, cardClass: 'hero' }] }),
    ).toThrow(/leaderSkill/);
  });

  it('collects several problems in one report instead of stopping at the first', () => {
    const result = validateContent({
      ...baseTables,
      cards: [
        { ...validCard, growth: 'growth.ghost' },
        { ...validCard, id: 'card.other', attackPattern: 'pattern.ghost' },
      ],
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.problems.length).toBeGreaterThanOrEqual(2);
  });

  it('rejects an enemy group with two members in one slot', () => {
    expect(() =>
      buildContent({
        ...baseTables,
        cards: [validCard],
        enemies: [
          {
            id: 'enemy.test',
            name: 'Test',
            members: [
              { cardId: 'card.test_drake', slot: 0 },
              { cardId: 'card.test_drake', slot: 0 },
            ],
          },
        ],
      }),
    ).toThrow(/share slot 0/);
  });

  it('keeps enemy-only cards out of summon pools', () => {
    expect(() =>
      buildContent({
        ...baseTables,
        cards: [{ ...validCard, enemyOnly: true }],
        summonPools: [
          {
            id: 'pool.test',
            name: 'Test Pool',
            tokenCurrency: 'token_unit_t1',
            cost: 1,
            entries: [{ cardId: 'card.test_drake', weight: 1 }],
          },
        ],
      }),
    ).toThrow(/enemy-only/);
  });
});
