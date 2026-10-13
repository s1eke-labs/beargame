# Core rule contract (VERIFIED unless explicitly marked)

## Clock and seasons

Reference: `game.js:2289`, `js/calendar.js:7–42,217–218,427–444,1167–1203`.

The normal simulation runs at 5 ticks per second. A game day is 10 ticks (2 real seconds), a season is 100 days (200 real seconds), and a year is four seasons (800 real seconds). Season order is spring, summer, autumn, winter. For honey-producing buildings the four base multipliers are 1.5, 1, 1, 0.25. Warm weather adds 0.15 and cold weather subtracts 0.15 from the season multiplier. The beekeeper job's output is added after this weather adjustment and is not itself season-adjusted. Challenge/policy exceptions exist and are separately catalogued.

Persist a fractional day/tick remainder, exact quantities, and arrival progress. Offline time must traverse season boundaries, storage bounds, starvation, job changes, and unlock conditions; multiplying one current net rate by all elapsed time is not equivalent. Exact reference offline compression and event treatment remain UNVERIFIED.

## Starting storage

Reference `js/buildings.js:2388–2407`.

Honey 5,000; wood 200; minerals 250; coal 60; iron 50; titanium 2; gold 10; oil 1,500; uranium 250; unobtainium 150; antimatter 100; workforce/manpower 100; science 250; culture 100; faith 100. Capacity is not initial quantity. Other resources are not automatically capped by this list. Ordinary production cannot push a capped resource past its current capacity; imported saves and special overflow cases need separate tests.

## Bears, arrival, consumption and morale

References `js/village.js:7–9,395–461,631–687,810–823,933–1016,3228–3251`; `game.js:3800–3813`.

- Initial population is zero and initial housing capacity zero. A hut adds two spaces.
- While space remains and the population is not starving, arrival progress grows by 0.01 each tick. At one unit of progress a bear arrives. Thus base immigration is one bear every 100 ticks/20 seconds. At full housing clear remaining progress; do not accumulate arrivals behind a full population cap.
- Growth effects multiply the .01 rate by (1 + growth bonus). An active festival multiplies it by (2 + extra festival-arrival bonus). Pollution/challenge slowdown divides the rate if its combined divisor exceeds one.
- Each bear consumes .85 honey per tick before demand modifiers. Happiness over 100% raises consumption of working bears: with N bears, W workers, morale H as a fraction, no special modifiers, demand magnitude is `.85 × [N + W × max(H−1,0)]`. Idle bears retain base consumption.
- Every bear also consumes .01 furs, .007 ivory, .001 spice per tick when applicable. These are luxury-resource sinks, not food substitutes.
- Base happiness in percentage points: `max(25, 100 − 2×max(N−5,0) + 10×L + 30×festivalActive + karma + otherEffects − 2×max(N−housing,0))`, where L is the number of possessed non-common luxury types. Population-unhappiness reductions modify the population penalty; uncommon-specific and general luxury modifiers exist. A present box and its wrapping paper do not double-count together.
- Only positive job production is multiplied by happiness. Building food production is not multiplied by happiness.
- If honey plus the predicted next net change is negative, arrival stops. The reference's death quantity is capped at one bear and depends on rounded shortfall, with a 25-tick death cooldown. A tiny negative shortfall below .5 is not immediately a death. Exact update ordering and cooldown decrement are important test targets.
- Advanced systems: individually tracked experience, skills, ranks, leaders, senators, job caps, engineering specialties, ambassadors, policies, and challenge exceptions are real requirements, not implied complete by this base aggregate model.

## Jobs: base output per bear per tick

Reference `js/village.js:15–203`.

Forester .018 wood; beekeeper 1 honey; scholar .035 science; hunter .06 manpower; miner .05 minerals; ritual keeper .0015 faith; geologist .015 coal. Engineer has crafting progress rather than a simple resource rate. Ambassador has trade effects and upkeep.

Geodesy adds .0075 coal and .0008 gold. Mining drill adds .010 coal and .0005 gold; the later unobtainium drill adds .015 coal and .0005 gold. Drills cannot produce gold until geodesy. Fully upgraded geologist base: .0475 coal and .0018 gold/tick. Astrophysicists give scholars an additional .0001 starchart/tick. Skills and leader/rank bonuses precede happiness.

## Production order

Reference `game.js:3666–3834`.

For early normal play: seasonal building-base production + job production with job upgrades, then multiply resource-wide production ratios, then subtract population/resource demand. For honey this is `[.125×hives×season + beekeepers×H×(1+beekeeperBonus)]×(1+.03×aqueducts) − honeyDemand`. Skills can further modify worker contribution.

Long-game order matters: space-base output joins building base before season; village output and job bonuses join afterward; global/resource/religion/super multipliers then paragon then pollution apply; automated building production enters at later points; magnetos/reactors/faith/cosmic background effects act on specified resource families; direct conversions and space autoproduction follow different paths; festival-cycle modifiers precede late fixed per-tick additions; policies and pact ratios precede consumption. These cannot all be collapsed into one generic multiplier without changing outcomes. Core normal-play formula is verified; every exceptional long-game interaction requires dedicated validation.

## Geometric prices and diminishing reductions

Reference `js/buildings.js:2589–2624`; `game.js:2726–2746`.

Without exceptional rules, an item bought n times costs base price × ratio^n for each ingredient. Retain fractional costs, including huts at 12.5 wood for purchase two. Batch cost for k additional copies is base×ratio^n×(ratio^k−1)/(ratio−1). Building- and resource-specific discounts both multiply this amount. Extra phantom purchase counts and challenge exceptions exist.

Limited diminishing reduction has full strength through 75% of its limit L. For magnitude x above .75L, the effective magnitude is `L − (.25L)^2/(x−.5L)`. Preserve the original sign. This is a mathematical rule, not a request to port the reference implementation. Example at L=1: input .75→.75; 1→.875; 1.5→.9375. A 100% raw reduction does not make costs zero.

## Core fixtures (normal play; all unmentioned bonuses zero)

1. One hive, no bears: honey/tick spring .1875; summer .125; autumn .125; winter .03125. Warm winter .05; cold winter .0125.
2. Ten hives, two bears, one beekeeper, H=1: spring +1.175 honey/tick; summer +.55; winter −.3875.
3. Ten hives, two bears, one beekeeper, H=1.1: spring +1.190 honey/tick. Gross 2.975, consumption 1.785.
4. Two foresters, H=1, no skills: .036 wood/tick = .18/second. One library gives a scholar .0385 science/tick.
5. Hive first three individual honey costs: 10, 11.2, 12.544. Total first ten: 175.487350695.
6. Two huts add four housing spaces and 150 manpower capacity. First two cost 17.5 wood total.
7. 6 bears, no luxuries: H=.98. 6 bears with one luxury: H=1.08. 100 bears without bonuses: floor .25.
8. Start .00 immigration progress, free housing, no starvation: .50 after 50 ticks; one arrival after 100 ticks (floating arithmetic tolerance required).
9. One barn adds 5,000 honey, 200 wood, 250 minerals, 60 coal, 50 iron, 2 titanium, 10 gold capacity. Total with base storage doubles those caps.
10. At .06 craft bonus, 175 wood becomes 1.06 beams. Honey provisioning remains 100 honey→1 wood until its separate refinement upgrade.
