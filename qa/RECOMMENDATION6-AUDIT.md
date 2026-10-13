# Long-flow and mobile reliability audit

Date: 2026-10-10. This report covers the actual engine, actual application handlers in a controlled DOM, and cloud Node CPU measurements. It does **not** claim real iPhone/iOS Safari, touch hardware, browser rendering speed, or battery-life testing. Browser QA belongs to the separate visual review.

## Verified and corrected issue

A persisted page restore could award one absence twice. The reproducible handler sequence was hidden visibility → pagehide → 60-second absence → pageshow(persisted) and completed catch-up → visible visibility event. With 20 hives and 10 honey, this gave 1,135 honey after restore, then 2,260 after the visibility event. The page retained a stale `hiddenAt` interval.

The parent implementation clears that stale interval before claiming/reloading on persisted pageshow. Both event orders now pass against the real app handlers. The fixture covers a plausible interrupted sequence; it does not establish which event order a particular Safari version emits.

## Automated reliability coverage

Run:

```sh
node --test qa/mobile-save-regressions.test.mjs qa/mobile-reload-regressions.test.mjs qa/mobile-lifecycle-audit.test.mjs
```

Result: 21 tests passed, including eight new lifecycle checks:

- Ordinary hidden return and repeated visibility notification settle once
- Both persisted pageshow/visibility orderings settle once
- Paused and offline-disabled returns preserve resources
- Returning stale pages cannot overwrite another active owner
- Reduced-motion preference persists through reload without changing progression
- Hidden pages stop active simulation and set the animation suppression class

Existing regression coverage also protects read/write failures, quota errors, failed ownership, interrupted asynchronous catch-up, delayed cross-tab events, imports, and export size limits. The DOM harness verifies JavaScript effects and rendered strings, not real CSS animation, focus, layout, viewport safe areas, disk durability, OS process termination, or file-picker behavior.

## Earned campaign replay

```sh
node qa/campaign/replay.mjs --checkout .
```

Result: all 15 stages, all 51,106 public API operations, and all expected checkpoint saves passed exactly. The lineage still reaches first space, chronophysics, time shatter, lunar supplies and challenge entry/exit; the independent branch verifies first prestige. Challenge completion and every late-game system are not covered.

## Long-term pacing findings

Reproduce journal analysis:

```sh
node qa/audit-campaign-pacing.mjs
```

The 14-stage lineage (excluding the separate one-action prestige branch) contains 51,105 calls, including 30,074 offline-settlement calls (58.8%). The most repeated action calls are 7,441 shark trades, 5,480 hunts, and 4,262 parchment crafts. The time-crystal stage contains 186 waits and one action. Industrial/rocketry progression alone contains 8,847 waits and 4,137 shark trades.

The lineage requests 157,936,534 offline seconds, around 1,828 days, before runtime rounding/caps. This is an intentionally unoptimized planner using compressed simulation. It is **not** wall-clock test duration, credited simulation time, necessary player time, required UI taps, or a fair measure of normal human pacing. Existing detail dialogs already expose maximum-quantity actions; planner calls do not measure how well players discover or use these.

Concrete conclusion: the recorded campaign proves reachability and state correctness, but cannot establish satisfying long-term pacing. The concentration of waiting, hunting/parchment production and shark trading identifies useful routes for a future fresh-player pacing session. No economy, cost, unlock, timing, offline or progression rule was changed by this audit.

Prior campaign caveats remain material: some earlier offline checkpoints starve in separate active-play tests; repaired later milestones survive full active years. Offline food treatment and rounded rare events differ from active play. Do not describe all earlier zero-death offline checkpoints as stable active-play saves.

## CPU baseline

`recommendation6-node-performance.json` records a fresh run of `node qa/benchmark-long-game.mjs`: 30 timed samples after five warm-ups, synthetic all-research saves with 0/100/1,000 bears. At 1,000 bears, p95 was approximately 15.1 ms for a full snapshot, 0.54 ms for village HTML-string generation, and 1.76 ms for one active tick. The roster remains capped at 50 leadership cards and village markup is about 54.7k characters.

These figures are diagnostic cloud Node observations, not regression thresholds or claims about phone frame rates. They exclude DOM insertion, layout, paint, compositing, real mobile CPU/thermal constraints, home-scene animations and battery use. Snapshot construction remains the dominant measured CPU operation. No fixed timing assertion was added, avoiding hardware-dependent flaky tests.
