/** 目标、筛选与获取路径均从当前快照推导，不写入游戏状态。 */
import {esc,fmt,cardsFor,discovered,knownBuilding} from './render.js';
import {shortages} from './experience.js';
import {timeLabel} from './decision-cards.js';
import {researchTopics} from './research-topics.js';

export function searchControl(state,value,label){return `<label class="decision-search">${esc(label)}<input type="search" data-ui-search="${state}" data-focus-key="search-${state}" value="${esc(value||'')}" placeholder="${esc(label.startsWith('搜索')?label:'搜索'+label)}" autocomplete="off"></label>`;}
export function filterControls(attr,value,entries){return `<div class="decision-filters" role="group" aria-label="筛选">${entries.map(([id,name])=>`<button class="filter-pill ${value===id?'selected':''}" data-${attr}="${id}" aria-pressed="${value===id}">${name}</button>`).join('')}</div>`;}
export function matchesQuery(c,query,extra=''){const term=(query||'').trim().toLocaleLowerCase();return !term||`${c.name} ${c.description||''} ${c.decisionBenefit||''} ${c.effects||''} ${(c.opens||[]).join(' ')} ${extra}`.toLocaleLowerCase().includes(term);}
export function buildChoices(vm,ui){
 const all=vm.buildings.filter(c=>knownBuilding(vm,c)),filter=all.length>10?(ui.buildFilter||'all'):'all';
 const storage=new Set(['barn','warehouse','harbor']),community=new Set(['hut','logHouse','mansion','library','academy','amphitheatre','temple','observatory']);
 const cards=all.filter(b=>(filter==='all'||filter==='storage'&&(b.capacityProvides?.length||storage.has(b.id))||filter==='community'&&community.has(b.id)||filter==='food'&&!storage.has(b.id)&&!community.has(b.id))&&matchesQuery(b,ui.buildQuery)&&(ui.buildAvailability!=='available'||b.available)&&(ui.buildAvailability!=='unbuilt'||!b.owned));
 return sortChoices(cards,ui.buildSort||'available',ui.recentBuildings,b=>['hive','pasture','aqueduct'].includes(b.id)?0:community.has(b.id)?1:storage.has(b.id)?2:3);
}
function sortChoices(cards,sort,recent=[],purpose=()=>0){
 const position=id=>{const i=(recent||[]).indexOf(id);return i<0?Infinity:i;};
 return [...cards].sort((a,b)=>sort==='available'?researchPriority(a)-researchPriority(b):sort==='recent'?position(a.id)-position(b.id):sort==='purpose'?purpose(a)-purpose(b):0);
}
export function recipeChoices(vm,ui={}){
 const cards=cardsFor(vm,'crafts').filter(discovered).filter(c=>matchesQuery(c,ui.recipeQuery,[...(c.costs||[]).map(cost=>cost.name||vm.resources?.find(r=>r.id===cost.id)?.name||cost.id),vm.resources?.find(r=>r.id===(c.output||c.id))?.name||''].join(' '))&&(ui.recipeAvailability!=='available'||c.available)&&(ui.recipeAvailability!=='blocked'||shortages(vm,c).some(s=>s.blocked)));
 const written=new Set(['parchment','manuscript','compendium','blueprint']),travel=new Set(['ship','tanker','kerosene','starchart']);
 return sortChoices(cards,ui.recipeSort||'available',ui.recentRecipes,c=>written.has(c.output||c.id)?1:travel.has(c.output||c.id)?2:0);
}
export const researchCategories=c=>researchTopics(c);
export const researchCategory=c=>researchCategories(c)[0];
export const researchPriority=c=>c.completed?2:c.available?0:1;
export function choiceStatus(c,vm){
 if(c.completed)return {label:'已完成',tone:'complete'};
 const missing=shortages(vm,c),blocked=missing.find(x=>x.blocked);
 if(blocked)return {label:`需扩容 · ${blocked.name}`,tone:'blocked'};
 if(c.available)return {label:c.type==='build'?'可建造':c.type==='craft'||c.type==='refine'?'可制作':'可完成',tone:'ready'};
 if(missing.length){const first=missing[0];return {label:`缺${first.name} ${fmt(first.missing,2)}${missing.length>1?` 等 ${missing.length} 项`:''}`,tone:'warning'};}
 return {label:c.reason||'等待条件',tone:'waiting'};
}
export function decisionStatus(c,vm,ui={}){if(c.completed)return '';const missing=shortages(vm,c);if(missing.some(x=>x.blocked))return '<p class="decision-status capacity-note">容量不足 · 需要扩容</p>';if(c.available)return '<p class="decision-status ready">物资齐备</p>';if(!missing.length)return `<p class="decision-status">${esc(c.reason||'条件尚未满足')}</p>`;const waits=missing.map(x=>x.rate>0?x.missing/x.rate:Infinity),wait=Math.max(...waits);return `<p class="decision-status">${missing.map(x=>`缺 ${fmt(x.missing,2)} ${esc(x.name)}`).join(' · ')}${Number.isFinite(wait)&&!vm.settings?.paused&&!ui.readOnly?`<small>按当前净产量约 ${timeLabel(wait)}；季节与消耗变化会影响时间</small>`:''}</p>`;}
export function decisionTools(c,section,vm,ui={}){
 if(c.completed||['queueOptions','gifts','actions','progressionActions','challenges'].includes(section))return '';
 const target=`${section}:${c.id}`,tracked=ui.trackedTarget?.section===section&&ui.trackedTarget?.id===c.id;
 const option=vm?.queue?.options?.find(o=>o.targetId===c.id&&o.targetType===(c.type||({buildings:'build',science:'research',workshop:'upgrade'})[section]));
 return `<div class="decision-tools"><button class="text-button" data-track-target="${esc(target)}" aria-pressed="${tracked}">${tracked?'取消追踪':'追踪目标'}</button>${option&&discovered(option)?`<button class="text-button" data-act="queueEnqueue" data-id="${esc(option.id)}" ${!option.available?'aria-disabled="true"':''} data-reason="${esc(option.reason)}">加入队列</button>`:''}</div>`;
}
export function prerequisiteMarkup(c,vm){if(!c.prerequisites?.length)return '';return `<div class="prerequisite-list"><b>前置条件</b>${c.prerequisites.map(p=>{const target=cardsFor(vm,p.section).find(c=>c.id===p.id),done=target?.completed||(target?.owned||0)>=p.count;return `<span>${p.alternative?'任选其一 · ':''}${done?'✓':p.alternative?'可选':'待完成'} ${discovered(target)?`<button class="text-button" data-detail="${p.section}:${esc(p.id)}">${esc(p.name)}${p.count>1?' ×'+fmt(p.count):''}</button>`:esc(p.name)}</span>`;}).join('')}</div>`;}
export function acquisitionOptions(vm,id,{blocked=false}={}){
 const facilities=[...(vm.buildings||[]).filter(c=>knownBuilding(vm,c)).map(c=>({...c,section:'buildings'})),...['space','faith','time'].flatMap(section=>cardsFor(vm,section).filter(discovered).map(c=>({...c,section})))];
 const links=[],add=(label,attr)=>{if(!links.some(x=>x.label===label))links.push({label,attr});};
 if(blocked){for(const c of facilities)if(c.capacityProvides?.includes(id))add(`扩容：${c.name}`,`data-detail="${c.section}:${esc(c.id)}"`);}
 else{
  for(const c of vm.crafts||[])if(discovered(c)&&(c.output===id||c.provides?.includes(id)))add(`制作：${c.name}`,`data-acquire-recipe="${esc(c.id)}"`);
  for(const j of vm.jobs||[])if(discovered(j)&&j.output===id)add(`分配${j.name}`,`data-nav="village" data-job-focus="${esc(j.id)}"`);
  for(const c of facilities)if(c.provides?.includes(id))add(`生产：${c.name}`,`data-detail="${c.section}:${esc(c.id)}"`);
  if((vm.trades||[]).some(c=>discovered(c)&&c.tradePreview?.goods.some(g=>g.id===id&&g.totalChance>0)))add('查看贸易回报','data-system="trades"');
  if(id==='honey')add('回家采蜜','data-nav="home"');
 }
 return links;
}
export function acquisitionMarkup(vm,id,options={}){
 const links=acquisitionOptions(vm,id,options);
 return links.length?`<div class="acquisition-links">${links.slice(0,5).map(x=>`<button class="text-button" ${x.attr}>${esc(x.label)}</button>`).join('')}</div>`:'';
}
export function immediateShortages(c,section,vm){
 const missing=shortages(vm,c),first=missing.find(x=>x.blocked)||missing.find(x=>x.rate<=0)||missing[0];
 if(!first)return '';
 const link=acquisitionOptions(vm,first.id,{blocked:first.blocked})[0];
 return `<div class="immediate-shortages" data-task-target="${esc(section)}:${esc(c.id)}"><span>${esc(first.name)}${first.blocked?'需扩容':'还缺 '+fmt(first.missing,2)}</span>${link?`<button class="text-button" ${link.attr}>${esc(link.label)}</button>`:`<button class="text-button" data-resource="${esc(first.id)}">查看来源与条件</button>`}${missing.length>1?`<button class="text-button" data-detail="${esc(section)}:${esc(c.id)}">全部 ${missing.length} 项缺口</button>`:''}</div>`;
}
export function missingLinks(c,vm){const section=({build:'buildings',research:'science',upgrade:'workshop',policy:'policies',craft:'crafts',refine:'crafts',faith:'faith',space:'space',time:'time'})[c.type];return shortages(vm,c).map(x=>`<div class="missing-resource"${section?` data-task-target="${section}:${esc(c.id)}"`:''}><b>${esc(x.name)}${x.blocked?'容量不足':''}</b>${acquisitionMarkup(vm,x.id,{blocked:x.blocked})||'<small>继续推进研究以解锁获取方式。</small>'}</div>`).join('');}
export function trackedGoal(vm,ui={}){
 const t=ui.trackedTarget;if(!t)return '';
 const c=cardsFor(vm,t.section).find(c=>c.id===t.id);if(!c||!discovered(c))return '';
 const travelling=c.family==='mission'&&c.travelDays>0,completed=!travelling&&(c.completed||c.reached||(Number.isFinite(t.targetOwned)&&(c.owned||0)>=t.targetOwned)),status=choiceStatus(c,vm);
 const arrival=vm.settings?.paused?'正在航行 · 已随游戏暂停':ui.readOnly?'正在航行 · 本页只读':`正在航行 · ${Number.isFinite(c.travelSeconds)?`约 ${timeLabel(c.travelSeconds)} 后抵达`:`还需 ${fmt(c.travelDays,2)} 个游戏日`}`;
 const missing=shortages(vm,c),description=travelling?arrival:completed?'目标已完成':c.available?'物资齐备，可以完成':missing.slice(0,2).map(x=>x.blocked?`${x.name}需扩容`:`缺${x.name} ${fmt(x.missing,2)}`).join(' · ')+(missing.length>2?` 等 ${missing.length} 项`:'')||status.label;
 return `<section class="tracked-goal task-strip state-${travelling?'waiting':completed?'complete':status.tone}" aria-label="当前追踪目标"><button class="text-button tracked-goal-main" data-resume-target="${esc(t.section)}:${esc(c.id)}"><span><b>追踪：${esc(c.name)}</b><small>${esc(description)}</small></span><span class="target-return">${travelling?'查看航程':completed?'查看成果':'返回目标'}</span></button><button class="text-button tracked-goal-cancel" data-track-target="${esc(t.section)}:${esc(c.id)}" aria-label="取消追踪${esc(c.name)}">取消追踪</button></section>`;
}
export function facilityState(b,vm){
 if(b.toggleable&&!b.enabled)return {label:'已暂停',tone:'idle'};
 const conversion=vm.progression?.conversions?.find(c=>c.id===b.id);
 if(conversion&&conversion.scale+1e-8<conversion.total)return {label:'原料不足',tone:'warning'};
 if(['factory','accelerator','calciner','chronosphere'].includes(b.id)&&vm.energy?.supply<vm.energy?.demand)return {label:'电力不足',tone:'blocked'};
 const outputs=(b.provides||[]).map(id=>vm.resources?.find(r=>r.id===id)).filter(Boolean);
 if(outputs.length&&outputs.every(r=>r.max!=null&&r.value>=r.max))return {label:'产物满仓',tone:'full'};
 return {label:'',tone:'normal'};
}
export const facilityStatus=(b,vm)=>facilityState(b,vm).label;
