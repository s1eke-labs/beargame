# Independent QA scope

These checks evaluate the independently implemented Beargame. The private reference checkout is not executed or included in delivery. The numeric reference is fixed at 781e379f79f1e7512d168849cba21ed111502644; the factual specification is maintained separately.

## Required checks

- Empty new-game quantities and exact base storage; first prices, geometric batches, discounts, storage multiplication.
- Tick/day/season conversion, hive weather/season factors, worker production, happiness and worker-only extra food consumption, arrivals and starvation.
- Action prerequisites, craft ratios, research/upgrade effects, exchange probabilities and resource conservation; detect unavailable/decorative late-game systems.
- Safe atomic actions under insufficient resources and invalid counts; finite values under unusual elapsed time and malformed import.
- Export/import round-trip, version validation, save corruption preservation, storage failures, offline progression bounds, duplicate catch-up, same-tab and cross-tab conflicts.
- Real UI dispatch wiring, reset/challenge/import confirmations, tab routing, and mobile/desktop visual layout if supported browser access is actually available.
- Static file hashes and source-window duplicate checks, asset origin audit, original copy and correct license acknowledgment.

## Reporting standard

A present card is not a working system. A passing independent engine fixture is not proof of total equivalence to the reference. Report exercised, unexercised, approximate and absent systems separately. Browser-denied or unavailable cases are not passing cases. Do not bypass browser/socket access restrictions.
