# Faith, sky travel and time

## Faith pools and actions

VERIFIED `js/religion.js:1535–1703`. Keep spendable faith F, accumulated worship W, epiphany E and transcendence tier T as separate quantities. Original Chinese display suggestions: 信仰、颂愿、灵悟、升华阶位.

- Praise: W gains F×(1+A), where A=.05×(√(1+80E)−1). Leave F at.0001.
- Adore: E gains W/1,000,000×(T+1)^2×B and W becomes.01. T counts as zero unless the transcendence upgrade is owned. Normal manual B=1.01 (`js/religion.js:3157`); passive reset path uses B=1.
- Solar revolution requires its purchased upgrade. Raw production bonus is(√(1+.008W)−1)/200. Apply limited diminishing returns with limit10+additionalLimit+(T if atheism completed), then multiply by1+faithSolarRevolutionBoost. This is a bonus, so production multiplier is1+bonus.
- Transcend price total at tier T: C(T)=.05×(e^T/10)×(e^T/10+1). Next price C(T+1)−C(T). Transcendence upgrade required; E must be strictly greater than price. Deduct next price and increment T once. It does not clear all epiphany.
- Religion upgrades become visible at a W threshold but are paid using spendable faith and usually gold. Repeated purchases use2.5 price growth when transcendence makes them stackable; several remain single purchases.
- Sacrifice2,500灵鹿(unicorns) for one灵露(tears) per active叠石祭坛(ziggurat). Requires the faith tab and an active altar.
- Sky creatures, corruption, dark-creature upkeep/debt, relic refining, black structures, pacts, and post-apocalypse population scaling are separate systems; they are not represented by a generic faith multiplier.

Fixtures: Praise100faith with E=0 gives+100W and F=.0001. E=.1 gives A=.1, so praise100 gives+110W. Adore1,000,000W at T=0/B=1 gives+1E; at T=2 gives+9E. Solar revolution at W=1,000 gives.01 bonus; at W=1,000,000 givesapproximately.44224 bonus before special effects. Transcend tier0→1 costs.01178593719 epiphany (verify numeric tolerance via C formula).

## Space architecture

VERIFIED `js/space.js:23–209,211–435`. Rocketry unlocks the space tab, not all missions. Each mission has a cost, prerequisites and a destination; destination discovery/reach status and route travel time are separate. Space buildings require reached planets and sometimes additional research. They use independent geometric price growth. Space production has a dedicated multiplier path: do not multiply every output by village happiness or normal paragon production.

All13mission costs and edges plus selected reachable-space construction facts are in06-late-selected-facts.json. The full24-space-building checklist is in09-feature-catalogue. All12planet entries, their route times, cyclic celestial effects, orbital production/power/capacities and travel speed must be considered. Listing a destination does not prove gameplay to it is implemented.

Critical reachability sequence: astronomy→starcharts→navigation→ships/trade→titanium→industrial science/storage→rocketry→orbitalLaunch→moonMission→moonOutpost→unobtainium→spaceElevator/advanced storage→deep-space missions. Chronophysics also needs time crystals from the mythic-faith progression; relabeling a moon button is not a substitute for that chain.

## Time systems (partial verified contract)

`js/time.js:315–652`: temporal batteries start at5timeCrystals, grow1.25 per purchase, add750temporal-flux capacity. Base flux cap3,000ticks(10minutes). Blast furnace starts25timeCrystals+5relics, growth1.25, heat-transfer.02/tick, heat capacity100 before upgrades. Furnace automation uses100heat per crystal shatter and respects controlled delay. Other chronoforge and void-space units are catalogued with exact locations; costs/effects are not yet fully specified here.

Time acceleration and crystal shattering are distinct actions. One alters simulation speed at temporal-flux cost; the other advances years and adds heat, with resource-retrieval, dark-future and challenge adjustments. Using a fixed amount of ordinary seconds for shatter without those rules is an approximation. Cryochambers and used chambers affect reset persistence and repair. Temporal paradoxes generate void and modify calendar progression. These need their own mechanics and tests.

## Feature-flag caveats

Artificial gravity exists as research but its predecessor edge is added only with SPACE_EXPL (`js/science.js:2169–2178`). Mausoleum/pacts and dark paracosm also have source feature flags. Explicitly choose the reference configuration being emulated; otherwise no single universal completeness claim is meaningful.

## Corruption and mythic chain

VERIFIED`js/religion.js:182–188,218–303,362–394`. With any alicorn stock, each marker supplies.000001corruption progress/tick (before its challenge modifier). If necrocorns exceed the existence threshold, multiply by.25×(1+corruptionBoostRatio). Threshold is0 normally,1with feeding-frenzy policy. Then multiply by1+√(sorrow×blsCorruptionRatio) and1+necrocornCorruptionInterference. When progress reaches1, one alicorn becomes one necrocorn, but the reference preserves a positive remainder of alicorns: maximum convertible isceil(alicornStock)−1. If conversion cannot proceed, progress is capped at1. Siphoning directs new necrocorns to outstanding pact debt before stock accumulation.

10mythic structure factual costs/effects and transforms now appear in06-late-selected-facts.json. Their default initial unlock is onlyunicornTomb, then tower→citadel→palace→utopia→spire. Marker/graveyard/pyramid dynamic gates remain labelledunverified until read. Palette and divine-creature names are original suggestions, not copied artwork or text.
