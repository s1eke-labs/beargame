import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createGame} from '../src/engine/index.js';
import {createState,serialize} from '../src/engine/save.js';
import {page,shell,visibleNavs,sceneGroups,cardsFor} from '../src/ui/render.js';
import {engineeringPanel,challengePanel} from '../src/ui/advanced.js';
import {createTab,sharedStorage,clickRendered} from './dom-harness.mjs';
const ui=(page='home',extra={})=>({page,system:'',district:'home',buildFilter:'all',researchTab:'science',...extra});
const fresh=()=>createGame({storage:null,now:Date.UTC(2026,9,9)}).snapshot();
function edited(edit){const s=createState(11,0);edit(s);return createGame({storage:null,save:serialize(s,0),now:0}).snapshot();}
test('fresh build shows three familiar goals but no locked or rare-resource buildings, including queue',()=>{
 const v=fresh(),html=page(v,ui('build'));for(const id of ['hive','hut','library'])assert.match(html,new RegExp(`data-id="${id}"`));for(const id of v.buildings.filter(c=>!c.unlocked||c.id==='ivoryTemple').map(c=>c.id)){assert.ok(!html.includes(`data-id="${id}"`),id);assert.ok(!html.includes(`data-id="build:${id}"`),id);}assert.doesNotMatch(html,/locked-card|待解锁|建筑改建方案/);
});
test('unaffordable unlocked choices remain visible; no catalog appears on fresh research',()=>{
 const v=fresh();assert.equal(v.buildings[0].available,false);assert.match(page(v,ui('build')),/data-act="build" data-id="hive"[^>]+aria-disabled="true"/);assert.doesNotMatch(page(v,ui('research')),/data-act="research"|data-act="upgrade"|data-act="policy"/);
});
test('navigation unfolds from real housing and library state, keeping gift access before residents',()=>{
 const v=fresh();assert.deepEqual(visibleNavs(v).map(c=>c[0]),['home','build','more']);v.gifts={cards:[{visible:true,owned:1,unlocked:true}]};assert.ok(visibleNavs(v).some(c=>c[0]==='village'));const next=edited(s=>{s.buildings.hut=1;s.buildings.library=1;});assert.ok(visibleNavs(next).some(c=>c[0]==='research'));assert.ok(visibleNavs(next).some(c=>c[0]==='village'));
});
test('completed research is accessible only in a default-collapsed history section',()=>{
 const v=edited(s=>{s.buildings.library=1;s.science.calendar=true;}),html=page(v,ui('research'));assert.match(html,/<details class="fold-section" data-fold="completed-science">/);assert.doesNotMatch(html,/<details[^>]*data-fold="completed-science"[^>]* open/);assert.match(html,/已掌握/);
});
test('every owned base building belongs to exactly one scene district and stable slot',()=>{
 const v=fresh();for(const c of v.buildings)c.owned=1;const all=sceneGroups(v).flatMap(g=>g.cards).filter(c=>c.section==='buildings');assert.equal(all.length,v.buildings.length);assert.equal(new Set(all.map(c=>c.id)).size,v.buildings.length);const a=edited(s=>s.buildings.barn=1),b=edited(s=>{s.buildings.hive=1;s.buildings.hut=1;s.buildings.barn=1;});assert.equal(sceneGroups(a)[0].cards.find(c=>c.id==='barn').sceneSlot,sceneGroups(b)[0].cards.find(c=>c.id==='barn').sceneSlot);
});
test('real owned counts and residents determine artwork, without fabricated prebuilt village',()=>{
 const v=fresh(),start=page(v,ui());assert.doesNotMatch(start,/class="placed-building|class="scene-resident/);v.buildings.find(c=>c.id==='hive').owned=3;v.bears.value=2;v.bears.free=2;v.bears.individuals=[{id:1,name:'团团',job:null},{id:2,name:'圆圆',job:null}];const next=page(v,ui());assert.equal((next.match(/class="building-copy"/g)||[]).length,1);assert.match(next,/×3/);assert.equal((next.match(/class="scene-resident"/g)||[]).length,0);assert.match(next,/data-bear-id="1"/);assert.match(next,/×2/);assert.match(next,/蜂箱 3 座/);
});
test('time controls remain reachable when time actions unlock before time facilities',()=>{
 const v=edited(s=>{s.ironWill=false;s.science.chronophysics=true;s.resources.timeCrystal=100;});assert.match(page(v,ui('more',{system:'challenges'})),/data-act="shatter"/);
});
test('specialist panels do not overwhelm a new village but retain assigned workers',()=>{
 const v=fresh();assert.equal(engineeringPanel(v),'');v.engineers.cards[0].assigned=1;assert.match(engineeringPanel(v),/engineering-panel/);assert.match(engineeringPanel(v),/data-act="engineerUnassign"/);const css=readFileSync(new URL('../src/styles/main.css',import.meta.url),'utf8');assert.match(css,/\.engineering-panel \.card-grid,\.challenge-panel \.card-grid\{grid-template-columns:1fr\}/);
});
test('mobile art and primary controls occupy a viewport-bound scene, with touch-sized controls and preserved caption/art separation',()=>{
 const css=readFileSync(new URL('../src/styles/main.css',import.meta.url),'utf8');assert.match(css,/height:100dvh/);const layout=readFileSync(new URL('../src/styles/scene.css',import.meta.url),'utf8');assert.match(layout,/\.home-controls\{position:relative/);assert.match(layout,/grid-template-rows:minmax\(0,1fr\) auto/);assert.match(css,/\.bottom-nav\{display:flex;flex:0 0 auto/);assert.match(css,/safe-area-inset-bottom/);assert.doesNotMatch(css,/\.scene-mascot>span\{/);assert.match(css,/\.scene-mascot>span:not\(\.atlas\)/);assert.match(css,/min-height:44px/);
});
test('actual paid build updates the real scene and keeps the existing save identity',async()=>{
 const storage=sharedStorage(s=>{s.resources.honey=20;});const tab=await createTab(storage);tab.location.hash='#build';await tab.windowEvent('hashchange');await clickRendered(tab,{act:'build',id:'hive'});assert.match(tab.doc.node('#main-content').innerHTML,/data-detail="buildings:hive"/);assert.equal(tab.snapshot().buildings.find(c=>c.id==='hive').owned,1);assert.doesNotMatch(tab.doc.node('#main-content').innerHTML,/data-act="undo"/);assert.equal(tab.snapshot().undo.pending,false);
});
