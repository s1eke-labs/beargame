/** Bulk industrial arithmetic. */
import {pollutionRate} from './industry.js';
import {engineerOutputMultiplier} from './engineer-automation.js';
import {onWorkshopSeason} from './workshop-dynamics.js';
export function advancePollution(ctx,ticks,p=ctx.production({ignoreParadox:true})){
 const s=ctx.state,e=p.effects,emission=pollutionRate(0,e.pollution||0,e.cleanEnergy||0,e.pollutingEnergy||0,e.pollutionRatio||0,e.pollutionCleanup||0,true),dissipation=ctx.isChallenge('postApocalypse')?0:1e-7;
 if(dissipation){const change=-Math.expm1(-dissipation*ticks);s.pollution=Math.max(0,s.pollution+(emission/dissipation-s.pollution)*change);}
 else s.pollution=Math.max(0,s.pollution+emission*ticks);
}
export function onWorkshopYear(ctx){onWorkshopSeason(ctx);}
export function onWorkshopRedshift(ctx,days,p=ctx.production({ignoreParadox:true})){
 const s=ctx.state;advancePollution(ctx,days*10,p);
 // The inspected web profile does not enable offline GFLOPS production.
 const steam=ctx.enabledCount('steamworks');if(!steam||!s.workshop.factoryAutomation||!(p.caps.wood>0)||!(p.caps.minerals>0))return;
 const attempts=Math.floor(days/(s.workshop.advancedAutomation?200:400)),fraction=Math.min(.9,.02*(steam+1)),orders=[];
 for(const [input,recipe]of [['iron','plate'],['minerals','slab'],['wood','beam']]){
  if(input==='iron'&&!s.workshop.pneumaticPress)continue;
  const def=ctx.maps.crafts[recipe],cap=p.caps[input],price=def.cost[input];let available=s.resources[input],units=0;
  for(let i=0;i<attempts&&available>=cap*.98;i++){
   const batch=Math.floor(Math.min(available,cap)*fraction/price);if(batch<=0)break;
   units+=batch;available-=batch*price;
  }
  if(units)orders.push({def,units});
 }
 if(!orders.length)return;
 s.industryState.steamJammed=true;s.industryState.lastAutomationYear=s.calendar.year;
 if(s.automationDisabled.steamworks)return;
 let crafted=0;
 for(const {def,units}of orders){if(ctx.gateReason(def.gate))continue;const bill=ctx.costsFor(def,units);if(!ctx.enough(bill))continue;ctx.pay(bill);ctx.add(def.output,units*def.amount*engineerOutputMultiplier(ctx,def,p),p);s.stats.totalCrafted+=units;crafted+=units;}
 if(crafted)ctx.log(`离线期间蒸汽工坊加工了 ${crafted} 份材料。`,'industry');
}
