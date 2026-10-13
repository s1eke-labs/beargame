import {faith,space,metaphysics,time,challenges,cycles} from './progression-catalog.js';
import {leadershipCostMultiplier} from './leadership.js';
import {geometricCost,limitedDR,triangularInverse} from './math.js';
import {onEngineerTick} from './engineer-automation.js';
import {onQueueTick} from './build-queue.js';
import * as industrialTime from './industrial-redshift.js';
import {redshiftRateResources} from './redshift.js';
import {accumulateVoidOrder} from './religion-redshift.js';
const qty=(map,id)=>map?.[id]||0;
const rows={faith,space,metaphysics,time,challenge:challenges};
const safelyUnlocked=(s,id)=>s.religionUnlocked?.[id]||qty(s.religion,id)>0;
const stateKey={faith:'religion',space:'space',metaphysics:'metaphysics',time:'time'};
const MAX_BATCH=1000000;
export const isChallenge=(s,id)=>(id==='ironWill'&&!!s.ironWill)||s.challenge===id||!!s.activeChallenges?.includes(id);
const activeChallenges=s=>[...new Set([...(s.activeChallenges||[]),...(s.challenge?[s.challenge]:[])])];
const clearChallenge=(s,id)=>{s.activeChallenges=activeChallenges(s).filter(x=>x!==id);s.challenge=s.activeChallenges[0]||null;};
function init(s){
 s.activeChallenges??=s.challenge?[s.challenge]:[];s.pendingChallenges??=[];s.challengeReserves??={resources:{},bears:[],cryochambers:0};s.timeUnlocked??={};
 s.elderState??={energy:0,duration:0};s.blackcoinState??={price:1000};
 s.metaphysics??={};s.time??={};s.religionUnlocked??={};s.spaceTravel??={};s.spaceReached??={};s.challengesUnlocked??={};s.challengeBest??={};
 s.activeHolyGenocide??=0;s.karmaKittens??=0;s.transcendencePrice??=0;s.usedCryochambers??=0;
 s.religionCounters??={corruption:0,alicorn:0,pactDebt:0};s.religionCounters.pactDebt??=0;s.timeState??={heat:0,furnaceHeat:0,delayTicks:0,accelerating:false,flux:0};
}
// Mechanical equations independently expressed from religion.js:1535–1692 and game.js:5471–5551.
export const praiseMultiplier=epiphany=>1+triangularInverse(epiphany/.1)*.1;
export const adoreGain=(worship,tier,hasTranscendence=true,manual=true)=>worship/1e6*(hasTranscendence?(tier+1)**2:1)*(manual?1.01:1);
export const transcendPrice=tier=>{const a=Math.exp(tier)/10,b=a*Math.E;return .05*(b*(b+1)-a*(a+1));};
export const karmaGain=(population,anarchy=false)=>[ [35,1],[60,3],[100,4],[150,5],[300,10],[750,15] ].reduce((sum,[threshold,weight])=>sum+Math.max(0,population*(anarchy?2:1)-threshold)*weight,0);
export function solarBonus(s,e={}){return qty(s.religion,'solarRevolution')?limitedDR(triangularInverse(s.praised/1000)/100,10+(e.solarRevolutionLimit||0)+(qty(s.challengeCompletions,'atheism')?s.transcendence:0))*(1+limitedDR(.1*qty(s.challengeCompletions,'atheism'),4)):0;}
const out=(ctx,id,n)=>{const cap=ctx.production().caps[id];ctx.state.resources[id]=Math.max(0,Math.min(cap??Infinity,qty(ctx.state.resources,id)+n));};
function reached(s,destination){const mission=space.find(x=>x.family==='mission'&&x.destination===destination);return !!mission&&qty(s.space,mission.id)>0&&!!s.spaceReached?.[mission.id];}
function reasonFor(ctx,d){
 if(d.unsupported)return d.unsupported;
 const gate={...d.gate};if(d.family==='worship'&&safelyUnlocked(ctx.state,d.id))gate.praised=0;if(d.type==='challenge')delete gate.challenge;
 const r=ctx.gateReason(gate);if(r)return r;
 const s=ctx.state;
 if(d.id==='temporalImpedance'&&s.calendar.year<40000&&!s.timeUnlocked?.temporalImpedance)return '在遥远未来发现后开放';
 if(d.id==='temporalPress'&&!qty(s.challengeCompletions,'1000Years'))return '先完成千年之旅';
 if(d.gate?.challenge&&!s.challengesUnlocked?.[d.gate.challenge])return '需要在先前旅程中发现这项试炼';
 if(d.gate?.praised>s.praised&&!safelyUnlocked(s,d.id))return `需要 ${d.gate.praised} 颂愿`;
 if(d.planet&&!reached(s,d.planet))return '航路尚未抵达';
 if(d.anyMissions?.length&&!d.anyMissions.some(id=>qty(s.space,id)))return '先完成前序航行';
 if(d.family==='pact'&&pactSlots(s)<=0)return '没有空闲约定名额';
 if(d.family==='pactPolicy'&&['siphoning','feedingFrenzy','upfrontPayment'].some(id=>qty(s.religion,id)))return '本轮已选择供养策略';
 if(d.family==='worship'&&isChallenge(s,'atheism'))return '无星长夜中无法购买';
 return '';
}
function owned(s,d){return d.type==='challenge'?qty(s.challengeCompletions,d.id):qty(s[stateKey[d.type]],d.id);}
function limit(s,d){if(d.family==='pact')return owned(s,d)+pactSlots(s);if(d.type==='metaphysics'||d.oneTime)return 1;if(d.repeatAfterTranscendence&&!qty(s.religion,'transcendence'))return 1;if(d.id==='cryochambers')return qty(s.buildings,'chronosphere')+qty(s.challengeCompletions,'postApocalypse');return d.max||MAX_BATCH;}
export function progressionUndoCosts(ctx,d,amount=1){return costs(ctx,d,amount);}
function costs(ctx,d,amount=1){
 const s=ctx.state,e=ctx.effects(),count=owned(s,d);let ratio=d.ratio||1;
 if(d.id==='temporalPress')ratio=Math.max(1.01,1.1-.001*qty(s.challengeCompletions,'1000Years'));
 const result={};for(const [id,base]of Object.entries(d.cost||{})){
  let value=geometricCost(base,d.id==='darkParacosm'&&id==='paragon'?2:d.type==='space'&&d.family==='building'&&id==='oil'?1.05:ratio,count,amount);
  if(d.type==='space'&&d.family==='building'&&d.id==='sattelite'&&isChallenge(s,'blackSky')&&count===0)value+=base*(id==='starchart'?-1:13);
  if(d.type==='space'&&id==='oil')value*=1-limitedDR(e.oilReductionRatio||0,.75);
  if(d.family==='mission'&&id==='manpower')value*=1-limitedDR(e.spaceManpowerReduction||e.catpowerReductionRatio||0,.75);
  if(d.id==='orbitalLaunch'&&isChallenge(s,'blackSky'))value*=id==='starchart'?0:11;
  if(d.family==='mythic'&&id==='ivory'&&qty(s.challengeCompletions,'unicornTears'))value=geometricCost(base,Math.max(1,ratio-limitedDR(.003*qty(s.challengeCompletions,'unicornTears'),.075)),count,amount);
  if(d.type==='space'&&d.family==='building')value*=(1-limitedDR(e[d.id+'CostReduction']||0,1))*(1-limitedDR(e[id+'CostReduction']||0,1));
  if(d.family==='worship')value*=leadershipCostMultiplier(s,id,'religion')*(['faith','gold'].includes(id)?1+(e.religionUpgradesDiscount||0):1);
  result[id]=value;
 }
 if(d.family==='pactPolicy'&&isChallenge(s,'pacifism'))for(const id of Object.keys(result))result[id]*=1.25**qty(s.challengeCompletions,'pacifism');
 if(d.family==='pact'&&qty(s.religion,'upfrontPayment'))result.necrocorn=2*amount;
 if(d.id==='upfrontPayment')result.necrocorn=(result.necrocorn||0)+2*pactCount(s);
 return result;
}
function card(ctx,d){const s=ctx.state,held=owned(s,d),bill=costs(ctx,d),gate=reasonFor(ctx,d),sellType=d.type==='faith'&&d.family==='worship'&&d.repeatAfterTranscendence?'sellFaith':d.type==='space'&&d.family==='building'&&!d.unsupported?'sellSpace':undefined,sellReason=sellType==='sellFaith'?(!qty(s.religion,'transcendence')?'需要升华之路':held<=1?'至少保留一级祈愿':''):held<=0?'没有可拆售的设施':'';let reason=gate;if(!reason&&held>=limit(s,d))reason='已经完成或达到上限';if(!reason&&!ctx.enough(bill))reason='物资不足';return {...d,sellType,sellable:!!sellType&&!sellReason,sellReason:sellType?sellReason:undefined,sellConfirmationText:sellType?`拆售${d.name}会按当前价格返还 50% 可退物资。${sellType==='sellFaith'?'至少保留一级。':'油类与钍不返还；反物质仅在电力充足时返还。'}`:undefined,gate:undefined,cost:undefined,effect:undefined,unlocked:!gate,visible:!gate||held>0,available:!reason,reason,owned:held,completed:limit(s,d)===1&&held>0,costs:Object.entries(bill).map(([id,value])=>({id,name:ctx.resourceById[id]?.name||id,value,owned:qty(s.resources,id)})),effects:d.summary||'',provides:[...new Set([...Object.keys(d.effect||{}).filter(id=>ctx.resourceById[id]&&d.effect[id]>0),...Object.keys(d.conversion?.output||{})])],capacityProvides:Object.keys(d.effect||{}).filter(id=>id.endsWith('Max')&&ctx.resourceById[id.slice(0,-3)]&&d.effect[id]>0).map(id=>id.slice(0,-3)),routeUnits:qty(s.spaceTravel,d.id),travelDays:qty(s.spaceTravel,d.id)/(ctx.effects().routeSpeed||1),travelSeconds:qty(s.spaceTravel,d.id)/(ctx.effects().routeSpeed||1)*2/(s.timeState.accelerating?1.5:1),reached:!!s.spaceReached?.[d.id],enabled:!s.disabled[d.id],toggleable:!!d.conversion};}
function buy(ctx,d,amount){
 if(!d)return ctx.result(false,'找不到这个项目。');const why=reasonFor(ctx,d);if(why)return ctx.result(false,why);
 const s=ctx.state,room=limit(s,d)-owned(s,d);if(room<=0)return ctx.result(false,'已经完成或达到上限。');
 if(amount==='max'){let lo=0,hi=Math.min(MAX_BATCH,room);while(lo<hi){const mid=Math.ceil((lo+hi)/2);if(ctx.enough(costs(ctx,d,mid)))lo=mid;else hi=mid-1;}amount=lo;}
 amount=Math.min(amount,room);const bill=costs(ctx,d,amount);if(amount<1||!ctx.enough(bill))return ctx.result(false,'物资不足。');
 ctx.pay(bill);const map=s[stateKey[d.type]];map[d.id]=d.type==='metaphysics'?true:qty(map,d.id)+amount;
 if(d.family==='mission'&&d.destination)s.spaceTravel[d.id]=d.days;
 if(d.type==='space'&&['spaceStation','terraformingStation'].includes(d.id)){s.ironWill=false;clearChallenge(s,'ironWill');}
 if(d.family==='pact'&&!qty(s.religion,'upfrontPayment'))s.religionCounters.pactDebt+=.5*amount;
 return ctx.result(true,`${d.name}${amount>1?` × ${amount}`:''}已完成。`);
}
function actionCard(ctx,type,id,name,gate,cost={},effects=''){
 const why=gate||(!ctx.enough(cost)?'物资不足':'');return {id,type,name,description:effects,effects,costs:Object.entries(cost).map(([key,value])=>({id:key,name:ctx.resourceById[key]?.name||key,value,owned:qty(ctx.state.resources,key)})),unlocked:!gate,visible:!gate,available:!why,reason:why,owned:0};
}
function transforms(ctx){const s=ctx.state,e=ctx.effects();return [
 {id:'unicorns',name:'灵鹿归星',input:{unicorns:2500},output:'tears',gain:qty(s.buildings,'ziggurat'),gate:qty(s.buildings,'ziggurat')?'':'需要叠石祭坛'},
 {id:'alicorn',name:'凝结时晶',input:{alicorn:25},output:'timeCrystal',gain:1+(e.tcRefineRatio||0),gate:qty(s.buildings,'ziggurat')?'':'需要叠石祭坛'},
 {id:'tears',name:'凝结泪石',input:{tears:10000},output:'sorrow',gain:1,gate:s.metaphysics.megalomania?'':'需要远古回声'},
 {id:'timeCrystal',name:'打磨遗珍',input:{timeCrystal:25},output:'relic',gain:1+(e.relicRefineRatio||0)*effectivePyramids(s),gate:qty(s.buildings,'ziggurat')?'':'需要叠石祭坛'},
 ];}
