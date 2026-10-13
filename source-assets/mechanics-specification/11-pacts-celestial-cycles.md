# Pacts and celestial-cycle contract

## Pacts: normal default-enabled feature

VERIFIED`js/religion.js:1388–1427,1488–1491,2448–2543,2573–3010`;`js/science.js:1147–1174,2055–2158`.

Pacts are enabled on all reference platforms. Available slots come from each mausoleum (normally1; radical-xenophobia policy adds1per mausoleum) plus5from that policy, minus purchased ordinary pact count. Fracture removes available slots. Six ordinary pact types each cost100relics per purchase, with price multiplier1(no escalating cost), require an available slot, and consume.0005necrocorn/day each. Upfront-payment policy changes upkeep to.00045/day, adds2necrocorns to each purchase, and prevents immediate debt. Without it, every purchased ordinary pact immediately adds.5debt. There is no automatic delay until stocks first run dry.

Per-pact effect bases, before pyramid/tier/debt multiplication:
- 净林之约(cleansing): storage+.0005; debt-recovery+.003.
- 重塑之约(destruction): production+.0005; debt-recovery−.0001.
- 静默之约(extermination): faith+.001.
- 澄明之约(purity): debt-recovery+.005; black-library boost+.0005; space contribution to compendia limit+.001.
- 秘艺之约(arcane): craft+.001; universal engineering-tier knowledge+.1.
- 星史之约(chronicler): annual resource ratio+.003; dark-harvester ratio+.1; time ratio+.1.

For black-pyramid-mediated effects, aggregate each pact effect across its count, multiply bymax(T−24,1), then debt factorQ, then effective black pyramid count. Black-library bonus also multiplies bygraveyardBaseBlackLibraryBonus(.02)×(1+graveyardCount). Debt-recovery is excluded from tier/debt scaling but still arises through the pyramid effect. The directly aggregatedumbraBoostRatio is distinct from pyramid scaling. Black-sky completion gives one effective extra pyramid outside its challenge. These distinctions avoid applying the same boost twice.

Debt factorQ is0if fractured or debt≥50;1if debt≤smallDebtExemption; otherwise1−(debt−exemption)/(50−exemption). Exemption0normally,5with siphoning. All applicable pact benefits weaken continuously with debt; no binary on/off simplification.

For a normal daily upkeep amountU>0and current debtD:
- No debt: spendU; any uncovered portion becomes debt.
- Debt and sufficient stock: spending amountU×[1+.15(1+R/2)], while debt decreasesU×.15(1+R), clamped at0. HereR is the aggregated deficit-recovery effect. These are intentionally different formula factors in the source.
- If stocks cannot afford the increased spending, addmax(U−stock,0)to debt and attempt only the baseUspend, clamped by resource handling.
- Siphoning replaces daily stock spending with+Udebt/day. Newly corrupted necrocorns repayfloor(debt)one unit each before entering stock; positive fractional debt remains.
- Pay-debt action costsceil(D)necrocorns, clearsD, consumes no pact slot, and does not create a lasting pact count. It is available only whenD>0.

AtD≥50daily fracture clears all bears' job skills, removes all alicorns, clears debt and all ordinary pact counts, and permanently marks fracture for the current run. It disables new slots and applies−.5global storage,−.5global production,−.5faith modifiers via its own effects. This is an irreversible gameplay-state consequence until reset, distinct from simply running out of a resource.

Three mutually exclusive policies all require a mausoleum and marker, and cost1necrocorn:
- 引流偿约(siphoning): exemption5; new necrocorn production services debt instead of fractional daily stock spending.
- 盛宴馈赠(feeding frenzy): corruption interference−.1; elder-feed bonusUDR(unspentSlots,50); raises owned-necrocorn slowdown threshold from0to1.
- 预付供养(upfront payment): additional2necrocorn purchase cost per future pact,10%lower daily upkeep; adopting it also requires/pays2×existingActivePacts plus policy cost. Existing debt remains. Karma happiness contribution receives max(Q,.1)multiplier.

Unused pact slots can produce karma tally every millennium. WithNeligible population>35andSfree slots>0, addresetKarmaTally(N)×UDR(.0001×max(1+.1(T−25),1)×S,100)per millennium. This uses the nonlinear karma tally rules before converting to visible karma.

Fixtures: one newly purchased ordinary pact from zero debt givesD=.5,Q=.99without exemption. One pact atD=1,R=0with enough stock consumes.000575necrocorn/day and repays.000075debt/day. With no stock it adds.0005debt/day. PayD=.2costs1necro and clears debt. AtT=26,2cleansing pacts,3effective pyramids,D=0, storage bonus=.0005×2×2×3=.006.

## Cycles

VERIFIED`js/calendar.js:55–214,301–307,321–353,1006–1021`;`js/prestige.js:304–323`.

There are10cycles of5years each, a50-year era. Fixed order: charon,umbra,yarn,helios,cath,redmoon,dune,piscine,terminus,kairo. They advance with calendar years, including time travel. Numerology(50paragon) enables the selected space-building effect multipliers. Numeromancy(250paragon, unlocked by numerology) applies cycle festival resource multipliers only while a festival is active; the affected gross resource flow also multiplies by1+festivalRatio. Ordinary base festival happiness/growth effects are separate.

The independent matrix is in12-cycles-facts.json. Its effect multipliers are applied once to the appropriate building effect, not repeatedly to an already-modified cached value. Festival multipliers target resource production before consumption, not the entire net rate. Validate multi-year jumps, cycle boundaries, toggled buildings, and festival ending within offline simulation.

Examples: normal moon outpost .007unobtainium/tick becomes.0063incharon and.0084inredmoon with numerology. Solar collectors30power become45inhelios and15interminus. Inredmoon with numeromancy+festival and no extra festivalRatio, eligible unobtainium production doubles; consumption does not double.
