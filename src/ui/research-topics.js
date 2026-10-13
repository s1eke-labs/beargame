/** 研究主题来自目录中的效果与解锁关系，不依赖中文文案，也不修改规则。 */
import {buildings,science,workshop,policies,crafts,jobs,trades,space,faith,time} from '../engine/catalog.js';

const groups={buildings,science,workshop,policies,crafts,jobs,trades,space,faith,time};
const definitions=Object.entries(groups).flatMap(([section,cards])=>cards.map(card=>({section,card})));
const index=new Map(definitions.map(({section,card})=>[`${section}:${card.id}`,card]));
const sections={research:'science',upgrade:'workshop',policy:'policies'};
const order=['production','storage','village','exploration'];
const villageIds=new Set(['civil','drama','civilService','register','huntingArmor','bolas','compositeBow','crossbow','railgun','logistics','augumentation','monarchy','authocracy','republic','fascism','stoicism','epicurianism']);
const explorationIds=new Set(['archery','navigation','astronomy','rocketry','orbitalEngineering','exogeology','advExogeology','spaceManufacturing','diplomacy','caravanserai','goldOre','invisibleBlackHand']);
const values=value=>typeof value==='string'?[value]:Array.isArray(value)?value:Object.keys(value||{});
const dependents=new Map(),topicCache=new Map();
for(const entry of definitions){
 if(entry.section==='science')continue;
 const gate=entry.card.gate||{};
 for(const [section,ids] of [['science',[...values(gate.science),...values(gate.scienceAny)]],['workshop',values(gate.workshop)]])for(const id of ids){
  const key=`${section}:${id}`;
  if(!dependents.has(key))dependents.set(key,[]);
  dependents.get(key).push(entry);
 }
}

function tagsFor(card,section){
 const tags=new Set(),keys=Object.keys(card.effect||{});
 if((card.capacityProvides||[]).length||keys.some(key=>/Max|Capacity|Storage|storage|warehouse|barn|Cap$/.test(key)))tags.add('storage');
 if(section==='jobs'||villageIds.has(card.id)||keys.some(key=>/bears|happiness|unhappiness|skill|leader|festival|luxury|arrival|Population/i.test(key)))tags.add('village');
 if(['trades','space'].includes(section)||explorationIds.has(card.id)||keys.some(key=>/trade|route|ship|star|space|relations|embassy|harbor/i.test(key)))tags.add('exploration');
 if(['crafts','jobs'].includes(section)||card.conversion||card.output||(card.provides||[]).length||keys.some(key=>!/Max|Capacity|Storage|storage|warehouse|barn|Cap$|bears|happiness|unhappiness|leader|festival|luxury|arrival|Population|trade|route|ship|relations|embassy/i.test(key)))tags.add('production');
 return tags;
}

export function researchTopics(card){
 const section=sections[card.type]||(['science','workshop','policies'].find(key=>index.has(`${key}:${card.id}`))??'science');
 const key=`${section}:${card.id}`,known=index.has(key);
 if(known&&topicCache.has(key))return [...topicCache.get(key)];
 const definition=index.get(key)||card,tags=tagsFor(definition,section);
 // 只查看直接开启的设施、岗位和技艺，避免递归把所有后续主题都混入当前研究。
 for(const entry of dependents.get(key)||[])for(const tag of tagsFor(entry.card,entry.section))tags.add(tag);
 if(!tags.size)tags.add('production');
 const result=order.filter(tag=>tags.has(tag));
 if(known)topicCache.set(key,result);
 return [...result];
}
