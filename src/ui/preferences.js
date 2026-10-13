// 仅保存界面偏好与阅读记录，不写入游戏规则存档。
const ids = value => Array.isArray(value) ? [...new Set(value.filter(id => typeof id === 'string' && /^[\w-]{1,80}$/.test(id)))].slice(0,3) : [];
const target = value => value && ['buildings','science','workshop','policies','crafts','space','time','faith'].includes(value.section) && typeof value.id === 'string' && /^[\w-]{1,80}$/.test(value.id) ? {section:value.section,id:value.id,...(Number.isFinite(value.targetOwned)&&value.targetOwned>0?{targetOwned:value.targetOwned}:{})} : null;
const recent = value => Array.isArray(value) ? [...new Set(value.filter(id=>typeof id==='string'&&/^[\w-]{1,80}$/.test(id)))].slice(0,12) : [];
export function normalizePreferences(value, reducedMotion = false) {
  const source=value && typeof value==='object' ? value : {};
  return {reducedMotion:typeof source.reducedMotion==='boolean'?source.reducedMotion:reducedMotion,
    textSize:source.textSize==='large'?'large':'normal',resourcePins:ids(source.resourcePins),
    systemPins:ids(source.systemPins).filter(id=>['crafts','trades','faith','space','prestige','challenges','achievements'].includes(id)),
    trackedTarget:target(source.trackedTarget),notices:normalizeNotices(source.notices),
    managementMapCollapsed:source.managementMapCollapsed===true,
    buildSort:['purpose','available','recent'].includes(source.buildSort)?source.buildSort:'available',
    recipeSort:['purpose','available','recent'].includes(source.recipeSort)?source.recipeSort:'available',
    recentBuildings:recent(source.recentBuildings),recentRecipes:recent(source.recentRecipes)};
}
export function normalizeNotices(value) {
  if(!Array.isArray(value))return [];
  return value.filter(item=>item && typeof item.id==='string' && typeof item.title==='string' && typeof item.body==='string')
    .slice(0,80).map(item=>({id:item.id.slice(0,160),title:item.title.slice(0,160),body:item.body.slice(0,600),
      route:/^(?:home(?:\/[\w-]+)?|build|research|village|more(?:\/[\w-]+)?)$/.test(item.route)?item.route:'',
      researchTab:['science','workshop','policies'].includes(item.researchTab)?item.researchTab:'',
      read:item.read===true,year:Number.isFinite(item.year)?Math.max(0,item.year):0}));
}
export function addNotices(existing, incoming, year=0) {
  const items=normalizeNotices(incoming.map(item=>({...item,year}))),seen=new Set();
  return [...items,...normalizeNotices(existing)].filter(item=>{if(seen.has(item.id))return false;seen.add(item.id);return true;}).slice(0,80);
}
export function togglePin(pins,id) {
  return pins.includes(id)?pins.filter(value=>value!==id):[...pins.slice(-2),id];
}
