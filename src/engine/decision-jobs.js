/** 岗位预览比较同一时刻的生产，不执行岗位操作或模拟时间。 */
import {limitedDR} from './math.js';
import {pactDebtFactor} from './progression.js';

export function happinessBreakdown(s,e,housing,total){
 const population=s.bears.length;
 const luxury=['furs','ivory','spice','unicorns','alicorn','necrocorn','tears','karma','relic','void','blackcoin','bloodstone','tMythril'].filter(id=>s.resources[id]>0).length+(s.resources.elderBox>0||s.resources.wrappingPaper>0?1:0);
 const rows=[
  {label:'基础幸福',value:100},
  {label:'人口拥挤（已计入减免）',value:-2*(e.ignorePopulationPenalty?0:Math.max(0,population-5))*(1-limitedDR(e.unhappinessReduction||0))},
  {label:'珍藏与奢侈品',value:100*(.1+(e.luxuryHappinessBonus||0))*luxury+100*(e.consumableLuxuryHappiness||0)*['furs','ivory','spice'].filter(id=>s.resources[id]>0).length},
  {label:'节庆',value:s.festivalDays>0?30*(1+(e.festivalRatio||0)):0},
  {label:'业力',value:(s.resources.karma||0)*(s.religion.upfrontPayment?Math.max(.1,pactDebtFactor(s)):1)},
  {label:'建筑、约定与环境',value:100*(e.happiness||0)},
  {label:'住处不足',value:-2*Math.max(0,population-housing)}
 ].filter(r=>r.value!==0);
 const floor=total-rows.reduce((n,r)=>n+r.value,0);if(Math.abs(floor)>1e-7)rows.push({label:'最低幸福保障',value:floor});
 return rows;
}

export function jobDecisions({state,production,rateScale,jobs,resources,project}){
 const deltas=(a,b)=>resources.map(r=>({id:r.id,name:r.name,rate:((a.net[r.id]||0)-(b.net[r.id]||0))*rateScale})).filter(r=>Math.abs(r.rate)>1e-8);
 return jobs.map(job=>{
  if(!job.unlocked&&!job.assigned)return job;
  const without=job.assigned?project(state.bears.map(b=>b.job===job.id?{...b,job:null,engineerSpecialty:null}:b)):production;
  const candidates=state.bears.filter(b=>!b.job).sort((a,b)=>(b.skills[job.id]||0)-(a.skills[job.id]||0));
  const anarchy=state.challenge==='anarchy'||state.activeChallenges?.includes('anarchy');
  const employed=state.bears.length-candidates.length,limit=Math.round(state.bears.length*(1-(.5+limitedDR(.05*(state.challengeCompletions.anarchy||0),.25))));
  const candidate=job.available&&(!anarchy||employed<limit)?candidates[0]:null;
  const withOne=candidate?project(state.bears.map(b=>b.id===candidate.id?{...b,job:job.id}:b)):null;
  return {...job,decision:{current:deltas(production,without),next:withOne?deltas(withOne,production):null,candidate:candidate?.name,
   tradeVolume:job.id==='ambassador'?production.ambassadors.tradeVolume-without.ambassadors.tradeVolume:null,
   nextTradeVolume:job.id==='ambassador'&&withOne?withOne.ambassadors.tradeVolume-production.ambassadors.tradeVolume:null,
   note:job.id==='engineer'?'工程岗位需选择配方后才开始自动制作。':'按当前季节、库存与伙伴技能预估；显示岗位带来的净收支变化。'}};
 });
}
