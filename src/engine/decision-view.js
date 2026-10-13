/** 只读决策预览：沿用结算所用函数，不推进时钟、不抽取随机数。 */
import {tradeVolume,goodsProbability,spiceProbability} from './diplomacy.js';
import {policyTradeBonuses,policyTradeGoods} from './policies.js';

const probability=value=>Math.max(0,Math.min(1,value));
const catalogIndexes=new WeakMap();
export function tradeDecision(ctx,definition,production){
 const s=ctx.state,e=production.effects,a=production.ambassadors,policy=policyTradeBonuses(s,definition.id);
 const volume=tradeVolume(e,a),multiplier=1+(e.tradeRatio||0)+policy.tradeRatio;
 const relation=policy.standing+(s.buildings.tradepost||0)*(e.tradepostStanding||0)+(e.standingRatio||0);
 const standing=definition.standing<0?Math.min(0,definition.standing+relation):definition.standing>0?definition.standing+relation/2:s.policies.lizardRelationsDiplomats?Math.max(0,(relation+policy.neutralStanding-.25)/3):0;
 const success=standing<0?probability(1+standing):1,friendly=probability(Math.max(0,standing));
 const goods=[];
 const append=(id,chance,min,max,season=0,bonus=false)=>{
  const cap=production.caps[id],held=s.resources[id]||0,room=cap==null?null:Math.max(0,cap-held);
  goods.push({id,name:ctx.resourceById[id]?.name||id,chance:probability(chance),totalChance:success*probability(chance),min:bonus&&friendly===1?min*1.25:min,max:bonus&&friendly>0?max*1.25:max,season,room,mayOverflow:room!=null&&max*(bonus&&friendly>0?1.25:1)>room,expected:success*probability(chance)*(min+max)/2*(bonus?1+.25*friendly:1)});
 };
 for(const good of policyTradeGoods(s,definition.id,definition.goods)){
  const chance=goodsProbability(s,definition,good,a);if(chance<=0)continue;
  const season=good.seasons?.[s.calendar.season]||0;
  const base=good.amount*multiplier*(1+season)*volume*(definition.id==='leviathans'?1+.02*s.elderState.energy:1);
  append(good.id,chance,base*(1-good.width/2),base*(1+good.width/2),season,true);
 }
 const spice=spiceProbability(s,definition,a);
 append('spice',spice,25*Math.max(1,spice),(25+50*multiplier)*Math.max(1,spice));
 append('blueprint',.1+policy.blueprintChance+(a?.tradeBlueprintChance||0),1,1);
 if(definition.id==='zebras'){
  const value=(1.5+.03*s.resources.ship)*volume*(1+(e.zebraRelationModifier||0)*.015);
  append('titanium',.15+.0035*s.resources.ship,value,value);
 }
 return {success,friendly,season:ctx.constants.SEASONS[s.calendar.season],goods,volume};
}

export function researchRelations(catalog,definition){
 if(!catalogIndexes.has(catalog)){
  const all=Object.entries(catalog).flatMap(([section,rows])=>rows.map(d=>({section,...d}))),names=Object.fromEntries(all.map(d=>[d.id,d.name])),dependents=new Map();
  for(const d of all)for(const [gate,value] of Object.entries(d.gate||{})){
   const section=gate==='scienceAny'?'science':gate;
   if(!['science','workshop','metaphysics','buildings'].includes(section))continue;
   const ids=typeof value==='string'?[value]:Array.isArray(value)?value:Object.keys(value||{});
   for(const id of ids){const key=`${section}:${id}`;if(!dependents.has(key))dependents.set(key,new Set());dependents.get(key).add(d.name);}
  }
  catalogIndexes.set(catalog,{names,dependents});
 }
 const {names,dependents}=catalogIndexes.get(catalog);
 const sectionFor={science:'science',scienceAny:'science',workshop:'workshop',buildings:'buildings',metaphysics:'metaphysics'};
 const prerequisites=[];
 for(const [kind,value] of Object.entries(definition.gate||{})){
  if(!sectionFor[kind])continue;
  const requirements=typeof value==='string'?[[value,1]]:Array.isArray(value)?value.map(id=>[id,1]):Object.entries(value||{});
  for(const [id,count] of requirements)prerequisites.push({id,name:names[id]||id,section:sectionFor[kind],count,alternative:kind==='scienceAny'});
 }
 const section=definition.type==='research'?'science':definition.type==='upgrade'?'workshop':'metaphysics';
 const opens=[...new Set([...(definition.opens||[]),...(dependents.get(`${section}:${definition.id}`)||[])])];
 const benefit=definition.id==='metaphysics'?'开启传承研究，并允许将现有传承转为余烬传承。':opens.length?'为后续项目提供前置条件；部分项目仍需其他条件。':'这项研究没有直接产量增益，具体作用见说明。';
 return {prerequisites,opens,decisionBenefit:benefit};
}
