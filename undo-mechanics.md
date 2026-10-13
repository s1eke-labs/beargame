> Historical design record. Retired in v6.5.1: player-facing undo is disabled, no receipts or countdowns are retained, and committed actions cannot be reversed through this API. Transaction-error rollback remains a separate safety mechanism. The sections below describe the former behavior, not current gameplay.

# Reversible action mechanics

This module is independently authored. The reference checkout was inspected to
establish gameplay facts; no reference implementation, comments, interface
wording, or art is included in the shipped game. Evidence below identifies the
reference implementation at commit `781e379f` (the full revision is recorded in
the accompanying mechanics provenance).

## Timing and lifetime

- `game.js:637–643, 6162–6169`: one pending undo operation; each new reversible
  success replaces it. The deadline is 20 times the scheduler tick frequency:
  100 ticks at the default 5 Hz.
- `game.js:5318–5334`: the deadline advances before the paused early return.
  Accelerated simulation does not make extra scheduler calls and therefore does
  not shorten the undo window. Fractional elapsed timer time is carried locally.
- `game.js:6172–6197`: a read-only game cannot execute undo; attempting a valid
  pending operation consumes the slot, including a failure to return its goods.
- `game.js:2823` and the save/load routines: the slot is runtime-only. Import,
  reload and reset cannot recreate it. Merely saving does not remove it.
- Beargame's explicit offline batch clears the pending slot at settlement start.
  The offline and asynchronous time-jump mutation locks also disable undo.

## Which actions can be reversed

| Beargame action | Evidence | Reversal |
| --- | --- | --- |
| Building purchase | `js/buildings.js:3148–3173, 3352–3370` | Remove purchased quantity; refund eligible materials at the current full reverse price |
| Building sale | `js/buildings.js:3174–3198, 3372–3383` | Restore quantity; repay the ordinary half-price refund |
| Worship-upgrade sale | `js/religion.js:1941–1942, 1972–1985, 1797–1814` | Restore sold ranks and repay the half-price refund; ordinary sale leaves at least one rank |
| Planet-facility sale | `js/space.js:1262–1278, 1440–1455` | Restore sold facilities and repay the half-price refund; ordinary sale may reach zero |
| Building stage change | `js/buildings.js:3198–3206, 3542–3587` | Restore previous stage, restore removed buildings, repay their half-price refund |
| Manual craft / wood refine | `js/workshop.js:2660–2694, 2767–2788`; `js/buildings.js:3003–3015, 3252–3278` | Remove actual output received; refund the inputs recorded when crafting |
| Successful trade | `js/diplomacy.js:756–782, 978–991` | Return all raw trade yields; refund recorded costs; add anti-reroll debt |
| Embassy purchase | `js/diplomacy.js:746–755, 1630–1651` | Remove purchased levels and refund full culture price |
| Praise / adore | `js/religion.js:1600–1615, 1626–1647, 1752–1771` | Undo the recorded faith accounting, subject to still having the generated currency |
| Religious resource conversion | `js/religion.js:1718–1751, 2223–2233, 2328–2337` | Return actual generated resource; refund recorded input |
| Worship and mythic purchases | `js/religion.js:1772–1796, 1905–1918, 1959–1972` | Remove quantity; full eligible material refund |
| Pact purchase | `js/religion.js:1815–1845, 2543–2552` | Remove quantity and incurred debt; disallowed after fracture |
| Time upgrades / winter chamber repair | `js/time.js:1032–1072, 1662–1675, 1742–1755, 1799–1819` | Remove added quantity, restore used chamber count for a repair, refund eligible costs |
| Planet facility purchase | `js/space.js:1247–1261, 1427–1440` | Remove quantity and refund eligible materials |

Science, workshop research, policies (including the feeding policies),
metaphysics, transcendence purchases, space missions, hunts, observation,
exploration, prestige/reset, time travel, and other unsupported operations are
not turned into reversible transactions. They do not replace an existing slot
unless the operation replaces the entire game state. Automatic crafting does
not register a manual craft receipt. A queued supported purchase uses the same
purchase hooks as its manual equivalent.

## Resources, caps and anti-exploit behavior

- Building reversal uses 100%, ordinary dismantling uses 50%. Current pricing is
  recomputed at the quantity being reversed, with current discounts and stage.
  Craft reversal instead uses the inputs actually consumed and output actually
  received at the original ratio; later leader/recipe changes cannot change it.
- `core.js:796–810, 884–902, 1949–1984` and `js/resources.js:116–118,
  77–83, 471–476, 520–527`: oil, kerosene and thorium are non-refundable for
  facility purchases/sales. Antimatter is refundable only with sufficient power.
  Craft/conversion/trade input refunds do not use these facility exclusions.
- Refunds go through the normal event resource add behavior. They respect caps;
  existing over-cap stores are not destroyed, but a refund cannot increase an
  already over-cap store. Production earned after purchase remains earned.
- Trade records the raw merchandise quantities (`diplomacy.js:988`), whereas
  crafting records capped actual output. Thus an overflowing trade may be
  impossible to reverse, or may require previously held goods. This is an
  intentional reference behavior, not a substitution of cap-adjusted yields.
- Every resource to be returned is checked before changing any resource. Failed
  craft/trade undo cannot refund inputs or consume only some outputs. Repeated
  undo cannot repeat a refund. Counts and stages are validated too.
- `diplomacy.js:780–781, 721–727, 434–435, 831–850, 869–978`: undoing a trade adds
  one protected future attempt per undone attempt. Protected hostile trades
  fail, friendly bonuses below certainty are suppressed, and optional goods
  below certainty are suppressed. Guaranteed goods still receive their ordinary
  random quantity variation. Protection's 45-day countdown clears on the next
  daily check after reaching zero; load/reset clears it. RNG is never rewound.
- Unlocks, achievements, statistics, calendar, bear arrivals, job experience and
  background production are not transaction fields and are never restored from
  an old state snapshot. Praise refunds preserve faith produced in the meantime.
  Adore follows the source's specific old-worship restoration after checking
  the gained epiphany remains; it is not a general game-state rewind.

## Deliberate safeguards

The reference's ground-building, worship, planet-facility and stage-sale undo can restore facilities even if the refunded
resources have since been spent, because its resource deduction clamps at zero.
Beargame instead checks all required repayment resources atomically and refuses
that reversal. This prevents free facilities, as required for the safe undo
feature. A tiny relative floating-point tolerance allows mathematically equal
cost-cycle balances to reverse without permitting a meaningful free return.

## Verification

`tests/undo.test.mjs` covers full/half refunds, replacement, ordinary failures,
production/RNG/stat preservation, paused and accelerated expiry, fractional
clock calls, capped craft output, consumed output, changed recipes, sales,
stages, worship/planet sales, repeated cycles, saving/loading/reset, time repair, faith conversion,
locks, trade atomicity/debt, and unsupported action categories. UI and broader
engine tests cover shared dispatch and cross-tab ownership.
