/** Original woodland milestones. Facts and verification matrix live outside the shipped source. */
import {limitedDR,triangularInverse} from './math.js';

const count=(map,key)=>map?.[key]||0;
const inTrial=(s,id)=>s.challenge===id||s.activeChallenges?.includes(id);
const built=(s,id)=>count(s.buildings,id);
const active=(s,id)=>s.disabled?.[id]?0:Math.min(built(s,id),s.activeBuildings?.[id]??built(s,id));
const flight=(s,id)=>count(s.space,id)>0;
const reached=(s,id)=>!!s.spaceReached?.[id];
const noCompany=s=>s.ironWill&&s.bears.length===0;
const checkState=s=>(s.achievementState??=createAchievementState());
const transient=new WeakMap();
const local=s=>{if(!transient.has(s))transient.set(s,{lastTick:-1,gatherCount:0,lastGather:null});return transient.get(s);};

// Definitions contain only our prose and rule predicates. Their identifiers are independent.
const milestone=(id,name,description,test,extra={})=>({id,name,description,test,...extra});
export const achievementDefinitions=Object.freeze([
 milestone('forestGuest','花径上的新邻居','营地第一次迎来了灵鹿。',s=>count(s.resources,'unicorns')>0),
 milestone('dewKeepsake','捧住一滴星露','拥有灵鹿祭仪留下的灵露。',s=>count(s.resources,'tears')>0),
 milestone('wingedGuest','树冠以上的来客','拥有一只天翼鹿。',s=>count(s.resources,'alicorn')>0),
 milestone('nightGuest','月影中的脚步','拥有一只夜影鹿。',s=>count(s.resources,'necrocorn')>0),
 milestone('crystalMemory','把时光装进蜜罐','拥有一枚时晶。',s=>count(s.resources,'timeCrystal')>0),
 milestone('hundredStones','百颗沉静的心愿','拥有至少 100 泪石。',s=>count(s.resources,'sorrow')>=100),
 milestone('stripedCompany','并肩巡过山林','拥有超过一位条纹猎手。',s=>count(s.resources,'zebras')>1),
 milestone('loneQuarry','独自敲开的山门','保持独行模式、没有小熊，并建成石矿井。',s=>noCompany(s)&&built(s,'mine')>0),
 milestone('loneStore','独自码好的木箱','保持独行模式、没有小熊，并建成工料库。',s=>noCompany(s)&&built(s,'warehouse')>0),
 milestone('loneMeadow','四十五片花圃','保持独行模式、没有小熊，拥有至少 45 座食圃或它的后续阶段。',s=>noCompany(s)&&built(s,'pasture')>=45),
 milestone('loneSteam','林中第一声汽笛','保持独行模式、没有小熊，并建成蒸汽工坊。',s=>noCompany(s)&&built(s,'steamworks')>0),
 milestone('lonePower','为独行点亮电灯','保持独行模式、没有小熊，并建成林原发电机。',s=>noCompany(s)&&built(s,'magneto')>0),
 milestone('loneFactory','一熊的精工蓝图','保持独行模式、没有小熊，并建成精工厂。',s=>noCompany(s)&&built(s,'factory')>0),
 milestone('loneMoon','独行者的月光信','保持独行模式，完成探月航行的发射。',s=>s.ironWill&&flight(s,'moonMission'),{starTest:s=>s.ironWill&&flight(s,'moonMission')&&count(s.resources,'paragon')<10,starDescription:'在传承少于 10 时达成。'}),
 milestone('earlyOrbit','第二个春天前的远行','在年份不超过 1 时完成首次轨道发射。',s=>flight(s,'orbitalLaunch')&&s.calendar.year<=1,{starTest:s=>!s.startedWithChronospheres&&flight(s,'orbitalLaunch')&&s.calendar.year<=1,starDescription:'本轮开始时没有时光蜜球或可用冬眠舱。'}),
 milestone('watchfulForest','百座望星台','同时运行至少 100 座观星台，尚未研究自动星讯。',s=>active(s,'observatory')>=100&&!s.workshop.seti),
 milestone('oneBedTemple','一张床与高高石阶','住房容量恰好为 1，并已建成叠石祭坛。',(s,f)=>built(s,'ziggurat')>0&&f.housing===1),
 milestone('brightWishes','山林捧起的曙光','累计星光达到 696342。',s=>s.praised>=696342),
 milestone('rememberedKindness','带回一缕温柔','业力达到 1。',s=>count(s.resources,'karma')>=1),
 milestone('safeHaven','每只熊都在家','本轮没有小熊因饥饿离开，熊群达到 50 只。',s=>s.bears.length>=50&&checkState(s).run.deaths===0&&checkState(s).run.deathsKnown!==false,{starTest:s=>s.bears.length>=1000&&checkState(s).run.deaths===0&&checkState(s).run.deathsKnown!==false,starDescription:'本轮无人因饥饿离开，熊群达到 1000 只。'}),
 milestone('joyfulGrove','蜜香满林','超过 35 只小熊，幸福感达到 150%。',(s,f)=>s.bears.length>35&&f.happiness>=1.5,{starTest:(s,f)=>s.bears.length>35&&f.happiness>=5,starDescription:'在超过 35 只小熊时，幸福感达到 500%。'}),
 milestone('outermostTrail','森林尽头还有星星','真正抵达最远星环。',s=>reached(s,'furthestRingMission')),
 milestone('fortyMillennia','四万圈年轮','历次营地累计经历至少 40000 个日历年。',s=>count(s.stats,'totalYears')>=40000,{starTest:s=>s.calendar.year+(s.calendar.season*100+s.calendar.day)/400-count(s.timeState,'flux')>=40000,starDescription:'本轮扣除时间穿越后的实际年岁达到 40000。'}),
 milestone('longCelebration','百年花灯长明','剩余庆典天数达到 40000。',s=>s.festivalDays>=40000),
 milestone('manyJourneys','五条山路的归来者','完成至少五种不同试炼。',s=>Object.values(s.challengeCompletions||{}).filter(v=>v>0).length>=5,{starTest:s=>Object.values(s.challengeCompletions||{}).reduce((a,b)=>a+b,0)>=100,starDescription:'各项试炼的累计完成次数达到 100。'}),
 milestone('clearTomorrow','先为明天种树','在污染恰好为零时研究固碳工艺。',s=>!!checkState(s).badges.oldClearSky,{starTest:()=>false,starDescription:'同时满足本轮开始时没有时光蜜球或可用冬眠舱。'}),
 milestone('tenEmptyBeds','记住十个空床位','本轮有至少 10 只小熊因饥饿离开。',s=>checkState(s).run.deaths>=10,{optional:true}),
 milestone('hundredEmptyBeds','山林的沉重记录','本轮有至少 100 只小熊因饥饿离开。',s=>checkState(s).run.deaths>=100,{optional:true,starTest:s=>checkState(s).run.deaths>=666666,starDescription:'本轮累计离开的数量达到 666666。'}),
 milestone('racingPaws','停不下来的采蜜爪','非独行模式下连续采蜜 2500 次，任意相邻点击之间不间断 2.5 秒。',()=>false,{optional:true}),
 milestone('stubbornCore','不肯离开的森智','尝试拆售智能等级至少 15 且尚未选择机心共生的森智核心。',()=>false,{optional:true}),
 milestone('winterArchive','旧冬日的蜜封','在现实时间 2017 年 1 月打开过这本纪念册。',(s,f)=>f.date.getFullYear()===2017&&f.date.getMonth()===0,{hidden:true}),
]);
export const badgeDefinitions=Object.freeze([
 milestone('woodSpecialist','木屑围裙','为工程熊分配木材制作专长。',()=>false),
 milestone('easygoingLeader','慢悠悠的领队','任命一只没有领袖专长的小熊。',(s,f)=>f.leader?.trait==='none'),
 milestone('colorfulLeader','花色披肩','领队拥有非默认毛色。',(s,f)=>!!f.leader&&count(f.leader,'color')!==0),
 milestone('fiftyReturns','归林五十次','完成至少 50 次营地重建。',s=>count(s.stats,'totalResets')>=50),
 milestone('loneNightReturn','独行夜归','以独行模式在重建时完成无星长夜。',()=>false),
 milestone('betweenDays','日历夹缝里的新家','在日期为负数的时空悖论中确认普通重建。',()=>false),
 milestone('gentleExchange','不带猎队的商旅','和平山林重建时，本轮有成功贸易、从未分配巡林熊，且基础贸易活力费用大于零。',()=>false),
 milestone('unhousedThousand','千熊露天营','住房容量为零时，营地仍有至少 1000 只小熊。',(s,f)=>s.bears.length>=1000&&f.simHousing===0),
 milestone('moonlessHerd','五百盏地上花灯','有至少 500 只小熊，同时没有天翼鹿。',s=>s.bears.length>=500&&count(s.resources,'alicorn')===0),
 milestone('duneDetour','绕过月亮的航线','抵达沙星时尚未抵达月亮。',s=>reached(s,'duneMission')&&!reached(s,'moonMission')),
 milestone('clockBeforeRocket','先走进时光','首次轨道发射前手动粉碎过时晶。',()=>false),
 milestone('untieTime','解开打结的年轮','在日期为负时一次手动穿越至少 500 年；首次获得时带来 3 虚空。',()=>false),
 milestone('overflowingReturn','比旧蜜罐更满','重建时的资源保留比例超过 100%。',()=>false),
 milestone('fiveBorrowedYears','借走的五年','本轮时间偏移不大于 -5 年。',s=>count(s.timeState,'flux')<=-5),
 milestone('elderBanquet','远古商队的盛宴','远古商队能量达到 1000。',s=>count(s.elderState,'energy')>=1000),
 milestone('farawayHomes','翠星上的大熊村','翠星住房比其余所有住房之和更多，并且没有超员。',(s,f)=>f.remoteHousing>f.totalHousing-f.remoteHousing&&s.bears.length<=f.simHousing),
 milestone('fortyTwoWings','四十二对星翼','天翼鹿数量与 42 的差小于 0.000000000001。',s=>Math.abs(count(s.resources,'alicorn')-42)<1e-12),
 milestone('previewTrail','试走的新林径','游玩网址中包含 beta。',(s,f)=>typeof f.environment.href==='string'&&f.environment.href.includes('beta'),{external:'href'}),
 milestone('quietNotice','没有新告示的一天','公告服务确实返回空白消息。',(s,f)=>f.environment.motdContent==='',{external:'motdContent'}),
 milestone('caughtSpark','留住一颗故障火星','已连接的错误报告服务实际捕获了运行错误。',()=>false,{external:'telemetryEnabled'}),
 milestone('oldClearSky','旧册中的青林印','此前纪念册中的无污染工艺记录。',()=>false,{fullyHidden:true,legacy:true}),
]);
const byId=Object.fromEntries(achievementDefinitions.map(d=>[d.id,d]));
const badgeById=Object.fromEntries(badgeDefinitions.map(d=>[d.id,d]));
const hasOwn=(o,k)=>Object.prototype.hasOwnProperty.call(o,k);
export function createAchievementState(){return {earned:{},starred:{},badges:{},run:{deaths:0,trades:0,hadHunters:false,deathsKnown:true}};}
export function parseAchievementState(value,legacy={}){
 const out=createAchievementState();
 if(value===undefined){out.run.deathsKnown=!(legacy.totalDeaths>0);out.run.hadHunters=legacy.hadHunters??true;return out;}
 const object=v=>v!==null&&typeof v==='object'&&!Array.isArray(v);
 const reject=()=>{throw new Error('纪念册数据无效');};
 if(!object(value)||Object.keys(value).some(k=>!['earned','starred','badges','run'].includes(k)))reject();
 for(const [key,definitions]of [['earned',byId],['starred',byId],['badges',badgeById]]){
  const input=value[key]??{};if(!object(input))reject();
  for(const [id,unlocked]of Object.entries(input)){
   if(!hasOwn(definitions,id)||typeof unlocked!=='boolean'||key==='starred'&&!definitions[id].starTest)reject();
   out[key][id]=unlocked;
  }
 }
 const run=value.run??out.run;if(!object(run)||Object.keys(run).some(k=>!['deaths','trades','hadHunters','deathsKnown'].includes(k)))reject();
 for(const key of ['deaths','trades']){const n=run[key]??0;if(typeof n!=='number'||!Number.isFinite(n)||!Number.isInteger(n)||n<0||n>1e100)reject();out.run[key]=n;}
 if(typeof(run.hadHunters??false)!=='boolean')reject();out.run.hadHunters=run.hadHunters??false;
 if(typeof(run.deathsKnown??true)!=='boolean')reject();out.run.deathsKnown=run.deathsKnown??true;
 return out;
}
function environment(ctx){
 const supplied=typeof ctx.achievementEnvironment==='function'?ctx.achievementEnvironment():ctx.achievementEnvironment;
 const browser=typeof globalThis.location?.href==='string'?{href:globalThis.location.href}:{};
 return {...browser,...(supplied&&typeof supplied==='object'?supplied:{})};
}
function facts(ctx,prepared){
 const s=ctx.state,p=prepared||ctx.production(),e=p.effects||{},remote=s.disabled?.terraformingStation?0:count(s.space,'terraformingStation');
 const hydro=s.disabled?.hydroponics?0:count(s.space,'hydroponics');
 const housing=Math.floor(e.bears||0),simHousing=Math.round(housing*(1+limitedDR(e.maxKittensRatio||0,1)));
 return {housing,simHousing,totalHousing:e.bears||0,happiness:p.happiness??ctx.happiness?.(e)??1,leader:s.bears.find(b=>b.id===s.leaderId)||null,
  remoteHousing:remote*(1+triangularInverse(hydro/100)+(e.terraformingHousingRatio||0)),
  environment:environment(ctx),date:new Date(ctx.now?.()??Date.now())};
}
function award(ctx,kind,id){
 const a=checkState(ctx.state);if(a[kind][id])return false;a[kind][id]=true;
 const name=(kind==='badges'?badgeById:byId)[id]?.name;
 ctx.log?.(`${kind==='starred'?'星章升级':kind==='badges'?'获得徽章':'获得纪念'}：${name}。`,'achievement');return true;
}
export function checkAchievements(ctx,{force=false,production}={}){
 const s=ctx.state,t=local(s);checkState(s);
 if(!force&&(s.ticks%50!==0||t.lastTick===s.ticks))return 0;
 t.lastTick=s.ticks;
 const f=facts(ctx,production);let changes=0;
 for(const d of achievementDefinitions){if(!s.achievementState.earned[d.id]&&d.test(s,f))changes+=award(ctx,'earned',d.id);if(d.starTest&&!s.achievementState.starred[d.id]&&d.starTest(s,f))changes+=award(ctx,'starred',d.id);}
 for(const d of badgeDefinitions)if(!s.achievementState.badges[d.id]&&d.test(s,f))changes+=award(ctx,'badges',d.id);
 return changes;
}
/** Every check is observational; earned records are never annulled by later resource loss. */
export function achievementEvent(ctx,event,details={}){
 const s=ctx.state,a=checkState(s);let changed=0;
 if(event==='death')a.run.deaths+=details.count??1;
 if(event==='trade')a.run.trades+=details.count??0;
 if(event==='huntersAssigned')a.run.hadHunters=true;
 if(event==='engineerWoodAssigned')changed+=award(ctx,'badges','woodSpecialist');
 if(event==='carbonPurchased'&&s.pollution===0){changed+=award(ctx,'earned','clearTomorrow');if(!s.startedWithChronospheres)changed+=award(ctx,'starred','clearTomorrow');}
 if(event==='aiSaleRefused')changed+=award(ctx,'earned','stubbornCore');
 if(event==='gatherAttempt'){
  const t=local(s),now=ctx.now?.()??Date.now();if(t.lastGather===null||now-t.lastGather>=2500||now<t.lastGather)t.gatherCount=0;t.lastGather=now;t.gatherCount++;
  if(t.gatherCount>=2500&&!s.ironWill){t.gatherCount=0;changed+=award(ctx,'earned','racingPaws');}
 }
 if(event==='shatter'&&details.count>0){
  if(!details.orbitalLaunchBefore)changed+=award(ctx,'badges','clockBeforeRocket');
  if(details.dayBefore<0&&details.count>=500){
   if(award(ctx,'badges','untieTime')){changed++;if(ctx.add)ctx.add('void',3);else s.resources.void=count(s.resources,'void')+3;}
   const leader=s.bears.find(b=>b.id===s.leaderId);if(leader)leader.color=rollBearAppearance(()=>ctx.nextRandom(s),100,0).color;
  }
 }
 if(event==='telemetryError'&&environment(ctx).telemetryEnabled===true)changed+=award(ctx,'badges','caughtSpark');
 return changed;
}
/** Capture before a successful reset can clear the active challenge list. No awards here. */
export function captureResetFacts(ctx,{ordinaryReset=false}={}){
 const s=ctx.state,a=checkState(s),cryo=Math.min(count(s.time,'cryochambers'),built(s,'chronosphere')+count(s.challengeCompletions,'postApocalypse'));
 const baseTradeFree=s.ironWill&&inTrial(s,'blackSky')&&!s.workshop.goldOre&&count(s.resources,'manpower')===0;
 return {loneNight:!!(s.ironWill&&inTrial(s,'atheism')&&(cryo>0||active(s,'stasisPod')>0)),
  peaceful:!!(inTrial(s,'pacifism')&&!a.run.hadHunters&&a.run.trades>0&&!baseTradeFree),
  betweenDays:!!(ordinaryReset&&s.calendar.day<0),overflowing:built(s,'chronosphere')*.015>1};
}
export function carryAchievements(ctx,next,resetFacts=captureResetFacts(ctx)){
 for(const [key,id]of [['loneNight','loneNightReturn'],['peaceful','gentleExchange'],['betweenDays','betweenDays'],['overflowing','overflowingReturn']])if(resetFacts[key])award(ctx,'badges',id);
 const old=checkState(ctx.state);next.achievementState={earned:{...old.earned},starred:{...old.starred},badges:{...old.badges},run:{deaths:0,trades:0,hadHunters:false,deathsKnown:true}};
}
/** Integer draws reproduce the verified 11% boundary, not the rounded prose percentage. */
export function rollBearAppearance(random,colorChance=10,varietyChance=10){
 const draw=maximum=>Math.floor(random()*maximum);let color=0,variety=0;
 if(draw(100)<=colorChance){color=1+draw(6);if(draw(100)<=varietyChance)variety=1+draw(4);}
 return {color,variety};
}
export function achievementView(ctx){
 const s=ctx.state,a=checkState(s),env=environment(ctx);
 const card=(d,badge=false)=>{
  const unlocked=!!(badge?a.badges:a.earned)[d.id],starred=!!a.starred[d.id];
  let reason='';
  if(d.external==='href'&&typeof env.href!=='string')reason='尚无可核验的游玩网址。';
  if(d.external==='motdContent'&&typeof env.motdContent!=='string')reason='本版本未连接公告服务，此项暂不可判定。';
  if(d.external==='telemetryEnabled'&&env.telemetryEnabled!==true)reason='本版本未连接错误报告服务，此项暂不可判定。';
  return {id:d.id,name:unlocked?d.name:badge?'未揭晓徽章':'未揭晓纪念',description:unlocked?d.description:'达成后揭晓。',unlocked,starred,
   secret:!unlocked,visible:!d.fullyHidden&&(!d.hidden||unlocked),fullyHidden:!!d.fullyHidden,optional:!!d.optional,
   requirement:unlocked?d.description:'',...(d.starTest?{hasStar:true,starRequirement:starred?d.starDescription:''}:{}),available:!reason,reason};
 };
 const cards=achievementDefinitions.map(d=>card(d)),badges=badgeDefinitions.map(d=>card(d,true)),scored=cards.filter(d=>d.visible&&!d.optional),shownBadges=badges.filter(d=>d.visible);
 return {achievements:{cards,catalogueTotal:cards.length,total:scored.length,unlocked:scored.filter(d=>d.unlocked).length,starsTotal:scored.filter(d=>d.hasStar).length,starsUnlocked:scored.filter(d=>d.hasStar&&d.starred).length},badges,badgeTotals:{catalogueTotal:badges.length,total:shownBadges.length,unlocked:shownBadges.filter(d=>d.unlocked).length}};
}
