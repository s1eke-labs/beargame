import {catalog,constants,release} from './catalog.js';
import {geometricCost,nextRandom,limitedDR,clone} from './math.js';
import {createState,parseSave,serialize,defaultStorage,readStorage,writeStorage,MAX_SAVE_BYTES,SAVE_HEADER} from './save.js';
export {catalog,constants,release,parseSave,MAX_SAVE_BYTES,SAVE_HEADER};

const maps=Object.fromEntries(Object.entries(catalog).map(([key,values])=>[key,Object.assign(Object.create(null),Object.fromEntries(values.map(d=>[d.id,d])))]));
const resourceById=maps.resources;
const nowOf=now=>typeof now==='function'?now():typeof now==='number'?now:Date.now();
const n=(map,id)=>map?.[id]||0;
const skillBonus=value=>value>=9000?.1875:value>=5000?.125:value>=2500?.075:value>=1200?.045:value>=500?.025:value>=100?.0125:0;
const EPSILON=1e-9,MAX_BATCH=1000000;
const queueGroups={build:'buildings',research:'science',upgrade:'workshop'};
const queueSources={build:'buildings',research:'tech',upgrade:'upgrades'};
const queueSourceNames={buildings:'营地建筑',tech:'知识研究',upgrades:'工坊技术'};

function pollutionEffects(pollution){
 const p=Math.max(0,pollution),level=p>0?Math.max(0,Math.floor(Math.log10(p/1e6))):0;
 let honeyRatio=0,happiness=0,arrivalDivisor=0;
 if(level===0)honeyRatio=p<5e6?0:-.2*(p-5e6)/5e6;
 else if(level===1){honeyRatio=-.2-(p-1e7)*.05/1e8;happiness=p<5e7?0:-3.2e-7*(p-5e7);}
 else{honeyRatio=limitedDR(-.5-.1*Math.log(p),10)/10;happiness=-(level===2?1.08:level===3?1.18:1.2)*Math.log(p);arrivalDivisor=level===2?(p<5e8?0:1+1.68e-8*(p-5e8)):(level===3?1.11:1.2)*Math.log10(p);}
 return {level,honeyRatio:Math.max(-.75,honeyRatio),happiness,arrivalDivisor};
}

