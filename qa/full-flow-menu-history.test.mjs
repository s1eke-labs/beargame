/** Real main.js handlers plus explicitly modeled hash/history stack; no browser/layout engine. */
import test from 'node:test';import assert from 'node:assert/strict';
import {createTab,sharedStorage,clickRendered} from './dom-harness.mjs';
function modelHistory(t){
 let hash='#home',index=0,replaces=0;const entries=[{hash,state:{otherState:'preserve'}}];
 Object.defineProperty(t.location,'hash',{get(){return hash;},set(v){const normalized=v.startsWith('#')?v:'#'+v;if(normalized===hash)return;hash=normalized;entries.splice(index+1);entries.push({hash,state:null});index++;}});
 t.window.history={get state(){return entries[index].state;},pushState(state,title,url){if(url)hash=new URL(url,'https://example.test/'+hash).hash;entries.splice(index+1);entries.push({hash,state});index++;},replaceState(state,title,url){if(url)hash=new URL(url,'https://example.test/'+hash).hash;entries[index]={hash,state};replaces++;},back(){if(index>0){index--;hash=entries[index].hash;}}};
 return {entries,get index(){return index;},get replaces(){return replaces;},async back(){const previous=hash;t.window.history.back();await t.windowEvent('popstate');if(hash!==previous)await t.windowEvent('hashchange');}};
}
for(const [name,query,destination,expectedContent] of [['system',{system:'achievements'},'#more/achievements',/achievement-section/],['crafts fallback',{system:'crafts'},'#more/crafts',/recipe-workbench/]]){
 test(`legacy explore-menu ${name} replaces only its modal entry and Back skips no empty visit`,async()=>{
  const t=await createTab(sharedStorage(s=>s.settings.paused=true)),h=modelHistory(t);
  t.location.hash='#home/map';await t.windowEvent('hashchange');
  t.window.history.replaceState({otherState:'preserve'},'');const beforeReplaces=h.replaces;
  await t.click({command:'explore-menu'});assert.equal(h.entries.at(-1).state.bearDialog,true);
  await clickRendered(t,query,'#dialog-root');
  assert.deepEqual(h.entries.map(e=>e.hash),['#home','#home/map',destination]);assert.equal(h.replaces,beforeReplaces+1);
  assert.notEqual(h.entries.at(-1).state?.bearDialog,true);assert.equal(h.entries.at(-1).state?.otherState,'preserve');
  assert.equal(t.doc.node('#dialog-root').innerHTML,'');assert.equal(t.doc.node('#app').inert,false);
  assert.match(t.doc.node('#main-content').innerHTML,expectedContent,'replaceState does not emit hashchange, so helper must render immediately');
  await h.back();assert.equal(t.location.hash,'#home/map');assert.match(t.doc.node('#main-content').innerHTML,/world-map-scroll/);
  await h.back();assert.equal(t.location.hash,'#home');assert.match(t.doc.node('#main-content').innerHTML,/home-view/);
 });
}
test('shared Home region map return still pushes a normal hash route',async()=>{
 const t=await createTab(sharedStorage(s=>{s.settings.paused=true;s.buildings.workshop=1;s.buildings.lumberMill=1;})),h=modelHistory(t);
 t.location.hash='#home/crafts';await t.windowEvent('hashchange');const before=h.replaces;
 assert.match(t.doc.node('#main-content').innerHTML,/data-home-district="crafts"/);
 await clickRendered(t,{nav:'map'});await t.windowEvent('hashchange');
 assert.deepEqual(h.entries.map(e=>e.hash),['#home','#home/crafts','#home/map']);assert.equal(h.replaces,before);
 assert.match(t.doc.node('#main-content').innerHTML,/world-map-scroll/);
});
for(const query of [{system:'achievements'},{system:'crafts'}])test(`no-history fallback closes menu and navigates ${JSON.stringify(query)}`,async()=>{
 const t=await createTab(sharedStorage(s=>s.settings.paused=true));assert.equal(t.window.history,undefined);
 t.location.hash='#home/map';await t.windowEvent('hashchange');await t.click({command:'explore-menu'});
 await clickRendered(t,query,'#dialog-root');assert.equal(t.doc.node('#dialog-root').innerHTML,'');assert.equal(t.doc.node('#app').inert,false);
 const target='more/'+query.system;assert.equal(t.location.hash,target);
 // Real location normalizes assigned hashes and dispatches hashchange; the stock harness does neither.
 t.location.hash='#'+target;await t.windowEvent('hashchange');assert.match(t.doc.node('#main-content').innerHTML,query.system==='achievements'?/achievement-section/:/recipe-workbench/);
});
for(const dismissal of ['Escape','Back'])test(`menu ${dismissal} consumes modal history entry and leaves map interactive`,async()=>{
 const t=await createTab(sharedStorage(s=>s.settings.paused=true)),h=modelHistory(t);
 t.location.hash='#home/map';await t.windowEvent('hashchange');await t.click({command:'explore-menu'});assert.equal(h.index,2);
 if(dismissal==='Escape')await t.event('keydown',{key:'Escape',preventDefault(){}});else await h.back();
 assert.equal(h.index,1);assert.equal(t.location.hash,'#home/map');assert.equal(t.doc.node('#dialog-root').innerHTML,'');assert.equal(t.doc.node('#app').inert,false);
 await h.back();assert.equal(t.location.hash,'#home');assert.match(t.doc.node('#main-content').innerHTML,/home-view/);
});
