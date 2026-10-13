# Bears, crafting and repeated runs

## Individual skills and leadership

VERIFIED: `js/village.js:1292–1320,3273–3338,3680–3755`.

A working bear earns .01 skill experience per tick plus the additive skill-XP effect (.0005 per academy). Its active job's skill is capped at20,001; total experience is a separate spendable pool. An idle bear does not learn/forget. An engineer without a specialty does not learn its current skill. Without neural networks, each positive inactive job skill decays .001/tick, also reducing total XP. With neural networks, replace forgetting with .001×workers-in-that-job per tick for every unlocked occupied job. Internet sets base experience to max(.01,population/10000), subject to the advanced housing-scaling modifier. Anarchy disables job-skill bonuses and learning.

Skill output increments by skill interval: [0,100)0; [100,500).0125; [500,1200).025; [1200,2500).045; [2500,5000).075; [5000,9000).125; [9000,∞).1875. The highest band can receive a master multiplier, and every band receives the global skill multiplier. Example: forester at skill100, happiness1 gives .018225 wood/tick before other bonuses.

Promotion from rank r consumes500×1.75^r total experience and25×(r+1)gold. Multiple-rank promotion sums these costs. Promotion does not consume job skills. A leader's personal job multiplier is1 at rank0 and(r+1)/1.4 at positive rank. Autocracy doubles it. Register unlocks leadership/promotions; anarchy forbids them.

Leader-trait baseline effects (`js/village.js:234–280`): engineer+.05 crafting; metallurgist+.10 appropriate metal crafts; chemist+.075 relevant chemical crafts; merchant+.03 trade; manager+.5 hunter effectiveness; scientist5% science-cost reduction; wise10% faith/gold-religion-cost reduction. Burned paragon and monarchy modify these values; reductions are diminished and cannot simply be applied unbounded.

## Crafting and automation

VERIFIED: `js/workshop.js:2116–2349,2542–2573`; `game.js:4412–4450`.

Selected recipe facts are in02-selected-facts.json. Per click, ingredient amounts are fixed and normal output is1+craft bonus. Workshop bonus is.06 each; factories add.05 each before modifiers. Fractional crafted output accumulates. Initial recipe flags: wood, beam, slab, plate, gear, scaffold, manuscript, megalith. Locked recipes remain inaccessible even if the materials are owned. The workshop tab itself has its own prerequisite.

Wood is an exception: its output uses refinement-specific effects rather than the general craft ratio. The provisioned forest expedition initially costs100honey. Advanced refinement costs5,000honey+500science and halves this ingredient cost to50(`js/workshop.js:868–879`). Biolabs add.1 refinement output ratio each. Some policies and Iron Will further modify the action.

Blueprint CAD output depends on the number of science buildings. Kerosene manufacturing boosts apply differently than ordinary factory crafting. Resource-specific ratios and global-craft effects apply after the shared bonus. Engineers take600×ticksPerSecond×recipeDifficulty ticks per unit of progress before production/skill/rank modifiers. Exact specialty throughput, factory slot limits, rank penalties, partial-input behavior and offline automation are CATALOGUED at`js/workshop.js:2680–2880` and`js/village.js:690–738`, not fully validated here.

## Prestige

VERIFIED: `game.js:5471–5551,5867–5908`; `js/prestige.js:549–581`.

Let N be rounded prestige-eligible population (advanced simulation scaling may alter it). Normal reset adds max(N−70,0)paragon. Karma uses a cumulative hidden tally. Its increment is the sum of positive parts:
- N−35
- 3×(N−60)
- 4×(N−100)
- 5×(N−150)
- 10×(N−300)
- 15×(N−750)

Only terms above their thresholds contribute. With anarchy completion the karma calculation uses2N. Karma visible to the player is(√(1+8×totalTally/5)−1)/2. It contributes one percentage point of happiness per karma unit. Reset100 population from zero prior tally gives185 tally, karma8.1168439698, and30paragon. Reset70 gives65 tally and0paragon. Reset35 gives zero.

Define prestige scaling M=1+paragonRatio effects. Production bonus is limited-DR(.01×paragon×M,2M)+limited-DR(.01×burnedParagon×M,L×M), where L=1 normally and4 in the dark future. Storage bonus is M×[paragon/1000+burnedParagon/2000] normally; dark future changes the burned denominator to500. Example:100paragon and0burned grants+100% eligible production,+10% eligible storage.200paragon production is+175%, not200%, because its limit is2 and its free range is1.5.

Burning paragon moves all current paragon to burned paragon. A separate burned-paragon leadership scale uses unlimited-DR(burned,500). Metaphysics perks spend paragon and persist across resets. Chronospheres retain1.5% resources each, but ordinary crafted material retention has exceptions/upgrades; cryochambers preserve bears; faith/transcendence/challenge state and achievements have separate persistence rules. Exact reset survival matrix is CATALOGUED in`game.js:5558–5855`; do not equate reset with clearing everything except paragon.

## Offline policy

VERIFIED:`js/time.js:191–259`. Redshift uses rounded elapsed milliseconds/2000 as days, skips offsets under3days, and caps elapsed days at10years(8,000seconds). At current year≥1000 or positive paragon the cap is40years(32,000seconds). Desktop has an enable setting; mobile enables it. The source advances several subsystems in bulk and enforces storage afterward. Exact active-tick replay is a defensible new implementation choice, but must be explicitly marked as an offline behavioral difference until compared across starvation, seasonal, conversion and random-event cases.