function sellProgression(ctx,type,id,amount){
 const s=ctx.state,definitions=type==='sellFaith'?faith:space,d=definitions.find(d=>d.id===id);
 if(!d||type==='sellFaith'&&(d.family!=='worship'||!d.repeatAfterTranscendence)||type==='sellSpace'&&(d.family!=='building'||d.unsupported))return ctx.result(false,'这个项目不能拆售。');
 const minimum=type==='sellFaith'?1:0,held=owned(s,d);
 if(type==='sellFaith'&&!qty(s.religion,'transcendence'))return ctx.result(false,'需要升华之路，才能拆售可叠加的祈愿。');
 const count=amount==='max'?held-minimum:Math.min(amount,held-minimum);if(count<1)return ctx.result(false,type==='sellFaith'?'至少保留一级祈愿。':'没有可拆售的设施。');
 const p=ctx.production(),map=s[stateKey[d.type]];map[id]=held-count;ctx.invalidateEffects?.();
 const bill=costs(ctx,d,count),refunds={};
 for(const [resource,value]of Object.entries(bill)){
  if(['oil','kerosene','thorium'].includes(resource)||resource==='antimatter'&&(p.effects.energySupply||0)<(p.effects.energyDemand||0))continue;
  const before=s.resources[resource]||0;ctx.add(resource,Math.min(1e100,value*.5),p);refunds[resource]=s.resources[resource]-before;
 }
 ctx.invalidateEffects?.();return ctx.result(true,`拆售了 ${count} 级${d.name}。`,{sold:count,refunds});
}
export function actProgression(ctx,type,id,amount){
 if(type==='sellFaith'||type==='sellSpace')return sellProgression(ctx,type,id,amount);
 const s=ctx.state;init(s);
 if(type==='faith'||type==='space'||type==='metaphysics'||type==='time')return buy(ctx,rows[type].find(x=>x.id===id),amount);
 if(type==='praise'){
  if(!s.science.theology||isChallenge(s,'atheism'))return ctx.result(false,'尚不能举行祈愿。');
  if(s.resources.faith<=.0001)return ctx.result(false,'还没有积攒足够的信仰。');
  const gain=s.resources.faith*praiseMultiplier(s.faithRatio);if(!Number.isFinite(gain)||gain>1e100-s.praised)return ctx.result(false,'祈愿结果超出可保存范围，信仰尚未消耗。');s.praised+=gain;s.resources.faith=.0001;unlockFaith(s);return ctx.result(true,`积累 ${Number(gain.toFixed(3))} 颂愿。`);
 }
 if(type==='adore'){
  if(!qty(s.religion,'apocripha'))return ctx.result(false,'先获得灵悟手记。');
  const gain=adoreGain(s.praised,s.transcendence,qty(s.religion,'transcendence')>0);s.faithRatio+=gain;s.praised=.01;return ctx.result(true,`获得 ${Number(gain.toPrecision(5))} 灵悟。`);
 }
 if(type==='transcend'){
  const price=transcendPrice(s.transcendence);if(!qty(s.religion,'transcendence'))return ctx.result(false,'先获得升华之路。');
  if(!(s.faithRatio>price))return ctx.result(false,'灵悟必须高于下一阶的需求。');s.faithRatio-=price;s.transcendencePrice+=price;s.transcendence++;return ctx.result(true,`抵达升华 ${s.transcendence} 阶。`);
 }
 if(type==='sacrifice'){
  const d=transforms(ctx).find(x=>x.id===id);if(!d)return ctx.result(false,'不存在这项仪式。');if(d.gate)return ctx.result(false,d.gate);
  if(amount==='max')amount=Math.min(MAX_BATCH,...Object.entries(d.input).map(([k,v])=>Math.floor(qty(s.resources,k)/v)));
  const bill=Object.fromEntries(Object.entries(d.input).map(([k,v])=>[k,v*amount]));if(amount<1||!ctx.enough(bill))return ctx.result(false,'物资不足。');
  const cap=ctx.production().caps[d.output];if(cap!==null&&qty(s.resources,d.output)>=cap)return ctx.result(false,'产物已达到容量。');ctx.pay(bill);out(ctx,d.output,d.gain*amount);return ctx.result(true,`${d.name}完成，获得 ${d.gain*amount} ${ctx.resourceById[d.output]?.name}。`);
 }
 if(type==='feedElders'){
  if(!s.discoveries.leviathans)return ctx.result(false,'先等待远古商队来访。');
  const count=Math.floor(Math.min(amount==='max'?MAX_BATCH:amount,s.resources.necrocorn));
  if(count<1){s.resources.necrocorn=0;s.elderState.duration=0;return ctx.result(true,'不足一只的供养无法维持造访，商队将要离开。');}
  const e=ctx.effects(),bonus=(e.feedEldersEfficiencyRatio||0)+(qty(s.religion,'feedingFrenzy')?triangularInverse(pactSlots(s)/50):0);
  s.resources.necrocorn-=count;s.elderState.energy=Math.min(Math.floor((5+5*effectiveMarkers(s))*(1+(e.leviathansEnergyModifier||0))),s.elderState.energy+count*(1+bonus));
  if(s.elderState.energy>=25)s.challengesUnlocked.unicornTears=true;return ctx.result(true,`远古商队的能量提升至 ${Number(s.elderState.energy.toFixed(3))}。`);
 }
 if(type==='crashBlackcoin'){
  if(!s.discoveries.leviathans||!s.science.antimatter||!s.workshop.invisibleBlackHand)return ctx.result(false,'需要来访商队、反物质研究与暗市调律。');
  if(s.blackcoinState.price<=550)return ctx.result(false,'价格高于 550 时才能调律。');const bill={timeCrystal:blackcoinCrashCost(s,ctx.effects())};if(!ctx.enough(bill))return ctx.result(false,'时晶不足。');
  ctx.pay(bill);s.blackcoinState.price*=.7+.1*ctx.nextRandom(s);return ctx.result(true,'暗市价格已经下调。');
 }
 if(type==='buyBlackcoin'||type==='sellBlackcoin'){
  if(!s.discoveries.leviathans||(!s.science.blackchain&&!s.resources.blackcoin))return ctx.result(false,'暗市只在远古商队造访且已发现暗链时开放。');
  const buy=type==='buyBlackcoin',from=buy?'relic':'blackcoin',to=buy?'blackcoin':'relic',stock=s.resources[from];if(stock<=0)return ctx.result(false,'没有可兑换的存量。');
  const gain=buy?stock/s.blackcoinState.price:stock*s.blackcoinState.price,total=s.resources[to]+gain;if(!Number.isFinite(gain)||!Number.isFinite(total)||total>1e100)return ctx.result(false,'兑换结果超出可保存的数值范围。');s.resources[from]=0;s.resources[to]=total;return ctx.result(true,`已兑换 ${Number(gain.toPrecision(5))} ${ctx.resourceById[to].name}。`);
 }
 if(type==='payPactDebt'){const debt=s.religionCounters.pactDebt,bill={necrocorn:Math.ceil(debt)};if(debt<=0)return ctx.result(false,'没有待偿债务。');if(!ctx.enough(bill))return ctx.result(false,'夜影鹿不足。');ctx.pay(bill);s.religionCounters.pactDebt=0;return ctx.result(true,'约定债务已经偿清。');}
 if(type==='burnParagon'){
  if(!s.science.metaphysics)return ctx.result(false,'先研究传承学。');if(!s.resources.paragon)return ctx.result(false,'没有可燃烧的传承。');s.resources.burnedParagon+=s.resources.paragon;s.resources.paragon=0;return ctx.result(true,'传承已化作余烬，跨越重建继续生效。');
 }
 if(type==='reset')return id==='confirm'?reset(ctx):ctx.result(false,'需要确认重建营地。');
 if(type==='challenge'||type==='challengeSelect'){
  const d=challenges.find(x=>x.id===id);if(!d)return ctx.result(false,'不存在这项试炼。');const why=reasonFor(ctx,d);if(why)return ctx.result(false,why);
  if(type==='challenge')return reset(ctx,[id]);
  s.pendingChallenges=s.pendingChallenges.includes(id)?s.pendingChallenges.filter(x=>x!==id):[...s.pendingChallenges,id];return ctx.result(true,s.pendingChallenges.includes(id)?'已加入下轮试炼。':'已取消这项试炼。');
 }
 if(type==='challengeStart'){
  if(id!=='confirm')return ctx.result(false,'需要确认重建并开启所选试炼。');if(!s.pendingChallenges.length)return ctx.result(false,'先选择至少一项试炼。');
  for(const selected of s.pendingChallenges){const why=reasonFor(ctx,challenges.find(d=>d.id===selected));if(why)return ctx.result(false,why);}return reset(ctx,[...s.pendingChallenges]);
 }
 if(type==='reclaimReserves')return reclaimReserves(ctx);
 if(type==='accelerate'){
  if(!s.science.calendar)return ctx.result(false,'先研究历法。');if(!s.timeState.accelerating&&s.resources.temporalFlux<1)return ctx.result(false,'没有足够的时流。');s.timeState.accelerating=!s.timeState.accelerating;return ctx.result(true,s.timeState.accelerating?'时流加速已开启。':'时流加速已暂停。');
 }
 if(type==='shatter'){if(id==='press'){amount=qty(s.time,'temporalPress')*(s.timeState.pressEnabled?25:5);if(!amount)return ctx.result(false,'需要时页压机。');}return shatter(ctx,amount);}
 if(type==='useFurnaceHeat'){
  if(!s.workshop.tachyonModerator)return ctx.result(false,'需要时流调节器。');const n=amount==='max'?Math.min(MAX_BATCH,Math.floor(s.timeState.furnaceHeat/100)):amount;if(n<1||s.timeState.furnaceHeat<100*n)return ctx.result(false,'熔炉热量不足。');s.timeState.furnaceHeat-=100*n;advanceYears(ctx,n);return ctx.result(true,`熔炉热量推动时光翻过 ${n} 年。`);
 }
 if(type==='toggleTemporalPress'){
  if(!qty(s.time,'temporalPress')||(qty(s.challengeCompletions,'1000Years')<2&&qty(s.religion,'blazar')<3))return ctx.result(false,'需要时页压机，并完成两次千年试炼或拥有三座远星耀斑。');s.timeState.pressEnabled=!s.timeState.pressEnabled;return ctx.result(true,s.timeState.pressEnabled?'时页压机强化已开启。':'时页压机强化已关闭。');
 }
 if(type==='repairCryochamber'){
  if(!s.workshop.chronoforge||!s.usedCryochambers)return ctx.result(false,'没有可修复的冬眠舱。');const bill={temporalFlux:3000,timeCrystal:100,void:500};if(!ctx.enough(bill))return ctx.result(false,'物资不足。');ctx.pay(bill);s.usedCryochambers--;s.time.cryochambers=qty(s.time,'cryochambers')+1;return ctx.result(true,'冬眠舱已修复。');
 }
 if(type==='toggleFurnace'){if(!qty(s.time,'blastFurnace'))return ctx.result(false,'需要时焰熔炉。');s.timeState.furnaceEnabled=!s.timeState.furnaceEnabled;return ctx.result(true,s.timeState.furnaceEnabled?'熔炉自动穿越已开启。':'熔炉自动穿越已暂停。');}
 if(isChallenge(s,'atheism')&&type==='assign'&&id==='priest')return ctx.result(false,'无星长夜中不能安排祈愿熊。');
 if(isChallenge(s,'pacifism')&&type==='hunt')return ctx.result(false,'和平山林中不能狩猎。');
 return undefined;
}
// game.js:5630–5855 and resources.js:125–349: survival is explicit, not a blanket inventory clone.
const alwaysKeep=new Set(['paragon','burnedParagon','sorrow','temporalFlux','elderBox','wrappingPaper']);
const neverKeep=new Set(['zebras','furs','ivory','spice','unicorns','alicorn','necrocorn','tears','karma','gflops','hashrates']);
export function retainedResource(id,value,s,catalog){
 if(alwaysKeep.has(id))return value;if(neverKeep.has(id))return 0;if(id==='timeCrystal')return s.metaphysics?.anachronomancy?value:0;
 const ratio=qty(s.buildings,'chronosphere')*.015;if(!ratio)return 0;
 const craft=catalog.crafts.some(x=>x.output===id)&&id!=='wood';if(craft)return s.workshop.fluxCondensator?Math.sqrt(value)*ratio*100:0;
 return id==='void'?Math.floor(value*ratio):value*ratio;
}
export function prestigePreview(ctx){const s=ctx.state;init(s);const e=ctx.effects(),population=Math.round(s.bears.length*(1+(e.simScalingRatio||0))),gain=karmaGain(population,qty(s.challengeCompletions,'anarchy')>0),karma=triangularInverse((s.karmaKittens+gain)/5);return {available:true,paragon:Math.max(0,population-70),karma:karma-s.resources.karma,karmaGain:gain,bears:population,preservedBears:preservedBearCount(s),retention:qty(s.buildings,'chronosphere')*.015,preserved:Object.fromEntries(Object.entries(s.resources).map(([id,v])=>[id,retainedResource(id,v,s,ctx.catalog)]).filter(([,v])=>v>0)),description:'重建清除本轮建筑、科技、星际设施与普通祈愿。传承、灵悟、升华建筑与已完成试炼保留；时光蜜球和冬眠舱可延续部分资源与小熊。'};}
function activeCryochambers(s){return Math.min(qty(s.time,'cryochambers'),qty(s.buildings,'chronosphere')+qty(s.challengeCompletions,'postApocalypse'));}
function preservedBearCount(s){return Math.min(activeCryochambers(s),s.bears.length);}
function reset(ctx,selected=[]){
 const s=ctx.state;
 if(isChallenge(s,'atheism')&&(activeCryochambers(s)>0||qty(s.buildings,'stasisPod')>0))complete(ctx,'atheism');
 if(isChallenge(s,'pacifism')&&s.policies?.outerSpaceTreaty)complete(ctx,'pacifism');
 const preview=prestigePreview(ctx),next=ctx.createState(s.rng,ctx.now());init(next);
 next.zebraKarma=(s.zebraKarma||0)+zebraKarmaGain(s,ctx.catalog);
 next.settings={...s.settings};next.stats={...s.stats,totalResets:s.stats.totalResets+1};next.metaphysics={...s.metaphysics};next.timeUnlocked={...s.timeUnlocked};next.challengeCompletions={...s.challengeCompletions};next.challengesUnlocked={...s.challengesUnlocked};next.challengeBest={...s.challengeBest};next.challengeReserves=ctx.clone(s.challengeReserves);
 next.karmaKittens=s.karmaKittens+preview.karmaGain;next.resources.karma=triangularInverse(next.karmaKittens/5);
 for(const [id,value]of Object.entries(preview.preserved)){
  if(!selected.length||alwaysKeep.has(id)||id==='timeCrystal')next.resources[id]=value;
  else next.challengeReserves.resources[id]=Math.max(qty(next.challengeReserves.resources,id),value);
 }
 next.resources.paragon+=preview.paragon;
 next.faithRatio=s.faithRatio+(qty(s.religion,'apocripha')?adoreGain(s.praised,s.transcendence,qty(s.religion,'transcendence')>0,false):0);next.transcendence=s.transcendence;next.transcendencePrice=s.transcendencePrice;next.activeHolyGenocide=qty(s.religion,'holyGenocide');
 for(const d of faith)if(d.family==='transcendence'&&s.religion[d.id])next.religion[d.id]=s.religion[d.id];
 const kept=s.bears.slice().sort((a,b)=>b.experience-a.experience).slice(0,preview.preservedBears).map(b=>({...ctx.clone(b),job:null,engineerSpecialty:null}));
 const directBears=!selected.length||(selected.includes('postApocalypse')&&!selected.includes('ironWill'));
 if(directBears){next.bears=kept;next.usedCryochambers=preview.preservedBears;}
 else{next.challengeReserves.bears.push(...kept);next.challengeReserves.cryochambers+=Math.min(qty(s.time,'cryochambers'),qty(s.buildings,'chronosphere')+qty(s.challengeCompletions,'postApocalypse'));}
 next.blackcoinState={...s.blackcoinState};
 next.ironWill=selected.includes('ironWill')||(!kept.length&&(!selected.length?qty(s.buildings,'chronosphere')===0:true));
 next.nextBearId=s.nextBearId;next.startedWithChronospheres=qty(s.buildings,'chronosphere')>0||activeCryochambers(s)>0;
 next.time.temporalPress=isChallenge(s,'1000Years')?0:Math.min(qty(s.time,'temporalPress'),qty(s.challengeCompletions,'1000Years')*10);
 if(s.metaphysics.anachronomancy&&s.science.chronophysics)next.science.chronophysics=true;
 next.activeChallenges=[...selected];next.challenge=selected[0]||null;
 if(selected.includes('winterIsComing'))next.calendar.season=3;
 if(selected.includes('postApocalypse')){next.pollution=1e11+1e8*(qty(s.challengeCompletions,'postApocalypse')+next.bears.length);next.resources.honey=1000*next.bears.length*(1+s.resources.karma/100);}
 ctx.replaceState(next);return ctx.result(true,selected.length?'新的试炼旅程已经开始。':'旧营地化作记忆，新的森林旅程开始了。');
}
function reclaimReserves(ctx){
 const s=ctx.state,r=s.challengeReserves;if(activeChallenges(s).length||isChallenge(s,'ironWill'))return ctx.result(false,'先结束全部试炼与独行模式，再领取储备。');
 if(!r.bears.length&&!Object.keys(r.resources).length&&!r.cryochambers)return ctx.result(false,'没有待领取的储备。');
 const caps=ctx.production().caps;
 for(const [id,value]of Object.entries(r.resources)){if(id==='timeCrystal')continue;s.resources[id]=caps[id]===null?qty(s.resources,id)+value:Math.max(qty(s.resources,id),value);if(value>0)s.resourceUnlocked[id]=true;}
 for(const bear of r.bears)s.bears.push({...ctx.clone(bear),id:s.nextBearId++,job:null,engineerSpecialty:null});
 s.usedCryochambers+=r.cryochambers;s.challengeReserves={resources:{},bears:[],cryochambers:0};s.startedWithChronospheres=true;return ctx.result(true,'储备物资与冬眠小熊已经返回营地。');
}
export function additionalEffects(s,base={}){
 init(s);const e={};const add=(key,v)=>e[key]=(e[key]||0)+v;
 for(const d of metaphysics)if(s.metaphysics[d.id])for(const [k,v]of Object.entries(d.effect||{}))add(k,v);
 for(const d of time)for(const [k,v]of Object.entries(d.effect||{}))add(k,v*qty(s.time,d.id));
 add('solarRevolutionLimit',qty(s.religion,'blackObelisk')*.05*s.transcendence);

 const t=qty(s.buildings,'temple'),r=s.religion;
 if(!isChallenge(s,'atheism')){
  const altar=qty(r,'sunAltar'),spire=qty(r,'goldenSpire'),scholar=qty(r,'scholasticism'),basilica=qty(r,'basilica'),templars=qty(r,'templars');
  add('faithMax',t*((100+altar*50)*(1+(spire?.4+.1*spire:0))-100));
  add('faithMax',qty(s.buildings,'chapel')*triangularInverse(qty(r,'frescoes')/1.65)*s.resources.karma);

  if(scholar)add('scienceMax',t*(400+100*scholar));
  if(altar)add('happiness',t*(.004+.001*altar));
  if(basilica)add('cultureMax',t*(75+50*basilica));
  if(templars)add('manpowerMax',t*(50+25*templars));
 }
 if(isChallenge(s,'atheism')){const n=qty(s.challengeCompletions,'atheism');add('cultureMax',-250*n);add('scienceMax',-500*n);add('manpowerMax',-125*n);add('happiness',-.005*n);add('faithMax',-100*t);}
 add('energyDemand',qty(s.time,'timeBoiler')**2-qty(s.time,'timeBoiler'));
 add('heatMax',10*qty(s.time,'timeBoiler')**2*qty(s.time,'blastFurnace'));
 add('temporalParadoxDay',qty(s.time,'chronocontrol')*(base.temporalParadoxDayBonus||0));
 const completions=s.challengeCompletions;
 if(isChallenge(s,'energy'))add('energyConsumptionIncrease',.1*qty(completions,'energy'));else add('energyConsumptionRatio',-limitedDR(.02*qty(completions,'energy'),1));
 if(!isChallenge(s,'pacifism')){const n=qty(completions,'pacifism');add('alicornPerTickRatio',.1*n);add('tradeRatio',.015*Math.min((7+3*n)*(.99+.01*n),qty(s.buildings,'tradepost')*limitedDR(.099+.0075*n,.25)));}
 if(isChallenge(s,'postApocalypse'))add('pollutionArrivalDivisor',10*qty(completions,'postApocalypse'));
 if(!isChallenge(s,'unicornTears')&&qty(completions,'unicornTears'))add('faithMax',qty(s.religion,'unicornTomb')*2*(s.transcendence<1?5:s.transcendence<100?5+3*s.transcendence**1.5:3000));
 const enabled=id=>s.disabled[id]?0:qty(s.space,id);
 if(s.workshop.solarSatellites){add('energyDemand',-enabled('sattelite'));add('energySupply',enabled('sattelite'));}
 if(s.workshop.amBases)add('energyDemand',-5*enabled('moonBase'));
 add('antimatterMax',enabled('containmentChamber')*100*.02*enabled('heatsink'));
 add('energyDemand',enabled('containmentChamber')*50*.01*enabled('heatsink'));
 for(const id of ['iron','titanium','gold'])add(`${id}MaxRatio`,enabled('sunforge')*.01);
 for(const [building,key]of [['moonBase','moonBaseStorageBonus'],['cryostation','cryostationStorageBonus'],['planetCracker','planetCrackerStorageBonus']]){
  const d=space.find(x=>x.id===building);let multiplier=1+(base[key]||0);
  if(building==='moonBase'&&s.workshop.aiBases)multiplier*=1+qty(s.buildings,'aiCore')*.1*(1+(base.aiCoreUpgradeBonus||base.aiBonusRatio||0));
  for(const [key,value]of Object.entries(d.effect))if(key.endsWith('Max'))add(key,value*enabled(building)*(multiplier-1)*cycleMultiplier(s,building,key));
 }
 add('scienceMax',(enabled('researchVessel')*10000+enabled('spaceBeacon')*25000)*(base.spaceScienceRatio||0));
 add('bears',enabled('terraformingStation')*(triangularInverse(enabled('hydroponics')/100)+(base.terraformingHousingRatio||0)));
 add('energySupply',enabled('tectonic')*25*.05*enabled('moltenCore'));
 const umbra=(1+.01*triangularInverse(Math.max(0,s.calendar.year-40000)/.075))*(1+qty(s.time,'voidRift')*.1+(base.umbraBoostRatio||0));
 add('energySupply',enabled('hrHarvester')*(umbra-1));
 add('simScalingRatio',.02*(s.activeHolyGenocide-qty(s.religion,'holyGenocide')));
 add('maxKittensRatio',-.01*(s.activeHolyGenocide-qty(s.religion,'holyGenocide')));
 const pact=pactEffects(s);for(const [k,v]of Object.entries(pact))add(k,v);
 if(s.metaphysics.numerology)for(const m of currentCycle(s).buildingMultipliers){const d=space.find(d=>d.id===m.building),base=d?.effect?.[m.effect];if(base)add(m.effect,base*enabled(m.building)*(m.factor-1));}
 return e;
}
export function extendProduction(ctx,p){
 const s=ctx.state,e=p.effects;
 if(!isChallenge(s,'atheism')){
  const temple=qty(s.buildings,'temple'),basilica=qty(s.religion,'basilica');
  const culture=temple*(.05*qty(s.religion,'stainedGlass')+(basilica?.2+.05*(basilica-1):0))*(1+(e.cultureRatio||0))*p.globalProduction;
  p.gross.culture+=culture;p.net.culture+=culture;
 }
 const religionFaith=p.gross.faith*(e.faithRatioReligion||0);p.gross.faith+=religionFaith;p.net.faith+=religionFaith;
 const faithBoost=solarBonus(s,e);
 for(const id of Object.keys(p.gross)){const delta=(p.gross[id]-(p.postMultiplierGross?.[id]||0))*faithBoost*(id==='wood'||id==='honey'?1-(e.pollutionSolarReduction||0):1);p.gross[id]+=delta;p.net[id]+=delta;}
 p.faithProduction=faithBoost;p.globalProduction*=1+faithBoost;
 p.caps.sorrow=qty(s.religion,'blackCore')+17;
 if(e.unicornsRatioReligion){const delta=p.gross.unicorns*e.unicornsRatioReligion;p.gross.unicorns+=delta;p.net.unicorns+=delta;}
 if(s.resources.alicorn>0||s.metaphysics.alicornmancy){const rate=(e.alicornPerTick||0)*(1+limitedDR(e.alicornPerTickRatio||0,1.2));p.gross.alicorn+=rate;p.net.alicorn+=rate;}

 if(isChallenge(s,'atheism')){p.gross.faith=0;p.net.faith=0;}
 if(isChallenge(s,'unicornTears')){p.caps.unicorns=(10+50*qty(s.buildings,'unicornPasture')+700*qty(s.buildings,'ziggurat')+2000*qty(s.religion,'ivoryCitadel')+50*qty(s.religion,'skyPalace')+5500*qty(s.religion,'unicornUtopia'))*(1+.1*qty(s.religion,'sunspire')+(e.unicornsMaxRatio||0));p.caps.tears=1+3*qty(s.buildings,'ziggurat')+qty(s.religion,'unicornTomb')+20*qty(s.religion,'ivoryTower')+5*qty(s.religion,'ivoryCitadel')+275*qty(s.religion,'skyPalace')+1800*qty(s.religion,'unicornUtopia')+10000*qty(s.religion,'sunspire');p.caps.alicorn=.2+.2*qty(s.religion,'skyPalace')+.6*qty(s.religion,'unicornUtopia')+qty(s.religion,'sunspire')+(e.alicornMax||0)+(e.alicornCapacity||0);}
 applySpaceProduction(ctx,p);
 if(s.metaphysics.numeromancy&&s.festivalDays>0)for(const [id,multiplier]of Object.entries(currentCycle(s).festivalResourceMultipliers)){const delta=p.gross[id]*(multiplier*(1+(e.festivalRatio||0))-1);p.gross[id]+=delta;p.net[id]+=delta;}
 const pact=pactEffects(s);
 for(const id of Object.keys(p.gross)){const multiplier=(1+(pact.pyramidGlobalProductionRatio||0))*(id==='faith'?1+(pact.pyramidFaithRatio||0):1);const delta=p.gross[id]*(multiplier-1);p.gross[id]+=delta;p.net[id]+=delta;}
 const transient=new Set(['manpower','science','culture','faith','starchart','temporalFlux','void','karma','paragon','burnedParagon','sorrow']);
 for(const id of Object.keys(p.caps))if(p.caps[id]!==null&&!(isChallenge(s,'unicornTears')&&['unicorns','alicorn','tears'].includes(id))&&!transient.has(id)&&!ctx.catalog.crafts.some(c=>c.output===id&&id!=='wood'))p.caps[id]*=(1+(e.globalResourceRatio||0))*(1+(pact.pyramidGlobalResourceRatio||0));
 p.effects.bears=Math.round(Math.floor(p.effects.bears||0)*(1+limitedDR(-.01*s.activeHolyGenocide,1)));
 return p;
}
function applySpaceProduction(ctx,p){
 const s=ctx.state,e=p.effects;
 const energySupply=e.energySupply||0,energyDemand=e.energyDemand||0;
 const energyFactor=e.energyDeficit??(energyDemand>energySupply?Math.max(.25,energySupply/energyDemand):1);
 const spaceBonus=1+(e.spaceRatio||0)*energyFactor;
 const groundActive=id=>s.disabled[id]?0:Math.min(qty(s.buildings,id),s.activeBuildings?.[id]??qty(s.buildings,id));
 const transfer=(1+p.faithProduction)*(1+p.paragonProduction*.05)*(1+(e.productionRatio||0))*(1+(e.magnetoRatio||0)*(1+groundActive('steamworks')*(.15+(e.steamMagnetoBonus||0))));
 const factories=groundActive('factory')*(s.workshop.factoryLogistics?.06:.05)*(1+(e.environmentFactoryCraftBonus||0));
 for(const d of space){const count=qty(s.space,d.id);if(!count||d.family==='mission'||s.disabled[d.id])continue;
  let scale=count;for(const [id,value]of Object.entries(d.conversion?.input||{}))scale=Math.min(scale,Math.max(0,qty(s.resources,id)+p.net[id])/(value*cycleMultiplier(s,d.id,`${id}Consumption`)));
  for(const [id,value]of Object.entries(d.conversion?.input||{}))p.net[id]-=value*scale*cycleMultiplier(s,d.id,`${id}Consumption`);
  for(const [id,value]of Object.entries(d.production||d.conversion?.output||{})){

   const kind=d.productionKind?.[id]||'Space';
   let bonus=spaceBonus*(1+(s.workshop.spaceManufacturing&&id!=='uranium'?factories*.75:0));
   if(kind==='BaseSpace')bonus*=p.globalProduction*(1+(e[`${id}Ratio`]||0));
   if(kind==='AutoprodSpace')bonus*=1+(transfer-1)*(e.prodTransferBonus||0);
   if(d.id==='sattelite'&&id==='starchart'&&isChallenge(s,'blackSky')&&!isChallenge(s,'ironWill'))bonus/=1+limitedDR(.1*qty(s.challengeCompletions,'blackSky')**2,30);
   if(d.id==='planetCracker')bonus*=1+(e.crackerRatio||0);
   if(d.id==='moonOutpost')bonus*=1+(e.lunarOutpostRatio||0);
   if(d.id==='entangler')bonus=1;
   bonus*=cycleMultiplier(s,d.id,id==='hashrates'?'gflopsConsumption':`${id}PerTick${kind}`);
   const output=value*scale*bonus;p.net[id]+=output;p.gross[id]+=output;
  }
  if(d.conversion)p.conversions.push({id:d.id,scale,total:count});
 }
}
function complete(ctx,id){const s=ctx.state;if(!isChallenge(s,id))return;if(id==='postApocalypse'){s.policyUnlocked??={};s.policyUnlocked.postApocalypseReward=true;}s.challengeCompletions[id]=qty(s.challengeCompletions,id)+1;s.challengesUnlocked[id]=true;clearChallenge(s,id);ctx.log(`试炼「${challenges.find(x=>x.id===id)?.name||id}」已完成。`,'achievement');}
export function onDayProgression(ctx){
 const s=ctx.state;init(s);const e=ctx.effects();
 settlePacts(ctx);
 if(s.discoveries.leviathans){if(s.elderState.duration<=0){s.discoveries.leviathans=false;ctx.log('远古商队结束了这次造访。','trade');}else s.elderState.duration--;}
 if(s.science.antimatter){const direction=Math.floor(ctx.nextRandom(s)*10),sign=direction<4?1:direction<7?0:-1;s.blackcoinState.price*=1+sign*ctx.nextRandom(s)/40000;if(s.blackcoinState.price>1100)s.blackcoinState.price*=.7+.1*ctx.nextRandom(s);}
 const random=(range)=>Math.floor(ctx.nextRandom(s)*range);
 if(s.calendar.day<0)out(ctx,'void',random(4+(e.temporalParadoxVoid||0))-1);
 const eventRatio=(s.metaphysics.unicornmancy?1.1:1)*(1+(e.timeRatio||0)*.25);
 if(e.riftChance&&random(10000)<e.riftChance*10000*eventRatio)out(ctx,'unicorns',500*(1+(e.unicornsRatioReligion||0)*.1));
 if(e.alicornChance&&random(100000)<e.alicornChance*100000*(1+limitedDR(e.alicornPerTickRatio||0,1.2))){out(ctx,'alicorn',1);ctx.log('一只星翼鹿循着星光来到祭坛。','event');}
 if(e.ivoryMeteorChance&&random(10000)<e.ivoryMeteorChance*10000*eventRatio)out(ctx,'ivory',250+random(1500)*(1+(e.ivoryMeteorRatio||0)));
 if(s.science.voidSpace)s.challengesUnlocked.atheism=true;
 if(qty(s.space,'centaurusSystemMission'))s.challengesUnlocked.energy=true;
 if(qty(s.religion,'holyGenocide'))s.challengesUnlocked.postApocalypse=true;
 if(s.discoveries.leviathans)s.challengesUnlocked.blackSky=true;
 if(s.calendar.day>=0&&!s.disabled.spaceBeacon&&e.beaconRelicsPerDay){
  const p=ctx.production(),pyramids=effectivePyramids(s),hash=Math.max(0,Math.floor(Math.log(Math.max(s.resources.hashrates,1)/1000)/Math.log(1.6)));
  out(ctx,'relic',qty(s.space,'spaceBeacon')*e.beaconRelicsPerDay*(1+(e.relicRefineRatio||0)*pyramids*.1)*Math.min(p.caps.antimatter/5000,1)*(1+.25*hash));
 }
 if(isChallenge(s,'winterIsComing')&&reached(s,'helios'))complete(ctx,'winterIsComing');
 if(isChallenge(s,'blackSky')&&qty(s.space,'spaceBeacon')>qty(s.challengeCompletions,'blackSky'))complete(ctx,'blackSky');
 if(isChallenge(s,'unicornTears')&&s.resources.necrocorn>=1)complete(ctx,'unicornTears');

}
export function onTickProgression(ctx){
 const s=ctx.state;init(s);const e=ctx.effects();
 for(const d of space)if(d.family==='mission'&&d.destination&&qty(s.space,d.id)&&!s.spaceReached[d.id]){
  if(s.spaceTravel[d.id]>0)s.spaceTravel[d.id]=Math.max(0,s.spaceTravel[d.id]-(e.routeSpeed||1)/10);
  else{s.spaceReached[d.id]=true;ctx.log(`${d.name}已经抵达。`,'achievement');}
 }
 unlockFaith(s);
 if(isChallenge(s,'anarchy')&&qty(s.buildings,'aiCore'))complete(ctx,'anarchy');
 if(isChallenge(s,'postApocalypse')&&s.pollution===0)complete(ctx,'postApocalypse');
 if(isChallenge(s,'energy')&&s.buildingStages?.pasture===1&&s.buildingStages?.aqueduct===1&&['pasture','aqueduct','steamworks','magneto','reactor'].every(id=>qty(s.buildings,id))&&s.workshop.solarSatellites&&['sattelite','sunlifter','tectonic','hrHarvester'].every(id=>qty(s.space,id)))complete(ctx,'energy');
 if(s.metaphysics.voidOrder&&s.calendar.day>=0)s.praised+=ctx.production().net.faith*.1*(1+(e.voidResonance||0))*(1+(praiseMultiplier(s.faithRatio)-1)/4);
 if(s.resources.alicorn>0){const rate=(e.corruptionRatio||0)*(1+(isChallenge(s,'blackSky')?0:limitedDR(.1*qty(s.challengeCompletions,'blackSky'),2)))*(s.resources.necrocorn>(qty(s.religion,'feedingFrenzy')?1:0)?.25*(1+(e.corruptionBoostRatio||0)):1)*(1+Math.sqrt(s.resources.sorrow*(e.blsCorruptionRatio||0)))*(qty(s.religion,'feedingFrenzy')?.9:1);s.religionCounters.corruption+=rate;
  const converted=Math.max(0,Math.min(Math.floor(s.religionCounters.corruption),Math.ceil(s.resources.alicorn)-1));s.resources.alicorn-=converted;const paid=qty(s.religion,'siphoning')?Math.min(converted,Math.floor(s.religionCounters.pactDebt)):0;s.religionCounters.pactDebt-=paid;s.resources.necrocorn+=converted-paid;s.religionCounters.corruption=Math.min(1,s.religionCounters.corruption-converted);
 }else s.religionCounters.corruption=0;
}
// Sum the product of two piecewise-linear penalties, using at most three intervals.
export function shatterCost(count,{heat=0,heatMax=100,heatPer=10,year=0,impedance=0,reduction=0,challenge=false,challengeLevel=1}={}){
 const edges=[0,count,Math.ceil((heatMax-heat)/heatPer),40000+impedance-year].map(n=>Math.max(0,Math.min(count,n))).sort((a,b)=>a-b);let total=0;
 for(let j=1;j<edges.length;j++){const lo=edges[j-1],hi=edges[j];if(hi<=lo)continue;const heatOn=heat+lo*heatPer>=heatMax,dfOn=year+lo>=40000+impedance;const a=heatOn?heatPer*.01:0,b=heatOn?1+(heat-heatMax)*.01:1,c=dfOn?.00001:0,d=dfOn?1+(year-40000-impedance)*.00001:1;
  const n=hi-lo,S=(lo+hi-1)*n/2,Q=(hi*(hi-1)*(2*hi-1)-lo*(lo-1)*(2*lo-1))/6;total+=a*c*Q+(a*d+b*c)*S+b*d*n;
 }
 return {timeCrystal:total*(1-reduction+(challenge?.5*challengeLevel:0)),...(challenge?{void:Math.round(total*.4*challengeLevel*1000)/1000}:{})};
}
function currentShatterCost(ctx,n){const s=ctx.state,e=ctx.effects();return shatterCost(n,{heat:s.timeState.heat,heatMax:100+(e.heatMax||0),heatPer:qty(s.challengeCompletions,'1000Years')?5:10,year:s.calendar.year,impedance:Math.round(1000*(1+(e.timeRatio||0)))*qty(s.time,'temporalImpedance'),reduction:isChallenge(s,'1000Years')?0:limitedDR(.02*qty(s.challengeCompletions,'1000Years'),1),challenge:isChallenge(s,'1000Years'),challengeLevel:qty(s.challengeCompletions,'1000Years')});}
function shatter(ctx,n){const s=ctx.state;if(!s.science.chronophysics)return ctx.result(false,'先研究时空物理。');if(n==='max'){let lo=0,hi=MAX_BATCH;while(lo<hi){const mid=Math.ceil((lo+hi)/2);if(ctx.enough(currentShatterCost(ctx,mid)))lo=mid;else hi=mid-1;}n=lo;}const bill=currentShatterCost(ctx,n);if(n<1||!ctx.enough(bill))return ctx.result(false,'时晶或虚空不足。');ctx.pay(bill);const heat=n*(qty(s.challengeCompletions,'1000Years')?5:10),compression=isChallenge(s,'1000Years')?0:.05*qty(s.challengeCompletions,'1000Years');s.timeState.heat+=heat/(1+compression);s.timeState.furnaceHeat+=heat*(1-1/(1+compression))*(1+Math.min(3,.1*qty(s.challengeCompletions,'1000Years')));advanceYears(ctx,n);return ctx.result(true,`时光翻过 ${n} 年。`);}
function advanceYears(ctx,n){
 const steps=advanceYearsSteps(ctx,n);
 if(ctx.runYearJump)ctx.runYearJump(steps);else for(const _ of steps){}
}
/** Each yielded boundary is a complete year; callers may checkpoint and yield between years. */
export function* advanceYearsSteps(ctx,n){
 const s=ctx.state;init(s);
 if(!Number.isInteger(n)||n<0||s.calendar.year+n>1e9)throw new Error('跳跃年份超出可保存范围。');
 const firstDays=400-s.calendar.season*100-s.calendar.day;
 const firstProduction=ctx.production({ignoreParadox:true}),initial=firstProduction.effects,retrieval=(initial.shatterTCGain||0)*(1+(initial.rrRatio||0)),routeSpeed=initial.routeSpeed||1,voidResonance=(initial.voidResonance||0)>0;
 // The first interval retains the pre-jump cached production; annual hooks refresh later intervals.
 s.calendar.day=0;s.calendar.season=0;
 for(let index=0;index<n;index++){
  ctx.invalidateEffects?.();const days=index?400:firstDays,ticks=days*10,p=index?ctx.production({ignoreParadox:true}):firstProduction;
  for(const id of Object.keys(s.spaceTravel))if(!s.spaceReached[id])s.spaceTravel[id]=Math.max(0,s.spaceTravel[id]-days*routeSpeed);
  if(retrieval>0){
   const ceilings={};
   for(const id of redshiftRateResources){ceilings[id]=Math.max(s.resources[id],p.caps[id]||Infinity);s.resources[id]=Math.max(0,s.resources[id]+(p.net[id]||0)*ticks*retrieval);if(s.resources[id]>0)s.resourceUnlocked[id]=true;}
   if(s.workshop.chronoEngineers)onEngineerTick(ctx,p,ticks*retrieval);
   for(const [id,ceiling]of Object.entries(ceilings))s.resources[id]=Math.min(s.resources[id],ceiling);
   industrialTime.advancePollution(ctx,ticks*retrieval,p);
  }
  if(voidResonance)accumulateVoidOrder(ctx,ticks,p);
  const old=s.calendar.year;s.calendar.year++;s.stats.totalYears++;
  ctx.invalidateEffects?.();annualGains(ctx,1,old,s.calendar.year,()=>industrialTime.onWorkshopYear(ctx));
  for(const value of [...Object.values(s.resources),s.praised,s.pollution,s.karmaKittens])if(!Number.isFinite(value)||value<0||value>1e100)throw new Error('时间结算的数值超出可保存范围。');
  yield {completedYears:index+1,totalYears:n};
 }
 s.timeState.flux+=n? n-1+firstDays/400:0;
 s.challengesUnlocked['1000Years']=true;if(isChallenge(s,'1000Years')&&s.calendar.year>=1000)complete(ctx,'1000Years');
 ctx.invalidateEffects?.();if(n)onQueueTick(ctx);
}

