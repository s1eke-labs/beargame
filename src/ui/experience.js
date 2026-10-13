import {resolveHomeDistrict} from './districts.js';
import {activityKey,buildingWorkKey} from './scene.js';
/** Presentation-only advice and feedback. No game rules are changed here. */
export const SCENE_PAGE_SIZE=4;
const owned=(vm,id)=>(vm.buildings.find(c=>c.id===id)?.owned||0);
export function shortages(vm,card){return (card?.costs||[]).filter(c=>c.owned+1e-9<c.value).map(c=>{const r=vm.resources.find(r=>r.id===c.id);return {...c,missing:c.value-c.owned,capacity:r?.max,blocked:r?.max!=null&&Number.isFinite(r.max)&&c.value>r.max+1e-9,rate:r?.rate||0};});}
export function costStatus(vm,card){if(card?.completed)return '已掌握';const missing=shortages(vm,card);if(missing.some(c=>c.blocked))return '先扩充仓库';if(card?.available)return '物资齐备';return missing.length?'还需积攒':card?.reason||'';}
export function guidanceStage(vm){
 const bears=vm.bears||{},honey=vm.resources.find(r=>r.id==='honey')?.value||0;
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
 return null;
}
export function guidance(vm){return {...nextGuidance(vm),stage:guidanceStage(vm)};}
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
 const choices=vm.science.filter(c=>c.unlocked&&!c.completed),affordable=choices.find(c=>c.available),possible=choices.find(c=>!shortages(vm,c).some(s=>s.blocked)),target=affordable||possible||choices[0];
 if(target&&!affordable&&library?.owned&&science.rate<=0&&shortages(vm,target).some(c=>c.id==='science'))return job('scholar','安排学者积累知识','书屋本身不会自动产出知识');
 if(target){const cap=shortages(vm,target).find(c=>c.blocked);if(cap){const storage=cap.id==='science'?library:vm.buildings.find(c=>c.id==='barn'&&c.unlocked);if(storage)return build(storage,`先提高${cap.name}容量`,'当前容量装不下所需物资');}return {kind:'resource',id:'science',card:target,detail:`science:${target.id}`,title:target.name,reason:target.available?'物资已经准备好了':`还需积攒${shortages(vm,target)[0]?.name||'物资'}`};}
 return {kind:'resource',id:'bear',nav:'build',title:'看看家园还能添什么',reason:'建设与研究会打开新的选择'};
}
export function pageForBuilding(group,id){const pages=[...new Set(group.cards.map(c=>Math.floor(c.sceneSlot/SCENE_PAGE_SIZE)))].sort((a,b)=>a-b);return Math.max(0,pages.indexOf(Math.floor(group.cards.find(c=>c.id===id).sceneSlot/SCENE_PAGE_SIZE)));}
export function sceneKey(vm,ui){return JSON.stringify([resolveHomeDistrict(vm,ui.district),ui.readOnly,vm.science?.filter(c=>c.completed).length,activityKey(vm,ui),buildingWorkKey(vm,ui),vm.buildings.filter(c=>c.owned).map(c=>[c.id,c.owned,c.stage,c.enabled,c.active]),vm.progression?.spaceCards?.filter(c=>c.owned).map(c=>[c.id,c.owned,c.travelDays>0]),vm.progression?.time?.filter(c=>c.owned).map(c=>[c.id,c.owned]),vm.bears?.value,vm.bears?.free,vm.jobs.filter(c=>c.assigned).map(c=>[c.id,c.assigned]),vm.calendar?.season,vm.calendar?.weather,vm.settings?.paused,(vm.progression?.conversions||[]).map(c=>[c.id,c.scale+1e-8<c.total]),(vm.energy?.supply||0)<(vm.energy?.demand||0),vm.resources.filter(r=>r.max!=null&&r.value>=r.max).map(r=>r.id)]);}
