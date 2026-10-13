/** Save/return regressions against the actual app. Test harness has only extra v3 DOM stubs; no layout/browser verification. */
import test from 'node:test';
import assert from 'node:assert/strict';
import {createTab,sharedStorage,advance,now} from './dom-harness.mjs';
import {MAX_SAVE_BYTES,createState,parseSave,serialize} from '../src/engine/save.js';
import {loadGame} from '../src/engine/index.js';
import {constants} from '../src/engine/catalog.js';
const SAVE=constants.SAVE_KEY,LEASE='honeywood-active-tab-v1',UI='honeywood-ui-v1';
const value=tab=>tab.snapshot().resources.find(r=>r.id==='honey').value;
const flush=async()=>{for(let i=0;i<10;i++)await Promise.resolve();};
const fileFor=(honey=99)=>{const s=createState(123,now());s.resources.honey=honey;const text=serialize(s,now());return {name:'recovery.json',size:Buffer.byteLength(text),text:async()=>text};};

test('save-slot read failure protects existing progress through manual, lifecycle and automatic saves',async()=>{
 const storage=sharedStorage(s=>s.resources.honey=100),read=storage.getItem;let reject=true;
 storage.getItem=k=>{if(k===SAVE&&reject){reject=false;throw Error('temporary read failure');}return read(k);};
 const before=storage.values.get(SAVE),tab=await createTab(storage);
 assert.equal(tab.snapshot().saveStatus.ok,false);
 await tab.click({command:'save'});await tab.windowEvent('pagehide');advance(16000);tab.step();
 assert.equal(storage.values.get(SAVE),before);assert.match(tab.doc.node('#toast').textContent,/原存档未能读取|避免覆盖/);
});

test('a preference-write failure neither pauses the true owner nor gives a stale tab ownership',async()=>{
 const storage=sharedStorage(s=>s.resources.honey=10),write=storage.setItem;
 storage.setItem=(k,v)=>{if(k===UI)throw Error('preference quota');return write(k,v);};
 const a=await createTab(storage),b=await createTab(storage);
 await a.click({command:'motion'});await a.click({act:'gather',id:'honey'});assert.equal(value(a),11);
 await b.click({command:'takeover'});await b.click({act:'gather',id:'honey'});await b.click({act:'gather',id:'honey'});await b.click({command:'save'});
 const owned=storage.values.get(SAVE);assert.equal(JSON.parse(owned).resources.honey,12);
 // No storage event has been delivered to A yet: direct ownership checks must still protect B.
 await a.click({act:'gather',id:'honey'});assert.equal(value(a),11);await a.click({command:'save'});await a.windowEvent('pagehide');
 await a.windowEvent('storage',{key:LEASE});assert.equal(storage.values.get(SAVE),owned);assert.match(a.doc.node('#main-content').innerHTML,/本页暂时只读/);
});

test('save-write quota failure cannot grant ownership after another tab takes over',async()=>{
 const storage=sharedStorage(s=>s.resources.honey=10),write=storage.setItem;let reject=false;
 storage.setItem=(k,v)=>{if(k===SAVE&&reject){reject=false;throw Error('save quota');}return write(k,v);};
 const a=await createTab(storage),b=await createTab(storage);reject=true;await a.click({command:'save'});assert.equal(a.snapshot().saveStatus.ok,false);
 await b.click({command:'takeover'});await b.click({act:'gather',id:'honey'});await b.click({command:'save'});const owned=storage.values.get(SAVE);
 await a.click({command:'save'});await a.windowEvent('pagehide');assert.equal(storage.values.get(SAVE),owned);
});

test('failed lease acquisition stays read-only and never claims takeover success',async()=>{
 const storage=sharedStorage(s=>s.resources.honey=10),write=storage.setItem;
 storage.setItem=(k,v)=>{if(k===LEASE)throw Error('lease writes unavailable');return write(k,v);};
 const original=storage.values.get(SAVE),tab=await createTab(storage);await tab.click({act:'gather',id:'honey'});assert.equal(value(tab),10);
 await tab.click({command:'takeover'});assert.match(tab.doc.node('#toast').textContent,/无法取得保存权限/);await tab.windowEvent('pagehide');assert.equal(storage.values.get(SAVE),original);
});

test('failed startup catch-up exposes recovery and keeps the stored checkpoint intact',async()=>{
 const storage=sharedStorage(s=>{s.settings.offline=true;s.buildings.hive=1;s.resources.honey=100;});
 const old=JSON.parse(storage.values.get(SAVE));old.savedAt-=600000;storage.values.set(SAVE,JSON.stringify(old));
 const before=storage.values.get(SAVE),tab=await createTab(storage);assert.ok(tab.timeouts.length);
 tab.activate();globalThis.setTimeout=()=>{throw Error('injected scheduling failure');};tab.timeouts.shift()();await flush();
 const snapshot=tab.snapshot();assert.equal(snapshot.pendingOffline,600);assert.equal(snapshot.catchingUp,false);
 assert.match(tab.doc.node('#dialog-root').innerHTML,/结算暂时遇到了问题/);assert.match(tab.doc.node('#dialog-root').innerHTML,/data-command="reload"/);
 await tab.click({act:'gather',id:'honey'});await tab.click({command:'close'});await tab.windowEvent('pagehide');advance(16000);tab.step();
 assert.equal(value(tab),100);assert.equal(storage.values.get(SAVE),before);assert.match(tab.doc.node('#dialog-root').innerHTML,/重新加载/);
 let reloaded=false;tab.location.reload=()=>{reloaded=true;};await tab.click({command:'reload'});assert.equal(reloaded,true);
});

