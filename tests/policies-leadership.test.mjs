import test from 'node:test';
import assert from 'node:assert/strict';
import {policies,delegatedPolicies,obsoletePolicies} from '../src/engine/policy-catalog.js';
import {policyEffects,policySupport,policyTempleEffects,policyCost,policyReason,actPolicies,validatePolicySelection,maintainPolicies,policyTradeCosts,policyCraftCosts,policyTradeBonuses,policyTradeGoods,scribeTerms,policyAutoProductionBonus,extendPolicyProduction,enrichPolicyEffects} from '../src/engine/policies.js';
import {leaderTraits,rankExperience,rankGold,activeLeader,leaderJobMultiplier,workerMultiplierContext,workerProductionMultiplier,leaderCraftBonus,leadershipEffects,leadershipCostMultiplier,promotionCost,actLeadership,leadershipView} from '../src/engine/leadership.js';
import {createState,parseSave,serialize} from '../src/engine/save.js';
import {catalog} from '../src/engine/catalog.js';
const close=(a,b)=>assert.ok(Math.abs(a-b)<1e-8,`${a} != ${b}`);
function fixture(){const state=createState(7,0);state.policies={};state.policyLocked={};state.policyUnlocked={};state.embassies={};state.leaderId=null;const ctx={state,catalog,maps:{buildings:Object.fromEntries(catalog.buildings.map(x=>[x.id,x]))},resourceById:Object.fromEntries(catalog.resources.map(x=>[x.id,x])),gateReason(g){for(const key of ['science','workshop','metaphysics'])for(const id of typeof g[key]==='string'?[g[key]]:g[key]||[])if(!state[key]?.[id])return 'gate';for(const key of ['buildings','space'])for(const[id,n]of Object.entries(g[key]||{}))if((state[key]?.[id]||0)<n)return 'gate';if(g.discovery&&!state.discoveries[g.discovery])return 'gate';return '';},enough(cost){return Object.entries(cost).every(([k,v])=>(state.resources[k]||0)>=v);},pay(cost){for(const[k,v]of Object.entries(cost))state.resources[k]-=v;},result(ok,message){return{ok,message};},costsFor(d){return d.cost;}};return ctx;}
const bear=(id=1,trait='none')=>({id,name:`熊 ${id}`,trait,job:'farmer',rank:0,experience:0,skills:{}});
test('exact active catalog boundary: 61 regular policies plus three pact policies, two obsolete ideas excluded',()=>{assert.equal(policies.length,61);assert.equal(delegatedPolicies.length,3);assert.equal(new Set(policies.map(p=>p.id)).size,61);assert.deepEqual(obsoletePolicies,['spaceBasedTerraforming','clearSkies']);for(const p of policies){assert.equal(p.type,'policy');assert.ok(p.summary);assert.ok(Object.values(p.cost).every(v=>v>0));for(const other of p.conflicts)assert.ok(policies.find(p=>p.id===other).conflicts.includes(p.id),`${p.id}/${other}`);}});
test('each exclusivity group is rejected on import selection, while independent routes coexist',()=>{for(const p of policies)for(const other of p.conflicts)assert.ok(validatePolicySelection({[p.id]:true,[other]:true}));assert.equal(validatePolicySelection({tradition:true,monarchy:true,diplomacy:true,rationality:true}), '');assert.ok(validatePolicySelection({fake:true}));assert.ok(validatePolicySelection({liberty:1}));});
test('policy enactment is atomic, costs exact and conflicts block a second purchase',()=>{const c=fixture(),s=c.state;s.science.writing=true;s.resources.culture=149;assert.equal(actPolicies(c,'policy','liberty').ok,false);assert.equal(s.resources.culture,149);s.resources.culture=300;assert.equal(actPolicies(c,'policy','liberty').ok,true);assert.equal(s.resources.culture,150);assert.equal(actPolicies(c,'policy','tradition').ok,false);assert.equal(s.resources.culture,150);assert.equal(actPolicies(c,'policy','liberty').ok,false);assert.equal(actPolicies(c,'craft','x'),undefined);});
test('policy prices: science environmental paths, manpower rewards, and pacifism completion scaling',()=>{const c=fixture(),s=c.state;const by=id=>policies.find(p=>p.id===id);assert.deepEqual(policyCost(s,by('stripMining')),{science:2000});assert.deepEqual(policyCost(s,by('terraformingInsight')),{manpower:10000});s.challenge='pacifism';assert.equal(policyCost(s,by('tradition')).culture,150);s.challengeCompletions.pacifism=3;close(policyCost(s,by('tradition')).culture,150*1.25**3);});
test('political, industrial, scientific-secret, astronomy and embassy prerequisites',()=>{const c=fixture(),s=c.state,by=id=>policies.find(p=>p.id===id);assert.ok(policyReason(c,by('republic')));s.policies.liberty=true;assert.equal(policyReason(c,by('republic')),'');s.policies.republic=true;assert.ok(policyReason(c,by('communism')));s.buildings.factory=1;assert.equal(policyReason(c,by('communism')),'');maintainPolicies(s);delete s.buildings.factory;s.policies.socialism=true;assert.ok(policyReason(c,by('scientificCommunism')));s.metaphysics.diplomacy=true;s.embassies.spiders=9;assert.ok(policyReason(c,by('spiderRelationsGeologists')));s.embassies.spiders=10;assert.equal(policyReason(c,by('spiderRelationsGeologists')),'');s.policies.diplomacy=true;assert.ok(policyReason(c,by('knowledgeSharing')));s.science.astronomy=true;assert.equal(policyReason(c,by('knowledgeSharing')),'');});
test('late policy leader restriction permits no leader, but excludes a non-priest incumbent',()=>{const c=fixture(),s=c.state;s.space.duneMission=1;const p=policies.find(p=>p.id==='theocracy');assert.equal(policyReason(c,p),'');s.bears=[bear()];s.leaderId=1;assert.ok(policyReason(c,p));s.bears[0].job='priest';assert.equal(policyReason(c,p),'');});
test('dynamic aggregate policy effects use numeric embassy/cycle/trade rules',()=>{const {state:s}=fixture();s.policies={communism:true,spiderRelationsGeologists:true,dragonRelationsAstrologers:true,nagaRelationsArchitects:true,sharkRelationsMerchants:true,necrocracy:true};s.embassies={spiders:100,nagas:45};s.calendar.year=14;s.stats.totalTrades=1000;s.resources.sorrow=80;const e=policyEffects(s);close(e.coalPolicyRatio,.4);close(e.goldPolicyRatio,.15);close(e.starChance,.02);close(e.starchartPolicyRatio,.15);close(e.nagaBlueprintTradeChance,.1);close(e.blueprintCraftRatio,.1);close(e.tradeRatio,.06);close(e.necrocracyRatio,.08);});
test('tradition, diplomacy and trade counterparts modify correct prices and goods',()=>{const {state:s}=fixture();s.policies={tradition:true,diplomacy:true,dragonRelationsDynamicists:true,liberalism:true,nagaRelationsArchitects:true,spiderRelationsChemists:true};s.embassies.nagas=20;assert.deepEqual(policyCraftCosts(s,'manuscript',{parchment:25,culture:400}),{parchment:20,culture:300});assert.deepEqual(policyTradeCosts(s,'lizards',{manpower:50,gold:15,minerals:1000}),{manpower:40,gold:15,minerals:1000});close(policyTradeBonuses(s,'nagas').tradeRatio,.15);close(policyTradeBonuses(s,'nagas').standing,.03);close(policyTradeBonuses(s,'nagas').blueprintChance,.05);const g=policyTradeGoods(s,'spiders',[])[0];assert.deepEqual(g,{id:'kerosene',amount:5,chance:.1,width:.1,minLevel:10,seasons:[0,0,0,0]});});
test('scribe scaling uses calendar year plus true year and chronosphere carry-in',()=>{const {state:s}=fixture();s.policies.sharkRelationsScribes=true;s.calendar.year=1000;s.calendar.season=2;s.calendar.day=0;s.timeState.flux=100;s.startedWithChronospheres=true;s.religion.blackLibrary=2;const age=5900.5,t=scribeTerms(s);close(t.parchment.amount,(5+age**1.25/1000)*1.06);close(t.manuscript.chance,.2+age/100000);assert.equal(t.iron,500);assert.equal(policyTradeCosts(s,'sharks',{manpower:50,gold:15,iron:100}).iron,500);});
test('resource policy final stage scales industrial flows but leaves household demand outside',()=>{const c=fixture(),s=c.state;s.bears=[bear()];s.policies={clearCutting:true,necrocracy:true};s.resources.sorrow=100;const e=policyEffects(s),p={effects:e,caps:{science:100,culture:100},gross:{wood:10,honey:2,furs:1},net:{wood:8,honey:1.15,furs:.99},demand:.85};extendPolicyProduction(c,p);close(p.net.wood,8*1.3*1.1);close(p.net.honey,2*1.1-.85);close(p.net.furs,1*1.1-.01);});
test('autocracy conversion bonus counts capacity-affordable housing types and leader rank',()=>{const c=fixture(),s=c.state;s.policies.authocracy=true;s.bears=[bear()];s.leaderId=1;s.bears[0].rank=5;const caps=Object.fromEntries(catalog.resources.map(x=>[x.id,1e20]));close(policyAutoProductionBonus(c,{caps}),.06);caps.wood=0;assert.ok(policyAutoProductionBonus(c,{caps})<.06);});
test('leader promotions spend both geometric XP and arithmetic gold; failures leave both unchanged',()=>{const c=fixture(),s=c.state;s.workshop.register=true;s.bears=[bear()];const b=s.bears[0];b.experience=499;s.resources.gold=100;assert.equal(actLeadership(c,'promote','1',1).ok,false);assert.equal(b.experience,499);b.experience=500;assert.equal(actLeadership(c,'promote','1',1).ok,true);assert.equal(b.rank,1);assert.equal(b.experience,0);assert.equal(s.resources.gold,75);close(rankExperience(2),1531.25);assert.equal(rankGold(2),75);const cost=promotionCost({...b,rank:0},3);close(cost.experience,500+875+1531.25);assert.equal(cost.gold,150);});
test('multi-rank promotion falls back to one rank when target cannot be reached',()=>{const c=fixture(),s=c.state;s.workshop.register=true;s.bears=[bear()];s.bears[0].experience=1400;s.resources.gold=100;assert.equal(actLeadership(c,'promote','1',3).ok,true);assert.equal(s.bears[0].rank,1);assert.equal(s.resources.gold,75);});
test('leaders require register, anarchy disables bonuses, and theocracy demotes incompatible jobs',()=>{const c=fixture(),s=c.state;s.bears=[bear()];assert.equal(actLeadership(c,'leader','1').ok,false);s.workshop.register=true;assert.equal(actLeadership(c,'leader','1').ok,true);assert.equal(activeLeader(s).id,1);s.policies.theocracy=true;assert.equal(activeLeader(s),null);maintainPolicies(s);assert.equal(s.leaderId,null);s.bears[0].job='priest';assert.equal(actLeadership(c,'leader','1').ok,true);s.challenge='anarchy';assert.equal(actLeadership(c,'promote','1').ok,false);assert.equal(activeLeader(s),null);});
test('leader rank multiplier and republic shared multiplier use exact formulas',()=>{const {state:s}=fixture();s.bears=[bear(1),bear(2)];s.bears[0].rank=6;s.leaderId=1;close(leaderJobMultiplier(s,0),1);close(workerProductionMultiplier(s,s.bears[0]),5);close(workerProductionMultiplier(s,s.bears[1]),1);s.policies.republic=true;close(workerProductionMultiplier(s,s.bears[1]),1.04);s.policies={authocracy:true};close(workerProductionMultiplier(s,s.bears[0]),10);close(leaderJobMultiplier(s,0),2);});
test('all seven substantive leader traits use burned paragon and monarchy coefficients',()=>{const c=fixture(),s=c.state;s.bears=[bear()];s.leaderId=1;const b=s.bears[0];assert.equal(leaderTraits.length,8);s.resources.burnedParagon=500;s.policies.monarchy=true;const scale=2*1.95;b.trait='engineer';close(leaderCraftBonus(s,'beam'),.05*scale);close(leaderCraftBonus(s,'wood'),0);b.trait='metallurgist';close(leaderCraftBonus(s,'steel'),.1*scale);close(leaderCraftBonus(s,'beam'),0);b.trait='chemist';close(leaderCraftBonus(s,'eludium'),.075*scale);b.trait='manager';close(leadershipEffects(s).hunterRatio,.5*scale);b.trait='merchant';close(leadershipEffects(s).tradeRatio,.03*scale);b.trait='scientist';close(leadershipCostMultiplier(s,'science','research'),1-.05*scale);assert.equal(leadershipCostMultiplier(s,'science','space'),1);b.trait='wise';close(leadershipCostMultiplier(s,'gold','religion'),1-.11*1.95);assert.equal(leadershipCostMultiplier(s,'gold','research'),1);});
test('leadership roster produces functional action cards with explicit reasons',()=>{const c=fixture();c.state.workshop.register=true;c.state.bears=[bear()];const v=leadershipView(c);assert.equal(v.cards.length,2);assert.equal(v.cards[0].type,'leader');assert.equal(v.cards[0].available,true);assert.equal(v.cards[1].type,'promote');assert.equal(v.cards[1].available,false);assert.equal(v.cards[1].costs[0].value,25);});

