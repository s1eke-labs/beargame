import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame} from '../src/engine/index.js';
import {createState,serialize} from '../src/engine/save.js';
import {beginUndoAction,finishUndoAction,actUndo,undoView,clearUndo,advanceUndoClock,onUndoDay,consumeUndoTrade,captureUndoSession,restoreUndoSession,UNDO_SECONDS,UNDO_TICKS} from '../src/engine/undo.js';
const raw=g=>JSON.parse(g.export());
const close=(a,b)=>assert.ok(Math.abs(a-b)<Math.max(1e-8,Math.abs(b)*1e-12),`${a} != ${b}`);
const fixture=edit=>{const s=createState(44,100);s.ironWill=false;edit?.(s);return createGame({save:serialize(s,100),storage:null,now:100});};
const assertUnavailable=g=>{const view=g.snapshot().undo;assert.equal(view.pending,false);assert.equal(view.available,false);assert.equal(view.remainingTicks,0);assert.equal(view.remainingSeconds,0);const before=raw(g);assert.equal(g.act('undo').ok,false);assert.deepEqual(raw(g),before);};

test('general undo is unavailable in a fresh or restored game',()=>{const g=fixture();assertUnavailable(g);assert.equal('undo' in raw(g),false);assert.equal(UNDO_SECONDS,0);assert.equal(UNDO_TICKS,0);});
test('receipt hooks never inspect or retain action state, including successful outcomes',()=>{
 const inaccessible=new Proxy({},{get(){throw new Error('Receipt capture must not read state');}});
 for(const type of ['build','sell','stage','craft','refine','trade','embassy','faith','sellFaith','space','sellSpace','time','praise','adore','sacrifice','repairCryochamber','research']){
  assert.equal(beginUndoAction(inaccessible,type,'test','max'),null,type);
  assert.equal(finishUndoAction(inaccessible,inaccessible,{ok:true,success:1}),false,type);
 }
 assert.equal(captureUndoSession(inaccessible),null);
});
test('legacy receipt restore and timer hooks cannot reactivate undo or trade debt',()=>{
 const state=createState(44,100),ctx={state,result:(ok,message)=>({ok,message})},before=structuredClone(state);
 restoreUndoSession(state,{receipt:{type:'build',id:'hive',ticks:100,refunds:{honey:10}},fraction:.5,tradeDebt:10,tradeDays:45});
 for(const seconds of [.1,.2,20,100,NaN,-1])assert.equal(advanceUndoClock(ctx,seconds),false);
 onUndoDay(ctx);clearUndo(ctx);
 assert.equal(consumeUndoTrade(ctx),false);assert.equal(captureUndoSession(state),null);assert.equal(undoView(ctx).pending,false);
 assert.equal(actUndo(ctx,'undo').ok,false);assert.equal(actUndo(ctx,'build'),undefined);assert.deepEqual(state,before);
});
test('purchase commits immediately while ordinary dismantling keeps its half-price refund',()=>{const g=fixture(s=>s.resources.honey=100);assert.equal(g.act('build','hive').ok,true);close(raw(g).resources.honey,90);assertUnavailable(g);assert.equal(raw(g).buildings.hive,1);assert.equal(g.act('sell','hive').ok,true);close(raw(g).resources.honey,95);assert.equal(raw(g).buildings.hive,0);assertUnavailable(g);});
test('repeated stale undo calls never refund, rewind production, RNG, calendar, or statistics',()=>{const g=fixture(s=>s.resources.honey=100);g.act('build','hive');g.tick(2);assert.ok(raw(g).resources.honey>90);for(let i=0;i<30;i++)assertUnavailable(g);});
test('failed actions and gathering create no receipts',()=>{const g=fixture(s=>s.resources.honey=100);assert.equal(g.act('build','barn').ok,false);assertUnavailable(g);assert.equal(g.act('gather','honey').ok,true);assertUnavailable(g);});
test('paused time has no undo countdown and produces no resources',()=>{const g=fixture(s=>s.resources.honey=100);g.act('build','hive');g.setSetting('paused',true);const before=raw(g);g.tick(19.8);g.tick(.2);assert.deepEqual(raw(g),before);assertUnavailable(g);});
test('acceleration still advances production without creating an undo timer',()=>{const g=fixture(s=>{s.resources.honey=100;s.resources.temporalFlux=1000;s.timeState.accelerating=true;});g.act('build','hive');g.tick(10);assert.equal(raw(g).ticks,75);assertUnavailable(g);});
test('craft output and spent inputs commit immediately, respecting capacity',()=>{const g=fixture(s=>{s.resources.honey=100;s.resources.wood=199.75;});assert.equal(g.act('refine','wood').ok,true);assert.equal(raw(g).resources.wood,200);close(raw(g).resources.honey,0);assertUnavailable(g);});
test('research can consume newly crafted output without a reversal route',()=>{const g=fixture(s=>{s.buildings.workshop=1;s.science.philosophy=true;s.resources.science=20000;s.resources.culture=14000;s.resources.parchment=875;});assert.equal(g.act('craft','manuscript',35).ok,true);assert.equal(g.act('research','theology').ok,true);assertUnavailable(g);});
test('ordinary bulk sale commits its original refund',()=>{const g=fixture(s=>{s.buildings.hive=2;s.resources.honey=100;});assert.equal(g.act('sell','hive',2).ok,true);close(raw(g).resources.honey,110.6);assert.equal(raw(g).buildings.hive,0);assertUnavailable(g);});
test('stage conversion commits the selected plan',()=>{const g=fixture(s=>{s.science.ecology=true;s.buildings.pasture=2;s.activeBuildings.pasture=1;});assert.equal(g.act('stage','pasture').ok,true);assert.equal(raw(g).buildingStages.pasture,1);assert.equal(raw(g).buildings.pasture,0);assertUnavailable(g);});
test('saving, loading, importing, and resetting never create a receipt',()=>{const g=fixture(s=>s.resources.honey=100);g.act('build','hive');const text=g.export();g.save();assertUnavailable(g);const reload=createGame({save:text,storage:null,now:100});assertUnavailable(reload);assert.equal(g.importSave(text).ok,true);assertUnavailable(g);assert.equal(g.act('reset','confirm').ok,true);assertUnavailable(g);});
test('time upgrades and cryochamber repair commit their own accounting',()=>{const g=fixture(s=>{s.workshop.chronoforge=true;s.resources.timeCrystal=105;s.resources.void=500;s.resources.temporalFlux=3000;s.usedCryochambers=1;});assert.equal(g.act('time','temporalBattery').ok,true);assert.equal(raw(g).time.temporalBattery,1);assertUnavailable(g);assert.equal(g.act('repairCryochamber','one').ok,true);assert.equal(raw(g).usedCryochambers,0);assert.equal(raw(g).time.cryochambers,1);assertUnavailable(g);});
test('praise and adore commit their faith accounting',()=>{const g=fixture(s=>{s.science.theology=true;s.resources.faith=100;s.religion.apocripha=1;s.praised=1000;});assert.equal(g.act('praise').ok,true);assert.ok(raw(g).praised>1000);assertUnavailable(g);assert.equal(g.act('adore').ok,true);assertUnavailable(g);});
test('embassy, worship, mythic, and pact purchases remain committed',()=>{
 const cases=[['embassy','lizards','embassies',s=>{s.science.writing=true;s.discoveries.lizards=true;s.resources.culture=100;}],['faith','solarchant','religion',s=>{s.science.theology=true;s.resources.faith=100;s.praised=150;}],['faith','unicornTomb','religion',s=>{s.buildings.ziggurat=1;s.resources.ivory=500;s.resources.tears=5;}],['faith','pactOfCleansing','religion',s=>{s.religion.mausoleum=1;s.resources.relic=100;s.religionCounters.pactDebt=2;}]];
 for(const [type,id,bucket,edit]of cases){const g=fixture(edit);assert.equal(g.act(type,id).ok,true,id);assert.equal(raw(g)[bucket][id],1);assertUnavailable(g);if(id==='pactOfCleansing')close(raw(g).religionCounters.pactDebt,2.5);}
});
test('sacrifice conversion remains committed',()=>{const g=fixture(s=>{s.buildings.ziggurat=1;s.resources.unicorns=2500;});assert.equal(g.act('sacrifice','unicorns').ok,true);close(raw(g).resources.unicorns,0);assertUnavailable(g);});
test('planet construction retains spent launch fuel and facility ownership',()=>{const g=fixture(s=>{s.space.orbitalLaunch=1;s.spaceReached.orbitalLaunch=true;s.science.sattelites=true;s.resources.titanium=2500;s.resources.oil=15000;s.resources.science=100000;s.resources.starchart=325;});assert.equal(g.act('space','sattelite').ok,true);assert.equal(raw(g).space.sattelite,1);assert.equal(raw(g).resources.oil,0);assertUnavailable(g);});
test('stale undo attempts cannot reroll trade RNG or penalize the next paid trade',()=>{
 const edit=s=>{s.buildings.barn=10;s.discoveries.lizards=true;s.resources.manpower=100;s.resources.gold=30;s.resources.minerals=2000;},g=fixture(edit),control=fixture(edit);
 assert.deepEqual(g.act('trade','lizards'),control.act('trade','lizards'));assertUnavailable(g);
 assert.deepEqual(g.act('trade','lizards'),control.act('trade','lizards'));assert.deepEqual(raw(g),raw(control));
});
test('raw trade output still respects storage caps and has no free retry',()=>{const g=fixture(s=>{s.discoveries.lizards=true;s.resources.manpower=50;s.resources.gold=15;s.resources.minerals=1000;});const traded=g.act('trade','lizards');assert.ok(traded.gains.wood>200);assert.equal(raw(g).resources.wood,200);assertUnavailable(g);assert.equal(g.act('trade','lizards').ok,false);});
test('async offline settlement keeps undo unavailable before, during and after catch-up',async()=>{const g=fixture(s=>s.resources.honey=100);g.act('build','hive');assertUnavailable(g);const pending=g.catchUpAsync(10);assert.equal(g.act('undo').ok,false);assert.equal(g.snapshot().undo.available,false);assert.equal((await pending).ok,true);assertUnavailable(g);});
test('worship sale commits sold ranks and original half-price refund',()=>{const g=fixture(s=>{s.buildings.temple=10;s.religion.transcendence=1;s.religion.solarchant=3;});assert.equal(g.act('sellFaith','solarchant','max').ok,true);assert.equal(raw(g).religion.solarchant,1);close(raw(g).resources.faith,437.5);assertUnavailable(g);});
test('planet sale commits refund without returning fuel',()=>{const g=fixture(s=>{s.space.hydroponics=2;s.resources.unobtainium=0;s.resources.kerosene=0;});assert.equal(g.act('sellSpace','hydroponics','max').ok,true);assert.equal(raw(g).space.hydroponics,0);assert.ok(raw(g).resources.unobtainium>0);assert.equal(raw(g).resources.kerosene,0);assertUnavailable(g);});