test('failed resume catch-up retains the original timestamp and full replay interval',async()=>{
 const storage=sharedStorage(s=>{s.settings.offline=true;s.buildings.hive=1;s.resources.honey=100;}),tab=await createTab(storage);
 tab.doc.hidden=true;await tab.event('visibilitychange');const before=storage.values.get(SAVE);advance(600000);tab.doc.hidden=false;
 tab.activate();globalThis.setTimeout=()=>{throw Error('injected scheduling failure');};tab.doc.listeners.visibilitychange[0]();await flush();
 assert.match(tab.doc.node('#dialog-root').innerHTML,/结算暂时遇到了问题/);assert.equal(storage.values.get(SAVE),before);
 await tab.windowEvent('pagehide');tab.step();assert.equal(storage.values.get(SAVE),before);
 const replay=loadGame({storage,now:now(),deferOffline:true});assert.equal(replay.snapshot().pendingOffline,600);assert.equal(replay.snapshot().resources.find(r=>r.id==='honey').value,100);
});

test('import confirmation rechecks lease before mutation even when the storage event is delayed',async()=>{
 const storage=sharedStorage(s=>s.resources.honey=10),a=await createTab(storage),b=await createTab(storage),input={id:'save-file',files:[fileFor()],value:'original path'};
 await a.event('change',{target:input});assert.equal(input.value,'');assert.match(a.doc.node('#dialog-root').innerHTML,/确认继续/);
 await b.click({command:'takeover'});await b.click({act:'gather',id:'honey'});await b.click({command:'save'});const owned=storage.values.get(SAVE);
 await a.click({command:'confirm'});assert.equal(value(a),10);assert.equal(storage.values.get(SAVE),owned);assert.match(a.doc.node('#toast').textContent,/请先在此页继续/);
});

test('an imported state that cannot be saved reports its memory-only state honestly',async()=>{
 const storage=sharedStorage(s=>s.resources.honey=10),write=storage.setItem;let reject=false;
 storage.setItem=(k,v)=>{if(k===SAVE&&reject)throw Error('save quota');return write(k,v);};
 const tab=await createTab(storage),before=storage.values.get(SAVE);await tab.event('change',{target:{id:'save-file',files:[fileFor()],value:'same file'}});reject=true;
 await tab.click({command:'confirm'});assert.equal(value(tab),99);assert.equal(storage.values.get(SAVE),before);assert.match(tab.doc.node('#toast').textContent,/当前页面.*保存失败.*导出备份/);
});

test('the ordinary 17,000-bear export now passes strict import and keeps exact serializer bytes',()=>{
 const s=createState(17,1);s.bears=Array.from({length:17000},(_,i)=>({id:i+1,name:`小熊 ${i+1}`,job:'woodcutter',trait:'none',rank:1,experience:1000,skills:{woodcutter:1000}}));s.nextBearId=17001;
 const before=structuredClone(s),expected=JSON.parse(JSON.stringify(s));expected.savedAt=9;const output=serialize(s,9);
 assert.ok(output.length>2000000);assert.ok(Buffer.byteLength(output)<MAX_SAVE_BYTES);assert.equal(output,JSON.stringify(expected));assert.deepEqual(s,before);
 const parsed=parseSave(output,9);assert.equal(parsed.bears.length,17000);assert.deepEqual(parsed.bears,s.bears);
});

test('byte limit rejects oversized valid multibyte JSON even below the character limit',()=>{
 const base=serialize(createState(17,1),1);const extra='中'.repeat(Math.floor(MAX_SAVE_BYTES/3));
 const text=base.slice(0,-1)+',"ignoredPadding":"'+extra+'"}';
 assert.ok(text.length<MAX_SAVE_BYTES);assert.ok(Buffer.byteLength(text)>MAX_SAVE_BYTES);assert.doesNotThrow(()=>JSON.parse(text));assert.throws(()=>parseSave(text),/文件过大/);
});

test('byte-limit boundary is inclusive and rejects one extra byte of valid JSON whitespace',()=>{
 const base=serialize(createState(17,1),1),exact=base+' '.repeat(MAX_SAVE_BYTES-Buffer.byteLength(base));
 assert.equal(Buffer.byteLength(exact),MAX_SAVE_BYTES);assert.doesNotThrow(()=>parseSave(exact));assert.throws(()=>parseSave(exact+' '),/文件过大/);
});
