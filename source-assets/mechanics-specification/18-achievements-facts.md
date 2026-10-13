# Milestones and badges: independently recorded factual predicates

Reference checkout: 781e379f79f1e7512d168849cba21ed111502644. Inspected 2026-10-08. This file is private implementation provenance, outside the distributed game source. No source implementation, translated expressive description or artwork was reused. The runtime's milestone identifiers, grouping, descriptions, event ledger and functional implementation are newly authored. Source identifiers below are provenance references only.

## Common behavior

- The source checks its achievement manager every 50 ticks (game.js:2626), equivalent to 10 seconds at normal 5 Hz. Ordinary observation checks should not scan the population every game tick. Event-specific records are earned at their actual action hook.
- The manager separately tests base and star predicates. A star need not imply base earned: 100 completions of one challenge earns the repeat-completion star without the five-distinct-challenges base (achievements.js:486–501).
- Acquired base flags, star flags and badges persist across normal resets. Hard reset clears them (achievements.js:515–543; game.js:5625–5644, 5828).
- No removal or annulment of earned records was found. Later deaths, lost resources, removed buildings or loss of Iron Will do not retract past awards. These may prevent earning an as-yet-unearned record.
- Death count is current-run, reset to zero (game.js:5642); totalYears/totalResets are lifetime. Current-run successful trades and the irreversible hunter-assignment flag matter for a reset badge. Imported old saves missing these new Beargame fields use conservative evidence: zero provable current-run trades, hunter history unknown/treated as present, unknown current-run death history when lifetime deaths are nonzero. They are not retroactively credited with events. Unknown prior deaths block the zero-death milestone; only newly observed deaths count toward departure thresholds until a reset establishes a known fresh run.
- UI hides all unearned names and descriptions. The historical achievement is omitted until earned. Four special/negative achievements are excluded from ordinary progress totals. The obsolete pollution badge is always omitted from badge progress and UI. Result: 31 catalogued achievements, 26 ordinary visible total initially, 7 ordinary stars, 21 catalogued badges, 20 visible badge total.
- Achievements grant no ordinary production or storage bonuses. One explicit event badge grants 3 void once; see below.
- Source every-check 10% chance replaces the timeslip badge's title with a glyph joke (achievements.js:504–511). This non-mechanical source expression is intentionally not reproduced; no gameplay RNG is consumed for it.

## Achievement identity and condition matrix

Columns: original Beargame identity | private source identity | factual predicate. Base source positions are achievements.js:6–273.

| Beargame identity | Source identity | Fact |
|---|---|---|
| winterArchive | theElderLegacy | Real local date is January 2017; hidden until earned |
| forestGuest | unicornConspiracy | unicorns > 0 |
| dewKeepsake | uniception | tears > 0 |
| wingedGuest | sinsOfEmpire | alicorn > 0 |
| crystalMemory | anachronox | timeCrystal > 0 |
| nightGuest | deadSpace | necrocorn > 0 |
| hundredStones | sadnessAbyss | sorrow >= 100 |
| loneQuarry | ironWill | Iron Will, population == 0, mine owned > 0 |
| loneStore | uberkatzhen | Iron Will, population == 0, warehouse owned > 0 |
| loneSteam | hundredYearsSolitude | Iron Will, population == 0, steamworks owned > 0 |
| loneMeadow | soilUptuned | Iron Will, population == 0, pasture owned >= 45; no stage check |
| lonePower | atlasUnmeowed | Iron Will, population == 0, magneto owned > 0 |
| loneFactory | meowMeowRevolution | Iron Will, population == 0, factory owned > 0 |
| loneMoon | spaceOddity | Iron Will + moon mission launched; star additionally paragon < 10 |
| earlyOrbit | jupiterAscending | orbital launch completed and calendar year <= 1; star additionally started without chronospheres or active cryochambers |
| watchfulForest | veryLargeArray | observatory active count >= 100, SETI unresearched |
| oneBedTemple | shadowOfTheColossus | ziggurat owned > 0 and village raw floored housing == 1 |
| brightWishes | sunGod | stored cumulative worship >= 696342 |
| stripedCompany | heartOfDarkness | zebras > 1 |
| tenEmptyBeds | winterIsComing | current-run deaths >= 10; excluded from ordinary totals |
| hundredEmptyBeds | youMonster | current-run deaths >= 100; star >= 666666; excluded from ordinary totals |
| racingPaws | superUnethicalClimax | Actual manual gather controller detects 2500 clicks without a 2500ms inactivity gap outside Iron Will; excluded from ordinary totals |
| stubbornCore | systemShock | Actual AI core sale refusal: AI level >= 15, no transkittenism; excluded from ordinary totals |
| rememberedKindness | lotusMachine | karma >= 1 |
| safeHaven | serenity | population >= 50 and current-run deaths == 0; star population >= 1000 and no deaths |
| joyfulGrove | utopiaProject | population > 35 and happiness >= 1.5; star happiness >= 5 with same population condition |
| outermostTrail | deathStranding | furthestRing planet reached, not merely mission purchased |
| fortyMillennia | cathammer | lifetime totalYears >= 40000; star trueYear >= 40000 |
| longCelebration | eternalBacchanalia | remaining festival days >= 100*100*4 = 40000; commented-out star is inactive |
| manyJourneys | challenger | at least five distinct completed challenges; star total repeat completions >= 100 |
| clearTomorrow | betterSafeThanSorry | Actual carbonSequestration purchase with pollution == 0, or inherited obsolete badge; star only actual same clean purchase after a start without chronospheres/cryo |

