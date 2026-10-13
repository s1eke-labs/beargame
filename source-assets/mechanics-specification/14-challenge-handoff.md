# Challenge handoff: verified facts and remaining work

This document records the source pass completed before the specification task ended. It is not a claim of complete implementation. Source: fixed commit stated in00-scope-and-provenance.md.

## Shared state and concurrent selection

`js/challenges.js:507–717`; `game.js:5745–5756`. Every challenge tracks unlocked, pending, active and completion count independently. Multiple pending challenges become active together on reset. All nonpending challenges become inactive. Completing an active challenge sets completed/researched, increments its count once, turns it inactive and recalculates effects. Ordinary active completion is checked during updates; atheism and pacifism are evaluated on reset. Iron Will follows its separate housing/reset rules. Default unlocked identities are Iron Will, winter, anarchy; the challenge tab itself is unlocked by adjustmentBureau, not by chronophysics. The reserve panel visibility has a separate chronophysics condition.

Most challenge effects multiply by prior completion count; noStack exceptions use their direct value. Apply designated limited-DR/caps afterward. Therefore many first-run repeat penalties are zero even though their effect declarations are nonzero.

## Energy

`js/challenges.js:116–153`; `js/resources.js:835–840,1098–1110`. Unlocked by the centaurus mission. Active demand multiplier is2×(1+.1n), n previous completions. Completion requires owning each of: solar-stage pasture; hydro-stage aqueduct; steamworks; magneto; reactor; satellite plus solarSatellites; sunlifter; tectonic; hrHarvester. Each building count must be positive; listed checks use built count. Reward outside the challenge is limitedDR(−.02n,1) demand-ratio adjustment, plus halving energy-shortage penalties once completed. No single-power-total completion shortcut.

## Pacifism

`js/challenges.js:261–331`; `js/science.js:1300–1336,2430–2443`; `js/village.js:1049,5488`.

Unlock by sending at least1,000hunting squads in one action. Active challenge hides/disallows hunting action; weapon job bonuses receive−.1n effectiveness capped at−1. Policy prices multiply1.25^n; embassy fake countn; steamworks fake count followsfloor(1.5n), with first-run zero after count aggregation. First steamworks blueprint ingredient is replaced by5n+1. Completion occurs on reset only ifouterSpaceTreaty is researched. Treaty is unlocked through satellite research/building and requires a built satellite, costs10,000culture before challenge policy scaling, blocksmilitarizeSpace; militarization is unavailable in pacifism.

Outside the challenge: alicornPerTickRatio+.1per completion; tradeKnowledge=n. LetL=(7+3n)(.99+.01n) andR=limitedDR(.099+.0075n,.25). Extra trade ratio istradepostPerUnitTradeRatio×min(L,tradepostCount×R). The completion does not give a generic fixed trade bonus. No-hunter/traded-this-run badge logic is separate from completion. Reserve reclaim cannot occur while any challenge remains active.

## Winter, anarchy, atheism, millennial and black sky

- Winter: all seasons use winter food behavior; completion whenhelios reached. Outside reward per completion+.05spring-food and+.05summer-solar effects, each limited at2. Active cold chance+.05n and harshness−.02n, limits.825and1. Source`js/challenges.js:50–85`.
- Anarchy: no leaders/promotions/skill learning or skill production bonuses; active laziness=.5+limitedDR(.05n,.25), noStack. Complete on first AI core. Reward+.2nmaster-skill multiplier limited at4; karma reset calculation uses doubled eligible population after completion. Source`js/challenges.js:87–115`.
- Atheism: no priests/normal faith production paths. Active modifiers per prior completion: culture cap−250, science cap−500, manpower cap−125, happiness−.5points. Complete on reset with active cryochamber OR stasis pod. Reward solar-revolution boost+.1nlimited at4 plus tier-based solar cap. Source`js/challenges.js:154–190`; associated temple effects must also be applied.
- 1000Years: unlocked by shattering; completion is checked after shattering when calendar year≥1000 (`js/time.js:727–729`). Active per-completion shatter-cost increase+.5 and void cost+.4. Outside reward shatter-cost reduction−.02nlimited at1, heat efficiency+.1ncapped3, heat compression+.05n, temporal-press retention10n. Source`js/challenges.js:191–230`.
- Black sky: unlocked after elders arrive; no ordinary astronomical events. Complete withspaceBeacon built count>prior completions. Active satellite penalty declaration.1n itself then aggregated by completion count (verify squared behavior in the engine); suppressed in Iron Will. First orbital launch omits charts and multiplies other costs11; first calciner omits titanium and multiplies other costs11. Reward corruption+.1nlimited at2 and one effective bonus black pyramid outside active challenge. Source`js/challenges.js:231–260`;`js/buildings.js:2629–2637`;`js/space.js:1307`.

## Unicorn Tears: prices and capacities

