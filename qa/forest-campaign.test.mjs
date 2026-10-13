import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {relative,resolve} from 'node:path';
import {catalog as fullCatalog,constants as fullConstants} from '../src/engine/catalog.js';
import {loadForestEngine,runEarnedForestCampaign,assertFutureActionsAreAtomic,semanticSave,memoryStorage,RESEARCH,UPGRADES,CONSTRUCTION,checkout} from './forest-campaign.mjs';

// No fallback: this suite tests the public emitted module after npm run build.
const engine=await loadForestEngine();
let earned;
const campaign=()=>earned??=runEarnedForestCampaign(engine);
const OMITTED_EFFECTS={
 'buildings/library':['cultureMax'],
 'buildings/barn':['coalMax','titaniumMax','goldMax'],
 'buildings/warehouse':['coalMax','titaniumMax','goldMax'],
 'workshop/bolas':['explorerAtk'],
 'workshop/huntingArmor':['explorerDef'],
 'workshop/compositeBow':['explorerAtk'],
};
const facts=JSON.parse(readFileSync(new URL('./fixtures/reference-numeric-facts.json',import.meta.url),'utf8'));
const summary=report=>({target:relative(checkout,engine.target),seed:report.seed,simulationSeconds:report.simulationSeconds,simulationHours:report.simulationHours,cpuSeconds:report.cpuSeconds,wallSeconds:report.wallSeconds,actions:report.actionCalls,ticks:report.totalTicks,deaths:report.deaths,bears:report.finalBears,scope:report.scope});

test('forest campaign imports the manifest-verified emitted module',()=>{
 const manifest=JSON.parse(readFileSync(resolve(checkout,'dist/release-manifest.json'),'utf8'));
 assert.equal(manifest.chapter,'forest');
 assert.equal(relative(resolve(checkout,'dist'),engine.target).replaceAll('\\','/'),'src/chapters/forest/engine.js');
 for(const file of ['engine.js','catalog.js','save.js','math.js']){
  const path=`src/chapters/forest/${file}`;
  const entry=manifest.files.find(item=>item.path===path);
  assert.ok(entry,`${file} is in the release manifest`);
  assert.equal(createHash('sha256').update(readFileSync(resolve(checkout,'dist',path))).digest('hex'),entry.sha256,`${file} matches the built artifact`);
 }
});

test('emitted forest definitions retain source baseline costs, effects, clocks and numeric reference facts',()=>{
 for(const [group,definitions]of Object.entries(engine.catalog))for(const definition of definitions){
  const original=fullCatalog[group].find(item=>item.id===definition.id);
  assert.ok(original,`${group}/${definition.id} has a full-source baseline`);
  for(const field of ['cost','ratio','conversion','output','amount','rate','cap','tier','difficulty','gate'])assert.deepEqual(definition[field],original[field],`${group}/${definition.id}/${field}`);
  // Only these explicitly out-of-chapter effects may be omitted; all others must survive unchanged.
  const expectedEffect=original.effect?{...original.effect}:undefined;
  for(const field of OMITTED_EFFECTS[`${group}/${definition.id}`]||[])delete expectedEffect[field];
  assert.deepEqual(definition.effect,expectedEffect,`${group}/${definition.id}/effect`);
  const reference=facts.groups[group]?.find(item=>item.id===definition.id);
  if(reference){
   assert.deepEqual(definition.cost,reference.cost,`${group}/${definition.id} independently recorded price`);
   if(reference.ratio!==undefined&&reference.ratio!==null)assert.equal(definition.ratio,reference.ratio,`${group}/${definition.id} independently recorded ratio`);
   if(reference.amount!==undefined)assert.equal(definition.amount,reference.amount,`${group}/${definition.id} independently recorded output`);
  }
 }
 for(const key of ['TICKS_PER_SECOND','TICKS_PER_DAY','DAYS_PER_SEASON','SEASONS_PER_YEAR','SEASON_FACTORS','MAX_OFFLINE_SECONDS'])assert.deepEqual(engine.constants[key],fullConstants[key],`Baseline ${key}`);
 assert.equal(engine.constants.TICKS_PER_SECOND,5);
 assert.equal(engine.constants.MAX_OFFLINE_SECONDS,8000);
 assert.deepEqual(engine.catalog.science.map(item=>item.id),RESEARCH);
});