export function progressionView(ctx,production=ctx.production()){
 const s=ctx.state;init(s);const custom=[];
 const reserve=s.challengeReserves,hasReserve=reserve.bears.length||Object.keys(reserve.resources).length||reserve.cryochambers;
 if(s.pendingChallenges.length)custom.push({...actionCard(ctx,'challengeStart','confirm','开启所选试炼','',{},s.pendingChallenges.map(id=>challenges.find(d=>d.id===id)?.name).join('、')),confirm:'这会清除本轮营地并开启所选试炼。时光储备会暂存，直到全部试炼与独行模式结束后领取。'});
 if(hasReserve)custom.push(actionCard(ctx,'reclaimReserves','all','领取时光储备',activeChallenges(s).length||isChallenge(s,'ironWill')?'先结束全部试炼与独行模式':'',{},'领取暂存的物资与冬眠小熊'));
 if(s.discoveries.leviathans){custom.push(actionCard(ctx,'feedElders','one','供养远古商队','',{necrocorn:1},`当前能量 ${s.elderState.energy.toFixed(2)}；余留 ${s.elderState.duration} 天`));
  if(s.science.blackchain||s.resources.blackcoin){custom.push({...actionCard(ctx,'buyBlackcoin','all','用全部遗珍换暗币','',{relic:s.resources.relic},`当前 1 暗币 = ${s.blackcoinState.price.toFixed(3)} 遗珍`),available:s.resources.relic>0,confirm:'这会按当前暗市价格兑换全部遗珍。'});custom.push({...actionCard(ctx,'sellBlackcoin','all','用全部暗币换遗珍','',{blackcoin:s.resources.blackcoin},`当前 1 暗币 = ${s.blackcoinState.price.toFixed(3)} 遗珍`),available:s.resources.blackcoin>0,confirm:'这会按当前暗市价格兑换全部暗币。'});}
 }

 custom.push(actionCard(ctx,'adore','adore','沉淀灵悟',qty(s.religion,'apocripha')?'':'需要灵悟手记',{},`本次获得 ${adoreGain(s.praised,s.transcendence,qty(s.religion,'transcendence')>0).toPrecision(4)} 灵悟，颂愿归零`));
 custom.push({...actionCard(ctx,'transcend','transcend','升华一阶',qty(s.religion,'transcendence')?'':'需要升华之路',{},`需要灵悟严格高于 ${transcendPrice(s.transcendence).toPrecision(5)}`),available:qty(s.religion,'transcendence')>0&&s.faithRatio>transcendPrice(s.transcendence)});
 const transformCaps=production.caps;
 for(const d of transforms(ctx)){const c=actionCard(ctx,'sacrifice',d.id,d.name,d.gate,d.input,`每份获得 ${d.gain} ${ctx.resourceById[d.output]?.name}`),cap=transformCaps[d.output];if(c.available&&cap!==null&&qty(s.resources,d.output)>=cap){c.available=false;c.reason='产物已达到容量。';}custom.push(c);}
 custom.push(actionCard(ctx,'burnParagon','all','燃起传承',s.science.metaphysics&&s.resources.paragon>0?'':'需要传承学与传承',{},'全部现有传承转为余烬传承'));
 const acceleration=actionCard(ctx,'accelerate','toggle',s.timeState.accelerating?'暂停时流加速':'开启时流加速',s.science.calendar?'':'需要历法',{},'每秒消耗 5 时流，让模拟速度提高 50%');if(acceleration.available&&!s.timeState.accelerating&&s.resources.temporalFlux<1){acceleration.available=false;acceleration.reason='没有足够的时流。';}custom.push(acceleration);
 if(qty(s.time,'temporalPress')){const n=qty(s.time,'temporalPress')*(s.timeState.pressEnabled?25:5);custom.push(actionCard(ctx,'shatter','press',`穿越 ${n} 年`,s.science.chronophysics?'':'需要时空物理',currentShatterCost(ctx,n),'使用时页压机的整组时晶穿越'));if(qty(s.challengeCompletions,'1000Years')>=2||qty(s.religion,'blazar')>=3)custom.push(actionCard(ctx,'toggleTemporalPress','toggle',s.timeState.pressEnabled?'关闭时页强化':'开启时页强化','',{},'每座压机的穿越分组由 5 年提升到 25 年，并提高熔炉每次自动穿越上限'));}
 if(s.workshop.tachyonModerator)custom.push({...actionCard(ctx,'useFurnaceHeat','year','用炉热穿越一年','',{},'消耗 100 熔炉热量，不消耗时晶'),available:s.timeState.furnaceHeat>=100,reason:s.timeState.furnaceHeat>=100?'':'熔炉热量不足',costs:[{id:'furnaceHeat',name:'熔炉热量',value:100,owned:s.timeState.furnaceHeat}]});
 custom.push(actionCard(ctx,'shatter','year','穿越一年',s.science.chronophysics?'':'需要时空物理',currentShatterCost(ctx,1),'跳至下一年春天；时热会增加后续消耗'));
 if(s.discoveries.leviathans&&s.science.antimatter&&s.workshop.invisibleBlackHand)custom.push({...actionCard(ctx,'crashBlackcoin','once','暗市调律',s.blackcoinState.price>550?'':'价格需高于 550',{timeCrystal:blackcoinCrashCost(s,ctx.effects())},'消耗时晶，将当前暗市价格下调 20%–30%'),confirm:'这会消耗列出的时晶并降低当前暗市价格，无法直接撤销。'});
 if(s.religionCounters.pactDebt>0)custom.push(actionCard(ctx,'payPactDebt','all','偿清约定债务','',{necrocorn:Math.ceil(s.religionCounters.pactDebt)},'偿清全部夜影鹿债务'));
 if(s.usedCryochambers)custom.push(actionCard(ctx,'repairCryochamber','one','修复冬眠舱',s.workshop.chronoforge?'':'需要时铸工艺',{temporalFlux:3000,timeCrystal:100,void:500}));
 if(qty(s.time,'blastFurnace'))custom.push(actionCard(ctx,'toggleFurnace','toggle',s.timeState.furnaceEnabled?'暂停时焰熔炉':'开启时焰熔炉','',{},'每积累 100 熔炉热量自动穿越一年'));
 return {activeChallenges:activeChallenges(s),ironWill:isChallenge(s,'ironWill'),pendingChallenges:[...s.pendingChallenges],reserves:{available:!!hasReserve,details:s.metaphysics.ascoh?ctx.clone(reserve):null},elders:{...s.elderState,visiting:!!s.discoveries.leviathans},blackcoinPrice:s.blackcoinState.price,pacts:{debt:s.religionCounters.pactDebt,slots:pactSlots(s),penalty:pactDebtFactor(s),active:pactCount(s),fractured:!!qty(s.religion,'fractured')},cycle:currentCycle(s).name,actions:custom,metaphysics:metaphysics.map(d=>card(ctx,d)),time:time.map(d=>card(ctx,d)),faithCards:faith.map(d=>card(ctx,d)),spaceCards:space.map(d=>card(ctx,d)),challengeCards:challenges.map(d=>({...card(ctx,d),active:isChallenge(s,d.id),pending:s.pendingChallenges.includes(d.id)})),praiseMultiplier:praiseMultiplier(s.faithRatio),nextTranscendenceCost:transcendPrice(s.transcendence),heat:s.timeState.heat,furnaceHeat:s.timeState.furnaceHeat,accelerating:s.timeState.accelerating,spaceTravel:{...s.spaceTravel}};
}
// time.js:107–130: real elapsed time accrues flux separately from offline production.
export function gainOfflineFlux(ctx,seconds){
 if(!ctx.state.science.calendar||!Number.isFinite(seconds)||seconds<=0)return 0;
 const gain=Math.round(seconds/60*5*(1+.05*qty(ctx.state.time,'temporalAccelerator'))),p=ctx.production();
 const before=ctx.state.resources.temporalFlux;ctx.state.resources.temporalFlux=Math.min(p.caps.temporalFlux,before+gain);return ctx.state.resources.temporalFlux-before;
}
// calendar.js:449–452: paradoxes occur at the season boundary, including the year boundary.
export function onSeasonProgression(ctx){const e=ctx.effects();if(e.temporalParadoxChance&&ctx.nextRandom(ctx.state)<e.temporalParadoxChance)ctx.state.calendar.day=-10-(e.temporalParadoxDay||0);}

