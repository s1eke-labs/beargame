/** Independent checks against the current checkout. Real handlers, explicitly modeled DOM/history. */
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createGame,catalog} from '../src/engine/index.js';
import {createState,serialize} from '../src/engine/save.js';
import {stageBuildingIds} from '../src/engine/building-stages.js';
import {districts,geographicRegions,geographicBuildingId} from '../src/ui/districts.js';
import {page,world,sceneGroups,cardsFor,explorationMenu,systemOpen} from '../src/ui/render.js';
import {continuousLot} from '../src/ui/scene.js';
import {createTab,sharedStorage,clickRendered,renderedButton,advance} from './dom-harness.mjs';

const facilityKey=b=>`${b.section}:${b.id}`;
const facilityList=items=>items.map(b=>[facilityKey(b),b.owned,b.stage||0]).sort((a,b)=>a[0].localeCompare(b[0]));
const ids=html=>[...html.matchAll(/data-scene-building="([^"]+)"/g)].map(m=>m[1]);
const details=html=>[...html.matchAll(/\bdata-detail="([^"]+)"[^>]*\bdata-scene-building=/g)].map(m=>m[1]).sort();
const actions=html=>[...(html.split('<div class="game-sheet-body">')[1]||html).matchAll(/\bdata-act="([^"]+)"[^>]*\bdata-id="([^"]+)"/g)].map(m=>`${m[1]}:${m[2]}`).sort();
const vmFrom=(edit=()=>{})=>{const s=createState(17,0);s.settings.paused=true;edit(s);return createGame({storage:null,save:serialize(s,0),now:0}).snapshot();};
const sevenVsSix=s=>{for(const id of ['hive','hut','library','barn','pasture','logHouse','mansion','academy'])s.buildings[id]=1;s.resources.honey=100;s.resources.wood=20;s.settings.paused=true;};
const developed=(s,staged=false)=>{for(const b of catalog.buildings)s.buildings[b.id]=1+(catalog.buildings.indexOf(b)%4);for(const c of catalog.science)s.science[c.id]=true;for(const c of catalog.space)s.space[c.id]=1;for(const c of catalog.time)s.time[c.id]=1;if(staged)for(const id of stageBuildingIds)s.buildingStages[id]=1;s.ironWill=false;s.discoveries.lizards=true;s.resources.honey=100;s.resources.wood=30;s.settings.paused=true;};
const ui=(district='village',overrides={})=>({page:'home',district,region:'',regionSite:'',system:'',...overrides});
const readMain=t=>t.doc.node('#main-content').innerHTML;
const route=async(t,hash)=>{t.location.hash=hash.startsWith('#')?hash:'#'+hash;await t.windowEvent('hashchange');};
const clickRoute=async(t,query,root)=>{const before=t.location.hash;await clickRendered(t,query,root);if(t.location.hash!==before)await t.windowEvent('hashchange');};
const clickExploreRegion=async(t,id)=>{const html=readMain(t),start=html.indexOf('<div class="world-map-view');assert.ok(start>=0,'Explore map is rendered');t.doc.node('#qa-map').innerHTML=html.slice(start);await clickRoute(t,{homeRegion:id},'#qa-map');};
const resourceValues=t=>t.snapshot().resources.map(r=>[r.id,r.value]);
const boardRegion=html=>html.match(/data-home-district="([^"]+)"/)?.[1];
function assertSharedPartition(vm){
 const before=JSON.stringify(vm),regions=geographicRegions(vm),groups=sceneGroups(vm);
 assert.deepEqual(groups.map(g=>g.id),regions.map(r=>r.id),'Home and Explore region IDs/order match');
 const allExpected=[...vm.buildings.filter(b=>b.owned>0).map(b=>({...b,section:'buildings'})),...cardsFor(vm,'space').filter(b=>b.owned>0&&!b.travelDays).map(b=>({...b,section:'space'})),...cardsFor(vm,'time').filter(b=>b.owned>0).map(b=>({...b,section:'time'}))];
 const allActual=groups.flatMap(g=>g.cards);
 assert.deepEqual(facilityList(allActual),facilityList(allExpected),'Every owned physical facility appears exactly once globally');
 assert.equal(new Set(allActual.map(facilityKey)).size,allActual.length,'No duplicate facility identity');
 for(const r of regions){
  const g=groups.find(g=>g.id===r.id),html=world(vm,ui(r.id));
  assert.deepEqual(facilityList(g.cards),facilityList(r.facilities),`${r.id}: same identity, owned counts and stages`);
  assert.equal(g.cards.reduce((sum,b)=>sum+b.owned,0),r.facilities.reduce((sum,b)=>sum+b.owned,0),`${r.id}: aggregate quantity`);
  assert.equal(boardRegion(html),r.id);
  assert.deepEqual(details(html),r.facilities.map(facilityKey).sort(),`${r.id}: rendered Home equals shared region`);
  assert.equal(ids(html).length,r.facilities.length);
  assert.equal(new Set(g.cards.map(b=>b.sceneSlot)).size,g.cards.length,`${r.id}: lots are unique`);
  assert.ok(g.cards.every(b=>Number.isInteger(b.sceneSlot)&&b.sceneSlot>=0),`${r.id}: fixed nonnegative integer lots`);
 }
 const map=page(vm,ui('village',{page:'map'}));
 const targets=[...map.slice(map.indexOf('<div class="world-map-view')).matchAll(/\bdata-home-region="([^"]+)"/g)].map(m=>m[1]);
 assert.deepEqual(targets,regions.map(r=>r.id),'Explore has one canonical Home destination per region');
 assert.equal(JSON.stringify(vm),before,'Rendering never mutates snapshot');
}

