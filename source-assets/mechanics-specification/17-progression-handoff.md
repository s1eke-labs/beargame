# Progression implementation checkpoint

2026-10-08 18:24 UTC. Independently authored runtime; factual reference is fixed Kittens Game commit 781e379f. This is an implementation/testing checkpoint, not a complete-parity assertion.

## Stable implementation and interfaces

- Runtime ownership completed: `src/engine/progression.js`, `progression-catalog.js`; 23 passing focused tests in `tests/progression.test.mjs`.
- Definitions cover 13 missions and 22 functional space buildings, 11 worship and 11 transcendence upgrades, 10 mythic structures, six ordinary pacts/three exclusive supply policies/fracture state, 40 metaphysics, 13 time facilities and 10 challenge identities. Zebra/ambassador integrations live in their owners' modules. Experimental/default-off space placeholders are excluded from the functional count.
- `isChallenge(state,id)` accepts independent `ironWill` and concurrent `activeChallenges`, retaining legacy scalar support. `challengeSelect(id)` toggles pending choices. `challengeStart('confirm')` applies them together through a destructive reset. Legacy `challenge(id)` starts one challenge. `reclaimReserves` is blocked until ordinary challenges and Iron Will end.
- Challenge reset reserves use maximum deposits per resource, append protected bears, clear jobs and engineer specializations, and preserve ordinary persistent resources directly. PA carries bears directly except explicit IW. Reclaim combines capped stock by maximum and uncapped stock by addition. Reset carries zebra karma through the separately authored factual formula.
- `onYearProgression(ctx,oldYear,newYear)` is called after calendar normalization and after daily processing; it awards annual antimatter/flux, millennium paragon/karma, elder visits, and the pacifist alicornmancy reward. `onSeasonProgression` sets paradox day before daily processing.
- Actions added: `feedElders`, `buyBlackcoin`, `sellBlackcoin`, `crashBlackcoin`, `useFurnaceHeat`, `toggleTemporalPress`, and `shatter('press')`. All-stock market conversion validates finite/saveable totals atomically. Market price survives reset; elder energy does not.
- VM additions: `activeChallenges`, `ironWill`, `pendingChallenges`, `reserves`, `elders`, `blackcoinPrice`; challenge cards include `active`/`pending`. Reserve details require ascoh. New action cards include accurate costs, availability, reasons and destructive-confirmation text.
- Travel cards expose `routeUnits`, `travelDays`, `travelSeconds`, `reached`; simulation subtracts routeSpeed/10 per tick, and marks reached on the following tick. Use `travelDays` for UI ETA.

## Remaining time-fast-forward divergence for next owner

Current private `advanceYears(ctx,n)` is shared by crystal shatter, manual furnace heat, and furnace automation. It computes one production snapshot, multiplies its net rates by the entire skipped duration, advances the year in one jump, then calls `annualGains(ctx,n,old,new)` once. This is insufficient for exact multi-year reference behavior:

1. Reference default `js/time.js:663–735` processes one year at a time. Its first year uses only remaining days; subsequent years use 400 days. It recalculates resource rates after each annual boundary, so cycle changes, millennium paragon and year-dependent power change later yields. Current implementation uses the starting cycle/rates for the entire jump.
2. Each reference yearly resource-retrieval interval separately preserves starting over-cap ceilings and applies current stock-dependent conversions. Current implementation has only one ceiling/supply snapshot.
3. Reference retrieval calls engineer crafting when chronoEngineers is researched and advances pollution by retrieval-scaled ticks (`js/time.js:698–708`). Current advanceYears does not invoke those hooks.
4. With void resonance, reference triggers Order of the Void for each year's full skipped ticks independently of retrieval ratio (`js/time.js:711–713`). Current advanceYears omits that path.
5. Reference invokes complete annual hooks for every skipped year (`calendar.js:1058–1133`), including AI destruction and repeated elder checks. Current annualGains aggregates selected annual payouts and combines elder-arrival probability. It does not run every external annual subsystem. Route progress and final-year challenge completion already update.
6. Alternative grouped-cycle routine exists beginning `js/time.js:830`, but fixed-reference default `testShatter=0` at line3 uses the ordinary yearly routine. Do not silently adopt a different profile.

Keep `shatterCost` unchanged unless separately checked: its bounded piecewise arithmetic is tested against an independently summed heat/dark-future oracle. Heat and resource retrieval are separate contracts. A future exact or grouped optimization should preserve action interfaces and add tests spanning cycle boundaries, year999→1000, year39999→40000, partial first years, over-cap stocks, stock depletion, engineers, pollution, void resonance and annually changing energy.

## Verification limits

All 23 focused tests passed on the current shared code at this checkpoint. This is not browser QA, all-challenge-combination coverage or exhaustive source-oracle equivalence. See `16-late-audit.md` for corrected factual semantics and source coordinates, including paradox order, winter production, pact happiness, faith-ratio separation, elders and paid market correction.
