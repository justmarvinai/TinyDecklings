# Credits & asset attribution

All art currently in this repository is **placeholder art**. The owner supplies final per-card art and the
final icon set later; everything resolves through the semantic asset manifest, so replacing it is an asset
drop, never a code change (`CLAUDE.md` rule 6, `ARCHITECTURE.md` §6).

## Icons — Game Icons (Open Game Icons)

The placeholder interface/game icons in `src/ui/icons/svg/` come from the **Game Icons** collection
(<https://game-icons.net>, mirrored as [Open Game Icons](https://open-game-icons.net/) and
<https://github.com/open-game-icons/icons>), vendored via the `@iconify-json/game-icons` package.

- **License:** [Creative Commons Attribution 3.0 Unported (CC BY 3.0)](https://creativecommons.org/licenses/by/3.0/)
- **Attribution:** Icons by the Game-Icons.net contributors — among them Lorc, Delapouite, Faithtoken,
  sbed, Skoll, Willdabeast, Carl Olsen, John Colburn, Felbrigg, John Redman, Priorblue, Cathelineau,
  DarkZaitzev, Guard13007, Kier Heyl, Lord Berandas, Sbed, Zeromancer and others.
- **Per-icon authorship:** the Iconify distribution flattens per-artist folders, so individual authors are
  credited collectively above. Each icon's author can be looked up by name on game-icons.net.
- **Changes:** icons are used as-is (recoloured at runtime via `currentColor`); no shapes were modified.

Re-vendor or refresh with `npm run vendor:icons` (`-- --force` to overwrite existing files). Files already
present in `src/ui/icons/svg/` are never overwritten, so hand-supplied replacements survive re-runs.

## Card art

`src/ui/art/placeholder-avatar.svg` — original placeholder created for this project; one shared avatar
stands in for every card until final art arrives.

## Font

**Saira** by Héctor Gatti / Omnibus-Type, [SIL Open Font License 1.1](https://openfontlicense.org/),
self-hosted via `@fontsource/saira`.

## Reference screenshots

`assets/examples/` contains third-party screenshots (Black Deck by Inforce Games; Brawl Stars by Supercell)
used **internally as visual direction only**. They are not redistributed as part of the game and no assets
from them are used in the build.
