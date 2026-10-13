import {geographicRegions} from './districts.js';

const known = card => card && (card.unlocked || card.owned>0 || card.completed || card.assigned>0);
const names = cards => cards.slice(0,3).map(card=>card.name).join('、')+(cards.length>3?`等 ${cards.length} 项`:'');
export function discoveryNotices(previous,next) {
  if(!previous||!next||next.pendingOffline||next.pendingOperation||next.stats?.totalResets!==previous.stats?.totalResets||next.stats?.totalTicks<previous.stats?.totalTicks)return [];
  const notices=[];
  for(const [section,label,route,researchTab] of [['buildings','建筑','build',''],['science','研究','research','science'],['workshop','技艺','research','workshop'],['jobs','岗位','village','']]) {
    const before=new Set((previous[section]||[]).filter(known).map(card=>card.id));
    const fresh=(next[section]||[]).filter(card=>known(card)&&!before.has(card.id));
    if(fresh.length)notices.push({id:`discovery:${section}:${fresh.map(c=>c.id).sort().join(',')}`,title:`新的${label}已开启`,body:`现在可以查看${names(fresh)}。`,route,researchTab});
  }
  for(const [key,label,field] of [['trades','森林商旅','trades'],['faith','星灯祈愿','faithCards'],['space','远航计划','spaceCards'],['challenges','时光研究','time']]) {
    const cards=snapshot=>snapshot.progression?.[field]||snapshot[field]||[];
    if(!cards(previous).some(known)&&cards(next).some(known))notices.push({id:`system:${key}`,title:`${label}已开启`,body:'前往查看新的选择，也可以把常用功能固定到更多页。',route:`more/${key}`});
  }
  const locations=new Map(geographicRegions(previous).flatMap(region=>region.facilities.map(card=>[`${card.section}:${card.id}`,region.id])));
  for(const region of geographicRegions(next)) {
    const moved=region.facilities.filter(card=>locations.has(`${card.section}:${card.id}`)&&locations.get(`${card.section}:${card.id}`)!==region.id);
    if(moved.length)notices.push({id:`region:${region.id}:${moved.map(c=>`${c.section}-${c.id}`).sort().join(',')}`,title:`设施已归入${region.name}`,body:`${names(moved)}现在位于${region.name}，数量和效果保持不变。`,route:`home/${region.id}`});
  }
  return notices;
}
