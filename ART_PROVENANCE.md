# Original art provenance

The forest clearing, building atlas and resource atlas were newly generated for this game in three image-generation calls on 2026-10-08. The consistent style uses hand-painted isometric forest buildings, warm honey colors and soft woodland neutrals.

Files shipped at `public/art/`:

- `forest-clearing.webp`: 1536 × 1024, empty forest clearing. Constructed buildings are overlaid only after the engine reports them as owned.
- `buildings-atlas.webp`: 1254 × 1254, RGBA, sixteen original building illustrations.
- `resources-atlas.webp`: 1254 × 1254, RGBA, sixteen original resource and bear illustrations.

WebP encoding preserves the source atlas alpha channels exactly. The generated atlas has nonuniform spacing, so `src/ui/art-data.js` uses measured clean crop rectangles instead of assuming equal tiles. All thirty-two crop rectangles were checked for substantial neighboring alpha pixels. The manifest records the dimensions and exact crop bounds.

The favicon and small interface line icons are original simple vector UI marks; the forest, buildings, bear and resource illustrations use the generated raster artwork.

## Storybook revision — 2026-10-09

The user requested the simple ink-and-paper direction of their previous 自嘲熊历险记 project. Three new built-in generated assets replace the previous three-dimensional-looking village art: a portrait clearing, sixteen building sprites, and sixteen resource/character sprites. The actual prior cover illustration was inspected as a visual reference. Original PNGs, generation prompts, alpha-crop measurements and hashes are preserved in source-assets/storybook-v2. The production WebP copies use quality 88 compression; sprite alpha channels were compared pixel-for-pixel and preserved. Crop bounds are measured, not inferred from a uniform grid.

Production artwork is approximately 577 KiB. All placement, building quantities, resident appearances and districts derive from current game state; the background contains no fabricated buildings. Decorative mascot is the player's guide, separate from resident population.


## Mobile composition revision — 2026-10-09

A single new original portrait clearing was generated for v3 and inspected before use. It replaces the v2 green field with a paper-colored clearing, restrained ink trees and a pale path; it has no buildings or residents baked in. The 1024 × 1280 PNG, prompt and provenance are in source-assets/generated-art. The production background is 60,416 bytes; existing original v2 building and resource atlases are unchanged. Building quantities use one sprite per type plus an accurate count badge. Four stable building slots per scene page and a separate resident lane keep the real game state readable without invented residents or repeated overlapping copies.

## Visible growth and working bears — 2026-10-09

Two original transparent atlases were generated, inspected and integrated for this revision: twelve building growth/advanced silhouettes and twelve bear work poses. PNGs, exact measured crop rectangles, prompts and hashes are preserved in source-assets/growth-v4. Both atlases are 1448×1086; alpha-preserving WebP output totals 656,446 bytes. Growth art is a presentation of actual owned counts and building identities, not a new upgrade or changed production rule. Worker illustrations reference real individual bear IDs and their current assignments. Working poses stop for pause, read-only mode, settlement or full output storage; engineers additionally require an active funded recipe. Reduced-motion mode and hidden documents suppress animation. At most three representative workers are displayed; counts reflect their real assigned groups.

## Reference-led bear identity — 2026-10-09

The user supplied a front/side/back white bear character reference. One built-in image-generation call created a unified sixteen-pose transparent atlas: neutral front, wave, side, back, five two-frame working pairs, sleepy and honey-carry poses. The broad head merging into the body, small oval ears, short limbs, black dot face and simple black contour follow that reference. Original PNG, prompt, measured crop metadata and generation provenance are preserved in source-assets/reference-bear-v5. The production atlas is lossless WebP with pixel-exact RGBA encoding; the original near-opaque white interiors and transparent exterior are preserved without alpha alteration. Animation pairs share crop size and baseline. All mascot/resource bear aliases and worker frames use the same identity; container-relative sizing preserves its proportions in rectangular icon slots. The small existing favicon was adjusted to the same face proportions. Game rules and saved-state schema are unchanged.

## Wooden hives and opening greeting — 2026-10-09

At the user's request, one built-in generated transparent sheet replaces the straw hive with a pale wooden hive with a sage roof and a matching expanded apiary. The original 1774×887 PNG, generation prompt and measured alpha crops are preserved in source-assets/wooden-hive-v6. The lossless production WebP preserves source alpha. All basic-hive previews and the expanded apiary use this new sheet. No production values, costs, unlock thresholds or save schema changed. The opening greeting reuses the reference bear's front, wave and side sprites in a short, nonblocking presentation sequence, then removes the guide. It waits for its image to load, pauses when hidden or covered, honors reduced motion, and records completion only after finishing.

## Village and loading revision — 2026-10-09

Two new built-in generated assets unify the core scene: a portrait clearing with four empty lots and a winding road, and an eight-building atlas using bold outlines, cream walls, sage roofs and honey wood. Prompts and core building original/crops are in source-assets/village-v7. The existing reference bear and wooden hives retain their designs. Production bear/hive images are now quality-92 WebP (alpha retained), reducing those two downloads from 1,446,706 to 429,894 bytes. A small two-frame loading sprite is derived from the existing idle/wave bear poses; no new character or artificial resident is created. The old in-scene introduction has been removed.