test('an empty forest earns all seven research, construction buildings and representative upgrades without deaths',{timeout:120000},t=>{
 const {game,report,calls}=campaign(),state=game.snapshot();
 assert.deepEqual(state.science.filter(item=>item.completed).map(item=>item.id),RESEARCH);
 for(const id of UPGRADES)assert.equal(state.workshop.find(item=>item.id===id).completed,true,id);
 for(const id of CONSTRUCTION)assert.ok(state.buildings.find(item=>item.id===id).owned>=1,id);
 assert.equal(state.bears.value,9);
 assert.equal(state.stats.totalDeaths,0);
 assert.equal(state.stats.totalGathered,10);
 assert.equal(state.stats.totalHunts,1);
 assert.equal(calls.filter(call=>call.method==='act'&&call.args[0]==='gather').length,10);
 assert.ok(calls.every(call=>['act','tick'].includes(call.method)),'Campaign transcript contains public actions/ticks only');
 assert.ok(calls.filter(call=>call.method==='tick').every(call=>call.args.length===1&&call.args[0]>0&&call.args[0]<=800),'No accelerated or oversized simulation calls');
 assert.equal(report.totalTicks,report.simulationSeconds*5);
 assert.equal(report.deaths,0);
 assert.ok(report.cpuSeconds>0&&report.wallSeconds>0);
 t.diagnostic(JSON.stringify(summary(report)));
});

test('recorded earned actions replay from another empty forest to the exact exported save',{timeout:120000},()=>{
 const original=campaign();
 let now=original.now-original.report.simulationSeconds*1000;
 const replay=engine.createGame({seed:original.report.seed,storage:null,now:()=>now});
 for(const [index,call]of original.calls.entries()){
  const outcome=replay[call.method](...call.args);
  assert.equal(outcome.ok,true,`Replay call ${index}: ${JSON.stringify(call)}: ${outcome.message}`);
  if(call.method==='tick')now+=call.args[0]*1000;
 }
 assert.equal(replay.export(),original.finalSave,'Identical seed + legal actions/ticks produces exactly the same earned save');
});

test('the earned survival route also works with an independently chosen random seed',{timeout:120000},t=>{
 const alternative=runEarnedForestCampaign(engine,{seed:20261010});
 assert.equal(alternative.report.deaths,0);
 assert.equal(alternative.report.finalBears,9);
 assert.deepEqual(alternative.report.research,RESEARCH);
 t.diagnostic(JSON.stringify(summary(alternative.report)));
});

test('future action types and content IDs fail atomically before and after earned progression',()=>{
 const fresh=engine.createGame({seed:17,now:1,storage:null});
 const progressed=engine.importGame(campaign().finalSave,{now:campaign().now,storage:null});
 assert.equal(assertFutureActionsAreAtomic(fresh),31);
 assert.equal(assertFutureActionsAreAtomic(progressed),31);
});

test('unknown hunt and observation IDs are rejected even when their legal actions are available',()=>{
 const original=campaign(),game=engine.importGame(original.finalSave,{storage:null,now:original.now});
 assert.equal(game.act('unassign','farmer',1).ok,true);
 assert.equal(game.act('assign','hunter',1).ok,true);
 let elapsed=0;
 while(game.snapshot().resources.find(item=>item.id==='manpower').value<100){
  assert.equal(game.tick(2).ok,true);elapsed+=2;assert.ok(elapsed<=3600,'Earned hunter should accumulate 100 manpower');
 }
 let before=game.export();
 assert.equal(game.act('hunt','futureHunt').ok,false,'Unknown hunt ID must not consume earned manpower');
 assert.equal(game.export(),before);
 assert.equal(game.act('hunt','hunt').ok,true,'The known hunt action remains usable');
 elapsed=0;
 while(!game.snapshot().observation){
  assert.equal(game.tick(2).ok,true);elapsed+=2;assert.ok(elapsed<=21600,'Seeded earned library should expose a normal observation');
 }
 before=game.export();
 assert.equal(game.act('observe','futureObservation').ok,false,'Unknown observation ID must not claim an earned event');
 assert.equal(game.export(),before);
 assert.equal(game.act('observe','observe').ok,true,'The known observation action remains usable');
 assert.equal(game.snapshot().stats.totalDeaths,0);
});

