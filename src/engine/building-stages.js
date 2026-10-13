/** Original replacement-building implementation. Numeric basis: facts 02 and 10. */
const count=(s,id)=>s.buildings?.[id]||0;
const active=(s,id)=>s.disabled?.[id]?0:Math.min(count(s,id),s.activeBuildings?.[id]??count(s,id));
const stage=(s,id)=>s.buildingStages?.[id]||0;
const stageDefinitions={
 pasture:{name:'花原太阳能板',gate:'ecology',cost:{titanium:250},ratio:1.15,effect:{energySupply:2},description:'把花原改作太阳能场。发电量随季节变化，不再节省口粮。'},
 aqueduct:{name:'林泉水电站',gate:'robotics',cost:{titanium:2500,concrete:100,gear:5},ratio:1.15,effect:{energySupply:5},description:'用水轮提供清洁能源，不再提高蜂蜜产量。'},
 library:{name:'林间数据馆',gate:'electronics',cost:{steel:100,concrete:10,microchip:5},ratio:1.15,effect:{scienceRatio:.1,scienceMax:750,scienceCompendiaCeiling:1000,cultureMax:250,energyDemand:2},description:'用电力保存知识；每座增加典籍可提供的知识容量上限。'},
 amphitheatre:{name:'山谷广播塔',gate:'electronics',cost:{iron:1250,titanium:75},ratio:1.18,effect:{unhappinessReduction:.75,culture:1,cultureMax:300},description:'把故事广播到山谷。富余电力和通讯卫星会改善文化产出与容量。'},
 warehouse:{name:'林星港',gate:'advExogeology',cost:{titanium:10000,eludium:500,kerosene:1000,blueprint:500,starchart:100000},ratio:1.15,priceRatios:{starchart:1.35},effect:{moonBaseStorageBonus:.0085,planetCrackerStorageBonus:.0085,cryostationStorageBonus:.0085,energyDemand:5},toggleable:true,description:'扩展月面与远星设施的仓储。第十一座起，每座新星港用电再增加 1。'}
};
export const stageBuildingIds=Object.keys(stageDefinitions);
const building=(id,name,cost,ratio,gate,effect,description,extra={})=>({id,name,type:'build',cost,ratio,gate,effect,description,...extra});
export const additionalBuildings=[
 building('brewery','蜜酿坊',{wood:1000,culture:750,spice:5,parchment:375},1.5,{science:'drama'},{},'持续消耗蜂蜜与香料，让节庆更热闹、旅熊更愿意留下。',{toggleable:true}),
 building('zebraOutpost','条纹前哨',{bloodstone:1},1.35,{science:'archery'},{manpowerMax:5,hunterRatio:.05},'为条纹猎手准备补给；条纹传承开启后增加前哨准备。'),
 building('zebraWorkshop','条纹工房',{bloodstone:5},1.15,{science:'archery'},{manpowerMax:25},'条纹工匠交流技艺，开启专门的传承研究。'),
 building('zebraForge','条纹熔炉',{bloodstone:50},1.15,{science:'archery'},{manpowerMax:50,tMythrilCraftRatio:.01},'冶炼珍稀矿物，开启血石与秘银配方。'),
 building('stasisPod','条纹休眠舱',{tMythril:1,timeCrystal:2,void:100},1.25,{science:'chronophysics'},{zebrasMax:1},'增加一名条纹猎手的驻留容量；容量较小时以星合金制作。'),
 building('ivoryTemple','白枝研磨堂',{tMythril:1,ivory:100},1.15,{}, {manpowerMax:10},'磨制象牙取得矿物；密语工艺可额外提炼少量秘银。',{toggleable:true,conversion:{input:{ivory:100},output:{minerals:1},global:false}})
];
export function resolvedBuilding(state,baseDef){
 if(!baseDef)return baseDef;
 const replacement=stage(state,baseDef.id)?stageDefinitions[baseDef.id]:null;
 let def=replacement?{...baseDef,...replacement,gate:{science:replacement.gate},stage:1,effect:{...replacement.effect}}:{...baseDef,stage:0,effect:{...baseDef.effect}};
 if(def.id==='stasisPod'&&(1+(state.zebraKarma||0)+count(state,'stasisPod'))<10)def={...def,cost:{eludium:100,timeCrystal:2,void:100}};
 if(def.id==='ivoryTemple'&&state.workshop?.whispers&&!state.automationDisabled?.ivoryTemple)def.conversion={input:{ivory:200,titanium:2,alicorn:.00002},output:{minerals:2,tMythril:.00005},global:false};
 return def;
}
export function solarSupply(season,ratio=0,seasonRatio=0,summerRatio=0){
 let supply=2*(1+ratio);
 if(season===1)supply*=4/3*(1+summerRatio);
 if(season===3)supply*=.75;
 if((season===3&&seasonRatio===1)||(season!==1&&seasonRatio===2))supply*=1+.15*seasonRatio;
 return supply;
}
export function spaceportDemand(n){return n<=10?5*n:.5*n*(n-9)+45;}
export function broadcastMultiplier(supply,demand,satellites=0,ratio=0){
 const power=demand>0?Math.min(1.75,Math.max(1,supply/demand)):supply>0?1.75:1;
 return {culture:Math.floor(power*1000)/1000*(1+satellites*ratio),capacity:Math.floor(300*power*1000)/1000*(1+satellites*ratio)};
}
// These are changes relative to the resolved catalog's baseline effects.
export function stageEffects(ctx,e={}){
 const s=ctx.state,d={};const add=(k,v)=>d[k]=(d[k]||0)+v;
 const winter=ctx.isChallenge?.('winterIsComing')||s.challenge==='winterIsComing'||s.activeChallenges?.includes('winterIsComing');
 if(stage(s,'pasture')){
  const summer=winter?0:(ctx.limitedDR?.(.05*(s.challengeCompletions?.winterIsComing||0),2)||0);
  const power=solarSupply(winter?3:s.calendar.season,e.solarFarmRatio||0,e.solarFarmSeasonRatio||0,summer)*active(s,'pasture');
  add('energySupply',power-2*active(s,'pasture'));add('cleanEnergy',power);
 }
 if(stage(s,'aqueduct')){const power=5*(1+(e.hydroPlantRatio||0))*active(s,'aqueduct');add('energySupply',power-5*active(s,'aqueduct'));add('cleanEnergy',power);}
 const libraries=count(s,'library'),observatories=active(s,'observatory'),data=stage(s,'library');
 const uplink=data&&s.workshop.uplink?1+count(s,'biolab')*(e.uplinkDCRatio||0):1;
 const learning=data&&s.workshop.machineLearning?1+active(s,'aiCore')*(e.dataCenterAIRatio||0)*(1+(e.aiCoreUpgradeBonus||0)):1;
 const factor=uplink*learning;
 add('scienceMax',libraries*(data?750:250)*((1+observatories*(e.libraryRatio||0))*factor-1));
 if(data){add('cultureMax',libraries*250*(factor-1));add('scienceCompendiaCeiling',libraries*1000*(factor-1));if(s.workshop.cryocomputing)add('energyDemand',-active(s,'library'));}
 if(stage(s,'warehouse')){
  const ports=active(s,'warehouse');add('energyDemand',spaceportDemand(ports)-5*ports);
  if(s.workshop.freightfulExchange&&!s.automationDisabled.warehouse)add('tradeVolume',ports*(s.workshop.transportSuperposition?1:.5));
 }
 return d;
}
export function finalStageEffects(ctx,e={}){
 const s=ctx.state;if(!stage(s,'amphitheatre'))return {};
 const satellite=s.disabled.sattelite?0:(s.space.sattelite||0),bonus=broadcastMultiplier(e.energySupply||0,e.energyDemand||0,satellite,e.broadcastTowerRatio||0);
 return {broadcastCulturePerTower:bonus.culture-1,cultureMax:count(s,'amphitheatre')*(bonus.capacity-300)};
}
export function stageView(ctx){
 const {state}=ctx;
 return stageBuildingIds.map(id=>{
  const current=stage(state,id),target=current?0:1,base=ctx.maps.buildings[id],next=target?stageDefinitions[id]:base;
  const reason=target&&!state.science[next.gate]?`先完成${ctx.maps.science[next.gate]?.name||next.gate}`:'';
  const name=next.name,owned=count(state,id),refund=(ctx.sellRefundRatio?.()??.5)*100;
  return {id,type:'stage',name:`改建为${name}`,description:`先拆售现有 ${owned} 座，按当前造价返还 ${refund}% 可退物资。改建后数量为 0，需要重新购买。`,confirmationText:`拆售全部 ${owned} 座${(ctx.buildingDefinition?.(id)||base).name}并改建为${name}？新建筑需要另行付费建造。`,unlocked:current>0||!!state.science[stageDefinitions[id].gate],visible:current>0||!!state.science[stageDefinitions[id].gate],available:!reason,reason,costs:[],owned:current,targetStage:target,effects:'清空原有建筑数量，返还部分物资，再切换建筑方案。'};
 });
}
export function actBuildingStages(ctx,type,id){
 if(type!=='stage')return undefined;
 const spec=stageDefinitions[id];if(!spec)return ctx.result(false,'这座建筑没有其他方案。');
 const s=ctx.state,target=stage(s,id)?0:1;
 if(target&&!s.science[spec.gate])return ctx.result(false,'先完成对应研究。');
 const def=ctx.buildingDefinition?.(id)||resolvedBuilding(s,ctx.maps.buildings[id]);
 const refundRatio=ctx.sellRefundRatio?.()??.5,refunds={};
 // Sum a fresh batch at count zero: this is the reverse of buying every old unit.
 // Capacities are sampled before the sale, as the sale transaction is atomic.
 const before=count(s,id),caps=ctx.production().caps;
 s.buildings[id]=0;s.activeBuildings[id]=0;
 const bill=ctx.costsFor(def,before);
 for(const [resource,value]of Object.entries(bill)){
  if(['oil','kerosene','thorium'].includes(resource))continue;
  const previous=s.resources[resource]||0,cap=caps[resource];
  const total=Math.min(1e100,previous+value*refundRatio);
  s.resources[resource]=Math.max(0,cap===null?total:Math.min(Math.max(cap,previous),total));
  refunds[resource]=s.resources[resource]-previous;
 }
 s.buildingStages??={};s.buildingStages[id]=target;s.buildings[id]=0;s.activeBuildings[id]=0;
 s.disabled[id]=false;delete s.automationDisabled[id];
 return ctx.result(true,`已切换为${target?spec.name:ctx.maps.buildings[id].name}。请重新建造。`,{sold:before,refunds,stage:target});
}