// Factual fixtures authored for this implementation: science.js policy prices and unlock graph.
test('every active policy has its independently checked base price',()=>{
 const groups=[
  [150,'liberty tradition'],[1500,'monarchy authocracy republic'],[7500,'socialism'],[8500,'scientificCommunism'],
  [15000,'liberalism communism fascism'],[150000,'technocracy theocracy expansionism'],[1500000,'transkittenism necrocracy radicalXenophobia'],
  [1600,'diplomacy isolationism'],[5000,'zebraRelationsAppeasement zebraRelationsBellicosity'],[4000,'knowledgeSharing culturalExchange bigStickPolicy cityOnAHill'],
  [10000,'outerSpaceTreaty militarizeSpace sustainability fullIndustrialization conservation openWoodlands'],
  [2100,'lizardRelationsEcologists lizardRelationsPriests lizardRelationsDiplomats'],[2200,'sharkRelationsScribes sharkRelationsMerchants sharkRelationsBotanists'],
  [16000,'griffinRelationsMetallurgists griffinRelationsScouts griffinRelationsMachinists'],[8000,'nagaRelationsMasons nagaRelationsCultists nagaRelationsArchitects'],
  [20000,'spiderRelationsGeologists spiderRelationsChemists spiderRelationsPaleontologists'],[30000,'dragonRelationsPhysicists dragonRelationsAstrologers dragonRelationsDynamicists'],
  [2500,'stoicism epicurianism'],[3500,'carnivale extravagance rationing frugality'],[3000,'rationality mysticism'],[2000,'environmentalism']
 ];
 const checked=new Set();
 for(const [culture,ids] of groups)for(const id of ids.split(' ')){assert.deepEqual(policies.find(p=>p.id===id).cost,{culture},id);checked.add(id);}
 for(const id of ['stripMining','clearCutting']){assert.deepEqual(policies.find(p=>p.id===id).cost,{science:2000});checked.add(id);}
 for(const id of ['cryochamberExtraction','terraformingInsight']){assert.deepEqual(policies.find(p=>p.id===id).cost,{manpower:10000});checked.add(id);}
 for(const id of delegatedPolicies){const p=catalog.faith.find(p=>p.id===id);assert.deepEqual(p.cost,{necrocorn:1});assert.equal(p.family,'pactPolicy');assert.equal(p.oneTime,true);assert.deepEqual(p.gate,{faith:{mausoleum:1,marker:1}});checked.add(id);}
 assert.equal(checked.size,64);
});
test('every regular policy enforces its declared prerequisites and can enact once or reports its explicit system gate',()=>{
 for(const p of policies){
  const c=fixture(),s=c.state;
  for(const id of Object.keys(s.resources))s.resources[id]=1e8;
  s.resources.gflops=0;s.buildings.workshop=1;
  for(const key of ['science','workshop','metaphysics'])for(const id of typeof p.gate?.[key]==='string'?[p.gate[key]]:p.gate?.[key]||[])s[key][id]=true;
  for(const key of ['buildings','space'])for(const [id,n]of Object.entries(p.gate?.[key]||{}))s[key][id]=n;
  if(p.gate?.discovery)s.discoveries[p.gate.discovery]=true;
  if(p.policyAny)s.policies[p.policyAny[0]]=true;
  if(p.relation)s.embassies[p.relation.race]=p.relation.count;
  if(p.postApocalypseReward)s.policyUnlocked.postApocalypseReward=true;
  if(p.id in policySupport&&!policySupport[p.id]){assert.match(policyReason(c,p),/尚未/);assert.equal(actPolicies(c,'policy',p.id).ok,false);continue;}
  assert.equal(policyReason(c,p),'',p.id);
  const before={...s.resources};assert.equal(actPolicies(c,'policy',p.id).ok,true,p.id);
  assert.equal(s.policies[p.id],true,p.id);
  for(const [id,n]of Object.entries(p.cost))close(s.resources[id],before[id]-n);
  const after={...s.resources};assert.equal(actPolicies(c,'policy',p.id).ok,false,p.id);assert.deepEqual(s.resources,after);
 }
});
test('every embassy family requires its exact threshold and diplomacy wisdom',()=>{
 for(const p of policies.filter(p=>p.relation)){
  const c=fixture(),s=c.state;
  if(p.id in policySupport&&!policySupport[p.id])continue;
  s.embassies[p.relation.race]=p.relation.count;assert.ok(policyReason(c,p));
  s.metaphysics.diplomacy=true;assert.equal(policyReason(c,p),'',p.id);
  s.embassies[p.relation.race]--;assert.ok(policyReason(c,p),p.id);
 }
});
test('simultaneous challenges affect policy pricing, policy restrictions and leader eligibility',()=>{
 const c=fixture(),s=c.state;s.activeChallenges=['pacifism','anarchy'];s.challengeCompletions.pacifism=2;
 close(policyCost(s,policies.find(p=>p.id==='tradition')).culture,234.375);
 s.policies.isolationism=true;s.science.astronomy=true;assert.ok(policyReason(c,policies.find(p=>p.id==='bigStickPolicy')));
 s.bears=[bear()];s.workshop.register=true;s.leaderId=1;
 assert.equal(activeLeader(s),null);assert.equal(actLeadership(c,'leader','1').ok,false);assert.equal(actLeadership(c,'promote','1').ok,false);
});
test('Iron Will liberty grants no housing and botanists change refinement into wood production',()=>{
 const {state:s}=fixture();s.policies={liberty:true,sharkRelationsBotanists:true};s.ironWill=true;
 let e=policyEffects(s);assert.equal(e.bears,0);assert.equal(e.refinePolicyRatio,0);close(e.woodRatio,.25);
 s.ironWill=false;e=policyEffects(s);assert.equal(e.bears,1);close(e.refinePolicyRatio,.25);assert.equal(e.woodRatio,undefined);
});
test('naga cultists copy upgraded temple effects even with zero temples and obey atheism',()=>{
 const {state:s}=fixture();s.policies.nagaRelationsCultists=true;s.buildings.ziggurat=10;
 s.science.theology=true;s.religion={stainedGlass:2,sunAltar:2,goldenSpire:2,scholasticism:2,basilica:2,templars:2};
 const e=enrichPolicyEffects(s,{},catalog);
 close(e.templePolicyCulture,.45);close(e.templePolicyFaith,.0015);close(e.faithMax,320);close(e.happiness,.006);assert.equal(e.scienceMax,600);assert.equal(e.cultureMax,175);assert.equal(e.manpowerMax,100);
 s.activeChallenges=['atheism'];assert.deepEqual(policyTempleEffects(s),{templePolicyCulture:.1});
 const a=enrichPolicyEffects(s,{},catalog);close(a.templePolicyCulture,.1);assert.equal(a.faithMax,undefined);
});
test('manuscript faith cap uses upgraded temple storage before its logarithmic threshold',()=>{
 const {state:s}=fixture();s.policies.lizardRelationsPriests=true;s.resources.manuscript=1e12;s.buildings.temple=100;s.religion={sunAltar:2,goldenSpire:2};
 const soft=10000+32000*.15,threshold=.01*soft*(soft+1),ratio=1+.021715*Math.log(1e12/threshold);
 close(enrichPolicyEffects(s,{},catalog).faithMax,soft*ratio);
 s.resources.manuscript=10;close(enrichPolicyEffects(s,{},catalog).faithMax,(Math.sqrt(4001)-1)/2);
});
test('all eight traits survive saves and chemical bonuses include plastic and microchips',()=>{
 const c=fixture(),s=c.state;s.bears=leaderTraits.map((t,i)=>({...bear(i+1,t.id),rank:i,experience:500+i,skills:{farmer:123+i}}));s.nextBearId=9;s.leaderId=7;
 s.policies={tradition:true,monarchy:true};s.policyLocked.scientificCommunism=true;s.policyUnlocked.postApocalypseReward=true;
 const restored=parseSave(serialize(s,100),100);assert.deepEqual(restored.bears,s.bears);assert.equal(restored.leaderId,7);assert.deepEqual(restored.policies,s.policies);assert.deepEqual(restored.policyLocked,s.policyLocked);assert.deepEqual(restored.policyUnlocked,s.policyUnlocked);
 s.leaderId=7;close(leaderCraftBonus(s,'plastic'),.075*1.95);close(leaderCraftBonus(s,'microchip'),.075*1.95);
});
test('save validation rejects conflicting policies, invalid leader IDs and trait values',()=>{
 const {state:s}=fixture();s.bears=[bear()];s.nextBearId=2;s.leaderId=1;
 s.policies={liberty:true,tradition:true};assert.throws(()=>parseSave(serialize(s,0),0),/互斥/);
 s.policies={liberty:true};s.leaderId=2;assert.throws(()=>parseSave(serialize(s,0),0),/领队/);
 s.leaderId=1;s.bears[0].trait='madeUp';assert.throws(()=>parseSave(serialize(s,0),0),/性格/);
});
test('promotion preserves job skill, supports paid multi-rank jumps and never permits an overflow cost',()=>{
 const c=fixture(),s=c.state;s.workshop.register=true;s.resources.gold=1000;s.bears=[bear()];const b=s.bears[0];b.experience=4000;b.skills.farmer=20001;
 assert.equal(actLeadership(c,'promote','1',3).ok,true);assert.equal(b.rank,3);close(b.experience,1093.75);assert.equal(s.resources.gold,850);assert.equal(b.skills.farmer,20001);
 b.rank=9999;b.experience=1e100;const before=JSON.stringify(s);assert.equal(actLeadership(c,'promote','1').ok,false);assert.equal(JSON.stringify(s),before);
});

