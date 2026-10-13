import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame} from '../src/engine/index.js';
import {praiseMultiplier,adoreGain,transcendPrice,karmaGain,retainedResource,shatterCost} from '../src/engine/progression.js';
const close=(a,b,eps=1e-10)=>assert.ok(Math.abs(a-b)<=eps*Math.max(1,Math.abs(b)),`${a} != ${b}`);
function gameWith(fn){const g=createGame({storage:null,now:0});const s=JSON.parse(g.export());fn(s);const r=g.importSave(JSON.stringify(s));assert.equal(r.ok,true,r.message);return g;}
const raw=g=>JSON.parse(g.export());
test('religion.js1535–1692: epiphany, manual adore1.01 and transcend strict threshold',()=>{
 close(praiseMultiplier(0),1);close(praiseMultiplier(.1),1.1);close(adoreGain(1e6,2,true,false),9);close(adoreGain(1e6,2,true),9.09);
 close(transcendPrice(0),.05*((Math.E/10)*(Math.E/10+1)-.11));
 const g=gameWith(s=>{s.science.theology=true;s.resources.faith=100;s.faithRatio=.1;});assert.equal(g.act('praise').ok,true);close(raw(g).praised,110);close(raw(g).resources.faith,.0001);
 const t=gameWith(s=>{s.religion.transcendence=1;s.faithRatio=transcendPrice(0);});assert.equal(t.act('transcend').ok,false);
 const h=raw(t);h.faithRatio+=1e-9;t.importSave(JSON.stringify(h));assert.equal(t.act('transcend').ok,true);assert.equal(raw(t).transcendence,1);
});
test('religion purchase threshold uses worship, spends faith; stacking requires transcendence',()=>{
 const g=gameWith(s=>{s.science.theology=true;s.praised=150;s.resources.faith=1000;});assert.equal(g.act('faith','solarchant').ok,true);close(raw(g).resources.faith,900);close(raw(g).praised,150);assert.equal(g.act('faith','solarchant').ok,false);
 const s=raw(g);s.religion.transcendence=1;g.importSave(JSON.stringify(s));assert.equal(g.act('faith','solarchant').ok,true);close(raw(g).resources.faith,650);
});
test('game5471–5551: karma brackets and reset100 population',()=>{
 assert.equal(karmaGain(35),0);assert.equal(karmaGain(70),65);assert.equal(karmaGain(100),185);
 const g=gameWith(s=>{s.bears=Array.from({length:100},(_,i)=>({id:i+1,name:'熊',job:null,skills:{},experience:0,rank:0}));s.nextBearId=101;});const p=g.snapshot().resetPreview;assert.equal(p.paragon,30);assert.equal(p.karmaGain,185);assert.equal(g.act('reset','confirm').ok,true);close(raw(g).resources.karma,(Math.sqrt(297)-1)/2);assert.equal(raw(g).resources.paragon,30);assert.equal(raw(g).bears.length,0);
});
test('game5630–5855: resource retention matrix and crafted square-root preservation',()=>{
 const g=gameWith(s=>{s.buildings.chronosphere=2;s.resources.wood=100;s.resources.beam=100;s.resources.furs=100;s.resources.void=99;s.resources.timeCrystal=10;s.resources.paragon=7;s.resources.sorrow=2;s.resources.temporalFlux=99;s.resources.relic=100;s.religion.blackObelisk=2;s.religion.solarchant=3;s.transcendence=1;s.metaphysics.anachronomancy=true;s.science.chronophysics=true;});
 const s=raw(g);const p=g.snapshot().resetPreview;close(p.preserved.wood,3);assert.equal(p.preserved.beam,undefined);s.workshop.fluxCondensator=true;close(retainedResource('beam',100,s,{crafts:[{output:'beam'}]}),30);assert.equal(p.preserved.furs,undefined);assert.equal(p.preserved.void,2);assert.equal(p.preserved.timeCrystal,10);g.act('reset','confirm');const r=raw(g);assert.equal(r.religion.blackObelisk,2);assert.equal(r.religion.solarchant,undefined);assert.equal(r.science.chronophysics,true);assert.equal(r.resources.temporalFlux,99);
});
test('space.js23–435: mission prerequisite, travel and moon construction gate',()=>{
 const g=gameWith(s=>{s.science.rocketry=true;for(const id of ['oil','manpower','science','starchart','titanium','uranium','alloy','concrete'])s.resources[id]=1e8;});assert.equal(g.act('space','moonMission').ok,false);assert.equal(g.act('space','orbitalLaunch').ok,true);assert.equal(g.act('space','moonMission').ok,true);assert.equal(g.act('space','moonOutpost').ok,false);const before=raw(g);assert.equal(before.spaceTravel.moonMission,30);g.tick(60.4);assert.equal(raw(g).spaceTravel.moonMission,0);
 // Replenish only in fixture, never runtime: simulation enforces real storage.
 const saved=raw(g);for(const id of ['oil','manpower','science','starchart','titanium','uranium','alloy','concrete'])saved.resources[id]=1e8;g.importSave(JSON.stringify(saved));assert.equal(g.act('space','moonOutpost').ok,true);
});
test('time.js1240–1343: bounded batch price matches independently summed heat/dark penalties',()=>{
 for(const heat of [0,99,100,101,350])for(const year of [0,39999,40000,40001])for(const n of [1,2,5,20,150]){let expected=0;for(let i=0;i<n;i++)expected+=(1+Math.max(0,heat+i*10-100)*.01)*(1+Math.max(0,year+i-40000)*.00001);close(shatterCost(n,{heat,year}).timeCrystal,expected);}
 assert.ok(Number.isFinite(shatterCost(1e6,{heat:1e8,year:1e6}).timeCrystal));
});
test('space.js335: lunar extraction is not multiplied by normal paragon',()=>{
 const g=gameWith(s=>{s.space.moonOutpost=1;s.resources.uranium=100;s.resources.paragon=100;});close(g.snapshot().resources.find(r=>r.id==='unobtainium').rate,.035);
});
test('save time/religion/cost-map integrity survives serialization',()=>{
 const g=gameWith(s=>{s.time.blastFurnace=1;s.timeState.furnaceEnabled=true;s.timeState.heat=25;s.faithRatio=1;s.religion.blackCore=2;s.space.orbitalLaunch=1;});const g2=createGame({storage:null,save:g.export()});assert.equal(raw(g2).timeState.furnaceEnabled,true);close(raw(g2).timeState.heat,25);assert.equal(g2.snapshot().resources.find(r=>r.id==='sorrow').max,19);
 const bad=raw(g);bad.time.bogus=1;assert.equal(g.importSave(JSON.stringify(bad)).ok,false);
});

