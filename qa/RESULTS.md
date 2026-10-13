# Independent QA results

Verified 2026-10-08 against the current project. Numerical reference: Kittens Game commit `781e379f79f1e7512d168849cba21ed111502644`. The reference executable was not embedded in, or run as part of, this game.

## Final aggregate result

- `npm run verify`: **509 tests passed, 0 failed, 0 skipped**; JavaScript syntax checks, production build and local-file link audit passed.
- Production audit: **40 files and 95 local asset/module references**, without missing targets or reference-checkout files in the distribution.
- Full output: `latest-verification-output.txt`. Subsequent implementation edits require another verification run; this result is a checkpoint, not a guarantee about future changes.

## Independently exercised behavior

### A real new-game path

`independent-new-game-path.test.mjs` starts from `createGame`, with every resource and building empty. It performs ten ordinary gather actions and then waits for ordinary fixed-rate production. It builds twenty hives, refines five wood, buys housing, waits for both residents, assigns foresters, builds a library, exports/reimports that real progress, assigns scholars, researches Calendar and Agriculture, and finally assigns a farmer.

This takes **702 simulated real seconds, 3,510 ordinary ticks and ten manual gathers**, with two surviving bears and no deaths. No resource amounts, research flags, arrival progress, production multipliers or development cheats are injected. This validates an early progression route; it does not represent a complete unassisted endgame playthrough.

### Numeric and simulation checks

- **339 factual records** have independently retained prices, declared geometric ratios and recipe output compared with the runtime catalog: 40 buildings, 61 research records, 143 workshop records, 23 recipes, five building replacements and selected complete faith/space subcatalogs. These checks validate catalog values, not every dynamic effect of every entry.
- Selected dynamic fixtures cover storage, food demand, morale, migration, starvation cooldowns, skill intervals, geometric purchases, conversion ordering, leadership, policies, advanced trading, ambassador upkeep, event thresholds, pacts, celestial cycles, space travel, prestige and challenge interactions.
- Seeded 20,000-trade samples test hostile success, friendly bonuses, titanium, blueprint and spice expectations. The independently implemented random stream is not expected to reproduce another implementation's exact random history.
- Accelerated rates are checked against actual elapsed production: one ordinary spring hive at 1.5× time displays 1.40625 honey per real second and produces 2.8125 over two real seconds (15 simulation ticks). Breakdown totals agree with the displayed rate.
- The compressed offline model has separate factual oracles. It is deliberately not tested by equating every offline result with active-tick replay. Calendar subyear fields, cached-rate production, capped growth, event rounding, queues, conversion timing and other enumerated redshift rules are covered by the combined suite.

### Data and lifecycle safety

Tests preserve the safety assertions around pending operations rather than dropping them when the offline arithmetic changes:

- Mutation, reset, import, save and export locks during partial settlement
- Host-event-loop yielding and progress reporting
- Persisted checkpoints remaining untouched until completion
- Failed/interrupted settlement rollback and deterministic checkpoint retry
- Close/reopen replay without duplicated or lost gains
- Hidden/visible transitions, offline-disabled and paused games
- Losing cross-tab ownership during settlement, including prevention of stale writes
- Strict malformed-import checks and ordinary save round trips
- Undo use, twenty-real-second expiry while paused, read-only ownership, and undo refusal during offline or time-jump settlement

The visibility test uses an uncapped outcome of **1,562.5 honey**, so a full warehouse cannot conceal duplicate settlement.

### Actual frontend handlers

`dom-harness.mjs` imports the actual `main.js`. The advanced tests extract button data from its current rendered HTML before invoking its handlers. They exercise all five destructive stage confirmations and cancellation, leadership paging/search/appointment/promotion across 1,000 residents, queue confirmations, engineer specialties, multi-challenge selection/start, time-jump progress locks, undo and the achievement page's earned/secret/service-unavailable states. The final sale addendum also exercises worship and planetary-facility cancellation, confirmed one/max quantities, worship's retained first level, fuel-refund exclusions, non-sale family exclusions and restoration through the actual undo button.

The final seasonal-gift addendum also drives actual December startup, January reopening of the same saved box, cancellation, single consumption, exact karma and wrapping-paper rewards, absence in a fresh October village, and read-only/offline/time-settlement refusal. It does not inject a gift into the December-to-January grant test.

This is a controlled DOM and HTML-parser test. It does **not** execute a browser layout engine, paint frames, inspect screenshots, validate real touch gestures or certify screen-reader behavior.

## CPU stress measurement

`node qa/benchmark-long-game.mjs --save` records 30 samples after five warmups for a synthetic all-research state at 0, 100 and 1,000 residents. At 1,000 residents the default leadership response contains **50 action cards for 25 residents**, with the remaining residents reachable through paging and search.

Exact timings and runtime information are in `latest-long-game-benchmark.json`. They measure Node CPU snapshot generation, HTML-string generation and one ordinary simulation tick. They are not mobile/browser performance results. Very large imported populations can still make an individual batch exceed the asynchronous time budget.

## Provenance and verification limits

`latest-provenance.json` records a scan for identical files and matching windows of six normalized significant source lines. No matches were found at this checkpoint. This limited scan does not establish legal clearance, exhaustive originality or absence of semantic similarity. Artwork provenance and independent authorship are separately documented by the project.

No supported browser session was available for this pass. **Browser rendering, phone screenshots, fold/overflow appearance, touch ergonomics and real-device responsiveness remain unverified.** CSS/source checks for viewport, safe-area behavior, text sizes, reduced motion and focus styling are not substitutes for that work.

The test count is not a claim of exhaustive parity across all challenge combinations, optional source flags, extreme imports, random sequences or every late-game interaction. Static catalog parity, exercised mechanics, actual handler coverage and unperformed visual checks are intentionally reported separately.
