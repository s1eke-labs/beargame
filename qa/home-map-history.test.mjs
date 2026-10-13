/** Executes the real main.js handlers with an explicit browser-history model (no layout engine). */
import test from 'node:test';
import assert from 'node:assert/strict';
import {createTab,sharedStorage,clickRendered,renderedButton} from './dom-harness.mjs';

function historyModel(t){
 let hash='#home',index=0;const entries=[{hash,state:null}];
 Object.defineProperty(t.location,'hash',{get:()=>hash,set(value){const next=value.startsWith('#')?value:'#'+value;if(next===hash)return;hash=next;entries.splice(index+1);entries.push({hash,state:null});index++;}});
 t.window.history={get state(){return entries[index].state;},pushState(state,title,url){if(url)hash=new URL(url,'https://example.test/'+hash).hash;entries.splice(index+1);entries.push({hash,state});index++;},replaceState(state,title,url){if(url)hash=new URL(url,'https://example.test/'+hash).hash;entries[index]={hash,state};},back(){if(index){index--;hash=entries[index].hash;}},forward(){if(index<entries.length-1){index++;hash=entries[index].hash;}}};
 return {entries,get index(){return index;},async move(direction){const before=hash;t.window.history[direction]();await t.windowEvent('popstate');if(hash!==before)await t.windowEvent('hashchange');}};
}
const main=t=>t.doc.node('#main-content').innerHTML;
const resources=t=>t.snapshot().resources.map(r=>[r.id,r.value]);
const route=async(t,hash)=>{t.location.hash=hash;await t.windowEvent('hashchange');};
const click=async(t,query,root)=>{const hash=t.location.hash;await clickRendered(t,query,root);if(hash!==t.location.hash)await t.windowEvent('hashchange');};
const fixture=()=>createTab(sharedStorage(s=>{s.settings.paused=true;s.buildings.workshop=1;s.buildings.lumberMill=1;s.resources.honey=100;}));
const activeNav=(t,id)=>{const control=renderedButton(t,{nav:id},'.bottom-nav');assert.equal(control.attrs['aria-current'],'page');};

test('bottom More opens functions directly; system return restores hub and Back/Forward has no modal duplicates',async()=>{
 const t=await fixture(),h=historyModel(t),before=resources(t);
 await click(t,{nav:'more'},'.bottom-nav');assert.equal(t.location.hash,'#more');assert.match(main(t),/class="more-hub"/);assert.doesNotMatch(main(t),/world-map-view|world-map-scroll/);activeNav(t,'more');
 await click(t,{system:'crafts'});assert.equal(t.location.hash,'#more/crafts');assert.match(main(t),/recipe-workbench/);assert.match(main(t),/返回更多/);assert.equal(t.doc.node('#dialog-root').innerHTML,'');
 await click(t,{system:''});assert.equal(t.location.hash,'#more');assert.match(main(t),/class="more-hub"/);
 assert.deepEqual(h.entries.map(e=>e.hash),['#home','#more','#more/crafts','#more']);assert.ok(h.entries.every(e=>!e.state?.bearDialog));
 const count=h.entries.length;await h.move('back');assert.equal(t.location.hash,'#more/crafts');assert.match(main(t),/recipe-workbench/);await h.move('back');assert.equal(t.location.hash,'#more');assert.match(main(t),/class="more-hub"/);await h.move('forward');assert.equal(t.location.hash,'#more/crafts');assert.match(main(t),/recipe-workbench/);assert.equal(h.entries.length,count);assert.deepEqual(resources(t),before);
});

test('Home world map keeps Home active, closes to last district, and region navigation stays resource-free',async()=>{
 const t=await fixture(),h=historyModel(t),before=resources(t);
 await route(t,'#home/crafts');await click(t,{nav:'map'});assert.equal(t.location.hash,'#home/map');assert.match(main(t),/world-map-scroll/);assert.doesNotMatch(main(t),/data-command="explore-menu"|class="more-hub"/);activeNav(t,'home');
 await click(t,{nav:'home'});assert.equal(t.location.hash,'#home/crafts');assert.match(main(t),/data-home-district="crafts"/);
 await click(t,{nav:'map'});await click(t,{homeRegion:'village'});assert.equal(t.location.hash,'#home/village');assert.match(main(t),/data-home-district="village"/);
 const count=h.entries.length;await h.move('back');assert.equal(t.location.hash,'#home/map');assert.match(main(t),/world-map-scroll/);activeNav(t,'home');await h.move('forward');assert.equal(t.location.hash,'#home/village');assert.match(main(t),/data-home-district="village"/);assert.equal(h.entries.length,count);assert.deepEqual(resources(t),before);
});

test('canonical map and legacy map root remain maps; legacy regional alias retains the shared Home scene',async()=>{
 const t=await fixture();historyModel(t);const before=resources(t);
 for(const hash of ['#home/map','#more/map']){await route(t,hash);assert.match(main(t),/world-map-scroll/);assert.doesNotMatch(main(t),/class="more-hub"/);activeNav(t,'home');}
 await route(t,'#more/map/crafts');assert.match(main(t),/home-view/);assert.match(main(t),/data-home-district="crafts"/);assert.doesNotMatch(main(t),/world-map-scroll/);const scene=main(t);await route(t,'#home/crafts');assert.equal(main(t),scene);assert.deepEqual(resources(t),before);
});
