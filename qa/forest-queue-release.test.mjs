/** Queue acceptance against the emitted public chapter, not the private source. */
import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame,parseSave} from '../dist/src/chapters/forest/engine.js';
const make=()=>createGame({now:1000000,seed:123,storage:null});

test('emitted chapter exposes the queue at the start and executes an earned purchase',()=>{
 const g=make();assert.equal(g.snapshot().queue.capacity,3);
 assert.deepEqual(g.snapshot().queue.options.map(c=>c.id),['build:hive','build:hut','build:library']);
 assert.equal(g.act('queueEnqueue','build:hive').ok,true);
 assert.equal(g.snapshot().resources.find(r=>r.id==='honey').value,0);
 for(let i=0;i<10;i++)assert.equal(g.act('gather','honey').ok,true);
 assert.equal(g.tick(.2).ok,true);
 assert.equal(g.snapshot().buildings.find(b=>b.id==='hive').owned,1);
 assert.equal(g.snapshot().queue.used,0);
});

test('emitted chapter migrates old chapter saves without resetting their progress',()=>{
 const g=make();g.act('gather','honey',1);const old=JSON.parse(g.exportSave());delete old.queue;
 const result=parseSave(JSON.stringify(old),1000000);assert.deepEqual(result.queue,{items:[],sources:{buildings:true}});
 assert.equal(result.resources.honey,1);assert.equal(result.rng,old.rng);assert.deepEqual(result.calendar,old.calendar);
});

test('emitted queued progress survives a save roundtrip and pause',()=>{
 const g=make();g.act('queueEnqueue','build:hut');g.setSetting('paused',true);
 const save=g.exportSave();const h=createGame({save,now:1000000,storage:null});
 const loaded=h.exportSave();assert.deepEqual(JSON.parse(loaded),parseSave(save,1000000));
 assert.equal(h.tick(30).ticks,0);assert.equal(h.exportSave(),loaded);
 assert.equal(h.act('queueRemove','0','max').ok,true);assert.equal(h.snapshot().queue.used,0);
});

test('emitted queue rejects future content in both actions and imports atomically',()=>{
 const g=make();const before=g.exportSave();assert.equal(g.act('queueEnqueue','build:reactor').ok,false);assert.equal(g.exportSave(),before);
 const bad=JSON.parse(before);bad.queue.items=[{type:'build',id:'reactor',amount:1}];assert.equal(g.importSave(JSON.stringify(bad)).ok,false);assert.equal(g.exportSave(),before);
});