test('religion2573–3010: pact flat prices, immediate debt, repayment and fracture',async()=>{
 const {pactDebtFactor,pactDailySettlement,pactEffects}=await import('../src/engine/progression.js');
 close(pactDebtFactor({religion:{},religionCounters:{pactDebt:.5}}),.99);
 const p=pactDailySettlement(1,1,.0005,0);close(p.stock,1-.000575);close(p.debt,1-.000075);
 close(pactDailySettlement(0,1,.0005,0).debt,1.0005);
 const f=pactEffects({religion:{pactOfCleansing:2,blackPyramid:3},transcendence:26,challenge:null,challengeCompletions:{},religionCounters:{pactDebt:0}});close(f.pyramidGlobalResourceRatio,.006);
 const g=gameWith(s=>{s.religion.mausoleum=2;s.resources.relic=1000;});assert.equal(g.act('faith','pactOfCleansing').ok,true);close(raw(g).religionCounters.pactDebt,.5);assert.equal(raw(g).resources.relic,900);assert.equal(g.act('faith','pactOfExtermination').ok,true);assert.equal(g.act('faith','pactOfArcane').ok,false);
});
test('calendar55–214: numerical cycle building modifiers and festival production',()=>{
 const g=gameWith(s=>{s.metaphysics.numerology=true;s.metaphysics.numeromancy=true;s.calendar.year=25;s.space.moonOutpost=1;s.resources.uranium=100;s.festivalDays=10;});close(g.snapshot().resources.find(r=>r.id==='unobtainium').rate,.007*1.2*2*5);
 const s=raw(g);s.calendar.year=0;s.festivalDays=0;g.importSave(JSON.stringify(s));close(g.snapshot().resources.find(r=>r.id==='unobtainium').rate,.007*.9*5);
});
test('religion worship thresholds stay unlocked after adore',()=>{
 const g=gameWith(s=>{s.science.theology=true;s.praised=100000;s.religion.apocripha=1;s.resources.faith=10000;s.resources.gold=10000;});g.tick(.2);assert.equal(g.act('adore').ok,true);assert.equal(raw(g).religionUnlocked.solarchant,true);const s=raw(g);s.resources.faith=1000;g.importSave(JSON.stringify(s));assert.equal(g.act('faith','solarchant').ok,true);
});