// Model the browser's hash/history behavior without claiming layout/browser coverage.
function modelHistory(t){
 let hash='#home',index=0,replaces=0;const entries=[{hash,state:{preserved:'yes'}}];
 Object.defineProperty(t.location,'hash',{configurable:true,get(){return hash;},set(value){const normalized=value.startsWith('#')?value:'#'+value;if(normalized===hash)return;hash=normalized;entries.splice(index+1);entries.push({hash,state:null});index++;}});
 t.window.history={get state(){return entries[index].state;},pushState(state,title,url){if(url)hash=new URL(url,'https://example.test/'+hash).hash;entries.splice(index+1);entries.push({hash,state});index++;},replaceState(state,title,url){if(url)hash=new URL(url,'https://example.test/'+hash).hash;entries[index]={hash,state};replaces++;},back(){if(index>0){index--;hash=entries[index].hash;}},forward(){if(index+1<entries.length){index++;hash=entries[index].hash;}}};
 return {entries,get index(){return index;},get replaces(){return replaces;},async back(){const previous=hash;t.window.history.back();await t.windowEvent('popstate');if(hash!==previous)await t.windowEvent('hashchange');},async forward(){const previous=hash;t.window.history.forward();await t.windowEvent('popstate');if(hash!==previous)await t.windowEvent('hashchange');}};
}

