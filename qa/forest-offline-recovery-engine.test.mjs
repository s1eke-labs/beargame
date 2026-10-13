import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame,loadGame,parseSave,catalog,constants} from '../src/chapters/forest/engine.js';
import {createGame as createReference} from '../src/engine/index.js';

const NOW=1_800_000_000_000;
const raw=game=>JSON.parse(game.exportSave());
const resource=(game,id)=>game.snapshot().resources.find(item=>item.id===id);
const traits=['scientist','manager','engineer','merchant','wise','metallurgist','chemist','none'];

function screenshotSave(){
 const state=raw(createGame({seed:123456789,now:NOW,storage:null}));
 Object.assign(state,{solitary:false,ticks:7000,tickRemainder:.375,nextBearId:3});
 state.calendar={year:1,season:3,day:0,tick:0,weather:0};
 state.buildings={hive:19,hut:1};
 Object.assign(state.resources,{honey:3163.6,wood:113.5});
 Object.assign(state.stats,{totalTicks:7000,totalYears:1,maxBears:2});
 state.settings.offline=true;
 state.bears=[
  {id:1,name:'小熊 1',job:'woodcutter',disposition:7,experience:30,skills:{woodcutter:30},color:0,variety:0},
  {id:2,name:'小熊 2',job:null,disposition:7,experience:0,skills:{},color:0,variety:0},
 ];
 return state;
}

function storageWith(state){
 const initial=JSON.stringify(state),data=new Map([[constants.SAVE_KEY,initial]]),writes=[];
 return {initial,writes,getItem:key=>data.get(key)??null,setItem:(key,value)=>{writes.push([key,value]);data.set(key,value);}};
}

function referenceFor(state,now=NOW){
 const normalized=parseSave(JSON.stringify(state),now),reference=raw(createReference({seed:normalized.rng,now,storage:null}));
 for(const key of ['savedAt','startedAt','rng','ticks','tickRemainder','calendar','resourceUnlocked','buildings','science','workshop','disabled','activeBuildings','pollution','arrival','deathCooldown','nextBearId','observation','settings','queue'])reference[key]=structuredClone(normalized[key]);
 Object.assign(reference.resources,normalized.resources);Object.assign(reference.stats,normalized.stats);
 reference.ironWill=normalized.solitary;
 reference.bears=normalized.bears.map(({disposition,...bear})=>({...bear,trait:traits[disposition],rank:0}));
 return createReference({save:reference,now,storage:null});
}

function equalSimulation(actual,expected){
 const left=raw(actual),right=raw(expected);
 for(const key of ['rng','ticks','tickRemainder','calendar','buildings','science','workshop','disabled','activeBuildings','pollution','arrival','deathCooldown','nextBearId','observation'])assert.deepEqual(left[key],right[key],key);
 for(const {id}of catalog.resources)assert.equal(left.resources[id],right.resources[id],`resources.${id}`);
 for(const key of Object.keys(left.stats))assert.equal(left.stats[key],right.stats[key],`stats.${key}`);
 assert.deepEqual(left.queue.items,right.queue.items,'queued work');
 const individual=({disposition,trait,rank,engineerSpecialty,...bear})=>bear;
 assert.deepEqual(left.bears.map(individual),right.bears.map(individual),'individual bear state');
}

test('deferred screenshot-like save rejects premature live ticks without preventing correct offline settlement',async()=>{
 const state=screenshotSave();delete state.queue;
 const storage=storageWith(state),later=NOW+62_137;
 const game=loadGame({storage,now:later,deferOffline:true}),before=game.snapshot();
 assert.equal(resource(game,'honey').rate,-5.53125);
 assert.equal(resource(game,'wood').rate,.09);
 assert.equal(before.pendingOffline,62.137);
 assert.equal(before.storageProtected,false);
 assert.deepEqual(before.queue.items,[],'Pre-queue saves are normalized without resetting progress');
 for(const elapsed of [.2,.201,.3]){
  const outcome=game.tick(elapsed);
  assert.equal(outcome.ok,false);assert.match(outcome.message,/离线结算/);
  assert.deepEqual(game.snapshot(),before,'The expected pending-work guard is not a simulation failure');
 }
 assert.equal(storage.getItem(constants.SAVE_KEY),storage.initial);
 const outcome=await game.catchUpAsync();
 assert.equal(outcome.ok,true,outcome.message);assert.equal(outcome.seconds,62);assert.equal(outcome.ticks,310);
 const reference=referenceFor(state,later);assert.equal(reference.tick(62).ok,true);equalSimulation(game,reference);
 assert.equal(game.snapshot().pendingOffline,0);
 assert.equal(storage.writes.length,0,'Settlement never persists an incomplete checkpoint');
 assert.equal(game.save().ok,true);assert.doesNotThrow(()=>parseSave(storage.getItem(constants.SAVE_KEY)));
});

