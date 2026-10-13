/** Independently implemented grassland visitors, specialist research and hunting. */
import {limitedDR} from './math.js';
const n=(map,id)=>map?.[id]||0;
const active=(s,id)=>s.disabled?.[id]?0:Math.min(n(s.buildings,id),s.activeBuildings?.[id]??n(s.buildings,id));
const upgrade=(id,name,cost,gate,description,effect={})=>({id,name,type:'upgrade',cost,gate,description,summary:description,effect,special:true});
export const tribalUpgrades=[
 upgrade('darkRevolution','条纹传承',{bloodstone:15,science:100},{buildings:{zebraWorkshop:1}},'条纹前哨增加巡林准备；独行营地每座 +1，普通营地每座 +0.1。'),
 upgrade('darkBrew','夜蜜酿法',{bloodstone:1,parchment:3000,science:100},{buildings:{brewery:1}},'节庆期间，条纹旅熊的每日到访几率提高到平日的 2 倍，并叠加蜜酿坊迎宾加成。'),
 upgrade('zebraTrappers','条纹猎营',{science:1000,alloy:100,tMythril:10},{workshop:'darkRevolution'},'前哨提供的巡林准备翻倍。',{preparationRatio:1}),
 upgrade('reforgedOutposts','前哨重铸',{science:1500,coal:10000,bloodstone:50,tMythril:10},{workshop:'zebraTrappers'},'每满 10 座条纹熔炉，前哨准备系数再增加 1。'),
 upgrade('whispers','白枝密语',{tMythril:5},{buildings:{zebraForge:1}},'白枝研磨堂可消耗象牙、钛与星翼鹿，自动提炼矿石和秘银。'),
 upgrade('minerologyDepartment','陨石研究室',{science:75000,compendium:75},{science:'archeology'},'每座山林学院让陨石带来的矿石、铁和观测知识增加 1%。'),
 upgrade('bloodstoneInstitute','赤晶研究所',{science:85000,blueprint:50,bloodstone:25,tMythril:10},{workshop:'minerologyDepartment'},'条纹工房依照旅熊容量与巡林准备，提高狩猎发现血石的机会。'),
 upgrade('rangefinders','远距测量仪',{science:100000,tMythril:50,microchip:25},{workshop:['bloodstoneInstitute','railgun']},'每座条纹熔炉增加 1% 血石发现加成。')
];
export function zebraCapacity(s){return 1+(s.zebraKarma||0)+n(s.buildings,'stasisPod');}
export function tribalEffects(s){
 const forgePreparation=s.workshop.reforgedOutposts?Math.floor(n(s.buildings,'zebraForge')/10):0;
 const preparationRatio=(s.workshop.zebraTrappers?1:0)+forgePreparation;
 const preparation=s.workshop.darkRevolution?active(s,'zebraOutpost')*(s.ironWill?1:.1)*(1+preparationRatio):0;
 const capacity=zebraCapacity(s),workshops=active(s,'zebraWorkshop');
 const institute=s.workshop.bloodstoneInstitute?.01*limitedDR(workshops*(s.ironWill?1:.1)*capacity,41+preparation):0;
 return {zebraPreparations:preparation,bloodstoneRatio:institute+(s.workshop.rangefinders?.01*active(s,'zebraForge'):0),academyMeteorBonus:s.workshop.minerologyDepartment?.01*active(s,'academy'):0};
}
export function zebraManpower(s,e={}){
 const visitors=n(s.resources,'zebras');
 return visitors>0?.15+limitedDR(Math.max(0,visitors-1)*.05,2+Math.floor(e.zebraPreparations||0)*.05):0;
}
export function extendTribalProduction(ctx,p){
 const s=ctx.state,e=p.effects,base=zebraManpower(s,e);if(!base)return p;
 const holy=s.activeHolyGenocide||0;
 const quantity=base*((1+.02*holy)/(1+limitedDR(-.01*holy,1)))*(1+(e.hunterJobRatio||0))*(1+(e.manpowerRatio||0))*(1+(e.manpowerGlobalRatio||0))*(1+(e.manpowerSuperRatio||0))*p.globalProduction;
 p.gross.manpower+=quantity;p.net.manpower+=quantity;return p;
}
export function onTribalDay(ctx){
 const s=ctx.state;if(s.calendar.day<0)return;
 const e=ctx.effects(),visitors=n(s.resources,'zebras'),cap=zebraCapacity(s);
 if(s.ironWill&&s.science.archery){
  if(!visitors){ctx.add('zebras',1);ctx.log('一位条纹旅熊来到独行营地，帮忙巡守森林。','arrival');}
  else if(visitors<cap){const chance=s.workshop.darkBrew&&s.festivalDays>0?2+(e.festivalArrivalRatio||0):1;if(Math.floor(ctx.nextRandom(s)*100000)<=500*chance){ctx.add('zebras',1);ctx.log('又一位条纹旅熊来到林间。','arrival');}}
 }else if(!s.ironWill&&visitors){
  const retained=Math.floor(cap*(s.metaphysics.zebraCovenant?.5:s.metaphysics.zebraDiplomacy?.1:0));
  if(visitors>retained){s.resources.zebras=retained;ctx.log('部分条纹旅熊告别营地，踏上新的旅程。','arrival');}
 }
 // The first two spirit deer remain reachable while ordinary hunting is prohibited.
 const rare=(ctx.isChallenge?.('pacifism')&&s.science.animal)||(s.ironWill&&s.science.archery);
 if(rare&&n(s.resources,'unicorns')<2){const ratio=(s.metaphysics.unicornmancy?1.1:1)*(1+(e.timeRatio||0)*.25);if(Math.floor(ctx.nextRandom(s)*100000)<=17*ratio){ctx.add('unicorns',1);ctx.log('一只灵鹿悄悄走进了花地。','event');}}
}
export function tribalHunt(ctx,squads,p){
 const s=ctx.state,e=p.effects,gains={};let stones=n(s.resources,'bloodstone');
 if(n(s.resources,'zebras')>=10){let found=0;for(let i=0;i<squads;i++){const chance=(stones>0?.005:.05)*(1+(e.bloodstoneRatio||0));if(ctx.nextRandom(s)<chance){stones++;found++;}}if(found)gains.bloodstone=found;}
 if(s.ironWill&&s.workshop.goldOre){let gold=0;for(let i=0;i<squads;i++)if(ctx.nextRandom(s)<.25)gold+=5*ctx.nextRandom(s)+5*(e.hunterRatio||0)*ctx.nextRandom(s);if(gold)gains.gold=gold;}
 return gains;
}
export function tribalView(s,e={}){
 return {visitors:n(s.resources,'zebras'),capacity:zebraCapacity(s),inheritedCapacity:s.zebraKarma||0,preparations:e.zebraPreparations||0,bloodstoneBonus:e.bloodstoneRatio||0,manpowerPerTick:zebraManpower(s,e)};
}
