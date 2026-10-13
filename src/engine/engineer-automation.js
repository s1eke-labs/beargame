/** Original specialist scheduler. Factual rules recorded in automation-mechanics.md. */
import {leaderCraftBonus,workerMultiplierContext,workerProductionMultiplier,activeLeader} from './leadership.js';
import {workshopCraftBonus} from './workshop-dynamics.js';
import {limitedDR} from './math.js';
const n=(m,k)=>m?.[k]||0;
export const engineerJobs=[{id:'engineer',name:'工程熊',rate:0,output:null,gate:{science:'mechanization'},description:'每座精工厂提供一个工程岗位。成为工程熊后，选择配方专长，持续积累制作进度。'}];
export function parseEngineerState(value={},catalog,bears=[]){
 if(!value||typeof value!=='object'||Array.isArray(value))throw new Error('工程进度格式无效');
 const ids=new Set(catalog.crafts.map(d=>d.id)),out={};
 for(const [id,progress]of Object.entries(value)){if(!ids.has(id)||!Number.isFinite(progress)||progress< -1e100||progress>=1)throw new Error('工程进度无效');out[id]=progress;}
 for(const bear of bears){if(bear.engineerSpecialty!=null&&(!ids.has(bear.engineerSpecialty)||bear.job!=='engineer'))throw new Error('工程专长与岗位不一致');}
 return out;
}
export function engineerCapacity(state){return n(state.buildings,'factory');}
function init(s){s.engineerProgress??={};for(const b of s.bears)if(b.job!=='engineer'&&b.engineerSpecialty)b.engineerSpecialty=null;}
export function maintainEngineers(ctx){
 const s=ctx.state;init(s);const workers=s.bears.filter(b=>b.job==='engineer'),excess=workers.length-engineerCapacity(s);
 if(excess>0){workers.sort((a,b)=>Number(!!a.engineerSpecialty)-Number(!!b.engineerSpecialty)||(n(a.skills,'engineer')-n(b.skills,'engineer')));for(const b of workers.slice(0,excess)){b.job=null;b.engineerSpecialty=null;}}
}
export function engineerOutputMultiplier(ctx,def,p=ctx.production()){
 const e=p.effects,s=ctx.state;
 if(def.id==='wood')return (1+(e.refineRatio||0))*(1+(e.refinePolicyRatio||0))*(s.ironWill?1+(e.woodRatio||0)+(e.woodPolicyRatio||0)/3:1);
 const base=(e.craftRatio||0)+leaderCraftBonus(s,def.output);
 return 1+(base+workshopCraftBonus(ctx,def.output,base)+(e[`${def.output}CraftRatio`]||0))*(1+(e[`${def.output}GlobalCraftRatio`]||0));
}
export function engineerRates(ctx,p=ctx.production()){
 const s=ctx.state,e=p.effects,rates={},leadership=workerMultiplierContext(s),H=p.happiness??ctx.happiness(e);
 const happiness=H+(H-1)*(e.happinessWorkerRatio||0),anarchy=ctx.isChallenge('anarchy');
 const holy=e.simScalingRatio?(1+(e.simScalingRatio||0))/(1+limitedDR(e.maxKittensRatio||0,1)):1;
 for(const b of s.bears){
  if(b.job!=='engineer'||!b.engineerSpecialty)continue;
  const d=ctx.maps.crafts[b.engineerSpecialty];if(!d)continue;
  const skill=n(b.skills,'engineer'),bonus=anarchy?0:ctx.skillBonus(skill)*(1+(e.skillMultiplier||0))*(skill>=9000?1+(e.masterSkillMultiplier||0):1);
  const rankFactor=1-.15*Math.max(0,d.tier-(b.rank||0));
  const tier=(e[`t${d.tier}CraftRatio`]||0)+(e.UniversalKnowHow||0)||1;
  let strength=(1+(e[`${d.id}AutomationBonus`]||0))*rankFactor*(1+bonus);if(strength>0)strength*=happiness*workerProductionMultiplier(s,b,leadership);
  rates[d.id]=(rates[d.id]||0)+strength*tier*holy*(s.workshop.neuralNetworks?2:1)/(600*5*d.difficulty);
 }
 return rates;
}
function inputLimit(ctx,def,caps,seen=new Set()){
 if(seen.has(def.id))return false;seen.add(def.id);
 for(const [id,cost]of Object.entries(ctx.costsFor(def))){
  if(cost<=n(ctx.state.resources,id))continue;
  if(caps[id]!=null&&caps[id]>0&&cost>caps[id])return true;
  const input=ctx.maps.crafts[id];if(input&&!ctx.gateReason(input.gate)&&inputLimit(ctx,input,caps,seen))return true;
 }
 return false;
}
function affordability(ctx,def){let amount=Infinity;for(const [id,cost]of Object.entries(ctx.costsFor(def)))if(cost>0)amount=Math.min(amount,n(ctx.state.resources,id)/cost);return Math.max(0,amount);}
export function actEngineerAutomation(ctx,type,id,amount=1){
 if(!['engineerAssign','engineerUnassign'].includes(type))return undefined;
 const s=ctx.state;init(s);const d=ctx.maps.crafts[id];if(!d)return ctx.result(false,'没有这项工程配方。');
 if(type==='engineerAssign'){
  const gate=!s.science.mechanization?'需要机械化研究':ctx.gateReason(d.gate);if(gate)return ctx.result(false,gate);
 }
 const candidates=s.bears.filter(b=>b.job==='engineer'&&(type==='engineerAssign'?!b.engineerSpecialty:b.engineerSpecialty===id));
 const count=amount==='max'?candidates.length:Math.min(amount,candidates.length);
 if(!count)return ctx.result(false,type==='engineerAssign'?'没有待分配的工程熊。':'这项配方还没有工程熊。');
 if(s.workshop.register&&activeLeader(s))candidates.sort((a,b)=>type==='engineerAssign'?(b.rank-a.rank)||(n(b.skills,'engineer')-n(a.skills,'engineer')):(a.rank-b.rank)||(n(a.skills,'engineer')-n(b.skills,'engineer')));
 else candidates.reverse();
 for(const b of candidates.slice(0,count))b.engineerSpecialty=type==='engineerAssign'?id:null;
 return ctx.result(true,type==='engineerAssign'?`${count} 只工程熊开始专注制作${d.name}。`:`${count} 只工程熊回到待分配岗位。`,{assigned:count});
}
export function onEngineerTick(ctx,p=ctx.production(),times=1){
 if(!Number.isFinite(times)||times<=0)return;
 const s=ctx.state;maintainEngineers(ctx);const rates=engineerRates(ctx,p);
 for(const d of ctx.catalog.crafts){
  const rate=rates[d.id]||0;if(rate===0||ctx.gateReason(d.gate))continue;
  const previous=Math.max(0,n(s.engineerProgress,d.id)),candidate=previous+rate*times,budget=affordability(ctx,d);
  if(candidate+1e-12<1){if(budget+1e-12>=candidate)s.engineerProgress[d.id]=candidate;continue;}
  if(inputLimit(ctx,d,p.caps))continue;
  const funded=Math.min(candidate,budget),units=Math.floor(funded+1e-12);
  if(units>0){const bill=ctx.costsFor(d,units);if(!ctx.enough(bill))continue;ctx.pay(bill);ctx.add(d.output,d.amount*units*engineerOutputMultiplier(ctx,d,p),p);s.stats.totalCrafted+=units;}
  s.engineerProgress[d.id]=Math.max(0,Math.min(1-Number.EPSILON,funded-units));
 }
}
export function engineerView(ctx){
 const s=ctx.state,p=ctx.production(),rates=engineerRates(ctx,p),workers=s.bears.filter(b=>b.job==='engineer'),assigned=workers.filter(b=>b.engineerSpecialty).length,free=workers.length-assigned;
 const unlocked=!!s.science.mechanization;
 return {unlocked,capacity:engineerCapacity(s),total:workers.length,assigned,free,cards:ctx.catalog.crafts.map(d=>{
  const count=workers.filter(b=>b.engineerSpecialty===d.id).length,progress=n(s.engineerProgress,d.id),rate=rates[d.id]||0,gate=!unlocked?'需要机械化研究':ctx.gateReason(d.gate),limited=inputLimit(ctx,d,p.caps),budget=affordability(ctx,d),output=d.amount*engineerOutputMultiplier(ctx,d,p);
  const blocked=gate||(!count?'尚未分配工程熊':limited?'原料仓储不足':rate<=0?'工程熊等级不足':budget+1e-12<Math.min(1,progress+rate)?'等待原料':'');
  return {id:d.id,type:'engineerAssign',name:d.name,description:'完成整份进度时统一消耗原料；中途不会预扣。',unlocked:!gate,visible:!gate||count>0,available:!gate&&free>0,reason:gate||(free<=0?'没有待分配的工程熊':''),owned:count,assigned:count,progress,craftsPerSecond:rate*(ctx.realTicksPerSecond?.()??5),outputPerSecond:rate*(ctx.realTicksPerSecond?.()??5)*output,outputPerCraft:output,tier:d.tier,difficulty:d.difficulty,status:blocked||'制作中',storageLimited:limited,outputCapped:p.caps[d.output]!=null&&s.resources[d.output]>=p.caps[d.output],costs:Object.entries(ctx.costsFor(d)).map(([id,value])=>({id,name:ctx.resourceById[id]?.name||id,value,owned:n(s.resources,id)})),effects:`${count} 只工程熊 · 每份基础 ${600*d.difficulty} 秒`};
 })};
}
