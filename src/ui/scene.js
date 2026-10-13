import {workerStyles,idleWorkerStyle} from './worker-outfits.js';
import {buildingDevelopment} from './growth-art.js';
/** Scene presentation only. No economics or game-state mutation. */
export function buildingLook(card){
 const id=card.id,n=card.owned||0,development=buildingDevelopment(card);const stageKey=card.stage?({pasture:'solarFarm',aqueduct:'hydroPlant',library:'dataCenter',amphitheatre:'broadcastTower',warehouse:'launchpad'})[id]:null;if(stageKey)return {key:stageKey,...development};
 const specific={logHouse:'loghouse',mansion:'manor',academy:'academy',lumberMill:'lumberyard',workshop:'workshop',smelter:'smelter',factory:'factory',spaceport:'launchpad'};
 const expanded={hive:[5,'apiary'],hut:[3,'expandedHut'],library:[3,'expandedLibrary'],barn:[3,'granary'],lumberMill:[3,'expandedLumberyard'],workshop:[3,'expandedWorkshop'],warehouse:[3,'expandedWarehouse']};
 const expansion=expanded[id];
 return {key:expansion&&n>=expansion[0]?expansion[1]:specific[id]||null,...development};
}
const full=r=>!!r&&r.max!=null&&r.value>=r.max;
function engineerState(vm,bear){const card=vm.engineers?.cards?.find(c=>c.id===bear.engineerSpecialty);return {card,capable:!!card&&card.assigned>0&&card.status==='制作中'&&!card.storageLimited&&Number.isFinite(card.craftsPerSecond)&&card.craftsPerSecond>0&&!card.outputCapped};}
export function sceneWorkers(vm,{readOnly=false,limit=3}={}){
 const individuals=vm.bears?.individuals||[],jobs=vm.jobs||[],seen=new Set(),actors=[];
 const stopped=!!vm.settings?.paused||readOnly||!!vm.catchingUp||!!vm.pendingOffline||!!vm.pendingOperation||(vm.calendar?.day??0)<0;
 const upgraded=id=>vm.workshop?.some(c=>c.id===id&&(c.completed||c.owned>0));
 for(const resident of individuals){
  const job=resident.job||'idle';if(seen.has(job)||actors.length>=limit)continue;seen.add(job);
  // A representative engineer must reflect an actual active specialty, not an
  // unspecialized first resident while another engineer is producing.
  const bear=job==='engineer'?(individuals.find(b=>b.job===job&&engineerState(vm,b).capable)||individuals.find(b=>b.job===job&&engineerState(vm,b).card)||resident):resident;
  const cfg=workerStyles[job]||idleWorkerStyle,j=jobs.find(j=>j.id===job);
  const outputs=[cfg.resource];if(job==='geologist'&&upgraded('geodesy'))outputs.push('gold');if(job==='scholar'&&upgraded('astrophysicists'))outputs.push('starchart');
  const resources=outputs.map(id=>vm.resources?.find(r=>r.id===id)).filter(Boolean);
  let capped=resources.length>0&&resources.every(full),capable=!!workerStyles[job]&&resources.some(r=>(r.grossRate??0)>0&&!full(r));
  if(job==='engineer'){const e=engineerState(vm,bear);capped=!!e.card?.outputCapped;capable=e.capable;}
  if(job==='ambassador'){const a=vm.diplomacy?.ambassadors;capped=false;capable=!!a&&a.count>0&&a.paid>0&&a.tradeVolume>0;}
  const count=job==='engineer'?individuals.filter(b=>b.job==='engineer'&&b.engineerSpecialty===bear.engineerSpecialty).length:job==='idle'?(vm.bears.free||1):(j?.assigned||1);
  const working=capable&&!stopped&&!capped;
  actors.push({id:job,bearId:bear.id,bearName:bear.name,count,...cfg,name:j?.name||'待分配伙伴',activity:cfg.name,working,atCapacity:capped,lifeState:stopped?'paused':working?'working':'resting'});
 }
 return actors;
}
export function activityKey(vm,ui){return JSON.stringify(sceneWorkers(vm,{...ui,limit:Infinity}).map(w=>[w.bearId,w.bearName,w.id,w.count,w.working,w.atCapacity,w.lifeState]));}

