/** Actual main.js handlers in controlled DOM. Event-order regression coverage, not a real-device/browser result. */
import test from 'node:test';
import assert from 'node:assert/strict';
import {createTab,sharedStorage,advance} from './dom-harness.mjs';
import {constants} from '../src/engine/catalog.js';
const honey=tab=>tab.snapshot().resources.find(r=>r.id==='honey').value;
const fixture=edit=>sharedStorage(s=>{s.buildings.hive=20;s.resources.honey=10;s.settings.offline=true;edit?.(s);});
async function hide(tab){tab.doc.hidden=true;await tab.event('visibilitychange');}
async function show(tab){tab.doc.hidden=false;await tab.event('visibilitychange');await tab.drain();}

test('ordinary hidden return settles elapsed time once despite repeated visible notifications',async()=>{
 const tab=await createTab(fixture());await hide(tab);advance(60000);await show(tab);const once=honey(tab);
 assert.ok(once>10);await tab.event('visibilitychange');await tab.drain();assert.equal(honey(tab),once);
});

test('bfcache restore then visibility event cannot settle the same absence twice',async()=>{
 const tab=await createTab(fixture());await hide(tab);await tab.windowEvent('pagehide',{persisted:true});advance(60000);
 tab.doc.hidden=false;await tab.windowEvent('pageshow',{persisted:true});await tab.drain();const once=honey(tab);
 assert.ok(once>10);await tab.event('visibilitychange');await tab.drain();assert.equal(honey(tab),once);
});

test('visibility event before bfcache pageshow also settles the absence once',async()=>{
 const tab=await createTab(fixture());await hide(tab);await tab.windowEvent('pagehide',{persisted:true});advance(60000);
 await show(tab);await tab.windowEvent('pageshow',{persisted:true});await tab.drain();const once=honey(tab);
 assert.ok(once>10);await tab.event('visibilitychange');await tab.drain();assert.equal(honey(tab),once);
});

for(const [name,edit] of [['paused',s=>s.settings.paused=true],['offline disabled',s=>s.settings.offline=false]]){
 test(`${name} remains unchanged during hidden frames and bfcache restore`,async()=>{
  const tab=await createTab(fixture(edit));await hide(tab);advance(60000);tab.step();assert.equal(honey(tab),10);
  await tab.windowEvent('pagehide',{persisted:true});await show(tab);await tab.windowEvent('pageshow',{persisted:true});await tab.drain();assert.equal(honey(tab),10);
 });
}

test('returning bfcache page cannot overwrite another active owner',async()=>{
 const storage=fixture(),old=await createTab(storage);await hide(old);await old.windowEvent('pagehide',{persisted:true});
 const owner=await createTab(storage);await owner.click({act:'gather',id:'honey'});await owner.click({command:'save'});const checkpoint=storage.values.get(constants.SAVE_KEY);
 old.doc.hidden=false;await old.windowEvent('pageshow',{persisted:true});await old.event('visibilitychange');await old.drain();
 await old.click({act:'gather',id:'honey'});await old.click({command:'save'});await old.windowEvent('pagehide');
 assert.equal(storage.values.get(constants.SAVE_KEY),checkpoint);assert.match(old.doc.node('#main-content').innerHTML,/本页暂时只读/);
});

test('reduced-motion choice survives reload and stays separate from game progression',async()=>{
 const storage=fixture(),tab=await createTab(storage);const before=honey(tab);
 assert.equal(tab.doc.documentElement.classList.contains('motion-reduced'),true,'harness reports OS reduced-motion preference');
 await tab.click({command:'motion'});assert.equal(tab.doc.documentElement.classList.contains('motion-reduced'),false);
 assert.equal(JSON.parse(storage.values.get('honeywood-ui-v1')).reducedMotion,false);
 await tab.windowEvent('pagehide');const restored=await createTab(storage);
 assert.equal(restored.doc.documentElement.classList.contains('motion-reduced'),false);assert.equal(honey(restored),before);
 await restored.click({command:'motion'});assert.equal(restored.doc.documentElement.classList.contains('motion-reduced'),true);
});

test('hidden page stops active frames and updates its animation suppression marker',async()=>{
 const tab=await createTab(fixture());await hide(tab);assert.equal(tab.doc.documentElement.classList.contains('scene-hidden'),true);
 advance(60000);tab.step();assert.equal(honey(tab),10);
 await show(tab);assert.equal(tab.doc.documentElement.classList.contains('scene-hidden'),false);assert.ok(honey(tab)>10);
});
