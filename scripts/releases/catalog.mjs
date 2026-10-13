import {catalog as complete, constants as originalConstants} from '../../src/engine/catalog.js';
import {releaseProfile} from './profiles.mjs';
import {writeFile, mkdir} from 'node:fs/promises';
import {resolve} from 'node:path';
const allowedEffects=new Set(['honey','bears','manpowerMax','scienceRatio','scienceMax','honeyMax','woodMax','mineralsMax','ironMax','honeyDemandReduction','mineralsRatio','pollution','woodRatio','craftRatio','farmerRatio','woodcutterRatio','lumberMillRatio','barnRatio','honeyPerWood','hunterRatio','hunterJobRatio','meteorIronEnabled']);
const removedEffects=new Set(['cultureMax','coalMax','titaniumMax','goldMax','explorerAtk','explorerDef']);
const definitionKeys=new Set(['id','name','cap','description','cost','ratio','effect','gate','type','conversion','opens','summary','output','amount','tier','difficulty','rate']);
const researchCopy={
 calendar:'记录季节更替，找到适合蜜蜂与小熊的生活节奏。',
 agriculture:'学会照料蜜蜂，安排养蜂熊稳定供应口粮。',
 archery:'制作狩猎工具，让巡林熊为营地积攒活力。',
 mining:'认识矿脉，开设石矿井与手作坊。',
 metal:'掌握冶炼方法，把木材与矿石变成铁。',
 animal:'了解林间动物，照料花间食圃，研究营造方法。',
 construction:'建造木屋、工料库与木材工场，让森林家园扎下根。',
};
export function makeChapterCatalog(chapter='forest'){
 const p=releaseProfile(chapter), result={};
 for(const section of ['resources','buildings','science','workshop','crafts','jobs']){
  result[section]=p[section].map(id=>{
   const original=complete[section].find(d=>d.id===id);if(!original)throw new Error(`Missing source ${section}/${id}`);
   for(const key of Object.keys(original))if(!definitionKeys.has(key))throw new Error(`Unreviewed definition field ${section}/${id}/${key}`);
   const d=structuredClone(original);
   if(d.effect){for(const key of Object.keys(d.effect))if(!allowedEffects.has(key)){if(!removedEffects.has(key))throw new Error(`Unreviewed effect ${id}/${key}`);delete d.effect[key];}}
   if(section==='science'){d.description=researchCopy[id];delete d.opens;}
   if(id==='warehouse')d.description='为木材、矿石与铁搭建专门的存放空间。';
   if(id==='manpower')d.description='巡林熊积攒的狩猎活力。';
   if(section==='jobs'&&id==='hunter')d.description='巡行森林，积攒用于狩猎的活力。';
   if(id==='bolas')d.summary='狩猎加成 +100%';
   if(id==='huntingArmor')d.summary='狩猎加成 +200%';
   if(id==='compositeBow')d.summary='巡林熊产出 +50%';
   if(id==='prospecting')d.summary='从陨石中发现铁。';
   return d;
  });
 }
 for(const d of result.science){d.opens=[...result.science,...result.buildings,...result.jobs].filter(x=>x.gate?.science===d.id||x.gate?.scienceAny?.includes(d.id)).map(x=>x.name);}
 // Explicit resource closure; no fallback to the complete catalogue at runtime.
 const ids=Object.fromEntries(Object.entries(result).map(([k,v])=>[k,new Set(v.map(d=>d.id))]));
 for(const [section,defs] of Object.entries(result))for(const d of defs){
  for(const [label,values] of Object.entries({cost:d.cost,input:d.conversion?.input,output:d.conversion?.output}))for(const r of Object.keys(values||{}))if(!ids.resources.has(r))throw new Error(`${section}/${d.id} ${label} references unavailable ${r}`);
  if(d.output&&!ids.resources.has(d.output))throw new Error(`Unavailable output ${d.output}`);
  const g=d.gate||{};for(const s of g.scienceAny||[])if(!ids.science.has(s))throw new Error(`Unavailable prerequisite ${s}`);
  if(g.science&&!ids.science.has(g.science))throw new Error(`Unavailable prerequisite ${g.science}`);
  for(const b of Object.keys(g.buildings||{}))if(!ids.buildings.has(b))throw new Error(`Unavailable building prerequisite ${b}`);
 }
 const {TICKS_PER_SECOND,TICKS_PER_DAY,DAYS_PER_SEASON,SEASONS_PER_YEAR,SEASONS,SEASON_FACTORS,MAX_OFFLINE_SECONDS}=originalConstants;
 return {catalog:result,constants:{TICKS_PER_SECOND,TICKS_PER_DAY,DAYS_PER_SEASON,SEASONS_PER_YEAR,SEASONS,SEASON_FACTORS,MAX_OFFLINE_SECONDS,SAVE_VERSION:1,SAVE_KEY:'beargame.chapters.save.v1'},release:{family:'beargame-chapters',chapter,contentLevel:p.level,schema:1,title:p.title,appVersion:'7.0.0'}};
}
export async function generateChapterCatalog(root,chapter='forest'){
 const data=makeChapterCatalog(chapter),dir=resolve(root,'src/chapters',chapter);await mkdir(dir,{recursive:true});
 const source='// Generated from the complete private source for this release only.\n'+Object.entries(data).map(([key,value])=>`export const ${key} = ${JSON.stringify(value,null,2)};`).join('\n')+'\n';
 await writeFile(resolve(dir,'catalog.js'),source);return data;
}