export function createGame(options={}){
 let state=options.save!==undefined?parseSave(typeof options.save==='string'?options.save:JSON.stringify(options.save),nowOf(options.now)):createState(options.seed,nowOf(options.now));
 const storage=options.storage===undefined?defaultStorage():options.storage;
 const listeners=new Set();
 let saveStatus={ok:true,message:'尚未保存',at:null},storageProtected=false,effectCache=null,pendingOffline=0,catchingUp=false,offlineReport=null,pendingOperation=null,actionDepth=0;
 const locked=()=>storageProtected?'本地存档尚未读取，为保护原进度，请先备份或导入兼容存档。':catchingUp||pendingOffline>0?'离线结算还在进行中。':'';
 function log(text,kind='info'){state.log.unshift({id:state.nextLogId++,text,kind,at:state.ticks});if(state.log.length>80)state.log.length=80;}
 function notify(){if(actionDepth||!listeners.size)return;const view=snapshot();for(const fn of [...listeners])try{fn(view);}catch(error){console.error('Beargame view update failed',error);}}
 function result(ok,message,extra={}){if(ok){log(message,'action');notify();}return {ok,message,...extra};}
 function enabledCount(id){return state.disabled[id]?0:Math.min(n(state.buildings,id),state.activeBuildings[id]??n(state.buildings,id));}
 function populationCapacity(e=effects()){return Math.max(0,Math.floor(e.bears||0));}
 function jobCounts(){const counts=Object.fromEntries(catalog.jobs.map(j=>[j.id,0]));for(const bear of state.bears)if(bear.job)counts[bear.job]++;return counts;}
 function createBear(){
  const id=state.nextBearId++,disposition=Math.min(7,Math.max(0,Math.floor(nextRandom(state)*8)));
  const draw=maximum=>Math.floor(nextRandom(state)*maximum);let color=0,variety=0;
  if(draw(100)<=10){color=1+draw(6);if(draw(100)<=10)variety=1+draw(4);}
  return {id,name:`小熊 ${id}`,job:null,disposition,experience:0,skills:{},color,variety};
 }
 function effects(){
  if(effectCache)return effectCache;
  const result={};
  for(const def of catalog.buildings)for(const [key,value]of Object.entries(def.effect||{}))result[key]=(result[key]||0)+value*(key.includes('Max')||key==='bears'?n(state.buildings,def.id):enabledCount(def.id));
  for(const group of ['science','workshop'])for(const def of catalog[group])if(state[group][def.id])for(const [key,value]of Object.entries(def.effect||{}))result[key]=(result[key]||0)+value;
  for(const id of ['barn','warehouse']){
   const def=maps.buildings[id],count=n(state.buildings,id);if(!def||!count)continue;
   for(const resource of ['honey','wood','minerals','iron']){
    const key=resource+'Max',raw=def.effect[key]||0;
    let adjusted=raw;if(['wood','minerals','iron'].includes(resource))adjusted*=1+(result.barnRatio||0);
    result[key]=(result[key]||0)+count*(adjusted-raw);
   }
  }
  result.woodRatio=(result.woodRatio||0)+n(state.buildings,'lumberMill')*.1*(result.lumberMillRatio||0);
  const pollution=pollutionEffects(state.pollution);
  result.pollutionHoneyRatio=pollution.honeyRatio;result.happiness=pollution.happiness/100;result.pollutionArrivalDivisor=pollution.arrivalDivisor;result.pollutionLevel=pollution.level;
  return result;
 }
 function happiness(e=effects()){
  const population=state.bears.length,luxuryCount=['furs','ivory','unicorns'].filter(id=>state.resources[id]>0).length;
  return Math.max(.25,1-.02*Math.max(0,population-5)+.1*luxuryCount+(e.happiness||0)-.02*Math.max(0,population-populationCapacity(e)));
 }
 function production(){
  const e=effects(),H=happiness(e),bears=state.bears.length,assigned=state.bears.filter(b=>b.job).length,caps={},gross={},net={};
  for(const r of catalog.resources){caps[r.id]=r.cap===null?null:Math.max(0,r.cap+(e[r.id+'Max']||0));gross[r.id]=0;net[r.id]=0;}
  const season=constants.SEASON_FACTORS[state.calendar.season]+state.calendar.weather*.15;
  for(const def of catalog.buildings){const count=enabledCount(def.id);if(!count||def.conversion)continue;for(const r of catalog.resources)if(def.effect?.[r.id])gross[r.id]+=def.effect[r.id]*count*(r.id==='honey'?season:1);}
  for(const bear of state.bears){
   const job=maps.jobs[bear.job];if(!job?.output)continue;
   const bonus=skillBonus(bear.skills[job.id]||0);
   gross[job.output]+=job.rate*(1+bonus)*H*(1+(e[job.id==='hunter'?'hunterJobRatio':job.id+'Ratio']||0));
  }
  for(const r of catalog.resources){gross[r.id]*=1+(e[r.id+'Ratio']||0);if(r.id==='honey')gross[r.id]*=1+(e.pollutionHoneyRatio||0);net[r.id]=gross[r.id];}
  const demand=.85*(bears+assigned*Math.max(0,H-1))*(1-limitedDR(e.honeyDemandReduction||0));
  net.honey-=demand;net.furs-=bears*.01;net.ivory-=bears*.007;
  const conversions=[];
  for(const def of catalog.buildings){
   const count=enabledCount(def.id);if(!count||!def.conversion)continue;
   let scale=count;for(const [id,value]of Object.entries(def.conversion.input))scale=Math.min(scale,Math.max(0,state.resources[id]+net[id])/value);
   scale=Math.max(0,scale);
   for(const [id,value]of Object.entries(def.conversion.input))net[id]-=value*scale;
   for(const [id,value]of Object.entries(def.conversion.output)){net[id]+=value*scale;gross[id]+=value*scale;}
   conversions.push({id:def.id,scale,total:count});
  }
  return {effects:e,happiness:H,housing:populationCapacity(e),caps,gross,net,demand,conversions};
 }
 function gateReason(gate={}){
  if(gate.scienceAny?.length&&!gate.scienceAny.some(id=>state.science[id]))return `先完成${gate.scienceAny.map(id=>maps.science[id]?.name||id).join('或')}`;
  for(const key of ['science','workshop'])for(const id of typeof gate[key]==='string'?[gate[key]]:gate[key]||[])if(!state[key][id])return `先完成${maps[key][id]?.name||id}`;
  for(const [id,count]of Object.entries(gate.buildings||{}))if(n(state.buildings,id)<count)return `先建造 ${count} ${maps.buildings[id]?.name||id}`;
  return '';
 }
 function owned(def){if(def.type==='build')return n(state.buildings,def.id);if(def.type==='research')return state.science[def.id]?1:0;if(def.type==='upgrade')return state.workshop[def.id]?1:0;return 0;}
 function costsFor(def,amount=1){
  const result={};
  for(const [id,base]of Object.entries(def.cost||{})){const price=def.id==='wood'&&state.workshop.advancedRefinement?50:base;result[id]=def.ratio?geometricCost(price,def.ratio,owned(def),amount):price*amount;}
  return result;
 }
 const resourceAmount=id=>state.resources[id]||0;
 const enough=costs=>Object.entries(costs).every(([id,value])=>Number.isFinite(value)&&resourceAmount(id)+EPSILON>=value);
 function pay(costs){for(const [id,value]of Object.entries(costs))state.resources[id]=Math.max(0,state.resources[id]-value);}
 function add(id,value,p=null){if(value>0)state.resourceUnlocked[id]=true;const cap=(p||production()).caps[id];state.resources[id]=Math.max(0,cap===null?state.resources[id]+value:Math.min(Math.max(cap,state.resources[id]),state.resources[id]+value));}
 function maxAffordable(def){
  if(!enough(costsFor(def,1)))return 0;
  if(!def.ratio){let count=MAX_BATCH;for(const [id,value]of Object.entries(costsFor(def,1)))if(value>0)count=Math.min(count,Math.floor((resourceAmount(id)+EPSILON)/value));return count;}
  let lo=1,hi=2;while(hi<MAX_BATCH&&enough(costsFor(def,hi))){lo=hi;hi*=2;}
  hi=Math.min(hi,MAX_BATCH);while(lo<hi){const mid=Math.ceil((lo+hi)/2);if(enough(costsFor(def,mid)))lo=mid;else hi=mid-1;}return lo;
 }
 function describeEffects(def){
  if(def.summary)return def.summary;const lines=[];
  for(const [key,value]of Object.entries(def.effect||{})){
   if(key==='bears')lines.push(`住处 +${value}`);
   else if(resourceById[key])lines.push(`${resourceById[key].name} ${value>0?'+':''}${value*5}/秒`);
   else if(key.endsWith('Max')&&resourceById[key.slice(0,-3)])lines.push(`${resourceById[key.slice(0,-3)].name}容量 +${value}`);
   else if(key.endsWith('Ratio')&&resourceById[key.slice(0,-5)])lines.push(`${resourceById[key.slice(0,-5)].name}产量 +${value*100}%`);
   else if(key==='craftRatio')lines.push(`制作产量 +${value*100}%`);
   else if(key==='honeyDemandReduction')lines.push(`口粮消耗系数降低 ${value*100}%`);
  }
  if(def.conversion)lines.push('自动消耗原料并生产；原料不足时按可用量工作。');return lines.join(' · ');
 }
 function card(def){
  let reason=gateReason(def.gate);const count=owned(def),one=def.type==='research'||def.type==='upgrade',costs=costsFor(def),unlocked=!reason;
  if(!reason&&one&&count)reason='已完成';if(!reason&&!enough(costs))reason='物资不足';
  return {...def,effect:undefined,conversion:undefined,gate:undefined,cost:undefined,unlocked,visible:unlocked||count>0,available:!reason,reason,costs:Object.entries(costs).map(([id,value])=>({id,name:resourceById[id]?.name||id,value,owned:resourceAmount(id)})),owned:count,completed:!!(one&&count),effects:describeEffects(def),enabled:!state.disabled[def.id]&&(def.type!=='build'||enabledCount(def.id)>0),active:def.type==='build'?enabledCount(def.id):undefined,sellable:def.type==='build'&&count>0,sellReason:'',toggleable:!!def.conversion};
 }
 function maintainQueueSources(){
  if(n(state.buildings,'library'))state.queue.sources.tech=true;
  if(n(state.buildings,'workshop'))state.queue.sources.upgrades=true;
 }
 const queueCapacity=()=>3+(state.science.construction?1:0);
 const queueUsed=()=>state.queue.items.reduce((sum,item)=>sum+item.amount,0);
 const queueDefinition=(type,id)=>Object.hasOwn(queueGroups,type)?maps[queueGroups[type]][id]:null;
 function queueItem(item,p){
  const def=queueDefinition(item.type,item.id),view=def?card(def):null,skip=!def||!!view?.completed;
  const storage=view?.costs.some(cost=>p.caps[cost.id]!==null&&cost.value>p.caps[cost.id]&&cost.owned<cost.value);
  return {...item,name:view?.name||item.id,source:queueSources[item.type],costs:view?.costs||[],available:!!view?.available,unlocked:!!view?.unlocked,skip,status:skip?'已完成或失效':storage?'仓储不足':view?.available?'就绪':view?.reason||'等待条件',reason:storage?'仓储不足':view?.reason||''};
 }
 function queueView(p){
  const capacity=queueCapacity(),used=queueUsed(),options=[];
  for(const [type,group]of Object.entries(queueGroups)){
   const source=queueSources[type];if(!state.queue.sources[source])continue;
   for(const def of catalog[group]){
    const view=card(def);if(!view.unlocked||view.completed)continue;
    options.push({...view,id:`${type}:${def.id}`,targetId:def.id,targetType:type,type:'queueEnqueue',source,available:used<capacity,reason:used<capacity?'':'建造队列已满',stackable:type==='build'});
   }
  }
  return {enabled:true,capacity,used,free:Math.max(0,capacity-used),paused:state.settings.paused,sources:Object.entries(queueSourceNames).map(([id,name])=>({id,name,unlocked:!!state.queue.sources[id]})),items:state.queue.items.map((item,index)=>({...queueItem(item,p),index})),options};
 }
 function actQueue(type,id,amount){
  const queue=state.queue;
  if(type==='queueClear'){if(id!=='confirm')return result(false,'请先确认清空建造队列。');queue.items=[];return result(true,'建造队列已清空。');}
  if(type==='queueEnqueue'){
   const colon=String(id).indexOf(':'),action=String(id).slice(0,colon),target=String(id).slice(colon+1),def=queueDefinition(action,target),source=def&&queueSources[action];
   if(colon<1||!source||!queue.sources[source])return result(false,'这类项目尚不能加入队列。');
   const view=card(def);if(!view.unlocked||view.completed)return result(false,view.reason||'这项内容尚未开放。');
   const free=queueCapacity()-queueUsed();if(free<=0)return result(false,'建造队列已满。');
   const stackable=action==='build',count=stackable?Math.min(free,amount==='max'?free:amount):1,last=queue.items.at(-1);
   if(!stackable&&last?.id===target)return result(false,'这项研究已经在队列中。');
   if(stackable&&last?.type===action&&last.id===target)last.amount+=count;else queue.items.push({type:action,id:target,amount:count});
   return result(true,`${view.name} × ${count} 已加入队列。`,{queued:count});
  }
  if(!/^\d+$/.test(String(id)))return result(false,'队列位置无效。');
  const index=Number(id);if(index>=queue.items.length)return result(false,'队列位置无效。');
  if(type==='queueRemove'){
   const removed=amount==='max'?queue.items[index].amount:Math.min(amount,queue.items[index].amount);queue.items[index].amount-=removed;
   if(!queue.items[index].amount)queue.items.splice(index,1);return result(true,'已移除队列项目。',{removed});
  }
  const next=index+(type==='queueUp'?-1:1);if(next<0||next>=queue.items.length)return result(false,'已经在队列边缘。');
  [queue.items[index],queue.items[next]]=[queue.items[next],queue.items[index]];return result(true,'队列顺序已更新。');
 }
 function onQueueTick(p){
  const item=state.queue.items[0];if(!item)return;
  const view=queueItem(item,p);let advance=view.skip;
  // Use the ordinary purchase path, but publish only the settled simulation.
  // This also prevents observers from making actions during a partial tick.
  if(!advance&&view.available){actionDepth++;try{advance=buy(queueDefinition(item.type,item.id),1).ok;}finally{actionDepth--;}}
  if(advance){item.amount--;if(!item.amount)state.queue.items.shift();}
 }
 function snapshot(){
  const previous=effectCache,p=production();effectCache=p.effects;
  try{
   const counts=jobCounts(),assigned=Object.values(counts).reduce((a,b)=>a+b,0),defsWith=key=>catalog[key].map(card);
   const resources=catalog.resources.map(r=>({id:r.id,name:r.name,value:state.resources[r.id],max:p.caps[r.id],rate:p.net[r.id]*5,grossRate:p.gross[r.id]*5,consumptionRate:Math.max(0,(p.gross[r.id]-p.net[r.id])*5),breakdown:[{label:'总产出',rate:p.gross[r.id]*5},{label:'总消耗',rate:(p.net[r.id]-p.gross[r.id])*5}],visible:!!state.resourceUnlocked[r.id]||['honey','wood'].includes(r.id)||state.resources[r.id]>0||Math.abs(p.net[r.id])>EPSILON,description:r.description}));
   const jobs=catalog.jobs.map(d=>{const reason=gateReason(d.gate);return {...d,type:'assign',unlocked:!reason,visible:!reason||counts[d.id]>0,available:!reason&&assigned<state.bears.length,reason:reason||(assigned>=state.bears.length?'没有空闲小熊':''),costs:[],owned:counts[d.id],assigned:counts[d.id],limit:null,effects:`基础产量 ${d.rate*5} ${resourceById[d.output]?.name}/秒`};});
   return {
    version:1,release:{...release},contentLevel:1,rateMultiplier:1,resources,buildings:defsWith('buildings'),crafts:defsWith('crafts'),science:defsWith('science'),workshop:defsWith('workshop'),jobs,queue:queueView(p),
    actions:[
     {id:'honey',type:'gather',name:'采集蜂蜜',description:'从花丛边采回 1 蜂蜜。',unlocked:true,available:state.resources.honey<p.caps.honey,costs:[],effects:'+1 蜂蜜'},
     card(maps.crafts.wood),
     {id:'hunt',type:'hunt',name:'巡林狩猎',description:'消耗 100 活力，寻找毛皮与象牙。',unlocked:!!state.science.archery,visible:!!state.science.archery,available:!!state.science.archery&&state.resources.manpower>=100,costs:[{id:'manpower',name:'活力',value:100,owned:state.resources.manpower}],reason:!state.science.archery?'先研究林间狩猎':state.resources.manpower<100?'需要 100 活力':''},
     {id:'observe',type:'observe',name:'记录星象',description:'抓住短暂出现的观测机会，积累知识。',unlocked:!!state.observation,visible:!!state.observation,available:!!state.observation,costs:[]},
    ],
    calendar:{...state.calendar,seasonName:constants.SEASONS[state.calendar.season],weatherName:state.calendar.weather>0?'暖和':state.calendar.weather<0?'寒冷':'平和'},
    bears:{value:state.bears.length,max:p.housing,free:state.bears.length-assigned,happiness:p.happiness*100,jobs:counts,arrival:state.arrival,individuals:state.bears.map(b=>({...b,skills:{...b.skills}}))},
    log:state.log.map(x=>({...x})),stats:{...state.stats},settings:{...state.settings},saveStatus:{...saveStatus},storageProtected,offlineReport:offlineReport?clone(offlineReport):null,pendingOffline,catchingUp,pendingOperation:pendingOperation?{...pendingOperation}:null,
    progression:{craftBonus:p.effects.craftRatio||0,conversions:p.conversions},pollution:{value:state.pollution,level:p.effects.pollutionLevel||0,honeyPenalty:p.effects.pollutionHoneyRatio||0},ticks:state.ticks,observation:state.observation?{...state.observation}:null,
   };
  }finally{effectCache=previous;}
 }
 function buy(def,amount){
  if(!def)return result(false,'没有找到这个项目。');const reason=gateReason(def.gate);if(reason)return result(false,reason);
  const one=def.type==='research'||def.type==='upgrade';if(one&&owned(def))return result(false,'已经完成。');
  amount=one?1:amount==='max'?maxAffordable(def):amount;if(amount<1)return result(false,'物资不足，或已达到上限。');
  if(def.type==='build'&&owned(def)+amount>MAX_BATCH)return result(false,'建筑数量超出可保存范围。');
  const bill=costsFor(def,amount);if(!enough(bill))return result(false,'物资不足。');pay(bill);
  if(def.type==='build'){const before=enabledCount(def.id);state.buildings[def.id]=owned(def)+amount;state.activeBuildings[def.id]=before+amount;state.disabled[def.id]=false;if(['hut','logHouse'].includes(def.id))state.solitary=false;}
  if(def.type==='research')state.science[def.id]=true;if(def.type==='upgrade')state.workshop[def.id]=true;
  maintainQueueSources();
  return result(true,`${def.name}${amount>1?` × ${amount}`:''}已完成。`);
 }
 function observe(manual){
  if(!state.observation)return result(false,'此刻没有待记录的星象。');
  const p=production(),science=25*(1+(p.effects.scienceRatio||0));add('science',science,p);state.observation=null;
  return manual?result(true,`记录星象：获得 ${Number(science.toFixed(2))} 知识。`):{ok:true,message:'自动观测完成。'};
 }
 function finishObservation(){if(Math.floor(nextRandom(state)*100)<=(state.solitary?.25:0)*100)observe(false);state.observation=null;}
 function onDay(){
  const e=effects();
  if(state.science.mining&&nextRandom(state)<.001+(state.solitary?.004:0)){
   let minerals=50+25*(e.mineralsRatio||0);if(state.solitary)minerals*=1.1;
   add('minerals',minerals);if(state.workshop.prospecting)add('iron',5);
   log('一颗小小陨石落在林地，留下了矿物与新的观察记录。','event');
  }
  if(enabledCount('library')>0&&nextRandom(state)<.0025){if(state.observation)finishObservation();state.observation={expires:state.ticks+(state.solitary?600:300)};log('树梢之上出现了值得记录的星象。','observation');}
 }
 function advanceCalendar(){
  state.ticks++;state.stats.totalTicks++;state.calendar.tick++;
  if(state.calendar.tick>=10){
   state.calendar.tick=0;state.calendar.day++;
   if(state.calendar.day>=100){state.calendar.day=0;state.calendar.season++;const roll=Math.floor(nextRandom(state)*1000);state.calendar.weather=state.calendar.year>3?(roll<175?1:roll<350?-1:0):0;}
   if(state.calendar.season>=4){state.calendar.season=0;state.calendar.year++;state.stats.totalYears++;log(`第 ${state.calendar.year} 年，春天回到了森林。`,'calendar');}
   onDay();
  }
  if(state.observation&&state.ticks>=state.observation.expires)finishObservation();
 }
 function simulateOne(){
  const p=production(),previous=effectCache;effectCache=p.effects;
  try{
   const foodDeficit=state.resources.honey+p.net.honey,starving=foodDeficit<0;
   for(const r of catalog.resources){const cap=p.caps[r.id];state.resources[r.id]=Math.max(0,cap===null?state.resources[r.id]+p.net[r.id]:Math.min(Math.max(cap,state.resources[r.id]),state.resources[r.id]+p.net[r.id]));if(state.resources[r.id]>0)state.resourceUnlocked[r.id]=true;}
   if(starving){
    if(state.bears.length&&state.deathCooldown<=0&&Math.round(-foodDeficit)>=1){const index=Math.floor(nextRandom(state)*state.bears.length);state.bears.splice(index,1);state.stats.totalDeaths++;state.deathCooldown=25;log('一只小熊因饥饿离开了营地。请增加蜂蜜产量。','warning');}
    else if(state.deathCooldown>0)state.deathCooldown--;
   }else if(state.bears.length<p.housing){
    state.arrival+=.01/Math.max(1,p.effects.pollutionArrivalDivisor||0);
    if(state.arrival+1e-12>=1){state.bears.push(createBear());state.arrival=state.bears.length>=p.housing?0:Math.max(0,state.arrival-1);log('一只新熊循着蜂蜜香气来到营地。','arrival');state.stats.maxBears=Math.max(state.stats.maxBears,state.bears.length);}
   }else state.arrival=0;
   for(const bear of state.bears){if(!bear.job)continue;bear.skills[bear.job]=Math.min(20001,(bear.skills[bear.job]||0)+.01);bear.experience+=.01;for(const id of Object.keys(bear.skills))if(id!==bear.job){const loss=Math.min(.001,bear.skills[id]);bear.skills[id]-=loss;bear.experience=Math.max(0,bear.experience-loss);}}
   state.pollution=Math.max(0,state.pollution+((p.effects.pollution||0)-state.pollution*1e-7));
   onQueueTick(p);
   advanceCalendar();
  }finally{effectCache=previous;}
 }
 function resolveAction(type,id,amount){
  if(['queueEnqueue','queueRemove','queueUp','queueDown','queueClear'].includes(type))return actQueue(type,id,amount);
  if(['hunt','observe'].includes(type)&&id!==undefined&&id!==type)return result(false,'没有这个操作项目。');
  if(type==='gather'){if(id&&id!=='honey')return result(false,'没有这种采集项目。');if(state.resources.honey>=production().caps.honey)return result(false,'蜂蜜已满仓。');add('honey',1);state.stats.totalGathered++;return {ok:true,message:'采到 1 蜂蜜。'};}
  if(type==='build')return buy(maps.buildings[id],amount);
  if(type==='research')return buy(maps.science[id],1);
  if(type==='upgrade')return buy(maps.workshop[id],1);
  if(type==='sell'){
   const def=maps.buildings[id];if(!def||!n(state.buildings,id))return result(false,'没有可拆售的建筑。');
   const count=amount==='max'?n(state.buildings,id):Math.min(amount,n(state.buildings,id)),previous=n(state.buildings,id),active=enabledCount(id),p=production();
   state.buildings[id]=previous-count;state.activeBuildings[id]=Math.min(active,state.buildings[id]);
   const bill=costsFor(def,count),refunds={};for(const [resource,cost]of Object.entries(bill)){const before=state.resources[resource];add(resource,Math.min(1e100,cost*.5),p);refunds[resource]=state.resources[resource]-before;}
   return result(true,`拆售了 ${count} 座${def.name}。`,{sold:count,refunds});
  }
  if(type==='craft'||type==='refine'){
   const def=maps.crafts[id||'wood'];if(!def)return result(false,'没有找到这个配方。');const reason=gateReason(def.gate);if(reason)return result(false,reason);
   amount=amount==='max'?maxAffordable(def):amount;if(amount<1||!enough(costsFor(def,amount)))return result(false,'物资不足。');
   const p=production(),multiplier=def.id==='wood'?(state.solitary?1+(p.effects.woodRatio||0):1):1+(p.effects.craftRatio||0),output=def.amount*amount*multiplier,cap=p.caps[def.output];
   if(cap!==null&&state.resources[def.output]>=cap)return result(false,'成品已满仓。');pay(costsFor(def,amount));add(def.output,output,p);state.stats.totalCrafted+=amount;
   return result(true,`${def.name}：获得 ${Number(output.toFixed(3))} ${resourceById[def.output].name}。`);
  }
  if(type==='assign'||type==='unassign'){
   const job=maps.jobs[id];if(!job)return result(false,'没有这份工作。');if(type==='assign'){const reason=gateReason(job.gate);if(reason)return result(false,reason);}
   const candidates=state.bears.filter(b=>type==='assign'?!b.job:b.job===id);amount=amount==='max'?candidates.length:Math.min(amount,candidates.length);
   if(!amount)return result(false,type==='assign'?'没有空闲小熊。':'这份工作还没有小熊。');candidates.sort((a,b)=>(b.skills[id]||0)-(a.skills[id]||0));for(let i=0;i<amount;i++)candidates[i].job=type==='assign'?id:null;
   return result(true,`${amount} 只小熊${type==='assign'?`成为${job.name}`:'回到休息区'}。`);
  }
  if(type==='toggle'){
   const def=maps.buildings[id];if(!def?.conversion||!owned(def))return result(false,'这个项目不能切换。');state.disabled[id]=!state.disabled[id];state.activeBuildings[id]=state.disabled[id]?0:n(state.buildings,id);
   return result(true,`${def.name}已${state.disabled[id]?'暂停':'恢复'}。`);
  }
  if(type==='observe')return observe(true);
  if(type==='hunt'){
   if(!state.science.archery)return result(false,'先研究林间狩猎。');const count=amount==='max'?Math.min(MAX_BATCH,Math.floor(state.resources.manpower/100)):amount;
   if(!count||state.resources.manpower+EPSILON<count*100)return result(false,'每次狩猎需要 100 活力。');const p=production(),ratio=p.effects.hunterRatio||0;
   pay({manpower:count*100});const found={furs:0,ivory:0,unicorns:0};
   for(let i=0;i<count;i++){found.furs+=nextRandom(state)*80+nextRandom(state)*65*ratio;if(nextRandom(state)<.45+.02*ratio)found.ivory+=nextRandom(state)*50+nextRandom(state)*40*ratio;if(nextRandom(state)<.05)found.unicorns++;}
   for(const [resource,value]of Object.entries(found))add(resource,value,p);state.stats.totalHunts+=count;
   return result(true,`巡林归来：${Number(found.furs.toFixed(2))} 毛皮，${Number(found.ivory.toFixed(2))} 象牙${found.unicorns?`，遇见 ${found.unicorns} 只灵鹿`:''}。`,{gains:found});
  }
  return result(false,'无法执行这个操作。');
 }
 function validateSettlement(){
  for(const value of [...Object.values(state.resources),state.pollution,...Object.values(state.stats)])if(!Number.isFinite(value)||value<0||value>1e100)throw new Error('结算数值超出可保存范围。');
  if(!Number.isSafeInteger(state.ticks)||!Number.isSafeInteger(state.nextBearId)||state.nextBearId<1||!Number.isSafeInteger(state.nextLogId)||state.nextLogId<1||!Number.isInteger(state.calendar.year)||state.calendar.year>1e9||state.bears.length>100000)throw new Error('营地记录超出可保存范围。');
  if(state.observation&&(!Number.isSafeInteger(state.observation.expires)||state.observation.expires<0))throw new Error('观测期限超出可保存范围。');
  serialize(state,state.savedAt);
 }
 function act(type,id,amount=1){
  const why=locked();if(why)return {ok:false,message:why};
  if(typeof type!=='string'||id!==undefined&&typeof id!=='string'||amount!=='max'&&(!Number.isInteger(amount)||amount<1||amount>MAX_BATCH))return {ok:false,message:'操作或数量无效。'};
  const checkpoint=clone(state);let outcome;actionDepth++;
  try{outcome=resolveAction(type,id,amount);if(outcome.ok)validateSettlement();else state=checkpoint;}
  catch(error){state=checkpoint;outcome={ok:false,message:`操作未完成，原有进度已恢复。${error?.message||''}`};}
  finally{actionDepth--;effectCache=null;}
  if(outcome.ok)notify();return outcome;
 }
 function simulate(seconds,{offline=false,notify:doNotify=true}={}){
  const why=locked();if(why)return {ok:false,message:why,seconds:0};
  if(!Number.isFinite(seconds)||seconds<0)return {ok:false,message:'时间必须是非负有限数字。',seconds:0};
  if(state.settings.paused&&!offline)return {ok:true,seconds:0,ticks:0};
  if(!offline&&seconds>86400)return {ok:false,message:'一次推进的时间过长。',seconds:0};
  let used=seconds,dropped=0;if(offline){used=Math.round(seconds/2)*2;if(used<6)used=0;dropped=Math.max(0,used-constants.MAX_OFFLINE_SECONDS);used=Math.min(used,constants.MAX_OFFLINE_SECONDS);}
  const checkpoint=clone(state),before=offline?{...state.resources}:null,startBears=state.bears.length,exact=used*5+state.tickRemainder,ticks=Math.floor(exact+1e-10);
  try{state.tickRemainder=Math.max(0,exact-ticks);for(let i=0;i<ticks;i++)simulateOne();validateSettlement();}
  catch(error){state=checkpoint;effectCache=null;return {ok:false,message:`时间推进中断，原有进度已恢复。${error?.message||''}`,seconds:0,ticks:0};}
  if(offline)offlineReport={seconds:used,discardedSeconds:dropped,bears:state.bears.length-startBears,resources:Object.fromEntries(catalog.resources.map(r=>[r.id,state.resources[r.id]-before[r.id]]))};
  if(doNotify&&ticks)notify();return {ok:true,seconds:used,ticks,discardedSeconds:dropped};
 }
 function save(){
  const why=locked();if(why)return {ok:false,message:why};
  const at=nowOf(options.now);try{saveStatus={...writeStorage(storage,serialize(state,at)),at};if(saveStatus.ok)state.savedAt=at;}catch(error){saveStatus={ok:false,message:error.message,at:null};}notify();return {...saveStatus};
 }
 function exportSave(){if(catchingUp||pendingOffline>0)throw new Error('离线结算完成后才能导出完整存档。');return serialize(state,nowOf(options.now));}
 function importSave(text){
  if(catchingUp||pendingOffline>0)return {ok:false,message:'请等待离线结算完成后再导入。'};
  try{const incoming=parseSave(text,nowOf(options.now)),previous=state;state=incoming;try{log('已导入存档。','save');validateSettlement();}catch(error){state=previous;throw error;}storageProtected=false;offlineReport=null;effectCache=null;saveStatus={ok:true,message:'存档已导入，尚未保存。',at:null};notify();return {ok:true,message:'存档已导入。'};}
  catch(error){return {ok:false,message:error.message};}
 }
 function setSetting(key,value){const why=locked();if(why)return {ok:false,message:why};if(!Object.hasOwn(state.settings,key)||typeof value!=='boolean')return {ok:false,message:'无效的设置。'};const previous=state.settings[key];state.settings[key]=value;try{validateSettlement();}catch(error){state.settings[key]=previous;return {ok:false,message:error.message};}notify();return {ok:true,message:'设置已更新。'};}
 async function catchUpAsync(seconds=pendingOffline,{onProgress,signal}={}){
  if(storageProtected||catchingUp)return {ok:false,message:storageProtected?'请先读取兼容的存档。':'离线结算已经开始。'};
  if(pendingOffline>0)seconds=pendingOffline;if(!Number.isFinite(seconds)||seconds<0)return {ok:false,message:'无效的离线时间。'};
  let used=Math.min(constants.MAX_OFFLINE_SECONDS,Math.round(seconds/2)*2);if(used<6)used=0;
  const discardedSeconds=Math.max(0,Math.round(seconds/2)*2-constants.MAX_OFFLINE_SECONDS),checkpoint=clone(state),before={...state.resources},beforeBears=state.bears.length,pendingCheckpoint=pendingOffline,exact=used*5+state.tickRemainder,totalTicks=Math.floor(exact+1e-10);
  catchingUp=true;pendingOperation={kind:'offline',progress:0,completed:0,total:totalTicks};notify();
  try{
   for(let completed=0;completed<totalTicks;){
    if(signal?.aborted)throw new Error('结算已取消。');const end=Math.min(totalTicks,completed+250);for(;completed<end;completed++)simulateOne();
    pendingOperation={kind:'offline',progress:completed/totalTicks,completed,total:totalTicks};if(onProgress)try{onProgress({completedTicks:completed,totalTicks,progress:completed/totalTicks});}catch{}
    notify();await new Promise(resolve=>setTimeout(resolve,0));
   }
   if(signal?.aborted)throw new Error('结算已取消。');validateSettlement();state.tickRemainder=Math.max(0,exact-totalTicks);pendingOffline=0;state.savedAt=nowOf(options.now);
   offlineReport={seconds:used,discardedSeconds,bears:state.bears.length-beforeBears,resources:Object.fromEntries(catalog.resources.map(r=>[r.id,state.resources[r.id]-before[r.id]]))};
   return {ok:true,...offlineReport,ticks:totalTicks};
  }catch(error){state=checkpoint;pendingOffline=pendingCheckpoint;effectCache=null;return {ok:false,cancelled:!!signal?.aborted,message:`离线结算中断，原有进度已恢复。${error?.message||''}`};}
  finally{catchingUp=false;pendingOperation=null;notify();}
 }
 return {snapshot,getViewModel:snapshot,getState:snapshot,act,dispatch:({type,id,amount})=>act(type,id,amount),tick:seconds=>simulate(seconds),simulate,catchUpAsync,save,export:exportSave,exportSave,importSave,setSetting,
  subscribe(fn){if(typeof fn!=='function')throw new TypeError('订阅者必须是函数');listeners.add(fn);return()=>listeners.delete(fn);},
  _scheduleOffline(seconds){pendingOffline=seconds;},_restoreStatus(status,protect=false){saveStatus=status;storageProtected=protect;},
 };
}
export const importGame=(text,options={})=>createGame({...options,save:text});
export function loadGame(options={}){
 const storage=options.storage===undefined?defaultStorage():options.storage,saved=readStorage(storage);let game;
 try{
  game=saved.text!==null?createGame({...options,storage,save:saved.text}):createGame({...options,storage});
  if(saved.text!==null){const raw=JSON.parse(saved.text),seconds=Math.max(0,(nowOf(options.now)-raw.savedAt)/1000);if(game.snapshot().settings.offline&&!game.snapshot().settings.paused){if(options.deferOffline)game._scheduleOffline(seconds);else{const outcome=game.simulate(seconds,{offline:true,notify:false});if(!outcome.ok)throw new Error(outcome.message);}}}
  game._restoreStatus({ok:saved.ok,message:saved.message||(saved.text!==null?'已读取本地存档。':'新营地已准备好。'),at:saved.text!==null?JSON.parse(saved.text).savedAt:null},!saved.ok);
 }catch(error){game=createGame({...options,save:undefined,storage});game._restoreStatus({ok:false,message:`${error.message} 原存档未被覆盖。`,at:null},true);}
 return game;
}
