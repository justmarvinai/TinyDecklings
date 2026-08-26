# TinyDecklings — Owner Decisions

> **Gate status:** Q1–Q30 **answered on 2026-08-26** — the owner accepted **all recommendations, except
> Q14 → option (b)** (energy pacing system). All docs are updated to the decided state.
>
> Development started the same day; see `ROADMAP.md` for what has shipped since.
>
> This file remains the intake for **future** owner decisions: new ambiguities get appended under
> "Open questions" instead of being silently decided (see `CLAUDE.md` workflow).

## Decision log (2026-08-26)

_(Q19 was never assigned — numbering gap, not a missing decision.)_

| Q   | Topic                         | Decision                                                                                                                                        |
| --- | ----------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| Q1  | Persistence model             | **(a)** Persistent collection + endless stage journey; "Expedition" roguelike mode = post-release backlog candidate                             |
| Q2  | Map structure                 | **(a)** Linear endless chain; occasional 2-way forks rejoin after 1–3 stages (Phase 4)                                                          |
| Q3  | Combat control                | **(a)** Manual targeting by default; AUTO toggle; X1/X2 speed                                                                                   |
| Q4  | "2" badge meaning             | **(a)** Rounds-until-skill-ready cooldown counter                                                                                               |
| Q5  | Stat model                    | **(a)** Strength (max HP) + visible Attack (+ Speed later); no DEF/dodge/crit in v1                                                             |
| Q6  | Deck & battlefield            | **(a)** 1 Hero + 8 Units; 2×3 per side; no dupes in deck; 6 saved decks; Defense deck cut                                                       |
| Q7  | Reinforcements & rows         | **(a)** Queue refills empty slots next round; melee locked to living front row, ranged free; patterns widen hits                                |
| Q8  | Card rarity ladder            | Common 1★ gray · Uncommon 2★ green · Rare 3★ blue · Epic 4★ magenta · Legendary 5★ gold; ascension to 6★                                        |
| Q9  | Gear rarity ladder            | Worn gray · Sturdy green · Refined blue · Ornate pink · Exalted orange · Mythic red (independent from cards)                                    |
| Q10 | Gear slots                    | **(a)** All 8 + Artifact@6★; slice activates Weapon/Helmet/Armor/Boots                                                                          |
| Q11 | Gear depth                    | **(a)** Main stat by slot + rarity-scaled substats + gold enhancement; no substat-reroll gambling                                               |
| Q12 | Heroes                        | Confirmed: leader-class card, one per deck, fights + Leader Skill, own summon pool                                                              |
| Q13 | Gacha & money                 | **(a)** Summon fully earnable; **zero real-money IAP**; fully offline                                                                           |
| Q14 | Energy                        | **(b) — owner deviation:** generous fast-refill energy (cap 30, 1/2min regen; costs battle 5 / elite 6 / boss 8, vignettes free; lands Phase 3) |
| Q15 | Red-swords 10/10 counter      | **(a)** Cut for v1 (HUD slot removed)                                                                                                           |
| Q16 | Node mix                      | Battle / Elite (~5th) / Boss (~10th) / Event / Treasure / Camp; regions ≈10 stages; slice = Battle+Boss                                         |
| Q17 | Stars & replay                | **(a)** 3★ flawless · 2★ ≤2 deaths · 1★ any win; replay/farming allowed; records permanent                                                      |
| Q18 | Skills                        | 1 basic + up to 5 skills (unlock by stars); upgrades cost gold + tomes; slice ships 1 skill/card                                                |
| Q20 | Status effects                | Burn, Poison, Freeze/Stun, Shield, Taunt, Weaken, Strengthen, Regen (slice ~3)                                                                  |
| Q21 | Elements                      | **(a)** Light stage-affinity: counter-element cards +10–15% on themed stages (Phase 4)                                                          |
| Q22 | RANK/TRAIT/FOIL/artifact sets | **(a)** All deferred past first release; buttons visible but locked                                                                             |
| Q23 | Meta screens in first release | **(a)** Profile + Settings only; Events/Pass → backlog; Leaderboard cut (local records = backlog candidate)                                     |
| Q24 | Navigation                    | **(a)** Bottom tab bar (MAP·CARDS·SUMMON·SHOP·MORE) + persistent top HUD; Map is home                                                           |
| Q25 | Onboarding                    | **(a)** Guided first 2 stages, then free (Phase 6)                                                                                              |
| Q26 | Audio                         | **(a)** Full pass in Phase 6 (per-region music + complete SFX); hooks wired from the slice                                                      |
| Q27 | Saves                         | Local, versioned, auto-migrating + manual export/import in Phase 7                                                                              |
| Q28 | Accessibility floor           | Reduced-motion, color-blind-safe rarity cues, ≥11px text, ≥48px targets                                                                         |
| Q29 | First-release content scope   | ~30 units + 6 heroes, ~40 gear items, 3 authored regions + endless generation, 1 boss/region                                                    |
| Q30 | Language                      | **(a)** English-only; strings centralized for later i18n                                                                                        |

## Open questions

_None currently._ New owner-preference ambiguities discovered during development are appended here
(with context, options, and a recommendation) rather than silently decided.
