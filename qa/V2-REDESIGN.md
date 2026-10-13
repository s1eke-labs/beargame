# Beargame v2 mobile redesign

Requested changes: simplify mobile UI, remove undiscovered technology/building catalogs, make actual graphical growth primary, and match the user's prior 自嘲熊历险记 art direction.

- Entire main viewport is a portrait illustrated world, with compact resource HUD, contextual actions and progressive navigation.
- Building/research selections use compact illustrated tiles in a bottom sheet. Descriptions, effects, management and full costs remain in detail sheets.
- Unlocked but unaffordable options remain visible. Locked never-owned options are omitted, not greyed out. The unusual gate-free ivory temple is additionally withheld until its required rare materials are discovered, including queue options.
- Completed research and advanced queues/rosters are collapsed. All existing engine systems/actions and save keys remain unchanged.
- All 40 base building types are mapped to stable district slots. Six types per scene page; every occupied page is reachable. Quantities show up to three representative copies plus actual count; population controls resident sprites.
- Scenery and animations are retained across ordinary one-second refreshes. Detail disclosure, keyboard focus, sheet scroll and independent horizontal strips survive refreshes.
- Portrait and short-height CSS, safe areas, touch targets, reduced motion and single-column specialist cards are included.
- New generated paper/ink assets were visually inspected, all 32 crops checked and sprite alpha verified after WebP compression.

Verification: full engine and actual-handler DOM suites plus new mobile progressive-disclosure tests. No game-engine source files changed.

Limitation: Chromium could not launch in this cloud environment: process-singleton socket() Operation not permitted, both normal launch and the normal escalated retry. No browser security/sandbox flags were weakened. Neither real browser layout screenshots nor iPhone touch testing were completed. CSS/DOM checks are not represented as device validation.
