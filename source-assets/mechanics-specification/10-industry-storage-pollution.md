# Industry, storage and environmental rules

## Storage contributions

VERIFIED`js/resources.js:896–919`;`js/workshop.js:2833–2860`;`js/buildings.js:600–641`.

Barn/warehouse/harbor capacity additions share modifiers, despite the upgrade names. Wood/minerals/iron additions multiply(1+barnRatio)×(1+warehouseRatio). Coal/titanium/gold additions multiply1+warehouseRatio. Honey additions are unchanged unless silos is researched, then multiply1+.25barnRatio. This helper does not multiply starting storage. Warehouse's honey addition is0normally,750after silos. Harbor cargo enhancement multiplies each harbor capacity first:1+limitedDR(.01ships,2.25+reactor-based cap bonus); ordinary reactor-vessel bonus adds.05per active reactor to that limit.

Compendia add min(floor(10×compendia),buildingScienceCapacity)to science capacity in normal play. Building capacity includes its manager's base contribution; space-transfer, Iron Will, codex/transcendence and data-center compendia effects alter this ceiling. Manuscripts add(√(1+800floor(manuscripts))−1)/2culture capacity, then manuscript-culture effects. Tankers addfloor(500×tankers)oil capacity.

A library's base science capacity250 is multiplied by1+activeObservatories×libraryRatio. Titanium mirrors and later two reflectors each add.02libraryRatio. Data centers replace base250with750 and culture10with250, add1,000compendia-ceiling each, use2energy(1with cryocomputing), and receive biolab/AI uplink effects. Biolab base science cap1,500; observatory1,000or1,500with astrolabe, then×(1+observatoryRatio).

## Industry conversions and multipliers

VERIFIED`js/buildings.js:1071–1277,1281–1320,1390–1435,1459–1502,1558–1629`;`game.js:3724–3788`.

Smelter normal inputs.05wood+.1minerals/tick, output.02iron×(1+smelterRatio). Coal-furnace output.005coal×same ratio; gold-ore output.001gold, nuclear output.0015titanium are separate and do not receive smelterRatio in their base calculation. Input shortage proportionally throttles output; don't consume a full cost for a partial conversion.

Calciner inputs1.5minerals+.024oil/tick, output.15iron×(1+calcinerRatio), .0005titanium×(1+3calcinerRatio). Steel automation takes a fraction of newly produced iron, consuming the same coal quantity, to make that quantity/100steel, with automation-specific craft and reactor bonuses. It is separately toggleable and cannot create steel from no inputs.

Steamworks has an enabled-system coal multiplier.2 before coal-penalty improvements; this is applied once, not.2^count. Each active unit gives1power and boosts magnetos by.15. Printing press yields.0005manuscripts per active steamworks per tick; offset and photolithography multiply4each. Automation jamming/reset is additional behavior.

Magnetos consume.05oil/tick each, produce5power, and add.02magnetoRatio each. Magneto production multiplier is1+totalMagnetoRatio×(1+.15activeSteamworks). It excludes honey; oil misses this ordinary multiplier. Reactors add.05productionRatio each and10power, use.001uranium/tick and add250uranium capacity; their production multiplier excludes honey and uranium. These two production multipliers act multiplicatively in the production pipeline, not as one additive sum. Resource classes marked transient have exclusions.

Oil well output.02×(1+oilWellRatio). Pumpjack+.45ratio and optional1power consumption; disabled pumpjack automation removes just that .45bonus. Refinery+.35ratio persists. Base factory gives.05craft ratio,2power demand,2pollution/tick. Factory-logistics replaces.05with.06. Carbon sequestration automation doubles power demand, sets gross pollution0and adds−2pollution/tick; researched-but-disabled mode gross pollution1. Biolab biofuel consumes1honey/tick for.02oil,1power before modifiers; its stored science/ratio contribution has special active-vs-built semantics.

## Energy shortage

VERIFIED`js/resources.js:826–840,1098–1110`;`js/buildings.js:157–184`;`js/space.js:983–994`.

Total power supply multiplies by1+energyProductionRatio. Demand multiplies by(1+energyConsumptionRatio+energyConsumptionIncrease), doubled while energy challenge active. If demand>supply, computeD=max(.25,supply/demand); after completed energy challenge outside the challenge, D becomes(1+D)/2. ApplyD to magnetoRatio and reactor productionRatio contributions and spaceRatio contributions, not all ordinary production indiscriminately. No demand means the helper returns0but it is not invoked to penalize production when no deficit exists. Annual antimatter is produced only if supply≥demand.

## Pollution

VERIFIED`js/buildings.js:2721–2786,2915–2946,3017–3023`.

Normal per-tick net pollution is grossEmission×(1−.5cleanFraction)×(1+emissionRatio)+explicitCleanup−P×1e−7. HerecleanFraction=clean/(clean+polluting), or0when no such energy. Clean energy counts solar, hydro, half reactor energy, and solar satellites; polluting counts magneto and steamworks. P cannot fall below0. Post-apocalypse disables natural dissipation.

DefineL=max(0,floor(log10(P/1e6)))for positiveP, else0; natural logs below areln. Honey pollution ratio is clamped no lower than−.75. Normal effects by level:
- L=0: honey ratio0ifP<5e6, otherwise−.2(P−5e6)/5e6; no happiness/arrival/faith changes.
- L=1: honey ratio−.2−(P−1e7)×.05/1e8; happiness0below5e7, otherwise−3.2e−7(P−5e7)percentage points; no arrival or solar-revolution change.
- L=2: honey ratio limitedDR(−.5−.1ln(P),10)/10; happiness−1.08ln(P)points; arrival divisor0below5e8, otherwise1+1.68e−8(P−5e8); no solar-revolution change.
- L=3: same honey formula; happiness−1.18ln(P); arrival divisor1.11log10(P); solar effect unchanged.
- L≥4: same honey formula; happiness−1.2ln(P); arrival divisor1.2log10(P); reduce the solar-revolution bonus to wood and honey bymin(1e−10(P−1e10)/9,1).

Arrival divides by its combined slowdown only if greater than1. Pollution can affect outcomes even when its UI-display setting is hidden; the source'sdisablePollution option only hides display.

Fixtures: P=0andone mine gives+.08pollution/tick. P=800000 withone mine gives0net without clean-energy changes. AtP=5e6honey penalty0; atP=1e7honey−.2. At power supply5,demand20,D=.25; one reactor's nominal+.05bonus becomes+.0125. This does not mean all production is quartered.

## Converter/power ordering addendum

`game.js:3733–3790` distinguishes automated output classes. Smelter/calciner/acceleratorAutoProd output enters after full paragon and receives only1+.05×paragonProductionBonus, then applicable magneto/reactor/solar multipliers. Mint/biolabProd output enters after those multipliers and does not receive them. Later policy/cycle effects still apply where prescribed. The class distinction is functional and must survive independent implementation.

Reactors disable all active units when current uranium plus one unit's uranium consumption is≤0. Magnetos turn off one active unit per tick when current oil≤.05. These are source per-unit checks, not proportional power throttles by full fleet demand. Full active-count power remains until toggled (`js/buildings.js:1411–1416,1620–1636`).
