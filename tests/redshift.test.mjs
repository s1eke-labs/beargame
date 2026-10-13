import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame,catalog} from '../src/engine/index.js';
import {createState,serialize} from '../src/engine/save.js';
import {calendarRedshift,resourceRedshift,villageRedshift,spaceRedshift,cachedRedshiftRates,paradoxShare,advanceOffline} from '../src/engine/redshift.js';
import {advancePollution,onWorkshopRedshift} from '../src/engine/industrial-redshift.js';
import {advanceYearsSteps} from '../src/engine/progression.js';
import {nextRandom} from '../src/engine/math.js';
const close=(a,b,tol=1e-10)=>assert.ok(Math.abs(a-b)<=tol*Math.max(1,Math.abs(b)),`${a} != ${b}`);
const raw=g=>JSON.parse(g.export());
const bear=(id=1,job=null)=>({id,name:'熊',job,trait:'none',skills:{},experience:0,rank:1});
function game(fn){const s=createState(154,0);s.ironWill=false;fn?.(s);return createGame({save:serialize(s,0),storage:null,now:0});}
function unit(){
 const state=createState(154,0);state.ironWill=false;
 const effects={},caps=Object.fromEntries(catalog.resources.map(r=>[r.id,r.cap])),zero=()=>Object.fromEntries(catalog.resources.map(r=>[r.id,0]));
 const p={effects,caps,gross:zero(),net:zero(),happiness:1,demand:0};
 const ctx={state,catalog,maps:Object.fromEntries(Object.entries(catalog).map(([key,rows])=>[key,Object.fromEntries(rows.map(d=>[d.id,d]))])),production:()=>p,effects:()=>effects,invalidateEffects(){},isChallenge:id=>id==='ironWill'?state.ironWill:state.activeChallenges.includes(id),enabledCount:id=>state.disabled[id]?0:state.buildings[id]||0,happiness:()=>1,skillBonus:()=>0,jobCounts:()=>Object.fromEntries(catalog.jobs.map(j=>[j.id,state.bears.filter(b=>b.job===j.id).length])),gateReason:()=>'',nextRandom,log(){},costsFor:(d,n=1)=>Object.fromEntries(Object.entries(d.cost).map(([id,v])=>[id,v*n])),enough:bill=>Object.entries(bill).every(([id,v])=>state.resources[id]>=v),pay:bill=>{for(const [id,v]of Object.entries(bill))state.resources[id]-=v;},add:(id,v)=>{state.resources[id]=Math.max(0,Math.min(caps[id]===null?Infinity:Math.max(caps[id],state.resources[id]),state.resources[id]+v));}};
 return {ctx,state,p,effects,caps};
}
test('cached redshift excludes converter fuel and ambassador upkeep, skips deficit honey and GFLOPS',()=>{
 const {ctx,state,p,caps}=unit();state.bears=[bear(1,'ambassador')];p.demand=.85;p.gross.honey=.125;p.net.honey=-1.725;p.gross.iron=.02;p.net.wood=-.05;p.net.minerals=-.1;p.gross.culture=2;p.net.culture=-18;p.gross.gflops=.02;
 Object.assign(state.resources,{honey:17,wood:3,minerals:4,culture:0});
 const rates=cachedRedshiftRates(ctx,p);close(rates.honey,-.725);assert.equal(rates.wood,0);assert.equal(rates.culture,2);assert.equal(rates.gflops,undefined);
 const limits=resourceRedshift(ctx,400,p);close(state.resources.honey,17);close(state.resources.wood,3);close(state.resources.minerals,4);close(state.resources.iron,80);close(state.resources.culture,8000);close(limits.culture,caps.culture);assert.equal(state.resources.gflops,0);
});
test('resource caps are delayed and retained overcap has its own ceiling',()=>{
 const {ctx,state,p}=unit();state.resources.wood=600;p.gross.wood=1;const ceilings=resourceRedshift(ctx,400,p);close(state.resources.wood,4600);close(ceilings.wood,600);state.resources.wood-=4100;for(const [id,max]of Object.entries(ceilings))state.resources[id]=Math.min(state.resources[id],max);close(state.resources.wood,500);
});
test('calendar redshift preserves season, day, tick, weather and counts only whole elapsed years',()=>{
 const {ctx,state}=unit();state.calendar={year:998,season:3,day:99,tick:7,weather:-1};state.festivalDays=11;
 calendarRedshift(ctx,399);assert.deepEqual(state.calendar,{year:998,season:3,day:99,tick:7,weather:-1});
 calendarRedshift(ctx,800);assert.deepEqual(state.calendar,{year:1000,season:3,day:99,tick:7,weather:-1});assert.equal(state.resources.paragon,1);assert.equal(state.stats.totalYears,2);assert.equal(state.festivalDays,11);
});
test('bulk celestial rounding has no active auto-observation one percent floor',()=>{
 const {ctx,state,effects}=unit();state.buildings.library=1;state.science.astronomy=true;
 calendarRedshift(ctx,4000);assert.equal(state.resources.starchart,0);assert.equal(state.resources.science,0);
 effects.starAutoChance=.5;state.workshop.celestialMechanics=true;calendarRedshift(ctx,400);assert.equal(state.resources.starchart,1);close(state.resources.science,30);
});
test('bulk meteors exclude academy modifier from science and use one ivory yield per batch',()=>{
 const {ctx,state,effects}=unit();state.science.mining=true;state.workshop.celestialMechanics=true;state.workshop.prospecting=true;Object.assign(effects,{academyMeteorBonus:1,mineralsRatio:1,scienceRatio:1,ivoryMeteorChance:.01});ctx.nextRandom=()=>.2;
 calendarRedshift(ctx,500);close(state.resources.minerals,150);close(state.resources.science,30);close(state.resources.iron,10);close(state.resources.ivory,2750);
});
test('offline millennium challenge caps calendar at500 but annual energy reward uses elapsed whole years',()=>{
 const {ctx,state,effects,caps}=unit();state.activeChallenges=['1000Years'];state.calendar.year=499;effects.antimatterPerYear=3;effects.energySupply=30;caps.antimatter=100;
 calendarRedshift(ctx,800);assert.equal(state.calendar.year,500);close(state.resources.antimatter,6);assert.equal(state.stats.totalYears,1);
});
test('statistical void preserves calendar and bulk space consumes only existing computing',()=>{
 const {ctx,state,effects}=unit();effects.temporalParadoxChance=1;close(paradoxShare(effects),1/11);calendarRedshift(ctx,110);assert.equal(state.resources.void,5);assert.equal(state.calendar.day,0);
 state.resources.gflops=7;state.space.entangler=2;state.spaceTravel.moonMission=100;effects.routeSpeed=2;spaceRedshift(ctx,30);assert.equal(state.resources.gflops,0);assert.equal(state.resources.hashrates,7);assert.equal(state.spaceTravel.moonMission,40);assert.equal(state.spaceReached.moonMission,undefined);
});
test('village redshift funds whole ambassador interval proportionally, then adds housing-limited bears and skills',()=>{
 const {ctx,state,effects,p}=unit();state.metaphysics.ambassadors=true;state.bears=[bear(1,'ambassador')];state.nextBearId=2;state.resources.culture=100;state.resources.spice=1;effects.bears=3;
 villageRedshift(ctx,10,p);close(state.resources.culture,75);close(state.resources.spice,0);assert.equal(state.bears.length,2);close(state.bears[0].skills.ambassador,1);assert.equal(state.stats.totalDeaths,0);
 villageRedshift(ctx,100,p);assert.equal(state.bears.length,3);assert.equal(state.arrival,0);close(state.bears[0].skills.ambassador,11);
});
test('pollution batch uses exponential constant emission rather than repeated active updates',()=>{
 const {ctx,state,effects,p}=unit();state.pollution=1e7;effects.pollution=2;advancePollution(ctx,4000,p);close(state.pollution,2e7+(1e7-2e7)*Math.exp(-.0004));state.activeChallenges=['postApocalypse'];const start=state.pollution;advancePollution(ctx,4000,p);close(state.pollution,start+8000);
});
test('steam redshift caps each attempt, accumulates using overflow, and disabled automation still jams',()=>{
 const {ctx,state,p,caps}=unit();state.buildings.steamworks=49;state.workshop.factoryAutomation=true;caps.wood=1000;caps.minerals=1000;state.resources.wood=3000;
 onWorkshopRedshift(ctx,800,p);close(state.resources.beam,10);close(state.resources.wood,1250);assert.equal(state.industryState.steamJammed,true);
 state.resources.wood=3000;state.resources.beam=0;state.automationDisabled.steamworks=true;state.industryState.steamJammed=false;onWorkshopRedshift(ctx,800,p);assert.equal(state.resources.beam,0);assert.equal(state.resources.wood,3000);assert.equal(state.industryState.steamJammed,true);
});
test('per-year retrieval recomputes cycle rate after partial first year and preserves day tick',()=>{
 const g=game(s=>{s.calendar={year:4,season:2,day:50,tick:7,weather:0};s.science.chronophysics=true;s.time.ressourceRetrieval=1;s.metaphysics.numerology=true;s.space.moonOutpost=1;s.resources.uranium=100;s.resources.timeCrystal=20;});
 assert.equal(g.act('shatter','year',2).ok,true);const s=raw(g);close(s.resources.unobtainium,.007*.9*1500*.01+.007*4000*.01);close(s.resources.uranium,100-.35*5500*.01);assert.equal(s.calendar.year,6);assert.equal(s.calendar.day,0);assert.equal(s.calendar.season,0);assert.equal(s.calendar.tick,7);close(s.timeState.flux,1.375);
});
test('per-year millennium reward changes subsequent retrieval production and storage',()=>{
 const g=game(s=>{s.calendar.year=999;s.science.chronophysics=true;s.time.ressourceRetrieval=1;s.buildings.hive=1;s.resources.timeCrystal=20;s.religion.darkParacosm=2;});
 assert.equal(g.act('shatter','year',2).ok,true);const s=raw(g);close(s.resources.paragon,1);close(s.resources.honey,.125*1.5*40+.125*1.5*1.01*40);
});
test('shatter includes chrono engineers, retrieval pollution, independent void resonance and annual AI',()=>{
 const g=game(s=>{s.science.chronophysics=true;s.science.mechanization=true;s.workshop.chronoEngineers=true;s.time.ressourceRetrieval=100;s.time.voidResonator=1;s.metaphysics.voidOrder=true;s.science.theology=true;s.buildings={factory:1,workshop:1,temple:1,smelter:1,hut:1};s.bears=[{...bear(1,'engineer'),engineerSpecialty:'beam'}];s.nextBearId=2;s.resources={...s.resources,honey:1e6,wood:1000,minerals:1000,timeCrystal:100};});
 const faith=g.snapshot().resources.find(r=>r.id==='faith').rate/5;assert.equal(g.act('shatter','year',1).ok,true);const s=raw(g);assert.ok(s.resources.beam>0);assert.ok(s.pollution>0);close(s.praised,faith*4000*.1*1.1);
 const ai=game(s=>{s.science.chronophysics=true;s.resources.timeCrystal=10;s.resources.gflops=Math.exp(15);s.resources.wood=1000;});ai.act('shatter','year',2);close(raw(ai).resources.wood,980.1);assert.equal(raw(ai).industryState.aiApocalypseEvents,2);
});
test('year generator exposes exact progress and short/long jumps agree with independently repeated annual actions',()=>{
 const setup=s=>{s.science.chronophysics=true;s.time.ressourceRetrieval=2;s.metaphysics.numerology=true;s.space.moonOutpost=1;s.resources.uranium=1e6;s.resources.timeCrystal=1e6;s.calendar.year=39998;};
 const a=game(setup),b=game(setup);assert.equal(a.act('shatter','year',55).ok,true);for(let i=0;i<55;i++)assert.equal(b.act('shatter','year',1).ok,true);for(const id of ['unobtainium','uranium','paragon','honey'])close(raw(a).resources[id],raw(b).resources[id]);assert.equal(raw(a).calendar.year,40053);
 const {ctx,state}=unit();state.calendar.year=20;const steps=[...advanceYearsSteps(ctx,3)];assert.deepEqual(steps,[{completedYears:1,totalYears:3},{completedYears:2,totalYears:3},{completedYears:3,totalYears:3}]);
});
test('integrated redshift freezes winter instead of crossing seasons and never runs hunger deaths',()=>{
 const g=game(s=>{s.calendar={year:12,season:3,day:99,tick:7,weather:0};s.buildings.hive=1;s.buildings.hut=1;s.bears=[bear()];s.nextBearId=2;s.resources.honey=0;});const before=raw(g);
 assert.equal(g.simulate(800,{offline:true}).ok,true);const s=raw(g);assert.equal(s.stats.totalDeaths,0);assert.equal(s.bears.length,2);assert.equal(s.resources.honey,0);assert.deepEqual(s.calendar,{...before.calendar,year:13});assert.equal(s.ticks,before.ticks);
 const live=game(s=>{s.bears=[bear()];s.nextBearId=2;});live.tick(.2);assert.equal(raw(live).stats.totalDeaths,1);
});
test('offline queue buys one unit per whole-year segment with no early compounding',()=>{
 const g=game(s=>{s.buildings.hive=1;s.resources.honey=20;});assert.equal(g.act('queueEnqueue','build:hive',2).ok,true);const report=g.simulate(1600,{offline:true});assert.equal(report.ok,true);
 const s=raw(g);assert.equal(s.buildings.hive,3);assert.equal(s.queue.items.length,0);close(s.resources.honey,20+750-11.2+1500-12.544);assert.equal(s.calendar.year,2);
});
test('uncomputable queue head batches remaining period without attempting later items',()=>{
 const g=game(s=>{s.buildings.hive=1;s.resources.honey=20;});g.act('queueEnqueue','build:library');g.act('queueEnqueue','build:hive');g.simulate(1600,{offline:true});const s=raw(g);assert.equal(s.buildings.hive,1);assert.equal(s.queue.items.length,2);close(s.resources.honey,1520);
});
test('integrated offline converter output is cached while fuel is untouched and cores do not produce',()=>{
 const g=game(s=>{s.buildings.smelter=1;s.buildings.aiCore=1;s.resources.wood=100;s.resources.minerals=100;});g.simulate(800,{offline:true});const s=raw(g);close(s.resources.wood,100);close(s.resources.minerals,100);close(s.resources.iron,50);assert.equal(s.resources.gflops,0);
});
test('sync and async bulk outcomes match, imports replay deterministically, and completed catchup does not repeat gains',async()=>{
 const setup=s=>{s.calendar={year:999,season:2,day:77,tick:6,weather:-1};s.settings.offline=true;s.science={astronomy:true,mining:true};s.workshop.seti=true;s.buildings={hive:4,hut:2,library:1};s.resources.honey=100;s.queue={items:[{type:'build',id:'hive',amount:2}],sources:{buildings:true}};};
 const sync=game(setup),async=game(setup),replay=createGame({save:sync.export(),storage:null,now:0});sync.simulate(1600,{offline:true});async._scheduleOffline(1600);let checkpoints=0;
 const result=await async.catchUpAsync(undefined,{onProgress:p=>{checkpoints++;assert.equal(async.act('gather').ok,false);assert.equal(async.save().ok,false);assert.equal(async.importSave(replay.export()).ok,false);assert.throws(()=>async.export());assert.ok(p.progress>=0&&p.progress<=1);}});assert.equal(result.ok,true);assert.ok(checkpoints>0);replay.simulate(1600,{offline:true});
 for(const key of ['resources','calendar','queue','bears','engineerProgress','rng']){assert.deepEqual(raw(async)[key],raw(sync)[key]);assert.deepEqual(raw(replay)[key],raw(sync)[key]);}
 const before=raw(async);assert.equal((await async.catchUpAsync()).ticks,0);assert.deepEqual(raw(async).resources,before.resources);
});
test('asynchronous year skipping exposes progress and preserves atomic prepayment on overflow',async()=>{
 const setup=s=>{s.science.chronophysics=true;s.resources.timeCrystal=1e8;s.time.ressourceRetrieval=1;s.buildings.hive=1;};const async=game(setup),sync=game(setup);sync.act('shatter','year',80);let updates=0;
 const result=await async.actAsync('shatter','year',80,{onProgress:p=>{updates++;assert.equal(async.save().ok,false);assert.throws(()=>async.export());assert.ok(p.total===80);}});assert.equal(result.ok,true);assert.ok(updates>=4);assert.deepEqual(raw(async).resources,raw(sync).resources);assert.equal(raw(async).calendar.year,80);
 const bad=game(s=>{s.science.chronophysics=true;s.calendar.year=999999999;s.resources.timeCrystal=1e20;});const before=raw(bad);assert.equal((await bad.actAsync('shatter','year',2)).ok,false);assert.deepEqual(raw(bad).resources,before.resources);assert.deepEqual(raw(bad).timeState,before.timeState);assert.deepEqual(raw(bad).calendar,before.calendar);
});

