import {isChallenge,pactCount,pactDailySettlement,pactEffects,praiseMultiplier} from './progression.js';
import {limitedDR} from './math.js';

const count=(map,key)=>map?.[key]||0;

// Redshift has two clocks: elapsed ticks and chargeable, non-paradox days.
function chargeableDays(days,effects){
 const chance=effects.temporalParadoxChance||0;
 if(chance<=0)return days;
 const span=10+(effects.temporalParadoxDay||0);
 return days-Math.floor(days*span/(span+100*Math.max(1,1/chance)));
}

function rates(state,effects){
 const frenzy=!!count(state.religion,'feedingFrenzy');
 const reward=isChallenge(state,'blackSky')?0:limitedDR(.1*count(state.challengeCompletions,'blackSky'),2);
 const base=(effects.corruptionRatio||0)*(1+reward)
  *(1+Math.sqrt(count(state.resources,'sorrow')*(effects.blsCorruptionRatio||0)))*(frenzy?.9:1);
 return {base,slow:base*.25*(1+(effects.corruptionBoostRatio||0)),threshold:frenzy?1:0};
}

function exchange(ledger,siphoning){
 const units=Math.max(0,Math.min(Math.floor(ledger.progress),Math.ceil(ledger.herd)-1));
 const repayment=siphoning?Math.min(units,Math.floor(ledger.debt)):0;
 ledger.herd-=units;
 ledger.stock+=units-repayment;
 ledger.debt-=repayment;
 ledger.progress=Math.min(1,ledger.progress-units);
}

function charge(ledger,days,terms){
 const result=pactDailySettlement(ledger.stock,ledger.debt,terms.upkeep*days,terms.recovery,terms.siphoning);
 if(!terms.paradoxFrozen)ledger.stock=result.stock;
 ledger.debt=result.debt;
}

// Search the integer birth events rather than replaying individual ticks.
// Debt makes the next storage threshold a moving integer boundary.
function firstStoredBirth(ledger,terms,ticks,debtPerTick){
 if(ledger.stock>terms.threshold)return 0;
 if(terms.base<=0)return ticks;
 const needed=1+Math.floor(terms.threshold-ledger.stock);
 let debtUnits=Math.floor(ledger.debt);
 if(!terms.siphoning)debtUnits=0;
 for(;;){
  const births=needed+debtUnits;
  const at=Math.max(0,Math.ceil((births-ledger.progress)/terms.base));
  if(at>=ticks||!terms.siphoning)return Math.min(at,ticks);
  const projectedUnits=Math.floor(ledger.debt+at*debtPerTick);
  if(projectedUnits<=debtUnits)return at;
  debtUnits=projectedUnits;
  // The bulk model treats a debt-dominated projection as unreachable.
  if(debtPerTick>=terms.base&&needed+debtUnits>2*(needed+ledger.debt))return ticks;
 }
}

function spanUntilRecheck(ledger,terms,ticksPerDay){
 if(terms.siphoning||terms.upkeep<=0)return Infinity;
 if(ledger.stock<=terms.threshold){
  const births=1+Math.floor(terms.threshold-ledger.stock);
  const birthTick=Math.ceil((births-ledger.progress)/terms.base);
  const result=Math.ceil(birthTick/ticksPerDay);
  return Number.isNaN(result)?Infinity:result;
 }
 let multiplier=ledger.debt>0?1+.15*(1+terms.recovery/2):1;
 if(ledger.debt>0&&ledger.stock<terms.upkeep*multiplier){
  multiplier=Math.max(0,multiplier-ledger.stock/terms.upkeep);
 }
 return Math.ceil((ledger.stock-terms.threshold)/(terms.upkeep*multiplier));
}

function advanceLedger(ledger,terms,days,ticks){
 const ticksPerDay=ticks/days;
 let uncharged=days,unprocessed=ticks;
 while(uncharged>0||unprocessed>0){
  const boundary=spanUntilRecheck(ledger,terms,ticksPerDay);
  const daySpan=Math.min(uncharged,boundary);
  const tickSpan=daySpan<1?unprocessed:Math.min(unprocessed,Math.ceil(daySpan*ticksPerDay));
  if(ledger.herd<=0){
   charge(ledger,daySpan,terms);
  }else if(!terms.siphoning){
   const fast=firstStoredBirth(ledger,terms,tickSpan,0);
   ledger.progress+=fast*terms.base+(tickSpan-fast)*terms.slow;
   exchange(ledger,false);
   charge(ledger,daySpan,terms);
  }else{
   const debtPerTick=tickSpan>0?terms.upkeep*daySpan/tickSpan:0;
   const fast=firstStoredBirth(ledger,terms,tickSpan,debtPerTick);
   const fastDays=tickSpan>0?Math.floor(fast*daySpan/tickSpan):0;
   charge(ledger,fastDays,terms);
   if(fast>0){ledger.progress+=fast*terms.base;exchange(ledger,true);}
   charge(ledger,daySpan-fastDays,terms);
   ledger.progress+=(tickSpan-fast)*terms.slow;
   exchange(ledger,true);
  }
  uncharged-=daySpan;
  unprocessed-=tickSpan;
  // A pending full unit with no convertible herd can put the next boundary
  // at the present instant. There is then no new birth event to wait for.
  if(daySpan<=0&&uncharged>0&&unprocessed<=0){charge(ledger,uncharged,terms);break;}
 }
}

export function accumulateVoidOrder(ctx,ticks,p=ctx.production({ignoreParadox:true})){
 const state=ctx.state,effects=ctx.effects();
 if(Number.isNaN(state.praised))state.praised=0;
 if(state.metaphysics?.voidOrder){
  state.praised+=ticks*(p.net.faith||0)*.1*(1+(effects.voidResonance||0))
   *(1+(praiseMultiplier(state.faithRatio)-1)/4);
 }
}

export function onReligionRedshift(ctx,days,ticks=days*10,p=ctx.production()){
 if(days<=0&&ticks<=0)return;
 const state=ctx.state,effects=ctx.effects();
 state.religionCounters??={corruption:0,pactDebt:0};
 const counters=state.religionCounters;
 const ledger={herd:count(state.resources,'alicorn'),stock:count(state.resources,'necrocorn'),
  progress:counters.corruption||0,debt:counters.pactDebt||0};
 const terms={...rates(state,effects),paradoxFrozen:state.calendar?.day<0,
  upkeep:pactCount(state)*(count(state.religion,'upfrontPayment')?.00045:.0005),
  recovery:pactEffects(state).deficitRecoveryRatio||0,
  siphoning:!!count(state.religion,'siphoning')};
 advanceLedger(ledger,terms,chargeableDays(days,effects),ticks);
 state.resources.alicorn=ledger.herd;
 state.resources.necrocorn=ledger.stock;
 counters.corruption=ledger.progress;
 counters.pactDebt=ledger.debt;
 accumulateVoidOrder(ctx,ticks,p);
}
