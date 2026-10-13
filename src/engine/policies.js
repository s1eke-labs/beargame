/** Independent policy decisions, reversible preview, and arithmetic hooks. */
import {policies} from './policy-catalog.js';
import {limitedDR,triangularInverse} from './math.js';
import {activeLeader} from './leadership.js';
const definitions=Object.fromEntries(policies.map(p=>[p.id,p]));
const count=(map,id)=>map?.[id]||0;
const selected=(s,id)=>!!s.policies?.[id];
const challenge=(s,id)=>s.challenge===id||s.activeChallenges?.includes(id)||(id==='ironWill'&&s.ironWill===true);
export const policySupport={technocracy:true,transkittenism:true,sharkRelationsBotanists:true,griffinRelationsMetallurgists:true};
const pendingSystems={technocracy:'建造队列容量尚未接入',transkittenism:'人工智能与相关升级尚未全部接入',sharkRelationsBotanists:'酿造坊与生物燃料联动尚未全部接入',griffinRelationsMetallurgists:'煅烧炉自动炼钢尚未接入'};
export function validatePolicySelection(selection){
 for(const [id,value]of Object.entries(selection||{})){
  if(!definitions[id]||typeof value!=='boolean')return '路线包含未知项目或无效值';
  if(value&&definitions[id].conflicts.some(other=>selection[other]))return `路线 ${id} 与互斥路线同时存在`;
 }
 return '';
}
export function maintainPolicies(s){
 s.policies??={};s.policyLocked??={};s.policyUnlocked??={};
 if(!s.policies.scientificCommunism&&(count(s.buildings,'workshop')>1||count(s.buildings,'factory')>0))s.policyLocked.scientificCommunism=true;
 if(s.leaderId!=null&&!activeLeader(s))s.leaderId=null;
}
export function policyEffects(s){
 const e={};
 for(const p of policies)if(selected(s,p.id))for(const [key,value]of Object.entries(p.effect))e[key]=(e[key]||0)+value;
 if(selected(s,'liberty')&&challenge(s,'ironWill'))e.bears=0;
 if(selected(s,'necrocracy'))e.necrocracyRatio=.001*count(s.resources,'sorrow');
 if(selected(s,'sharkRelationsMerchants'))e.tradeRatio=(e.tradeRatio||0)+Math.min(.3,Math.round(3*(Math.log10(Math.max(count(s.stats,'totalTrades'),100))-1))/100);
 if(selected(s,'nagaRelationsArchitects')){
  const n=count(s.embassies,'nagas');e.nagaBlueprintTradeChance=Math.min(.1,n*.0025);e.blueprintCraftRatio=Math.max(0,n-40)*.02;
 }
 if(selected(s,'spiderRelationsGeologists'))for(const id of ['minerals','coal','gold'])e[id+'PolicyRatio']=(e[id+'PolicyRatio']||0)+Math.min(.15,count(s.embassies,'spiders')*.002);
 if(selected(s,'dragonRelationsAstrologers')){const year=((s.calendar.year||0)%5)+1;e.starChance=.004*year;e.starchartPolicyRatio=.03*year;}
 if(selected(s,'transkittenism'))e.aiCoreProductivity=1;
 if(selected(s,'sharkRelationsBotanists')&&challenge(s,'ironWill')){e.refinePolicyRatio=0;e.woodRatio=(e.woodRatio||0)+.25;}
 return e;
}
export function enrichPolicyEffects(s,e,catalog){
 const add=(key,value)=>{e[key]=(e[key]||0)+value;};
 if(selected(s,'fullIndustrialization'))add('craftRatio',count(s.buildings,'factory')*(s.workshop.factoryLogistics?.06:.05)*.05);
 if(selected(s,'nagaRelationsMasons'))add('slabCraftRatio',count(s.buildings,'quarry')*.025);
 // Each ziggurat receives one tenth of a current temple, including its upgrades.
 if(selected(s,'nagaRelationsCultists')){
  for(const [key,value]of Object.entries(policyTempleEffects(s)))add(key,value*.1*count(s.buildings,'ziggurat'));
 }
 if(selected(s,'lizardRelationsPriests')){
  const manuscripts=Math.floor(count(s.resources,'manuscript'));
  const templeFaith=policyTempleEffects(s).faithMax||0;
  const templeCount=count(s.buildings,'temple')+(selected(s,'nagaRelationsCultists')?.1*count(s.buildings,'ziggurat'):0);
  const chapelFaith=challenge(s,'atheism')?0:count(s.buildings,'chapel')*triangularInverse(count(s.religion,'frescoes')/1.65)*count(s.resources,'karma');
  const rawFaithCap=catalog.buildings.reduce((sum,b)=>sum+(b.id==='temple'?0:b.effect?.faithMax||0)*count(s.buildings,b.id),0)+templeCount*templeFaith+chapelFaith;
  const threshold=10000+.15*rawFaithCap,point=.01*threshold*(threshold+1);
  add('faithMax',manuscripts<=point?triangularInverse(manuscripts/.02):threshold*limitedDR(1+.021715*Math.log(manuscripts/point),10));
 }
 return e;
}
export function policyTempleEffects(s){
 const e={templePolicyCulture:.1};
 if(challenge(s,'atheism'))return e;
 const r=s.religion||{},altar=count(r,'sunAltar'),spire=count(r,'goldenSpire'),scholar=count(r,'scholasticism'),basilica=count(r,'basilica'),templars=count(r,'templars');
 e.faithMax=(100+50*altar)*(spire?1.4+.1*spire:1);
 e.templePolicyCulture+=.05*count(r,'stainedGlass')+(basilica?.15+.05*basilica:0);
 if(s.science.theology)e.templePolicyFaith=.0015;
 if(altar)e.happiness=.004+.001*altar;
 if(scholar)e.scienceMax=400+100*scholar;
 if(basilica)e.cultureMax=75+50*basilica;
 if(templars)e.manpowerMax=50+25*templars;
 return e;
}
export function policyReason(ctx,p){
 const s=ctx.state;
 if(!p)return '没有找到这条路线';
 if(p.id in policySupport&&!policySupport[p.id])return pendingSystems[p.id];
 let why=ctx.gateReason(p.gate||{});if(why)return why;
 if(p.policyAny&&!p.policyAny.some(id=>selected(s,id)))return `先选择${p.policyAny.map(id=>definitions[id]?.name||id).join('或')}`;
 if(p.relation&&count(s.embassies,p.relation.race)<p.relation.count)return `需要该商团 ${p.relation.count} 级使馆`;
 if(p.postApocalypseReward&&!s.policyUnlocked?.postApocalypseReward)return '需要在本轮完成灰烬重生试炼';
 if(p.noPacifism&&challenge(s,'pacifism'))return '友善试炼中不能选择这条路线';
 if(p.id==='scientificCommunism'&&(s.policyLocked?.scientificCommunism||count(s.buildings,'workshop')>1||count(s.buildings,'factory')))return '本轮曾有至少两座工坊或一座工厂';
 if(p.id==='theocracy'&&activeLeader(s)&&activeLeader(s).job!=='priest')return '现任领袖需要先改任祈星熊，或卸下领袖职务';
 if(p.id==='transkittenism'&&Math.round(Math.log(Math.max(1,count(s.resources,'gflops'))))>=15)return '智能等级已经达到 15，无法再选择共生路线';
 return '';
}
export function policyCost(s,p){return Object.fromEntries(Object.entries(p.cost).map(([id,value])=>[id,value*(challenge(s,'pacifism')?1.25**count(s.challengeCompletions,'pacifism'):1)]));}
function blockedReason(s,p){
 const conflict=p.conflicts.find(id=>selected(s,id));return conflict?`已选择互斥路线：${definitions[conflict].name}`:'';
}
export function policyView(ctx){
 const s=ctx.state;
 return policies.map(p=>{
  const gate=policyReason(ctx,p),owned=selected(s,p.id)?1:0,bill=policyCost(s,p);
  const reason=gate||blockedReason(s,p)||(owned?'本轮已实施':!ctx.enough(bill)?'物资不足':'');
  return {id:p.id,type:'policy',name:p.name,description:p.description,effects:p.summary,unlocked:!gate,visible:!gate||!!owned,available:!reason,reason,owned,completed:!!owned,costs:Object.entries(bill).map(([id,value])=>({id,name:ctx.resourceById[id]?.name||id,value,owned:count(s.resources,id)})),confirmationText:p.conflicts.length?`选择「${p.name}」会让本轮无法选择：${p.conflicts.map(id=>definitions[id].name).join('、')}。继续吗？`:undefined};
 });
}
export function actPolicies(ctx,type,id){
 if(type!=='policy')return undefined;
 const s=ctx.state;maintainPolicies(s);const p=definitions[id];if(!p)return ctx.result(false,'没有找到这条路线。');
 const reason=policyReason(ctx,p)||blockedReason(s,p)||(selected(s,id)?'本轮已实施这条路线':'');
 if(reason)return ctx.result(false,reason);
 const bill=policyCost(s,p);if(!ctx.enough(bill))return ctx.result(false,'物资不足。');
 ctx.pay(bill);s.policies[id]=true;
 if(id==='cryochamberExtraction'){s.usedCryochambers=(s.usedCryochambers||0)+1;s.policyUnlocked.postApocalypseReward=false;}
 return ctx.result(true,`营地开始实行「${p.name}」。`);
}
export function policyCraftCosts(s,id,bill){
 const result={...bill};if(id==='manuscript'&&selected(s,'tradition')){if('parchment'in result)result.parchment-=5;if('culture'in result)result.culture-=100;}return result;
}
export function policyTradeCosts(s,race,bill){
 const result={...bill},e=policyEffects(s);
 if('manpower'in result)result.manpower=Math.max(0,result.manpower-(e.tradeManpowerDiscount||0));
 if('gold'in result)result.gold=Math.max(0,result.gold-(e.tradeGoldDiscount||0));
 if(race==='sharks'&&selected(s,'sharkRelationsScribes'))result.iron=scribeTerms(s).iron;
 return result;
}
export function policyTradeBonuses(s,race,tradepost={tradeRatio:.015,tradepostStanding:.003}){
 const e=policyEffects(s),phantom=(e.globalRelationsBonus||0)+(race==='zebras'?(e.zebraRelationModifier||0):(e.nonZebraRelationModifier||0));
 return {tradeRatio:phantom*(tradepost.tradeRatio??.015),standing:phantom*(tradepost.tradepostStanding??tradepost.standingRatio??.003),neutralStanding:count(s.embassies,race)*(e.neutralRaceEmbassyStanding||0),blueprintChance:race==='nagas'?(e.nagaBlueprintTradeChance||0):0};
}
export function scribeTerms(s){
 const c=s.calendar,elapsed=Math.max(0,2*c.year+(c.season+c.day/100)/4-(s.timeState?.flux||0)+(s.startedWithChronospheres?4000:0));
 const raw=elapsed/8,step=raw<301?50:raw<501?100:raw<1501?250:raw<2501?500:1250;
 const iron=Math.max(125,raw<10001?step*Math.floor(raw/step):11111),scale=1+.03*count(s.religion,'blackLibrary');
 return {iron,parchment:{amount:(5+elapsed**1.25/1000)*scale,chance:Math.min(1,.4+elapsed/33333)},manuscript:{amount:(3.3+elapsed/545)*scale,chance:Math.min(1,.2+elapsed/100000)}};
}
export function policyTradeGoods(s,race,goods){
 const result=goods.map(g=>({...g,seasons:[...(g.seasons||[0,0,0,0])]}));
 if(race==='sharks'&&selected(s,'sharkRelationsScribes')){
  const terms=scribeTerms(s);
  for(const id of ['parchment','manuscript']){let good=result.find(g=>g.id===id);if(!good){good={id,width:.25,minLevel:id==='parchment'?5:10,seasons:id==='parchment'?[.15,-.35,-.05,.4]:[-.15,-.35,.35,.1]};result.push(good);}Object.assign(good,terms[id]);}
 }
 if(race==='spiders'&&selected(s,'spiderRelationsChemists')&&!result.some(g=>g.id==='kerosene'))result.push({id:'kerosene',amount:5,chance:.1,width:.1,minLevel:10,seasons:[0,0,0,0]});
 return result;
}
/** Auto-production receives the housing-sensitive rank bonus; mint has two smaller factors. */
export function policyAutoProductionBonus(ctx,p){
 const s=ctx.state,leader=activeLeader(s);if(!selected(s,'authocracy')||!leader)return 0;
 let housingTypes=0;
 for(const id of ['hut','logHouse','mansion']){
  const definition=ctx.maps.buildings[id];if(!definition)continue;
  const prices=ctx.costsFor(definition);
  if(Object.entries(prices).every(([resource,amount])=>p.caps[resource]===null||amount<=p.caps[resource]))housingTypes++;
 }
 return .004*housingTypes*leader.rank;
}
export function extendPolicyProduction(ctx,p){
 const s=ctx.state,e=p.effects;
 // Manuscript storage is added in core before this final multiplier pass.
 p.caps.science*=1+(e.policyScienceCap||0);p.caps.culture*=1+(e.policyCultureCap||0);
 const luxury=(1+(e.luxuryDemandRatio||0))*(1+(s.festivalDays>0?(e.festivalLuxuryConsumptionRatio||0):0))*(1-limitedDR(e.luxuryDemandReduction||0));
 const consumption={honey:p.demand,culture:p.ambassadors?.culture||0,furs:s.bears.length*.01*luxury,ivory:s.bears.length*.007*luxury,spice:s.bears.length*.001*luxury+(p.ambassadors?.spice||0)};
 for(const id of Object.keys(p.net)){
  const ratio=(1+(e[id+'PolicyRatio']||0))*(1+(e.necrocracyRatio||0));
  // Household consumption is outside policy multipliers; industrial consumption is inside.
  p.net[id]=(p.net[id]+(consumption[id]||0))*ratio-(consumption[id]||0);
  p.gross[id]*=ratio;
 }
 return p;
}
