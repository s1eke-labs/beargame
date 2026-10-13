/** Independent industrial rules. Factual coordinates are recorded in tests/industry.test.mjs. */
import {limitedDR} from './math.js';
import {solarBonus,currentCycle,cycleMultiplier} from './progression.js';
import {leaderCraftBonus} from './leadership.js';
import {tribalUpgrades,tribalEffects,extendTribalProduction,onTribalDay,tribalHunt,tribalView,zebraCapacity} from './tribal-workshop.js';
const n=(map,id)=>map?.[id]||0;
const built=(s,id)=>n(s.buildings,id);
const active=(s,id)=>s.disabled?.[id]?0:Math.min(built(s,id),s.activeBuildings?.[id]??built(s,id));
const running=(s,id)=>!s.automationDisabled?.[id];
const space=(s,id)=>s.disabled?.[id]?0:n(s.space,id);
const stateOf=s=>(s.industryState??={steamJammed:false,lastAutomationYear:-1,aiApocalypseEvents:0});
export const additionalWorkshop=tribalUpgrades;
export const additionalJobs=[];
export const aiVulnerableResources=['honey','wood','minerals','coal','iron','titanium','gold','oil','uranium','unobtainium','furs','ivory','spice','unicorns','alicorn'];
export const aiLevel=s=>Math.round(Math.log(Math.max(1,n(s.resources,'gflops'))));
export const aiPower=cores=>cores*(3*cores+5)/4;
export function workshopSellReason(s,id){return id==='aiCore'&&aiLevel(s)>=15&&!s.policies?.transkittenism?'智能等级已达到 15，核心拒绝拆售。':'';}
export function workshopEffects(ctx,e={}){
 const s=ctx.state,d=tribalEffects(s);const add=(k,v)=>{if(v)d[k]=(d[k]||0)+v;};
 const observatories=built(s,'observatory');
 add('scienceMax',observatories*((s.workshop.astrolabe?1500:1000)*(1+(e.observatoryRatio||0))-1000));
 add('scienceRatio',active(s,'observatory')*.25*(e.observatoryRatio||0));
 const labs=built(s,'biolab'),labOn=active(s,'biolab'),biofuel=!!s.workshop.biofuel&&running(s,'biolab');
 const linked=s.workshop.uplink&&s.buildingStages?.library===1?1+built(s,'library')*(e.uplinkLabRatio||0):1;
 add('scienceMax',1500*labs*(linked*(1+(biofuel?(e.biolabBiofuelScienceMaxRatio||0)*labOn:0))-1));
 // Research/refining and Petri-dish bonuses belong to built laboratories, even when fuel conversion is paused.
 add('scienceRatio',.35*(labs-labOn)+(biofuel?.35*labOn:0));
 add('refineRatio',.1*(labs-labOn));
 if(s.workshop.petri){add('compendiumCraftRatio',labs*(e.biolabCompendiumCraftRatio||0));add('compendiumGlobalCraftRatio',labs*(e.biolabCompendiumGlobalCraftRatio||0));}
 const biolabScale=biofuel?Math.min(labOn,n(s.resources,'honey')):0;
 add('biolabScale',biolabScale);
 if(biofuel)add('energyDemand',labOn*(1+(e.biolabEnergyRatio||0)));
 const brewCost=Math.max(0,1+(e.breweryConsumptionRatio||0));
 const brewScale=Math.min(active(s,'brewery'),brewCost?Math.max(0,n(s.resources,'honey')-biolabScale)/brewCost:Infinity,brewCost?n(s.resources,'spice')/(.1*brewCost):Infinity);
 add('breweryScale',brewScale);add('festivalRatio',brewScale*.01);add('festivalArrivalRatio',brewScale*.001);add('manpowerRatio',brewScale*(e.breweryPolicyManpowerRatio||0));
 const factories=active(s,'factory'),sequester=s.workshop.carbonSequestration&&running(s,'factory');
 if(s.workshop.factoryLogistics)add('craftRatio',factories*.01);
 add('energyDemand',factories*((sequester?4:2)-(ctx.maps?.buildings?.factory?.effect.energyDemand||0)));
 add('pollution',factories*((sequester?0:s.workshop.carbonSequestration?1:2)-(ctx.maps?.buildings?.factory?.effect.pollution||0)));
 if(sequester)add('pollutionCleanup',-2*factories);
 if(s.workshop.pumpjack){if(running(s,'oilWell')){add('energyDemand',active(s,'oilWell'));add('pollution',active(s,'oilWell'));}else add('oilWellRatio',-.45);}
 const accelerators=built(s,'accelerator');
 add('scienceMax',accelerators*(e.acceleratorScienceCapacity||0));
 if(s.workshop.energyRifts){const scale=accelerators*(1+(e.acceleratorRatio||0));for(const [resource,value]of Object.entries({honey:30000,wood:20000,minerals:25000,coal:2500,iron:7500,titanium:750,gold:250}))add(resource+'Max',scale*value);}
 add('goldMax',built(s,'mint')*100*(e.warehouseRatio||0));
 // Harbor-specific coal capacity is still subject to cargo and warehouse modifiers.
 if(e.harborCoalRatio){const shipLimit=2.25+(e.shipLimit||0)*active(s,'reactor')*(1+(e.harborLimitRatioPolicy||0));const cargo=1+limitedDR((e.harborRatioPerShip||0)*n(s.resources,'ship'),shipLimit);add('coalMax',built(s,'harbor')*100*e.harborCoalRatio*cargo*(1+(e.warehouseRatio||0)));}
 const cores=active(s,'aiCore');add('energyDemand',aiPower(cores));add('aiLevel',aiLevel(s));
 // The thorium energy bonus is conditional on the automation being enabled and supplied.
 if(s.workshop.thoriumReactors&&(!running(s,'reactor')||n(s.resources,'thorium')<=0))add('reactorEnergyRatio',-.25);
 return d;
}
function addRate(p,id,value,post=false){p.gross[id]=(p.gross[id]||0)+value;p.net[id]=(p.net[id]||0)+value;if(post)p.postMultiplierGross[id]=(p.postMultiplierGross[id]||0)+value;}
export function extendWorkshopProduction(ctx,p){
 const s=ctx.state,e=p.effects;
 if(e.broadcastCulturePerTower)addRate(p,'culture',active(s,'amphitheatre')*e.broadcastCulturePerTower*(1+(e.cultureRatio||0))*p.globalProduction);
 const bio=e.biolabScale||0;
 if(bio){p.net.honey-=bio;addRate(p,'oil',bio*.02*(1+(e.biofuelRatio||0)),true);p.conversions.push({id:'biolab',scale:bio,total:active(s,'biolab')});}
 const brew=e.breweryScale||0;
 if(brew){const cost=brew*(1+(e.breweryConsumptionRatio||0));p.net.honey-=cost;p.net.spice-=cost*.1;p.conversions.push({id:'brewery',scale:brew,total:active(s,'brewery')});}
 if(s.workshop.steelPlants&&running(s,'calciner')){
  const furnace=p.conversions.find(c=>c.id==='calciner'),scale=furnace?.scale||0;
  let iron=scale*.15*(1+(e.calcinerRatio||0))*(e.calcinerSteelRatio||0)*(1+.05*p.paragonProduction)*(1+solarBonus(s,e))*(1+(e.magnetoRatio||0)*(1+active(s,'steamworks')*(.15+(e.steamMagnetoBonus||0))))*(1+(e.productionRatio||0));
  if(s.metaphysics.numeromancy&&s.festivalDays>0){const cycle=currentCycle(s).festivalResourceMultipliers.iron;if(cycle)iron*=cycle*(1+(e.festivalRatio||0));}
  iron*=1+(e.necrocracyRatio||0);iron*=1+(e.ironPolicyRatio||0);
  const consumed=Math.max(0,Math.min(iron,n(s.resources,'coal'),n(s.resources,'iron')));
  if(consumed){p.net.coal-=consumed;p.net.iron-=consumed;const bonus=(e.craftRatio||0)+leaderCraftBonus(s,'beam');addRate(p,'steel',consumed/100*(1+bonus*(e.calcinerSteelCraftRatio||0)+active(s,'reactor')*(e.calcinerSteelReactorBonus||0))*(1+(e.calcinerSteelRatioBonus||0)),true);}
  p.conversions.push({id:'calcinerSteel',scale:iron?consumed/iron*scale:0,total:active(s,'calciner')});
 }
 if(s.workshop.thoriumReactors&&running(s,'reactor')&&n(s.resources,'thorium')>0)p.net.thorium+=Math.max(-n(s.resources,'thorium'),active(s,'reactor')*(e.reactorThoriumPerTick||0));
 // Computing is accumulated directly by cores and never receives resource-production multipliers.
 p.net.gflops=0;p.gross.gflops=0;p.postMultiplierGross.gflops=0;
 return extendTribalProduction(ctx,p);
}
export function workshopCosts(s,def,amount,bill){
 if(def.id==='ship'&&s.workshop.satnav&&bill.starchart)bill.starchart*=1-limitedDR(.0125*space(s,'sattelite'),.75);
 return bill;
}
export function workshopCraftBonus(ctx,id,baseBonus=0){
 const s=ctx.state,e=ctx.effects();
 if(id==='blueprint')return ['library','academy','observatory','biolab'].reduce((sum,key)=>sum+built(s,key),0)*(e.cadBlueprintCraftRatio||0);
 if(id==='kerosene')return baseBonus*.75*(e.factoryRefineRatio||0)*active(s,'factory');
 return 0;
}
function automaticCraft(ctx,id,amount,p){
 const def=ctx.maps.crafts[id];if(!def||ctx.gateReason(def.gate))return 0;
 const costs=ctx.costsFor(def,amount);if(!ctx.enough(costs))return 0;
 const e=p.effects,base=(e.craftRatio||0)+(e[def.output+'CraftRatio']||0)+leaderCraftBonus(ctx.state,'beam');
 const bonus=base+workshopCraftBonus(ctx,id,base),output=amount*def.amount*(1+bonus*(1+(e[def.output+'GlobalCraftRatio']||0)));
 ctx.pay(costs);ctx.add(def.output,output,p);ctx.state.stats.totalCrafted+=amount;return amount;
}
export function onWorkshopTick(ctx,p){
 const s=ctx.state,industry=stateOf(s);p??=ctx.production();
 if(s.workshop.thoriumReactors&&n(s.resources,'thorium')<=0)s.automationDisabled.reactor=true;
 const steam=active(s,'steamworks');if(!s.workshop.factoryAutomation||!steam||industry.steamJammed)return;
 const fraction=Math.min(.9,.02*(steam+1)),orders=[];
 for(const [input,output,allowed]of [['wood','beam',true],['minerals','slab',true],['iron','plate',!!s.workshop.pneumaticPress]]){
  const cap=p.caps[input],value=n(s.resources,input),recipe=ctx.maps.crafts[output];
  if(!allowed||!recipe||!(cap>0)||value<cap*.98)continue;
  const amount=Math.max(0,Math.floor(value*fraction/(recipe.cost[input]||Infinity)));if(amount)orders.push([output,amount]);
 }
 if(!orders.length)return;
 industry.steamJammed=true;industry.lastAutomationYear=s.calendar.year;
 if(!running(s,'steamworks'))return;
 let crafts=0;for(const[id,amount]of orders)crafts+=automaticCraft(ctx,id,amount,p);
 if(crafts)ctx.log(`蒸汽工坊完成 ${crafts} 份批量加工，装置等待下一次保养。`,'industry');
}
export function onWorkshopSeason(ctx){
 const s=ctx.state,industry=stateOf(s),season=s.calendar.season;
 if(season===0||(season===2&&s.workshop.advancedAutomation))industry.steamJammed=false;
 if(season!==0||s.policies?.transkittenism)return;
 const level=aiLevel(s);if(level<15)return;
 const fraction=Math.min(1,.01*(level-14));for(const id of aiVulnerableResources)s.resources[id]=Math.max(0,n(s.resources,id)*(1-fraction));
 industry.aiApocalypseEvents++;ctx.log(`森智失控：等级 ${level} 的核心削减了 ${(fraction*100).toFixed(0)}% 常备物资。`,'warning');
}
export function actWorkshopDynamics(ctx,type,id){
 if(type!=='automation')return undefined;
 const s=ctx.state,unlock={oilWell:'pumpjack',biolab:'biofuel',factory:'carbonSequestration',calciner:'steelPlants',steamworks:'factoryAutomation',reactor:'thoriumReactors',warehouse:'freightfulExchange',ivoryTemple:'whispers'}[id];
 if(!unlock||!s.workshop[unlock]||!built(s,id)||(id==='warehouse'&&s.buildingStages?.warehouse!==1))return ctx.result(false,'这座设施尚未开放独立自动化。');
 s.automationDisabled[id]=!s.automationDisabled[id];return ctx.result(true,`${ctx.buildingDefinition?.(id)?.name||ctx.maps.buildings[id]?.name||id}自动化已${s.automationDisabled[id]?'暂停':'恢复'}。`);
}
export function workshopView(ctx){
 const s=ctx.state,industry=stateOf(s),cards=[];
 for(const [id,upgrade]of Object.entries({oilWell:'pumpjack',biolab:'biofuel',factory:'carbonSequestration',calciner:'steelPlants',steamworks:'factoryAutomation',reactor:'thoriumReactors',warehouse:'freightfulExchange',ivoryTemple:'whispers'})){
  if(!s.workshop[upgrade]||!built(s,id)||(id==='warehouse'&&s.buildingStages?.warehouse!==1))continue;
  const paused=!!s.automationDisabled[id];cards.push({id,type:'automation',name:`${paused?'开启':'暂停'}${ctx.buildingDefinition?.(id)?.name||ctx.maps.buildings[id]?.name||id}自动化`,description:id==='steamworks'&&industry.steamJammed?'本期批次已触发，等待春季保养。':'单独控制附加工序。',unlocked:true,visible:true,available:true,costs:[],reason:'',enabled:!paused});
 }
 return {cards,tribal:tribalView(s,ctx.effects()),steamJammed:industry.steamJammed,aiLevel:aiLevel(s),aiApocalypseEvents:industry.aiApocalypseEvents};
}

export function finalWorkshopProduction(ctx,p){const s=ctx.state,rate=.02*active(s,'aiCore')*(1+(p.effects.aiCoreProductivity||0)),consumed=Math.min(n(s.resources,'gflops'),.1*space(s,'entangler')*cycleMultiplier(s,'entangler','gflopsConsumption'));p.net.gflops=rate-consumed;p.gross.gflops=rate;p.net.hashrates=consumed;p.gross.hashrates=consumed;p.caps.zebras=zebraCapacity(s);return p;}

export const onWorkshopDay=onTribalDay;
export const workshopHunt=tribalHunt;
