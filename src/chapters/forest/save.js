import {catalog, constants} from './catalog.js';

export const SAVE_HEADER = Object.freeze({format:'beargame',family:'beargame-chapters',contentLevel:1,chapter:'forest',schema:1,version:1});
export const MAX_SAVE_BYTES = 4 * 1024 * 1024;

export function createState(seed=0x8b25f4a7,now=Date.now()) {
 return {
  ...SAVE_HEADER,savedAt:now,startedAt:now,rng:(seed>>>0)||0x8b25f4a7,ticks:0,tickRemainder:0,
  calendar:{year:0,season:0,day:0,tick:0,weather:0},
  resources:Object.fromEntries(catalog.resources.map(r=>[r.id,0])),resourceUnlocked:{honey:true,wood:true},
  buildings:{},science:{},workshop:{},disabled:{},activeBuildings:{},pollution:0,solitary:true,
  queue:{items:[],sources:{buildings:true}},
  bears:[],arrival:0,deathCooldown:0,nextBearId:1,observation:null,
  settings:{paused:false,offline:false,reducedMotion:false,confirmBatch:true},
  stats:{totalTicks:0,totalGathered:0,totalCrafted:0,totalHunts:0,totalDeaths:0,totalYears:0,maxBears:0},
  log:[],nextLogId:1,
 };
}
const plain=value=>!!value&&typeof value==='object'&&!Array.isArray(value);
function fail(message){throw new Error(`存档无法读取：${message}。原文件不会被修改。`);}
function number(value,label,min=0,max=1e100){if(typeof value!=='number'||!Number.isFinite(value)||value<min||value>max)fail(`${label}不是有效数字`);return value;}
function integer(value,label,min=0,max=1e9){number(value,label,min,max);if(!Number.isInteger(value))fail(`${label}不是整数`);return value;}
function bool(value,label){if(typeof value!=='boolean')fail(`${label}不是有效开关`);return value;}
function keys(value,allowed,label){if(!plain(value))fail(`${label}格式无效`);for(const key of Object.keys(value))if(!allowed.includes(key))fail(`${label}包含此版本不能读取的字段`);}
function map(source,allowed,kind,label,max=1e100){
 keys(source,allowed,label);const output={};
 for(const [key,value] of Object.entries(source))output[key]=kind==='bool'?bool(value,label):kind==='int'?integer(value,label,0,max):number(value,label,0,max);
 return output;
}
function parseQueue(value,buildings){
 const queue=value===undefined?{items:[],sources:{buildings:true}}:value;
 keys(queue,['items','sources'],'建造队列');
 if(!Array.isArray(queue.items)||queue.items.length>1000000)fail('建造队列项目无效');
 const groups={build:'buildings',research:'science',upgrade:'workshop'};let used=0;
 const items=queue.items.map(item=>{
  keys(item,['type','id','amount'],'队列项目');
  if(typeof item.type!=='string'||!Object.hasOwn(groups,item.type)||typeof item.id!=='string'||!catalog[groups[item.type]].some(def=>def.id===item.id))fail('队列项目不属于此章节');
  const amount=integer(item.amount,'队列数量',1,item.type==='build'?1000000:1);used+=amount;
  if(used>1000000)fail('建造队列过长');
  return {type:item.type,id:item.id,amount};
 });
 const sources={...map(queue.sources??{},['buildings','tech','upgrades'],'bool','队列分类'),buildings:true};
 // Keep earned categories after a milestone building is sold, and derive them
 // once when loading older chapter saves. Reading a view never changes a save.
 if(buildings.library)sources.tech=true;
 if(buildings.workshop)sources.upgrades=true;
 return {items,sources};
}
export function parseSave(text,now=Date.now()) {
 if(typeof text!=='string'||text.length>MAX_SAVE_BYTES||new TextEncoder().encode(text).byteLength>MAX_SAVE_BYTES)fail('文件过大或不是文本');
 let data;try{data=JSON.parse(text);}catch{fail('不是有效的 JSON 文本');}
 if(!plain(data)||data.format!==SAVE_HEADER.format||data.family!==SAVE_HEADER.family)fail('请选择分章版本导出的存档；本版本不会转换其他存档');
 if(data.contentLevel!==SAVE_HEADER.contentLevel||data.chapter!==SAVE_HEADER.chapter)fail('存档的内容版本与此版本不兼容，请使用对应版本打开');
 if(data.schema!==SAVE_HEADER.schema||data.version!==SAVE_HEADER.version)fail('存档格式版本不受支持');
 const out=createState(integer(data.rng,'随机种子',1,4294967295),now);
 keys(data,Object.keys(out),'存档');
 out.savedAt=number(data.savedAt,'保存时间',0,8640000000000000);
 out.startedAt=number(data.startedAt??out.savedAt,'开始时间',0,8640000000000000);
 out.ticks=integer(data.ticks,'游戏时刻',0,Number.MAX_SAFE_INTEGER);
 out.tickRemainder=number(data.tickRemainder??0,'计时余量',0,1);if(out.tickRemainder>=1)fail('计时余量超出范围');
 keys(data.calendar,['year','season','day','tick','weather'],'日历');
 out.calendar={year:integer(data.calendar.year,'年份'),season:integer(data.calendar.season,'季节',0,3),day:integer(data.calendar.day,'日',0,99),tick:integer(data.calendar.tick,'日内时刻',0,9),weather:integer(data.calendar.weather,'天气',-1,1)};
 const ids=group=>catalog[group].map(d=>d.id);
 out.resources={...out.resources,...map(data.resources,ids('resources'),'num','物资')};
 out.resourceUnlocked={...out.resourceUnlocked,...map(data.resourceUnlocked??{},ids('resources'),'bool','物资解锁')};
 for(const [id,value] of Object.entries(out.resources))if(value>0)out.resourceUnlocked[id]=true;
 for(const group of ['buildings','science','workshop'])out[group]=map(data[group],ids(group),group==='buildings'?'int':'bool',group,1000000);
 out.queue=parseQueue(data.queue,out.buildings);
 out.disabled=map(data.disabled??{},ids('buildings'),'bool','生产开关');
 out.activeBuildings=map(data.activeBuildings??{},ids('buildings'),'int','运行建筑',1000000);
 for(const [id,count]of Object.entries(out.activeBuildings))if(count>(out.buildings[id]||0))fail('运行建筑超过已建数量');
 out.pollution=number(data.pollution??0,'污染');out.solitary=bool(data.solitary??true,'营地状态');
 if(!Array.isArray(data.bears)||data.bears.length>100000)fail('熊群数据无效');
 const used=new Set();
 out.bears=data.bears.map(b=>{
  keys(b,['id','name','job','disposition','experience','skills','color','variety'],'小熊');
  const id=integer(b.id,'熊编号',1,Number.MAX_SAFE_INTEGER);if(used.has(id))fail('熊编号重复');used.add(id);
  const job=b.job??null;if(job!==null&&!ids('jobs').includes(job))fail('未知工作');
  return {id,name:typeof b.name==='string'?b.name.slice(0,32):`小熊 ${id}`,job,disposition:integer(b.disposition??7,'性格',0,7),experience:number(b.experience??0,'经验'),skills:map(b.skills??{},ids('jobs'),'num','熟练度',20001),color:integer(b.color??0,'毛色',0,6),variety:integer(b.variety??0,'纹样',0,4)};
 });
 out.nextBearId=integer(data.nextBearId??[...used].reduce((m,v)=>Math.max(m,v),0)+1,'下一个熊编号',1,Number.MAX_SAFE_INTEGER);
 if([...used].some(id=>id>=out.nextBearId))fail('熊编号计数错误');
 out.arrival=number(data.arrival??0,'到达进度',0,1);out.deathCooldown=integer(data.deathCooldown??0,'饥饿冷却',0,100000);
 if(data.observation!==null&&data.observation!==undefined){keys(data.observation,['expires'],'星象');out.observation={expires:integer(data.observation.expires,'观测期限',0,Number.MAX_SAFE_INTEGER)};}
 out.settings={...out.settings,...map(data.settings??{},Object.keys(out.settings),'bool','设置')};
 out.stats={...out.stats,...map(data.stats??{},Object.keys(out.stats),'num','统计')};
 // Messages are display history only. Imported messages are never trusted as game state.
 out.log=[];out.nextLogId=1;
 serialize(out,out.savedAt);
 return out;
}
export function serialize(state,now=Date.now()){
 number(now,'保存时间',0,8640000000000000);
 const text=JSON.stringify({...state,savedAt:now});
 if(text.length>MAX_SAVE_BYTES||new TextEncoder().encode(text).byteLength>MAX_SAVE_BYTES)fail('完整记录超过文件大小上限');
 return text;
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
