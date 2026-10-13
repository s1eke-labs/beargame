import {batchDecision} from './decision-batch.js';
import {buildingDecision} from './decision-buildings.js';
import {jobDecisions,happinessBreakdown} from './decision-jobs.js';
import {tradeDecision,researchRelations} from './decision-view.js';
import {checkSeasonalGiftOnLoad,seasonalGiftsView,actSeasonalGifts} from './seasonal-gifts.js';
import {beginUndoAction,finishUndoAction,actUndo,undoView,clearUndo,advanceUndoClock,onUndoDay,consumeUndoTrade,captureUndoSession,restoreUndoSession} from './undo.js';
import {achievementEvent,checkAchievements,achievementView,captureResetFacts,carryAchievements,rollBearAppearance} from './achievements.js';
import {advanceOffline} from './redshift.js';
import {actBuildQueue,queueView,onQueueTick,actEmbassy,embassyView,maintainQueueSources} from './build-queue.js';
import {actEngineerAutomation,engineerView,onEngineerTick,maintainEngineers} from './engineer-automation.js';
import {resolvedBuilding,stageView,actBuildingStages} from './building-stages.js';
import * as stageHooks from './building-stages.js';
import * as workshopHooks from './workshop-dynamics.js';
import {ambassadorLimit,ambassadorOutput,tradeVolume,goodsProbability,spiceProbability} from './diplomacy.js';
import {actPolicies,policyEffects,enrichPolicyEffects,policyView,maintainPolicies,policyCraftCosts,policyTradeCosts,policyTradeBonuses,policyTradeGoods,policyAutoProductionBonus,extendPolicyProduction} from './policies.js';
import {actLeadership,leadershipEffects,leadershipView,leadershipCostMultiplier,leaderCraftBonus,workerProductionMultiplier,workerMultiplierContext,randomTrait} from './leadership.js';
import {pollutionEffects,energyDeficit,pollutionRate} from './industry.js';
import * as progressionHooks from './progression.js';
import {actProgression, additionalEffects, extendProduction, onDayProgression, onTickProgression, progressionView, prestigePreview} from './progression.js';
import {catalog, constants} from './catalog.js';
import {clamp, geometricCost, nextRandom, limitedDR, triangularInverse, clone} from './math.js';
import {createState, parseSave, serialize, defaultStorage, readStorage, writeStorage} from './save.js';
export {catalog, constants};

const resourceById=Object.fromEntries(catalog.resources.map(r=>[r.id,r]));
const maps=Object.fromEntries(Object.entries(catalog).map(([k,v])=>[k,Object.fromEntries(v.map(d=>[d.id,d]))]));
const nowOf=(now)=>typeof now==='function'?now():typeof now==='number'?now:Date.now();
const n=(map,id)=>map?.[id]||0;
const completed=(map,id)=>!!map[id];
const skillBonus=(value)=>value>=9000?.1875:value>=5000?.125:value>=2500?.075:value>=1200?.045:value>=500?.025:value>=100?.0125:0;
const EPSILON=1e-9;
const MAX_BATCH=1000000;
const festivalDefinition={id:'festival',type:'festival',name:'举办蜜林庆典',cost:{manpower:1500,culture:5000,parchment:2500},gate:{science:'drama'},description:'让营地欢庆一整年，提高幸福感与到访速度。狂欢传承允许累积庆典天数。',summary:'庆典持续 400 天；幸福感 +30%，到访速度提高。'};
const coverage = {
 status:'版本功能与支持范围',
 reference:'以下列出当前可用功能、仍在核验的边界与支持范围。',
 implemented:['固定 5Hz 时钟、季节天气、口粮与逐只熊的技能','40 类建筑、5 种改建、61 项研究和 151 项工坊技艺','23 种制作配方、工程熊专精、自动化与建造队列','8 支商队、使馆、使节、高级商品和节庆','路线选择、领袖任命、晋升与专业加成','祈愿、传承、星际、时间与多项并行试炼','31 项纪念、21 枚徽章及跨重建记录','压缩离线、逐年时间跳跃与安全结算恢复','版本化本地存档、严格导入校验与原子结算恢复'],
 partial:['离线批量结算与逐年穿越已接入；复杂边界正在逐项核验','复杂挑战组合与极端后期数值仍需更多测试'],
 unsupported:['联机与外部账户'],
 notes:['离线使用压缩结算：按整年分段处理队列，批量计算事件；极端存档的结算边界仍在持续测试。'],
};