test('partial first shatter year retains pre-jump seasonal cached production',()=>{
 const g=game(s=>{s.calendar={year:4,season:3,day:50,tick:3,weather:0};s.science.chronophysics=true;s.time.ressourceRetrieval=1;s.buildings.hive=1;s.resources.timeCrystal=10;});g.act('shatter','year',2);close(raw(g).resources.honey,.125*.25*500*.01+.125*1.5*4000*.01);
});
test('offline furnace transfers only configured heat and shatters whole heat batches before final calendar',()=>{
 const g=game(s=>{s.time.blastFurnace=1;s.timeState.heat=100;s.timeState.furnaceHeat=20;s.timeState.furnaceEnabled=true;});g.simulate(800,{offline:true});const s=raw(g);close(s.timeState.heat,20);close(s.timeState.furnaceHeat,0);assert.equal(s.calendar.year,2);close(s.timeState.flux,1);
 const cold=game(s=>{s.time.blastFurnace=1;s.timeState.heat=0;s.timeState.furnaceHeat=100;s.timeState.furnaceEnabled=true;});cold.simulate(800,{offline:true});assert.equal(raw(cold).calendar.year,1);close(raw(cold).timeState.furnaceHeat,100);
});
test('offline growth and converters stay frozen within one segment instead of compounding early',()=>{
 const g=game(s=>{s.buildings={hive:1,hut:2,smelter:1};s.resources.wood=0;s.resources.minerals=0;});g.simulate(800,{offline:true});const s=raw(g);close(s.resources.honey,750);assert.equal(s.bears.length,4);assert.equal(s.resources.iron,0);
});
test('shatter updates the build queue once after the whole jump, not once per skipped year',()=>{
 const g=game(s=>{s.science.chronophysics=true;s.resources.timeCrystal=100;s.resources.honey=100;});g.act('queueEnqueue','build:hive',3);g.act('shatter','year',5);const s=raw(g);assert.equal(s.buildings.hive,1);assert.equal(s.queue.items[0].amount,2);assert.equal(s.calendar.year,5);
});
test('redshift begun within a paradox preserves per-tick ambassador, pact stock and relic gates',async()=>{
 const {onReligionRedshift}=await import('../src/engine/religion-redshift.js');
 const {ctx,state,effects,p,caps}=unit();state.calendar.day=-4;state.metaphysics.ambassadors=true;state.bears=[bear(1,'ambassador')];state.nextBearId=2;state.resources.culture=100;state.resources.spice=1;state.resources.necrocorn=2;state.religion.pactOfCleansing=1;state.religionCounters.pactDebt=1;state.space.spaceBeacon=1;effects.beaconRelicsPerDay=1;caps.antimatter=5000;
 villageRedshift(ctx,100,p);close(state.resources.culture,100);close(state.resources.spice,1);assert.equal(state.bears[0].skills.ambassador,undefined);
 onReligionRedshift(ctx,100,1000,p);close(state.resources.necrocorn,2);close(state.religionCounters.pactDebt,.9925);calendarRedshift(ctx,100);assert.equal(state.resources.relic,0);assert.equal(state.calendar.day,-4);
});