// Stable lot anchors: a winding lane between offset homes, never compacted on unlock.
export function continuousLot(slot){return {x:slot%2?73:27,y:170+Math.floor(slot/2)*220+(slot%2?65:0)};}
export const VILLAGE_LOTS=[[27,27],[73,43],[27,68],[73,82]];
const workplace={farmer:['hive','pasture'],woodcutter:['lumberMill','hut','logHouse','barn'],scholar:['library','academy','observatory'],miner:['mine','quarry'],engineer:['workshop','factory','zebraWorkshop'],hunter:['tradepost','hut'],priest:['temple','chapel'],geologist:['mine','quarry','oilWell'],ambassador:['tradepost','harbor'],idle:['hut','logHouse','mansion']};
export function villageWorkers(vm,ui,built){
 // Filter before the representative limit; a bear never appears in every district.
 const all=sceneWorkers(vm,{...ui,limit:Infinity});
 const occupied=new Map();
 return all.map(w=>{const building=(workplace[w.id]||[]).map(id=>built.find(b=>b.id===id)).find(Boolean);if(!building){if(['home','village'].includes(ui.district||'village')&&['idle','woodcutter'].includes(w.id))return {...w,buildingId:'forest-edge',x:w.id==='idle'?52:14,y:290,z:291};return null;}const slot=building.sceneSlot,{x,y}=continuousLot(slot),n=occupied.get(building.id)||0;occupied.set(building.id,n+1);return {...w,buildingId:building.id,x:x+(slot%2?-13:14)+(n%2? (slot%2?24:-24):0),y:y+12+Math.floor(n/2)*32,z:Math.round(y+9)};}).filter(Boolean);
}
export function growthEvent(previous,next){
 if(!previous)return null;
 const prior=new Set((previous.science||[]).filter(c=>c.completed).map(c=>c.id));
 const research=(next.science||[]).find(c=>c.completed&&!prior.has(c.id));
 if(research)return {kind:'research',id:research.id,title:research.name,caption:'研究完成',art:'science'};
 const built=(next.buildings||[]).find(b=>b.owned>(previous.buildings||[]).find(p=>p.id===b.id)?.owned);
 if(built){const old=previous.buildings.find(b=>b.id===built.id),expanded=old?.owned>0&&(buildingLook(old).key!==buildingLook(built).key||buildingLook(old).tier!==buildingLook(built).tier);return {kind:'build',id:built.id,title:built.name,caption:expanded?'家园扩建':'建造完成',art:'building'};}
 const before=new Set((previous.bears?.individuals||[]).map(b=>b.id));
 const bear=(next.bears?.individuals||[]).find(b=>!before.has(b.id));
 if(bear)return {kind:'arrival',id:bear.id,title:bear.name||'新伙伴',caption:'搬进蜜林了',art:'bear'};
 const old=new Set((previous.buildings||[]).filter(b=>b.unlocked||b.owned).map(b=>b.id));
 const unlocked=(next.buildings||[]).find(b=>b.unlocked&&!old.has(b.id));
 if(unlocked)return {kind:'unlock',id:unlocked.id,title:unlocked.name,caption:'可以建造了',art:'building'};
 return null;
}