export function createGame(options={}){
 let state=options.save?parseSave(typeof options.save==='string'?options.save:JSON.stringify(options.save),nowOf(options.now)):createState(options.seed,nowOf(options.now));
 const storage=options.storage===undefined?defaultStorage():options.storage;
 let listeners=new Set(), saveStatus={ok:true,message:'尚未保存',at:null}, storageProtected=false, offlineReport=null;
 let notifyPending=false, pendingOffline=0, catchingUp=false, effectCache=null,yearJumpCollectors=null,pendingOperation=null,resetFactsPending=null;

 function log(text,kind='info'){
  state.log.unshift({id:state.nextLogId++,text,kind,at:state.ticks});
  if(state.log.length>80)state.log.length=80;
 }
 function populationCapacity(e=effects()){const base=Math.floor(e.bears||0);return e.maxKittensRatio?Math.max(0,Math.round(base*(1+limitedDR(e.maxKittensRatio,1)))):Math.max(0,base);}
 function realTicksPerSecond(){return 5*(state.timeState.accelerating&&state.resources.temporalFlux>0?1.5:1);}
 function createBear(){const id=state.nextBearId++;return {id,name:`小熊 ${id}`,job:null,trait:randomTrait(nextRandom(state)),experience:0,rank:0,skills:{},...rollBearAppearance(()=>nextRandom(state))};}
 function jobCounts(){const counts=Object.fromEntries(catalog.jobs.map(j=>[j.id,0]));for(const bear of state.bears)if(bear.job)counts[bear.job]=(counts[bear.job]||0)+1;return counts;}
 function isChallenge(id){return id==='ironWill'?state.ironWill:state.challenge===id||state.activeChallenges?.includes(id);}
 function buildingDefinition(id){return resolvedBuilding(state,maps.buildings[id]);}
 function sellRefundRatio(){return .5;}
 function enabledCount(id){return state.disabled[id]?0:Math.min(n(state.buildings,id),state.activeBuildings[id]??n(state.buildings,id));}
 function effects(){
  if(effectCache)return effectCache;
  const result={};
  const add=(def,count=1)=>{for(const [key,value] of Object.entries(def?.effect||{}))result[key]=(result[key]||0)+value*count;};
  for(const base of catalog.buildings){const def=buildingDefinition(base.id);for(const [key,value] of Object.entries(def.effect||{}))result[key]=(result[key]||0)+value*(key.includes('Max')||key==='bears'?n(state.buildings,def.id):enabledCount(def.id));}
  for(const def of catalog.science)if(state.science[def.id])add(def);
  for(const def of catalog.workshop)if(state.workshop[def.id])add(def);
  for(const def of catalog.faith)add(def,n(state.religion,def.id));
  for(const def of catalog.space)if(!state.disabled[def.id])add(def,n(state.space,def.id));
  for(const [key,value] of Object.entries(policyEffects(state)))result[key]=(result[key]||0)+value;
  enrichPolicyEffects(state,result,catalog);
  for(const [key,value] of Object.entries(leadershipEffects(state)))result[key]=(result[key]||0)+value;
  for(const [key,value] of Object.entries(additionalEffects(state,result)))result[key]=(result[key]||0)+value;
  for(const id of ['barn','warehouse','harbor']){
   const def=buildingDefinition(id),count=n(state.buildings,id);if(state.buildingStages[id])continue;if(!def||!count)continue;
   const shipScale=id==='harbor'?1+limitedDR((result.harborRatioPerShip||0)*state.resources.ship,2.25+(state.workshop.reactorVessel?.05*n(state.buildings,'reactor'):0)):1;
   for(const resource of ['honey','wood','minerals','coal','iron','titanium','gold']){
    const key=resource+'Max';const raw=(def.effect[key]||0)+(id==='warehouse'&&resource==='honey'?(result.warehouseHoneyMax||0):0);
    let adjusted=raw*shipScale;
    if(['wood','minerals','iron'].includes(resource))adjusted*=1+(result.barnRatio||0);
    if(['wood','minerals','coal','iron','titanium','gold'].includes(resource))adjusted*=1+(result.warehouseRatio||0);
    if(resource==='honey'&&state.workshop.silos)adjusted*=1+.25*(result.barnRatio||0);
    result[key]=(result[key]||0)+count*(adjusted-(def.effect[key]||0));
   }
  }
  result.woodRatio=(result.woodRatio||0)+n(state.buildings,'lumberMill')*.1*(result.lumberMillRatio||0);
  for(const delta of [workshopHooks.workshopEffects?.(context(),result),stageHooks.stageEffects?.(context(),result)])for(const [key,value] of Object.entries(delta||{}))result[key]=(result[key]||0)+value;
  const active=enabledCount;
  result.energySupply=(result.energySupply||0)+active('reactor')*10*(result.reactorEnergyRatio||0);
  result.energyDemand=result.energyDemand||0;
  result.energySupply*=1+(result.energyProductionRatio||0);
  result.energyDemand*=Math.max(0,1+(result.energyConsumptionRatio||0)+(result.energyConsumptionIncrease||0))*(isChallenge('energy')?2:1);
  for(const [key,value] of Object.entries(stageHooks.finalStageEffects?.(context(),result)||{}))result[key]=(result[key]||0)+value;
  result.energyDeficit=energyDeficit(result.energySupply,result.energyDemand,!!state.challengeCompletions.energy,isChallenge('energy'));
  result.magnetoRatio=(result.magnetoRatio||0)+active('magneto')*.02*result.energyDeficit;
  result.productionRatio=(result.productionRatio||0)+active('reactor')*.05*result.energyDeficit;
  const pollution=pollutionEffects(state.pollution||0);
  result.pollutionHoneyRatio=pollution.honeyRatio;result.happiness=(result.happiness||0)+pollution.happiness/100;result.pollutionArrivalDivisor=(result.pollutionArrivalDivisor||0)+pollution.arrivalDivisor;result.pollutionSolarReduction=pollution.solarReduction;
  result.pollutionLevel=pollution.level;
  result.cleanEnergy=(state.workshop.solarSatellites&&!state.disabled.sattelite?n(state.space,'sattelite'):0)+active('reactor')*10*(1+(result.reactorEnergyRatio||0))*.5+(result.cleanEnergy||0);
  result.pollutingEnergy=active('magneto')*5+active('steamworks');

  return result;
 }
 function happiness(e=effects()){
  const population=state.bears.length;
  const luxuryCount=['furs','ivory','spice','unicorns','alicorn','necrocorn','tears','karma','relic','void','blackcoin','bloodstone','tMythril'].filter(id=>state.resources[id]>0).length+(state.resources.elderBox>0||state.resources.wrappingPaper>0?1:0);
  return Math.max(.25,1-.02*(e.ignorePopulationPenalty?0:Math.max(0,population-5))*(1-limitedDR(e.unhappinessReduction||0))+(.1+(e.luxuryHappinessBonus||0))*luxuryCount+(e.consumableLuxuryHappiness||0)*['furs','ivory','spice'].filter(id=>state.resources[id]>0).length+(state.festivalDays>0?.3*(1+(e.festivalRatio||0)):0)+(state.resources.karma||0)/100*(state.religion.upfrontPayment?Math.max(.1,progressionHooks.pactDebtFactor(state)):1)+(e.happiness||0)-.02*Math.max(0,population-populationCapacity(e)));
 }
 function production({ignoreParadox=false}={}){
  const e=effects(), H=happiness(e), bears=state.bears.length, assigned=state.bears.filter(b=>b.job).length;
  const caps={}, gross={}, net={},postMultiplierGross={};
  for(const r of catalog.resources){
   caps[r.id]=r.cap===null?null:Math.max(0,(r.cap+(e[`${r.id}Max`]||0))*(1+(e[`${r.id}MaxRatio`]||0))*(1+(e.storageRatio||0)));
   gross[r.id]=0;net[r.id]=0;postMultiplierGross[r.id]=0;
  }
  const spaceScience=catalog.space.reduce((sum,d)=>sum+(d.effect?.scienceMax||0)*(state.disabled[d.id]?0:n(state.space,d.id))*(progressionHooks.cycleMultiplier?.(state,d.id,'scienceMax')??1),0)+(n(state.space,'researchVessel')*10000+n(state.space,'spaceBeacon')*25000)*(e.spaceScienceRatio||0);
  const groundScience=250+(e.scienceMax||0)-spaceScience;
  const codex=state.metaphysics.codexLeviathanianus?1+.05*state.transcendence*(1+n(state.religion,'blackLibrary')*(.02+(e.blackLibraryBonus||0))):1;
  const compendiumLimit=Math.max(0,(groundScience+(e.pyramidSpaceCompendiumRatio||0)*spaceScience)*(state.ironWill?10:1)*codex+(e.scienceCompendiaCeiling||0));
  caps.science+=Math.min(Math.floor(state.resources.compendium*10),compendiumLimit);
  caps.culture+=triangularInverse(Math.floor(state.resources.manuscript)/.01)*(1+(e.manuscriptCapacityRatio||0));
  caps.oil+=Math.floor(state.resources.tanker*500);
  const winterRuns=n(state.challengeCompletions,'winterIsComing'),winterActive=isChallenge('winterIsComing');
  const season=(winterActive?.25:constants.SEASON_FACTORS[state.calendar.season])+state.calendar.weather*.15;
  const hiveSeason=season*(winterActive&&state.calendar.weather<0?1-limitedDR(.02*winterRuns,1):!winterActive&&state.calendar.season===0?1+limitedDR(.05*winterRuns,2):1);
  const paragonProduction=limitedDR((state.resources.paragon||0)*.01*(1+(e.paragonRatio||0)),2*(1+(e.paragonRatio||0)))+limitedDR((state.resources.burnedParagon||0)*.01*(1+(e.paragonRatio||0)),(state.calendar.year>=40000?4:1)*(1+(e.paragonRatio||0)));
  // Capacity and production use different paragon multipliers.
  const storageBonus=1+((state.resources.paragon||0)*.001+(state.resources.burnedParagon||0)*(state.calendar.year>=40000?.002:.0005))*(1+(e.paragonRatio||0));
  for(const id of Object.keys(caps))if(caps[id]!==null&& !['karma','paragon','burnedParagon','temporalFlux','void'].includes(id))caps[id]*=storageBonus;
  const faithProduction=0; // Religion hook supplies its separately verified multiplier.
  const globalProduction=(1+paragonProduction)*(1+faithProduction);
  for(const base of catalog.buildings){
   const def=buildingDefinition(base.id);
   if(state.disabled[def.id])continue;
   const count=enabledCount(def.id);
   if(!count||def.conversion)continue;
   for(const r of catalog.resources)if(def.effect?.[r.id])gross[r.id]+=def.effect[r.id]*count*(r.id==='honey'?hiveSeason:1);
  }
  gross.coal+=n(state.buildings,'mine')*(e.mineCoal||0);
  gross.uranium+=n(state.buildings,'quarry')*(e.quarryUranium||0);
  gross.oil+=n(state.buildings,'oilWell')*.02*(e.oilWellRatio||0);
  if(state.science.theology)gross.faith+=enabledCount('temple')*.0015;
  gross.faith+=e.templePolicyFaith||0;gross.culture+=e.templePolicyCulture||0;
  const workerContext=workerMultiplierContext(state);
  for(const bear of state.bears){
   const job=maps.jobs[bear.job];if(!job?.output)continue;
   let rate=job.rate, bonus=isChallenge('anarchy')?0:skillBonus(bear.skills[job.id]||0)*(1+(e.skillMultiplier||0))*(bear.skills[job.id]>=9000?1+(e.masterSkillMultiplier||0):1);
   if(job.id==='geologist')rate+=(e.geologistCoal||0);
   gross[job.output]+=rate*((1+.02*state.activeHolyGenocide)/(1+limitedDR(-.01*state.activeHolyGenocide,1)))*(1+bonus)*(H+(H-1)*(e.happinessWorkerRatio||0))*workerProductionMultiplier(state,bear,workerContext)*(1+(e[job.id==='hunter'?'hunterJobRatio':`${job.id}Ratio`]||0));
   if(job.id==='geologist'&&state.workshop.geodesy&&e.geologistGold)gross.gold+=e.geologistGold*(1+bonus)*(H+(H-1)*(e.happinessWorkerRatio||0))*workerProductionMultiplier(state,bear,workerContext);
   if(job.id==='scholar'&&e.scholarStarchart)gross.starchart+=e.scholarStarchart*(1+bonus)*(H+(H-1)*(e.happinessWorkerRatio||0))*workerProductionMultiplier(state,bear,workerContext);
  }
  if(enabledCount('steamworks'))gross.coal*=Math.max(0,.2+(e.coalRatioGlobalReduction||0));
  for(const r of catalog.resources){
   gross[r.id]*=(1+(e[`${r.id}Ratio`]||0))*(1+(e[`${r.id}GlobalRatio`]||0))*(1+(e[`${r.id}SuperRatio`]||0))*globalProduction;
   if(!['honey','oil','antimatter','science','culture','faith','manpower','starchart','furs','ivory','spice','unicorns'].includes(r.id))gross[r.id]*=1+(e.magnetoRatio||0)*(1+(!state.disabled.steamworks?enabledCount('steamworks')*(.15+(e.steamMagnetoBonus||0)):0));
   if(!['honey','uranium','antimatter','science','culture','faith','manpower','starchart','furs','ivory','spice','unicorns'].includes(r.id))gross[r.id]*=1+(e.productionRatio||0);
   if(r.id==='honey'){gross[r.id]*=1+(e.pollutionHoneyRatio||0);if(isChallenge('winterIsComing'))gross[r.id]/=1+paragonProduction;}
   net[r.id]=gross[r.id];
  }
  const demand=.85*(bears+assigned*Math.max(0,H*(1+(e.happinessConsumptionRatio||0))-1)*(1+(e.honeyDemandWorkerRatioGlobal||0)))*(1-limitedDR(e.honeyDemandReduction||0));
  net.honey-=demand;
  net.furs-=bears*.01*(1-limitedDR(e.luxuryDemandReduction||0))*(1+(e.luxuryDemandRatio||0))*(1+(state.festivalDays>0?(e.festivalLuxuryConsumptionRatio||0):0));
  net.ivory-=bears*.007*(1-limitedDR(e.luxuryDemandReduction||0))*(1+(e.luxuryDemandRatio||0))*(1+(state.festivalDays>0?(e.festivalLuxuryConsumptionRatio||0):0));
  net.spice-=bears*.001*(1-limitedDR(e.luxuryDemandReduction||0))*(1+(e.luxuryDemandRatio||0))*(1+(state.festivalDays>0?(e.festivalLuxuryConsumptionRatio||0):0));
  const policyAutomation=policyAutoProductionBonus(context(),{caps});
  const conversions=[];
  for(const [group,counts] of [[catalog.buildings,state.buildings]])for(const base of group){
   const def=buildingDefinition(base.id);
   const count=enabledCount(def.id);if(!count||!def.conversion||state.disabled[def.id])continue;
   const conversionInput={...def.conversion.input};if(def.id==='reactor')conversionInput.uranium*=1-(e.reactorUraniumReduction||0);
   let scale=count;
   for(const [id,value] of Object.entries(conversionInput))scale=Math.min(scale,Math.max(0,state.resources[id]+net[id])/value);
   scale=Math.max(0,scale);
   for(const [id,value] of Object.entries(conversionInput))net[id]-=value*scale;
   const conversionOutput={...def.conversion.output};
   if(def.id==='smelter'){if(e.smelterGold)conversionOutput.gold=(conversionOutput.gold||0)+e.smelterGold;if(e.smelterCoal)conversionOutput.coal=(conversionOutput.coal||0)+e.smelterCoal;if(e.smelterTitanium)conversionOutput.titanium=(conversionOutput.titanium||0)+e.smelterTitanium;for(const key of ['iron','coal'])if(conversionOutput[key])conversionOutput[key]*=1+(e.smelterRatio||0);}
   if(def.id==='calciner'){conversionOutput.iron*=1+(e.calcinerRatio||0);conversionOutput.titanium*=1+3*(e.calcinerRatio||0);}
   for(const [id,value] of Object.entries(conversionOutput)){
    const dynamicValue=def.id==='mint'?(p=>p)(id==='furs'?caps.manpower*.0000875:id==='ivory'?caps.manpower*.000021:value):value;
    let quantity=dynamicValue*scale*(def.conversion.global===false?1:1+.05*paragonProduction);
    if(def.conversion.global!==false&&!['honey','oil','antimatter','science','culture','faith','manpower','starchart','furs','ivory','spice','unicorns'].includes(id))quantity*=1+(e.magnetoRatio||0)*(1+(!state.disabled.steamworks?enabledCount('steamworks')*(.15+(e.steamMagnetoBonus||0)):0));
    if(def.conversion.global!==false&&!['honey','uranium','antimatter','science','culture','faith','manpower','starchart','furs','ivory','spice','unicorns'].includes(id))quantity*=1+(e.productionRatio||0);
    if(['smelter','calciner'].includes(def.id))quantity*=1+policyAutomation;
    if(def.id==='mint')quantity*=id==='furs'?(1+policyAutomation/2)*(1+(e.mintRatio||0)):(1+policyAutomation/6)*(1+(e.mintRatio||0))*(1+(e.mintIvoryRatio||0));
    net[id]+=quantity;gross[id]+=quantity;if(def.conversion.global===false)postMultiplierGross[id]+=quantity;
   }
   conversions.push({id:def.id,scale,total:count});
  }
  const printed=enabledCount('steamworks')*(e.steamManuscriptPerTick||0)*(state.workshop.offsetPress?4:1)*(state.workshop.photolithography?4:1);
  gross.manuscript+=printed;net.manuscript+=printed;postMultiplierGross.manuscript+=printed;
  const ambassadors=ambassadorOutput(context(),e,H);net.culture-=ambassadors.culture;net.spice-=ambassadors.spice;
  const derived=extendPolicyProduction(context(),extendProduction(context(),workshopHooks.extendWorkshopProduction(context(),{effects:e,happiness:H,housing:populationCapacity(e),caps,gross,net,postMultiplierGross,demand,conversions,globalProduction,faithProduction,paragonProduction,ambassadors})));
  workshopHooks.finalWorkshopProduction?.(context(),derived);
  if(state.calendar.day<0&&!ignoreParadox){for(const id of Object.keys(derived.net)){derived.net[id]=0;derived.gross[id]=0;}}
  return derived;
 }
 function gateReason(gate={}){
  if(gate.unverified)return '此机制的开启条件尚未完成核验';
  if(gate.any?.length&&!gate.any.some(g=>!gateReason(g)))return gate.any.map(g=>gateReason(g)).join('，或');
  if(gate.disabledFeature)return '基准版本未启用这个实验系统';
  if(gate.scienceAny?.length&&!gate.scienceAny.some(id=>state.science[id]))return `先完成${gate.scienceAny.map(id=>maps.science[id]?.name||id).join('或')}`;
  for(const key of ['science','workshop','metaphysics']){
   const requirements=typeof gate[key]==='string'?[gate[key]]:gate[key]||[];
   for(const id of requirements)if(!state[key]?.[id])return `先完成${maps[key]?.[id]?.name||id}`;
  }
  for(const [type,stateKey,label] of [['buildings','buildings','建造'],['faith','religion','获得'],['space','space','完成'],['time','time','获得']]){
   for(const [id,count] of Object.entries(gate[type]||{}))if(n(state[stateKey],id)<count)return `先${label} ${count} ${maps[type]?.[id]?.name||id}`;
  }
  if(gate.challenge&&!isChallenge(gate.challenge))return '只在对应试炼中开放';
  if(gate.praised&&state.praised<gate.praised)return `累计星光达到 ${gate.praised}`;
  if(gate.year&&state.calendar.year<gate.year)return `第 ${gate.year} 年开放`;
  if(gate.bears&&state.bears.length<gate.bears)return `需要 ${gate.bears} 只熊`;
  for(const [id,value] of Object.entries(gate.resources||{}))if(state.resources[id]<value)return `需要拥有 ${value} ${resourceById[id]?.name||id}`;
  if(gate.discovery&&!state.discoveries[gate.discovery])return '先探索并结识这个伙伴';
  if(gate.transcendence&&state.transcendence<gate.transcendence)return `需要超越等级 ${gate.transcendence}`;
  return '';
 }
 function owned(def){
  if(def.type==='build')return n(state.buildings,def.id);
  if(def.type==='space')return n(state.space,def.id);
  if(def.type==='faith')return n(state.religion,def.id);
  if(def.type==='research')return state.science[def.id]?1:0;
  if(def.type==='upgrade')return state.workshop[def.id]?1:0;
  return 0;
 }
 function costsFor(def,amount=1){
  const e=effects(), result={};
  let perUnit=def.cost||{};if(def.type==='craft'||def.type==='refine')perUnit=policyCraftCosts(state,def.id,perUnit);if(def.type==='trade'){perUnit=policyTradeCosts(state,def.id,perUnit);const volume=tradeVolume(e,ambassadorOutput(context(),e,happiness(e)));for(const key of Object.keys(perUnit))if(!['manpower','gold'].includes(key))perUnit[key]*=volume;if(isChallenge('postApocalypse'))for(const key of ['manpower','gold'])perUnit[key]*=1+(e.pollutionLevel||0);}
  for(const [id,base] of Object.entries(perUnit)){
   let price=base;
   if(def.id==='wood'&&state.workshop.advancedRefinement)price=50;
   const ratioChange=(e[`${def.id}RatioAdjustment`]||0)-(e.priceReduction||0)-(e[`${def.id}PriceReduction`]||0);
   const baseRatio=(def.priceRatios?.[id]||1)*def.ratio;const ratio=baseRatio?(def.type==='build'?baseRatio+limitedDR(ratioChange,baseRatio-1):baseRatio):1;
   result[id]=def.ratio?geometricCost(price,ratio,owned(def),amount):price*amount;
   result[id]*=1-limitedDR(id==='gold'&&!['build','space','faith'].includes(def.type)?0:(e[`${id}CostReduction`]||0));
   if(def.type==='build')result[id]*=1-limitedDR(e[`${def.id}CostReduction`]||0);
   result[id]*=leadershipCostMultiplier(state,id,def.type==='faith'?'religion':def.type);
  }
  const adjusted=workshopHooks.workshopCosts(state,def,amount,result);return progressionHooks.challengeCosts?progressionHooks.challengeCosts(state,def,amount,adjusted,e):adjusted;
 }
 function currency(id){if(id==='devotion')return state.praised;if(id==='faithRatio')return state.faithRatio;return state.resources[id]||0;}
 function enough(costs){return Object.entries(costs).every(([id,value])=>currency(id)+EPSILON>=value);}
 function pay(costs){for(const [id,value] of Object.entries(costs)){if(id==='devotion')state.praised=Math.max(0,state.praised-value);else if(id==='faithRatio')state.faithRatio=Math.max(0,state.faithRatio-value);else state.resources[id]=Math.max(0,state.resources[id]-value);}}
 function add(id,value,p=null){if(value>0)state.resourceUnlocked[id]=true;const cap=(p||production()).caps[id];state.resources[id]=Math.max(0,cap===null?state.resources[id]+value:Math.min(Math.max(cap,state.resources[id]),state.resources[id]+value));}
 function describeEffects(def){
  if(def.summary)return def.summary;
  const lines=[];
  for(const [key,value] of Object.entries(def.effect||{})){
   if(key==='bears')lines.push(`住处 +${value}`);
   else if(resourceById[key])lines.push(`${resourceById[key].name} ${value>0?'+':''}${value*realTicksPerSecond()}/秒`);
   else if(key.endsWith('Max')&&resourceById[key.slice(0,-3)])lines.push(`${resourceById[key.slice(0,-3)].name}容量 +${value}`);
   else if(key.endsWith('Ratio')&&resourceById[key.slice(0,-5)])lines.push(`${resourceById[key.slice(0,-5)].name}产量 +${value*100}%`);
   else if(key==='craftRatio')lines.push(`制作产量 +${value*100}%`);
  }
  if(def.conversion)lines.push('自动消耗原料并生产；原料不足时按可用量工作。');
  return lines.join(' · ');
 }
 function card(def,amount=1){
  let reason=gateReason(def.gate), count=owned(def);
  const isOne=def.type==='research'||def.type==='upgrade'||def.oneTime;
  const costs=costsFor(def,amount);
  const unlocked=!reason;
  if(!reason&&isOne&&count)reason='已完成';
  if(!reason&&def.max&&count>=def.max)reason='已达到上限';
  if(!reason&&!enough(costs))reason='物资不足';
  return {...def,effect:undefined,conversion:undefined,gate:undefined,cost:undefined,unlocked,visible:unlocked||count>0,available:!reason,reason,costs:Object.entries(costs).map(([id,value])=>({id,name:resourceById[id]?.name||(id==='devotion'?'累计星光':id),value,owned:currency(id)})),owned:count,completed:!!(isOne&&count),effects:describeEffects(def),provides:[...new Set([...Object.keys(def.effect||{}).filter(id=>resourceById[id]&&def.effect[id]>0),...Object.keys(def.conversion?.output||{}),...(def.output?[def.output]:[])])],capacityProvides:Object.keys(def.effect||{}).filter(id=>id.endsWith('Max')&&resourceById[id.slice(0,-3)]&&def.effect[id]>0).map(id=>id.slice(0,-3)),...(['research','upgrade'].includes(def.type)?researchRelations(catalog,def):{}),enabled:!state.disabled[def.id]&&(def.type!=='build'||enabledCount(def.id)>0),active:def.type==='build'?enabledCount(def.id):undefined,sellable:def.type==='build'&&count>0&&!workshopHooks.workshopSellReason?.(state,def.id),sellReason:def.type==='build'?workshopHooks.workshopSellReason?.(state,def.id)||'':'',toggleable:!!def.toggleable||!!def.conversion||['steamworks','oilWell','biolab','factory'].includes(def.id)};
 }
 function maxAffordable(def){
  if(!enough(costsFor(def,1)))return 0;
  if(!def.ratio){let count=MAX_BATCH;for(const [id,value] of Object.entries(costsFor(def,1)))if(value>0)count=Math.min(count,Math.floor((currency(id)+EPSILON)/value));return count;}
  let lo=1,hi=2;while(hi<MAX_BATCH&&enough(costsFor(def,hi))){lo=hi;hi*=2;}
  hi=Math.min(hi,MAX_BATCH);while(lo<hi){const mid=Math.ceil((lo+hi)/2);if(enough(costsFor(def,mid)))lo=mid;else hi=mid-1;}return lo;
 }
 function notify(){if(!listeners.size)return;const view=snapshot();for(const fn of [...listeners]){try{fn(view);}catch(error){console.error('Beargame view update failed',error);}}}
 function result(ok,message,extra={}){if(ok&&!yearJumpCollectors){log(message,'action');notify();}return {ok,message,...extra};}
 function applyBuildingPurchase(def,amount){
  const before=enabledCount(def.id);state.buildings[def.id]=owned(def)+amount;state.activeBuildings[def.id]=before+amount;state.disabled[def.id]=false;
  if(['hut','logHouse','mansion'].includes(def.id)){state.ironWill=false;state.activeChallenges=state.activeChallenges.filter(x=>x!=='ironWill');if(state.challenge==='ironWill')state.challenge=state.activeChallenges[0]||null;}
 }
 function buy(def,amount){
  if(!def)return result(false,'没有找到这个项目。');
  const reason=gateReason(def.gate);if(reason)return result(false,reason);
  if((def.type==='research'||def.type==='upgrade'||def.oneTime)&&owned(def))return result(false,'已经完成。');
  amount=amount==='max'?maxAffordable(def):amount;
  if(def.type==='research'||def.type==='upgrade'||def.oneTime)amount=1;
  if(def.max)amount=Math.min(amount,def.max-owned(def));
  if(amount<1)return result(false,'物资不足，或已达到上限。');
  const costs=costsFor(def,amount);if(!enough(costs))return result(false,'物资不足。');
  pay(costs);
  if(def.type==='build')applyBuildingPurchase(def,amount);
  if(def.type==='research')state.science[def.id]=true;
  if(def.type==='upgrade')state.workshop[def.id]=true;
  if(def.type==='faith')state.religion[def.id]=owned(def)+amount;
  if(def.type==='space')state.space[def.id]=owned(def)+amount;
  maintainPolicies(state);maintainQueueSources(context());
  return result(true,`${def.name}${amount>1?` × ${amount}`:''}已完成。`);
 }
 function resetPreview(){
  const extended=prestigePreview(context());if(extended)return extended;
  return {paragon:Math.max(0,state.bears.length-70),karma:0,bears:state.bears.length,available:!!state.science.metaphysics,description:'重建营地会清除本轮资源、建筑、科技与熊群。保留传承、业力及已完成挑战。'};
 }
 function snapshot({jobDetails=false,batchTarget=null,buildingTargets=[]}={}){
  const previousCache=effectCache;const p=production();effectCache=p.effects;try{
  const rateScale=realTicksPerSecond(),counts=jobCounts(), assigned=Object.values(counts).reduce((a,b)=>a+b,0);
  const defsWith=(key)=>catalog[key].map(d=>card(key==='buildings'?buildingDefinition(d.id):d));
  const resources=catalog.resources.map(r=>({id:r.id,name:r.name,value:state.resources[r.id],max:p.caps[r.id],rate:p.net[r.id]*rateScale,grossRate:p.gross[r.id]*rateScale,consumptionRate:Math.max(0,(p.gross[r.id]-p.net[r.id])*rateScale),breakdown:[{label:'总产出',rate:p.gross[r.id]*rateScale},{label:'总消耗',rate:(p.net[r.id]-p.gross[r.id])*rateScale}],visible:!!state.resourceUnlocked[r.id]||['honey','wood'].includes(r.id)||state.resources[r.id]>0||Math.abs(p.net[r.id])>EPSILON,description:r.description}));
  let jobs=catalog.jobs.map(d=>{const limit=d.id==='ambassador'?ambassadorLimit(state,p.effects):d.id==='engineer'?n(state.buildings,'factory'):Infinity;const reason=gateReason(d.gate)||(d.id==='priest'&&isChallenge('atheism')?'无星长夜中不能安排祈愿熊':'')||(counts[d.id]>=limit?'岗位已满':'');return {...d,type:'assign',unlocked:!reason,visible:!reason||counts[d.id]>0,available:!reason&&assigned<state.bears.length,reason:reason||(assigned>=state.bears.length?'没有空闲小熊':''),costs:[],owned:counts[d.id],assigned:counts[d.id],limit:Number.isFinite(limit)?limit:null,effects:d.output?`基础产量 ${d.rate*rateScale} ${resourceById[d.output]?.name}/秒`:d.description};});
  if(jobDetails){
   const originalState=state,originalCache=effectCache;
   const project=bears=>{try{state=clone(originalState);state.bears=clone(bears);effectCache=null;return production();}finally{state=originalState;effectCache=originalCache;}};
   jobs=jobDecisions({state,production:p,rateScale,jobs,resources,project});
  }
  const season=state.calendar.season,advanced=progressionView(context(),p);
  const requestedBuildings=[...new Set([...(batchTarget?.section==='buildings'?[batchTarget.id]:[]),...(Array.isArray(buildingTargets)?buildingTargets:[])])].filter(id=>typeof id==='string'&&maps.buildings[id]).slice(0,6);
  const projectBuilding=(definition,purchase)=>{
   const originalState=state,originalCache=effectCache;
   try{
    state=clone(originalState);effectCache=null;
    if(purchase)pay(costsFor(definition));
    applyBuildingPurchase(definition,1);maintainPolicies(state);maintainQueueSources(context());effectCache=null;
    return production();
   }finally{state=originalState;effectCache=originalCache;}
  };
  const buildingPreviews=requestedBuildings.map(id=>buildingDecision(context(),id,p,projectBuilding)).filter(Boolean);
  const praiseGain=state.resources.faith*progressionHooks.praiseMultiplier(state.faithRatio);
  const praiseReason=!state.science.theology?'需要星光礼仪':isChallenge('atheism')?'无星长夜中不能举行祈愿':state.resources.faith<=.0001?'还没有积攒足够的信仰':!Number.isFinite(praiseGain)||praiseGain>1e100-state.praised?'祈愿结果超出可保存范围':'';
  return {
   version:constants.SAVE_VERSION,rateMultiplier:rateScale/5,buildingPreviews,batchPreview:batchTarget?batchDecision(context(),batchTarget,p,advanced):null,resources,buildings:defsWith('buildings'),crafts:defsWith('crafts'),science:defsWith('science'),workshop:defsWith('workshop'),jobs,faith:advanced.faithCards,space:advanced.spaceCards,trades:defsWith('trades').map(c=>c.unlocked||c.owned?{...c,tradePreview:tradeDecision(context(),maps.trades[c.id],p)}:c),challenges:advanced.challengeCards,
   actions:[
    {id:'honey',type:'gather',name:'采集蜂蜜',description:'从花丛边采回 1 蜂蜜。',unlocked:true,available:state.resources.honey<p.caps.honey,costs:[],effects:'+1 蜂蜜'},
    card(maps.crafts.wood),card(festivalDefinition),
    {id:'hunt',type:'hunt',name:'巡林狩猎',description:'消耗 100 活力，寻找毛皮与象牙。',unlocked:!!state.science.archery,available:!!state.science.archery&&!isChallenge('pacifism')&&state.resources.manpower>=100,costs:[{id:'manpower',name:'活力',value:100,owned:state.resources.manpower}],reason:isChallenge('pacifism')?'和平山林中不能狩猎':state.resources.manpower<100?'需要 100 活力':''},
    {id:'praise',type:'praise',name:'向星空祈愿',description:'把当前信仰汇入累计星光。',unlocked:!!state.science.theology,available:!praiseReason,reason:praiseReason,costs:[{id:'faith',name:'信仰',value:state.resources.faith,owned:state.resources.faith}],conversionPreview:{input:state.resources.faith,output:praiseGain},effects:`累计星光 ${state.praised.toFixed(2)}`},
    {id:'explore',type:'explore',name:'派熊远行',description:'消耗 1000 活力，寻找新的交换伙伴。',unlocked:Object.values(state.discoveries).some(Boolean),available:Object.values(state.discoveries).some(Boolean)&&state.resources.manpower>=1000,costs:[{id:'manpower',name:'活力',value:1000,owned:state.resources.manpower}],reason:state.resources.manpower<1000?'需要 1000 活力':''},
    {id:'observe',type:'observe',name:'记录星象',description:'抓住短暂出现的观测机会。',unlocked:!!state.observation,available:!!state.observation,costs:[]},
   ],
   calendar:{...state.calendar,seasonName:constants.SEASONS[season],weatherName:state.calendar.weather>0?'暖和':state.calendar.weather<0?'寒冷':'平和'},
   bears:{value:state.bears.length,max:p.housing,free:state.bears.length-assigned,happiness:p.happiness*100,happinessBreakdown:happinessBreakdown(state,p.effects,p.housing,p.happiness*100),jobs:counts,arrival:state.arrival,individuals:state.bears.map(b=>({...b,skills:{...b.skills}}))},
   log:state.log.map(x=>({...x})),stats:{...state.stats},settings:{...state.settings},saveStatus:{...saveStatus},coverage:clone(coverage),offlineReport,pendingOffline,catchingUp,pendingOperation:pendingOperation?{...pendingOperation}:null,
   progression:{praised:state.praised,faithRatio:state.faithRatio,transcendence:state.transcendence,craftBonus:p.effects.craftRatio||0,faithBonus:p.faithProduction,paragonBonus:p.paragonProduction,challenge:state.challenge,festivalDays:state.festivalDays,conversions:p.conversions,...advanced},
   ...achievementView(context()),gifts:seasonalGiftsView(context()),undo:undoView(context()),queue:queueView(context()),engineers:engineerView(context()),embassies:embassyView(context()),buildingStages:stageView(context()),workshopDynamics:workshopHooks.workshopView(context()),diplomacy:{ambassadors:{...p.ambassadors,culturePerSecond:p.ambassadors.culture*rateScale,spicePerSecond:p.ambassadors.spice*rateScale},ambassadorLimit:ambassadorLimit(state,p.effects)},policies:policyView(context()),leadership:leadershipView(context()),energy:{supply:p.effects.energySupply||0,demand:p.effects.energyDemand||0,efficiency:p.effects.energyDeficit||1},pollution:{value:state.pollution,level:p.effects.pollutionLevel||0,honeyPenalty:p.effects.pollutionHoneyRatio||0},resetPreview:resetPreview(),ticks:state.ticks,observation:state.observation?{...state.observation}:null,
  };
  }finally{effectCache=previousCache;}
 }
 function simulateOne(){
  if(state.calendar.day<0){advanceCalendar();return;}
  const current=enabledCount('reactor')||enabledCount('magneto')?effects():{};
  if(enabledCount('reactor')&&state.resources.uranium<=.001*(1-(current.reactorUraniumReduction||0)))state.activeBuildings.reactor=0;
  if(enabledCount('magneto')&&state.resources.oil<=.05)state.activeBuildings.magneto=Math.max(0,enabledCount('magneto')-1);
  maintainPolicies(state);maintainEngineers(context());
  const p=production();const previousCache=effectCache;effectCache=p.effects;try{
  const foodDeficit=state.resources.honey+p.net.honey;
  const starving=foodDeficit<0;
  for(const r of catalog.resources){const cap=p.caps[r.id];state.resources[r.id]=Math.max(0,cap===null?state.resources[r.id]+p.net[r.id]:Math.min(Math.max(cap,state.resources[r.id]),state.resources[r.id]+p.net[r.id]));if(state.resources[r.id]>0)state.resourceUnlocked[r.id]=true;}
  if(starving){
   if(state.bears.length&&state.deathCooldown<=0&&Math.round(-foodDeficit)>=1){
    const index=Math.floor(nextRandom(state)*state.bears.length);const removed=state.bears.splice(index,1)[0];if(removed.id===state.leaderId)state.leaderId=null;state.stats.totalDeaths++;achievementEvent(context(),'death',{count:1});state.deathCooldown=25;log('一只小熊因饥饿离开了营地。请增加蜂蜜产量。','warning');
   }else if(state.deathCooldown>0)state.deathCooldown--;
  }else if(state.bears.length<p.housing){
   state.arrival+=.01*(1+(p.effects.growthRatio||0))*(state.festivalDays>0?2+(p.effects.festivalArrivalRatio||0):1)/Math.max(1,p.effects.pollutionArrivalDivisor||0);
   if(state.arrival+1e-12>=1){state.bears.push(createBear());state.arrival=state.bears.length>=p.housing?0:Math.max(0,state.arrival-1);log('一只新熊循着蜂蜜香气来到营地。','arrival');state.stats.maxBears=Math.max(state.stats.maxBears,state.bears.length);}
  }else state.arrival=0;
  const tickJobCounts=state.workshop.neuralNetworks?jobCounts():null;
  if(!isChallenge('anarchy'))for(const bear of state.bears){
   if(!bear.job)continue;
   const housingModifier=state.bears.length<=p.housing?1/(1+limitedDR(p.effects.maxKittensRatio||0,1)):1;const learn=(state.workshop.internet?Math.max(state.bears.length*housingModifier/10000,.01):.01)+(p.effects.skillXP||0);
   if(bear.job!=='engineer'||bear.engineerSpecialty){bear.skills[bear.job]=Math.min(20001,(bear.skills[bear.job]||0)+learn);bear.experience+=learn;}
   if(state.workshop.neuralNetworks){const counts=tickJobCounts;for(const id of Object.keys(counts))if(counts[id]){const gain=.001*counts[id];bear.skills[id]=Math.min(20001,(bear.skills[id]||0)+gain);}}else for(const id of Object.keys(bear.skills))if(id!==bear.job){const loss=Math.min(.001,bear.skills[id]);bear.skills[id]-=loss;bear.experience=Math.max(0,bear.experience-loss);}
  }
  state.pollution=Math.max(0,state.pollution+pollutionRate(state.pollution,p.effects.pollution||0,p.effects.cleanEnergy||0,p.effects.pollutingEnergy||0,p.effects.pollutionRatio||0,p.effects.pollutionCleanup||0,isChallenge('postApocalypse')));
  workshopHooks.onWorkshopTick(context(),p);onEngineerTick(context(),p);onQueueTick(context());
  advanceCalendar();
  }finally{effectCache=previousCache;}
 }
 function advanceCalendar(){
  onTickProgression(context());
  state.ticks++;state.stats.totalTicks++;state.calendar.tick++;
  const oldYear=state.calendar.year,newDay=state.calendar.tick>=10;
  let newSeason=false,newYear=false;
  if(newDay){
   state.calendar.tick=0;state.calendar.day++;if(state.festivalDays>0)state.festivalDays--;
   newSeason=state.calendar.day>=100;
   if(newSeason){state.calendar.day=0;state.calendar.season++;const weatherRoll=Math.floor(nextRandom(state)*1000),winterRuns=n(state.challengeCompletions,'winterIsComing'),coldShift=isChallenge('winterIsComing')?limitedDR(.05*winterRuns,.825):0,warmChance=Math.max(0,.175-coldShift),coldChance=.175+coldShift;state.calendar.weather=state.calendar.year>3?(weatherRoll<warmChance*1000?1:weatherRoll<(warmChance+coldChance)*1000?-1:0):0;if(!isChallenge('winterIsComing')&&winterRuns&&state.calendar.season===3&&state.calendar.weather<0)state.calendar.weather=0;}
   newYear=state.calendar.season>=4;
   if(newYear){state.calendar.season=0;if(!(isChallenge('1000Years')&&state.calendar.year>=500)){state.calendar.year++;state.stats.totalYears++;log(`第 ${state.calendar.year} 年，春天回到了森林。`,'calendar');}}
   if(newSeason)progressionHooks.onSeasonProgression?.(context());
   onDay();
   if(newSeason)workshopHooks.onWorkshopSeason(context());
   if(newYear)progressionHooks.onYearProgression?.(context(),oldYear,state.calendar.year);
  }
  if(state.observation&&state.ticks>=state.observation.expires)finishObservation();checkAchievements(context());
 }
 function onDay(){
  onDayProgression(context());workshopHooks.onWorkshopDay?.(context());onUndoDay(context());
  const envoyYear=state.metaphysics.navigationDiplomacy&&state.resources.ship>=1?0:state.metaphysics.diplomacy?1:state.karmaKittens>0?5:20;
  if(state.calendar.year>=envoyYear&&!Object.values(state.discoveries).some(Boolean)){const ids=['lizards','sharks','griffins'];const id=state.metaphysics.navigationDiplomacy&&state.resources.ship>=1?(state.resources.culture>=1500?'nagas':'zebras'):ids[Math.floor(nextRandom(state)*ids.length)];state.discoveries[id]=true;log(`${maps.trades[id].name}的使者来到营地，可以开始贸易了。`,'trade');}
  const e=effects(),chanceScale=(1+(e.timeRatio||0)*.25)*(state.metaphysics.chronomancy?1.1:1);
  if(state.science.mining&&nextRandom(state)<.001*chanceScale+(state.ironWill?.004:0)){
   const academy=1+(e.academyMeteorBonus||0);let minerals=(50+25*(e.mineralsRatio||0))*academy;
   if(state.ironWill)minerals*=1.1*(1+(e.mineralsPolicyRatio||0)/3);
   add('minerals',minerals);if(state.workshop.prospecting)add('iron',5*academy);if(state.workshop.celestialMechanics)add('science',15*(1+(e.scienceRatio||0))*academy);
   log('一颗小小陨石落在林地，留下了矿物与新的观察记录。','event');
  }
  if(!isChallenge('blackSky')&&(enabledCount('library')>0||state.science.astronomy)&&nextRandom(state)<(.0025+(e.starChance||0))*chanceScale*(state.metaphysics.astromancy?2:1)){
   if(state.observation)finishObservation();state.observation={expires:state.ticks+(state.ironWill?600:300)};
   if(state.workshop.seti)observe(false);else log('树梢之上出现了值得记录的星象。','observation');
  }
 }
 function simulateRealtimeTick(){
  advanceUndoClock(context(),.2);
  const accelerating=state.timeState.accelerating&&state.resources.temporalFlux>0;
  simulateOne();
  if(accelerating){state.resources.temporalFlux=Math.max(0,state.resources.temporalFlux-1);state.timeState.accelerationRemainder=(state.timeState.accelerationRemainder||0)+1;if(state.timeState.accelerationRemainder>=2){state.timeState.accelerationRemainder=0;simulateOne();}if(state.resources.temporalFlux<=0)state.timeState.accelerating=false;}
  progressionHooks.onRealTickProgression?.(context());
 }
 function simulate(seconds,{offline=false,notify:doNotify=true}={}){
  if(catchingUp||pendingOffline>0)return {ok:false,message:'离线结算还在进行中。',seconds:0};
  if(!Number.isFinite(seconds)||seconds<0)return {ok:false,message:'时间必须是非负有限数字。',seconds:0};
  if(state.settings.paused&&!offline){if(advanceUndoClock(context(),seconds))notify();return {ok:true,seconds:0,ticks:0};}
  let used=seconds,dropped=0;
  if(offline){
   const limit=state.calendar.year>=1000||state.resources.paragon>0?32000:8000;
   used=Math.round(seconds/2)*2;
   if(used<6)used=0;
   dropped=Math.max(0,used-limit);used=Math.min(used,limit);
  }else if(seconds>86400){return {ok:false,message:'一次推进的时间过长。',seconds:0};}
  const exact=used*5+state.tickRemainder;
  const ticks=Math.floor(exact+1e-10);
  // Keep exceptional late-range/furnace ticks transactional without cloning
  // every ordinary early-game tick. A maximum active call spans <=162 years.
  const protectRealtime=!offline&&ticks>0&&(state.calendar.year>=1e9-200||(state.timeState.furnaceEnabled&&n(state.time,'blastFurnace')>0));
  const realtimeCheckpoint=protectRealtime?clone(state):null,realtimeUndo=protectRealtime?captureUndoSession(state):null;
  state.tickRemainder=Math.max(0,exact-ticks);
  const before=offline?clone(state.resources):null,startBears=state.bears.length;
  if(offline){if(used>=6)clearUndo(context());const checkpoint=clone(state),checkpointUndo=captureUndoSession(state);try{for(const _ of advanceOffline(context(),used/2)){}validateSettlement();checkAchievements(context(),{force:true});}catch(error){state=checkpoint;restoreUndoSession(state,checkpointUndo);effectCache=null;pendingOffline=seconds;return {ok:false,message:`离线结算中断，原有进度已恢复。${error?.message||''}`,seconds:0};}}else {try{for(let i=0;i<ticks;i++)simulateRealtimeTick();if(realtimeCheckpoint)validateSettlement();}catch(error){if(!realtimeCheckpoint)throw error;state=realtimeCheckpoint;restoreUndoSession(state,realtimeUndo);effectCache=null;return {ok:false,message:`时间推进中断，原有进度已恢复。${error?.message||''}`,seconds:0,ticks:0};}}
  if(offline)offlineReport={seconds:used,discardedSeconds:dropped,bears:state.bears.length-startBears,resources:Object.fromEntries(catalog.resources.map(r=>[r.id,state.resources[r.id]-before[r.id]]))};
  if(doNotify&&ticks)notify();
  return {ok:true,seconds:used,ticks,discardedSeconds:dropped};
 }
 function finishObservation(){const raw=(effects().starAutoChance||0)*(state.metaphysics.astromancy?2:1),chance=Math.min(1,Math.max(state.ironWill?.25:0,raw));if(Math.floor(nextRandom(state)*100)<=chance*100)observe(false);state.observation=null;}
 function observe(manual){
  if(!state.observation)return {ok:false,message:'没有待记录的星象。'};
  const p=production(),e=p.effects,chance=(.0025+(e.starChance||0))*(1+(e.timeRatio||0)*.25)*(state.metaphysics.chronomancy?1.1:1)*(state.metaphysics.astromancy?2:1);
  const charts=!state.science.astronomy?0:chance<=1?1:Math.floor(chance)+(nextRandom(state)<chance%1?1:0);
  const science=25*(1+(e.scienceRatio||0))*(state.workshop.celestialMechanics?(state.ironWill?1.6:1.2):1)*Math.max(1,charts);
  add('science',science,p);if(charts)add('starchart',charts,p);state.observation=null;
  if(manual)return result(true,`记录星象：获得 ${Number(science.toFixed(2))} 知识${charts?`和 ${charts} 星图`:''}。`);
  return {ok:true,message:'自动观测完成。'};
 }
 function act(type,id,amount=1){
  if(catchingUp||pendingOffline>0)return result(false,'离线结算还在进行中。');
  if(['shatter','useFurnaceHeat'].includes(type)){const checkpoint=clone(state),checkpointUndo=captureUndoSession(state);try{return performAction(type,id,amount);}catch(error){state=checkpoint;restoreUndoSession(state,checkpointUndo);effectCache=null;notify();return {ok:false,message:`时间结算中断，原有进度已恢复。${error?.message||''}`};}}
  return performAction(type,id,amount);
 }
 function performAction(type,id,amount=1){
  if(amount!=='max'&&(!Number.isInteger(amount)||amount<1||amount>MAX_BATCH))return result(false,'数量必须是有效正整数。');
  const undoToken=beginUndoAction(context(),type,id,amount),oldResetFacts=resetFactsPending;
  if(['reset','challenge','challengeStart'].includes(type))resetFactsPending=captureResetFacts(context(),{ordinaryReset:type==='reset'});
  const before=type==='shatter'?{year:state.calendar.year,dayBefore:state.calendar.day,orbitalLaunchBefore:!!state.space.orbitalLaunch}:null;
  if(type==='gather'&&(!id||id==='honey'))achievementEvent(context(),'gatherAttempt');
  try{
   const outcome=resolveAction(type,id,amount);finishUndoAction(context(),undoToken,outcome);let changed=0;
   if(outcome.ok){
    if(type==='trade')changed+=achievementEvent(context(),'trade',{count:outcome.success||0});
    if(type==='assign'&&id==='hunter')changed+=achievementEvent(context(),'huntersAssigned');
    if(type==='engineerAssign'&&id==='wood')changed+=achievementEvent(context(),'engineerWoodAssigned');
    if(type==='upgrade'&&id==='carbonSequestration')changed+=achievementEvent(context(),'carbonPurchased');
    if(type==='shatter'&&!yearJumpCollectors)changed+=achievementEvent(context(),'shatter',{...before,count:state.calendar.year-before.year});
   }else if(type==='sell'&&id==='aiCore'&&n(state.buildings,'aiCore')>0&&workshopHooks.workshopSellReason?.(state,id))changed+=achievementEvent(context(),'aiSaleRefused');
   if(changed&&!yearJumpCollectors)notify();return outcome;
  }finally{resetFactsPending=oldResetFacts;}
 }
 function resolveAction(type,id,amount=1){
  if(amount!=='max'&&(!Number.isInteger(amount)||amount<1||amount>MAX_BATCH))return result(false,'数量必须是有效正整数。');
  const seasonalAction=actSeasonalGifts(context(),type,id,amount);if(seasonalAction!==undefined)return seasonalAction;
  const undoAction=actUndo(context(),type);if(undoAction!==undefined)return undoAction;
  const queueAction=actBuildQueue(context(),type,id,amount);if(queueAction!==undefined)return queueAction;
  const embassyAction=actEmbassy(context(),type,id,amount);if(embassyAction!==undefined)return embassyAction;
  const engineerAction=actEngineerAutomation(context(),type,id,amount);if(engineerAction!==undefined)return engineerAction;
  const stageAction=actBuildingStages(context(),type,id,amount);if(stageAction!==undefined)return stageAction;
  const workshopAction=workshopHooks.actWorkshopDynamics(context(),type,id,amount);if(workshopAction!==undefined)return workshopAction;
  const policyAction=actPolicies(context(),type,id,amount);if(policyAction!==undefined)return policyAction;
  const leaderAction=actLeadership(context(),type,id,amount);if(leaderAction!==undefined)return leaderAction;
  const extension=actProgression(context(),type,id,amount);if(extension!==undefined)return extension;
  if(type==='festival'){const gate=gateReason(festivalDefinition.gate);if(gate)return result(false,gate);let count=amount==='max'?maxAffordable(festivalDefinition):amount;if(!state.metaphysics.carnivals)count=Math.min(1,count);const bill=costsFor(festivalDefinition,count);if(count<1||!enough(bill))return result(false,'庆典物资不足。');pay(bill);state.festivalDays=state.metaphysics.carnivals?state.festivalDays+400*count:400;return result(true,`蜜林庆典开始了，将持续 ${state.festivalDays} 天。`);}
  if(type==='gather'){
   if(id&&id!=='honey')return result(false,'没有这种采集项目。');
   const cap=production().caps.honey;if(state.resources.honey>=cap)return result(false,'蜂蜜已满仓。');
   add('honey',1);state.stats.totalGathered++;notify();return {ok:true,message:'采到 1 蜂蜜。'};
  }
  if(type==='build')return buy(buildingDefinition(id),amount);
  if(type==='sell'){
   const def=buildingDefinition(id);if(!def||!n(state.buildings,id))return result(false,'没有可拆售的建筑。');
   const reason=workshopHooks.workshopSellReason?.(state,id);if(reason)return result(false,reason);
   const count=amount==='max'?n(state.buildings,id):Math.min(amount,n(state.buildings,id)),previous=n(state.buildings,id),active=enabledCount(id),p=production();
   state.buildings[id]=previous-count;state.activeBuildings[id]=Math.min(active,state.buildings[id]);
   const refundBill=costsFor(def,count),refunds={};
   for(const [resource,cost]of Object.entries(refundBill)){if(['oil','kerosene','thorium'].includes(resource))continue;const before=state.resources[resource];add(resource,Math.min(1e100,cost*sellRefundRatio()),p);refunds[resource]=state.resources[resource]-before;}
   return result(true,`拆售了 ${count} 座${def.name}。`,{sold:count,refunds});
  }
  if(type==='research')return buy(maps.science[id],1);
  if(type==='upgrade')return buy(maps.workshop[id],1);
  if(type==='space')return buy(maps.space[id],amount);
  if(type==='faith')return buy(maps.faith[id],amount);
  if(type==='craft'||type==='refine'){
   const def=maps.crafts[id||'wood'];if(!def)return result(false,'没有找到这个配方。');
   const reason=gateReason(def.gate);if(reason)return result(false,reason);
   amount=amount==='max'?maxAffordable(def):amount;
   if(amount<1||!enough(costsFor(def,amount)))return result(false,'物资不足。');
   const p=production(),baseBonus=(p.effects.craftRatio||0)+leaderCraftBonus(state,def.output);
   const bonus=(baseBonus+workshopHooks.workshopCraftBonus(context(),def.output,baseBonus)+(p.effects[`${def.output}CraftRatio`]||0))*(1+(p.effects[`${def.output}GlobalCraftRatio`]||0));
   const multiplier=def.id==='wood'?(1+(p.effects.refineRatio||0))*(1+(p.effects.refinePolicyRatio||0))*(state.ironWill?1+(p.effects.woodRatio||0)+(p.effects.woodPolicyRatio||0)/3:1):1+bonus;
   const output=def.amount*amount*multiplier,cap=p.caps[def.output];
   if(cap!==null&&state.resources[def.output]>=cap)return result(false,'成品已满仓。');
   pay(costsFor(def,amount));add(def.output,output,p);state.stats.totalCrafted+=amount;
   return result(true,`${def.name}：获得 ${Number(output.toFixed(3))} ${resourceById[def.output].name}。`);
  }
  if(type==='assign'||type==='unassign'){
   const job=maps.jobs[id];if(!job)return result(false,'没有这份工作。');
   if(type==='assign'){if(isChallenge('atheism')&&id==='priest')return result(false,'无信仰挑战期间不能任命祈愿熊。');const reason=gateReason(job.gate);if(reason)return result(false,reason);}
   const candidates=state.bears.filter(b=>type==='assign'?!b.job:b.job===id);
   amount=amount==='max'?candidates.length:Math.min(amount,candidates.length);
   if(type==='assign'){const limit=id==='ambassador'?ambassadorLimit(state,effects()):id==='engineer'?n(state.buildings,'factory'):Infinity;amount=Math.max(0,Math.min(amount,limit-(jobCounts()[id]||0)));}
   if(type==='assign'&&isChallenge('anarchy')){const employed=state.bears.length-candidates.length;const cap=Math.round(state.bears.length*(1-(.5+limitedDR(.05*n(state.challengeCompletions,'anarchy'),.25))));amount=Math.max(0,Math.min(amount,cap-employed));}
   if(!amount)return result(false,type==='assign'?'没有空闲小熊。':'这份工作还没有小熊。');
   candidates.sort((a,b)=>type==='unassign'&&id==='engineer'?(Number(!!a.engineerSpecialty)-Number(!!b.engineerSpecialty))||((a.skills[id]||0)-(b.skills[id]||0)):(b.skills[id]||0)-(a.skills[id]||0));
   for(let i=0;i<amount;i++){candidates[i].job=type==='assign'?id:null;if(type==='unassign')candidates[i].engineerSpecialty=null;}
   return result(true,`${amount} 只小熊${type==='assign'?`成为${job.name}`:'回到休息区'}。`);
  }
  if(type==='toggle'){
   const def=buildingDefinition(id)||maps.space[id];if(!def||(!def.conversion&&!def.toggleable&&!['steamworks','oilWell','biolab','factory'].includes(def.id))||!owned(def))return result(false,'这个项目不能切换。');
   state.disabled[id]=!state.disabled[id];if(def.type==='build')state.activeBuildings[id]=state.disabled[id]?0:n(state.buildings,id);return result(true,`${def.name}已${state.disabled[id]?'暂停':'恢复'}。`);
  }
  if(type==='praise'){
   if(!state.science.theology)return result(false,'先研究星光礼仪。');
   if(state.resources.faith<=0)return result(false,'还没有可以献出的信仰。');
   const gain=state.resources.faith*(1+state.faithRatio);if(!Number.isFinite(gain)||gain>1e100-state.praised)return result(false,'祈愿结果超出可保存范围，信仰尚未消耗。');state.praised+=gain;state.resources.faith=0;return result(true,`祈愿汇入 ${Number(gain.toFixed(2))} 星光。`);
  }
  if(type==='observe'){if(!state.observation)return result(false,'此刻没有待记录的星象。');return observe(true);}
  if(type==='hunt'){
   if(isChallenge('pacifism'))return result(false,'和平挑战期间不能狩猎。');
   if(!state.science.archery)return result(false,'先研究林间狩猎。');
   const count=amount==='max'?Math.min(MAX_BATCH,Math.floor(state.resources.manpower/100)):amount;
   if(!count||state.resources.manpower+EPSILON<count*100)return result(false,'每次狩猎需要 100 活力。');
   const p=production(), ratio=p.effects.hunterRatio||0;
   pay({manpower:count*100});const found={furs:0,ivory:0,unicorns:0};
   for(let i=0;i<count;i++){
    found.furs+=nextRandom(state)*80+nextRandom(state)*65*ratio;
    if(nextRandom(state)<.45+.02*ratio)found.ivory+=nextRandom(state)*50+nextRandom(state)*40*ratio;
    if(nextRandom(state)<.05)found.unicorns++;
   }
   for(const [resource,value]of Object.entries(workshopHooks.workshopHunt?.(context(),count,p)||{}))found[resource]=(found[resource]||0)+value;
   for(const [resource,value] of Object.entries(found))add(resource,value,p);
   state.stats.totalHunts+=count;if(count>=1000)state.challengesUnlocked.pacifism=true;
   return result(true,`巡林归来：${Number(found.furs.toFixed(2))} 毛皮，${Number(found.ivory.toFixed(2))} 象牙${found.unicorns?`，遇见 ${found.unicorns} 只灵鹿`:''}。`,{gains:found});
  }
  if(type==='explore'){
   if(!Object.values(state.discoveries).some(Boolean))return result(false,'等候第一支商队到来，再安排远行。');
   if(state.resources.manpower<1000)return result(false,'探索需要 1000 活力。');
   const p=production();let found=null;
   for(const [candidate,condition] of [['nagas',state.resources.culture>=1500],['zebras',state.resources.ship>=1],['spiders',state.resources.ship>=100&&p.caps.science>125000],['dragons',!!state.science.nuclearFission]])if(!found&&condition&&!state.discoveries[candidate])found=candidate;
   if(!found){const choices=['lizards','sharks','griffins'].filter(k=>!state.discoveries[k]);if(choices.length)found=choices[Math.floor(nextRandom(state)*choices.length)];}
   pay({manpower:1000});
   if(found){state.discoveries[found]=true;return result(true,`远行的熊认识了${maps.trades[found].name}。`);}
   return result(true,'这次远行没有找到新的伙伴。新的船只、文化和知识可能通向更远的地方。');
  }
  if(type==='trade'){
   const def=maps.trades[id];if(!def)return result(false,'没有找到这支商队。');
   const gate=gateReason(def.gate);if(gate)return result(false,gate);
   amount=amount==='max'?maxAffordable(def):amount;if(amount<1||!enough(costsFor(def,amount)))return result(false,'交换所需的物资不足。');
   const p=production(),e=p.effects,a=p.ambassadors,volume=tradeVolume(e,a),policyTrade=policyTradeBonuses(state,id),tradeMultiplier=1+(e.tradeRatio||0)+policyTrade.tradeRatio,standingBonus=policyTrade.standing+n(state.buildings,'tradepost')*(e.tradepostStanding||0)+(e.standingRatio||0);
   const standing=def.standing<0?Math.min(0,def.standing+standingBonus):def.standing>0?def.standing+standingBonus/2:state.policies.lizardRelationsDiplomats?Math.max(0,(standingBonus+policyTrade.neutralStanding-.25)/3):0;
   const gains={};let success=0,friendly=0;pay(costsFor(def,amount));
   for(let i=0;i<amount;i++){
    const protectedTrade=consumeUndoTrade(context());if(standing<0&&(protectedTrade||nextRandom(state)<-standing))continue;
    success++;const bonus=standing>0&&(!protectedTrade||standing>=1)&&nextRandom(state)<standing?1.25:1;if(bonus>1)friendly++;
    for(const good of policyTradeGoods(state,id,def.goods)){const chance=goodsProbability(state,def,good,a);if(chance<=0||(protectedTrade&&chance<1)||nextRandom(state)>=chance)continue;const value=good.amount*(1+good.width*(nextRandom(state)-.5))*tradeMultiplier*(1+(good.seasons?.[state.calendar.season]||0))*bonus*volume*(id==='leviathans'?1+.02*state.elderState.energy:1);gains[good.id]=(gains[good.id]||0)+value;}
    const spiceChance=spiceProbability(state,def,a);if((!protectedTrade||spiceChance>=1)&&nextRandom(state)<spiceChance)gains.spice=(gains.spice||0)+(25+50*tradeMultiplier*nextRandom(state))*Math.max(1,spiceChance);
    const blueprintChance=.1+policyTrade.blueprintChance+(a.tradeBlueprintChance||0);if((!protectedTrade||blueprintChance>=1)&&nextRandom(state)<blueprintChance)gains.blueprint=(gains.blueprint||0)+1;
    if(id==='zebras'&&(!protectedTrade||.15+.0035*state.resources.ship>=1)&&nextRandom(state)<Math.min(1,.15+.0035*state.resources.ship))gains.titanium=(gains.titanium||0)+(1.5+.03*state.resources.ship)*volume*(1+(e.zebraRelationModifier||0)*.015);
   }
   for(const [key,value] of Object.entries(gains))add(key,value,p);state.stats.totalTrades+=success;if(id==='leviathans'&&success)state.elderState.duration=Math.min(state.elderState.duration,100*(4+Math.floor(state.elderState.energy)));
   return result(true,`${def.name}完成 ${success}/${amount} 次交换${friendly?`，其中 ${friendly} 次获友好馈赠`:''}。${Object.entries(gains).map(([key,value])=>`${Number(value.toFixed(2))} ${resourceById[key]?.name||key}`).join('，')||'这次没有带回物资。'}`,{gains,success,friendly});
  }
  if(type==='reset')return result(false,'重建机制正在核验，暂未开放。');
  if(type==='hunt'||type==='trade'||type==='explore'||type==='observe'||type==='challenge')return result(false,'这个系统尚未开放。');
  return result(false,'无法执行这个操作。');
 }
 function validateSettlement(){
  for(const value of [...Object.values(state.resources),state.praised,state.pollution,state.karmaKittens,state.faithRatio,state.religionCounters.pactDebt])if(!Number.isFinite(value)||value<0||value>1e100)throw new Error('结算数值超出可保存范围。');
  if(!Number.isInteger(state.calendar.year)||state.calendar.year>1e9)throw new Error('年份超出可保存范围。');
 }
 function runYearJump(generator){
  if(yearJumpCollectors){yearJumpCollectors.push(generator);return;}
  for(const _ of generator){}
 }
 async function actAsync(type,id,amount=1,{onProgress,signal}={}){
  if(!['shatter','useFurnaceHeat'].includes(type))return act(type,id,amount);
  if(catchingUp||pendingOffline>0)return {ok:false,message:'请等待当前结算完成。'};
  const checkpoint=clone(state),checkpointUndo=captureUndoSession(state);let outcome;const jumps=[];
  catchingUp=true;pendingOperation={kind:'timeJump',progress:0,completed:0,total:typeof amount==='number'?amount:null};yearJumpCollectors=jumps;
  try{
   if(signal?.aborted)throw new Error('结算已取消。');
   outcome=performAction(type,id,amount);yearJumpCollectors=null;
   if(!outcome.ok)return outcome;
   notify();
   for(const iterator of jumps){
    let finished=false;
    while(!finished){
     const started=globalThis.performance?.now?.()??Date.now();
     for(let i=0;i<25;i++){
      if(signal?.aborted)throw new Error('结算已取消。');const step=iterator.next();if(step.done){finished=true;break;}
      const v=step.value||{},completed=v.completedYears??v.completed??v.yearIndex??pendingOperation.completed+1,total=v.totalYears??v.total??pendingOperation.total;
      pendingOperation={kind:'timeJump',completed,total,progress:total?Math.min(1,completed/total):0};
      if((globalThis.performance?.now?.()??Date.now())-started>=10)break;
     }
     if(onProgress){try{onProgress({...pendingOperation});}catch{}}
     notify();await new Promise(resolve=>setTimeout(resolve,0));
    }
   }
   if(signal?.aborted)throw new Error('结算已取消。');validateSettlement();if(type==='shatter')achievementEvent(context(),'shatter',{count:state.calendar.year-checkpoint.calendar.year,dayBefore:checkpoint.calendar.day,orbitalLaunchBefore:!!checkpoint.space.orbitalLaunch});checkAchievements(context(),{force:true});log(outcome.message,'action');return outcome;
  }catch(error){state=checkpoint;restoreUndoSession(state,checkpointUndo);effectCache=null;return {ok:false,cancelled:!!signal?.aborted,message:`时间结算中断，原有进度已恢复。${error?.message||''}`};}
  finally{yearJumpCollectors=null;catchingUp=false;pendingOperation=null;notify();}
 }
 function save(){
  if(catchingUp||pendingOffline>0)return {ok:false,message:'离线结算完成后再保存。'};
  if(storageProtected)return {ok:false,message:'原存档未能读取，为避免覆盖，请先导出当前进度，再明确导入或重置。'};
  const at=nowOf(options.now);const text=serialize(state,at);saveStatus={...writeStorage(storage,text),at};if(saveStatus.ok)state.savedAt=at;notify();return {...saveStatus};
 }
 function exportSave(){if(catchingUp||pendingOffline>0)throw new Error('离线结算完成后才能导出完整存档。');return serialize(state,nowOf(options.now));}
 function importSave(text){
  if(catchingUp||pendingOffline>0)return {ok:false,message:'请等待离线结算完成后再导入。'};
  try{const incoming=parseSave(text,nowOf(options.now));state=incoming;storageProtected=false;offlineReport=null;log('已导入存档。','save');notify();return {ok:true,message:'存档已导入。'};}catch(error){return {ok:false,message:error.message};}
 }
 function setSetting(key,value){if(catchingUp||pendingOffline>0)return {ok:false,message:'离线结算还在进行中。'};if(!(key in state.settings)||typeof value!=='boolean')return {ok:false,message:'无效的设置。'};state.settings[key]=value;notify();return {ok:true,message:'设置已更新。'};}
 async function catchUpAsync(seconds=pendingOffline,{onProgress,signal}={}){
  if(catchingUp)return {ok:false,message:'离线结算已经开始。'};
  if(pendingOffline>0)seconds=pendingOffline;
  if(!Number.isFinite(seconds)||seconds<0)return {ok:false,message:'无效的离线时间。'};
  const limit=state.calendar.year>=1000||state.resources.paragon>0?32000:8000;
  let used=Math.min(limit,Math.round(seconds/2)*2);if(used<6)used=0;
  const discardedSeconds=Math.max(0,Math.round(seconds/2)*2-limit);
  const exact=used*5+state.tickRemainder,totalTicks=Math.floor(exact+1e-10),before={...state.resources},beforeBears=state.bears.length;
  if(used>=6)clearUndo(context());const checkpoint=clone(state),checkpointUndo=captureUndoSession(state),pendingCheckpoint=pendingOffline;catchingUp=true;pendingOperation={kind:'offline',progress:0,completed:0,total:totalTicks};notify();
  try{
   const iterator=advanceOffline(context(),used/2);let finished=false;
   while(!finished){
    if(signal?.aborted)throw new Error('结算已取消。');const step=iterator.next();finished=step.done;
    if(!finished){const value=step.value||{},done=Math.min(totalTicks,(value.completedDays||0)*10),progress=value.stage==='calendar'?1:totalTicks?Math.min(.99,done/totalTicks):0;
     pendingOperation={kind:'offline',stage:value.stage,progress,completed:done,total:totalTicks};
     if(onProgress){try{onProgress({completedTicks:done,totalTicks,progress,stage:value.stage});}catch{}}
     notify();await new Promise(resolve=>setTimeout(resolve,0));
    }
   }
   if(signal?.aborted)throw new Error('结算已取消。');validateSettlement();checkAchievements(context(),{force:true});
   state.tickRemainder=Math.max(0,exact-totalTicks);pendingOffline=0;state.savedAt=nowOf(options.now);
   offlineReport={seconds:used,discardedSeconds,bears:state.bears.length-beforeBears,resources:Object.fromEntries(catalog.resources.map(r=>[r.id,state.resources[r.id]-before[r.id]]))};
   return {ok:true,...offlineReport,ticks:totalTicks};
  }catch(error){state=checkpoint;restoreUndoSession(state,checkpointUndo);pendingOffline=pendingCheckpoint;return {ok:false,cancelled:!!signal?.aborted,message:`离线结算中断，原有进度已恢复。${error?.message||''}`};}finally{catchingUp=false;pendingOperation=null;notify();}
 }
 function context(){return {state,isChallenge,enabledCount,buildingDefinition,sellRefundRatio,skillBonus,happiness,jobCounts,currency,maxAffordable,owned,card,act,populationCapacity,realTicksPerSecond,createBear,progressionUndoCosts:(d,amount=1)=>progressionHooks.progressionUndoCosts(context(),d,amount),undoLocked:catchingUp||pendingOffline>0,achievementEnvironment:options.achievementEnvironment,runYearJump,invalidateEffects(){effectCache=null;},queuePurchase:performAction,catalog,maps,constants,resourceById,effects,production,add,pay,enough,costsFor,gateReason,result,log,nextRandom,buy,notify,createState,now:()=>nowOf(options.now),replaceState(next){carryAchievements(context(),next,resetFactsPending??captureResetFacts(context()));state=next;effectCache=null;},limitedDR,triangularInverse,clone};}
 const game={snapshot,getViewModel:snapshot,getState:snapshot,getLeadership:options=>leadershipView(context(),options),act,actAsync,dispatch:({type,id,amount})=>act(type,id,amount),tick:seconds=>simulate(seconds),simulate,catchUpAsync,save,export:exportSave,exportSave,importSave,setSetting,
  subscribe(fn){if(typeof fn!=='function')throw new TypeError('订阅者必须是函数');listeners.add(fn);return()=>listeners.delete(fn);},
  _scheduleOffline(seconds){pendingOffline=seconds;},
  _gainOfflineFlux(seconds){progressionHooks.gainOfflineFlux?.(context(),seconds);},
  _restoreStatus(status,protect=false){saveStatus=status;storageProtected=protect;},
 };
 checkSeasonalGiftOnLoad(context());
 return game;
}
export function importGame(text,options={}){return createGame({...options,save:text});}
export function loadGame(options={}){
 const storage=options.storage===undefined?defaultStorage():options.storage;
 const saved=readStorage(storage);let game;
 try{
  game=saved.text?createGame({...options,storage,save:saved.text}):createGame({...options,storage});
  if(saved.text){const raw=JSON.parse(saved.text);const seconds=Math.max(0,(nowOf(options.now)-raw.savedAt)/1000);game._gainOfflineFlux(seconds);if(game.snapshot().settings.offline&&!game.snapshot().settings.paused){if(options.deferOffline)game._scheduleOffline(seconds);else game.simulate(seconds,{offline:true,notify:false});}}
  game._restoreStatus({ok:saved.ok,message:saved.message|| (saved.text?'已读取本地存档。':'新营地已准备好。'),at:saved.text?JSON.parse(saved.text).savedAt:null},!saved.ok);
 }catch(error){game=createGame({...options,save:undefined,storage});game._restoreStatus({ok:false,message:`${error.message} 原存档未被覆盖。`,at:null},true);}
 return game;
}
