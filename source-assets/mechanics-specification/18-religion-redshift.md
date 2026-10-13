# Religion redshift: numeric behavior and independent implementation

Reference inspected: Kittens Game commit `781e379f79f1e7512d168849cba21ed111502644`, `js/religion.js:343–635` and `2870–2970`. This document records functional facts rather than source code or expressive text. The implementation is independently authored in `beargame/src/engine/religion-redshift.js`; regression fixtures live in `beargame/tests/religion-redshift.test.mjs`.

## Two elapsed-time quantities

The incoming duration is a day count and a tick count, normally ten ticks per day. If the paradox chance is positive, estimate the fraction of time in paradox as:

`(10 + extra paradox days) / (10 + extra paradox days + 100 × max(1, 1 / paradox chance))`.

Remove the floor of that fraction times the incoming days from chargeable days. Keep the incoming tick count intact. Thus pact upkeep receives fewer days, while corruption and Order of the Void receive all ticks. This is a statistical bulk rule and does not replay the active calendar's negative days.

## Corruption and storage thresholds

The existing independently authored active-corruption factors also apply to the bulk path: base corruption effect, the Black Sky reward when that challenge is inactive, sorrow's square-root multiplier, and Feeding Frenzy's 0.9 multiplier. Above the storage threshold, multiply by `0.25 × (1 + corruption boost)`. The threshold is zero necrocorns normally and one with Feeding Frenzy; equality uses the faster rate.

Below the threshold, the number of new whole units needed to exceed it is `1 + floor(threshold − current stock)`. The transition tick is the ceiling of the missing corruption divided by the faster rate. A bulk interval includes fast-rate ticks through that transition and slow-rate ticks afterward.

Conversion exchanges whole alicorns for whole necrocorns while preserving a positive remainder in the input herd. The maximum exchange count is `ceil(alicorns) − 1`. Unspent corruption is limited to one after an exchange attempt. Consequently a herd of two leaves one; a herd of 2.3 leaves 0.3. An already empty herd does not clear previously stored corruption in the reference bulk path.

## Pact settlement and threshold rechecks

Each pact normally costs 0.0005 necrocorns per chargeable day; Upfront Payment changes that to 0.00045. For an ordinary bulk interval, corruption and conversion precede settlement. The settlement function is shared with the independently authored daily model, with interval upkeep equal to daily upkeep times interval days.

With positive debt, the requested stock payment is multiplied by `1 + 0.15 × (1 + recovery / 2)`. When stock cannot cover that request, ordinary upkeep is deducted instead and any shortage of ordinary upkeep increases debt. When stock can cover the request, debt falls by `ordinary upkeep × 0.15 × (1 + recovery)`, bounded below by zero. Stock deductions are also bounded below by zero. The two recovery factors intentionally differ.

Continuous consumption may move stock from above the corruption threshold to below it. Bulk processing therefore rechecks after the estimated day when consumption would reach the threshold; when already below it, it rechecks after the first day containing the next upward crossing. Production within each such interval is still aggregated, so this is not an exact active-tick replay.

Siphoning leaves stored necrocorns untouched by upkeep. Instead, upkeep increases debt; generated whole units then repay the whole-number portion of that debt before any excess enters storage. Its projected crossing must therefore include whole debt accumulated by the candidate crossing tick. Fast and slow portions settle their allocated chargeable days before their respective conversion. The fast portion receives the floor of its proportional day allocation; the remainder belongs to the slow portion. The reference's debt-dominated projection guard is retained.

Religion bulk itself does not invoke pact fracture. That remains a separate active progression behavior.

## Order of the Void

With the required perk, accumulated worship is increased by full elapsed ticks times faith production per tick times `0.1 × (1 + void resonance) × (1 + apocrypha bonus / 4)`. The exported `accumulateVoidOrder` helper supports the time-shatter integration separately. Its default production lookup ignores the current paradox state; callers control whether a shatter interval qualifies.

## Independently calculated regression values

Unless noted, examples use 10 days, 100 ticks, 100 alicorns, zero necrocorns, zero corruption, zero debt, no modifiers, and corruption 0.1 per tick.

- Ordinary upward threshold crossing ends at 97 alicorns, 3 necrocorns, and 0.25 corruption.
- Starting with one necrocorn ends at 98 alicorns, 3 necrocorns, and 0.5 corruption.
- Feeding Frenzy ends at 97 alicorns, 3 necrocorns, and 0.8025 corruption.
- Starting with two alicorns ends at one alicorn, one necrocorn, and one corruption.
- Starting with 2.3 alicorns ends at 0.3 alicorns, two necrocorns, and one corruption.
- An empty herd, initial corruption 0.7, debt 2, and one pact preserves corruption and ends at debt 2.005.
- At 100 days and corruption 0.001 per tick, one pact with Siphoning and debt 1.2 ends at 99 alicorns, no necrocorns, no corruption, and debt 0.25.
- At 100 days, no herd, three necrocorns, debt 2, one pact and no recovery bonus, stock ends at 2.9425 and debt at 1.9925.
- At 110 days with paradox chance one, an empty herd and one pact incur debt 0.05. Order of the Void with faith production two still accumulates 220 worship.
- At corruption 0.02 per tick, initial necrocorns 0.15 and 200 pacts, consumption crosses below the threshold and production later crosses back. The result is 99 alicorns, 0.125 necrocorns, 0.175 corruption and no debt.
- With one pact, Siphoning and initial debt 1.2, the default duration ends at 96 alicorns, three necrocorns, zero corruption and debt 0.205.

The test suite also sweeps 2,880 combinations of herd, stock, pact count, corruption rate, debt and both relevant policies over 16,000 days. This checks numerical safety and termination, not equivalence to every upstream state.

## Explicit robustness differences

Two narrow exceptional cases are intentionally safer than the inspected bulk implementation:

1. Zero corruption rate with Siphoning accrues upkeep without producing undefined numerical values. The regression starts at debt 1.2 with one pact and finishes ten days later at debt 1.205, with all stocks unchanged.
2. A final preserved alicorn with a full corruption unit can place an estimated crossing at the current instant, preventing the reference loop from consuming remaining days. The independent implementation finishes the remaining upkeep after exhausting ticks. Starting with one alicorn, 0.15 necrocorns, 200 pacts and corruption 0.02 per tick ends ten days later with one alicorn, no necrocorns, corruption one and debt 0.85.

These cases are not claimed as literal reproduction of the reference's invalid-number or nontermination behavior. No reference executable code, interface copy, descriptions or artwork are included in this implementation or audit.
