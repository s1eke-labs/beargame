/** 按需批量预览，使用实际结算的价格和上限，不购买、不抽取随机数。 */
import {progressionUndoCosts,progressionPurchaseRoom} from './progression.js';
import {embassyView,embassyPurchaseCosts} from './build-queue.js';
import {leaderCraftBonus} from './leadership.js';
import {workshopCraftBonus} from './workshop-dynamics.js';

export function batchDecision(ctx,target,p,advanced){
 const {section,id}=target||{},types={buildings:'build',crafts:'craft',trades:'trade',faith:'faith',space:'space',time:'time',embassies:'embassy'};
 if(!types[section]||typeof id!=='string')return null;
 const type=types[section],group=type==='embassy'?'trades':section;
 const d=type==='build'?ctx.buildingDefinition(id):ctx.catalog[group]?.find(c=>c.id===id);
 if(!d||d.oneTime)return null;
 const progression=['faith','space','time'].includes(type);
 const c=type==='embassy'?embassyView(ctx).find(c=>c.id===id):progression?({faith:advanced.faithCards,space:advanced.spaceCards,time:advanced.time})[type]?.find(c=>c.id===id):ctx.card(d);
 if(!c?.unlocked||c.completed)return null;
 const room=progression?progressionPurchaseRoom(ctx,d):d.max?Math.max(0,d.max-ctx.owned(d)):1000000;
 const bill=n=>progression?progressionUndoCosts(ctx,d,n):type==='embassy'?embassyPurchaseCosts(ctx,id,n):ctx.costsFor(d,n);
 let maximum=0;
 if(!progression&&type!=='embassy')maximum=Math.min(room,ctx.maxAffordable(d));
 else{let lo=0,hi=Math.min(room,1000000);while(lo<hi){const mid=Math.ceil((lo+hi)/2);if(ctx.enough(bill(mid)))lo=mid;else hi=mid-1;}maximum=lo;}
 const outputFor=count=>{
  if(!['craft','refine'].includes(d.type))return null;
  const s=ctx.state,base=(p.effects.craftRatio||0)+leaderCraftBonus(s,d.output);
  const bonus=(base+workshopCraftBonus(ctx,d.output,base)+(p.effects[`${d.output}CraftRatio`]||0))*(1+(p.effects[`${d.output}GlobalCraftRatio`]||0));
  const multiplier=d.id==='wood'?(1+(p.effects.refineRatio||0))*(1+(p.effects.refinePolicyRatio||0))*(s.ironWill?1+(p.effects.woodRatio||0)+(p.effects.woodPolicyRatio||0)/3:1):1+bonus;
  const total=d.amount*count*multiplier,cap=p.caps[d.output],free=cap==null?Infinity:Math.max(0,cap-s.resources[d.output]),stored=Math.min(total,free);
  return {id:d.output,name:ctx.resourceById[d.output]?.name||d.output,total,stored,lost:total-stored,full:free===0};
 };
 return {section,id,type:d.type==='refine'?'refine':type,options:[1,5,10,'max'].filter(amount=>amount==='max'||amount<=room).map(amount=>{
  const count=amount==='max'?maximum:amount,raw=count?bill(count):{},output=outputFor(count);
  const available=count>0&&ctx.enough(raw)&&!output?.full;
  return {amount,count,available,reason:output?.full?'成品已满仓':count<=0||!ctx.enough(raw)?'当前物资不足':'',costs:Object.entries(raw).map(([id,value])=>({id,name:ctx.resourceById[id]?.name||({devotion:'累计颂愿',faithRatio:'灵悟'})[id]||id,value,owned:ctx.currency(id)})),output};
 })};
}
