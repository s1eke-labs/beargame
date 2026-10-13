# Earned normal-action progression campaign

This is an opt-in deterministic engine QA campaign. It starts from `createGame({storage:null, now:1, seed:17})`, then uses only public `act`, `simulate`, `tick`, export and validated import APIs. No resource seeding, unlock flags, state edits, developer multiplier or runtime monkey-patch advances the game.

## Run

From the checkout root:

```sh
node qa/campaign/replay.mjs --checkout .
```

The checkout defaults to the current directory when it contains `src/engine/index.js`, otherwise to two directories above this runner. `--checkout /path/to/beargame` overrides it. A targeted stage can be reproduced from its documented, earned parent checkpoint:

```sh
node qa/campaign/replay.mjs --checkout . --stage first-time-shatter
```

The full run is deliberately separate from fast unit tests. It prints one compact result per stage. Every replayed public operation must succeed; rejected planner probes that did not advance state are kept outside the compact success-path journals. Assertions check population, deaths, calendar, researched technologies, purchased space facilities, reset counters and finite nonnegative resources. Exported state must exactly match the recorded checkpoint, not merely resemble it. SHA-256 checks protect checkpoint integrity. Gzipped journals retain the exact method, argument list and original call number. At each lineage-stage boundary, the runner exports and reimports the state actually produced by the preceding stage; it does not substitute the expected checkpoint in a full lineage replay. The independently labeled prestige branch starts from its previously verified earned parent. The challenge-ready intermediate checkpoint is checked at its exact journal call.

## Proven scope

The fourteen-stage lineage covers blank opening, production/storage/crafting, research through chronophysics, ordinary trade, faith and praise, steamworks manuscript automation, industrial research, a first orbital launch, unicorn/alicorn rituals, earned time crystals, one successful year shatter, lunar mining, metaphysics, and winter-challenge start/exit. A separate first-prestige branch imports the survival-tested time checkpoint and performs an ordinary confirmed reset. The default run executes all fourteen lineage stages plus this one-action branch: 51,106 successful public calls. Challenge completion is not claimed.

## Important limitations

- Most waiting uses the documented compressed offline API. The recorded calls ordinarily advance up to 8,000 real seconds each; two explicit 32,000-second settlements use the documented larger limit available after year 1,000. This compresses a very long, intentionally unoptimized in-game campaign. It is not a pacing or speedrun benchmark.
- Offline settlement intentionally ignores negative honey balance and rounds some events. Earlier planner checkpoints were food-deficient. The original faith/trade/electricity checkpoints starved during separate 800-second active audits. Those earlier zero-death offline statistics do **not** demonstrate continuous active survival.
- The `repair-active-survival` stage fixes jobs and builds aqueducts/pastures using legitimately earned stock, then performs sixteen `tick(50)` calls. Later space and time stages also perform full 800-second active-year checks. These repaired checks retain all bears with no deaths. The saved earlier checkpoints are included only to preserve truthful reproducible lineage.
- The initial caravan does not arrive during the compressed offline-only opening; one ordinary active day discovers it after its year threshold. This is documented here as an offline/live behavior difference, not as a fixed issue or a player softlock.
- A sky palace's first alicorn event is rounded to zero in an 8,000-second offline batch. A permitted 32,000-second batch establishes the first alicorn, enabling passive production. Sacrificing the entire herd can require establishing it again.
- At the very late campaign year, shattering one year costs more than one crystal. The successful action pays its current dynamic cost. An earlier failed fuel attempt is excluded from this success-path journal and preserved in the research work directory.
- This is not all-content coverage: no claim is made about every research, faith upgrade, space destination, time upgrade or challenge completion. Browser interaction is covered separately.

The deterministic time option fixes only the save timestamp and seasonal-gift date; elapsed production is obtained exclusively through the recorded public time APIs.

## Review checkpoints

- `first-time-shatter.save.json`: 94 bears, chronophysics and a successful shatter, after a full active-year survival check. This is the stable late-game browser fixture.
- `challenge-ready.save.json`: earned lunar mining/metaphysics and adjustmentBureau, immediately before challenge entry.
- `challenge-start-and-exit.save.json`: the fresh post-exit state; two resets, no active selected challenge.
- `first-prestige.save.json`: independent ordinary first-reset result from the stable time checkpoint.

The original raw journals, adaptive planner iterations, deliberately rejected probes, and active-starvation diagnostics remain in the research work directory. The compact bundle contains only the reproducible advancement lineage and clearly labeled branch.
