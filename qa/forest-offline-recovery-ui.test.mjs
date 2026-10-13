import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
import {resolve} from 'node:path';
import {createState,serialize} from '../src/chapters/forest/save.js';
import {constants} from '../src/chapters/forest/engine.js';

const root=resolve(import.meta.dirname,'..');
const source=await readFile(resolve(root,'src/chapters/forest/main.js'),'utf8');
// Exercise actual boot, lifecycle, command, failure, and save handlers against
// the real engine. Only image loading, view painting, and dialog DOM are stubbed;
// the controlled loading gate reproduces a phone taking over 200ms to reveal.
const runtimeSource=source
 .replaceAll("from './engine.js'",`from '${pathToFileURL(resolve(root,'src/chapters/forest/engine.js'))}'`)
 .replaceAll("from './art.js'",`from '${pathToFileURL(resolve(root,'src/chapters/forest/art.js'))}'`)
 .replace(/if\(typeof document!==.*?boot\(\);\s*$/,'')+`
export const fixture={
 reset(storage,nodes,notices,downloads){
  globalThis.localStorage=storage;game=null;vm=null;tabId='recovery-ui';storageIssue='';readOnly=false;loadBlocked=false;
  loading=false;settling=false;settlementFailed=false;settlementFailureKind='';settlementFailureMessage='';hiddenAt=null;
  dialog=null;dialogHistory=false;parentDialog=null;booted=false;settings={reducedMotion:false};
  ui.page='home';ui.region='village';ui.revealBuilding=null;ui.pageKey='';ui.structureKey='';
  app=nodes.get('#app');dialogRoot=nodes.get('#dialog-root');
  render=()=>{vm=game.snapshot();renderStatus();};refreshDialog=()=>{};
  openDialog=(kind,title,data={})=>{dialog={kind,title,...data};};closeDialog=()=>{dialog=null;};
  notify=text=>notices.push(text);download=(text,name)=>downloads.push({text,name});
 },
 load(){claim();reloadGame();render();},
 boot(gate){preload=async()=>{};finishLoading=()=>gate;return boot();},
 click(dataset,disabled=false){onClick({target:{closest:()=>({dataset,disabled})}});},
 failTick(message){game.tick=()=>({ok:false,message});},
 failOffline(message,reject=false){game.catchUpAsync=async()=>{if(reject)throw new Error(message);return {ok:false,message};};},
 step,flushActive,settle,onVisibility,save,reloadGame,settlePending,
 panel:()=>dialogBody(),canAct,rates,
 state:()=>({vm:game.snapshot(),settlementFailed,settlementFailureKind,settlementFailureMessage,settling,dialog,booted}),
};`;
const {fixture}=await import('data:text/javascript;base64,'+Buffer.from(runtimeSource).toString('base64'));
const originalNow=Date.now,originalTimeout=setTimeout;
let clock=1800000000000;
const legacyKey='beargame.save.v1';
const stored=(edit=()=>{},ageMs=0)=>{
 const state=createState(73,clock-ageMs);state.settings.offline=true;state.buildings.hive=1;state.resources.honey=20;edit(state);
 const values=new Map([[constants.SAVE_KEY,serialize(state,clock-ageMs)],[legacyKey,'untouched legacy bytes']]);
 const writes=[];
 return {values,writes,getItem:key=>values.get(key)??null,setItem(key,value){writes.push({key,value});values.set(key,value);},removeItem:key=>values.delete(key)};
};
function harness(t,storage){
 const originals=Object.fromEntries(['document','window','localStorage','location','history','matchMedia','setInterval','setTimeout','clearTimeout'].map(key=>[key,Object.getOwnPropertyDescriptor(globalThis,key)]));
 const nodes=new Map(),listeners=new Map(),intervals=[],notices=[],downloads=[];
 const node=key=>{if(!nodes.has(key))nodes.set(key,{innerHTML:'',textContent:'',scrollTop:0,hidden:false,classList:{add(){},remove(){},toggle(){}},querySelector:node,querySelectorAll:()=>[],focus(){}});return nodes.get(key);};
 node('#app');node('#dialog-root');
 globalThis.document={hidden:false,querySelector:node,querySelectorAll:()=>[],activeElement:null,documentElement:node('html'),body:node('body'),addEventListener(type,handler){listeners.set(type,handler);}};
 globalThis.window={addEventListener(type,handler){listeners.set(type,handler);},scrollTo(){}};
 globalThis.history={state:{},replaceState(){},pushState(){},back(){}};
 let reloads=0;globalThis.location={hash:'#home/village',reload(){reloads++;}};
 globalThis.matchMedia=()=>({matches:true});
 globalThis.setInterval=(fn,ms)=>{intervals.push({fn,ms});return intervals.length;};
 globalThis.setTimeout=(fn,ms)=>ms===0?originalTimeout(fn,0):1;
 globalThis.clearTimeout=()=>{};
 Date.now=()=>clock;
 fixture.reset(storage,nodes,notices,downloads);
 t.after(()=>{Date.now=originalNow;for(const [key,value]of Object.entries(originals)){if(value)Object.defineProperty(globalThis,key,value);else delete globalThis[key];}});
 return {storage,nodes,intervals,notices,downloads,listeners,reloads:()=>reloads,
  advance(ms){clock+=ms;},
  clickRendered(html,command){assert.match(html,new RegExp('data-command="'+command+'"'));fixture.click({command});},
  async drain(){for(let n=0;fixture.state().settling&&n<1000;n++)await new Promise(resolve=>originalTimeout(resolve,1));assert.equal(fixture.state().settling,false);},
 };
}

test('slow loading cannot run live ticks before pending offline settlement begins',async t=>{
 const h=harness(t,stored(()=>{},12000)),original=h.storage.getItem(constants.SAVE_KEY);
 let reveal;const gate=new Promise(resolve=>{reveal=resolve;});const booting=fixture.boot(gate);
 await Promise.resolve();await Promise.resolve();
 assert.equal(fixture.state().vm.pendingOffline,12);
 assert.equal(fixture.state().booted,false);
 assert.equal(fixture.canAct(),false,'the loader also blocks lifecycle saves and settings');
 globalThis.document.hidden=true;fixture.onVisibility();
 assert.equal(fixture.save().ok,false);globalThis.document.hidden=false;fixture.onVisibility();
 h.advance(800);
 // A lease heartbeat may exist, but a production timer must not run behind the loader.
 for(const timer of h.intervals.filter(timer=>timer.ms===200))timer.fn();
 assert.equal(h.intervals.filter(timer=>timer.ms===200).length,0);
 assert.equal(fixture.state().settlementFailed,false);
 assert.equal(h.storage.getItem(constants.SAVE_KEY),original);
 reveal();await booting;
 assert.equal(fixture.state().settling,true,'pending time starts settling before the live timer is armed');
 assert.equal(h.intervals.filter(timer=>timer.ms===200).length,1);
 await h.drain();
 assert.equal(fixture.state().vm.pendingOffline,0);
 assert.equal(fixture.state().vm.ticks,60,'the original 12 seconds settle exactly once');
 assert.equal(fixture.state().settlementFailed,false);
 assert.equal(fixture.canAct(),true);
 const save=JSON.parse(h.storage.getItem(constants.SAVE_KEY));assert.equal(save.ticks,60);
 h.advance(200);h.intervals.find(timer=>timer.ms===200).fn();
 assert.equal(fixture.state().vm.ticks,61,'normal production continues after catch-up');
 assert.equal(h.notices.some(text=>text.includes('中断')),false);
 assert.equal(h.storage.getItem(legacyKey),'untouched legacy bytes');
});

test('an early lifecycle flush settles pending time rather than treating the engine lock as a failure',async t=>{
 const h=harness(t,stored(()=>{},12000));fixture.load();h.advance(200);
 fixture.flushActive();
 assert.equal(fixture.state().settling,true);
 assert.equal(fixture.state().settlementFailed,false);
 await h.drain();
 assert.equal(fixture.state().vm.pendingOffline,0);
 assert.equal(fixture.state().vm.ticks,60);
 assert.equal(fixture.canAct(),true);
});

test('live failure keeps its cause, blocks mutation, and exposes backup then reload without saving',t=>{
 const h=harness(t,stored()),original=h.storage.getItem(constants.SAVE_KEY);fixture.load();
 fixture.failTick('时间推进中断，原有进度已恢复。计时余量 < 0');h.advance(200);fixture.step();
 assert.equal(fixture.state().settlementFailureKind,'live');
 assert.equal(fixture.rates({rate:3}),'已停止');
 const banner=h.nodes.get('#status').innerHTML;
 assert.match(banner,/时间推进中断/);assert.doesNotMatch(banner,/离线结算中断/);
 h.clickRendered(banner,'saves');
 const panel=fixture.panel();
 assert.match(panel,/计时余量 &lt; 0/);assert.doesNotMatch(panel,/data-command="save"/);
 assert.ok(panel.indexOf('data-command="backup-slot"')<panel.indexOf('data-command="reload"'));
 h.clickRendered(panel,'backup-slot');assert.equal(h.downloads.at(-1).text,original);
 fixture.click({act:'gather',id:'honey'});assert.match(h.notices.at(-1),/当前暂停操作/);
 assert.equal(fixture.state().vm.resources.find(r=>r.id==='honey').value,20);
 assert.equal(fixture.save().ok,false);
 h.clickRendered(panel,'reload');assert.equal(h.reloads(),1);
 assert.equal(h.storage.getItem(constants.SAVE_KEY),original);
 assert.equal(h.storage.writes.filter(write=>write.key===constants.SAVE_KEY).length,0);
 assert.match(fixture.panel(),/计时余量 &lt; 0/,'a later toast does not erase the original cause');
});

for(const rejected of [false,true])test(`offline ${rejected?'exception':'failed result'} preserves pending time and raw backup across repeated recovery clicks`,async t=>{
 const h=harness(t,stored(()=>{},12000)),original=h.storage.getItem(constants.SAVE_KEY);fixture.load();
 fixture.failOffline('离线结算中断：检测到 <异常>',rejected);await fixture.settlePending();
 assert.equal(fixture.state().settlementFailureKind,'offline');assert.equal(fixture.canAct(),false);
 assert.equal(fixture.state().vm.pendingOffline,12);
 const banner=h.nodes.get('#status').innerHTML;assert.match(banner,/离线结算中断/);
 h.clickRendered(banner,'saves');
 assert.match(fixture.panel(),/检测到 &lt;异常&gt;/);assert.doesNotMatch(fixture.panel(),/data-command="export"/);
 for(let n=0;n<2;n++){
  h.clickRendered(fixture.panel(),'backup-slot');h.clickRendered(fixture.panel(),'reload');
  assert.equal(h.downloads.at(-1).text,original);
 }
 assert.equal(h.reloads(),2);assert.equal(fixture.state().vm.pendingOffline,12);
 assert.equal(h.storage.getItem(constants.SAVE_KEY),original);assert.equal(h.storage.getItem(legacyKey),'untouched legacy bytes');
 assert.equal(h.storage.writes.filter(write=>write.key===constants.SAVE_KEY).length,0);
});

test('reloading a saved game clears a stale UI failure and retries pending time without discarding it',async t=>{
 const h=harness(t,stored(()=>{},12000)),original=h.storage.getItem(constants.SAVE_KEY);fixture.load();
 fixture.failOffline('暂时失败');await fixture.settlePending();assert.equal(fixture.state().settlementFailed,true);
 fixture.reloadGame();
 assert.equal(fixture.state().settlementFailed,false);assert.equal(fixture.state().settlementFailureMessage,'');
 assert.equal(fixture.state().vm.pendingOffline,12);assert.equal(h.storage.getItem(constants.SAVE_KEY),original);
 await fixture.settlePending();assert.equal(fixture.state().vm.pendingOffline,0);assert.equal(fixture.state().vm.ticks,60);
 assert.equal(fixture.canAct(),true);
});