const buildingOutputs={hive:['honey','bees'],lumberMill:['wood','timber'],mine:['minerals','mining'],quarry:['minerals','mining'],library:['science','study'],academy:['science','study'],observatory:['science','study'],smelter:['iron','forge'],factory:['gear','workshop'],workshop:['gear','workshop']};
export function buildingActivity(card,vm,ui={}){
 const spec=buildingOutputs[card.id];if(!spec||!card.owned)return null;
 const [resource,kind]=spec,r=vm.resources?.find(r=>r.id===resource),stopped=vm.settings?.paused||ui.readOnly||vm.catchingUp||vm.pendingOffline||vm.pendingOperation||card.toggleable&&!card.enabled;
 const workers=sceneWorkers(vm,{...ui,limit:Infinity});
 const capable=kind==='workshop'?workers.some(w=>w.id==='engineer'&&w.working):kind==='study'?workers.some(w=>w.id==='scholar'&&w.working):(r?.grossRate||0)>0;
 const capped=r?.max!=null&&r.value>=r.max;
 return {kind,resource,working:!!capable&&!stopped&&!capped,stock:(r?.value||0)>0?Math.min(3,r.value<25?1:r.value<250?2:3):0};
}

export function buildingWorkKey(vm,ui={}){return JSON.stringify((vm.buildings||[]).filter(b=>b.owned>0).map(b=>{const a=buildingActivity(b,vm,ui);return a?[b.id,a.working,a.stock>0]:null;}).filter(Boolean));}


// Tiny, optional moments belong to presentation, never to the needs/economy loop.
// Stable copy and props do not use timers, randomness, or per-resident DOM growth.
const bearMoments={
 woodcutter:{work:'把木段码整齐',rest:'靠着木桩歇歇',lines:['这段木头的年轮，像一圈圈小路。','我喜欢新木头的清香。'],quiet:'斧头放好了，听一会儿树叶响。'},
 farmer:{work:'轻轻查看蜂框',rest:'坐在蜂箱旁赏花',lines:['轻一点，小蜜蜂也在忙呢。','今天的花香，飘得好远呀。'],quiet:'坐一会儿，看蜜蜂在花间绕圈。'},
 scholar:{work:'翻书，记下一句',rest:'把书摊在膝上',lines:['这一页真有意思，想慢慢读。','用一片叶子作书签，正合适。'],quiet:'书签夹好了，抬头看看云。'},
 hunter:{work:'在林边看看足迹',rest:'在林边听鸟鸣',lines:['这串脚印，从树根旁绕过去了。','森林里，每条小路都有故事。'],quiet:'今天的风，把鸟鸣送得很近。'},
 miner:{work:'敲一敲，看看矿纹',rest:'坐在石边歇脚',lines:['这块石头里，有一道亮亮的纹路。','慢慢敲，听听石头的声音。'],quiet:'把工具放稳，伸个小懒腰。'},
 engineer:{work:'比一比零件尺寸',rest:'收好工具看看图',lines:['再对齐一点点，就很漂亮了。','小零件，也有刚刚好的位置。'],quiet:'工具排好了，看着就很舒心。'},
 priest:{work:'整理林间心愿',rest:'在树荫下静坐',lines:['这片叶子，像一只小小的手。','愿大家今天都遇见一点好事。'],quiet:'安静坐一会儿，也很好。'},
 geologist:{work:'对照岩石样本',rest:'端详一颗小石子',lines:['两块石头，颜色只差一点点。','山里的故事，藏在这些纹路里。'],quiet:'这颗圆石头，摸起来真舒服。'},
 ambassador:{work:'整理旅途来信',rest:'看看远方的路',lines:['我想把蜜林的故事，讲给远方听。','信纸叠整齐，心意也好好收着。'],quiet:'等下次见面，再聊聊一路的风景。'},
 idle:{work:'在林间散步',rest:'坐在树荫里看云',lines:['这朵云，有点像一罐蜂蜜。','这里的树荫，刚好够一只熊。'],quiet:'不急，陪我看看云吧。'}
};
function momentFor(worker){return bearMoments[worker.id]||bearMoments.idle;}
/** Plain text only: the caller escapes this in its existing accessible dialog. */
export function bearConversation(vm,bearId,ui={}){
 const bear=(vm.bears?.individuals||[]).find(b=>String(b.id)===String(bearId));
 if(!bear)return null;
 const w=sceneWorkers({...vm,bears:{...vm.bears,individuals:[bear]}},{...ui,limit:1})[0];
 const moment=momentFor(w),seed=[...String(bear.id)].reduce((n,c)=>n+c.codePointAt(0),0);
 const paused=w.lifeState==='paused';
 return {name:bear.name||'小熊',job:w.name,activity:paused?'静静等候':w.working?moment.work:moment.rest,
  line:paused?'我在这里，等你准备好再继续。':w.atCapacity?'东西都放妥了，正好歇一会儿。':w.working?moment.lines[seed%moment.lines.length]:moment.quiet,
  status:paused?'暂歇':w.working?'忙里的一句话':w.atCapacity?'库存已满 · 休息中':'林间小憩',jobId:w.id};
}

