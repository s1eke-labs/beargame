# Offline and time-skip implementation checkpoint

2026-10-08. Independently authored game logic, using factual observations from reference commit 781e379f79f1e7512d168849cba21ed111502644. No reference executable code, artwork or expressive interface text was reused.

## Delivered modules

- `redshift.js`: resource, village, space and calendar batches, queue-boundary orchestration and offline furnace transfer.
- `industrial-redshift.js`: closed-form pollution and aggregate steam automation; bridges the independently authored annual industrial hook.
- `religion-redshift.js`: bulk corruption/debt thresholds, paradox chargeable days and full-duration Order of the Void.
- `progression.js`: streamed annual time skips through `advanceYearsSteps`.
- Core integration in `index.js` is owned and tested separately. Both sync offline simulation and asynchronous catchup consume the same redshift iterator. User time-jump actions use `actAsync` for responsive annual processing.

## Offline sequence

Queue ETA is rounded upward to complete 400-day intervals, with a one-day minimum before rounding. Each economy segment processes resource rates, buildings, workshop engineers, village, space and religion. Only after those steps are remembered resource ceilings restored. Heat transfer and any furnace-driven years run before the queue receives one opportunity to complete a unit. An uncomputable queue head causes the whole remaining duration to be processed without a queue attempt.

Calendar batching happens once after all economy segments. Season, day, weather, calendar tick and active-game tick counters remain unchanged; year increases by floor(total elapsed days/400), subject to the millennial challenge's year500 ceiling. Furnace shatters can independently move the calendar first. Festival duration, ordinary envoy discovery and elder-visit countdown do not get active-day replay in this path.

Ordinary resource batches use cached gross output less household upkeep. Converter inputs and ambassador upkeep are excluded from that cache. Negative honey is skipped, and village bulk does not run starvation. Resources with no per-tick calculation flag are excluded. Temporary over-cap stock is available to automation before ceilings are restored. Existing over-cap stock sets its own preservation ceiling.

The workshop snapshot updates resource-dependent storage before engineering. Steam automation aggregates its allowed attempts from a local input balance, caps each attempt at the normal input capacity, orders plate/slab/beam crafting, and jams even when its extra automation switch is off. Pollution uses the constant-emission exponential solution, or a linear solution without dissipation. Offline GFLOPS generation remains disabled under the inspected default web profile; entanglers consume only the stock already available.

Calendar event counts are rounded statistical totals. Automatic observation uses its actual probability, without the active event timeout's inclusive one-percent floor. Meteor science intentionally excludes the academy meteor factor applied to mineral and iron rewards in this bulk path. The ivory batch shares one yield sample. Millennium paragon is exactly one per crossed boundary; the default path does not use the alternate grouped-year dark-paracosm bonus. Antimatter uses whole elapsed years and the cached energy condition. Void uses statistical paradox share. Crypto uses its independently implemented bounded log-return distribution approximation and one final correction.

A batch beginning on a negative paradox day retains that day. Ordinary resource batching explicitly allows paradox gains, but per-tick ambassador spending, pact stock deductions and beacon relic gains retain their respective negative-day gates. Village growth continues; job learning does not. The zero-rate and preserved-final-alicorn robustness exceptions are documented in `18-religion-redshift.md`.

## Crystal and heat time jumps

`advanceYearsSteps(ctx, count)` yields one completed annual boundary at a time as `{completedYears,totalYears}`. `advanceYears` uses the core's `runYearJump` when supplied, retaining the synchronous fallback for existing API consumers.

The first interval uses only remaining days and the pre-jump cached production snapshot. Calendar season/day reset to spring/day0, while the existing day tick is preserved. Subsequent annual intervals refresh the production snapshot, so cycles, paragon, year-dependent effects and depleted stock affect the following year. Routes advance by the appropriate interval days.

Every retrieval interval remembers ceilings, applies eligible net rates, runs chrono-engineer production when researched, restores ceilings and advances pollution for retrieval-scaled ticks. Void resonance independently invokes Order of the Void for the full skipped ticks. Annual rewards, elder opportunities, industrial unjamming/AI and alicornmancy are processed for each skipped year. The build queue is attempted once after the complete jump. The source of this final queue attempt is time.js:180–188 and 735–736.

The existing piecewise crystal-cost calculation was retained. Finite/saveable-range checks throw through the core's checkpoint rollback rather than committing a partial jump. Large actions should use the async API; the sync API deliberately retains its existing synchronous contract.

## Durable checks

`tests/redshift.test.mjs` has 25 independently calculated fixtures, including:

- Cross-season offline freezing, whole-year flooring, millennium boundaries and capped challenge years
- Cached converter output without fuel subtraction, delayed ceilings, no offline hunger, no new computing
- One queue completion per yearly segment, blocked-head behavior and no early compounding
- Ambassador whole-period funding, housing-limited growth and bulk skills
- Exponential pollution, capped steam attempts and disabled-but-jammed automation
- Statistical celestial, meteor and paradox rewards
- Partial first shatter year, cycle transitions, year999 and year39999/40000, engineering, void resonance, annual AI and final queue processing
- Offline furnace transfer, synchronous/asynchronous equivalence, import replay, operation locks and overflow rollback

`tests/religion-redshift.test.mjs` has 13 numeric fixtures plus a 2,880-combination safety/termination sweep. All 23 pre-existing progression tests also passed after integration at this checkpoint.

## Verification limits

These tests validate explicitly enumerated default-profile behavior. They are not exhaustive equivalence testing of every challenge combination, extreme imported state, optional feature flag, random sequence or every source cache-invalidation quirk. The game intentionally uses its own seeded random stream; identical upstream RNG histories are not promised. The crypto distribution is statistically aligned, rather than bit-identical to a different random implementation.

Core async wrappers yield between batch/annual steps with a 10ms target budget. An individual production snapshot or very large population pass remains indivisible, so pathological maximum-size imported populations can exceed that target within a single step. This is a responsiveness limitation, not a claim of strict real-time scheduling. Browser lifecycle, close/reopen and end-to-end save/export checks are owned by the separate QA pass.
