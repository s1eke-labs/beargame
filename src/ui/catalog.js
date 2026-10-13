import {esc,fmt,art,cardArt,rate} from './render.js';
import {choiceStatus} from './decision-navigation.js';

export function itemCatalog(cards,section,selectedId,vm){
  const building=section==='buildings';
  return `<div class="item-catalog" role="group" aria-label="${building?'全部建筑':'全部配方'}">${cards.map(c=>{
    const status=choiceStatus(c,vm),effects=Array.isArray(c.effects)?c.effects.join(' · '):c.effects;
    const benefit=building?effects||c.description:`产出${vm.resources.find(r=>r.id===(c.output||c.id))?.name||c.name}`;
    return `<button class="catalog-option ${c.id===selectedId?'selected':''}" data-${building?'build':'recipe'}-choice="${esc(c.id)}" aria-pressed="${c.id===selectedId}"><span class="catalog-art">${building?cardArt(c,section):art('resource',c.output||c.id)}</span><span class="catalog-copy"><b>${esc(c.type==='refine'?'采木':c.name)}${building?` · ${fmt(c.owned||0)} 座`:''}</b><span class="catalog-benefit">${building&&effects?'基础：':''}${esc(benefit)}</span><span class="choice-status state-${status.tone}">${esc(status.label)}</span><small>需要 ${(c.costs||[]).slice(0,2).map(x=>`${fmt(x.value,1)} ${esc(x.name)}`).join('、')||'无需物资'}${c.costs?.length>2?' 等':''}</small></span></button>`;
  }).join('')}</div>`;
}

export function purchasePreview(vm,id){
  const p=vm.buildingPreviews?.find(item=>item.id===id);if(!p)return '';
  const rows=[];
  for(const r of p.resources||[]){
    if(Math.abs(r.rateDelta)>1e-8)rows.push(`<p>${esc(r.name)}净产量 ${rate(r.beforeRate)} → <b>${rate(r.afterRate)}</b></p>`);
    if(r.beforeCapacity!==r.afterCapacity)rows.push(`<p>${esc(r.name)}容量 ${fmt(r.beforeCapacity)} → <b>${fmt(r.afterCapacity)}</b></p>`);
  }
  if(p.housing?.delta)rows.unshift(`<p>住处 ${fmt(p.housing.before)} → <b>${fmt(p.housing.after)}</b></p>`);
  const e=p.energy;
  if(e&&(e.beforeSupply!==e.afterSupply||e.beforeDemand!==e.afterDemand))rows.push(`<p>电力供给 ${fmt(e.beforeSupply,2)} → ${fmt(e.afterSupply,2)}；需求 ${fmt(e.beforeDemand,2)} → ${fmt(e.afterDemand,2)}</p>`);
  if(e&&e.beforeEfficiency!==e.afterEfficiency)rows.push(`<p>能源效率 ${fmt(e.beforeEfficiency*100,1)}% → ${fmt(e.afterEfficiency*100,1)}%</p>`);
  const note=p.mode==='structure'?'物资未齐，以下预估未扣除建造费用。':vm.settings?.paused?'游戏已暂停，以下为恢复后的生产变化。':'按当前季节、库存与加成计算。';
  return `<section class="purchase-preview" aria-label="建成后的变化"><strong>${p.mode==='structure'?'新增设施预估':'建成后的变化'}</strong><small>${note}</small>${rows.slice(0,2).join('')||'<p>当前没有直接资源收支变化，其他作用见详情。</p>'}<details data-fold="purchase-preview-${esc(id)}"><summary>${rows.length>2?`另有 ${rows.length-2} 项变化与计算说明`:'计算说明'}</summary>${rows.slice(2).join('')}<p>${esc(p.note)}</p></details></section>`;
}
