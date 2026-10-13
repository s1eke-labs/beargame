import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame,catalog} from '../src/engine/index.js';
import {createState,serialize,parseSave} from '../src/engine/save.js';
import {solarSupply,spaceportDemand,broadcastMultiplier,resolvedBuilding} from '../src/engine/building-stages.js';
import {aiLevel,aiPower,aiVulnerableResources,workshopSellReason,workshopEffects,extendWorkshopProduction,onWorkshopSeason} from '../src/engine/workshop-dynamics.js';
const close=(actual,expected,epsilon=1e-8)=>assert.ok(Math.abs(actual-expected)<epsilon,`${actual} != ${expected}`);
const fixture=fn=>{const s=createState(49,0);s.ironWill=false;fn?.(s);return createGame({save:serialize(s,0),now:0,storage:null});};
const resource=(g,id)=>g.snapshot().resources.find(r=>r.id===id);
const raw=g=>JSON.parse(g.export());
const rate=(g,id)=>resource(g,id).rate/5;
test('all five replacements sell old units and require paid rebuilding',()=>{
 for(const id of ['pasture','aqueduct','library','amphitheatre','warehouse']){
  const gates={pasture:'ecology',aqueduct:'robotics',library:'electronics',amphitheatre:'electronics',warehouse:'advExogeology'};
  const g=fixture(s=>{s.buildings[id]=3;s.science[gates[id]]=true;});
  assert.equal(g.act('stage',id).ok,true);assert.equal(raw(g).buildings[id],0);assert.equal(raw(g).buildingStages[id],1);
  const d=resolvedBuilding(raw(g),catalog.buildings.find(b=>b.id===id));assert.equal(g.snapshot().buildings.find(b=>b.id===id).name,d.name);
  assert.equal(g.act('build',id).ok,false);assert.equal(g.act('stage',id).ok,true);assert.equal(raw(g).buildingStages[id],0);
 }
});
test('stage sales use geometric refund, preserve pre-sale cap, and do not refund fuel',()=>{
 const g=fixture(s=>{s.buildings.library=3;s.science.electronics=true;});g.act('stage','library');close(raw(g).resources.wood,.5*25*(1+1.15+1.15**2));
 const h=fixture(s=>{s.buildings.warehouse=2;s.buildingStages.warehouse=1;s.science.advExogeology=true;});h.act('stage','warehouse');assert.equal(raw(h).resources.kerosene,0);close(raw(h).resources.starchart,.5*100000*(1+1.15*1.35));
});
test('buildings388–477: solar seasons, technology and winter challenge; hydro turbines',()=>{
 close(solarSupply(0),2);close(solarSupply(1),8/3);close(solarSupply(3),1.5);close(solarSupply(3,.5,1),2.5875);close(solarSupply(0,.5,2),3.9);
 const g=fixture(s=>{s.buildings.pasture=2;s.buildingStages.pasture=1;s.calendar.season=1;s.workshop.photovoltaic=true;s.workshop.qdot=true;s.workshop.thinFilm=true;});close(g.snapshot().energy.supply,8);
 const h=fixture(s=>{s.buildings.aqueduct=2;s.buildingStages.aqueduct=1;s.workshop.hydroPlantTurbines=true;});close(h.snapshot().energy.supply,11.5);
 const w=fixture(s=>{s.buildings.pasture=1;s.buildingStages.pasture=1;s.calendar.season=1;s.challenge='winterIsComing';s.activeChallenges=['winterIsComing'];});close(w.snapshot().energy.supply,1.5);
});
test('buildings600–641: observatory, laboratory uplink and AI data-center capacity multiply',()=>{
 const g=fixture(s=>{s.buildings={library:2,observatory:3,biolab:4,aiCore:2};s.buildingStages.library=1;s.workshop={uplink:true,machineLearning:true,titaniumMirrors:true,cryocomputing:true};});
 const library=2*750*1.06*1.04*1.2,lab=4*1500*1.02;
 close(resource(g,'science').max,250+library+3000+lab);close(resource(g,'culture').max,100+2*250*1.04*1.2);close(g.snapshot().energy.demand,2+5.5);
 const h=fixture(s=>{s.buildings.library=10;s.buildingStages.library=1;s.resources.compendium=100000;});close(resource(h,'science').max,250+7500+17750);
});
test('buildings1867–1904: broadcast culture and storage reflect power surplus and satellites',()=>{
 const b=broadcastMultiplier(20,10,10,.005);close(b.culture,1.75*1.05);close(b.capacity,525*1.05);
 const g=fixture(s=>{s.buildings={amphitheatre:1,aqueduct:10};s.buildingStages={amphitheatre:1,aqueduct:1};s.space.sattelite=10;s.workshop.satelliteRadio=true;});close(rate(g,'culture'),1.75*1.05);close(resource(g,'culture').max,100+525*1.05);
 close(spaceportDemand(10),50);close(spaceportDemand(11),56);close(spaceportDemand(12),63);
});
test('buildings1640–1713: energy rifts grow capacities, not accelerator uranium throughput',()=>{
 const g=fixture(s=>{s.buildings.accelerator=2;s.workshop={energyRifts:true,stasisChambers:true,lhc:true};s.resources.titanium=1;});close(resource(g,'wood').max,200+2*20000*1.95);close(resource(g,'science').max,5250);close(rate(g,'uranium'),.005);close(g.snapshot().energy.demand,4);
});
test('buildings710–788: biofuel keeps constructed laboratory bonuses while conversion scales with active labs',()=>{
 const g=fixture(s=>{s.buildings.biolab=4;s.activeBuildings.biolab=2;s.workshop={biofuel:true,gmo:true,petri:true};s.resources.honey=100;});close(rate(g,'oil'),.064);close(rate(g,'honey'),-2);close(g.snapshot().energy.demand,2);
 const h=fixture(s=>{s.buildings.biolab=4;s.activeBuildings.biolab=0;s.workshop.biofuel=true;s.disabled.biolab=true;});close(resource(h,'science').max,6250);
});
test('botanist policies alter brewery, biofuel demand and active-lab science storage',()=>{
 const g=fixture(s=>{s.buildings={biolab:4,brewery:3};s.activeBuildings.biolab=2;s.workshop.biofuel=true;s.policies.sharkRelationsBotanists=true;s.resources.honey=100;s.resources.spice=100;});close(g.snapshot().energy.demand,.5);close(resource(g,'science').max,250+6000*1.04);close(rate(g,'honey'),-5);close(rate(g,'spice'),-.3);
});
test('buildings1200–1267: automatic steel requires iron and coal, and honors metallurgist relationship bonus',()=>{
 const empty=fixture(s=>{s.buildings.calciner=1;s.workshop.steelPlants=true;s.resources.minerals=100;s.resources.oil=100;});close(rate(empty,'steel'),0);
 const g=fixture(s=>{s.buildings.calciner=1;s.workshop={steelPlants:true,automatedPlants:true};s.resources={...s.resources,minerals:100,oil:100,iron:5,coal:5};s.policies.griffinRelationsMetallurgists=true;});close(rate(g,'iron'),.135);close(rate(g,'coal'),-.015);close(rate(g,'steel'),.00015*1.15);
 assert.equal(g.act('automation','calciner').ok,true);close(rate(g,'steel'),0);close(rate(g,'iron'),.15);
});
test('buildings1540–1588: factory logistics and independently switched sequestration',()=>{
 const g=fixture(s=>{s.buildings.factory=2;s.workshop.factoryLogistics=true;s.workshop.carbonSequestration=true;});close(g.snapshot().energy.demand,8);close(g.snapshot().progression.craftBonus,.12);
 g.tick(.2);close(raw(g).pollution,0);g.act('automation','factory');close(g.snapshot().energy.demand,4);g.tick(.2);close(raw(g).pollution,2);
});
test('game4430–4448/workshop2650: CAD blueprint bonus, Petri bonus-only global multiplier and satellite ship savings',()=>{
 const g=fixture(s=>{s.buildings={library:2,academy:3,observatory:4,biolab:5,workshop:1};s.workshop={cadSystems:true,petri:true,satnav:true};s.science={physics:true,navigation:true};s.space.sattelite=8;s.resources.science=1e6;s.resources.compendium=100;s.resources.manuscript=100;s.resources.beam=100;s.resources.slab=100;s.resources.plate=100;s.resources.starchart=100;});
 assert.equal(g.act('craft','blueprint').ok,true);close(raw(g).resources.blueprint,1.2);
 const ship=g.snapshot().crafts.find(c=>c.id==='ship');close(ship.costs.find(c=>c.id==='starchart').value,22.5);
});
test('buildings1335–1390: steam batches require 98% cap, jam, and reset in spring/autumn',()=>{
 const g=fixture(s=>{s.buildings={steamworks:1,barn:100,workshop:1};s.workshop.factoryAutomation=true;s.science.construction=true;s.resources.wood=20200;s.resources.minerals=25250;});
 g.tick(.2);assert.equal(raw(g).industryState.steamJammed,true);assert.ok(raw(g).resources.beam>0);const first=raw(g).resources.beam;g.tick(.2);close(raw(g).resources.beam,first);
 const s=raw(g);s.calendar={year:0,season:1,day:99,tick:9,weather:0};s.workshop.advancedAutomation=true;const h=createGame({save:serialize(s,0),storage:null,now:0});h.tick(.2);assert.equal(raw(h).industryState.steamJammed,false);
});
test('buildings2166/calendar1117: AI computes unboosted, energy escalates, catastrophe excludes crafted and sacred stock',()=>{
 close(aiPower(1),2);close(aiPower(4),17);
 const g=fixture(s=>{s.buildings.aiCore=2;s.resources.paragon=100;s.policies.transkittenism=true;});g.tick(.2);close(raw(g).resources.gflops,.08);close(g.snapshot().energy.demand,5.5);
 const s=createState(5,0);s.resources.gflops=Math.exp(15);s.resources.wood=100;s.resources.beam=100;s.resources.faith=100;s.resources.alicorn=100;s.calendar.season=0;const ctx={state:s,log(){}};onWorkshopSeason(ctx);close(s.resources.wood,99);close(s.resources.alicorn,99);close(s.resources.beam,100);close(s.resources.faith,100);assert.equal(aiLevel(s),15);assert.ok(workshopSellReason(s,'aiCore'));s.policies.transkittenism=true;onWorkshopSeason(ctx);close(s.resources.wood,99);assert.equal(workshopSellReason(s,'aiCore'),'');assert.equal(aiVulnerableResources.length,15);
});
test('industry save round trip preserves jam and stage; rejects invalid stages and counters',()=>{
 const s=createState(6,0);s.industryState={steamJammed:true,lastAutomationYear:9,aiApocalypseEvents:2};s.buildingStages={library:1,pasture:1};const loaded=parseSave(serialize(s,0));assert.deepEqual(loaded.industryState,s.industryState);assert.deepEqual(loaded.buildingStages,s.buildingStages);s.buildingStages.library=2;assert.throws(()=>parseSave(serialize(s,0)));
});
test('tribal integration: first visitor produces usable manpower and eight upgrades are genuine catalog items',()=>{
 const g=fixture(s=>{s.ironWill=true;s.science.archery=true;});g.tick(2);assert.equal(raw(g).resources.zebras,1);close(rate(g,'manpower'),.15);assert.equal(resource(g,'zebras').max,1);assert.equal(g.snapshot().workshop.filter(d=>d.special).length,8);g.tick(.2);close(raw(g).resources.manpower,.15);
});
test('tribal integration: forge opens rare crafts and whispers refinery consumes all required inputs',()=>{
 const g=fixture(s=>{s.science.archery=true;s.resources.bloodstone=100;s.resources.ivory=10000;s.resources.titanium=10000;s.resources.science=1000;});assert.equal(g.act('build','zebraForge').ok,true);assert.equal(g.act('craft','tMythril').ok,true);close(raw(g).resources.tMythril,1.01);
 const h=fixture(s=>{s.buildings.ivoryTemple=1;s.workshop.whispers=true;s.resources.ivory=200;s.resources.titanium=2;s.resources.alicorn=.00002;});close(rate(h,'minerals'),2);close(rate(h,'tMythril'),.00005);h.tick(.2);close(raw(h).resources.ivory,0);close(raw(h).resources.tMythril,.00005);close(rate(h,'tMythril'),0);
});
test('tribal integration: upgrade gates and shortage failures are atomic; dark revolution changes preparation',()=>{
 const g=fixture(s=>{s.ironWill=true;s.buildings={zebraWorkshop:1,zebraOutpost:3};s.resources.bloodstone=15;s.resources.science=100;});assert.equal(g.act('upgrade','darkRevolution').ok,true);assert.equal(g.snapshot().workshopDynamics.tribal.preparations,3);const before=raw(g).resources;assert.equal(g.act('upgrade','zebraTrappers').ok,false);assert.deepEqual(raw(g).resources,before);assert.equal(g.act('upgrade','rangefinders').ok,false);
});