function unlockFaith(s){for(const d of faith)if(d.family==='worship'&&s.praised>=d.gate.praised)s.religionUnlocked[d.id]=true;}
export function onRealTickProgression(ctx){const s=ctx.state;init(s);const e=ctx.effects();
 const heat=Math.min(s.timeState.heat,.01+(e.heatPerTick||0));s.timeState.heat-=heat;s.timeState.furnaceHeat+=heat*(1+(isChallenge(s,'1000Years')?0:Math.min(3,.1*qty(s.challengeCompletions,'1000Years'))));
 if(s.timeState.delayTicks>0)s.timeState.delayTicks--;else if(s.timeState.furnaceEnabled&&qty(s.time,'blastFurnace')&&s.timeState.furnaceHeat>=100){const limit=s.timeState.pressEnabled?Math.max(5,qty(s.time,'temporalPress')*25):5,n=Math.min(limit,Math.floor(s.timeState.furnaceHeat/100));s.timeState.furnaceHeat-=100*n;s.timeState.delayTicks=qty(s.time,'controlledDelay');advanceYears(ctx,n);}
}

export function currentCycle(s){return cycles[Math.floor(s.calendar.year/5)%cycles.length];}
export function cycleMultiplier(s,building,effect){if(!s.metaphysics.numerology)return 1;return currentCycle(s).buildingMultipliers.find(x=>x.building===building&&x.effect===effect)?.factor||1;}
const pactIds=['pactOfCleansing','pactOfDestruction','pactOfExtermination','pactOfPurity','pactOfArcane','pactOfChronicler'];
export const pactCount=s=>pactIds.reduce((n,id)=>n+qty(s.religion,id),0);
export const pactSlots=s=>qty(s.religion,'fractured')?0:Math.max(0,qty(s.religion,'mausoleum')*(s.policies?.radicalXenophobia?2:1)+(s.policies?.radicalXenophobia?5:0)-pactCount(s));
export function pactDebtFactor(s){const debt=s.religionCounters?.pactDebt||0,exempt=qty(s.religion,'siphoning')?5:0;return qty(s.religion,'fractured')||debt>=50?0:debt<=exempt?1:1-(debt-exempt)/(50-exempt);}
export function pactEffects(s){
 if(qty(s.religion,'fractured'))return {pyramidGlobalResourceRatio:-.5,pyramidGlobalProductionRatio:-.5,pyramidFaithRatio:-.5};
 const pyramids=qty(s.religion,'blackPyramid')+(!isChallenge(s,'blackSky')&&qty(s.challengeCompletions,'blackSky')?1:0),scale=Math.max(s.transcendence-24,1)*pactDebtFactor(s)*pyramids;
 const n=id=>qty(s.religion,id);return {
  pyramidGlobalResourceRatio:.0005*n('pactOfCleansing')*scale,
  pyramidGlobalProductionRatio:.0005*n('pactOfDestruction')*scale,
  pyramidFaithRatio:.001*n('pactOfExtermination')*scale,
  deficitRecoveryRatio:(.003*n('pactOfCleansing')-.0001*n('pactOfDestruction')+.005*n('pactOfPurity'))*pyramids,
  blackLibraryBonus:.0005*n('pactOfPurity')*scale*.02*(1+n('unicornGraveyard')),
  pyramidSpaceCompendiumRatio:.001*n('pactOfPurity')*scale,
  craftRatio:.001*n('pactOfArcane')*scale,
  UniversalKnowHow:.1*n('pactOfArcane')*scale,
  pyramidPerYearRatio:.003*n('pactOfChronicler')*scale,
  timeRatio:.1*n('pactOfChronicler')*scale,
 };
}
export function pactDailySettlement(stock,debt,upkeep,recovery=0,siphoning=false){
 if(siphoning)return {stock,debt:debt+upkeep};
 const payment=upkeep*(debt>0?1+.15*(1+recovery/2):1);
 if(stock<payment)return {stock:Math.max(0,stock-upkeep),debt:debt+Math.max(upkeep-stock,0)};
 return {stock:stock-payment,debt:Math.max(0,debt-(debt>0?upkeep*.15*(1+recovery):0))};
}
function settlePacts(ctx){
 const s=ctx.state,U=pactCount(s)*(qty(s.religion,'upfrontPayment')?.00045:.0005),result=pactDailySettlement(s.resources.necrocorn,s.religionCounters.pactDebt,U,pactEffects(s).deficitRecoveryRatio||0,!!qty(s.religion,'siphoning'));
 if(s.calendar.day>=0)s.resources.necrocorn=result.stock;s.religionCounters.pactDebt=result.debt;
 if(result.debt>=50){for(const bear of s.bears)bear.skills={};s.resources.alicorn=0;s.religionCounters.pactDebt=0;for(const id of pactIds)s.religion[id]=0;s.religion.fractured=1;ctx.log('约定因供养债务破裂。小熊的技能记忆与星翼鹿离开了营地。','warning');}
}

