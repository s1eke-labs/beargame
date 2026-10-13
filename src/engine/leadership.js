/** Leadership simulation and population modifiers. */
import {limitedDR,triangularInverse} from './math.js';
export const leaderTraits=Object.freeze([
 {id:'scientist',name:'求知熊',description:'研究与工坊升级的学识花费降低 5%。'},
 {id:'manager',name:'领猎熊',description:'狩猎收益系数增加 0.5。'},
 {id:'engineer',name:'巧手熊',description:'制作收益系数增加 0.05。'},
 {id:'merchant',name:'行商熊',description:'贸易收益系数增加 0.03。'},
 {id:'wise',name:'观星熊',description:'祈愿升级的信仰与黄金花费降低 10%。'},
 {id:'metallurgist',name:'锻炉熊',description:'金属板、钢、齿轮与合金的制作系数增加 0.1。'},
 {id:'chemist',name:'调配熊',description:'混凝土、超合金、煤油、钍、塑料与微芯片的制作系数增加 0.075。'},
 {id:'none',name:'自在熊',description:'没有额外的领袖专长。'}
]);
const challenge=(s,id)=>s.challenge===id||s.activeChallenges?.includes(id);
const traitById=Object.fromEntries(leaderTraits.map(t=>[t.id,t]));
export const randomTrait=value=>leaderTraits[Math.min(7,Math.max(0,Math.floor(value*8)))].id;
export const rankExperience=rank=>500*1.75**rank;
export const rankGold=rank=>25*(rank+1);
export function activeLeader(state){
 if(challenge(state,'anarchy'))return null;
 const bear=state.bears.find(b=>b.id===state.leaderId);
 return bear&&(!state.policies?.theocracy||bear.job==='priest')?bear:null;
}
export function leaderJobMultiplier(state,rank){return (rank===0?1:(rank+1)/1.4)*(state.policies?.authocracy?2:1);}
export function workerMultiplierContext(state){
 const leader=activeLeader(state),leaderMultiplier=leader?leaderJobMultiplier(state,leader.rank||0):1;
 return {leaderId:leader?.id??null,leaderMultiplier,sharedMultiplier:1+(leaderMultiplier-1)*(state.policies?.republic?.01:0)};
}
export function workerProductionMultiplier(state,bear,prepared=workerMultiplierContext(state)){
 return prepared.leaderId===bear.id?prepared.leaderMultiplier:prepared.sharedMultiplier;
}
function traitScale(state){return (1+triangularInverse((state.resources.burnedParagon||0)/500))*(state.policies?.monarchy?1.95:1);}
export function leadershipEffects(state){
 const leader=activeLeader(state),scale=traitScale(state);if(!leader)return {};
 return leader.trait==='merchant'?{tradeRatio:.03*scale}:leader.trait==='manager'?{hunterRatio:.5*scale}:{};
}
export function leaderCraftBonus(state,resource){
 const leader=activeLeader(state);if(!leader||resource==='wood')return 0;
 const scale=traitScale(state);
 if(leader.trait==='engineer')return .05*scale;
 if(leader.trait==='metallurgist'&&['plate','steel','gear','alloy'].includes(resource))return .1*scale;
 if(leader.trait==='chemist'&&['concrete','eludium','kerosene','thorium','plastic','microchip'].includes(resource))return .075*scale;
 return 0;
}
export function leadershipCostMultiplier(state,currency,category){
 const leader=activeLeader(state);if(!leader)return 1;
 if(leader.trait==='scientist'&&['research','workshop','upgrade'].includes(category)&&currency==='science')return 1-limitedDR(.05*traitScale(state));
 if(leader.trait==='wise'&&category==='religion'&&['faith','gold'].includes(currency)){
  const burned=1+triangularInverse((state.resources.burnedParagon||0)/500);
  return 1-limitedDR((.09+.01*burned)*(state.policies?.monarchy?1.95:1));
 }
 return 1;
}
function permission(state){return challenge(state,'anarchy')?'自由营地试炼中不能任命或晋升领袖':!state.workshop.register?'先完成熊群名册':'';}
export function promotionCost(bear,target=(bear.rank||0)+1){
 const start=bear.rank||0,difference=target-start;
 if(!Number.isInteger(target)||difference<1||target>10000)return null;
 // A finite sum expressed directly avoids a rank-sized loop on imported saves.
 return {experience:rankExperience(start)*Math.expm1(difference*Math.log(1.75))/.75,gold:25*difference*(start+1+(difference-1)/2),rank:target};
}
export function promotionReason(state,bear,cost=promotionCost(bear)){
 return permission(state)||(!cost?'目标等级无效':bear.experience+1e-9<cost.experience?'工作经验不足':state.resources.gold+1e-9<cost.gold?'黄金不足':'');
}
export function actLeadership(ctx,type,id,amount){
 if(!['leader','promote'].includes(type))return undefined;
 const s=ctx.state,why=permission(s);if(why)return ctx.result(false,why);
 if(type==='leader'&&id==='remove'){s.leaderId=null;return ctx.result(true,'领袖回到了普通岗位。');}
 const bear=s.bears.find(b=>String(b.id)===String(id));if(!bear)return ctx.result(false,'没有找到这只熊。');
 if(type==='leader'){
  if(s.policies?.theocracy&&bear.job!=='priest')return ctx.result(false,'当前路线只允许祈星熊担任领袖。');
  s.leaderId=bear.id;return ctx.result(true,`${bear.name}成为了营地领袖。`);
 }
 let target=(bear.rank||0)+1;
 if(typeof amount==='number'&&amount>1)target=amount;
 let bill=promotionCost(bear,target);
 if(target>bear.rank+1&&promotionReason(s,bear,bill))bill=promotionCost(bear);
 const reason=promotionReason(s,bear,bill);if(reason)return ctx.result(false,reason);
 s.resources.gold=Math.max(0,s.resources.gold-bill.gold);bear.experience=Math.max(0,bear.experience-bill.experience);bear.rank=bill.rank;
 return ctx.result(true,`${bear.name}晋升为 ${bear.rank} 级。`);
}
export function leadershipView(ctx,options={}){
 const s=ctx.state,leader=activeLeader(s),gate=permission(s);
 const pageSize=Math.min(50,Math.max(1,Number.isInteger(options.pageSize)?options.pageSize:25));
 const filter=typeof options.filter==='string'?options.filter.trim().slice(0,100).toLocaleLowerCase():'';
 const filtered=filter?s.bears.filter(b=>[b.id,b.name,b.job,ctx.maps?.jobs?.[b.job]?.name,b.trait,traitById[b.trait||'none']?.name].some(value=>String(value??'').toLocaleLowerCase().includes(filter))):s.bears;
 const pages=Math.max(1,Math.ceil(filtered.length/pageSize)),page=Math.min(pages-1,Math.max(0,Number.isInteger(options.page)?options.page:0));
 const card=(bear,type)=>{
  const cost=promotionCost(bear),reason=gate||(type==='leader'?(s.policies?.theocracy&&bear.job!=='priest'?'当前路线需要祈星熊':leader?.id===bear.id?'现任领袖':''):promotionReason(s,bear,cost));
  return {id:String(bear.id),bearId:bear.id,type,name:`${type==='leader'?'任命':'晋升'} ${bear.name}`,description:`${traitById[bear.trait||'none'].name} · 等级 ${bear.rank} · 经验 ${Math.floor(bear.experience)}`,unlocked:!gate,visible:!gate,available:!reason,reason,owned:type==='leader'&&leader?.id===bear.id?1:0,completed:false,costs:type==='promote'?[{id:'gold',name:ctx.resourceById.gold?.name||'黄金',value:cost?.gold||0,owned:s.resources.gold}]:[],effects:type==='promote'?`需要 ${Math.ceil(cost?.experience||0)} 工作经验，晋升时扣除经验与黄金。`:traitById[bear.trait||'none'].description};
 };
 return {unlocked:!gate,reason:gate,leaderId:leader?.id??null,leader:leader?{...leader,traitName:traitById[leader.trait||'none'].name,jobMultiplier:leaderJobMultiplier(s,leader.rank)}:null,traits:leaderTraits,total:s.bears.length,filteredTotal:filtered.length,page,pageSize,pages,filter,cards:filtered.slice(page*pageSize,(page+1)*pageSize).flatMap(b=>[card(b,'leader'),card(b,'promote')])};
}
