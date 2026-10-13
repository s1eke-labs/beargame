/** Independent trade and envoy formulas. Numeric facts: diplomacy 1019–1162; village 163–200, 331–353, 496–526. */
import {limitedDR} from './math.js';
import {workerProductionMultiplier,workerMultiplierContext} from './leadership.js';
export const ambassadorJob={id:'ambassador',name:'使节熊',rate:0,output:null,gate:{metaphysics:'ambassadors'},description:'持续消耗文化与香料，提高贸易数量、稀有回报机会与使馆潜力。'};
const qty=(m,k)=>m?.[k]||0;
export function ambassadorLimit(s,e={}){
 if(!s.metaphysics.ambassadors)return 0;
 const races=Object.entries(s.discoveries).filter(([id,known])=>id!=='leviathans'&&known).length+(qty(s.elderState,'energy')>0?1:0);
 const divisor=e.embassiesPerAmbassadorSlot||0;
 return races+(divisor>0?Math.floor(Object.values(s.embassies).reduce((a,b)=>a+b,0)/divisor):0);
}
export function ambassadorOutput(ctx,e,H){
 const s=ctx.state,workers=s.bears.filter(b=>b.job==='ambassador');
 const leadership=workerMultiplierContext(s);let strength=0;
 for(const bear of workers) strength+=(1+(ctx.isChallenge('anarchy')?0:ctx.skillBonus(bear.skills.ambassador||0)*(1+(e.skillMultiplier||0))*((bear.skills.ambassador||0)>=9000?1+(e.masterSkillMultiplier||0):1)))*(1+(e.ambassadorBoostPerRank||0)*bear.rank)*workerProductionMultiplier(s,bear,leadership)*(H+(H-1)*(e.happinessWorkerRatio||0));
 const excess=Math.max(0,workers.length-5),culture=20*(1+.025*excess)*strength,spice=.8*(1+.001*excess**2)*strength;
 const paid=Math.min(1,culture?s.resources.culture/culture:1,spice?s.resources.spice/spice:1);
 const effective=strength*Math.max(0,paid),cap=.00133*effective;
 return {count:workers.length,strength,paid:Math.max(0,paid),culture:culture*Math.max(0,paid),spice:spice*Math.max(0,paid),tradeVolume:.0007*effective,embassyEffectCap:cap>1?Math.sqrt(cap):cap,tradeBlueprintChance:limitedDR(.00008*effective,.25),tradeSpiceChance:limitedDR(.00009*effective,.25),tradeNormalResChance:limitedDR(.00003*effective,.25)};
}
export const tradeVolume=(e,a)=>(1+(e.tradeVolume||0))*(1+(a?.tradeVolume||0));
export function goodsProbability(s,partner,good,a){
 if((good.minLevel||0)>qty(s.embassies,partner.id))return 0;
 if(!s.resourceUnlocked[good.id]&&s.resources[good.id]<=0&&!['coal','uranium'].includes(good.id)&&partner.id!=='leviathans')return 0;
 const base=good.chance+(a?.tradeNormalResChance||0);
 if(base<=0)return 0;
 const embassy=partner.embassyCost===null?0:limitedDR(qty(s.embassies,partner.id)*(s.ironWill?.0025:.01),.75+(a?.embassyEffectCap||0));
 return base*(1+embassy);
}
export function spiceProbability(s,partner,a){return (.35+(a?.tradeSpiceChance||0))*(1+(partner.embassyCost===null?0:qty(s.embassies,partner.id)*(s.ironWill?.0025:.01)));}
