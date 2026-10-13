# Beargame · 蜜林小熊文明

A new, independently written Chinese bear-and-honey incremental civilization game. It is a playable game interface, not a marketing page. Original generated raster artwork, plain JavaScript ES modules, no accounts, backend, analytics, runtime dependencies or external fonts.

## Chapter release builds

Public `dist` now contains only the forest chapter. The complete original game source remains intact for internal development. See [chapter release architecture](docs/CHAPTER_RELEASES.md) for the release boundaries, save compatibility, asset isolation and verification requirements. Later profiles fail closed until their content is reviewed and extracted.

## Run and build

Use Node.js 24.19.0 for release verification and CI; historical campaign fixtures require this verified runtime. The scripts use import.meta.dirname, so compatibility with earlier Node.js versions is not claimed. The deployed game itself needs only a modern browser. The chapter asset verification also requires Python 3 with Pillow; these are build-time tools only. No browser runtime dependencies are needed.

```sh
npm run dev         # full-source internal preview on http://localhost:4173
npm run check
npm test           # after npm run build; includes source and emitted-release checks
npm run verify     # syntax, chapter build, full CPU tests and release leakage audit
npm run build       # forest-only public static site in dist/
npm run build:full  # internal complete build in .private-build/full (not published)
npm run preview     # serve dist locally
```

Serve the directory over HTTP; directly opening index.html as a file may block browser module imports. The production build contains only index.html, static source modules, and artwork. It does not require an npm server in production.

## Complete-source gameplay reference

The sections below document the complete development game; not every system is present in the public forest chapter.

## Playing

- 家园: gather honey immediately, inspect real built structures, see the current next step.
- 建造: production, storage and community buildings with engine-derived current costs and prerequisites; detail-sheet selling, five destructive stage-change confirmations, sequential queues, independent automation, energy and pollution.
- 研究: research, workshop upgrades and all policy routes, with engine-provided costs, requirements and mutually exclusive choices.
- 小熊: population, housing, happiness, job assignment and festivals; searchable leadership roster with 25 residents per page, appointment/removal/promotion, and specialist engineer recipe allocation. Seasonal gift cards appear only when actual box inventory and the engine’s calendar eligibility allow opening.
- 更多: crafting, trade, embassies and ambassadors, elder feeding, blackcoin exchange, faith and pacts, space routes, confirmed sales of eligible stackable worship upgrades and planetary facilities, prestige, time actions, multi-challenge selection and reserve reclaim. 森林纪念册 presents real achievements, starred milestones and badges while respecting hidden records and unavailable external-service conditions. Gates and effects come from the rules engine, and undiscovered choices are hidden; unlocked but unaffordable choices remain visible.
- Tap any resource to inspect stored quantity, capacity and net production.
- Settings contain pause, opt-in offline production, reduced motion, local saving, JSON export and confirmed import.
- Eligible actions expose a 20-second engine-validated undo notice. Only the latest eligible action is recorded; spent outputs can prevent reversal, and the temporary record does not survive reloading.

Local progress is saved in the browser every 15 seconds, after non-gather actions and on leaving the page. Export a backup before clearing browser data or switching devices. Long time jumps use a separate asynchronous calculation dialog with progress and locked mutations; pre-operation state is saved before starting, and a failed calculation can safely reload. A localStorage ownership lease prevents two tabs from actively simulating or overwriting progress simultaneously; the other tab displays a read-only notice with explicit takeover.

Import, prestige reset, challenge start, building sell/stage changes, policy choices, full-stock currency exchanges, clearing a queue and destructive faith/prestige conversions require confirmation. Queue options are shown 12 per page and queued entries 25 per page; the storybook scene assigns every owned building to a stable district slot, with six types per scene page. No test controls, developer shortcuts or accelerated-start game are exposed in production.

## Structure

- `src/engine/`: independent mechanical implementation, validated/versioned persistence and centrally derived snapshots. See `src/engine/API.md`.
- `src/ui/render.js` and `src/ui/advanced.js`: escaped HTML views, original Chinese copy, bounded rosters/queues, action cards and readable Chinese rule-coverage lists.
- `src/main.js`: event routing, clock, dialogs, persistence UI and cross-tab coordination.
- `src/styles/main.css`: mobile-first touch layout, desktop navigation, safe areas, reduced motion and visible keyboard focus.
- `public/art/`: original generated clearing and transparent building/resource raster atlases.
- `src/ui/art-data.js`: measured crop rectangles; individual illustrations are displayed directly from the raster atlases. No generated scene substitute or CSS-drawn village.
- `src/ui/webmcp.js`: optional feature-detected WebMCP `read_game_state`, `gather_honey` and `build`. Mutations use the same validated action route as the UI; destructive save/reset actions are not exposed.
- `tests/` and `qa/`: engine, persistence, formulas, pure UI, structural markup and WebMCP-stub checks.

## Rules and authorship

Beargame includes a browser-local simulation engine, Chinese interface and illustrated forest setting. Gameplay features and known limitations are described in the in-game help. Saves use the versioned Beargame format.

All three primary art images were newly generated for this project. See `ART_PROVENANCE.md` and `public/art/asset-manifest.json` for the source and measured sprite bounds.

## Verification limits

CPU checks cover the mechanical engine, saving, pure view functions, HTML balance, input escaping, actual app event handlers against a controlled DOM fixture, and optional WebMCP registration using a stub. npm run verify additionally rebuilds the standalone distribution and validates local production asset/import links. Short-phone CSS explicitly compacts the home introduction and forest scene below 740px viewport height, preserving the gather action and 16px primary-action text. The available environment did not provide an authorized working browser, so touch-device screenshots, actual browser layout and registration in a WebMCP-capable browser are not claimed as verified. Responsive source checks are not a substitute for a real-device visual pass.

## Mobile-first storybook revision (v2)

The Oct 9 redesign uses the user’s prior 自嘲熊历险记 as its visual reference. The main viewport is a portrait world with small resource controls, image-led construction, progressive navigation and compact bottom sheets. Completed research and specialist management are disclosed contextually. All mechanics and save identities remain unchanged. See qa/V2-REDESIGN.md for verification and the explicit browser/device QA limitation.

## EdgeOne deployment

Pushes to `master` run the full release verification and deploy only the approved forest `dist/`. Set the repository Actions secret `EDGEONE_API_TOKEN`; the project name follows the repository name. See [source recovery and deployment notes](docs/SOURCE_RECOVERY.md). The development test domain is https://beargame.demo.001208.xyz; DNS and EdgeOne custom-domain setup are separate from the workflow.
