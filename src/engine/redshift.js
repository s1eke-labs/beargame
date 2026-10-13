/** Independently authored offline batches. Numeric contract: beargame-spec/17-redshift-audit.md. */
import {estimateQueueDays,onQueueTick} from './build-queue.js';
import {onEngineerTick,maintainEngineers} from './engineer-automation.js';
import {randomTrait} from './leadership.js';
import {ambassadorOutput} from './diplomacy.js';
import {limitedDR,triangularInverse} from './math.js';
import {cycleMultiplier,isChallenge,karmaGain,pactSlots,pactEffects,advanceYearsSteps} from './progression.js';
import * as industry from './industrial-redshift.js';
import {onReligionRedshift} from './religion-redshift.js';
const n=(map,id)=>map?.[id]||0;
// Only these resources participate in the ordinary cached-rate calculation.
export const redshiftRateResources=new Set(['honey','wood','minerals','coal','iron','titanium','gold','oil','uranium','unobtainium','manpower','science','culture','faith','starchart','furs','ivory','spice','unicorns','alicorn','tMythril','steel','manuscript','thorium']);
const flush=ctx=>ctx.invalidateEffects?.();
const snapshot=ctx=>ctx.production({ignoreParadox:true});
function gain(ctx,id,value,p){if(value)ctx.add(id,value,p);}
export function cachedRedshiftRates(ctx,p=snapshot(ctx)){
 const s=ctx.state,e=p.effects,rates={};
 const luxury=(1-limitedDR(e.luxuryDemandReduction||0))*(1+(e.luxuryDemandRatio||0))*(1+(s.festivalDays>0?(e.festivalLuxuryConsumptionRatio||0):0));
 const upkeep={honey:p.demand||0,furs:s.bears.length*.01*luxury,ivory:s.bears.length*.007*luxury,spice:s.bears.length*.001*luxury};
 for(const id of redshiftRateResources)rates[id]=(p.gross[id]||0)-(upkeep[id]||0);
 return rates;
}
export function resourceRedshift(ctx,days,p=snapshot(ctx)){
 const s=ctx.state,ceilings={},rates=cachedRedshiftRates(ctx,p);
 for(const [id,rate]of Object.entries(rates)){
  if(!rate||(id==='honey'&&rate<0))continue;
  if(p.caps[id]>0)ceilings[id]=Math.max(s.resources[id],p.caps[id]);
  s.resources[id]=Math.max(0,s.resources[id]+rate*days*10);
  if(s.resources[id]>0)s.resourceUnlocked[id]=true;
 }
 return ceilings;
}
export function villageRedshift(ctx,days,p=snapshot(ctx)){
 const s=ctx.state,e=p.effects,ticks=days*10;
 // Upkeep is funded for the whole interval as one proportional payment.
 const a=ambassadorOutput(ctx,e,p.happiness??ctx.happiness(e));
 const culture=20*(1+.025*Math.max(0,a.count-5))*a.strength*ticks;
 const spice=.8*(1+.001*Math.max(0,a.count-5)**2)*a.strength*ticks;
 const paid=Math.max(0,Math.min(1,culture?s.resources.culture/culture:1,spice?s.resources.spice/spice:1));
 if(s.calendar.day>=0){s.resources.culture=Math.max(0,s.resources.culture-culture*paid);s.resources.spice=Math.max(0,s.resources.spice-spice*paid);}
 const capacity=ctx.populationCapacity?.(e)??Math.round(Math.floor(e.bears||0)*(1+limitedDR(e.maxKittensRatio||0,1)));
 if(s.bears.length<capacity){
  const rate=.01*(1+(e.growthRatio||0))*(s.festivalDays>0?2+(e.festivalArrivalRatio||0):1)/Math.max(1,e.pollutionArrivalDivisor||0);
  const progress=s.arrival+rate*ticks,count=Math.min(capacity-s.bears.length,Math.floor(progress));
  s.arrival=progress-Math.floor(progress);
  for(let i=0;i<count;i++){if(ctx.createBear)s.bears.push(ctx.createBear());else {const id=s.nextBearId++;s.bears.push({id,name:`小熊 ${id}`,job:null,trait:randomTrait(ctx.nextRandom(s)),experience:0,rank:0,skills:{}});}}
  if(s.bears.length>=capacity)s.arrival=0;
  if(count){s.stats.maxBears=Math.max(s.stats.maxBears,s.bears.length);ctx.log(`${count} 只小熊在离线期间来到营地。`,'arrival');}
 }
 if(s.calendar.day<0||ctx.isChallenge('anarchy'))return;
 const housing=s.bears.length<=capacity?1/(1+limitedDR(e.maxKittensRatio||0,1)):1;
 const learn=((s.workshop.internet?Math.max(s.bears.length*housing/10000,.01):.01)+(e.skillXP||0))*ticks;
 const counts=ctx.jobCounts();
 for(const bear of s.bears){
  if(!bear.job)continue;
  if(bear.job!=='engineer'||bear.engineerSpecialty){bear.skills[bear.job]=Math.min(20001,n(bear.skills,bear.job)+learn);bear.experience+=learn;}
  if(s.workshop.neuralNetworks){for(const [id,count]of Object.entries(counts))if(count)bear.skills[id]=Math.min(20001,n(bear.skills,id)+.001*count*ticks);}
  else for(const id of Object.keys(bear.skills))if(id!==bear.job){const loss=Math.min(.001*ticks,bear.skills[id]);bear.skills[id]-=loss;bear.experience=Math.max(0,bear.experience-loss);}
 }
}
export function spaceRedshift(ctx,days,p=snapshot(ctx)){
 const s=ctx.state;
 for(const id of Object.keys(s.spaceTravel))if(!s.spaceReached[id]&&s.spaceTravel[id]>0)s.spaceTravel[id]=Math.max(0,s.spaceTravel[id]-days*(p.effects.routeSpeed||1));
 const consumed=Math.min(s.resources.gflops,.1*(s.disabled.entangler?0:n(s.space,'entangler'))*days*10*cycleMultiplier(s,'entangler','gflopsConsumption'));
 if(consumed>0){s.resources.gflops-=consumed;gain(ctx,'hashrates',consumed,p);}
}
export function paradoxShare(e){const chance=e.temporalParadoxChance||0;if(chance<=0)return 0;const duration=10+(e.temporalParadoxDay||0);return duration/(duration+100*Math.max(1,1/chance));}
export function bulkMarketPrice(s,days,random){
 if(!s.science.antimatter||days<=0)return;
 const trials=Math.max(0,days-1),mean=trials*1.249927083463528e-6,sd=Math.sqrt(trials*1.4427062504448777e-10),lo=trials*Math.log1p(-1/40000),hi=trials*Math.log1p(1/40000);
 let drift=0;
 if(trials<100||mean-5*sd<lo||mean+5*sd>hi){for(let i=0;i<trials;i++){const u=random();drift+=u<.3?Math.log1p((u-.3)/12000):u<.6?0:Math.log1p((u-.6)/16000);}}
 else {do {const radius=Math.sqrt(-2*Math.log(Math.max(Number.MIN_VALUE,random())));drift=mean+sd*radius*Math.cos(2*Math.PI*random());}while(drift<lo||drift>hi);}
 s.blackcoinState.price*=Math.exp(drift);
 const sign=1-(Math.floor(random()*10)%3);s.blackcoinState.price*=1+sign*random()/40000;
 if(s.blackcoinState.price>1100)s.blackcoinState.price*=.7+.1*random();
}
export function calendarRedshift(ctx,days){
 const s=ctx.state,p=snapshot(ctx),e=p.effects,iw=isChallenge(s,'ironWill');let events=0;
 const chance=(1+(e.timeRatio||0)*.25)*(s.metaphysics.chronomancy?1.1:1),unicornChance=(1+(e.timeRatio||0)*.25)*(s.metaphysics.unicornmancy?1.1:1);
 const award=(id,value)=>gain(ctx,id,value,p);
 if(!isChallenge(s,'blackSky')&&(ctx.enabledCount('library')>0||s.science.astronomy)){
  const auto=s.workshop.seti?1:Math.min(1,Math.max(iw?.25:0,(e.starAutoChance||0)*(s.metaphysics.astromancy?2:1)));
  const count=Math.round(days*(.0025+(e.starChance||0))*chance*(s.metaphysics.astromancy?2:1)*auto);events+=count;
  award('science',count*25*(s.workshop.celestialMechanics?(iw?1.6:1.2):1)*(1+(e.scienceRatio||0)));if(s.science.astronomy)award('starchart',count);
 }
 if(s.science.mining){
  const count=Math.round(days*(.001*chance+(iw?.004:0))),academy=1+(e.academyMeteorBonus||0);events+=count;
  award('minerals',count*(50+25*(e.mineralsRatio||0))*academy*(iw?1.1*(1+(e.mineralsPolicyRatio||0)/3):1));
  if(s.workshop.celestialMechanics)award('science',count*15*(1+(e.scienceRatio||0)));if(s.workshop.prospecting)award('iron',count*5*academy);
 }
 if(iw){
  if(s.science.archery&&s.resources.unicorns<2){const count=Math.round(days*.00017*unicornChance);award('unicorns',count);events+=count;}
  if(s.resources.zebras>0&&s.resources.zebras<p.caps.zebras){const count=Math.round(days*.005);award('zebras',count);events+=count;}
 }
 if(isChallenge(s,'pacifism')&&s.science.animal&&s.resources.unicorns<2){const count=Math.round(days*.00017*unicornChance);award('unicorns',count);events+=count;}
 for(const [id,count,amount]of [
  ['unicorns',Math.round(days*(e.riftChance||0)*unicornChance),500],
  ['alicorn',Math.round(days*(e.alicornChance||0)*(1+limitedDR(e.alicornPerTickRatio||0,1.2))),1],
 ]){award(id,count*amount);events+=count;}
 const meteors=Math.round(days*(e.ivoryMeteorChance||0)*unicornChance);
 if(meteors)award('ivory',meteors*(250+Math.floor(ctx.nextRandom(s)*1500)*(1+(e.ivoryMeteorRatio||0))));events+=meteors;
 const years=Math.floor(days/400),pact=pactEffects(s);
 if((e.energySupply||0)>=(e.energyDemand||0))award('antimatter',years*(e.antimatterPerYear||0)*(1+(pact.pyramidPerYearRatio||0))*(1+(e.antimatterPolicyRatio||0)));
 if(s.calendar.day>=0&&!s.disabled.spaceBeacon&&e.beaconRelicsPerDay){const pyramids=n(s.religion,'blackPyramid')+(!isChallenge(s,'blackSky')&&n(s.challengeCompletions,'blackSky')?1:0),hash=Math.max(0,Math.floor(Math.log(Math.max(s.resources.hashrates,1)/1000)/Math.log(1.6)));award('relic',n(s.space,'spaceBeacon')*e.beaconRelicsPerDay*(1+(e.relicRefineRatio||0)*pyramids*.1)*Math.min(p.caps.antimatter/5000,1)*(1+.25*hash)*days);}
 award('void',Math.floor((1+(e.temporalParadoxVoid||0))/2*days*paradoxShare(e)));
 bulkMarketPrice(s,days,()=>ctx.nextRandom(s));
 const old=s.calendar.year,elapsed=isChallenge(s,'1000Years')?Math.min(years,Math.max(0,500-old)):years,next=old+elapsed,millennia=Math.floor(next/1000)-Math.floor(old/1000);
 if(millennia){award('paragon',millennia);const population=Math.round(s.bears.length*(1+.02*s.activeHolyGenocide)),slots=pactSlots(s);if(population>35&&slots>0){s.karmaKittens+=millennia*karmaGain(population,n(s.challengeCompletions,'anarchy')>0)*triangularInverse(.0001*Math.max(1+.1*(s.transcendence-25),1)*slots/100);s.resources.karma=triangularInverse(s.karmaKittens/5);}}
 s.calendar.year=next;s.stats.totalYears+=elapsed;
 const pairs=Math.floor(next/2)-Math.floor(old/2);if(pairs>0&&s.metaphysics.alicornmancy&&isChallenge(s,'pacifism')&&s.science.animal&&s.resources.unicorns<2)award('unicorns',Math.min(2-s.resources.unicorns,pairs));
 flush(ctx);return {events,years:elapsed};
}
export function* advanceOffline(ctx,days){
 if(!Number.isInteger(days)||days<0)throw new Error('离线天数无效。');
 const s=ctx.state;let done=0,segments=0;
 while(done<days){
  flush(ctx);maintainEngineers(ctx);
  const eta=estimateQueueDays(ctx),period=eta.computable?Math.ceil(Math.max(1,eta.days)/400)*400:days-done,length=Math.min(days-done,period),p=snapshot(ctx);
  const ceilings=resourceRedshift(ctx,length,p);
  industry.onWorkshopRedshift(ctx,length,p);
  flush(ctx);const workshop=snapshot(ctx);onEngineerTick(ctx,workshop,length*10);
  villageRedshift(ctx,length,workshop);spaceRedshift(ctx,length,workshop);onReligionRedshift(ctx,length,length*10,workshop);
  for(const [id,ceiling]of Object.entries(ceilings))s.resources[id]=Math.min(s.resources[id],ceiling);
  // Heat cooling uses only furnace transfer rate in this offline path.
  if(s.timeState.heat>0){const heat=Math.min(s.timeState.heat,length*10*(p.effects.heatPerTick||0));s.timeState.heat-=heat;s.timeState.furnaceHeat+=heat*(1+(isChallenge(s,'1000Years')?0:Math.min(3,.1*n(s.challengeCompletions,'1000Years'))));
   if(s.timeState.furnaceEnabled&&n(s.time,'blastFurnace')&&s.timeState.furnaceHeat>=100){const years=Math.floor(s.timeState.furnaceHeat/100);s.timeState.furnaceHeat-=years*100;for(const step of advanceYearsSteps(ctx,years))yield {...step,stage:'furnace',completedDays:done,totalDays:days,segments};}}
  if(eta.computable)onQueueTick(ctx);
  done+=length;segments++;flush(ctx);yield {stage:'economy',completedDays:done,totalDays:days,segments};
 }
 const calendar=calendarRedshift(ctx,days);yield {stage:'calendar',completedDays:days,totalDays:days,segments,...calendar};
 return {days,segments,...calendar};
}
