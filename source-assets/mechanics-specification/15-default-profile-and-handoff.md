# Default profile and remaining verification

## Default source profile

Verified in`game.js:2407–2442`:
- Main web and mobile: village map OFF. Beta web: village map ON. The13biomes and combat/map subsystem are therefore not required to match default mainline.
- SPACE_EXPL OFF everywhere. Artificial gravity and its two follow-up workshop upgrades are unreachable by the default tree; navigationRelay and spaceShuttle are unfinished source placeholders. Do not invent effects and call them faithful.
- MAUSOLEUM_PACTS, QUEUE, QUEUE_REDSHIFT, UNICORN_TEARS_CHALLENGE and DARK_PARACOSM ON everywhere. These are ordinary default scope.
- Offline redshift OFF by default on web(`js/settings.js:121–126`), always enabled mobile(`js/time.js:234`). The verified cap is10game-years normally and40atyear≥1000orpositiveparagon. A custom8-hour cap or always-on web reward would be a disclosed product choice, not parity.
- Retiredbreweryresearch is disconnected. Its separate brewery building is active throughdrama.
- Unobtainium axe/saw have source declarations but no normal unlock reference found. Mark these legacy/unreachable rather than guess a gate.
- Senator state is declared/reset but no functional appointment path was found. Do not treat it as a missing playable senate.

## Numeric specification coverage at handoff

This is coverage of independently authored factual records, NOT implementation or test coverage.

- Core clock, food, caps, population, skills, happiness, prices, key storage/conversion/energy/pollution rules: detailed verified formulas and fixtures.
- Base buildings:40/40 factual identities, costs and essential effects; all5alternate stages. Dynamic caveats explicitly attached.
- Research:61/62 records including default-offartificialGravity; retiredbreweryexcluded. Main research dependency graph covered, selected cross-system unlocks require reconciliation.
- Crafts:23/23 ingredient quantities and automation tiers/difficulties. Engine throughput and special modifiers are partially specified.
- Workshop:143/143 identities, costs, gate summaries and essential effects. Dynamic boolean effects do not certify implemented behavior;2legacy/no-unlock and2default-off records are flagged.
- Special workshop:8/8 default-mainline records.
- Faith:11/11 ordinary religion and11/11 transcendence records,10/10mythic structures, main transformations and corruption,6ordinary pacts plus debt/fracture,10celestial cycles.
- Space:13/13missions,12/12routes,24/24construction identities(22default-functional,2disabledplaceholders), with dynamic formulas/flags.
- Trade:8/8partners' first-tier goods and discovery, fees, randomness, baseline embassy formulas; advanced goods not fully transcribed.
- Challenges:10/10 identities catalogued; detailed shared state, energy/pacifism/UT/PA/reserve handoff plus other challenge essentials. Exceptional combinations not comprehensively tested.
- All60resources,64policies,40prestige perks,31achievements and21badges have identity+source-location catalogue coverage. This task did not provide detailed numeric records for all of these categories; other assigned workers own policies/prestige implementation.

## Explicit remaining factual / parity gaps

1. All advanced embassy goods and their season/range/chance/minimum-level values; complete ambassador shortage/upkeep/skills interactions; policy-specific trade formulas; anti-undo trade behavior and blackcoin market mode. Baseline8partners are not full diplomacy parity.
2. Detailed64policy facts are delegated separately. Their effects, mutually exclusive prerequisites, one-shot policy actions and cross-system interactions must be reconciled with this specification.
3. Final complete reset survival matrix for all60resources, all prestige perks, used cryochambers, challenges, faith and time upgrades is delegated to the late-game worker. This task specifies core reset/reserve rules only.
4. All31achievement and21badge predicates, including star achievements, checks that invalidate achievements midrun and novelty/secret conditions. Their existence catalogue is not their gameplay implementation.
5. Craft automation exact specialist progress, rank deficits, partial ingredient shortfalls, factory slot limits; steamworks factoryAutomation threshold/jamming, input-size rules and undo; queue processing/queue unlock categories/queue capacity/paused queues and redshift ordering.
6. Detailed special-upgrade preparation/tribal-stock loop, resource persistence/visibility/tags, random bear generation distribution and challenge-specific hunter/worker edge cases.
7. Every challenge combination. UT ziggurat capacity and post-completion tomb faith-cap interactions deserve targeted tests. Black-sky repeated satellite penalty aggregation, anarchy laziness/overflow selection, pacifism repeat discounts, Iron-Will variants and Post-Apocalypse preserved-bear handling are easy divergence points.
8. Exact active-vs-offline behavior for season boundaries, cached effects, depletion/death cooldowns, event rounding, storage overcap and temporal paradoxes. Exact-tick independent simulation deliberately differs from the reference's bulk redshift approximation unless equivalence is established.
9. Fine-grained power shortage update ordering, conversion boost classification, library/bio ratios based on active vs constructed units, AI apocalypse/currency behavior and post-reset storage overflow need oracle checks.
10. Beta-only village map and default-off space exploration are deliberately outside default-mainline parity. Do not silently merge beta systems into a claim about the default game.

## Suggested acceptance gates

Maintain separate columns for fact verified, implemented, unit tested, reference compared and browser tested. A button/record appearing in the UI proves only discoverability. Test representative early survival, a complete ordinary research path to space, time-crystal and relic reachability, at least one reset with storage/faith retention, one challenge completion, all five building stage replacements, and save round-trips at each stage. Use a seeded independent RNG; compare distributions/statistical expectations for random systems rather than expecting identical source-RNG sequences.

Original-code boundary remains mandatory: source may be used for observation of functional facts, not copied into runtime or assets. This directory contains newly authored specification records and source coordinates; no reference implementation is included.
