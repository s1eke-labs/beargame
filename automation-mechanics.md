# Build queue and engineering mechanics

These modules are independently authored implementations of functional and numeric facts verified against reference commit 781e379f. No source functions, text, art or data tables were copied. Names and Chinese explanation are original.

## Ordered queue

- Queue and offline queue support belong to the default profile.
- Capacity: floor((3 + construction's 1 + workshop queue-cap effects + active AI cores + hash level) × (1 + queue-cap ratio)). Technocracy gives a ratio of 0.2, not two fixed places. The five engineer upgrades add 1, 2, 2, 3 and 3 places. Hash level is nonnegative floor(log(hashrates / 1000) / log(1.6)).
- Every unit in grouped entries uses a slot. Adjacent copies of the same repeatable item are combined. Single-use categories enqueue one at a time. Orders may be moved, reduced, removed or explicitly cleared.
- Enqueueing reserves and spends nothing. The first entry is evaluated at its current price and gates. One unit is processed per normal simulation tick. Insufficient resources, storage or temporary gates keep the head in place, without spending. Completed, incompatible policy or invalid entries are skipped. Current building stage prices are used, rather than stale queued prices.
- Queue categories: buildings initially; research and policies after a library; regular upgrades after a workshop; worship after a temple outside atheism; ancient religion after a ziggurat; striped upgrades after a striped workshop; missions after rocketry; space buildings after a satellite or reached planet; transcendence after cryptotheology; chronoforge after its upgrade; void structures after void-space research or used cryochambers.
- Embassy queues additionally require writing, a known embassy-capable partner, and either ambassadors or big-stick policy. Treaties unlocks the dynamically cheapest partner. Embassy culture costs scale by 1.15 per level, with embassy-cost reduction and fake-bought effects applied.
- No automatic sacrifices, reset, market trades, or challenge activation can be enqueued.
- Source unlocks, current order and remaining counts are saved. New runs clear the queue.
- ETA combines base net production with average engineer ingredient consumption and output, rounds crafted resources to whole engineer cycles, and rejects impossible storage or nonpositive production. The offline backend owns segment timing and invokes the same purchase path; the queue never bypasses affordability.

Source coordinates: time.js 2032–2750, science.js 122 and 1077, workshop.js 1353–1417; category unlock calls in buildings.js, science.js, diplomacy.js, space.js and workshop.js. Embassy costs: diplomacy.js 1582–1588.

## Specialist engineers

- Mechanization opens the engineering job. Each built factory provides one engineer slot, including disabled factories. Removing factories enforces the lower slot limit, releasing idle engineers first. Each specialist is an actual existing engineer bear; assignment cannot create or double-count population.
- For each assigned worker, nominal crafts per tick are:
  (1 + recipe automation bonus) × (1 − 0.15 × missing ranks) × (1 + effective skill bonus) × happiness factor × leader multiplier × engineering tier factor × holy population factor × neural-network factor / (3000 × recipe difficulty).
- Happiness and leadership apply to positive worker contributions only. Negative tier-seven novice contributions keep their sign without these multipliers.
- A matched-rank, unskilled, ordinarily happy engineer takes 600 seconds per difficulty point before bonuses. Rank above the recipe tier gives no extra speed. Existing skill thresholds, skill and master-skill effects, leadership and happiness are shared with other jobs. Anarchy removes skill bonuses. Neural networks doubles engineer speed.
- The tier factor is tier-specific research effects plus UniversalKnowHow; it falls back to 1 only when the sum is exactly zero. Therefore a 0.1 universal bonus by itself is 0.1, not 1.1. Antimatter fission adds 0.25 only to the eludium specialist's automation factor.
- Progress is per recipe and retained when assignments change. Ordinary progress is in [0,1); the source also permits a negative intermediate value for a severely under-ranked specialist. Before a whole craft is ready, proportional ingredients must be present for progress to advance, but they are not spent. At completion, the affordable portion determines whole crafts. All ingredients for each whole craft are deducted together; normal crafting bonuses determine output.
- Input storage too small for a recipe prevents completion, except where above-cap retained stock already covers the price. Dependency recipes' storage constraints also count. Output is clipped to its capacity as in the reference; capped products can consume ingredients. The UI exposes this warning.
- Empty-specialty engineers do not gain their active job's experience. Firing, death, reset or lost slots cannot leave a counted phantom specialist. Reset clears recipe progress; retained bears return without jobs or specialties.

Source coordinates: village.js 328–330, 468–471, 690–723, 3304, 3518–3666; workshop.js 2116–2349, 2633–2704 and 2710–2750, 2880–2915; religion.js 1558–1573.

## Boundary and interface notes

- Duplicate one-time entries are suppressed only when adjacent. A later duplicate separated by another entry remains queued, then is discarded without paying again if already completed.
- Tier-seven novice specialists preserve the reference negative intermediate speed. Nonpositive contributions skip happiness/leader boosts; each pass starts from max(previous progress, 0), so a negative result can be saved but does not accumulate indefinitely.
- Float comparisons include a tiny tolerance at whole-craft boundaries, so an exact 600-second unit does not wait an extra tick due to binary rounding.
- Supported completed actions have the separately implemented 20-second runtime undo slot. Queue removal before purchase remains a distinct action.
- The frontend uses explicit buttons and quantity controls rather than source desktop keyboard modifiers.

## Integration verification

`tests/automation.test.mjs` checks base rates, every multiplicative factor, specialist accounting, atomic ingredient consumption, partial stalls, input and output caps, job-cap reductions, queue capacity/ordering/grouping, current prices, source gates, strict save parsing, embassy escalation, Technocracy, actual mission purchases, and offline lock/equivalence behavior. Engine-owned redshift tests additionally define compressed offline scheduling behavior.