// Small original ink props stay beside the existing aligned occupation sprites.
// Every coordinate is inside this decoration, never on the actor's hit target.
const lifeProps={
 woodcutter:'<path d="M5 12h18v7H5z" fill="var(--life-wood)"/><ellipse cx="7" cy="15.5" rx="4" ry="3.5"/><path d="M7 14v3m5-4h9m-9 4h8"/>',
 farmer:'<path d="M5 10h19l-2 10H7z" fill="var(--life-honey)"/><path d="M8 10c0-8 13-8 13 0m-11 4h10m-10 3h10"/>',
 scholar:'<path d="M3 8q6-3 12 0 6-3 12 0v11q-6-3-12 0-6-3-12 0z"/><path d="M15 8v11m-8-8 5 1m6 0 5-1"/><path class="bear-life-detail" d="m15 8 7-5v11l-7 5"/>',
 hunter:'<path d="m5 20 5-7 5 7m2-1 4-9 4 9" fill="var(--life-leaf)"/><path d="m9 20 1-5m11 4v-6"/>',
 miner:'<path d="m4 19 3-8 7-2 4 10zm12 0 3-5 6 1 3 4" fill="var(--life-stone)"/><path d="m7 11 5 3 2-5m-2 5 2 5"/>',
 engineer:'<path d="M4 13h23v7H4zm4 0V9h15v4" fill="var(--life-wood)"/><path d="M13 13v4h5v-4m0-4-1-6m-7 6 1-5"/>',
 priest:'<path d="M7 20h17M15 18V5m0 7q-8 0-8-7 8 0 8 7m0 3q8 0 8-7-8 0-8 7" fill="var(--life-leaf)"/>',
 geologist:'<path d="M3 16h25v4H3z" fill="var(--life-wood)"/><path d="m6 16-1-4 4-3 4 3-1 4m4 0-1-6 5-4 5 5-2 5" fill="var(--life-stone)"/>',
 ambassador:'<path d="M4 8h24v12H4z"/><path d="m4 8 12 8L28 8m-13 9-8 3m10-3 8 3"/><circle cx="16" cy="15" r="2" fill="var(--life-honey)"/>',
 idle:'<path d="M4 16h24v4H4z" fill="var(--life-wood)"/><path d="M8 20v2m16-2v2"/><path d="M20 15q-6-8 3-10 6 6-3 10z" fill="var(--life-leaf)"/><path d="m20 15 3-7"/>'
};
export function bearLifeMarkup(worker){
 const job=Object.hasOwn(lifeProps,worker.id)?worker.id:'idle';
 const state=['working','resting','paused'].includes(worker.lifeState)?worker.lifeState:worker.working?'working':'resting';
 return `<span class="bear-life life-${job}" data-life-state="${state}" aria-hidden="true"><svg class="bear-life-prop" viewBox="0 0 32 24" focusable="false">${lifeProps[job]}</svg><svg class="bear-life-leaf" viewBox="0 0 16 16" focusable="false"><path d="M3 12Q0 2 13 3Q14 13 3 12Z"/><path d="m3 12 7-6"/></svg></span>`;
}