test('challenge selection runs concurrently and completion leaves unrelated trials active',()=>{
 const g=gameWith(s=>{s.metaphysics.adjustmentBureau=true;});
 assert.equal(g.act('challengeSelect','winterIsComing').ok,true);assert.equal(g.act('challengeSelect','anarchy').ok,true);
 assert.deepEqual(raw(g).pendingChallenges,['winterIsComing','anarchy']);assert.equal(g.act('challengeStart','wrong').ok,false);
 assert.equal(g.act('challengeStart','confirm').ok,true);assert.deepEqual(raw(g).activeChallenges,['winterIsComing','anarchy']);
 const s=raw(g);s.buildings.aiCore=1;s.resources.honey=100;g.importSave(JSON.stringify(s));g.tick(.2);
 assert.equal(raw(g).challengeCompletions.anarchy,1);assert.deepEqual(raw(g).activeChallenges,['winterIsComing']);
 g.tick(.2);assert.equal(raw(g).challengeCompletions.anarchy,1);
});
test('challenge reserves defer retention, max-merge resources, and reclaim after every trial and Iron Will ends',()=>{
 const g=gameWith(s=>{s.metaphysics.adjustmentBureau=true;s.buildings.chronosphere=2;s.time.cryochambers=1;s.resources.wood=100;s.resources.beam=100;s.resources.paragon=7;s.workshop.fluxCondensator=true;s.challengeReserves.resources={wood:4};s.bears=[{id:1,name:'保留熊',job:'farmer',skills:{farmer:100},experience:100,rank:0}];s.nextBearId=2;});
 assert.equal(g.act('challenge','anarchy').ok,true);let s=raw(g);close(s.resources.wood,0);close(s.resources.beam,0);close(s.resources.paragon,7);close(s.challengeReserves.resources.wood,4);close(s.challengeReserves.resources.beam,30);assert.equal(s.bears.length,0);assert.equal(s.challengeReserves.bears[0].job,null);assert.equal(g.act('reclaimReserves').ok,false);
 s.ironWill=false;s.activeChallenges=[];s.challenge=null;s.resources.wood=2;s.resources.beam=1;g.importSave(JSON.stringify(s));assert.equal(g.act('reclaimReserves').ok,true);s=raw(g);close(s.resources.wood,4);close(s.resources.beam,31);assert.equal(s.bears.length,1);assert.equal(s.usedCryochambers,1);assert.equal(s.startedWithChronospheres,true);assert.equal(g.act('reclaimReserves').ok,false);
 assert.equal(g.importSave(g.export()).ok,true);
});
test('post-apocalypse directly carries protected bears and seeds exact pollution and food',()=>{
 const g=gameWith(s=>{s.metaphysics.adjustmentBureau=true;s.challengesUnlocked.postApocalypse=true;s.challengeCompletions.postApocalypse=2;s.buildings.chronosphere=1;s.time.cryochambers=1;s.resources.karma=10;s.bears=[{id:1,name:'冬眠熊',job:null,skills:{},experience:100,rank:0}];s.nextBearId=2;});
 assert.equal(g.act('challenge','postApocalypse').ok,true);const s=raw(g);assert.equal(s.bears.length,1);close(s.pollution,1e11+3e8);close(s.resources.honey,1100);assert.equal(s.ironWill,false);assert.equal(s.challengeReserves.bears.length,0);
});
test('energy completion requires each staged producer and the solar-satellite upgrade',()=>{
 const g=gameWith(s=>{s.challenge='energy';s.activeChallenges=['energy'];for(const id of ['pasture','aqueduct','steamworks','magneto','reactor'])s.buildings[id]=1;for(const id of ['sattelite','sunlifter','tectonic','hrHarvester'])s.space[id]=1;s.buildingStages.pasture=1;s.buildingStages.aqueduct=1;});
 g.tick(.2);assert.equal(raw(g).challengeCompletions.energy,undefined);const s=raw(g);s.workshop.solarSatellites=true;g.importSave(JSON.stringify(s));g.tick(.2);assert.equal(raw(g).challengeCompletions.energy,1);assert.deepEqual(raw(g).activeChallenges,[]);
});
test('black sky suppresses celestial events but preserves satellite charts and applies repeated penalty',()=>{
 const a=gameWith(s=>{s.challenge='blackSky';s.activeChallenges=['blackSky'];s.ironWill=false;s.space.sattelite=1;s.challengeCompletions.blackSky=2;});
 const b=gameWith(s=>{s.ironWill=false;s.space.sattelite=1;});close(a.snapshot().resources.find(r=>r.id==='starchart').rate,b.snapshot().resources.find(r=>r.id==='starchart').rate/1.4);
});
test('Unicorn Tears capacities bypass general storage boosts and include the special stable',()=>{
 const g=gameWith(s=>{s.challenge='unicornTears';s.activeChallenges=['unicornTears'];s.resources.paragon=1000;s.religion.singularity=5;s.time.voidRift=5;s.workshop.alicornStable=true;s.buildings.ziggurat=1;});const r=Object.fromEntries(g.snapshot().resources.map(r=>[r.id,r]));close(r.unicorns.max,710);close(r.tears.max,4);close(r.alicorn.max,.4);
});
test('chronoforge, delay, and void-workshop gates are reachable by ordinary workshop actions',()=>{
 const g=gameWith(s=>{s.buildings.workshop=1;s.science.tachyonTheory=true;s.science.voidSpace=true;for(const id of ['science','timeCrystal','relic','gear','titanium','antimatter','void'])s.resources[id]=1e9;});
 for(const [type,id]of [['upgrade','chronoforge'],['time','blastFurnace'],['upgrade','tachyonModerator'],['time','controlledDelay'],['upgrade','voidAspiration'],['time','voidHoover']])assert.equal(g.act(type,id).ok,true,`${type} ${id}`);
});
test('season-boundary paradox starts with a void event, halts tick economy, and respects distortions per anchor',()=>{
 const g=gameWith(s=>{s.calendar={year:1,season:0,day:99,tick:9,weather:0};s.buildings.chronosphere=100;s.time.chronocontrol=2;s.workshop.distorsion=true;s.resources.void=100;s.resources.honey=100;s.buildings.hive=5;});
 g.tick(.2);let s=raw(g);assert.equal(s.calendar.day,-16);assert.notEqual(s.rng,undefined);const honey=s.resources.honey;g.tick(.2);s=raw(g);close(s.resources.honey,honey);
});
test('elder energy, duration, market conversion and simulated price survive intended boundaries',()=>{
 const g=gameWith(s=>{s.ironWill=false;s.discoveries.leviathans=true;s.elderState={energy:0,duration:500};s.religion.marker=4;s.resources.necrocorn=30;s.science.blackchain=true;s.resources.relic=2500;s.blackcoinState={price:1000};});
 assert.equal(g.act('feedElders','one','max').ok,true);let s=raw(g);close(s.elderState.energy,25);assert.equal(s.challengesUnlocked.unicornTears,true);assert.equal(s.elderState.duration,500);
 assert.equal(g.act('buyBlackcoin').ok,true);close(raw(g).resources.blackcoin,2.5);close(raw(g).resources.relic,0);assert.equal(g.act('sellBlackcoin').ok,true);close(raw(g).resources.relic,2500);
 s=raw(g);s.blackcoinState.price=1075;g.importSave(JSON.stringify(s));g.act('reset','confirm');s=raw(g);close(s.blackcoinState.price,1075);close(s.elderState.energy,0);assert.equal(s.discoveries.leviathans,undefined);
});
test('annual production runs across normalized year boundaries, including flux and elder arrivals',()=>{
 const g=gameWith(s=>{s.calendar={year:999,season:3,day:99,tick:9,weather:0};s.discoveries.lizards=true;s.religion.blackPyramid=100;s.workshop.turnSmoothly=true;s.buildings.chronosphere=1;s.space.sunlifter=1;s.resources.temporalFlux=0;});
 g.tick(.2);const s=raw(g);assert.equal(s.calendar.year,1000);close(s.resources.paragon,1);close(s.resources.temporalFlux,1);close(s.resources.antimatter,1);assert.equal(s.discoveries.leviathans,true);assert.equal(s.challengesUnlocked.blackSky,true);
});