Additional event provenance:
- gather detection: buildings.js:3218–3228. Inactivity timer, not a fixed-window frequency estimate.
- refused core sale: buildings.js:2177–2185.
- carbon purchase: workshop.js:3035–3042. Merely importing an already researched technology at zero pollution does not establish the event.
- trueYear: calendar.js:408–410: calendar.year + (season*100+day)/400 - time.flux. The day may be negative.
- housing: game.js:4514 floors raw housing for village.maxKittens. village.js:393–400 rounds that floored housing multiplied by 1+limitedDR(maxKittensRatio,1) for simulation capacity. game.js:4537–4538 exposes simulated count and this capacity as the displayed population resource. The one-bed achievement uses the raw floored value; unhoused/overcrowding use simulation capacity.

## Badge identity and condition matrix

Source base positions: achievements.js:276–434. Actual event hooks override misleading or playful descriptions; no translated source jokes are used.

| Beargame identity | Source identity | Fact |
|---|---|---|
| fiftyReturns | lotus | lifetime totalResets >= 50, not strictly greater than 50 |
| loneNightReturn | ivoryTower | completion of atheism on reset while Iron Will; completion needs active cryochamber or stasis pod |
| easygoingLeader | useless | actual appointed leader trait == none |
| previewTrail | beta | actual current browser URL contains case-sensitive substring beta |
| quietNotice | silentHill | connected announcement service's content is exactly empty string; missing service is not empty content |
| woodSpecialist | evergreen | successfully assign an engineer specialty to wood, not manual craft completion |
| unhousedThousand | deadSpace | population >= 1000 and simulation housing capacity == 0 |
| moonlessHerd | reginaNoctis | population >= 500 and alicorn == 0 |
| caughtSpark | ghostInTheMachine | active error-reporting service's error callback invoked; no random award for ordinary console noise |
| betweenDays | abOwo | ordinary confirmed reset with calendar.day < 0; no atheism predicate in the actual hook |
| gentleExchange | cleanPaws | reset with pacifism active, baseManpowerCost > 0, current-run successful trades > 0, no hunter ever assigned this run; challenge need not complete |
| duneDetour | sequenceBreak | dune reached and moon not reached |
| colorfulLeader | fantasticFurColor | appointed leader's true color is nonzero |
| untieTime | whatYearIsIt | manual shatter at negative day, actual amount >= 500; +3 void once; every qualifying event randomizes actual leader color |
| clockBeforeRocket | tardis | manual shatter while orbitalLaunch owned == 0 |
| overflowingReturn | wheredThisComeFrom | reset with resStasisRatio > 1; at 0.015 per chronosphere, first integer qualifying count is 67 |
| fiveBorrowedYears | lostDates | current-run time flux <= -5 |
| elderBanquet | buffet | elder energy >= 1000 |
| farawayHomes | newHome | terraforming housing > raw total housing - terraforming housing, and population <= simulation housing capacity |
| oldClearSky | betterSafeThanSorry | deprecated, no acquisition hook, fully hidden; persist loaded flags for migration |
| fortyTwoWings | soLongAndThanksForAllTheHay | abs(alicorn - 42) < 1e-12, strict inequality |

Event and probability facts:
- Wood specialization village.js:3598–3603.
- Atheism completion challenges.js:180–185. Pacifism reset check challenges.js:303–316; hunter assignment permanently marks run history village.js:373–375. Source legacy missing hunter history defaults true (village.js:910).
- Black Sky + Iron Will and no goldOre can make base manpower trade cost zero when manpower stock == 0 (diplomacy.js:607–628). Subsequent discounts do not affect this badge's base-cost test.
- Ordinary negative-day reset game.js:5411–5416. Automatic challenge restart does not execute that ordinary reset callback.
- Resource retention badge game.js:5618–5622; source start flag game.js:5640–5642 depends on positive retention or active cryochambers, not the number of surviving villagers.
- Shatter time badges time.js:1388–1406. Furnace-generated time skips do not call this manual shatter controller.
- Error-report badge game.js:199–220 depends on an installed telemetry provider and telemetry not being disabled. Beargame has no provider and reports the record as unavailable; there is no fabricated telemetry service or fabricated error.
- New visitor color chance: village.js:1500 uses floor(U*100) <= 10, exactly 11 of 100 outcomes, despite a comment saying 10%. If colored, choose one of six colors uniformly. Conditional variety uses the same 11/100 boundary and selects one of four variants. Appearance is cosmetic, not a production bonus.
- Forced leader recolor game.js:6407–6431 uses color threshold 100 (always), variety threshold 0 (one of 100 outcomes); only the resulting color is applied by time.js:1402. Tests verify integer boundaries and all six colors.

## Scope limits disclosed rather than fabricated

The 2017 dated milestone cannot newly occur at the current real date. The deprecated hidden badge has no new acquisition path. The beta badge needs the real browser URL; no beta deployment is asserted. Announcement and error-report badges remain unavailable without verified connected service observations. Optional environment injection is an internal adapter/test seam, not a user-facing unlock command. No experimental map predicate is present in these 52 records.

The game independently authors all player-facing Chinese wording and identifiers. It omits the source's random title glyph gag, original difficulty-letter decoration, and reference branding. No numeric gameplay reward is omitted or invented by that cosmetic choice.

Additional verified housing edge: terraforming policy adds +0.1 to the same housing-ratio effect as hydroponics (science.js:2021, space.js:755/790). Per-station housing is 1 + unlimitedDR(hydroponics,100) + policy ratio, not (1+hydroponics bonus)*(1+policy ratio). The badge checks this independent contribution against raw total housing.