`js/challenges.js:333–462`;`js/buildings.js:2681–2718`;`js/science.js:2255–2278`;`js/workshop.js:2973–3020`;`js/resources.js:930–935`.

Unlock when elder energy reaches25. Complete on owning at least1necrocorn. Base resource caps while active: unicorns10, tears1, alicorn.2. These caps bypass paragon/cosmic/global-storage bonuses; only resource-specificMaxRatio applies. Each evaporated overflow tear adds3pollution. A specialalicornStable upgrade unlocks at15alicorns and adds.2alicorn capacity while active.

Building extra-price growthQ=limitedDR(1.2+.03n,2.5). First copy has no extra cost. Subsequent warehouse-stage0 adds2×owned unicorns; harbor adds2×owned tears, each with building-level price discount. Other buildings compute weight from their first ingredient prices (before resource discounts), multiplyQ^(owned−1), then add: weight≥100to≤100000 → weight/100unicorns; weight>100000to≤1e9 → weight/100000tears; weight>1e9 → ln(weight)−19.7232alicorns. Building-level discount scales this additional cost. If weight<100, none.

Weight coefficients: honey0; wood.5; minerals.35; iron1; titanium200; uranium150000; unobtainium1e6; antimatter1e10; starchart200; spice250; beam/slab.75; plate5; concrete25; gear20; alloy300; eludium1e8; ship1500; tanker150000; kerosene7000; parchment2; compendium20; blueprint50; thorium180000. Unlisted resources10. Existingunicorn/alicorn/tears/megalith inputs suppress extra prices (negative-infinite weight; zero×infinity and indeterminate totals handled safely).

Science extra multiplierS=limitedDR(.25n,75). Manuscript ingredient addsS×its amount unicorns; compendium ingredient addsS×its amount tears; blueprint ingredient addsmax(1,limitedDR(S,10))alicorns independent of blueprint quantity. No extras whenS=0.

Workshop multiplierM=limitedDR(.01n,1). For positive weightW<1e6 addceil(W^(2/3)M)unicorns; for1e6≤W<1e8 addceil((W−990000)M/1000)tears; forW≥1e8 addceil((log10(W)−7)×100000M)tears. No extras atM=0. Scientist discount applies to science afterward, not to challenge prices.

Special cap increments: unicorn pasture+50unicorns; tomb+1tear; tower+20tears; citadel+2000unicorns/+5tears; palace+50unicorns/+275tears/+.2alicorn; utopia+5500unicorns/+1800tears/+.6alicorn; sunspire+10%unicorn cap/+10000tears/+1alicorn; selection upgrade+50%unicorn cap. Ziggurat special caps, faith combos and post-completion tomb faith-cap reward require remaining verification. Reward ivory-price growth adjustment−.003nlimited at.075; apply only ivory ingredient growth, with ratio floor1.

## Post Apocalypse

`js/challenges.js:463–500`;`game.js:5711–5721`;`js/buildings.js:2725–2738,2648–2660`.

Unlocked by holyGenocide. Initial pollution=1e11+1e8×(prior completions+carried bears). Carried bears get1,000honey each×(1+karma/100). Natural pollution dissipation is disabled. Arrival slowdown effect10per completion combines additively with pollution. Housing acquires fake purchased countmax(pollutionLevel−8,0). At pollution level≥5, hives beyond thresholdmax(95−usedCryochambers−level,7+(8ifIronWill))add15×hiveRatio^max(owned+usedCryochambers−100,0)unobtainium to cost. Completion requires pollution exactly0; restores normal1e−7dissipation and removes housing fake counts, unlocks two special policies. Cryochamber support reward is1per completion. Polluted trade fees multiply by1+pollutionLevel.

## Challenge reserves

`js/challenges.js:690–835,978–992`. Before applying pending challenges, resolve reset-completion checks, calculate reserves, then set chronospheres to0 so their resources do not enter the new challenge directly. Cryochambers are also set0except non-Iron-Will Post Apocalypse; that mode directly carries preserved bears instead of placing them in reserve.

Resource reserve ratio is currentresStasisRatio only with a built chronosphere. Skip time crystals and resources markedpersists=false. Skip nonwood crafted resources withoutfluxCondensator. Normal nonpersistent resources and wood retainquantity×ratio; void is floored. Crafted stock with condenser retains100×ratio×sqrt(quantity). Persisting resources follow ordinary reset persistence rather than duplicated reserve stock. Across repeated reserve deposits each resource storesmax(existing,new), not the sum.

Bears: select the highest-experience number equal to active cryochambers, remove job/leader/specialty assignments, append to reserve bear list; reserve chamber count accumulates. Reclaim is allowed only with no active challenge and no Iron Will. Uncapped reserve resources add to current quantity; capped resources set tomax(current,reserved), which can exceed cap. Skip any time crystals. Reserved bears append; reserved chamber count becomes used cryochambers. Clear all reserves, and mark run as having used chronospheres. Delayed reserves are not automatically awarded when one of several active challenges completes.
