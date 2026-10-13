/** Independent, ordered build scheduling; no resources are reserved at enqueue time. */
import {progressionView} from './progression.js';
import {policyView} from './policies.js';
import {geometricCost} from './math.js';
import {engineerRates,engineerOutputMultiplier} from './engineer-automation.js';
const n=(m,k)=>m?.[k]||0;
const sourceNames={buildings:'营地建筑',tech:'知识研究',upgrades:'工坊技术',policies:'营地路线',embassies:'商队使馆',religion:'星光祈愿',zebraUpgrades:'条纹技艺',spaceMission:'星际航行',spaceBuilding:'星际建筑',zigguratUpgrades:'远古祭坛',transcendenceUpgrades:'升华建筑',chronoforge:'时铸设施',voidSpace:'虚空设施'};
const voidIds=new Set(['cryochambers','voidHoover','voidRift','chronocontrol','voidResonator']);
const singleSources=new Set(['tech','upgrades','policies','zebraUpgrades','spaceMission']);
const types={build:'buildings',research:'science',upgrade:'workshop',policy:'policies',faith:'faith',space:'space',time:'time',embassy:'trades'};
const plain=v=>!!v&&typeof v==='object'&&!Array.isArray(v);
function sourceFor(type,def){
 if(type==='build')return 'buildings';if(type==='research')return 'tech';if(type==='upgrade')return def.special?'zebraUpgrades':'upgrades';if(type==='policy')return 'policies';if(type==='embassy')return 'embassies';
 if(type==='space')return def.family==='mission'?'spaceMission':'spaceBuilding';
 if(type==='faith')return {worship:'religion',mythic:'zigguratUpgrades',transcendence:'transcendenceUpgrades'}[def.family];
 if(type==='time')return voidIds.has(def.id)?'voidSpace':'chronoforge';if(type==='repairCryochamber')return 'voidSpace';
}
function definition(catalog,type,id){if(type==='repairCryochamber')return id==='one'?{id,type,name:'修复冬眠舱'}:null;if(type==='embassy'&&id==='cheapest')return {id,type,name:'最便宜的使馆'};const d=catalog[types[type]]?.find(d=>d.id===id);return type==='embassy'&&d?.embassyCost==null?null:d;}
export function parseBuildQueue(value={items:[],sources:{buildings:true}},catalog){
 if(!plain(value)||!Array.isArray(value.items)||value.items.length>1000000||!plain(value.sources??{}))throw new Error('建造队列格式无效');
 const items=value.items.map(item=>{if(!plain(item)||typeof item.id!=='string'||typeof item.type!=='string'||!Number.isInteger(item.amount)||item.amount<1||item.amount>1000000)throw new Error('队列项目无效');const d=definition(catalog,item.type,item.id),source=d&&sourceFor(item.type,d);if(!source||(singleSources.has(source)&&item.amount!==1))throw new Error('队列项目种类无效');return {id:item.id,type:item.type,amount:item.amount};});
 if(items.reduce((total,i)=>total+i.amount,0)>1000000)throw new Error('建造队列过长');
 const sources={buildings:true};for(const [id,enabled]of Object.entries(value.sources??{})){if(!(id in sourceNames)||typeof enabled!=='boolean')throw new Error('队列分类无效');sources[id]=enabled;}
 sources.buildings=true;return {items,sources};
}
function init(s){s.queue??={items:[],sources:{buildings:true}};s.queue.sources??={buildings:true};s.queue.sources.buildings=true;return s.queue;}
export function maintainQueueSources(ctx){
 const s=ctx.state,q=init(s),unlock=(source,condition)=>{if(condition)q.sources[source]=true;};
 unlock('tech',n(s.buildings,'library'));unlock('policies',n(s.buildings,'library'));unlock('upgrades',n(s.buildings,'workshop'));
 unlock('religion',n(s.buildings,'temple')&&!ctx.isChallenge('atheism'));unlock('zigguratUpgrades',n(s.buildings,'ziggurat'));unlock('zebraUpgrades',n(s.buildings,'zebraWorkshop'));
 unlock('embassies',s.science.writing&&(s.metaphysics.ambassadors||s.policies.bigStickPolicy)&&ctx.catalog.trades.some(d=>s.discoveries[d.id]&&d.embassyCost!=null));
 unlock('spaceMission',s.science.rocketry);unlock('spaceBuilding',n(s.space,'sattelite')||n(s.space,'satellite')||Object.values(s.spaceReached||{}).some(Boolean));
 unlock('transcendenceUpgrades',s.science.cryptotheology);unlock('chronoforge',s.workshop.chronoforge);unlock('voidSpace',s.science.voidSpace||s.usedCryochambers>0);
 return q;
}
export function queueCapacity(ctx){
 const s=ctx.state,e=ctx.effects(),construction=s.science.construction&&!ctx.catalog.science.find(d=>d.id==='construction')?.effect?.queueCap?1:0;
 const hash=Math.max(0,Math.floor(Math.log(Math.max(1000,n(s.resources,'hashrates'))/1000)/Math.log(1.6)+1e-12));
 return Math.max(0,Math.floor((3+construction+(e.queueCap||0)+ctx.enabledCount('aiCore')+hash)*(1+(e.queueCapRatio||0))));
}
const used=q=>q.items.reduce((sum,item)=>sum+item.amount,0);
function embassyBill(ctx,d,amount=1){const e=ctx.effects();return {culture:geometricCost(d.embassyCost*(1-(e.embassyCostReduction||0)),1.15,n(ctx.state.embassies,d.id)+(e.embassyFakeBought||0),amount)};}
export function embassyPurchaseCosts(ctx,id,amount=1){const d=ctx.catalog.trades.find(c=>c.id===id&&c.embassyCost!=null);return d?embassyBill(ctx,d,amount):{};}
export function embassyView(ctx){return ctx.catalog.trades.filter(d=>d.embassyCost!=null).map(d=>{const s=ctx.state,gate=!s.science.writing?'需要书写研究':!s.discoveries[d.id]?'尚未认识这支商队':'',bill=embassyBill(ctx,d);return {id:d.id,type:'embassy',name:`${d.name}使馆`,description:'增加往来，让商队带回更多物资。',unlocked:!gate,visible:!gate,available:!gate&&ctx.enough(bill),reason:gate||(!ctx.enough(bill)?'物资不足':''),owned:n(s.embassies,d.id),costs:[{id:'culture',name:ctx.resourceById.culture.name,value:bill.culture,owned:s.resources.culture}],effects:'使馆等级 +1'};});}
export function actEmbassy(ctx,type,id,amount=1){
 if(type!=='embassy')return undefined;
 if(id==='cheapest'){if(!ctx.state.metaphysics.treaties)return ctx.result(false,'需要使馆协约传承。');id=embassyView(ctx).filter(c=>c.unlocked).sort((a,b)=>a.costs[0].value-b.costs[0].value)[0]?.id;}
 const d=ctx.catalog.trades.find(d=>d.id===id),card=embassyView(ctx).find(c=>c.id===id);if(!d||!card?.unlocked)return ctx.result(false,card?.reason||'没有可建的使馆。');
 if(amount==='max'){let lo=0,hi=1000000;while(lo<hi){const mid=Math.ceil((lo+hi)/2);if(ctx.enough(embassyBill(ctx,d,mid)))lo=mid;else hi=mid-1;}amount=lo;}
 const bill=embassyBill(ctx,d,amount);if(amount<1||!ctx.enough(bill))return ctx.result(false,'物资不足。');ctx.pay(bill);ctx.state.embassies[id]=n(ctx.state.embassies,id)+amount;maintainQueueSources(ctx);return ctx.result(true,`${card.name}增加 ${amount} 级。`);
}
function itemCard(ctx,type,id,cache={}){
 const d=definition(ctx.catalog,type,id);if(!d)return null;
 if(type==='policy')return (cache.policy??=policyView(ctx)).find(c=>c.id===id);
 if(type==='embassy'){const cards=cache.embassy??=embassyView(ctx);if(id!=='cheapest')return cards.find(c=>c.id===id);const lowest=cards.filter(c=>c.unlocked).sort((a,b)=>a.costs[0].value-b.costs[0].value)[0];return lowest?{...lowest,id:'cheapest',name:'最便宜的使馆',unlocked:!!ctx.state.metaphysics.treaties,reason:ctx.state.metaphysics.treaties?lowest.reason:'需要使馆协约传承'}:null;}
 if(['faith','space','time','repairCryochamber'].includes(type)){const p=cache.progression??=progressionView(ctx);return ({faith:p.faithCards,space:p.spaceCards,time:p.time,repairCryochamber:p.actions})[type]?.find(c=>c.id===id&&(type!=='repairCryochamber'||c.type===type));}
 return ctx.card(type==='build'?ctx.buildingDefinition(id):d);
}
function blockedPermanently(ctx,item,card){const d=definition(ctx.catalog,item.type,item.id);return !d||!!card?.completed||(d.max&&card.owned>=d.max)||(item.type==='policy'&&(d.conflicts?.some(id=>ctx.state.policies[id])||ctx.state.policyLocked?.[item.id]));}
function readItem(ctx,item,cache){
 const d=definition(ctx.catalog,item.type,item.id),card=itemCard(ctx,item.type,item.id,cache),source=d&&sourceFor(item.type,d),skip=blockedPermanently(ctx,item,card);
 const p=cache.production??=ctx.production(),storage=card?.costs?.some(c=>p.caps[c.id]!=null&&c.value>p.caps[c.id]&&c.owned<c.value);
 return {...item,name:card?.name||d?.name||item.id,source,costs:card?.costs||[],available:!!card?.available,unlocked:!!card?.unlocked,skip,status:skip?'已完成或失效':storage?'仓储不足':card?.available?'就绪':card?.reason||'等待条件',reason:storage?'仓储不足':card?.reason||'',confirmationText:card?.confirmationText};
}
export function actBuildQueue(ctx,type,id,amount=1){
 if(!['queueEnqueue','queueRemove','queueUp','queueDown','queueClear'].includes(type))return undefined;
 const q=maintainQueueSources(ctx);
 if(type==='queueClear'){if(id!=='confirm')return ctx.result(false,'请先确认清空建造队列。');q.items=[];return ctx.result(true,'建造队列已清空。');}
 if(type==='queueEnqueue'){
  const colon=String(id).indexOf(':'),action=String(id).slice(0,colon),target=String(id).slice(colon+1),d=definition(ctx.catalog,action,target),source=d&&sourceFor(action,d);
  if(colon<1||!source||!q.sources[source])return ctx.result(false,'这类项目尚不能加入队列。');
  const card=itemCard(ctx,action,target);if(!card?.unlocked||blockedPermanently(ctx,{type:action,id:target},card))return ctx.result(false,card?.reason||'这项内容尚未开放。');
  const free=queueCapacity(ctx)-used(q);if(free<=0)return ctx.result(false,'建造队列已满。');
  const stackable=!singleSources.has(source)&&!d.oneTime,count=stackable?Math.min(free,amount==='max'?free:amount):1;
  if(!stackable&&q.items.at(-1)?.id===target)return ctx.result(false,'这项研究已经在队列中。');
  const last=q.items.at(-1);if(stackable&&last?.type===action&&last.id===target)last.amount+=count;else q.items.push({type:action,id:target,amount:count});
  return ctx.result(true,`${card.name} × ${count} 已加入队列。`,{queued:count});
 }
 if(!/^\d+$/.test(String(id)))return ctx.result(false,'队列位置无效。');const index=Number(id);if(index>=q.items.length)return ctx.result(false,'队列位置无效。');
 if(type==='queueRemove'){const removed=amount==='max'?q.items[index].amount:Math.min(amount,q.items[index].amount);q.items[index].amount-=removed;if(!q.items[index].amount)q.items.splice(index,1);return ctx.result(true,'已移除队列项目。',{removed});}
 const next=index+(type==='queueUp'?-1:1);if(next<0||next>=q.items.length)return ctx.result(false,'已经在队列边缘。');[q.items[index],q.items[next]]=[q.items[next],q.items[index]];return ctx.result(true,'队列顺序已更新。');
}
export function onQueueTick(ctx){
 const q=maintainQueueSources(ctx),item=q.items[0];if(!item)return;
 const view=readItem(ctx,item,{});let advance=view.skip;
 if(!advance&&view.available){const outcome=ctx.queuePurchase(item.type,item.id,1);advance=!!outcome?.ok;}
 if(advance){item.amount--;if(!item.amount)q.items.shift();}
}
export function queueView(ctx){
 const q=maintainQueueSources(ctx),capacity=queueCapacity(ctx),length=used(q),cache={},options=[];
 for(const [type,key]of Object.entries(types))for(const d of ctx.catalog[key]||[]){const source=sourceFor(type,d);if(!source||!q.sources[source]||(type==='embassy'&&d.embassyCost==null))continue;const card=itemCard(ctx,type,d.id,cache);if(!card?.unlocked||blockedPermanently(ctx,{type,id:d.id},card))continue;const free=length<capacity;options.push({...card,id:`${type}:${d.id}`,targetId:d.id,targetType:type,type:'queueEnqueue',source,available:free,reason:free?'':'建造队列已满',stackable:!singleSources.has(source)&&!d.oneTime});}
 if(q.sources.embassies&&ctx.state.metaphysics.treaties){const card=itemCard(ctx,'embassy','cheapest',cache);if(card)options.push({...card,id:'embassy:cheapest',targetId:'cheapest',targetType:'embassy',type:'queueEnqueue',source:'embassies',available:length<capacity,stackable:true});}
 if(q.sources.voidSpace&&ctx.state.usedCryochambers&&ctx.state.workshop.chronoforge){const card=itemCard(ctx,'repairCryochamber','one',cache);if(card)options.push({...card,id:'repairCryochamber:one',targetId:'one',targetType:'repairCryochamber',type:'queueEnqueue',source:'voidSpace',available:length<capacity,stackable:true});}
 return {enabled:true,capacity,used:length,free:Math.max(0,capacity-length),paused:ctx.state.settings.paused,sources:Object.entries(sourceNames).map(([id,name])=>({id,name,unlocked:!!q.sources[id]})),items:q.items.map((item,index)=>({...readItem(ctx,item,cache),index})),options};
}