export function onYearProgression(ctx,oldYear,newYear){annualGains(ctx,1,oldYear,newYear);}
function annualGains(ctx,years,oldYear,newYear,beforeAnimals=null){
 const s=ctx.state,e=ctx.effects(),millennia=Math.floor(newYear/1000)-Math.floor(oldYear/1000),pact=pactEffects(s);
 const flux=s.workshop.turnSmoothly?qty(s.buildings,'chronosphere'):0;if(flux)out(ctx,'temporalFlux',years*flux*(1+(pact.pyramidPerYearRatio||0)));
 if(!s.discoveries.leviathans&&Object.entries(s.discoveries).some(([id,on])=>id!=='leviathans'&&on)){
  const chance=.035*effectivePyramids(s)*(1+.1*effectiveMarkers(s));
  // A multi-year jump has independent annual opportunities, without repeated visits stacking.
  const appeared=chance>=1||(years===1?Math.floor(ctx.nextRandom(s)*1000)<chance*1000:ctx.nextRandom(s)<-Math.expm1(years*Math.log1p(-chance)));
  if(chance>0&&appeared){s.discoveries.leviathans=true;s.elderState.duration=400*(5+Math.floor(s.elderState.energy));s.challengesUnlocked.blackSky=true;ctx.log('远古商队循着黑塔的光抵达森林。','trade');}
 }

 if(newYear>=40000){s.timeUnlocked??={};s.timeUnlocked.temporalImpedance=true;}
 if(e.antimatterPerYear&&((e.energySupply||0)-(e.energyDemand||0))>=0)out(ctx,'antimatter',years*e.antimatterPerYear*(1+(pact.pyramidPerYearRatio||0))*(1+(e.antimatterPolicyRatio||0)));
 if(millennia){out(ctx,'paragon',millennia);
  const population=Math.round(s.bears.length*(1+.02*s.activeHolyGenocide)),slots=pactSlots(s);
  if(population>35&&slots>0){s.karmaKittens+=millennia*karmaGain(population,qty(s.challengeCompletions,'anarchy')>0)*triangularInverse(.0001*Math.max(1+.1*(s.transcendence-25),1)*slots/100);s.resources.karma=triangularInverse(s.karmaKittens/5);}
 }
 beforeAnimals?.();
 const pairs=Math.floor(newYear/2)-Math.floor(oldYear/2);if(pairs>0&&s.metaphysics.alicornmancy&&isChallenge(s,'pacifism')&&s.science.animal&&s.resources.unicorns<2)out(ctx,'unicorns',Math.min(2-s.resources.unicorns,pairs));
}