test('the fully earned settlement exports, imports, saves and reloads without losing simulation state',()=>{
 const original=campaign(),storage=memoryStorage();
 const imported=engine.importGame(original.finalSave,{storage,now:original.now});
 assert.deepEqual(semanticSave(imported.export()),semanticSave(original.finalSave));
 assert.equal(imported.save().ok,true);
 const disk=storage.getItem(engine.constants.SAVE_KEY);
 assert.ok(disk,'Public save writes the chapter-specific storage key');
 assert.deepEqual(semanticSave(disk),semanticSave(original.finalSave));
 const reloaded=engine.loadGame({storage,now:original.now+3_600_000});
 assert.deepEqual(semanticSave(reloaded.export()),semanticSave(original.finalSave),'Default-off offline setting does not silently advance time');
 const uninterrupted=engine.importGame(original.finalSave,{storage:null,now:original.now+3_600_000});
 assert.equal(reloaded.tick(800).ok,true);
 assert.equal(uninterrupted.tick(800).ok,true);
 assert.deepEqual(semanticSave(reloaded.export()),semanticSave(uninterrupted.export()),'Reload continuation matches uninterrupted ordinary ticks');
 assert.equal(reloaded.snapshot().stats.totalDeaths,0);
});

test('earned offline continuation is bounded, survives and equals exact ordinary ticks',{timeout:60000},async t=>{
 const original=campaign(),storage=memoryStorage();
 const saved=engine.importGame(original.finalSave,{storage,now:original.now});
 assert.equal(saved.setSetting('offline',true).ok,true);
 assert.equal(saved.save().ok,true);
 const before=storage.getItem(engine.constants.SAVE_KEY),futureNow=original.now+9_000_000;
 const offline=engine.loadGame({storage,now:futureNow,deferOffline:true});
 assert.equal(offline.snapshot().pendingOffline,9000);
 assert.equal(offline.snapshot().ticks,JSON.parse(before).ticks,'Deferred load does not advance before settlement');
 assert.equal(offline.act('gather','honey').ok,false,'Actions are blocked while offline settlement is pending');
 assert.equal(offline.save().ok,false,'Pending progress cannot overwrite its saved checkpoint');
 assert.equal(storage.getItem(engine.constants.SAVE_KEY),before);
 const progress=[];
 const outcome=await offline.catchUpAsync(undefined,{onProgress:point=>progress.push(point.progress)});
 assert.equal(outcome.ok,true,outcome.message);
 assert.equal(outcome.seconds,8000);
 assert.equal(outcome.discardedSeconds,1000);
 assert.equal(outcome.ticks,40000);
 assert.equal(offline.snapshot().pendingOffline,0);
 assert.equal(offline.snapshot().catchingUp,false);
 assert.equal(offline.snapshot().stats.totalDeaths,0);
 assert.equal(offline.snapshot().bears.value,9);
 assert.ok(progress.length>0&&progress.at(-1)===1);
 assert.ok(progress.every((value,index)=>index===0||value>=progress[index-1]),'Offline progress is monotonic');
 const ordinary=engine.importGame(before,{storage:null,now:futureNow});
 assert.equal(ordinary.tick(8000).ok,true);
 assert.deepEqual(semanticSave(offline.export()),semanticSave(ordinary.export()),'Offline settlement preserves deterministic five-Hz simulation');
 assert.equal(offline.save().ok,true);
 const restored=engine.loadGame({storage,now:futureNow});
 assert.deepEqual(semanticSave(restored.export()),semanticSave(offline.export()),'Settled offline progress survives another storage reload');
 t.diagnostic(JSON.stringify({offlineRequestedSeconds:9000,offlineSimulatedSeconds:outcome.seconds,discardedSeconds:outcome.discardedSeconds,deaths:offline.snapshot().stats.totalDeaths,bears:offline.snapshot().bears.value}));
});

test('cancelling offline work preserves the earned save and permits an exact retry',{timeout:60000},async()=>{
 const original=campaign(),retry=engine.importGame(original.finalSave,{storage:null,now:original.now});
 const before=retry.export(),controller=new AbortController();
 const cancelled=await retry.catchUpAsync(800,{signal:controller.signal,onProgress:()=>controller.abort()});
 assert.equal(cancelled.ok,false);
 assert.equal(cancelled.cancelled,true);
 assert.equal(retry.export(),before,'Cancelled settlement restores all earned state exactly');
 assert.equal(retry.snapshot().catchingUp,false);
 const outcome=await retry.catchUpAsync(800);
 assert.equal(outcome.ok,true);
 const reference=engine.importGame(before,{storage:null,now:original.now});
 assert.equal(reference.tick(800).ok,true);
 assert.deepEqual(semanticSave(retry.export()),semanticSave(reference.export()));
 assert.equal(retry.snapshot().stats.totalDeaths,0);
});