test('leadership pagination bounds rendering without limiting whom the player can appoint',()=>{
 const c=fixture(),s=c.state;s.workshop.register=true;s.bears=Array.from({length:1000},(_,i)=>bear(i+1));s.nextBearId=1001;
 let v=leadershipView(c);assert.equal(v.total,1000);assert.equal(v.pageSize,25);assert.equal(v.pages,40);assert.equal(v.cards.length,50);assert.equal(v.cards[0].id,'1');
 v=leadershipView(c,{page:39});assert.equal(v.cards[0].id,'976');assert.equal(v.cards.at(-1).id,'1000');
 assert.equal(actLeadership(c,'leader','1000').ok,true);assert.equal(leadershipView(c).leaderId,1000);
 v=leadershipView(c,{page:999,pageSize:1000});assert.equal(v.pageSize,50);assert.equal(v.page,19);assert.equal(v.cards.length,100);
 v=leadershipView(c,{filter:'熊 1000'});assert.equal(v.filteredTotal,1);assert.equal(v.total,1000);assert.equal(v.cards.length,2);assert.equal(v.cards[0].id,'1000');
 v=leadershipView(c,{filter:'no matching bear',page:-4});assert.equal(v.filteredTotal,0);assert.equal(v.page,0);assert.equal(v.pages,1);assert.deepEqual(v.cards,[]);
});
test('prepared worker context produces exactly the same leader and republic multipliers',()=>{
 const {state:s}=fixture();s.bears=[bear(1),bear(2)];s.leaderId=1;s.bears[0].rank=6;s.policies.republic=true;
 const prepared=workerMultiplierContext(s);assert.deepEqual(prepared,{leaderId:1,leaderMultiplier:5,sharedMultiplier:1.04});
 for(const b of s.bears)close(workerProductionMultiplier(s,b,prepared),workerProductionMultiplier(s,b));
 s.activeChallenges=['anarchy'];assert.deepEqual(workerMultiplierContext(s),{leaderId:null,leaderMultiplier:1,sharedMultiplier:1});
});
