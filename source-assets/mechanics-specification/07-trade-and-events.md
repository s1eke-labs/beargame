# Diplomacy and daily events

## Trading essentials

VERIFIED`js/diplomacy.js:18–361,475–523,585–602,825–972,994–1045,1111–1164,2158–2163`.

Base trade fee is50manpower+15gold in addition to one partner-specific commodity. The commodity requirement and normal material return scale with trade volume; spice and blueprint bonuses do not. Costs are paid even if a hostile trade fails. Every partner must be discovered before trading. Initial emissary normally arrives in year20; previous karma tally changes this to5; diplomacy perk1; navigation-diplomacy perk plus a ship0. Initial random partners are lizards/sharks/griffins. Send exploration costs1,000manpower. Its priority special discoveries are nagas atculture≥1,500; zebras atship≥1; spiders atship≥100andscience-cap>125,000; dragons atnuclear-fission researched. Otherwise choose among still-undiscovered non-hidden partners.

Negative final standing means failure probability equal to its magnitude. Positive standing is chance of25%extra normal-material yield. Neutral always succeeds. Friendly standing receives half ordinary standing bonuses, hostile standing can improve at most to neutral, and neutral only changes under a special diplomacy policy.

For each successful material roll: quantity=base×[1+width×(uniform(0,1)−.5)]×(1+tradeRatio+applicablePolicy/ChallengeRatio)×(1+.02elderEnergy)×(1+seasonBonus)×tradeVolume. A friendly bonus trade multiplies this by1.25. Width is total relative range, not ±width: width.08 means±4%.

Every successful trade independently has10%blueprint chance (+1blueprint), and35%spice chance. Spice return is25+50×tradeMultiplier×uniform(0,1). Embassies multiply spice chance by1+.01level in ordinary play; it is not an additive1percentage point. If spice chance exceeds1, it becomes a guaranteed roll with output multiplied by that chance. Other goods' chances receive their own diminishing embassy bonus, limited at.75 without ambassadors; embassy minimum levels gate advanced goods. Negative base chances require positive ambassador effects before a good can ever be sold. Iron Will embassy effectiveness is quarter strength.

Zebra trade additionally rolls titanium: chance=.15+.0035×shipCount, capped as probability at1; quantity=1.5+.03×ships, then trade volume and a special relation modifier. Ordinary trade ratio and season do not multiply this titanium. At100ships, conditional-on-success expected titanium=.5×4.5=2.25. With baseline hostile success.7, unconditional expected titanium1.575per paid trade.

Eight partners' first-tier factual terms in08-trade-selected-facts.json are sufficient to establish early commodity reachability but not advanced embassy parity. Advanced embassy goods, ambassador upkeep and consumption scaling, policy variants, elder feeding/duration, trading anti-undo state and cap behavior remain separately CATALOGUED.

## Daily sky/weather events

VERIFIED`js/calendar.js:254–297,360–382,520–581,661–698,929–951`.

Astronomical events are eligible once an active library exists or astronomy is researched. Base daily probability=.0025+.002×observatories, before time/prestige/challenge effects. A manual observation grants25×(1+scienceRatio)science; celestial mechanics multiplies this by1.2(normal)or1.6(Iron Will). After astronomy, it also grants1starchart at ordinary probabilities. Extremely high eventChance supports multiple charts. An opportunity lasts300ticks(60seconds), or600ticks in Iron Will. SETI observes immediately. Timeout auto-chance is.01per observatory, doubled by astromancy, clamped0..1; Iron Will minimum.25. The actual timeout integer0..99 comparison is inclusive(≤chance×100), giving an effective1%floor even at zero chance.

Weather is neutral through year3. Starting year4, every season rolls integer0..999:0–174warm,175–349cold,350–999neutral. Base probabilities17.5%/17.5%/65%. Cold-chance effects move probability from warm to cold, with special winter-challenge behavior.

Mining enables ordinary meteor probability.001per day. Minerals gained=50+25×mineralsRatio before special modifiers; celestial mechanics also affects related science. Rifts use daily riftChance and grant500×(1+.1×unicornsRatioReligion)unicorns. Daily alicorn chance is the sum of structure alicornChance multiplied by1+limitedDR(alicornPerTickRatio,1.2), and awards1. Ivory meteor chance is ivoryMeteorChance times unicorn-event chance multiplier; award250+integer(0..1499)×(1+ivoryMeteorRatio).

Yearly elder arrival chance is.035×effectiveBlackPyramids×(1+.1×effectiveMarkers); elder discovery opens black-sky challenge. Detailed recurring elder lifetime and rarity multipliers remain to be tested.

## Embassy and elder addendum

Embassy construction requires writing and a discovered partner. Price=partnerBaseCulture×(1−embassyCostReduction)×1.15^(level+embassyFakeBought). No sale action. Normal goods must meet minimum embassy level and already-unlocked resource state, except coal, uranium and all elder goods. Their effective base chance must be positive. Probability multiplier is1+limitedDR(level×.01,.75+ambassadorEmbassyCap), or use.0025inIronWill (`js/diplomacy.js:463–473,1143–1162,1582–1615`). Trade fees clamp at0after subtracting tradeCatpowerDiscount/tradeGoldDiscount; PA multiplies by1+pollutionLevel. Trade volume=(1+ordinaryTradeVolume)×(1+ambassadorTradeVolume).

Elder visit starts only with no current duration and at least one other discovered partner. Initial duration400×(5+floor(energy))days. Successful trades clamp remaining duration to100×(4+floor(energy)). Days decrement it; a subsequent day at≤0hides the faction. Feed wholefloor(min(request,necrocornStock))units, gainingamount×(1+feedEfficiency)energy, capped atfloor((5+5effectiveMarkers)×(1+leviathansEnergyModifier)). Empty feeding clears fractional stock and sets duration0. Energy≥25unlocksUT. Energy persists between visits (`js/diplomacy.js:705–744,883–884,1163–1195`).
