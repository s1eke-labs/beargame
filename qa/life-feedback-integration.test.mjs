/** Actual app handlers with synthetic DOM/history. Does not verify browser layout, focus fidelity or animation. */
import test from 'node:test';
import assert from 'node:assert/strict';
import {createTab,sharedStorage,clickRendered,advance,now} from './dom-harness.mjs';
import {createState,serialize} from '../src/engine/save.js';
import {constants} from '../src/engine/catalog.js';
const bear={id:1,name:'小栗',job:'woodcutter',trait:'none',rank:0,experience:0,skills:{}};
const withBear=s=>{s.ironWill=false;s.buildings.hut=1;s.resources.honey=100;s.bears=[structuredClone(bear)];s.nextBearId=2;s.stats.maxBears=1;s.settings.paused=true;};
const facts=t=>{const v=t.snapshot();return {resources:v.resources,bears:v.bears,calendar:v.calendar,stats:v.stats,buildings:v.buildings,science:v.science,log:v.log,settings:v.settings};};
function historyFor(t){
 let hash='#home',index=0;const entries=[{hash,state:{otherState:'preserve'}}];
 Object.defineProperty(t.location,'hash',{get(){return hash;},set(v){hash=v.startsWith('#')?v:'#'+v;entries.splice(index+1);entries.push({hash,state:null});index++;}});
 t.window.history={get state(){return entries[index].state;},pushState(state,title,url){if(url)hash=new URL(url,'https://example.test').hash;entries.splice(index+1);entries.push({hash,state});index++;},replaceState(state,title,url){if(url)hash=new URL(url,'https://example.test').hash;entries[index]={hash,state};},back(){if(index>0)hash=entries[--index].hash;}};
 return {entries,get index(){return index;},async back(){const before=hash;t.window.history.back();await t.windowEvent('popstate');if(hash!==before)await t.windowEvent('hashchange');}};
}

test('rendered bear opens optional named conversation without changing resources, jobs, navigation or save',async()=>{
 const storage=sharedStorage(withBear),t=await createTab(storage),before=facts(t),saved=storage.values.get(constants.SAVE_KEY),route=t.location.hash;
 const button=await clickRendered(t,{bearId:'1'});assert.equal(button.dataset.nav,'village','the talk handler must take precedence over the existing workplace destination');
 assert.match(t.doc.node('#dialog-root').innerHTML,/bear-talk/);assert.match(t.doc.node('#dialog-root').innerHTML,/小栗/);
 assert.equal(t.location.hash,route);assert.deepEqual(facts(t),before);assert.equal(storage.values.get(constants.SAVE_KEY),saved);
 await t.click({command:'close'});assert.equal(t.doc.node('#dialog-root').innerHTML,'');assert.equal(t.doc.node('#app').inert,false);assert.deepEqual(facts(t),before);
});

test('conversation workplace navigation replaces only the modal history entry and Back returns home',async()=>{
 const t=await createTab(sharedStorage(withBear)),h=historyFor(t),before=facts(t);
 await clickRendered(t,{bearId:'1'});assert.equal(h.index,1);assert.equal(h.entries[1].state.bearDialog,true);
 await clickRendered(t,{nav:'village'},'#dialog-root');assert.deepEqual(h.entries.map(e=>e.hash),['#home','#village']);
 assert.equal(h.entries[1].state.bearDialog,undefined);assert.equal(h.entries[1].state.otherState,'preserve');
 assert.equal(t.doc.node('#dialog-root').innerHTML,'');assert.equal(t.doc.node('#app').inert,false);assert.doesNotMatch(t.doc.node('#main-content').innerHTML,/class="home-view/);
 assert.deepEqual(facts(t),before);await h.back();assert.equal(t.location.hash,'#home');assert.match(t.doc.node('#main-content').innerHTML,/home-view/);assert.deepEqual(facts(t),before);
});

test('dismissing an actual first-arrival story does not mutate the game or navigate',async()=>{
 const storage=sharedStorage(s=>{s.ironWill=false;s.buildings.hut=1;s.resources.honey=100;s.arrival=.99;}),t=await createTab(storage);
 assert.equal(t.doc.node('#story-moment').innerHTML,'');advance(1000);t.step();assert.equal(t.snapshot().bears.value,1);
 assert.match(t.doc.node('#story-moment').innerHTML,/data-story-moment="first-bear"/);const story=t.doc.node('#story-moment').innerHTML,priorGathered=t.snapshot().stats.totalGathered;
 await clickRendered(t,{act:'gather',id:'honey'});assert.ok(t.snapshot().stats.totalGathered>priorGathered);assert.equal(t.doc.node('#story-moment').innerHTML,story,'ordinary gathering must not dismiss the visible story');
 const before=facts(t),route=t.location.hash,saved=storage.values.get(constants.SAVE_KEY);
 await clickRendered(t,{command:'close-story-moment'},'#story-moment');assert.equal(t.doc.node('#story-moment').innerHTML,'');assert.deepEqual(facts(t),before);assert.equal(t.location.hash,route);assert.equal(storage.values.get(constants.SAVE_KEY),saved);
 advance(1000);t.step();assert.equal(t.doc.node('#story-moment').innerHTML,'','ordinary later render must not replay the arrival');
});

test('imported milestones establish a quiet baseline and do not replay on the next ordinary action',async()=>{
 const t=await createTab(sharedStorage()),state=createState(17,now());withBear(state);state.science.construction=true;state.buildings.mine=1;state.buildings.quarry=1;
 const text=serialize(state,now());await t.event('change',{target:{id:'save-file',value:'forest.json',files:[{name:'forest.json',size:Buffer.byteLength(text),text:async()=>text}]}});
 await clickRendered(t,{command:'confirm'},'#dialog-root');assert.equal(t.snapshot().bears.value,1);assert.equal(t.snapshot().science.find(s=>s.id==='construction').completed,true);
 assert.equal(t.doc.node('#story-moment').innerHTML,'');assert.equal(t.doc.node('#dialog-root').innerHTML,'');
 await t.click({act:'gather',id:'honey'});assert.equal(t.doc.node('#story-moment').innerHTML,'');
 advance(1000);t.step();assert.equal(t.doc.node('#story-moment').innerHTML,'');
});