const effectivePyramids=s=>qty(s.religion,'blackPyramid')+(!isChallenge(s,'blackSky')&&qty(s.challengeCompletions,'blackSky')?1:0);
// Challenge-only additions to ordinary action prices, from the authored challenge contract.
const weightCoefficients={honey:0,wood:.5,minerals:.35,iron:1,titanium:200,uranium:150000,unobtainium:1e6,antimatter:1e10,starchart:200,spice:250,beam:.75,slab:.75,plate:5,concrete:25,gear:20,alloy:300,eludium:1e8,ship:1500,tanker:150000,kerosene:7000,parchment:2,compendium:20,blueprint:50,thorium:180000};
export function tearsWeight(prices){if(['unicorns','alicorn','tears','megalith'].some(id=>prices[id]>0))return -Infinity;return Object.entries(prices).reduce((sum,[id,v])=>sum+v*(weightCoefficients[id]??10),0);}
export function challengeCosts(s,d,amount,bill,e={}){
 const result={...bill},add=(id,value)=>{if(value>0)result[id]=(result[id]||0)+value;};
 if(d.type==='build'){
  const held=qty(s.buildings,d.id),ratio=Math.max(1,(d.ratio||1)-(e.priceReduction||0)-(e[`${d.id}PriceReduction`]||0)),discount=1-limitedDR(e[`${d.id}CostReduction`]||0,1);
  const fake=isChallenge(s,'postApocalypse')&&['hut','logHouse','mansion'].includes(d.id)?Math.max((e.pollutionLevel||0)-8,0):isChallenge(s,'pacifism')&&d.id==='steamworks'?Math.floor(1.5*qty(s.challengeCompletions,'pacifism')):0;
  if(fake)for(const id of Object.keys(result))result[id]*=ratio**fake;
  if(isChallenge(s,'blackSky')&&d.id==='calciner'&&!held)for(const [id,v]of Object.entries(d.cost)){const first=v*discount*(1-limitedDR(e[`${id}CostReduction`]||0));result[id]+=(id==='titanium'?-1:10)*first;}
  if(isChallenge(s,'pacifism')&&d.id==='steamworks'&&!held)result.blueprint=(result.blueprint||0)+(5*qty(s.challengeCompletions,'pacifism')+1-(d.cost.blueprint||0));
  if(isChallenge(s,'postApocalypse')&&d.id==='hive'&&e.pollutionLevel>=5){const threshold=Math.max(95-s.usedCryochambers-e.pollutionLevel,7+(isChallenge(s,'ironWill')?8:0)),first=Math.max(held,threshold),last=held+amount;if(last>first){const flatEnd=Math.min(last,Math.max(first,100-s.usedCryochambers));add('unobtainium',15*Math.max(0,flatEnd-first));if(last>flatEnd)add('unobtainium',geometricCost(15,ratio,Math.max(0,flatEnd+s.usedCryochambers-100),last-flatEnd));}}
  if(isChallenge(s,'unicornTears')){
   const first=Math.max(1,held),last=held+amount,n=Math.max(0,last-first),Q=limitedDR(1.2+.03*qty(s.challengeCompletions,'unicornTears'),2.5);
   if(d.id==='warehouse'&&!s.buildingStages?.warehouse||d.id==='harbor'){add(d.id==='harbor'?'tears':'unicorns',n*(first+last-1)*discount);}
   else{const weight=tearsWeight(d.cost);if(weight>0&&n){
    // Each price band is monotone. Binary search its boundaries, then sum its geometric or linear sequence.
    const at=k=>Math.log(weight)+(k-1)*Math.log(Q),lower=threshold=>{let lo=first,hi=last;while(lo<hi){const m=Math.floor((lo+hi)/2);if(at(m)<threshold)lo=m+1;else hi=m;}return lo;};
    const a=lower(Math.log(100)),b=lower(Math.log(100000)+1e-12),c=lower(Math.log(1e9)+1e-12);
    if(b>a)add('unicorns',geometricCost(weight/100,Q,a-1,b-a)*discount);
    if(c>b)add('tears',geometricCost(weight/100000,Q,b-1,c-b)*discount);
    if(last>c)add('alicorn',((last-c)*(Math.log(weight)-19.7232)+(c+last-3)*(last-c)/2*Math.log(Q))*discount);
   }}
  }
 }
 if(isChallenge(s,'unicornTears')&&d.type==='research'){
  const m=limitedDR(.25*qty(s.challengeCompletions,'unicornTears'),75);if(m){add('unicorns',m*(d.cost.manuscript||0));add('tears',m*(d.cost.compendium||0));if(d.cost.blueprint)add('alicorn',Math.max(1,limitedDR(m,10)));}
 }
 if(isChallenge(s,'unicornTears')&&d.type==='upgrade'){
  const m=limitedDR(.01*qty(s.challengeCompletions,'unicornTears'),1),w=tearsWeight(d.cost);if(m&&w>0){if(w<1e6)add('unicorns',Math.ceil(w**(2/3)*m));else if(w<1e8)add('tears',Math.ceil((w-990000)*m/1000));else add('tears',Math.ceil((Math.log10(w)-7)*100000*m));}
 }
 return result;
}

