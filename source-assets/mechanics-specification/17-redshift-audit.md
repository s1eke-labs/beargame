# Offline redshift: functional facts, independently described

Reference 781e379f79f1e7512d168849cba21ed111502644. No source functions are included here.

## Entry and queue boundaries

`js/time.js:190–310`: web redshift defaults off; round real elapsed milliseconds / 2000 to whole days, ignore fewer than 3 days, limit to 4000 days (10 years), or 16000 days when year >=1000 or positive paragon. Default QUEUE_REDSHIFT=true. Ask queue for a computable head-item ETA. If computable, raise ETA to at least one day and round upward to a multiple of400 days. Batch only that many days, or the remaining offset if smaller; process queue once after each such segment. If no computable ETA, batch all remaining days without processing queue. Economy batches do not move the calendar. After all economy segments, run one calendar batch for the entire elapsed-day amount.

Economy order: refresh current resource/effect caches; resource bulk; optional calendar bulk (disabled by queue-redshift wrapper); building bulk; workshop bulk; village bulk; space bulk; religion bulk; restore limits; transfer time heat to furnace and possibly shatter all whole100heat batches. This differs from active-tick manager ordering.

## Resource bulk

`js/resources.js:843–873`, `game.js:4563–4623`: use cached ordinary per-tick production, multiplied by days×10. The cache excludes converter consumption and ambassador upkeep; only resources tagged calculatePerTick contribute. Negative honey is specifically skipped, so ordinary offline deficit does not consume food or trigger starvation. Temporarily allow overflow. For each changed capped resource remember max(old amount,old cap), then enforce that remembered ceiling after the other economy managers. This allows bulk craft automation to consume temporary overflow. Existing overcap amounts are not destroyed by merely loading.

## Calendar bulk

`js/calendar.js:730–932`: bulk does not iterate daily/season callbacks. It preserves current season, day, weather and tick, and advances year by floor(days/400). Thousand-years challenge cannot advance beyond year500 through this path. Astronomical event count is round(days×dailyEventChance×autoChance), with exact auto probability (unlike active timeout's inclusive integer1% floor). Science per observed event25×celestialMultiplier×(1+scienceRatio); celestialMultiplier1.2normal/1.6IronWill; astronomy also gives one chart per event.

Meteor count=round(days×(.001×chanceScale+(IW?.004:0))). Minerals per meteor=(50+25×mineralsRatio)×(IW?1.1×(1+mineralsPolicyRatio/3):1)×(1+academyMeteorBonus). Prospecting gives5×(1+academyMeteorBonus)iron. Celestial mechanics gives15×(1+scienceRatio)science per meteor; bulk source does not apply academyMeteorBonus to this science term.

Under IW archery, when unicorn stock<2: round(days×.00017×unicornChanceScale)unicorns. Under pacifism animal research separately gives the same. IW visitors already>0 and below cap gain round(days×.005), no darkBrew/festival multiplier in this bulk path. Rifts give500×round(days×riftChance×unicornChanceScale)unicorns; unlike daily path no religion-ratio bonus. Alicorns give round(days×alicornChance×(1+LDR(alicornPerTickRatio,1.2))). Ivory meteors give a single uniform integer0..1499 yield sample shared across round(days×ivoryMeteorChance×unicornChanceScale)events:250+sample×(1+ivoryMeteorRatio).

Antimatter annual production ×floor(days/400), only with nonnegative energy. Relic per-day output ×days. Paradox statistical time share=(10+extraDays)/[(10+extraDays)+100×max(1,1/chance)]. Grant floor(statisticalVoidPerDay×days×share). Calendar does not enter a negative day. Crypto price receives a bulk distribution approximation and then one final correction. Each crossed1000-year boundary gives1paragon in this specific offline path; pacts receive their millennium karma hook. Alicornmancy uses crossed2-year boundaries. No ordinary envoy discovery/elder duration decrement or yearly elder-arrival event is invoked by this calendar fastForward path.

## Other economy managers

Building pollution (`buildings3045–3060`) solves a constant-emission exponential: equilibrium=emission/dissipation, result=equilibrium+(start-equilibrium)×exp(-dissipation×ticks), clamp>=0. Zero dissipation uses linear current pollution rate×ticks. GFLOPS bulk is a separate option defaultfalse (`settings138–140`), so default offline cores do not generate new computing.

Steam automation (`buildings3068–3145`) gets floor(days/(advancedAutomation?200:400))attempts per segment. Each attempt needs current input>=.98cap, and crafts floor(min(current,cap)×min(.9,.02×(steamCount+1))/recipeInput). Deduct each attempted batch from a local running input total, then execute each aggregate craft. Order plates, slabs, beams. If any scheduled crafts exist, jam before checking whether automation is enabled.

Workshop bulk (`workshop2829–2910`) updates compendium/manuscript caps and runs engineer progress with times=days×10. Village bulk (`village529–535,3226–3335`) pays whole-period ambassador upkeep proportionally and then advances growth/skills in one step; new bears are added only to housing capacity. No village hunger routine is called here. Job learning is multiplied by elapsed ticks; neural shared learning and unused-skill loss likewise use elapsed ticks.

Space bulk (`space1147–1172`) advances routeDays by days×routeSpeed, then converts min(existing GFLOPS,.1×entanglers×ticks×cycle)into hashes. Religion bulk (`religion343–365`) computes average paradox share to reduce corruption days; it separately calls the order-of-void accumulation with full ticks. Detailed necrocorn bulk branches still require independent transcription before claiming exact late-game redshift.

## Implementation boundary

The current engine remains an exact active-tick offline replay at audit time; these facts are not a claim of implementation. The async operation lock, unchanged persisted checkpoint during progress, chunk yielding and failure rollback must remain regardless of the eventual bulk implementation.
