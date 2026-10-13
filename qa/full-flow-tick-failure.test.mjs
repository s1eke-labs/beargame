/** Actual main.js and engine via controlled synthetic DOM; no patched runtime and no browser. */
import test from 'node:test';import assert from 'node:assert/strict';
import {createTab,sharedStorage,advance} from './dom-harness.mjs';
import {constants} from '../src/engine/catalog.js';
const boundary=s=>{s.settings.offline=false;s.settings.paused=false;s.resources.honey=100;s.buildings.hive=1;s.calendar.year=1e9;s.calendar.season=3;s.calendar.day=99;s.calendar.tick=9;};
const facts=v=>({calendar:v.calendar,resources:v.resources.map(r=>[r.id,r.value]),buildings:v.buildings.map(b=>[b.id,b.owned]),bears:v.bears.individuals,queue:v.queue.items,heat:v.progression.heat,furnaceHeat:v.progression.furnaceHeat,ticks:v.ticks});
function traceToast(t){let writes=0,text=t.doc.node('#toast').textContent;Object.defineProperty(t.doc.node('#toast'),'textContent',{get(){return text;},set(v){text=v;writes++;},configurable:true});return()=>writes;}
for(const [name,edit,delay] of [['ordinary terminal-calendar tick',boundary,200],['visible long-frame gap with offline disabled',boundary,6000],['automatic furnace overflow',s=>{boundary(s);s.calendar.season=0;s.calendar.day=0;s.calendar.tick=0;s.time.blastFurnace=1;s.timeState.furnaceEnabled=true;s.timeState.furnaceHeat=100;},200]]){
 test(`${name}: pause, notify once, preserve progress and save stable paused state`,async()=>{
  const storage=sharedStorage(edit),t=await createTab(storage),before=facts(t.snapshot()),toastWrites=traceToast(t);
  advance(delay);assert.doesNotThrow(()=>t.step());
  assert.equal(t.snapshot().settings.paused,true);assert.deepEqual(facts(t.snapshot()),before);
  assert.match(t.doc.node('#toast').textContent,/时间推进中断，原有进度已恢复/);assert.equal(toastWrites(),1);
  for(let i=0;i<100;i++){advance(200);assert.doesNotThrow(()=>t.step());}
  assert.equal(toastWrites(),1,'paused frames must not repeat the failure toast');assert.deepEqual(facts(t.snapshot()),before);
  const saved=JSON.parse(storage.values.get(constants.SAVE_KEY));assert.equal(saved.settings.paused,true);assert.equal(saved.calendar.year,1e9);assert.equal(saved.resources.honey,100);
  assert.match(t.doc.node('#pause-indicator').innerHTML,/已暂停/);
 });
}
test('manual resume retries once and automatically pauses again without progress loss',async()=>{
 const t=await createTab(sharedStorage(boundary)),before=facts(t.snapshot()),writes=traceToast(t);advance(200);t.step();assert.equal(writes(),1);
 advance(1200);t.step();await t.click({command:'pause'});assert.equal(t.snapshot().settings.paused,false);advance(200);t.step();
 assert.equal(t.snapshot().settings.paused,true);assert.equal(writes(),2);assert.deepEqual(facts(t.snapshot()),before);
 advance(200);t.step();assert.equal(writes(),2);
});