The current asset manifest records production dimensions, byte sizes and hashes. Critical art preloads use the same independently hashed URLs as CSS, and the game starts after image decode; loading errors offer a reload without deleting progress. Original engine rules and save schema are unchanged.

## Navigation and exploration revision — 2026-10-09

One original generated portrait exploration map is used behind the discovered destination buttons. The terrain artwork has no prebuilt settlements or interface text. Source and prompt are preserved in source-assets/exploration-v8. Only engine-unlocked destinations appear. Construction now uses an object-centered blueprint workbench and illustrated inventory slots. All menus overlay a single invariant world/dock geometry. Resource HUD text updates separately from pressed/scrolling controls; navigation does not invoke gathering.

## Nested exploration regions — 2026-10-09

One newly generated three-panel atlas supplies woodland, riverbank and twilight regional backgrounds, cropped into three 627 × 836 WebP scenes. It contains terrain only, without characters, buildings or interface text. Original, prompt and crop metadata are preserved in source-assets/regions-v9. Existing building art supplies functional local landmarks. World-map controls navigate to regional scenes; only tapping a regional landmark opens its engine-backed operation panel. Achievements and prestige are utilities rather than geographic places. The world map scroll position survives returning from regions. No new economic rules, resource gains or save schema changes are introduced.

## Unified painted architecture v26
Four original AI-generated transparent sheets (home growth, workplaces, expedition, utilities) were created with the built-in image generator against the approved original v25 workshop reference. Original RGBA PNGs and measured crop/packing metadata are retained in `source-assets/painted-v26`. Production sheets use transparent WebP, 1536×768 each. Source subjects include 32 illustrated base/developed variants. The approved base workshop and reference white bear are retained. Visible expansion is derived only from actual owned building counts; work motion follows real production/assignment state and stops when paused, disabled, capped, or read-only.

## v5.8 cohesive storybook world
Original AI-generated repaint of the owned home ground art, using its existing paths and woodland art as references. No third-party assets. Source and prompt: source-assets/home-v27. Runtime: forest-clearing-painted.webp. Existing owned building sprites compose notebook subject images, workplace dioramas and map landmarks; original reference-led white bear retained with subtle CSS lighting.

## v5.9 semantic art and geographic regions
All newly generated images are original built-in imagegen outputs. 24 research subject motifs contain no buildings, 52 resource symbols replace misleading aliases and fill catalog omissions, and 24 functional building silhouettes replace shared factories/houses (21 used by current catalog/stage variants; 3 reserved variants). Three world terrain paintings represent settlement, industry, and stellar civilization. Runtime sheets use alpha-aware sprite extraction and repacking only. Source PNGs: source-assets/semantic-v29; generated atlas keys preserved in src/ui/semantic-resources.js, semantic-buildings.js and research-art.js. Era transitions and geographic grouping are presentation derived from actual completed research and owned facilities, with no economy changes.

## v6.0 — Little Bear Simple Picture Book (2026-10-10)

The user requested that the entire visual language follow the reference white bear.
Original built-in image generation redrew 32 main/expanded buildings, the workshop,
24 additional building subjects, 24 research subjects, 52 semantic resource icons,
16 basic resource/decorative icons, and home/region/civilization environments.
The original white-bear pose sheet and loading bear are retained unchanged.

Generated originals, prompts, source crop rectangles and packing instructions are
retained in `source-assets/simple-book-v31/`. `scripts/art/pack-simple-book.py`
only extracts complete sprites, scales them and packs padded WebP atlases. Generated
alpha is preserved. Source crops account for disconnected marks and sprites that
cross nominal generated-grid lines. No third-party game code or artwork was used.

The direction is bold rounded contours, simplified functional silhouettes, broad
cream/sage/honey color areas and minimal flat shadows. Terrain is deliberately
low-detail. UI chrome uses the same quiet palette and outlined shapes, without
painted wood, paper grain, blueprint grids or simulated metallic panels. Resource
and research subject mappings, progression thresholds and all simulation values
are unchanged.

## v6.1 occupational bear outfits
Nine occupational costumes with eighteen ready/work poses were generated with built-in image generation using the established white bear reference. Raw atlases, prompts and measured body anchors are retained under source-assets/worker-outfits-v34. Technical packing preserves transparency and aligns head centers and feet rather than fitting tool bounds independently. Runtime worker-outfits.webp is shared by scene actors and job portraits. Idle bears retain the reference identity; production/pause/capacity controls select motion without changing economic rules.

## v6.2.1 continuous map and loading motion
A single long, uninterrupted forest painting replaces vertically repeated background tiles. Built-in image generation used the established simple picture-book forest reference; original, refinement and prompts are retained in source-assets/continuous-map-v39. Runtime uses a single cover image, without repetition or aspect distortion. The loading screen reuses the original bear drawing with continuous transform-only breathing, separate leaf/shadow movement, real progress interpolation, reduced-motion support and a short completion fade.

## v6.3 exploration overview
Three single-composition tall world maps (settlement, industrial, stellar) were generated with built-in image generation and refined against the existing simple picture-book style. The forest era shares the continuous forest painting. Raw passes and prompts are retained in source-assets/exploration-eras-v40. All eras now use one cover background without repetition. Region thumbnails are limited to three real owned facilities; utility controls live in the More dialog, with unlocked ungrouped actions retained as contextual destinations.
