import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
import {resolve} from 'node:path';
import {createGame,constants} from '../src/chapters/forest/engine.js';
import {createState,serialize} from '../src/chapters/forest/save.js';
import {forestArt,forestAssets} from '../src/chapters/forest/art.js';
import {regions,visibleRegions,chapterComplete,lotPosition,sceneLayout,sceneActors,batchSummary,esc,UI_KEY,LEASE_KEY,LEGACY_KEY} from '../src/chapters/forest/main.js';
const root=resolve(import.meta.dirname,'..');
const source=await readFile(resolve(root,'src/chapters/forest/main.js'),'utf8');
const css=await readFile(resolve(root,'src/chapters/forest/style.css'),'utf8');
const html=await readFile(resolve(root,'src/chapters/forest/index.html'),'utf8');

test('森林界面保持章节依赖隔离并随解锁开放一级入口',()=>{
 assert.deepEqual([...source.matchAll(/^import .+ from '([^']+)'/gm)].map(m=>m[1]),['./engine.js','./art.js']);
 assert.match(source,/function nav\(\)[\s\S]*?vm\.science\.some\(known\)/);assert.match(source,/\['village','小熊','bears','wave'\]/);
 assert.match(source,/data-nav="research"/);assert.match(source,/data-nav="village"/);assert.match(source,/data-nav="crafts"/);
 assert.doesNotMatch(html,/src\/main\.js|resources-atlas|research-subjects|worker-outfits/);
 assert.match(html,/viewport-fit=cover/);assert.match(css,/min-height:44px;min-width:44px/);assert.match(css,/@media\(max-width:350px\)/);
});

test('short phone Home fits its action dock above navigation with one scrolling scene',()=>{
 const vars=Object.fromEntries([...css.matchAll(/--home-(topbar|hud|toolbar|dock|nav):(\d+)px/g)].map(([,key,value])=>[key,Number(value)]));
 assert.deepEqual(vars,{topbar:48,hud:48,toolbar:44,dock:104,nav:64});
 const fixed=Object.values(vars).reduce((sum,n)=>sum+n,0);
 assert.equal(553-fixed,245);assert.ok(500-fixed>=190);
 assert.equal(553-fixed-44,201); // Paused + completed: completion reuses the guide row.
 assert.match(css,/\.home-view \.status-banner:not\(\.error\)\{height:44px;min-height:44px/);
 assert.match(source,/if\(complete\)\{guide\.dataset\.command='completion';delete guide\.dataset\.nav;/);
 assert.doesNotMatch(source,/<section class="completion">/);
 assert.match(source,/classList\.toggle\('home-view',ui\.page==='home'\)/);
 assert.match(css,/\.app-shell\.home-view\{[^}]*height:100dvh;min-height:0;display:flex;flex-direction:column/);
 assert.match(css,/\.home-view #main-content\{flex:1;min-height:0;display:flex;flex-direction:column;overflow:hidden\}/);
 assert.match(css,/\.home-view \.world-scene\{height:auto;min-height:0;max-height:none;flex:1;overflow-y:auto;overflow-x:hidden\}/);
 assert.match(css,/\.home-view \.home-controls\{height:var\(--home-dock\);flex:0 0 var\(--home-dock\)/);
 assert.doesNotMatch(css,/empty-bear|empty-note/);
 assert.match(css,/\.home-view #observe-slot\{position:absolute/);
});

test('map uses the remaining viewport for exactly one scroller while all controls stay outside it',()=>{
 assert.ok(source.includes('vm=game.snapshot();updateViewLayout();'));
 for(const contract of [
  '.app-shell.map-view{height:100dvh;min-height:0;display:flex;flex-direction:column;overflow:hidden}',
  '.map-view .topbar,.map-view #resource-bar,.map-view #status,.map-view .page-heading{flex:none}',
  '.map-view #main-content{flex:1;min-height:0;display:flex;flex-direction:column;overflow:hidden}',
  '.world-map-scroll{flex:1;min-height:0;height:auto;overflow-y:auto;overflow-x:hidden;overscroll-behavior:contain;',
  'padding-bottom:calc(76px + env(safe-area-inset-bottom))',
  '.app-shell{padding-bottom:calc(var(--compact-nav) + env(safe-area-inset-bottom))}',
 ])assert.ok(css.includes(contract),contract);
 assert.ok(!css.includes('.world-map-scroll{height:calc('));assert.ok(!css.includes('min-height:350px'));
 // Sizing contracts only: actual browser geometry is a separate acceptance gate.
 for(const [width,height,safe] of [[336,553,0],[504,829,0],[390,1000,34],[900,1000,0]]){
  const compact=width<700&&height<=650,top=compact?48:58,hud=compact?48:62,heading=compact?46:74,tabs=compact?64:76;
  for(const banner of [0,44,80]){const remaining=height-safe-top-hud-heading-tabs-banner;assert.ok(remaining>0,`${width}x${height}: available map area`);assert.equal(top+hud+heading+tabs+banner+safe+remaining,height);}
 }
});

test('opening illustration and copy belong only to the loading screen',()=>{
 assert.match(html,/<div class="loading-picture"[^>]*><img[^>]*fetchpriority="high"/);
 assert.ok(html.includes(`src="${forestArt.scenery.loading}"`));
 assert.match(html,/<p class="loading-intro">一点蜂蜜，一间小屋。<br>森林里的生活，从这里开始。<\/p>/);
 assert.doesNotMatch(source,/empty-bear|empty-note|一点蜂蜜，一间小屋。|森林里的生活，从这里开始。/);
 assert.doesNotMatch(css,/empty-bear|empty-note/);
 assert.match(html,/<div id="app" aria-hidden="true" inert>/);
 assert.match(source,/await preload\(\);[\s\S]*shell\(\);readHash\(\);render\(true\);[\s\S]*await finishLoading\(\)/);
 assert.match(css,/loading-screen\.loading-complete\{opacity:0\}/);
 assert.match(css,/transition:width \.18s ease-out/);
});

test('continuous painting fills tall Home and keeps long maps scrollable without repeating seams',()=>{
 assert.match(css,/\.continuous-map\{[^}]*min-height:max\(460px,100%\);height:var\(--map-height,620px\)/);
 assert.match(css,/\.continuous-map\{[^}]*background-size:cover;[^}]*background-repeat:no-repeat/);
 assert.doesNotMatch(css,/repeat-y/);
 assert.match(css,/\.home-view \.world-scene\{[^}]*overflow-y:auto/);
 assert.match(source,/height=Math\.max\(height,pos\.y\+150\)/);
});

test('short phone selected building and first notebook card keep their action in the first screen',()=>{
 const vars=Object.fromEntries([...css.matchAll(/--compact-(topbar|hud|heading|hero|nav):(\d+)px/g)].map(([,key,value])=>[key,Number(value)]));
 assert.deepEqual(vars,{topbar:48,hud:48,heading:46,hero:100,nav:64});
 // Two cost rows, two effect lines and a paused banner still leave the primary action visible.
 const station=8+vars.hero+6+61+78+50;
 const actionBottom=vars.topbar+vars.hud+vars.heading+station+44;
 assert.ok(actionBottom<=553-vars.nav,`primary action ends at ${actionBottom}px`);
 assert.match(css,/@media\(max-width:699px\) and \(max-height:650px\)/);
 assert.match(css,/\.build-station \.build-showcase\{height:var\(--compact-hero\)/);
 assert.match(css,/\.build-caption p\{[^}]*-webkit-line-clamp:2/);
 assert.match(css,/\.card-picture\{height:76px;width:74px\}/);
 assert.match(css,/\.build-station \.action-row button,\.discovery-card \.action-row button\{height:44px;min-height:44px/);
});

test('all first-chapter buildings belong to one multi-building region, same partition used by Home/map',()=>{
 const ids=regions.flatMap(r=>r.buildings);assert.equal(new Set(ids).size,11);assert.ok(regions.every(r=>r.buildings.length>1));
 const vm=createGame().snapshot();assert.deepEqual(visibleRegions(vm).map(r=>r.id),['village']);
 vm.buildings.find(c=>c.id==='mine').unlocked=true;assert.equal(visibleRegions(vm).length,1);
 vm.buildings.find(c=>c.id==='workshop').unlocked=true;assert.equal(visibleRegions(vm).length,1);
 vm.buildings.find(c=>c.id==='mine').owned=1;assert.equal(visibleRegions(vm).length,1);assert.ok(visibleRegions(vm)[0].buildings.includes('mine'));
 vm.buildings.find(c=>c.id==='workshop').owned=1;assert.equal(visibleRegions(vm).length,2);
 assert.match(source,/function updateScene\(\)[\s\S]*?visibleRegions\(vm\)/);
 assert.match(source,/function mapPage\(\)[\s\S]*?visibleRegions\(vm\)/);
});

test('chapter endpoint requires all three buildings and construction',()=>{
 const vm=createGame().snapshot();assert.equal(chapterComplete(vm),false);
 for(const id of ['logHouse','warehouse','lumberMill'])vm.buildings.find(c=>c.id===id).owned=1;
 assert.equal(chapterComplete(vm),false);vm.science.find(c=>c.id==='construction').completed=true;assert.equal(chapterComplete(vm),true);
});

test('anchored map keeps nodes across resource ticks and expresses working state separately',()=>{
 assert.deepEqual(lotPosition(0),{x:28,y:155});assert.deepEqual(lotPosition(3),{x:72,y:452});
 assert.match(source,/let el=map\.querySelector\(`\[data-scene-building/);
 assert.match(source,/if\(!el\)\{el=document\.createElement\('button'\)/);
 assert.match(source,/ui\.page!=='home'&&ui\.structureKey!==structure/);
 assert.match(source,/grossRate\?\?output\.rate/);assert.match(source,/output\.value<output\.max/);
 assert.match(css,/prefers-reduced-motion:reduce/);assert.match(css,/\.scene-paused \*/);
});

test('batch confirmation estimate uses limiting material, safe escaping and independent storage keys',()=>{
 assert.deepEqual(batchSummary({costs:[{id:'wood',name:'木',value:4,owned:23},{id:'minerals',name:'石',value:2,owned:5}]}),{count:2,costs:[{id:'wood',name:'木',value:8,owned:23},{id:'minerals',name:'石',value:4,owned:5}]});
 assert.equal(esc('<img src="x">'), '&lt;img src=&quot;x&quot;&gt;');
 assert.notEqual(constants.SAVE_KEY,LEGACY_KEY);assert.equal(LEGACY_KEY,'beargame.save.v1');assert.match(UI_KEY,/chapters/);assert.match(LEASE_KEY,/chapters/);
 assert.match(source,/type==='sell'\)\{confirmAction/);assert.match(source,/parseSave\(text\);confirmAction/);
 assert.match(source,/backup\(LEGACY_KEY/);assert.doesNotMatch(source,/setItem\(LEGACY_KEY|removeItem\(LEGACY_KEY/);
});

// Exercise the real controller handlers with the real chapter engine. Only view
// painting and dialogs are replaced: this is a controlled lifecycle fixture,
// not a browser/layout test, and does not change shipped source or expose QA APIs.
const runtimeSource=source.replaceAll("from './engine.js'",`from '${pathToFileURL(resolve(root,'src/chapters/forest/engine.js'))}'`).replaceAll("from './art.js'",`from '${pathToFileURL(resolve(root,'src/chapters/forest/art.js'))}'`).replace(/if\(typeof document!==.*?boot\(\);\s*$/,'')+`
const originalOpenDialog=openDialog,originalCloseDialog=closeDialog;
export const fixture={
 init(storage,id='test-a') { globalThis.localStorage=storage; tabId=id; storageIssue=''; readOnly=false; loadBlocked=false; settling=false; settlementFailed=false; hiddenAt=null; dialog=null; dialogHistory=false; parentDialog=null; ui.revealBuilding=null; ui.page='home'; ui.region='village'; ui.buildChoice='hive'; settings.reducedMotion=false; refreshDialog=()=>{}; render=()=>{vm=game.snapshot();}; renderStatus=()=>{}; openDialog=(kind,title,data={})=>{dialog={kind,title,...data};}; closeDialog=()=>{dialog=null;}; notify=()=>{}; dialogRoot={querySelector(){return null;}}; app={querySelector(){return null;}}; claim(); reloadGame(); return vm;},
 step, save, perform, onVisibility, onStorage, flushActive, settle, importFile, preload,
 scene(snapshot,root,options={}){vm=snapshot;app=root;ui.page='home';ui.region=options.region||'village';readOnly=false;storageIssue='';loadBlocked=false;settling=false;settlementFailed=false;dialog=null;settings.reducedMotion=!!options.reduced;if(Object.hasOwn(options,'revealBuilding'))ui.revealBuilding=options.revealBuilding;updateScene();},
 views(snapshot){vm=snapshot;return {map:mapPage(),more:morePage(),build:buildPage(),queue:queuePage()};},
 live(snapshot,root){vm=snapshot;app=root;updateLive();},
 key(snapshot){vm=snapshot;return structuralKey();},
 captureQueueFocus(snapshot){vm=snapshot;ui.queueKey=queueOrderKey(snapshot);return activeKey();},
 restoreQueueFocus(snapshot,root,key){vm=snapshot;app=root;restoreFocus(key);},
 click(dataset,disabled=false){onClick({target:{closest:()=>({dataset,disabled})}});}, route:navigate,readHash,ui:()=>({...ui}),
 layout(page,root){ui.page=page;app=root;updateViewLayout();},normalize:normalizeHomeRegion,
 reveal(root,reduced=false,activeDialog=null){app=root;settings.reducedMotion=reduced;dialog=activeDialog;return finishLoading();},
 state:()=>({vm:game.snapshot(),readOnly,storageIssue,loadBlocked,settling,settlementFailed,hiddenAt,dialog,dialogHistory}),
 openActual:originalOpenDialog,closeActual:originalCloseDialog,
 takeOver(){ if(claim(true)){reloadGame();return settlePending();} },
 confirm:()=>dialog?.confirm?.(), export:()=>game.exportSave(),
};`;
const runtime=await import('data:text/javascript;base64,'+Buffer.from(runtimeSource).toString('base64'));
const {fixture}=runtime;
const originalNow=Date.now;let time=1800000000000;
const fakeDoc={hidden:false,documentElement:{classList:{add(){},remove(){}}},body:{classList:{add(){},remove(){}}}};
const storageFor=(edit=()=>{})=>{const state=createState(123,time);edit(state);const values=new Map([[constants.SAVE_KEY,serialize(state,time)],[LEGACY_KEY,'opaque original legacy bytes']]);return {values,getItem:k=>values.get(k)??null,setItem:(k,v)=>values.set(k,v),removeItem:k=>values.delete(k)};};
const drain=async()=>{for(let n=0;fixture.state().settling&&n<1000;n++)await new Promise(r=>setTimeout(r,1));assert.equal(fixture.state().settling,false);};

// Minimal scene nodes exercise the real scene updater, including creation,
// reuse and removal. Layout remains a separate browser acceptance check.
class SceneNode {
 constructor(){this.scrollTop=0;this.clientHeight=245;this.scrolls=[];this.dataset={};this.attributes={};this.children=[];this.className='';this.textContent='';this._html='';this.style={setProperty(k,v){this[k]=v;}};this.classList={toggle:(name,on)=>{const names=new Set(this.className.split(' ').filter(Boolean));on?names.add(name):names.delete(name);this.className=[...names].join(' ');}};}
 set innerHTML(html){this._html=html;this.children=[];for(const [,tag,attrs]of html.matchAll(/<(img|span)\b([^>]*)>/g)){const node=new SceneNode();node.tag=tag;node.className=attrs.match(/class="([^"]*)"/)?.[1]||'';node.attributes.src=attrs.match(/src="([^"]*)"/)?.[1];this.append(node);}}
 get innerHTML(){return this._html;}
 scrollTo(options){this.scrolls.push(options);this.scrollTop=options.top;}
 append(node){node.parent=this;this.children.push(node);}
 remove(){this.parent.children=this.parent.children.filter(node=>node!==this);}
 setAttribute(k,v){this.attributes[k]=v;}
 getAttribute(k){return this.attributes[k]??null;}
 querySelectorAll(selector){const match=node=>selector==='img'?node.tag==='img':selector.startsWith('.')?node.className.split(' ').includes(selector.slice(1)):(()=>{const [,attr,value]=selector.match(/^\[data-([a-z-]+)(?:="([^"]*)")?\]$/)||[];const key=attr?.replace(/-([a-z])/g,(_,c)=>c.toUpperCase());return key&&key in node.dataset&&(value===undefined||node.dataset[key]===value);})();return this.children.flatMap(node=>[...(match(node)?[node]:[]),...node.querySelectorAll(selector)]);}
 querySelector(selector){return this.querySelectorAll(selector)[0]||null;}
}

test('empty Home stays empty across updates; earned bears and anchored buildings remain interactive',()=>{
 const nodes=new Map(['.world-board','.world-scene','.scene-tabs','.continuous-map','.scene-status','#completion-slot','#guide','#observe-slot','#refine-cost'].map(key=>[key,new SceneNode()]));
 const root={querySelector:s=>nodes.get(s)||null};nodes.get('.world-board').querySelector=root.querySelector;
 const map=nodes.get('.continuous-map'),guide=nodes.get('#guide');globalThis.document={createElement:()=>new SceneNode()};
 try{
  const fresh=createGame().snapshot();fixture.scene(fresh,root);fixture.scene(fresh,root);
  assert.equal(map.children.length,0);assert.equal(map.style['--map-height'],'460px');
  assert.equal(guide.dataset.nav,'build');assert.match(guide.innerHTML,/采集 10 份蜂蜜/);
  const state=createState(44,time);state.buildings={hive:1,hut:1};state.resources.honey=50;
  const game=createGame({save:serialize(state,time),now:time,storage:null});game.tick(20);assert.equal(game.snapshot().bears.value,1);assert.equal(game.act('assign','woodcutter').ok,true);
  const populated=game.snapshot();fixture.scene(populated,root);
  const hive=map.querySelector('[data-scene-building="hive"]'),worker=map.querySelector('[data-bear]');
  assert.equal(map.querySelectorAll('[data-scene-building]').length,2);assert.equal(worker.dataset.bear,String(populated.bears.individuals[0].id));assert.match(worker.attributes['aria-label'],/点按聊聊/);assert.match(worker.className,/is-working/);
  assert.equal(hive.style['--x'],'28%');assert.equal(hive.style['--y'],'155px');
  populated.buildings.find(c=>c.id==='warehouse').owned=1;fixture.scene(populated,root);
  assert.equal(map.style['--map-height'],'980px');assert.equal(map.querySelector('[data-scene-building="hive"]'),hive);assert.equal(map.querySelector('[data-bear]'),worker);
  populated.settings.paused=true;fixture.scene(populated,root);assert.doesNotMatch(worker.className,/is-working/);
  fixture.scene(fresh,root);assert.equal(map.children.length,0);assert.equal(map.style['--map-height'],'460px');assert.equal(guide.dataset.nav,'build');
 }finally{delete globalThis.document;}
});

function sceneNodes(){
 const nodes=new Map(['.world-board','.world-scene','.scene-tabs','.continuous-map','.scene-status','#completion-slot','#guide','#observe-slot','#refine-cost'].map(key=>[key,new SceneNode()]));
 const root={querySelector:s=>nodes.get(s)||null};nodes.get('.world-board').querySelector=root.querySelector;return {nodes,root,map:nodes.get('.continuous-map'),scene:nodes.get('.world-scene'),guide:nodes.get('#guide')};
}

test('owned regions partition all 2048 first-chapter building subsets exactly once, including singleton folds',()=>{
 const fresh=createGame().snapshot(),ids=fresh.buildings.map(c=>c.id);
 for(let mask=0;mask<2**ids.length;mask++){
  const snapshot={...fresh,buildings:fresh.buildings.map((c,i)=>({...c,owned:(mask>>i)&1}))};
  const actual=visibleRegions(snapshot).flatMap(r=>sceneLayout(snapshot,r.id).buildings.map(l=>l.card.id));
  const expected=snapshot.buildings.filter(c=>c.owned).map(c=>c.id);
  assert.deepEqual(actual.sort(),expected.sort(),`owned subset ${mask}`);
  for(const r of visibleRegions(snapshot).slice(1))assert.ok(sceneLayout(snapshot,r.id).buildings.length>=2);
 }
 const snapshot=structuredClone(fresh);snapshot.buildings.find(c=>c.id==='mine').owned=1;
 const folded=sceneLayout(snapshot,'village').buildings.find(l=>l.card.id==='mine');assert.equal(folded.index,regions[0].buildings.length);
 snapshot.buildings.find(c=>c.id==='workshop').owned=1;assert.equal(sceneLayout(snapshot,'woodland').buildings.find(l=>l.card.id==='mine').index,0);
 snapshot.buildings.find(c=>c.id==='workshop').owned=0;assert.equal(sceneLayout(snapshot,'village').buildings.find(l=>l.card.id==='mine').index,folded.index);
});

test('Home, map and ordinary pages switch viewport classes exclusively',()=>{
 const shell=new SceneNode(),root={querySelector:selector=>selector==='.app-shell'?shell:null};
 for(const page of ['home','map','more','map','home','build']){
  fixture.layout(page,root);const classes=shell.className.split(' ');
  assert.equal(classes.includes('home-view'),page==='home');assert.equal(classes.includes('map-view'),page==='map');
 }
 const {map}=fixture.views(createGame().snapshot());assert.equal([...map.matchAll(/class="world-map-scroll"/g)].length,1);assert.ok(map.includes('class="world-map-scroll" tabindex="0"'));
});

test('unavailable Home regions canonicalize after import or a direct route without adding history entries',()=>{
 const fresh=createGame().snapshot(),full=structuredClone(fresh);for(const id of ['mine','workshop'])full.buildings.find(c=>c.id===id).owned=1;
 const state={forestDialog:true,other:'keep'},changes=[];globalThis.location={hash:'#home/woodland'};globalThis.history={state,replaceState(next,title,url){changes.push({state:next,url});this.state=next;globalThis.location.hash=url;}};
 try{
  fixture.views(full);fixture.readHash();assert.equal(fixture.ui().region,'woodland');assert.equal(changes.length,0);
  fixture.views(fresh);fixture.normalize();assert.equal(fixture.ui().region,'village');assert.equal(globalThis.location.hash,'#home/village');assert.equal(changes.length,1);assert.equal(changes[0].state,state);assert.equal(globalThis.history.state,state);
  fixture.normalize();assert.equal(changes.length,1);
  globalThis.location.hash='#home/unknown';fixture.readHash();assert.equal(fixture.ui().region,'village');assert.equal(globalThis.location.hash,'#home/village');assert.equal(changes.length,2);
  globalThis.location.hash='#home/map';fixture.readHash();assert.equal(fixture.ui().page,'map');assert.equal(globalThis.location.hash,'#home/map');assert.equal(changes.length,2);
  assert.ok(source.includes("updateViewLayout();if(ui.page==='home')normalizeHomeRegion();renderStatus();"));
 }finally{delete globalThis.location;delete globalThis.history;}
});

test('world map shows every owned type using Home coordinates and a quiet empty terrain',()=>{
 const fresh=createGame().snapshot(),empty=fixture.views(fresh).map;
 assert.doesNotMatch(empty,/<img|data-map-building/);assert.match(empty,/一片安静的林间空地/);
 const full=structuredClone(fresh);for(const c of full.buildings)c.owned=1;
 const {map}=fixture.views(full),ids=[...map.matchAll(/data-map-building="([^"]+)"/g)].map(m=>m[1]);
 assert.deepEqual(ids.sort(),full.buildings.map(c=>c.id).sort());assert.equal(new Set(ids).size,11);
 assert.match(map,/已有 7 类建筑/);assert.match(map,/已有 4 类建筑/);
 for(const r of visibleRegions(full)){const {buildings,height}=sceneLayout(full,r.id);for(const {card,x,y} of buildings){assert.ok(map.includes(`data-map-building="${card.id}" style="--x:${x}%;--y:${y/height*100}%;`));}}
 assert.match(css,/\.map-building\{[^}]*left:var\(--x\);top:var\(--y\)/);
 assert.doesNotMatch(map,/flex-wrap|slice\(0,4\)/);
});

test('More has compact functions without a repeated introduction or world-map entry; locked building types remain hidden',()=>{
 const {more,build}=fixture.views(createGame().snapshot());
 assert.doesNotMatch(more,/more-intro|森林里的小事|收好工具|world-map|data-nav="map"/);
 assert.match(more,/data-command="saves"/);assert.match(more,/data-command="settings"/);
 assert.deepEqual([...build.matchAll(/data-build-choice="([^"]+)"/g)].map(m=>m[1]),['hive','hut','library']);
 assert.doesNotMatch(css,/more-intro/);
 assert.match(css,/\.more-list\{max-width:620px;margin:auto\}\.resource-ribbon\{padding-left:40px;padding-right:40px\}/);
});

test('reassigning an existing bear refreshes both outfits without replacing its anchored button',()=>{
 const {root,map}=sceneNodes(),snapshot=createGame().snapshot();globalThis.document={createElement:()=>new SceneNode()};
 try{
  snapshot.buildings.find(c=>c.id==='hive').owned=1;snapshot.buildings.find(c=>c.id==='hut').owned=1;
  snapshot.bears={...snapshot.bears,value:1,individuals:[{id:7,name:'小团',job:'farmer'}],jobs:{farmer:1}};
  fixture.scene(snapshot,root,{revealBuilding:null});const actor=map.querySelector('[data-bear="7"]'),body=actor.querySelector('.worker-body');
  assert.equal(body.querySelector('.worker-ready').getAttribute('src'),forestArt.workers.farmer.ready);
  snapshot.bears.individuals[0].job='woodcutter';snapshot.bears.jobs={woodcutter:1};fixture.scene(snapshot,root);
  assert.equal(map.querySelector('[data-bear="7"]'),actor);assert.equal(actor.querySelector('.worker-body'),body);
  assert.equal(body.querySelector('.worker-ready').getAttribute('src'),forestArt.workers.woodcutter.ready);assert.equal(body.querySelector('.worker-work').getAttribute('src'),forestArt.workers.woodcutter.work);
  assert.match(actor.querySelector('.worker-label').textContent,/伐木熊/);assert.equal(actor.style['--x'],'33.571429%');assert.equal(actor.style['--y'],'340px');
  const image=body.querySelector('.worker-ready');fixture.scene(snapshot,root);assert.equal(body.querySelector('.worker-ready'),image);
  snapshot.bears.individuals[0].job=null;fixture.scene(snapshot,root);assert.equal(body.querySelector('.worker-ready').getAttribute('src'),forestArt.bears.idleFront);assert.equal(map.querySelector('[data-bear="7"]'),actor);
 }finally{delete globalThis.document;}
});

test('each next-building guide opens that exact selection without collecting resources',()=>{
 const {root,guide}=sceneNodes();globalThis.document={createElement:()=>new SceneNode()};globalThis.location={hash:'#home/village'};
 try{
  fixture.init(storageFor());const before=fixture.state().vm,snapshot=createGame().snapshot();
  for(const target of ['hive','hut','library']){
   fixture.scene(snapshot,root,{revealBuilding:null});assert.equal(guide.dataset.buildTarget,target);fixture.click(guide.dataset);assert.equal(fixture.ui().buildChoice,target);assert.equal(globalThis.location.hash,'build');
   snapshot.buildings.find(c=>c.id===target).owned=target==='hive'?20:1;snapshot.resources.find(r=>r.id==='honey').value=1500;if(target==='hut'){snapshot.bears.value=1;snapshot.bears.free=0;}
  }
  assert.deepEqual(fixture.state().vm.resources,before.resources);assert.deepEqual(fixture.state().vm.stats,before.stats);assert.equal(fixture.state().vm.ticks,before.ticks);
 }finally{delete globalThis.document;delete globalThis.location;delete globalThis.localStorage;}
});

test('successful construction reveals its shared-region lot once, respects motion settings, and ordinary inspection never scrolls',()=>{
 const {root,scene,map}=sceneNodes();globalThis.document={createElement:()=>new SceneNode()};globalThis.location={hash:'#build'};globalThis.matchMedia=()=>({matches:false});
 try{
  fixture.init(storageFor(s=>{s.resources.honey=10;}));assert.equal(fixture.perform('build','hive').ok,true);assert.equal(fixture.ui().revealBuilding,'hive');
  fixture.scene(fixture.state().vm,root,{reduced:true});assert.deepEqual(scene.scrolls,[{top:32.5,behavior:'instant'}]);assert.equal(fixture.ui().revealBuilding,null);
  fixture.scene(fixture.state().vm,root);assert.equal(scene.scrolls.length,1);
  fixture.click({detail:'buildings:hive'});fixture.scene(fixture.state().vm,root);assert.equal(scene.scrolls.length,1);
  assert.equal(fixture.perform('build','hive').ok,false);assert.equal(fixture.ui().revealBuilding,null);
  const full=createGame().snapshot();for(const id of ['mine','workshop'])full.buildings.find(c=>c.id===id).owned=1;
  fixture.scene(full,root,{revealBuilding:'mine'});assert.equal(fixture.ui().revealBuilding,'mine');fixture.route('home');assert.equal(globalThis.location.hash,'home/woodland');
  fixture.scene(full,root,{region:'woodland'});assert.equal(scene.scrolls.at(-1).behavior,'smooth');assert.equal(fixture.ui().revealBuilding,null);assert.ok(map.querySelector('[data-scene-building="mine"]'));
  globalThis.matchMedia=()=>({matches:true});fixture.scene(full,root,{region:'woodland',revealBuilding:'workshop'});assert.equal(scene.scrolls.at(-1).behavior,'instant');
 }finally{delete globalThis.document;delete globalThis.location;delete globalThis.localStorage;delete globalThis.matchMedia;}
});

const flushPromises=async()=>{for(let i=0;i<8;i++)await Promise.resolve();};
async function withLoader(run){
 const original={Image:globalThis.Image,document:globalThis.document,setTimeout:globalThis.setTimeout,clearTimeout:globalThis.clearTimeout,matchMedia:globalThis.matchMedia};
 const images=[],timers=new Map(),events=new Map();let serial=0;
 const screen={removed:false,classes:new Set(),classList:{add(name){screen.classes.add(name);}},getBoundingClientRect(){return {};},addEventListener(name,fn){events.set(name,fn);},removeEventListener(name,fn){if(events.get(name)===fn)events.delete(name);},remove(){this.removed=true;}};
 const progress={value:0,max:1},label={textContent:'正在准备家园…'},app={inert:true,hidden:true,removeAttribute(name){if(name==='aria-hidden')this.hidden=false;}};
 globalThis.document={querySelector:s=>({'#loading-screen':screen,'#loading-progress':progress,'#loading-label':label})[s]||null};
 globalThis.Image=class{constructor(){images.push(this);}decode(){return Promise.resolve();}};
 globalThis.setTimeout=(fn,ms)=>{const id=++serial;timers.set(id,{fn,ms});return id;};globalThis.clearTimeout=id=>timers.delete(id);globalThis.matchMedia=()=>({matches:false});
 try{await run({images,timers,events,screen,progress,label,app});}finally{Object.assign(globalThis,original);}
}

test('loading waits for image decoding and counts actual assets',async()=>withLoader(async({images,progress})=>{
 let decoded;const gate=new Promise(resolve=>{decoded=resolve;});const pending=fixture.preload();
 assert.equal(images.length,forestAssets.length);assert.equal(progress.max,forestAssets.length);assert.equal(progress.value,0);
 images[0].decode=()=>gate;const first=images[0].onload();await Promise.all(images.slice(1).map(image=>image.onload()));await flushPromises();
 assert.equal(progress.value,forestAssets.length-1);decoded();await first;await pending;assert.equal(progress.value,forestAssets.length);
 assert.ok(images.every(image=>image.onload===null&&image.onerror===null));
}));

test('failed or timed-out loading cannot overwrite an error with late progress',async t=>{
 for(const failure of ['network','decode','timeout'])await t.test(failure,async()=>withLoader(async({images,timers,progress,label})=>{
  const pending=fixture.preload();const rejected=assert.rejects(pending,/图片/);const late=images[0].onload;
  if(failure==='network')images[0].onerror();else if(failure==='decode'){images[0].decode=()=>Promise.reject(Error('decode'));await images[0].onload();}else [...timers.values()][0].fn();
  await rejected;const atFailure=progress.value;label.textContent='加载失败，可以重试';
  await Promise.all(images.slice(1).map(image=>image.onload()));images[0].decode=()=>Promise.resolve();await late();await flushPromises();
  assert.equal(progress.value,atFailure);assert.equal(label.textContent,'加载失败，可以重试');assert.equal(timers.size,0);
 }));
});

test('ready loader fades once, keeps hidden controls inert, and honors reduced motion',async t=>{
 await t.test('only its own opacity transition releases Home',async()=>withLoader(async({screen,events,timers,app})=>{
  const pending=fixture.reveal(app);assert.ok(screen.classes.has('loading-complete'));assert.equal(app.inert,true);assert.equal(screen.removed,false);
  events.get('transitionend')({target:{},propertyName:'opacity'});await flushPromises();assert.equal(screen.removed,false);
  events.get('transitionend')({target:screen,propertyName:'width'});await flushPromises();assert.equal(screen.removed,false);
  events.get('transitionend')({target:screen,propertyName:'opacity'});await pending;
  assert.equal(screen.removed,true);assert.equal(app.inert,false);assert.equal(app.hidden,false);assert.equal(timers.size,0);assert.equal(events.size,0);
 }));
 await t.test('a dialog opened during loading keeps the underlying game inert',async()=>withLoader(async({screen,app})=>{
  await fixture.reveal(app,true,{kind:'settling'});assert.equal(screen.removed,true);assert.equal(app.inert,true);assert.equal(app.hidden,false);
 }));
 await t.test('missing transition event has a bounded fallback',async()=>withLoader(async({screen,timers,app})=>{
  const pending=fixture.reveal(app);const timer=[...timers.values()][0];assert.equal(timer.ms,300);timer.fn();await pending;assert.equal(screen.removed,true);assert.equal(app.inert,false);
 }));
 for(const preference of ['app','system'])await t.test(preference+' reduced motion reveals immediately',async()=>withLoader(async({screen,timers,app})=>{
  globalThis.matchMedia=()=>({matches:preference==='system'});await fixture.reveal(app,preference==='app');assert.equal(screen.classes.size,0);assert.equal(timers.size,0);assert.equal(screen.removed,true);assert.equal(app.inert,false);
 }));
});

test('real UI lifecycle, ownership, imported-save and storage-failure guards',async t=>{
 Date.now=()=>time;globalThis.document=fakeDoc;
 try{
 await t.test('active ticks and page hide/show count elapsed time once',async()=>{
  const storage=storageFor(s=>{s.buildings.hive=1;s.settings.offline=true;});fixture.init(storage);fakeDoc.hidden=false;
  time+=1000;fixture.step();assert.equal(fixture.state().vm.ticks,5);
  fakeDoc.hidden=true;fixture.onVisibility();const atHide=fixture.state().vm.ticks;
  time+=20000;fakeDoc.hidden=false;fixture.onVisibility();await drain();assert.equal(fixture.state().vm.ticks,atHide+100);
  fixture.onVisibility();await drain();assert.equal(fixture.state().vm.ticks,atHide+100);
  time+=1000;fixture.step();assert.equal(fixture.state().vm.ticks,atHide+105);
  assert.equal(storage.getItem(LEGACY_KEY),'opaque original legacy bytes');
 });
 await t.test('offline disabled and paused settings do not advance hidden time',async()=>{
  for(const setting of ['offline','paused']){const storage=storageFor(s=>{s.settings.offline=setting==='paused';s.settings.paused=setting==='paused';s.buildings.hive=1;});fixture.init(storage);fakeDoc.hidden=true;fixture.onVisibility();time+=20000;fakeDoc.hidden=false;fixture.onVisibility();await drain();assert.equal(fixture.state().vm.ticks,0);}
 });
 await t.test('another tab ownership prevents mutation and overwriting saved bytes',()=>{
  const storage=storageFor();fixture.init(storage);fixture.perform('gather','honey');const before=storage.getItem(constants.SAVE_KEY);
  storage.setItem(LEASE_KEY,JSON.stringify({id:'other-tab',until:time+7000}));fixture.onStorage({key:LEASE_KEY});time+=2000;fixture.step();fixture.perform('gather','honey');fixture.save();
  assert.equal(fixture.state().readOnly,true);assert.equal(storage.getItem(constants.SAVE_KEY),before);assert.equal(storage.getItem(LEGACY_KEY),'opaque original legacy bytes');
 });
 await t.test('incompatible stored save remains byte-identical after actions and auto-save',()=>{
  const storage=storageFor();const incompatible='{"format":"beargame","family":"beargame-chapters","chapter":"other","contentLevel":9}';storage.setItem(constants.SAVE_KEY,incompatible);fixture.init(storage);assert.equal(fixture.state().loadBlocked,true);
  fixture.perform('gather','honey');time+=20000;fixture.step();fixture.save();assert.equal(storage.getItem(constants.SAVE_KEY),incompatible);
 });
 await t.test('incompatible file is rejected before confirmation or state mutation',async()=>{
  const storage=storageFor();fixture.init(storage);const before=storage.getItem(constants.SAVE_KEY);await fixture.importFile({target:{id:'save-file',files:[{name:'bad.json',size:50,text:async()=>'{"format":"beargame"}'}],value:'x'}});assert.equal(fixture.state().dialog,null);assert.equal(storage.getItem(constants.SAVE_KEY),before);
 });
 await t.test('valid import waits for explicit confirmation and preserves legacy slot',async()=>{
  const storage=storageFor();fixture.init(storage);const state=createState(44,time);state.resources.honey=21;const text=serialize(state,time);
  await fixture.importFile({target:{id:'save-file',files:[{name:'good.json',size:text.length,text:async()=>text}],value:'x'}});assert.equal(fixture.state().dialog.kind,'confirm');assert.equal(fixture.state().vm.resources.find(r=>r.id==='honey').value,0);
  fixture.confirm();assert.equal(fixture.state().vm.resources.find(r=>r.id==='honey').value,21);assert.equal(storage.getItem(LEGACY_KEY),'opaque original legacy bytes');
 });
 await t.test('automatic settlement restores an interrupted modal without a ghost Back entry',async()=>{
  const storage=storageFor(s=>{s.settings.offline=true;s.buildings.hive=1;});fixture.init(storage);
  const history={state:{},count:1,backs:0,pushState(state){this.state=state;this.count++;},back(){this.state={};this.backs++;this.count--;}};globalThis.history=history;
  try{fixture.openActual('detail','蜂箱详情',{section:'buildings',id:'hive'});assert.equal(history.count,2);assert.equal(fixture.state().dialogHistory,true);
   await fixture.settle(6);assert.equal(fixture.state().dialog.kind,'detail');assert.equal(fixture.state().dialogHistory,true);assert.equal(history.count,2);
   fixture.closeActual();assert.equal(history.count,1);assert.equal(history.backs,1);assert.equal(fixture.state().dialog,null);
  }finally{delete globalThis.history;}
 });
 await t.test('storage write failure remains visible and stops subsequent progression',()=>{
  const storage=storageFor();fixture.init(storage);storage.setItem=()=>{throw Error('quota');};fixture.perform('gather','honey');const tick=fixture.state().vm.ticks;assert.match(fixture.state().storageIssue,/保存/);time+=10000;fixture.step();assert.equal(fixture.state().vm.ticks,tick);
 });
 }finally{Date.now=originalNow;delete globalThis.document;delete globalThis.localStorage;}
});


test('loader preserves the established slow continuous breathing motion',()=>{
 assert.match(css,/animation:loading-bear 2\.8s cubic-bezier\(\.45,0,\.55,1\) infinite/);
 assert.match(css,/translateY\(-4px\) rotate\(1deg\) scale\(1\.015\)/);
});


const intersects=(a,b)=>a.left<b.right&&a.right>b.left&&a.top<b.bottom&&a.bottom>b.top;
function allOccupations(){
 const snapshot=createGame().snapshot();for(const card of snapshot.buildings)card.owned=1;
 const jobs=['farmer','woodcutter','scholar','hunter','miner'];
 snapshot.bears={...snapshot.bears,value:9,free:4,individuals:[...jobs.map((job,i)=>({id:i+1,name:'伙伴'+i,job})),...[6,7,8,9].map(id=>({id,name:'休息的伙伴'+id,job:null}))],jobs:Object.fromEntries(jobs.map(job=>[job,1]))};
 return snapshot;
}

test('every occupation and earned idle group has a deterministic separate footprint at narrow and wide sizes',()=>{
 const snapshot=allOccupations();
 for(const viewportWidth of [300,336,350,390,504,699,900])for(const region of visibleRegions(snapshot)){
  const width=Math.min(viewportWidth,680),layout=sceneActors(snapshot,region.id,{width,viewportWidth});
  assert.equal(layout.actors.length,region.id==='village'?6:2); // Lumber mill and mine share the workshop region.
  for(const [i,a] of layout.actors.entries()){
   assert.ok(a.bounds.left>=8&&a.bounds.right<=width-8,`${viewportWidth} ${a.job}: inside map`);
   assert.ok(a.bounds.top>=8&&a.bounds.bottom<=layout.height,`${viewportWidth} ${a.job}: within map height`);
   for(const b of layout.actors.slice(i+1))assert.equal(intersects(a.bounds,b.bounds),false,`${viewportWidth} ${region.id}: ${a.job}/${b.job}`);
   for(const bounds of layout.labelBounds)assert.equal(intersects(a.bounds,bounds),false,`${viewportWidth} ${region.id}: ${a.job}/building-label`);
   if(a.job==='idle'){
    assert.equal(a.count,4);
    for(const bounds of layout.buildingBounds)assert.equal(intersects(a.bounds,bounds),false,`${viewportWidth}: idle/building`);
   }
  }
  const ticked=structuredClone(snapshot);for(const r of ticked.resources){r.value+=1;r.rate+=3;}
  assert.deepEqual(sceneActors(ticked,region.id,{width,viewportWidth}).actors.map(({job,x,y})=>({job,x,y})),layout.actors.map(({job,x,y})=>({job,x,y})));
 }
});

test('idle clearing avoids all building hitboxes and all workers across every owned building subset',()=>{
 const snapshot=allOccupations(),ids=snapshot.buildings.map(c=>c.id);
 for(let mask=0;mask<2**ids.length;mask++){
  snapshot.buildings.forEach((card,i)=>{card.owned=(mask>>i)&1;});
  for(const region of visibleRegions(snapshot)){
   const {actors,buildingBounds,labelBounds}=sceneActors(snapshot,region.id,{width:336});
   for(const [i,a] of actors.entries()){
    for(const b of actors.slice(i+1))assert.equal(intersects(a.bounds,b.bounds),false,`subset ${mask}, ${region.id}: ${a.job}/${b.job}`);
    for(const bounds of labelBounds)assert.equal(intersects(a.bounds,bounds),false,`subset ${mask}: ${a.job}/building-label`);
    if(a.job==='idle')for(const bounds of buildingBounds)assert.equal(intersects(a.bounds,bounds),false,`subset ${mask}: idle/building`);
   }
  }
 }
});

test('real scene renderer uses collision-safe coordinates, counts idle companions and retains nodes across resource ticks',()=>{
 const {root,map}=sceneNodes(),snapshot=allOccupations();globalThis.document={createElement:()=>new SceneNode()};
 try{
  for(const width of [336,504,900]){
   globalThis.innerWidth=width;map.clientWidth=Math.min(width,680);
   for(const region of visibleRegions(snapshot)){
    fixture.scene(snapshot,root,{region:region.id,revealBuilding:null});
    const layout=sceneActors(snapshot,region.id,{width:map.clientWidth,viewportWidth:width});
    const refs=new Map();for(const a of layout.actors){
     const node=map.querySelector(`[data-bear="${a.bear.id}"]`);refs.set(a.bear.id,node);
     assert.equal(node.style['--x'],a.x+'%');assert.equal(node.style['--y'],a.y+'px');
     assert.equal(node.dataset.job,a.job);if(a.job==='idle')assert.equal(node.querySelector('.worker-label').textContent,'林间散步 ×4');
    }
    const ticked=structuredClone(snapshot);ticked.resources.forEach(r=>{r.value+=.5;});fixture.scene(ticked,root,{region:region.id});
    for(const a of layout.actors){const node=map.querySelector(`[data-bear="${a.bear.id}"]`);assert.equal(node,refs.get(a.bear.id));assert.equal(node.style['--x'],a.x+'%');assert.equal(node.style['--y'],a.y+'px');}
   }
  }
 }finally{delete globalThis.document;delete globalThis.innerWidth;}
});

function renderedQueueButton(markup,query){
 for(const match of markup.matchAll(/<button\b([^>]*)>([\s\S]*?)<\/button>/g)){
  const dataset={};for(const [,key,value]of match[1].matchAll(/data-([a-z-]+)="([^"]*)"/g))dataset[key.replace(/-([a-z])/g,(_,c)=>c.toUpperCase())]=value;
  if(Object.entries(query).every(([key,value])=>dataset[key]===String(value)))return {dataset,disabled:/\sdisabled(?:\s|$)/.test(match[1]),markup:match[0]};
 }
 assert.fail('Missing rendered queue button: '+JSON.stringify(query));
}
function clickQueue(query){const button=renderedQueueButton(fixture.views(fixture.state().vm).queue,query);fixture.click(button.dataset,button.disabled);return button;}

test('Build exposes queue access in its existing header and queue routes return to the selected building',()=>{
 fixture.init(storageFor());let hash='#build';globalThis.location={get hash(){return hash;},set hash(value){hash=value.startsWith('#')?value:'#'+value;}};
 try{
  const markup=fixture.views(fixture.state().vm).build,entry=renderedQueueButton(markup,{nav:'build/queue'});
  assert.ok(markup.indexOf(entry.markup)<markup.indexOf('</header>'));assert.match(entry.markup,/建造队列/);assert.match(entry.markup,/0\/3/);
  fixture.click({buildChoice:'hut'});fixture.click(entry.dataset);fixture.readHash();assert.equal(fixture.ui().page,'queue');assert.equal(location.hash,'#build/queue');
  const queue=fixture.views(fixture.state().vm).queue;assert.ok(queue.indexOf('class="queue-list"')<queue.indexOf('添加到队列'));assert.doesNotMatch(queue,/queue-pagination/);
  clickQueue({nav:'build'});fixture.readHash();assert.equal(fixture.ui().page,'build');assert.equal(fixture.ui().buildChoice,'hut');
  location.hash='#build/queue';fixture.readHash();assert.equal(fixture.ui().page,'queue');
  location.hash='#build';fixture.readHash();assert.equal(fixture.ui().page,'build');
 }finally{delete globalThis.location;delete globalThis.localStorage;}
});

test('queue rendered controls dispatch enqueue, grouped decrement, reorder and confirmed clearing with the real engine',()=>{
 const storage=storageFor();fixture.init(storage);
 try{
  const before=fixture.state().vm.resources;
  clickQueue({act:'queueEnqueue',id:'build:hive'});clickQueue({act:'queueEnqueue',id:'build:hive'});clickQueue({act:'queueEnqueue',id:'build:hut'});
  let view=fixture.state().vm;assert.equal(view.queue.used,3);assert.deepEqual(view.queue.items.map(c=>[c.id,c.amount]),[['hive',2],['hut',1]]);assert.deepEqual(view.resources,before);
  assert.match(fixture.views(view).queue,/蜂箱 <small>×2/);
  assert.match(clickQueue({act:'queueEnqueue',id:'build:library'}).markup,/aria-disabled="true"/);assert.equal(fixture.state().vm.queue.used,3);
  const top=clickQueue({act:'queueUp',id:'0'});assert.equal(top.disabled,true);assert.equal(fixture.state().vm.queue.items[0].id,'hive');
  clickQueue({act:'queueDown',id:'0'});assert.deepEqual(fixture.state().vm.queue.items.map(c=>c.id),['hut','hive']);
  clickQueue({act:'queueUp',id:'1'});assert.deepEqual(fixture.state().vm.queue.items.map(c=>c.id),['hive','hut']);
  clickQueue({act:'queueRemove',id:'0',amount:'max'});assert.equal(fixture.state().dialog,null);assert.deepEqual(fixture.state().vm.queue.items.map(c=>[c.id,c.amount]),[['hut',1]]);
  clickQueue({act:'queueEnqueue',id:'build:hut'});clickQueue({act:'queueRemove',id:'0'});assert.equal(fixture.state().vm.queue.items[0].amount,1);
  clickQueue({act:'queueClear'});assert.equal(fixture.state().dialog.kind,'confirm');assert.equal(fixture.state().vm.queue.used,1);
  fixture.click({command:'cancel'});assert.equal(fixture.state().vm.queue.used,1);assert.equal(fixture.state().dialog,null);
  clickQueue({act:'queueClear'});fixture.confirm();assert.equal(fixture.state().vm.queue.used,0);
  assert.deepEqual(fixture.state().vm.resources,before);assert.equal(storage.getItem(LEGACY_KEY),'opaque original legacy bytes');
 }finally{delete globalThis.localStorage;}
});

test('queue choices contain only available chapter discoveries and preserve enqueued work across reload',()=>{
 const storage=storageFor();fixture.init(storage);
 try{
  const optionIds=html=>[...html.matchAll(/data-act="queueEnqueue" data-id="([^"]+)"/g)].map(m=>m[1]);
  assert.deepEqual(optionIds(fixture.views(fixture.state().vm).queue),['build:hive','build:hut','build:library']);
  clickQueue({act:'queueEnqueue',id:'build:hut'});fixture.init(storage);assert.equal(fixture.state().vm.queue.items[0].id,'hut');
  const developed=storageFor(state=>{state.buildings={library:1,workshop:1};});fixture.init(developed);
  const ids=optionIds(fixture.views(fixture.state().vm).queue);assert.ok(ids.includes('research:calendar'));assert.ok(ids.includes('upgrade:ironAxes'));assert.ok(!ids.includes('research:agriculture'));assert.ok(!ids.some(id=>/craft:|space:|faith:/.test(id)));
  assert.deepEqual(ids,fixture.state().vm.queue.options.filter(c=>c.unlocked&&!c.completed).map(c=>c.id));
 }finally{delete globalThis.localStorage;}
});

test('queue updates costs/status in place on resource ticks and rerenders order only when its structure changes',()=>{
 const storage=storageFor();fixture.init(storage);clickQueue({act:'queueEnqueue',id:'build:hive'});
 const initial=fixture.state().vm,resourceTick=structuredClone(initial);resourceTick.resources.find(r=>r.id==='honey').value=7;
 for(const c of [...resourceTick.queue.items,...resourceTick.queue.options])for(const cost of c.costs)if(cost.id==='honey')cost.owned=7;
 const selectors=['[data-queue-count]','[data-queue-rule]','[data-queue-costs]','[data-queue-status]','[data-act]'];
 const nodes=new Map(selectors.map(selector=>[selector,[]]));
 const count=new SceneNode(),rule=new SceneNode(),itemCosts=new SceneNode(),optionCosts=new SceneNode(),status=new SceneNode(),button=new SceneNode();
 itemCosts.dataset.queueCosts='item:0';optionCosts.dataset.queueCosts='option:build:hive';status.dataset.queueStatus='0';button.dataset={act:'queueEnqueue',id:'build:hive'};
 nodes.set('[data-queue-count]',[count]);nodes.set('[data-queue-rule]',[rule]);nodes.set('[data-queue-costs]',[itemCosts,optionCosts]);nodes.set('[data-queue-status]',[status]);nodes.set('[data-act]',[button]);
 const root={querySelector:s=>nodes.get(s)?.[0]||null};globalThis.document={querySelectorAll:s=>nodes.get(s)||[]};
 try{
  assert.equal(fixture.key(initial),fixture.key(resourceTick));fixture.live(initial,root);const first=itemCosts.innerHTML;
  fixture.live(resourceTick,root);assert.notEqual(itemCosts.innerHTML,first);assert.match(itemCosts.innerHTML,/还差 3/);assert.match(optionCosts.innerHTML,/还差 3/);assert.equal(count.textContent,'1/3');assert.equal(status.textContent,'物资不足');assert.equal(button.attributes['aria-disabled'],'false');
  const completed=structuredClone(resourceTick);completed.queue.items=[];completed.queue.used=0;
  assert.notEqual(fixture.key(resourceTick),fixture.key(completed));fixture.live(completed,root);assert.equal(count.textContent,'0/3');assert.match(fixture.views(completed).queue,/把想建的放进来/);
 }finally{delete globalThis.document;delete globalThis.localStorage;}
});

test('queue auto-build consumes items on UI ticks and clear confirmation rechecks ownership at execution',()=>{
 const original=Date.now;Date.now=()=>time;globalThis.document=fakeDoc;fakeDoc.hidden=false;
 const storage=storageFor(s=>{s.resources.honey=20;});fixture.init(storage);
 try{
  clickQueue({act:'queueEnqueue',id:'build:hive'});const before=fixture.key(fixture.state().vm);time+=200;fixture.step();const after=fixture.state().vm;
  assert.equal(after.queue.used,0);assert.equal(after.buildings.find(c=>c.id==='hive').owned,1);assert.notEqual(fixture.key(after),before);assert.match(fixture.views(after).queue,/0\/3/);
  clickQueue({act:'queueEnqueue',id:'build:hut'});clickQueue({act:'queueClear'});assert.equal(fixture.state().dialog.kind,'confirm');
  storage.setItem(LEASE_KEY,JSON.stringify({id:'other-tab',until:time+7000}));fixture.onStorage({key:LEASE_KEY});fixture.confirm();assert.equal(fixture.state().vm.queue.used,1);
  clickQueue({act:'queueRemove',id:'0'});assert.equal(fixture.state().vm.queue.used,1);
 }finally{Date.now=original;delete globalThis.document;delete globalThis.localStorage;}
});

test('oversized imported queues bound rendered order rows without paging normal chapter choices',()=>{
 const snapshot=createGame().snapshot();snapshot.queue.items=Array.from({length:51},(_,index)=>({type:'build',id:'hive',name:'蜂箱',index,amount:1,costs:[],status:'等待执行'}));snapshot.queue.used=51;
 try{
  fixture.init(storageFor());let view=fixture.views(snapshot).queue;assert.equal([...view.matchAll(/class="queue-item"/g)].length,25);assert.match(view,/queue-pagination/);assert.equal([...view.matchAll(/data-act="queueEnqueue"/g)].length,3);
  fixture.click({queuePage:'2'});view=fixture.views(snapshot).queue;assert.equal([...view.matchAll(/class="queue-item"/g)].length,1);assert.match(view,/data-act="queueRemove" data-id="50"/);
  snapshot.queue.items=snapshot.queue.items.slice(0,1);view=fixture.views(snapshot).queue;assert.equal(fixture.ui().queuePage,0);assert.doesNotMatch(view,/queue-pagination/);
 }finally{delete globalThis.localStorage;}
});


test('queue editing focus cannot move to a different numeric-index target after automatic completion',()=>{
 const before=createGame().snapshot();before.queue.items=[{type:'build',id:'library',amount:1,index:0},{type:'build',id:'hive',amount:1,index:1},{type:'build',id:'hut',amount:1,index:2}];
 const after=structuredClone(before);after.queue.items.shift();after.queue.items.forEach((item,index)=>{item.index=index;});
 let focused=null;const heading={focus(){focused='heading';}},root={querySelector:s=>s==='[data-queue-heading]'?heading:null};
 const control=(act,id,target)=>({dataset:{act,id},focus(){focused=target;}});
 try{
  for(const act of ['queueRemove','queueUp','queueDown']){
   globalThis.document={activeElement:control(act,'1','hive'),querySelectorAll:()=>[control(act,'0','hive'),control(act,'1','hut')]};
   const key=fixture.captureQueueFocus(before);fixture.restoreQueueFocus(after,root,key);assert.equal(focused,'heading',act+' cannot shift to hut');
   focused=null;const unchanged=structuredClone(before);unchanged.resources.find(r=>r.id==='honey').value=7;
   globalThis.document.querySelectorAll=()=>[control(act,'1','hive')];fixture.restoreQueueFocus(unchanged,root,key);assert.equal(focused,'hive',act+' stays on same queue item for resource-only updates');
  }
  assert.match(fixture.views(after).queue,/<h1 tabindex="-1" data-queue-heading>建造队列<\/h1>/);
 }finally{delete globalThis.document;}
});


test('working bears leave building-name badges clickable without moving building lots',()=>{
 const snapshot=allOccupations();snapshot.buildings.find(c=>c.id==='smelter').enabled=false;
 assert.match(css,/\.placed-building\{[^}]*justify-content:flex-end/);
 assert.match(css,/\.building-label\{[^}]*font-size:12px;padding:3px 8px/);
 for(const viewportWidth of [336,504,900])for(const region of visibleRegions(snapshot)){
  const width=Math.min(viewportWidth,680),before=sceneLayout(snapshot,region.id),layout=sceneActors(snapshot,region.id,{width,viewportWidth});
  assert.deepEqual(sceneLayout(snapshot,region.id),before);
  assert.equal(layout.labelBounds.length,before.buildings.length);
  for(const [i,box] of layout.labelBounds.entries()){
   const height=viewportWidth>=700?190:viewportWidth<=350?163:176;
   assert.equal(box.bottom,before.buildings[i].y+height/2);assert.equal(box.bottom-box.top,30);
   for(const actor of layout.actors)assert.equal(intersects(actor.bounds,box),false,`${viewportWidth} ${region.id}: ${actor.job}/${before.buildings[i].card.id} label`);
  }
 }
});
