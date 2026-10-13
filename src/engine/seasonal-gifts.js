/** Seasonal gifts use the held-box check on initial page load. */
import {geometricCost,limitedDR,triangularInverse} from './math.js';

const count=(map,id)=>map?.[id]||0;
const SAVABLE_MAX=1e100;
const valid=value=>Number.isFinite(value)&&value>=0&&value<=SAVABLE_MAX;
const display=value=>Number(value.toPrecision(6)).toLocaleString('zh-CN');
const perkPath=['goldenRatio','divineProportion','vitruvianFeline','renaissance'];

// Deliberately use browser-local calendar fields, never UTC fields or game time.
export function isGiftSeason(now=Date.now()){
 const date=new Date(now);
 return date.getMonth()===11&&date.getDate()>=15&&date.getDate()<=31;
}

export function checkSeasonalGiftOnLoad(ctx){
 const s=ctx.state,held=s.resources.elderBox;
 if(!valid(held))return {changed:false};
 if(isGiftSeason(ctx.now())){
  if(held!==0)return {changed:false};
  s.resources.elderBox=1;s.resourceUnlocked.elderBox=true;
  ctx.log('一份远古礼盒来到蜜林。请在冬日赠礼季结束后拆开。','important');
  return {changed:true,granted:true};
 }
 if(held>0&&held<1){
  s.resources.elderBox=1;s.resourceUnlocked.elderBox=true;
  ctx.log('零散的礼盒碎片重新拼成了一份完整礼物。','important');
  return {changed:true,repaired:true};
 }
 return {changed:false};
}

export function giftMarkerCap(ctx){
 const s=ctx.state;
 const darkTrial=s.challenge==='blackSky'||s.activeChallenges?.includes('blackSky');
 const markerMultiplier=1+(darkTrial?0:limitedDR(.1*count(s.challengeCompletions,'blackSky'),2));
 return Math.floor((5+5*count(s.religion,'marker')*markerMultiplier)*(1+(ctx.effects().leviathansEnergyModifier||0)));
}

// Highest priority first. The gift is selected once, using progress at opening.
export function seasonalGiftKind(ctx){
 const s=ctx.state,r=s.resources,faith=s.religion,perks=s.metaphysics;
 if(s.elderState.energy===giftMarkerCap(ctx))return 'burnedParagon';
 if(ctx.enabledCount('chronosphere')>0)return 'compendiums';
 if(perks.engeneering&&!perks.renaissance)return 'metaphysics';
 if(count(faith,'transcendence')>0&&s.transcendence<=10)return 'transcendence';
 if(count(faith,'apocripha')>0)return 'apocrypha';
 const sorrowCap=ctx.production().caps.sorrow;
 if(sorrowCap>0&&r.sorrow/sorrowCap<.25&&perks.megalomania&&count(faith,'blackPyramid')<3)return 'sorrow';
 if(r.timeCrystal>0&&perks.anachronomancy&&s.workshop.stasisChambers)return 'timeCrystal';
 return r.paragon>=100?'paragon':'karma';
}