/** ETA uses average worker flows, then rounds engineer output to whole craft cycles. */
export function estimateQueueDays(ctx){
 const item=init(ctx.state).items[0];if(!item)return {days:0,computable:false};
 const card=itemCard(ctx,item.type,item.id);if(!card)return {days:0,computable:true};
 const p=ctx.production(),rates=engineerRates(ctx,p),consumption={};
 for(const recipe of ctx.catalog.crafts){const rate=rates[recipe.id]||0;if(!rate)continue;for(const [id,cost]of Object.entries(recipe.cost||{}))consumption[id]=(consumption[id]||0)-rate*cost;}
 let days=0;
 for(const cost of card.costs||[]){
  if(cost.owned>=cost.value)continue;
  if(p.caps[cost.id]!=null&&p.caps[cost.id]<cost.value)return {days,computable:false};
  const recipe=ctx.maps.crafts[cost.id],engineers=recipe?(rates[recipe.id]||0)*recipe.amount*engineerOutputMultiplier(ctx,recipe,p):0;
  const flow=(p.net[cost.id]||0)+(consumption[cost.id]||0)+engineers;
  if(flow<=0)return {days,computable:false};
  days=Math.max(days,(cost.value-cost.owned)/flow/10);
  if(engineers>0){const craftDays=1/rates[recipe.id]/10;days=Math.ceil(days/craftDays)*craftDays;}
 }
 return {days:Math.ceil(days),computable:true};
}
