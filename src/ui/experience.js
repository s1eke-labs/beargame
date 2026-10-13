import {resolveHomeDistrict} from './districts.js';
import {activityKey,buildingWorkKey} from './scene.js';
import {catalog} from '../engine/catalog.js';
/** Presentation-only advice and feedback. No game rules are changed here. */
export const SCENE_PAGE_SIZE=4;
const owned=(vm,id)=>(vm.buildings.find(c=>c.id===id)?.owned||0);
export function shortages(vm,card){return (card?.costs||[]).filter(c=>c.owned+1e-9<c.value).map(c=>{const r=vm.resources.find(r=>r.id===c.id);return {...c,missing:c.value-c.owned,capacity:r?.max,blocked:r?.max!=null&&Number.isFinite(r.max)&&c.value>r.max+1e-9,rate:r?.rate||0};});}
export function costStatus(vm,card){if(card?.completed)return '已掌握';const missing=shortages(vm,card);if(missing.some(c=>c.blocked))return '先扩充仓库';if(card?.available)return '物资齐备';return missing.length?'还需积攒':card?.reason||'';}
export function guidanceStage(vm){
 const bears=vm.bears||{},honey=vm.resources.find(r=>r.id==='honey')?.value||0;
 const researched=id=>!!vm.science.find(card=>card.id===id)?.completed;
 const study=(id,label)=>({label,current:researched(id)?1:0,target:1,complete:researched(id),nav:'research'});
 const building=(id,label)=>({label,current:owned(vm,id),target:1,complete:owned(vm,id)>0,...(vm.buildings.some(card=>card.id===id&&card.unlocked)?{detail:`buildings:${id}`}:{nav:'research'})});
 if(!bears.value)return {id:'arrival',title:'迎接第一位伙伴',note:'20 座蜂箱和 1,500 蜂蜜是稳妥开局建议，不是入住的解锁条件。',steps:[
  {label:'稳定蜜源',current:owned(vm,'hive'),target:20,complete:owned(vm,'hive')>=20,detail:'buildings:hive'},
  {label:'储备口粮',current:honey,target:1500,complete:honey>=1500,nav:'home'},
  {label:'准备熊舍',current:owned(vm,'hut'),target:1,complete:owned(vm,'hut')>0,detail:'buildings:hut'}
 ],nextLabel:'伙伴入住后，为它安排工作',nextNav:'village'};
 if(!(vm.science||[]).some(c=>c.completed))return {id:'learning',title:'让家园学会新知识',note:'书屋提供知识容量；安排学者，才会积累知识。',steps:[
  {label:'安排岗位',current:bears.value-(bears.free||0),target:1,complete:bears.value>(bears.free||0),nav:'village'},
  {label:'建好书屋',current:owned(vm,'library'),target:1,complete:owned(vm,'library')>0,detail:'buildings:library'},
  {label:'安排学者',current:vm.jobs.find(j=>j.id==='scholar')?.assigned||0,target:1,complete:(vm.jobs.find(j=>j.id==='scholar')?.assigned||0)>0,nav:'village',job:'scholar'}
 ],nextLabel:'积累知识，完成第一项研究',nextNav:'research'};
 const space=vm.progression?.spaceCards||[],mission=id=>space.find(card=>card.id===id),reached=id=>!!mission(id)?.reached;
 if(researched('rocketry')){
  if(!reached('moonMission'))return {id:'first-flight',title:'把家园的道路延伸到星空',note:'支付物资只代表启程；抵达后才会开放当地设施。',steps:[
   study('rocketry','掌握飞天工程'),
   ...[['orbitalLaunch','完成初探星空'],['moonMission','抵达月林']].map(([id,label])=>({label,current:reached(id)?1:0,target:1,complete:reached(id),...(mission(id)?.unlocked?{detail:`space:${id}`}:{nav:'more'})}))
  ],nextLabel:'建设月林采晶站，取得新的研究材料',nextNav:'more'};
  const mine=space.find(card=>card.id==='moonOutpost');
  return {id:'moon-industry',title:'让异星资源进入家园',note:'采晶站还需要运行原料和电力；已有设施不代表持续产出。',steps:[
   {label:'建设月林采晶站',current:mine?.owned||0,target:1,complete:(mine?.owned||0)>0,...(mine?.unlocked?{detail:'space:moonOutpost'}:{nav:'more'})},
   {label:'取得月晶',current:vm.resources.find(r=>r.id==='unobtainium')?.value||0,target:1,complete:(vm.resources.find(r=>r.id==='unobtainium')?.value||0)>0,nav:'more'},
   study('exogeology','研究异星地质')
  ],nextLabel:'扩展星际生产与更远的航路',nextNav:'more'};
 }
 if(researched('electricity')||researched('industrialization')){
  const energy=vm.energy||{},target=Math.max(1,energy.demand||0);
  return {id:'industry-energy',title:'让工业稳定运转',note:'留意原料净收支和供电；仅增建设施不能解决所有生产瓶颈。',steps:[
   building('smelter','建立金属生产'),study('mechanization','研究机械化'),
   {label:'满足当前用电',current:energy.supply||0,target,complete:(energy.supply||0)>=target,nav:'build'}
  ],nextLabel:'准备石油、知识与星图，研究飞天工程',nextNav:'research'};
 }
 if(researched('mining'))return {id:'workshop',title:'从原料走向工具与金属',note:'工坊提高制作产量；冶炼需要持续供应木材与矿石。',steps:[
  building('workshop','建好手作坊'),building('smelter','建立铸铁炉'),study('steel','掌握炼钢')
 ],nextLabel:'改良生产与仓储，继续发展能源',nextNav:'research'};
 return null;
}
export function guidance(vm){return {...nextGuidance(vm),stage:guidanceStage(vm)};}
const known=card=>!!card&&(card.unlocked||card.owned>0||card.assigned>0||card.completed);
const facilities=vm=>[...(vm.buildings||[]).map(card=>({...card,section:'buildings'})),...(vm.progression?.spaceCards||[]).map(card=>({...card,section:'space'})),...(vm.progression?.faithCards||[]).map(card=>({...card,section:'faith'})),...(vm.progression?.time||[]).map(card=>({...card,section:'time'}))];
const resourceName=(vm,id)=>vm.resources.find(resource=>resource.id===id)?.name||id;
function facilityPlan(card,id,reason){return {reachable:true,kind:'building',section:card.section,id:card.id,card,detail:`${card.section}:${card.id}`,title:`${card.owned&&card.enabled===false?'恢复':'建设'}${card.name}`,reason,resourceId:id};}
function materialPlans(vm,card,seen){return shortages(vm,card).map(shortage=>({shortage,plan:acquisitionPlan(vm,shortage.id,{blocked:shortage.blocked,seen})}));}