// The stock fixture returns a node for absent selectors. Scope known scene/map nodes
// to rendered markup and recreate them on innerHTML updates for meaningful scroll tests.
function modelScrollNodes(t){
 const main=t.doc.node('#main-content'),app=t.doc.node('#app'),originalQuery=app.querySelector.bind(app),descriptor=Object.getOwnPropertyDescriptor(Object.getPrototypeOf(main),'innerHTML');
 let epoch=0,nodes={};const decode=s=>(s||'').replaceAll('&quot;','"').replaceAll('&amp;','&').replaceAll('&#39;',"'").replaceAll('&lt;','<').replaceAll('&gt;','>');
 function create(){epoch++;const html=descriptor.get.call(main);nodes={};
  const board=html.match(/<section\b[^>]*data-world-key="([^"]*)"[^>]*data-home-district="([^"]+)"[^>]*>/);
  if(board){const b=t.doc.node(`scroll-model:${epoch}:board`),scene=t.doc.node(`scroll-model:${epoch}:scene`);b.dataset={worldKey:decode(board[1]),homeDistrict:board[2]};b.scene=scene;b.serial=html.match(/<section\b[^>]*class="world-board[\s\S]*?<\/section>/)?.[0];scene.closest=selector=>selector==='.world-board'?b:null;nodes['.world-board']=b;nodes['.world-board[data-home-district] .world-scene']=scene;}
  const map=html.match(/<div\b[^>]*class="world-map-view[^>]*data-world-map-key="([^"]*)"/);
  if(map){const m=t.doc.node(`scroll-model:${epoch}:map`),scroll=t.doc.node(`scroll-model:${epoch}:map-scroll`);m.dataset={worldMapKey:decode(map[1])};m.scroll=scroll;m.serial=html.slice(map.index);nodes['.world-map-view']=m;nodes['.world-map-scroll']=scroll;}
  if(html.includes('data-world-placeholder'))nodes['[data-world-placeholder]']={replaceWith(old){nodes['.world-board']=old;nodes['.world-board[data-home-district] .world-scene']=old.scene;main._html=main._html.replace('<div data-world-placeholder></div>',old.serial);}};
  if(html.includes('data-map-placeholder'))nodes['[data-map-placeholder]']={replaceWith(old){nodes['.world-map-view']=old;nodes['.world-map-scroll']=old.scroll;main._html=main._html.replace('<div data-map-placeholder></div>',old.serial);}};
 }
 Object.defineProperty(main,'innerHTML',{configurable:true,get(){return descriptor.get.call(main);},set(value){descriptor.set.call(main,value);create();}});
 const scoped=new Set(['.world-board','.world-board[data-home-district] .world-scene','.world-map-view','.world-map-scroll','.regional-map','.district-sites-scroll','.region-action-body','[data-world-placeholder]','[data-map-placeholder]','[data-region-placeholder]']);
 app.querySelector=selector=>scoped.has(selector)?nodes[selector]||null:originalQuery(selector);
 create();return {get home(){return nodes['.world-board[data-home-district] .world-scene'];},get map(){return nodes['.world-map-scroll'];}};
}

test('reported seven-versus-six fixture is one partition: village six, learning two',()=>{
 const vm=vmFrom(sevenVsSix),regions=geographicRegions(vm);
 assert.equal(regions.find(r=>r.id==='village').facilities.length,6);
 assert.equal(regions.find(r=>r.id==='learning').facilities.length,2);
 assertSharedPartition(vm);
 assert.ok(!sceneGroups(vm).find(g=>g.id==='village').cards.some(b=>b.id==='library'));
 assert.deepEqual(sceneGroups(vm).find(g=>g.id==='learning').cards.map(b=>b.id).sort(),['academy','library']);
});
for(const staged of [false,true])test(`all built facilities agree across Home and Explore, stage upgrades ${staged?'on':'off'}`,()=>assertSharedPartition(vmFrom(s=>developed(s,staged))));
for(const mask of Array.from({length:32},(_,i)=>i))test(`all five stage conversions remain unique across views: combination ${mask}`,()=>{
 const vm=vmFrom(s=>{developed(s);for(let i=0;i<stageBuildingIds.length;i++)s.buildingStages[stageBuildingIds[i]]=(mask>>i)&1;});
 assertSharedPartition(vm);
 for(const id of stageBuildingIds){const b=vm.buildings.find(b=>b.id===id),region=geographicRegions(vm).find(r=>r.facilities.some(c=>c.section==='buildings'&&c.id===id)),semanticId=geographicBuildingId(b),expected=districts.find(d=>d.facilities.includes(semanticId));assert.equal(region.id,geographicRegions(vm).some(r=>r.id===expected.id)?expected.id:'village',`${id} uses stage-aware geographic owner or singleton merge`);}
});
test('primary facilities keep reserved lots through acquisition, sale and count changes',()=>{
 const base=vmFrom(s=>developed(s,true));
 for(const cfg of districts){
  const group=sceneGroups(base).find(g=>g.id===cfg.id);assert.ok(group,cfg.id);
  const primary=group.cards.filter(b=>b.section==='buildings'&&cfg.facilities.includes(geographicBuildingId(b)));
  for(const b of primary){assert.equal(b.sceneSlot,cfg.facilities.indexOf(geographicBuildingId(b)),`${cfg.id}/${b.id}: fixed primary slot`);const lot=continuousLot(b.sceneSlot);assert.match(world(base,ui(cfg.id)),new RegExp(`--y:${lot.y}px;`));}
  const sparse=structuredClone(base),keep=new Set(primary.slice(0,2).map(b=>b.id));
  // Keep the district active; remove non-primary facilities everywhere without moving primary slots.
  if(keep.size<2)continue;
  for(const b of sparse.buildings)if(!keep.has(b.id))b.owned=0;
  for(const c of cardsFor(sparse,'space'))c.owned=0;for(const c of cardsFor(sparse,'time'))c.owned=0;
  for(const b of sparse.buildings)if(keep.has(b.id))b.owned=99;
  const sparseGroup=sceneGroups(sparse).find(g=>g.id===cfg.id);assert.ok(sparseGroup,cfg.id);
  for(const b of sparseGroup.cards)assert.equal(b.sceneSlot,group.cards.find(c=>facilityKey(c)===facilityKey(b)).sceneSlot,`${cfg.id}/${b.id} did not shift`);
 }
});
test('singleton systems, singleton space/time and empty state merge without losing facilities',()=>{
 const empty=vmFrom();assertSharedPartition(empty);assert.deepEqual(sceneGroups(empty).map(g=>g.id),['village']);
 const vm=vmFrom(s=>{s.buildings.workshop=3;s.space.sattelite=2;s.time.temporalBattery=1;});assertSharedPartition(vm);assert.deepEqual(sceneGroups(vm).map(g=>g.id),['village']);assert.equal(sceneGroups(vm)[0].cards.length,3);
});

test('every Explore region opens its identical canonical Home scene without changing resources',async()=>{
 const t=await createTab(sharedStorage(s=>developed(s,true))),h=modelHistory(t),before=resourceValues(t),vm=t.snapshot();
 for(const r of geographicRegions(vm)){
  await route(t,'#home/map');await clickExploreRegion(t,r.id);assert.equal(t.location.hash,`#home/${r.id}`);assert.equal(boardRegion(readMain(t)),r.id);assert.doesNotMatch(readMain(t),/class="regional-map|class="district-floor/);assert.deepEqual(details(readMain(t)),r.facilities.map(facilityKey).sort());
  const board=world(vm,ui(r.id));assert.ok(/data-nav="map"|data-system=""/.test(board),'Home toolbar provides Explore return');
 }
 assert.deepEqual(resourceValues(t),before);assert.ok(h.entries.length>10);
});
test('Home region tabs update canonical routes, preserve Back/Forward and cannot mutate resources',async()=>{
 const t=await createTab(sharedStorage(sevenVsSix)),h=modelHistory(t),before=resourceValues(t);await route(t,'#home/village');await clickRoute(t,{homeRegion:'learning'});assert.equal(t.location.hash,'#home/learning');assert.equal(boardRegion(readMain(t)),'learning');await h.back();assert.equal(t.location.hash,'#home/village');assert.equal(boardRegion(readMain(t)),'village');await h.forward();assert.equal(boardRegion(readMain(t)),'learning');assert.deepEqual(resourceValues(t),before);
});
test('all active legacy region base links resolve to canonical Home rather than a second map',async()=>{
 const t=await createTab(sharedStorage(s=>developed(s,true)));modelHistory(t);const before=resourceValues(t);
 for(const r of geographicRegions(t.snapshot())){await route(t,`#more/map/${r.id}`);assert.equal(boardRegion(readMain(t)),r.id,r.id);assert.match(readMain(t),/home-view/);assert.doesNotMatch(readMain(t),/class="regional-map|class="district-floor/);assert.deepEqual(details(readMain(t)),r.facilities.map(facilityKey).sort());}
 assert.deepEqual(resourceValues(t),before);
});
test('legacy regional main, engineering and diplomacy aliases preserve full system actions',async()=>{
 const t=await createTab(sharedStorage(s=>developed(s,true)));modelHistory(t);const before=resourceValues(t);
 for(const cfg of districts.filter(d=>d.system)){
  await route(t,`#more/${cfg.system}`);const expected=actions(readMain(t));assert.ok(expected.length,`${cfg.system} fixture exposes actions`);
  for(const suffix of ['main',...(cfg.system==='crafts'?['engineering']:cfg.system==='trades'?['diplomacy']:[])]){await route(t,`#more/map/${cfg.id}/${suffix}`);assert.deepEqual(actions(readMain(t)),expected,`${cfg.id}/${suffix}`);assert.doesNotMatch(readMain(t),/class="regional-map|class="district-floor/);}
 }
 assert.deepEqual(resourceValues(t),before);
});
test('nonactive systems remain available through More and direct system links',async()=>{
 const t=await createTab(sharedStorage(s=>{developed(s);s.buildings={hive:1};s.space={};s.time={};s.religion.apocripha=1;s.religion.transcendence=1;}));modelHistory(t);const vm=t.snapshot(),before=resourceValues(t),menu=explorationMenu(vm);
 for(const system of ['crafts','trades','faith','space','challenges']){assert.equal(systemOpen(vm,system),true,system);assert.ok(new RegExp(`data-(system|region)="${system}"`).test(menu),`${system} fallback is visible`);await route(t,`#more/${system}`);const expected=actions(readMain(t));assert.ok(expected.length,`${system} direct actions`);await route(t,`#more/map/${system}`);assert.deepEqual(actions(readMain(t)),expected,`${system}: legacy singleton alias has complete actions`);}
 assert.deepEqual(resourceValues(t),before);
});
test('contextual Home system actions retain engineering and embassy controls',async()=>{
 const t=await createTab(sharedStorage(s=>{developed(s,true);s.bears=[{id:1,name:'QA',job:'engineer',skills:{},rank:0,experience:0}];s.nextBearId=2;}));modelHistory(t);const before=resourceValues(t);
 for(const [region,system,pattern] of [['crafts','crafts',/data-act="engineerAssign"/],['industry','crafts',/data-act="engineerAssign"/],['trades','trades',/data-act="embassy"/]]){await route(t,`#home/${region}`);await clickRoute(t,{system});assert.equal(t.location.hash,`#more/${system}`);assert.match(readMain(t),pattern);}
 assert.deepEqual(resourceValues(t),before);
});
test('building details use modal history, keep the same Home scene, and close before Back leaves',async()=>{
 const t=await createTab(sharedStorage(sevenVsSix)),h=modelHistory(t),before=resourceValues(t);await route(t,'#home/map');await clickExploreRegion(t,'learning');const routeIndex=h.index,scene=readMain(t);await clickRendered(t,{detail:'buildings:library'});assert.equal(t.location.hash,'#home/learning');assert.equal(h.index,routeIndex+1);assert.equal(readMain(t),scene);assert.match(t.doc.node('#dialog-root').innerHTML,/role="dialog"/);await h.back();assert.equal(h.index,routeIndex);assert.equal(t.location.hash,'#home/learning');assert.equal(t.doc.node('#dialog-root').innerHTML,'');assert.equal(t.doc.node('#app').inert,false);await h.back();assert.equal(t.location.hash,'#home/map');assert.match(readMain(t),/world-map-scroll/);assert.deepEqual(resourceValues(t),before);
});
test('legacy exploration More modal system navigation replaces its entry and Back returns directly to map',async()=>{
 const t=await createTab(sharedStorage(s=>{s.settings.paused=true;})),h=modelHistory(t);await route(t,'#home/map');t.window.history.replaceState({preserved:'yes'},'');await t.click({command:'explore-menu'});const before=h.replaces;await clickRendered(t,{system:'achievements'},'#dialog-root');assert.equal(t.location.hash,'#more/achievements');assert.equal(h.replaces,before+1);assert.equal(h.entries[h.index].state?.bearDialog,undefined);assert.equal(h.entries[h.index].state?.preserved,'yes');assert.match(readMain(t),/achievement-section/);await h.back();assert.equal(t.location.hash,'#home/map');assert.equal(t.doc.node('#app').inert,false);
});
test('invalid and merged region Home deep links fall back to village with no facility loss',async()=>{
 const t=await createTab(sharedStorage(s=>{s.settings.paused=true;s.buildings.hive=1;s.buildings.library=1;}));modelHistory(t);
 for(const invalid of ['does-not-exist','learning','crafts','woods','time']){await route(t,`#home/${invalid}`);assert.equal(boardRegion(readMain(t)),'village',invalid);assert.deepEqual(ids(readMain(t)).sort(),['hive','library']);assert.match(readMain(t),/home-view/);}
});
test('legacy nonsystem merged and unknown regions return a usable village scene',async()=>{
 const t=await createTab(sharedStorage(s=>{s.settings.paused=true;s.buildings.hive=1;s.buildings.library=1;}));modelHistory(t);
 for(const id of ['learning','mines','does-not-exist']){await route(t,`#more/map/${id}`);assert.equal(boardRegion(readMain(t)),'village',id);assert.match(readMain(t),/home-view/);assert.deepEqual(ids(readMain(t)).sort(),['hive','library']);}
});
test('modeled Explore and per-region Home scroll survive round trips, details, Back and periodic render',async()=>{
 const t=await createTab(sharedStorage(s=>developed(s,true))),h=modelHistory(t),dom=modelScrollNodes(t);await route(t,'#home/map');dom.map.scrollTop=627;await clickExploreRegion(t,'learning');dom.home.scrollTop=409;await clickRendered(t,{detail:'buildings:library'});await h.back();assert.equal(dom.home.scrollTop,409);await route(t,'#home/crafts');dom.home.scrollTop=271;await route(t,'#home/learning');assert.equal(dom.home.scrollTop,409,'learning restores its own scroll');await route(t,'#home/crafts');assert.equal(dom.home.scrollTop,271,'crafts restores its own scroll');await route(t,'#home/map');assert.equal(dom.map.scrollTop,627,'Explore preserves its own scroll');advance(1200);t.step();assert.equal(dom.map.scrollTop,627,'periodic render preserves Explore scroll');await route(t,'#home/learning');assert.equal(dom.home.scrollTop,409);advance(1200);t.step();assert.equal(dom.home.scrollTop,409,'periodic render preserves Home scroll');
});

test('selling the second regional facility merges its survivor immediately; cancel is atomic and sale is final',async()=>{
 const t=await createTab(sharedStorage(sevenVsSix));modelHistory(t);await route(t,'#home/learning');const before=resourceValues(t);
 await clickRendered(t,{detail:'buildings:academy'});await clickRendered(t,{act:'sell',id:'academy'},'#dialog-root');await clickRendered(t,{command:'cancel'},'#dialog-root');assert.deepEqual(resourceValues(t),before);assert.equal(boardRegion(readMain(t)),'learning');assert.equal(t.snapshot().buildings.find(b=>b.id==='academy').owned,1);
 await clickRendered(t,{act:'sell',id:'academy'},'#dialog-root');await clickRendered(t,{command:'confirm'},'#dialog-root');assert.equal(t.snapshot().buildings.find(b=>b.id==='academy').owned,0);assert.equal(boardRegion(readMain(t)),'village');assert.ok(ids(readMain(t)).includes('library'));assert.ok(!ids(readMain(t)).includes('academy'));assertSharedPartition(t.snapshot());
 const after=resourceValues(t);assert.equal(t.snapshot().undo.pending,false);assert.equal(t.snapshot().undo.available,false);assert.throws(()=>renderedButton(t,{act:'undo'}),/Actual rendered control missing/);
 await t.click({act:'undo'});assert.equal(t.snapshot().buildings.find(b=>b.id==='academy').owned,0);assert.deepEqual(resourceValues(t),after);assertSharedPartition(t.snapshot());await route(t,'#home/learning');assert.equal(boardRegion(readMain(t)),'village');assert.ok(ids(readMain(t)).includes('library'));assert.ok(!ids(readMain(t)).includes('academy'));
});
test('Home toolbar return explicitly opens Explore and preserves navigation-only resources',async()=>{
 const t=await createTab(sharedStorage(sevenVsSix)),h=modelHistory(t),before=resourceValues(t);await route(t,'#home/map');await clickExploreRegion(t,'learning');await clickRoute(t,{nav:'map'});assert.equal(t.location.hash,'#home/map');assert.match(readMain(t),/world-map-scroll/);await h.back();assert.equal(t.location.hash,'#home/learning');assert.equal(boardRegion(readMain(t)),'learning');assert.deepEqual(resourceValues(t),before);
});