function giftPlan(ctx){
 const s=ctx.state,r=s.resources,kind=seasonalGiftKind(ctx),resources={},fields={};
 let perk=null,description='';
 if(kind==='karma'){
  const increase=r.karma>50?25*Math.min(s.karmaKittens,25000):5000;
  fields.karmaKittens=s.karmaKittens+increase;
  fields.karma=triangularInverse(fields.karmaKittens/5);
  description=`业力增加 ${display(fields.karma-triangularInverse(s.karmaKittens/5))}`;
 }else if(kind==='apocrypha'){
  fields.faithRatio=s.faithRatio+(s.faithRatio>10?4*Math.min(s.faithRatio,1000):5);
  const bonus=10*(triangularInverse(fields.faithRatio/.1)-triangularInverse(s.faithRatio/.1));
  description=`灵悟的祈愿加成提高 ${display(bonus)} 个百分点`;
 }else if(kind==='transcendence'){
  fields.transcendence=s.transcendence+4;
  description='升华等级提高 4 级';
 }else if(kind==='metaphysics'){
  const next=perkPath.find(id=>!s.metaphysics[id]);
  perk=ctx.catalog.metaphysics.find(d=>d.id===next&&!d.unsupported);
  if(!perk)return {reason:'这份礼物所需的传承项目不可用，请保留礼盒。'};
  description=`获得传承「${perk.name}」`;
 }else if(kind==='compendiums'){
  resources.compendium=r.compendium>500000?4*r.compendium:100000;
  let spent=0;
  for(const id of ['unicornGraveyard','unicornNecropolis']){
   const d=ctx.catalog.faith.find(item=>item.id===id);
   if(!d||!valid(d.cost?.necrocorn)||!Number.isFinite(d.ratio))return {reason:'这份礼物所需的祈愿项目不可用，请保留礼盒。'};
   spent+=geometricCost(d.cost.necrocorn,d.ratio,0,count(s.religion,id));
  }
  resources.necrocorn=Math.max(10,r.necrocorn,spent);
 }else if(kind==='sorrow')resources.sorrow=ctx.production().caps.sorrow-r.sorrow;
 else if(kind==='timeCrystal')resources.timeCrystal=r.timeCrystal>100?Math.min(r.timeCrystal,2000):50;
 else if(kind==='paragon')resources.paragon=r.paragon>500?Math.min(r.paragon,1000):100;
 else if(kind==='burnedParagon')resources.burnedParagon=r.burnedParagon>500?Math.min(r.burnedParagon,1500):150;

 if(!description)description=Object.entries(resources).map(([id,amount])=>`${ctx.resourceById[id]?.name||id}增加 ${display(amount)}`).join('，');
 const caps=ctx.production().caps;
 const additions={...resources,wrappingPaper:1};
 for(const [id,amount]of Object.entries(additions)){
  const cap=caps[id];
  const after=Math.min(cap===null?Infinity:Math.max(cap,r[id]),r[id]+amount);
  if(!Object.hasOwn(r,id)||!valid(amount)||!valid(after))return {reason:'礼物数量超过当前存档的安全范围，礼盒已保留。'};
 }
 if(Object.values(fields).some(value=>!valid(value)))return {reason:'礼物数量超过当前存档的安全范围，礼盒已保留。'};
 return {kind,resources,fields,perk,description};
}

export function seasonalGiftsView(ctx){
 const seasonActive=isGiftSeason(ctx.now()),held=ctx.state.resources.elderBox;
 if(seasonActive||!(held>0))return {seasonActive,cards:[]};
 const plan=giftPlan(ctx),reason=ctx.undoLocked?'请等待当前结算完成。':plan.reason||'';
 return {seasonActive,cards:[{
  id:'elderBox',type:'openGift',name:'拆开远古礼盒',oneTime:true,
  description:'远古来客留给蜜林的礼物。拆开时，会按营地已有的进展决定内容。',
  effects:'拆开一份礼物，并留下 1 张礼盒绸纸。',
  confirmationText:'拆开 1 个远古礼盒？礼物会按当前营地进度决定，拆开后留下一张礼盒绸纸。',
  visible:true,unlocked:true,available:!reason,reason,owned:held,costs:[],
 }]};
}

export function actSeasonalGifts(ctx,type,id,amount=1){
 if(type!=='openGift')return undefined;
 if(id!=='elderBox')return ctx.result(false,'找不到这个礼盒。');
 if(amount!==1)return ctx.result(false,'每次只能拆开 1 个礼盒。');
 if(ctx.undoLocked)return ctx.result(false,'请等待当前结算完成。');
 if(isGiftSeason(ctx.now()))return ctx.result(false,'赠礼季尚未结束。请在 12 月 31 日之后拆开礼盒。');
 const s=ctx.state;
 if(!valid(s.resources.elderBox)||s.resources.elderBox<=0)return ctx.result(false,'没有可拆开的远古礼盒。');
 const plan=giftPlan(ctx);
 if(plan.reason)return ctx.result(false,plan.reason);
 const p=ctx.production();
 for(const [key,value]of Object.entries(plan.fields)){
  if(key==='karma'){s.resources.karma=value;s.resourceUnlocked.karma=true;}
  else s[key]=value;
 }
 if(plan.perk)s.metaphysics[plan.perk.id]=true;
 for(const [resource,quantity]of Object.entries(plan.resources))ctx.add(resource,quantity,p);
 ctx.add('elderBox',-1,p);ctx.add('wrappingPaper',1,p);
 ctx.invalidateEffects();
 return ctx.result(true,`礼盒打开了：${plan.description}。绸纸已收好。`,{
  gift:plan.kind,rewards:{...plan.resources,...(plan.perk?{metaphysics:plan.perk.id}:{})},
 });
}
