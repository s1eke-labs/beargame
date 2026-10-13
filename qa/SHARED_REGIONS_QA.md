# Shared Home / Explore regions — v6.4.0

User-facing change: Explore is the world-map entry point. Selecting a physical region opens the same Home scene and region tab, rather than rendering a second arrangement of buildings.

## Single source

`geographicRegions()` supplies both world-map membership and Home scene groups, including upgraded building destinations and small-region folding. Native facilities use their canonical district slots; folded singleton facilities append after native village slots. They may move when a district opens or merges, but entry route does not change their layout. Details continue to dispatch original engine IDs.

Canonical scene links are `#home/<region>`. Existing `#more/map/<region>` links resolve to the corresponding shared scene; old action suffixes resolve to the still-supported system pages. Unknown or merged physical Home regions fall back to village. Unlocked systems without a distinct physical district remain reachable through Explore's More menu.

A Home toolbar control returns to the world map. Home scene scroll, map scroll, modal history, explicit paid actions, paused state and read-only ownership are preserved. Recipe picking, engineer automation, embassies, faith, space and time controls remain accessible.

## Checks

- 739 automated tests pass, including 50 independent shared-region checks.
- All 32 combinations of five building-stage upgrades preserve exactly-once scene membership.
- Seven-versus-six regression: hive/hut/library/barn/pasture/logHouse/mansion plus academy. Both Home village and Explore village contain six types; library and academy consistently belong to learning.
- Actual handlers cover map entry, legacy/fallback links, invalid links, navigation without resource changes, modal history, modeled scroll restoration, and sale/merge/undo.
- The normal-action campaign still passes all 15 stage/branch results, 51,106 operations, with exact exported-state equality.
- Static build checks validate 90 production files and 181 local asset/import links.

DOM/history simulation has no layout engine. Live Chrome visual, geometry and touch-sized viewport checks are performed separately after publication. This does not claim physical mobile-device coverage.
