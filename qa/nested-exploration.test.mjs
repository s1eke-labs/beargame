import test from 'node:test';import assert from 'node:assert/strict';import {page,systemOpen,explorationMenu} from '../src/ui/render.js';import {createGame} from '../src/engine/index.js';import {createTab,sharedStorage,advance,clickRendered} from './dom-harness.mjs';
const fresh=()=>createGame({storage:null,now:0}).snapshot();
const built=v=>{for(const id of ['workshop','lumberMill']){const b=v.buildings.find(b=>b.id===id);b.owned=1;}return v;};
const ui=(x={})=>({page:'more',system:'',region:'',regionSite:'',district:'home',...x});
const route=async(t,hash)=>{t.location.hash=hash;await t.windowEvent('hashchange');};
test('world shows shared Home regions as navigation, with achievements kept in utilities',()=>{
 const v=built(fresh());v.crafts.find(c=>c.type==='craft').unlocked=true;const html=page(v,ui({page:'map'}));
 assert.match(html,/world-map-scroll/);assert.match(html,/<button class="world-region[^>]*data-home-region="crafts"/);assert.doesNotMatch(html,/data-command="explore-menu"/);assert.match(explorationMenu(v),/data-system="achievements"/);
 assert.doesNotMatch(html,/data-home-region="achievements"|data-home-region="prestige"|data-home-region="space"/);
});
test('entering a region presents the shared Home scene before its separate action sheet',()=>{
 const v=built(fresh());v.crafts.find(c=>c.type==='craft').unlocked=true;
 const html=page(v,ui({region:'crafts',system:'crafts'}));
 assert.match(html,/playfield home-view/);assert.match(html,/data-home-district="crafts"/);assert.match(html,/data-system="crafts"/);assert.match(html,/打开世界地图/);assert.match(html,/data-region-quick="true"/);
 assert.doesNotMatch(html,/region-action-panel|district-floor|game-sheet|recipe-workbench/);
 assert.equal(html,page(v,ui({page:'home',district:'crafts'})),'legacy region entry and Home must render exactly the same scene');
 const open=page(v,ui({region:'crafts',system:'crafts',regionSite:'main'}));
 assert.match(open,/sheet-more explore-utility/);assert.match(open,/data-recipe-choice="beam"/);assert.match(open,/data-act="refine"/);assert.match(open,/data-nav="home"/);assert.doesNotMatch(open,/region-action-panel|district-floor/);
});
test('unavailable regions do not reveal controls and have an escape route',()=>{
 const v=fresh();assert.equal(systemOpen(v,'space'),false);const html=page(v,ui({region:'space',system:'space',regionSite:'main'}));
 assert.match(html,/这片天地还没开启/);assert.match(html,/data-nav="home"/);assert.match(html,/打开世界地图/);assert.doesNotMatch(html,/data-act="space"|region-landmark|district-floor/);
});
test('map to Home to system navigation never changes resources and Exploration returns overview',async()=>{
 const t=await createTab(sharedStorage(s=>{s.science.calendar=true;s.settings.paused=true;s.resources.honey=100;s.buildings.chronosphere=1;s.buildings.stasisPod=1;s.time.blastFurnace=1;}));
 const before=t.snapshot().resources.map(r=>r.value);await route(t,'#home/map');
 assert.match(t.doc.node('#main-content').innerHTML,/<button class="world-region[^>]*data-home-region="challenges"/);await clickRendered(t,{homeRegion:'challenges'});assert.equal(t.location.hash,'home/challenges');await route(t,'#'+t.location.hash);assert.match(t.doc.node('#main-content').innerHTML,/data-home-district="challenges"/);
 await clickRendered(t,{system:'challenges'});assert.equal(t.location.hash,'more/challenges');await route(t,'#'+t.location.hash);assert.match(t.doc.node('#main-content').innerHTML,/sheet-more explore-utility/);
 await clickRendered(t,{nav:'home'});assert.equal(t.location.hash,'home/challenges');await route(t,'#'+t.location.hash);assert.doesNotMatch(t.doc.node('#main-content').innerHTML,/game-sheet/);
 await clickRendered(t,{nav:'map'});assert.equal(t.location.hash,'home/map');await route(t,'#home/map');assert.match(t.doc.node('#main-content').innerHTML,/world-map-scroll/);assert.deepEqual(t.snapshot().resources.map(r=>r.value),before);
});
test('world scroll position survives shared Home round trip and periodic rendering',async()=>{
 const t=await createTab(sharedStorage(s=>{s.science.calendar=true;s.settings.paused=true;s.buildings.chronosphere=1;s.buildings.stasisPod=1;}));await route(t,'#home/map');t.doc.node('.world-map-scroll').scrollTop=265;
 await route(t,'#home/challenges');assert.match(t.doc.node('#main-content').innerHTML,/playfield home-view/);await route(t,'#home/map');assert.equal(t.doc.node('.world-map-scroll').scrollTop,265);advance(1200);t.step();assert.equal(t.doc.node('.world-map-scroll').scrollTop,265);
});
test('legacy subsystem routes remain usable and old map links resolve to the same Home scene',async()=>{
 const t=await createTab(sharedStorage(s=>{s.science.calendar=true;s.settings.paused=true;s.buildings.chronosphere=1;s.buildings.stasisPod=1;}));
 await route(t,'#more/challenges');assert.match(t.doc.node('#main-content').innerHTML,/sheet-more explore-utility/);
 await route(t,'#more/map/challenges');const legacy=t.doc.node('#main-content').innerHTML;assert.match(legacy,/playfield home-view/);assert.match(legacy,/data-home-district="challenges"/);assert.doesNotMatch(legacy,/district-floor|game-sheet/);
 await route(t,'#home/challenges');assert.equal(t.doc.node('#main-content').innerHTML,legacy);
 await route(t,'#more/map/challenges/main');assert.match(t.doc.node('#main-content').innerHTML,/sheet-more explore-utility/);
});