test('late actions reject exchange overflow atomically and apply paid heat/market operations',()=>{
 const g=gameWith(s=>{s.discoveries.leviathans=true;s.science.blackchain=true;s.science.antimatter=true;s.resources.relic=1e100;s.blackcoinState.price=1e-100;s.workshop.invisibleBlackHand=true;s.workshop.tachyonModerator=true;s.timeState.furnaceHeat=200;s.resources.timeCrystal=100;});
 assert.equal(g.act('buyBlackcoin').ok,false);close(raw(g).resources.relic,1e100);close(raw(g).resources.blackcoin,0);assert.equal(g.importSave(g.export()).ok,true);
 let s=raw(g);s.blackcoinState.price=1000;g.importSave(JSON.stringify(s));assert.equal(g.act('crashBlackcoin').ok,true);s=raw(g);close(s.resources.timeCrystal,68);assert.ok(s.blackcoinState.price>=700&&s.blackcoinState.price<800);
 assert.equal(g.act('useFurnaceHeat','year').ok,true);s=raw(g);close(s.timeState.furnaceHeat,100);assert.equal(s.calendar.year,1);close(s.resources.timeCrystal,68);
});
test('time press groups and engineer-bearing resets remain serializable',()=>{
 const g=gameWith(s=>{s.ironWill=false;s.science.chronophysics=true;s.time.temporalPress=1;s.challengeCompletions['1000Years']=2;s.resources.timeCrystal=1000;s.time.cryochambers=1;s.buildings.chronosphere=1;s.bears=[{id:1,name:'工匠熊',job:'engineer',engineerSpecialty:'beam',skills:{engineer:100},experience:100,rank:0}];s.nextBearId=2;});
 assert.equal(g.act('toggleTemporalPress').ok,true);assert.equal(g.act('shatter','press').ok,true);assert.equal(raw(g).calendar.year,25);assert.equal(g.importSave(g.export()).ok,true);assert.equal(g.act('reset','confirm').ok,true);assert.equal(raw(g).bears[0].engineerSpecialty,null);assert.equal(g.importSave(g.export()).ok,true);
});
