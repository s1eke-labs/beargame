/** 目标、筛选与获取路径均从当前快照推导，不写入游戏状态。 */
import {esc,fmt,cardsFor,discovered,knownBuilding} from './render.js';
import {shortages} from './experience.js';
import {timeLabel} from './decision-cards.js';

export function searchControl(state,value,label){return `<label class="decision-search">${label}<input type="search" data-ui-search="${state}" data-focus-key="search-${state}" value="${esc(value||'')}" placeholder="搜索${label}" autocomplete="off"></label>`;}
export function filterControls(attr,value,entries){return `<div class="decision-filters" role="group" aria-label="筛选">${entries.map(([id,name])=>`<button class="filter-pill ${value===id?'selected':''}" data-${attr}="${id}" aria-pressed="${value===id}">${name}</button>`).join('')}</div>`;}
export function matchesQuery(c,query){const term=(query||'').trim().toLocaleLowerCase();return !term||`${c.name} ${c.description||''} ${c.effects||''} ${(c.opens||[]).join(' ')}`.toLocaleLowerCase().includes(term);}
export function buildChoices(vm,ui){
 const all=vm.buildings.filter(c=>knownBuilding(vm,c)),filter=all.length>10?(ui.buildFilter||'all'):'all';
 const storage=new Set(['barn','warehouse','harbor']),community=new Set(['hut','logHouse','mansion','library','academy','amphitheatre','temple','observatory']);
 return all.filter(b=>(filter==='all'||filter==='storage'&&(b.capacityProvides?.length||storage.has(b.id))||filter==='community'&&community.has(b.id)||filter==='food'&&!storage.has(b.id)&&!community.has(b.id))&&matchesQuery(b,ui.buildQuery)&&(ui.buildAvailability!=='available'||b.available)&&(ui.buildAvailability!=='unbuilt'||!b.owned));
}
export function researchCategory(c){const text=`${c.name} ${c.effects||''} ${(c.opens||[]).join(' ')}`;if(/容量|储存|仓|库存/.test(text))return 'storage';if(/住处|幸福|人口|节庆|小熊|领袖|岗位/.test(text))return 'village';if(/贸易|商团|航|星际|太空|探索|远行/.test(text))return 'exploration';return 'production';}
export function decisionStatus(c,vm,ui={}){if(c.completed)return '';const missing=shortages(vm,c);if(missing.some(x=>x.blocked))return '<p class="decision-status capacity-note">容量不足 · 需要扩容</p>';if(c.available)return '<p class="decision-status ready">物资齐备</p>';if(!missing.length)return `<p class="decision-status">${esc(c.reason||'条件尚未满足')}</p>`;const waits=missing.map(x=>x.rate>0?x.missing/x.rate:Infinity),wait=Math.max(...waits);return `<p class="decision-status">${missing.map(x=>`缺 ${fmt(x.missing,2)} ${esc(x.name)}`).join(' · ')}${Number.isFinite(wait)&&!vm.settings?.paused&&!ui.readOnly?`<small>按当前净产量约 ${timeLabel(wait)}；季节与消耗变化会影响时间</small>`:''}</p>`;}
export function decisionTools(c,section,vm,ui={}){
 if(c.completed||['queueOptions','gifts','actions','progressionActions','challenges'].includes(section))return '';
 const target=`${section}:${c.id}`,tracked=ui.trackedTarget?.section===section&&ui.trackedTarget?.id===c.id;
 const option=vm?.queue?.options?.find(o=>o.targetId===c.id&&o.targetType===(c.type||({buildings:'build',science:'research',workshop:'upgrade'})[section]));
 return `<div class="decision-tools"><button class="text-button" data-track-target="${esc(target)}" aria-pressed="${tracked}">${tracked?'取消追踪':'追踪目标'}</button>${option&&discovered(option)?`<button class="text-button" data-act="queueEnqueue" data-id="${esc(option.id)}" ${!option.available?'aria-disabled="true"':''} data-reason="${esc(option.reason)}">加入队列</button>`:''}</div>`;
}
export function prerequisiteMarkup(c,vm){if(!c.prerequisites?.length)return '';return `<div class="prerequisite-list"><b>前置条件</b>${c.prerequisites.map(p=>{const target=cardsFor(vm,p.section).find(c=>c.id===p.id),done=target?.completed||(target?.owned||0)>=p.count;return `<span>${p.alternative?'任选其一 · ':''}${done?'✓':p.alternative?'可选':'待完成'} ${discovered(target)?`<button class="text-button" data-detail="${p.section}:${esc(p.id)}">${esc(p.name)}${p.count>1?' ×'+fmt(p.count):''}</button>`:esc(p.name)}</span>`;}).join('')}</div>`;}
export function acquisitionMarkup(vm,id,{blocked=false}={}){
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
 return links.length?`<div class="acquisition-links">${links.slice(0,5).map(x=>`<button class="text-button" ${x.attr}>${esc(x.label)}</button>`).join('')}</div>`:'';
}
export function missingLinks(c,vm){return shortages(vm,c).map(x=>`<div class="missing-resource"><b>${esc(x.name)}${x.blocked?'容量不足':''}</b>${acquisitionMarkup(vm,x.id,{blocked:x.blocked})||'<small>继续推进研究以解锁获取方式。</small>'}</div>`).join('');}
export function trackedGoal(vm,ui={}){const t=ui.trackedTarget;if(!t)return '';const c=cardsFor(vm,t.section).find(c=>c.id===t.id);if(!c||!discovered(c))return '';return `<section class="tracked-goal"><button class="text-button" data-detail="${esc(t.section)}:${esc(c.id)}">追踪：${esc(c.name)}${c.completed?' · 已完成':''}</button>${decisionStatus(c,vm,ui)}<button class="text-button" data-track-target="${esc(t.section)}:${esc(c.id)}">取消追踪</button></section>`;}
export function facilityStatus(b,vm){
 if(b.toggleable&&!b.enabled)return '已暂停';
 const conversion=vm.progression?.conversions?.find(c=>c.id===b.id);
 if(conversion&&conversion.scale+1e-8<conversion.total)return '原料不足';
 if(['factory','accelerator','calciner','chronosphere'].includes(b.id)&&vm.energy?.supply<vm.energy?.demand)return '电力不足';
 const outputs=(b.provides||[]).map(id=>vm.resources?.find(r=>r.id===id)).filter(Boolean);
 if(outputs.length&&outputs.every(r=>r.max!=null&&r.value>=r.max))return '产物满仓';
 return '';
}