const effectiveMarkers=s=>qty(s.religion,'marker')*(1+(isChallenge(s,'blackSky')?0:limitedDR(.1*qty(s.challengeCompletions,'blackSky'),2)));

// Independent arithmetic estimate for the in-game market's optional paid correction.
export function blackcoinCrashCost(s,e={}){
 const Y=.002401*qty(s.space,'moonOutpost')*(1+.01*qty(s.space,'spaceElevator')+.02*qty(s.space,'orbitalArray'))*(1+.045*qty(s.buildings,'factory'))*(1.03+(e.tradeRatio||0)+.03*triangularInverse(s.resources.burnedParagon/500))*(1+.02*s.elderState.energy);
 const h=qty(s.challengeCompletions,'1000Years')?5:10,G=1.13*Y*(e.shatterTCGain||0)*(1+(e.rrRatio||0));
 const rate=Math.max(1.13*Y/4000,(2.4*Y-9)/4000,1.13*Y/4000+((1+h/100)*G-1)*(e.heatPerTick||0)/h);
 const estimate=rate*8000466.693057134*Math.log(1100/s.blackcoinState.price);
 return 2**Math.ceil(Math.log2(Math.max(estimate,256)/8));
}

export function zebraKarmaGain(s,catalog){
 if(!isChallenge(s,'ironWill')||!qty(s.resources,'zebras'))return 0;
 const scienceValue=catalog.science.reduce((sum,d)=>sum+(s.science[d.id]&&!(d.id==='chronophysics'&&s.metaphysics.anachronomancy)?d.cost?.science||0:0),0);
 return (s.science.archery&&(s.zebraKarma||0)<10?1:0)+Math.floor(limitedDR(scienceValue/10000,100));
}
