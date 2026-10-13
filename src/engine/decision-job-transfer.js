/** 直接调岗沿用撤回顺序、岗位门槛及容量；先确定可转人数，再一次性变更。 */
import {ambassadorLimit} from './diplomacy.js';
import {limitedDR} from './math.js';

export function jobTransferPlan(ctx,{from,to,amount=1}={}){
 const source=ctx.maps.jobs[from],target=ctx.maps.jobs[to],state=ctx.state;
 const unavailable=reason=>({from,to,requested:amount,actualCount:0,available:false,reason,ids:[]});
 if(!source||!target||from===to)return unavailable('请选择两个不同的有效岗位。');
 if(amount!=='max'&&(!Number.isInteger(amount)||amount<1||amount>1000000))return unavailable('调岗数量必须是有效正整数。');
 if(ctx.isChallenge('atheism')&&to==='priest')return unavailable('无星长夜中不能安排祈愿熊。');
 const gate=ctx.gateReason(target.gate);if(gate)return unavailable(gate);
 const counts=ctx.jobCounts(),limit=to==='ambassador'?ambassadorLimit(state,ctx.effects()):to==='engineer'?(state.buildings.factory||0):Infinity;
 const room=Math.max(0,limit-(counts[to]||0));if(!room)return unavailable('目标岗位已满，请先增加岗位容量。');
 const candidates=state.bears.filter(bear=>bear.job===from).sort((a,b)=>from==='engineer'?
  Number(!!a.engineerSpecialty)-Number(!!b.engineerSpecialty)||((a.skills[from]||0)-(b.skills[from]||0)):(b.skills[from]||0)-(a.skills[from]||0));
 if(!candidates.length)return unavailable('原岗位没有可以调动的伙伴。');
 if(ctx.isChallenge('anarchy')){
  const employed=state.bears.filter(bear=>bear.job).length,cap=Math.round(state.bears.length*(1-(.5+limitedDR(.05*(state.challengeCompletions.anarchy||0),.25))));
  if(employed>cap)return unavailable('当前工作人数超过试炼上限，请先撤回部分伙伴。');
 }
 const desired=amount==='max'?candidates.length:amount,actualCount=Math.min(desired,candidates.length,room);
 return {from,to,requested:amount,actualCount,available:actualCount>0,
  reason:actualCount<desired?`受当前人数或目标岗位容量限制，本次可调动 ${actualCount} 只。`:'',ids:candidates.slice(0,actualCount).map(bear=>bear.id)};
}

export function applyJobTransfer(state,plan){
 const selected=new Set(plan.ids);
 for(const bear of state.bears)if(selected.has(bear.id)){bear.job=plan.to;bear.engineerSpecialty=null;}
}

export function jobTransferDecision(ctx,target,before,project){
 const {ids,...plan}=jobTransferPlan(ctx,target);
 const after=plan.available?project({...plan,ids}):before,scale=ctx.realTicksPerSecond();
 const resources=ctx.catalog.resources.map(resource=>({id:resource.id,name:resource.name,
  beforeRate:(before.net[resource.id]||0)*scale,afterRate:(after.net[resource.id]||0)*scale,
  rateDelta:((after.net[resource.id]||0)-(before.net[resource.id]||0))*scale})).filter(row=>Math.abs(row.rateDelta)>1e-8);
 return {...plan,resources,note:'按当前季节、库存与伙伴技能计算；直接调动原岗位伙伴，不占用已有空闲伙伴。工程熊转岗后需重新选择制作配方。'};
}