test('long screenshot-like offline replay preserves the exact simulation through winters and queued construction',async()=>{
 const state=screenshotSave();state.queue.items=[{type:'build',id:'hive',amount:2},{type:'build',id:'hut',amount:1}];
 const game=createGame({save:state,now:NOW,storage:null}),reference=referenceFor(state);
 const outcome=await game.catchUpAsync(8100.234);
 assert.equal(outcome.ok,true,outcome.message);assert.equal(outcome.seconds,8000);assert.equal(outcome.discardedSeconds,100);
 assert.equal(outcome.ticks,40000);assert.equal(reference.tick(8000).ok,true);equalSimulation(game,reference);
 assert.equal(game.snapshot().queue.used,0);
 assert.doesNotThrow(()=>parseSave(game.exportSave()));
});

test('genuine honey depletion and starvation during offline replay match the full engine',async()=>{
 const state=screenshotSave();state.resources.honey=1;state.buildings.hive=1;state.buildings.library=1;state.resources.science=40;
 state.queue={items:[{type:'research',id:'calendar',amount:1},{type:'build',id:'hut',amount:1},{type:'build',id:'hive',amount:1}],sources:{buildings:true,tech:true}};
 const game=createGame({save:state,now:NOW,storage:null}),reference=referenceFor(state);
 const outcome=await game.catchUpAsync(400.49);
 assert.equal(outcome.ok,true,outcome.message);assert.ok(game.snapshot().stats.totalDeaths>0);
 assert.equal(outcome.seconds,400);assert.equal(reference.tick(400).ok,true);equalSimulation(game,reference);
 assert.doesNotThrow(()=>parseSave(game.exportSave()));
});

test('fractional live ticks retain reference parity across depletion and an old save migration',()=>{
 const state=screenshotSave();delete state.queue;state.resources.honey=1;state.buildings.hive=1;
 const game=createGame({save:state,now:NOW,storage:null}),reference=referenceFor(state);
 const fractions=[.2,.199,.201,.207,.019,.33,.1011];
 for(let i=0;i<2000;i++){
  const seconds=fractions[i%fractions.length];
  assert.equal(game.tick(seconds).ok,true,`Chapter tick ${i}`);assert.equal(reference.tick(seconds).ok,true,`Reference tick ${i}`);
 }
 equalSimulation(game,reference);assert.ok(game.snapshot().stats.totalDeaths>0);
 assert.doesNotThrow(()=>parseSave(game.exportSave()));
});

test('cancelled deferred settlement restores hungry bears, queued purchases, RNG and the pending duration before retry',async()=>{
 const state=screenshotSave();state.resources.honey=0;state.buildings.hive=0;state.queue.items=[{type:'build',id:'library',amount:1}];
 const storage=storageWith(state),game=loadGame({storage,now:NOW+200_123,deferOffline:true}),before=game.snapshot(),controller=new AbortController();
 let sawPartial=false;
 const cancelled=await game.catchUpAsync(undefined,{signal:controller.signal,onProgress:()=>{
  sawPartial=true;assert.ok(game.snapshot().stats.totalDeaths>before.stats.totalDeaths);assert.equal(game.snapshot().queue.used,0);controller.abort();
 }});
 assert.equal(sawPartial,true);assert.equal(cancelled.ok,false);assert.equal(cancelled.cancelled,true);
 assert.deepEqual(game.snapshot(),before);assert.equal(storage.getItem(constants.SAVE_KEY),storage.initial);assert.equal(storage.writes.length,0);
 assert.equal(game.save().ok,false,'Pending work cannot overwrite the persisted recovery checkpoint');
 const outcome=await game.catchUpAsync();assert.equal(outcome.ok,true,outcome.message);
 const reference=referenceFor(state,NOW+200_123);assert.equal(reference.tick(200).ok,true);equalSimulation(game,reference);
});

test('real deferred settlement validation failure preserves the whole checkpoint and original save bytes',async()=>{
 const state=screenshotSave();state.calendar={year:1e9,season:3,day:99,tick:9,weather:0};state.queue.items=[{type:'build',id:'library',amount:1}];
 const storage=storageWith(state),game=loadGame({storage,now:NOW+6000,deferOffline:true}),before=game.snapshot();
 const outcome=await game.catchUpAsync();
 assert.equal(outcome.ok,false);assert.match(outcome.message,/营地记录超出可保存范围/);
 assert.deepEqual(game.snapshot(),before);assert.equal(storage.getItem(constants.SAVE_KEY),storage.initial);assert.equal(storage.writes.length,0);
 assert.equal(game.save().ok,false);assert.equal(game.act('gather','honey').ok,false);
 assert.deepEqual(loadGame({storage,now:NOW+6000,deferOffline:true}).snapshot(),before,'Reload reads the original checkpoint');
});

test('short fractional pending time clears safely without consuming its existing partial tick',async()=>{
 const state=screenshotSave(),storage=storageWith(state),game=loadGame({storage,now:NOW+321,deferOffline:true});
 assert.equal(game.snapshot().pendingOffline,.321);assert.equal(game.tick(.2).ok,false);
 const outcome=await game.catchUpAsync();assert.equal(outcome.ok,true);assert.equal(outcome.seconds,0);assert.equal(outcome.ticks,0);
 assert.equal(game.snapshot().pendingOffline,0);assert.equal(raw(game).tickRemainder,.375);
 assert.equal(game.tick(.207).ok,true);
 const reference=referenceFor(state,NOW+321);assert.equal(reference.tick(.207).ok,true);equalSimulation(game,reference);
});
