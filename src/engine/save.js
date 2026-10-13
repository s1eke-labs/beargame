import {createAchievementState,parseAchievementState} from './achievements.js';
import {parseBuildQueue} from './build-queue.js';
import {parseEngineerState} from './engineer-automation.js';
import {validatePolicySelection} from './policies.js';
import {catalog, constants} from './catalog.js';
import {clone} from './math.js';

export function createState(seed=0x8b25f4a7, now=Date.now()) {
 return {
  format:'beargame', version:constants.SAVE_VERSION, savedAt:now, startedAt:now,
  rng:(seed>>>0)||0x8b25f4a7, ticks:0, tickRemainder:0, calendar:{year:0,season:0,day:0,tick:0,weather:0},
  resourceUnlocked:{honey:true,wood:true}, startedWithChronospheres:false,
  resources:Object.fromEntries(catalog.resources.map(r=>[r.id,0])),
  buildings:{}, buildingStages:{}, science:{}, workshop:{}, religion:{}, space:{}, discoveries:{}, disabled:{}, activeBuildings:{}, automationDisabled:{}, pollution:0, activeHolyGenocide:0,
  achievementState:createAchievementState(),queue:{items:[],sources:{buildings:true}},engineerProgress:{},zebraKarma:0,ironWill:true,elderState:{energy:0,duration:0},blackcoinState:{price:1000},industryState:{steamJammed:false,lastAutomationYear:-1,aiApocalypseEvents:0},
  bears:[], arrival:0, deathCooldown:0, nextBearId:1, praised:0, faithRatio:0, transcendence:0,
  karmaKittens:0, transcendencePrice:0, religionUnlocked:{}, metaphysics:{}, time:{}, timeUnlocked:{}, embassies:{}, policies:{}, policyLocked:{}, policyUnlocked:{}, leaderId:null, spaceTravel:{}, spaceReached:{}, religionCounters:{corruption:0,alicorn:0,pactDebt:0}, timeState:{heat:0,accelerating:false,flux:0,furnaceHeat:0,furnaceEnabled:false,pressEnabled:false,accelerationRemainder:0,delayTicks:0}, challengeBest:{}, challengesUnlocked:{}, usedCryochambers:0,
  festivalDays:0, observation:null, challenge:null, activeChallenges:[], pendingChallenges:[], challengeReserves:{resources:{},bears:[],cryochambers:0}, challengeCompletions:{},
  settings:{paused:false,offline:false,reducedMotion:false,confirmBatch:true},
  stats:{totalTicks:0,totalGathered:0,totalCrafted:0,totalTrades:0,totalHunts:0,totalDeaths:0,totalResets:0,totalYears:0,maxBears:0},
  log:[], nextLogId:1, flags:{},
 };
}
function fail(text){throw new Error(`存档无法读取：${text}`);}
function plain(value){return !!value && typeof value==='object' && !Array.isArray(value);}
function number(value, name, min=0, max=1e100){if(typeof value!=='number'||!Number.isFinite(value)||value<min||value>max)fail(`${name}不是有效数字`);return value;}
function integer(value,name,min=0,max=1e9){number(value,name,min,max);if(!Number.isInteger(value))fail(`${name}不是整数`);return value;}
function safeMap(source,allowed,kind,label){
 if(!plain(source))fail(`${label}字段缺失`);
 const result={};
 for(const [key,value] of Object.entries(source)){
  if(!allowed.includes(key))fail(`${label}含未知项目 ${key}`);
  if(kind==='bool'){if(typeof value!=='boolean')fail(`${label}值无效`);result[key]=value;}
  else result[key]=kind==='int'?integer(value,label,0,1000000):number(value,label);
 }
 return result;
}
export const MAX_SAVE_BYTES=4*1024*1024;
export function parseSave(text,now=Date.now()){
 if(typeof text!=='string'||text.length>MAX_SAVE_BYTES||new TextEncoder().encode(text).byteLength>MAX_SAVE_BYTES)fail('文件过大或不是文本');
 let data;
 try{data=JSON.parse(text);}catch{fail('不是有效的 JSON 文本');}
 if(!plain(data)||data.format!=='beargame')fail('请选择 Beargame 导出的存档；其他游戏的存档不兼容');
 if(data.version!==constants.SAVE_VERSION)fail('存档版本不受支持');
 const out=createState(integer(data.rng,'随机种子',1,4294967295),now);
 out.savedAt=number(data.savedAt,'保存时间',0,8640000000000000);
 out.startedAt=number(data.startedAt??out.savedAt,'开始时间',0,8640000000000000);
 out.ticks=integer(data.ticks,'游戏时刻',0,Number.MAX_SAFE_INTEGER);
 out.tickRemainder=number(data.tickRemainder??0,'计时余量',0,1);
 if(!plain(data.calendar))fail('日历缺失');
 out.calendar={year:integer(data.calendar.year,'年份',0,1000000000),season:integer(data.calendar.season,'季节',0,3),day:integer(data.calendar.day,'日',-1000000000,99),tick:integer(data.calendar.tick,'日内时刻',0,9),weather:integer(data.calendar.weather,'天气',-1,1)};
 const ids=key=>(catalog[key]||[]).map(x=>x.id);
 out.resources={...out.resources,...safeMap(data.resources,ids('resources'),'num','物资')};
 out.resourceUnlocked={honey:true,wood:true,...safeMap(data.resourceUnlocked??{},ids('resources'),'bool','物资解锁')};
 for(const [id,value] of Object.entries(out.resources))if(value>0)out.resourceUnlocked[id]=true;
 if(typeof(data.startedWithChronospheres??false)!=='boolean')fail('重建标记无效');out.startedWithChronospheres=data.startedWithChronospheres??false;
 out.zebraKarma=number(data.zebraKarma??0,'条纹传承');
 if(typeof(data.ironWill??true)!=='boolean')fail('孤行模式无效');out.ironWill=data.ironWill??true;
 for(const [key,defaults] of Object.entries({elderState:{energy:0,duration:0},blackcoinState:{price:1000}})){if(data[key]!==undefined)out[key]={...defaults,...safeMap(data[key],Object.keys(defaults),'num',key)};}
 if(data.industryState!==undefined){const x=data.industryState;if(!plain(x)||typeof x.steamJammed!=='boolean')fail('工业状态无效');out.industryState={steamJammed:x.steamJammed,lastAutomationYear:integer(x.lastAutomationYear??-1,'蒸汽自动化年份',-1,1000000000),aiApocalypseEvents:integer(x.aiApocalypseEvents??0,'智能危机次数',0,1000000000)};}
 if(out.blackcoinState.price<=0)fail('暗币价格必须大于零');
 out.buildings=safeMap(data.buildings,ids('buildings'),'int','建筑');
 out.buildingStages=safeMap(data.buildingStages??{},['pasture','aqueduct','library','amphitheatre','warehouse'],'int','建筑阶段');
 for(const value of Object.values(out.buildingStages))if(value>1)fail('建筑阶段无效');
 out.science=safeMap(data.science,ids('science'),'bool','研究');
 out.workshop=safeMap(data.workshop,ids('workshop'),'bool','工坊');
 out.religion=safeMap(data.religion??{},ids('faith'),'int','祈愿');
 if(['siphoning','feedingFrenzy','upfrontPayment'].filter(id=>out.religion[id]>0).length>1)fail('只能选择一种供养路线');
 out.space=safeMap(data.space??{},ids('space'),'int','星际');
 out.discoveries=safeMap(data.discoveries??{},ids('trades'),'bool','伙伴');
 out.pollution=number(data.pollution??0,'污染');
 out.activeHolyGenocide=integer(data.activeHolyGenocide??0,'已生效幽世数量',0,1000000);
 out.activeBuildings=safeMap(data.activeBuildings??{},ids('buildings'),'int','运行建筑');
 for(const [id,count] of Object.entries(out.activeBuildings))if(count>(out.buildings[id]||0))fail('运行建筑超过已建数量');
 out.automationDisabled=safeMap(data.automationDisabled??{},ids('buildings'),'bool','自动化开关');
 out.disabled=safeMap(data.disabled??{},[...ids('buildings'),...ids('space')],'bool','生产开关');
 if(!Array.isArray(data.bears)||data.bears.length>100000)fail('熊群数据无效');
 const used=new Set();
 const validateBears=(list,used)=>list.map(b=>{
  if(!plain(b))fail('熊的数据损坏');
  const id=integer(b.id,'熊编号',1,Number.MAX_SAFE_INTEGER);
  if(used.has(id))fail('熊编号重复'); used.add(id);
  const job=b.job??null;if(job!==null&&!ids('jobs').includes(job))fail('未知工作');
  const skills=safeMap(b.skills??{},ids('jobs'),'num','熟练度');
  const trait=b.trait??'none';if(!['scientist','manager','engineer','merchant','wise','metallurgist','chemist','none'].includes(trait))fail('未知小熊性格');
  const engineerSpecialty=b.engineerSpecialty??null;if(engineerSpecialty!==null&&(!ids('crafts').includes(engineerSpecialty)||job!=='engineer'))fail('工程专精无效');
  const appearance={};if(b.color!==undefined)appearance.color=integer(b.color,'毛色',0,6);if(b.variety!==undefined)appearance.variety=integer(b.variety,'纹样',0,4);
  return {id,job,...appearance,...(b.engineerSpecialty!==undefined?{engineerSpecialty}:{}),trait,name:typeof b.name==='string'?b.name.slice(0,32):`小熊 ${id}`,experience:number(b.experience??0,'经验'),rank:integer(b.rank??0,'等级',0,10000),skills};
 });
 out.bears=validateBears(data.bears,used);
 try{out.queue=parseBuildQueue(data.queue??out.queue,catalog);out.engineerProgress=parseEngineerState(data.engineerProgress??{},catalog,out.bears);}catch(error){fail(error.message);}
 out.nextBearId=integer(data.nextBearId??[...used].reduce((m,v)=>Math.max(m,v),0)+1,'下一个熊编号',1,Number.MAX_SAFE_INTEGER);
 if([...used].some(id=>id>=out.nextBearId))fail('熊编号计数错误');
 for(const key of ['arrival','praised','faithRatio','transcendence','festivalDays'])out[key]=number(data[key]??0,key);
 if(out.arrival>1)fail('到达进度超出范围');
 out.deathCooldown=integer(data.deathCooldown??0,'饥饿冷却',0,100000);
 for(const key of ['karmaKittens','transcendencePrice'])out[key]=number(data[key]??0,key);
 out.usedCryochambers=integer(data.usedCryochambers??0,'已使用休眠舱',0,1000000);
 out.religionUnlocked=safeMap(data.religionUnlocked??{},ids('faith'),'bool','祈愿解锁');
 out.transcendence=integer(data.transcendence??0,'超越等级',0,1000000);
 for(const [kind,key] of [['faith','religion'],['space','space']])for(const definition of (catalog[kind]||[]))if(definition.oneTime&&(out[key][definition.id]||0)>1)fail('一次性项目数量超出范围');
 out.metaphysics=safeMap(data.metaphysics??{},ids('metaphysics'),'bool','传承智慧');
 out.timeUnlocked=safeMap(data.timeUnlocked??{},ids('time'),'bool','时间解锁');
 out.embassies=safeMap(data.embassies??{},ids('trades'),'int','使馆');
 out.policies=safeMap(data.policies??{},ids('policies'),'bool','政策');
 const policyError=validatePolicySelection(out.policies);if(policyError)fail(policyError);
 out.policyUnlocked=safeMap(data.policyUnlocked??{},[...ids('policies'),'postApocalypseReward'],'bool','政策开放');
 out.policyLocked=safeMap(data.policyLocked??{},ids('policies'),'bool','政策锁定');
 out.leaderId=data.leaderId??null;if(out.leaderId!==null){integer(out.leaderId,'领队编号',1,Number.MAX_SAFE_INTEGER);if(!used.has(out.leaderId))fail('领队不在熊群中');}
 out.time=safeMap(data.time??{},ids('time'),'int','时间设施');
 out.spaceReached=safeMap(data.spaceReached??{},ids('space'),'bool','航行抵达');
 out.spaceTravel=safeMap(data.spaceTravel??{},ids('space'),'num','航行进度');
 out.challengeBest=safeMap(data.challengeBest??{},ids('challenges'),'num','挑战记录');
 out.challengesUnlocked=safeMap(data.challengesUnlocked??{},ids('challenges'),'bool','挑战开放');
 if(data.religionCounters!==undefined){out.religionCounters={...out.religionCounters,...safeMap(data.religionCounters,['corruption','alicorn','pactDebt'],'num','宗教计数')};}
 if(data.timeState!==undefined){
  if(!plain(data.timeState))fail('时间状态无效');
  for(const k of ['heat','furnaceHeat'])out.timeState[k]=number(data.timeState[k]??0,k);out.timeState.flux=number(data.timeState.flux??0,'flux',-1e100,1e100);
  out.timeState.accelerationRemainder=integer(data.timeState.accelerationRemainder??0,'加速余数',0,1);
  out.timeState.delayTicks=integer(data.timeState.delayTicks??0,'延迟时刻',0,Number.MAX_SAFE_INTEGER);
  if(typeof(data.timeState.accelerating??false)!=='boolean')fail('加速状态无效');
  out.timeState.accelerating=data.timeState.accelerating??false;
  if(typeof(data.timeState.furnaceEnabled??false)!=='boolean')fail('熔炉状态无效');
  out.timeState.furnaceEnabled=data.timeState.furnaceEnabled??false;
  if(typeof(data.timeState.pressEnabled??false)!=='boolean')fail('时压状态无效');out.timeState.pressEnabled=data.timeState.pressEnabled??false;
 }
 out.challenge=data.challenge??null;
 if(out.challenge!==null&&!ids('challenges').includes(out.challenge))fail('未知挑战');
 for(const key of ['activeChallenges','pendingChallenges']){
  const values=data[key]??(key==='activeChallenges'&&out.challenge?[out.challenge]:[]);
  if(!Array.isArray(values)||values.length>ids('challenges').length||new Set(values).size!==values.length||values.some(id=>!ids('challenges').includes(id)))fail('挑战选择无效');
  out[key]=[...values];
 }
 if(data.challengeReserves!==undefined){
  const reserve=data.challengeReserves;if(!plain(reserve)||!Array.isArray(reserve.bears)||reserve.bears.length>100000)fail('挑战储备无效');
  out.challengeReserves={resources:safeMap(reserve.resources??{},ids('resources'),'num','挑战储备物资'),bears:validateBears(reserve.bears,new Set()),cryochambers:integer(reserve.cryochambers??0,'挑战休眠舱储备',0,1000000)};
 }
 out.challengeCompletions=safeMap(data.challengeCompletions??{},ids('challenges'),'int','挑战');
 if(data.observation!==null&&data.observation!==undefined){
  if(!plain(data.observation))fail('星象无效');
  out.observation={expires:integer(data.observation.expires,'观测期限',0,Number.MAX_SAFE_INTEGER)};
 }
 if(plain(data.settings))for(const k of Object.keys(out.settings)){
  if(k in data.settings){if(typeof data.settings[k]!=='boolean')fail('设置格式错误');out.settings[k]=data.settings[k];}
 }
 if(plain(data.stats))for(const k of Object.keys(out.stats))out.stats[k]=number(data.stats[k]??0,`统计 ${k}`);
 try{out.achievementState=parseAchievementState(data.achievementState,{totalDeaths:out.stats.totalDeaths,totalTrades:out.stats.totalTrades});}catch(error){fail(error.message);}
 // Logs and unknown properties are deliberately not trusted or executed on import.
 out.log=[];out.nextLogId=1;out.flags={};
 return out;
}
export function serialize(state,now=Date.now()){
 return JSON.stringify({...state,savedAt:now});
}
export function defaultStorage(){try{return globalThis.localStorage??null;}catch{return null;}}
export function readStorage(storage=defaultStorage()){
 if(!storage)return {ok:true,text:null,message:'此环境没有本地存储，请导出备份。'};
 try{return {ok:true,text:storage.getItem(constants.SAVE_KEY),message:''};}catch{return {ok:false,text:null,message:'浏览器阻止读取本地存档。请使用导入与导出备份。'};}
}
export function writeStorage(storage,text){
 if(!storage)return {ok:false,message:'此环境没有本地存储，请导出备份。'};
 try{storage.setItem(constants.SAVE_KEY,text);return {ok:true,message:'已保存在此浏览器。'};}catch{return {ok:false,message:'本地保存失败，可能是空间不足或隐私设置限制。请马上导出备份。'};}
}