/** 判断当前物资是否能取得，并返回一个可以解释的下一步；不改变游戏快照。 */
export function acquisitionPlan(vm,id,{blocked=false,seen=new Set()}={}){
 const name=resourceName(vm,id),key=`${id}:${blocked?'capacity':'stock'}`;
 if(seen.has(key)||seen.size>=12)return {reachable:false,kind:'resource',id,command:'resources',title:`检查${name}来源`,reason:`取得${name}还依赖尚未解决的生产链。`};
 const visited=new Set([...seen,key]),resource=vm.resources.find(row=>row.id===id),all=facilities(vm);
 if(blocked){
  const candidates=all.filter(card=>known(card)&&card.capacityProvides?.includes(id));
  for(const card of candidates.sort((a,b)=>Number(b.available)-Number(a.available))){
   const needs=materialPlans(vm,card,visited);
   if(needs.every(({plan})=>plan.reachable))return facilityPlan(card,id,`先提高${name}容量，当前仓储装不下目标所需物资。`);
  }
  const card=candidates[0];
  return {reachable:false,kind:'resource',id,...(card?{detail:`${card.section}:${card.id}`,card}:{command:'resources'}),title:`先提高${name}容量`,reason:card?`${card.name}能够扩容，但建造材料尚未备齐；请先查看它的缺口。`:`当前没有已开放的${name}扩容设施，继续查看对应研究与解锁条件。`};
 }
 if(resource?.rate>0)return {reachable:true,kind:'resource',id,command:'resources',title:`积累${name}`,reason:vm.settings?.paused?`${name}已有净产出，恢复游戏后继续积累。`:`${name}正按当前净产量积累。`,waiting:true};
 if(id==='honey')return {reachable:true,kind:'resource',id,nav:'home',title:'采集蜂蜜',reason:'手动采集口粮，也可以增加蜂箱与养蜂岗位。'};
 const job=(vm.jobs||[]).find(card=>card.unlocked&&card.output===id);
 if(job&&(vm.bears?.value||0)>0)return {reachable:true,kind:'resource',id:'bear',nav:'village',job:job.id,title:`调整${job.name}岗位`,reason:vm.bears.free>0?`安排空闲伙伴取得${name}。`:`从其他岗位调动伙伴，改善${name}净产量。`};
 const recipes=(vm.crafts||[]).filter(card=>known(card)&&(card.output===id||card.provides?.includes(id)));
 for(const card of recipes){
  const needs=materialPlans(vm,card,visited);
  if(needs.every(({plan})=>plan.reachable)){
   const preparation=needs.find(({plan})=>!plan.waiting);
   if(preparation)return {...preparation.plan,reason:`制作${name}前，${preparation.plan.reason}`};
   return {reachable:true,kind:'resource',id,card,recipe:card.id,title:`${card.type==='refine'?'采集':'制作'}${name}`,reason:needs.length?`先积累${needs.map(({shortage})=>shortage.name).join('、')}，再完成制作。`:`原料齐备，可制作${name}。`};
  }
 }
 for(const card of all.filter(card=>known(card)&&card.provides?.includes(id)).sort((a,b)=>Number(b.owned>0)-Number(a.owned>0)||Number(b.available)-Number(a.available))){
  if(card.owned&&card.enabled===false)return facilityPlan(card,id,`${card.name}已暂停，恢复后再检查原料与净产量。`);
  const definition=catalog.buildings.find(item=>item.id===card.id),conversion=card.conversion||definition?.conversion;
  if(card.owned&&conversion){
   const input=Object.entries(conversion.input||{}).find(([material,amount])=>(vm.resources.find(row=>row.id===material)?.value||0)<amount);
   if(input){const plan=acquisitionPlan(vm,input[0],{seen:visited});if(plan.reachable)return {...plan,reason:`${card.name}需要${resourceName(vm,input[0])}才能生产${name}；${plan.reason}`};continue;}
  }
  if(materialPlans(vm,card,visited).every(({plan})=>plan.reachable))return facilityPlan(card,id,`增加${card.name}，改善${name}供给；同时检查运行原料与消耗。`);
 }
 const trade=(vm.trades||[]).find(card=>known(card)&&card.tradePreview?.goods?.some(good=>good.id===id&&good.totalChance>0)&&materialPlans(vm,card,visited).every(({plan})=>plan.reachable));
 if(trade)return {reachable:true,kind:'resource',id,system:'trades',title:`通过贸易取得${name}`,reason:`${trade.name}可能带回${name}；回报有概率，仍会消耗交易物资。`};
 const hunt=(vm.actions||[]).find(card=>card.type==='hunt'&&known(card));
 if(hunt&&['furs','ivory','unicorns'].includes(id)&&materialPlans(vm,hunt,visited).every(({plan})=>plan.reachable))return {reachable:true,kind:'resource',id,system:'trades',title:`巡林寻找${name}`,reason:`准备活力后巡林；${name}回报带有随机性。`};
 const locked=all.find(card=>!known(card)&&card.provides?.includes(id));
 if(locked?.section==='space'){
  const routes=vm.progression?.spaceCards||[],destination=routes.find(card=>card.family==='mission'&&card.destination===locked.planet);
  const route=destination&&known(destination)?destination:routes.find(card=>destination?.anyMissions?.includes(card.id)&&known(card)&&!card.reached);
  if(route)return {reachable:false,kind:'resource',id,detail:`space:${route.id}`,title:`先开通${name}来源`,reason:`${name}来自${locked.name}；先${route.travelDays>0?`等待${route.name}抵达`:`完成${route.name}`}${route!==destination?`，再启程并抵达${destination.name}`:''}，然后建设${locked.name}。`};
  if(destination)return {reachable:false,kind:'resource',id,nav:'research',title:`先开通${name}来源`,reason:`${name}来自${locked.name}；${destination.reason||'先完成远航前置研究'}，之后仍需抵达${destination.name}并建设设施。`};
 }
 const source=locked||recipes[0]||(vm.jobs||[]).find(card=>card.output===id);
 return {reachable:false,kind:'resource',id,nav:'research',title:`先开通${name}来源`,reason:source?`${name}需要${source.name}；${source.reason||'还需解决它的前置条件或原料供给'}。`:`当前没有持续取得${name}的已开放来源，请检查对应研究、事件或远航条件。`};
}
function nextGuidance(vm){
 const honey=vm.resources.find(r=>r.id==='honey')||{value:0,rate:0},wood=vm.resources.find(r=>r.id==='wood')||{value:0,rate:0},science=vm.resources.find(r=>r.id==='science')||{value:0,rate:0},bears=vm.bears||{},hive=vm.buildings.find(c=>c.id==='hive'),hut=vm.buildings.find(c=>c.id==='hut'),library=vm.buildings.find(c=>c.id==='library');
 const build=(card,title,reason='')=>({kind:'building',id:card.id,card,detail:`buildings:${card.id}`,title,reason});
 const job=(id,title,reason='')=>({kind:'resource',id:'bear',nav:'village',job:id,title,reason});
 const farmer=vm.jobs.find(j=>j.id==='farmer'),free=bears.free||0;
 if(bears.value>0&&honey.rate<0&&honey.value/(-honey.rate)<45&&!vm.settings?.paused){return farmer?.unlocked?job('farmer','先补充口粮',free?'有空闲伙伴可以采蜜':'调整采蜜岗位，留住伙伴'):build(hive,'蜂蜜快不够了','先采集蜂蜜，增加蜂箱');}
 if(!hive?.owned)return build(hive,'建第一座蜂箱','开始自动产蜜');
 if(free>0)return job(farmer?.unlocked&&honey.rate<0?'farmer':library?.owned&&science.rate<=0?'scholar':'woodcutter',`${free} 只伙伴还没工作`,'安排后就会开始生产');
 if(hut?.owned&&!bears.value)return {kind:'resource',id:'bear',nav:'village',title:'等第一位伙伴到来',reason:'住处已经准备好',arrival:Math.min(1,Math.max(0,bears.arrival||0))};
 // A tested opening suggestion, never an unlock condition or a restriction.
 if(!bears.max&&!bears.value){if(hive.owned<20)return build(hive,'再添一座蜂箱',`已有 ${hive.owned} 座 · 先稳住口粮`);if(honey.value<1500)return {kind:'resource',id:'honey',command:'resources',title:'给新伙伴存些口粮',reason:'建议留下 1,500 蜂蜜再入住',progress:Math.min(1,honey.value/1500)};return build(hut,'准备第一间熊舍','新伙伴会持续消耗蜂蜜');}
 if(!library?.owned&&bears.value>0){if(wood.rate<=0&&!shortages(vm,library).every(c=>c.id!=='wood'))return job('woodcutter','安排伙伴采木','为书屋准备木材');return build(library,'建一间林间书屋','解锁学者岗位');}
 const energy=vm.energy||{};
 if((energy.demand||0)>(energy.supply||0))return {kind:'resource',id:'wood',nav:'build',buildTab:'industry',title:'先恢复工业供电',reason:`当前供电 ${Number((energy.supply||0).toFixed(2))}，耗电 ${Number((energy.demand||0).toFixed(2))}；补充供电或暂停耗电设施。`};
 const choices=vm.science.filter(c=>c.unlocked&&!c.completed),affordable=choices.find(c=>c.available);
 const plans=new Map(choices.map(card=>[card.id,materialPlans(vm,card,new Set())]));
 const possible=choices.find(card=>plans.get(card.id).every(({plan})=>plan.reachable)),target=affordable||possible||choices[0];
 if(target){
  const needs=plans.get(target.id)||[],unreachable=needs.find(({plan})=>!plan.reachable),actionable=needs.find(({plan})=>!plan.waiting);
  if(unreachable)return {...unreachable.plan,reason:`${target.name}还缺${unreachable.shortage.name}；${unreachable.plan.reason}`};
  if(actionable)return {...actionable.plan,reason:`为${target.name}准备${actionable.shortage.name}；${actionable.plan.reason}`};
  return {kind:'resource',id:'science',card:target,detail:`science:${target.id}`,title:target.name,reason:target.available?'物资已经准备好了':`还需积攒${needs.map(({shortage})=>shortage.name).join('、')||'物资'}${vm.settings?.paused?'，恢复游戏后继续':''}`};
 }
 return {kind:'resource',id:'bear',nav:'build',title:'看看家园还能添什么',reason:'建设与研究会打开新的选择'};
}
export function pageForBuilding(group,id){const pages=[...new Set(group.cards.map(c=>Math.floor(c.sceneSlot/SCENE_PAGE_SIZE)))].sort((a,b)=>a-b);return Math.max(0,pages.indexOf(Math.floor(group.cards.find(c=>c.id===id).sceneSlot/SCENE_PAGE_SIZE)));}
export function sceneKey(vm,ui){return JSON.stringify([resolveHomeDistrict(vm,ui.district),ui.readOnly,vm.science?.filter(c=>c.completed).length,activityKey(vm,ui),buildingWorkKey(vm,ui),vm.buildings.filter(c=>c.owned).map(c=>[c.id,c.owned,c.stage,c.enabled,c.active]),vm.progression?.spaceCards?.filter(c=>c.owned).map(c=>[c.id,c.owned,c.travelDays>0]),vm.progression?.time?.filter(c=>c.owned).map(c=>[c.id,c.owned]),vm.bears?.value,vm.bears?.free,vm.jobs.filter(c=>c.assigned).map(c=>[c.id,c.assigned]),vm.calendar?.season,vm.calendar?.weather,vm.settings?.paused,(vm.progression?.conversions||[]).map(c=>[c.id,c.scale+1e-8<c.total]),(vm.energy?.supply||0)<(vm.energy?.demand||0),vm.resources.filter(r=>r.max!=null&&r.value>=r.max).map(r=>r.id)]);}
