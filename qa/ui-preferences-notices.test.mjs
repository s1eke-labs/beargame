import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizePreferences,addNotices,togglePin} from '../src/ui/preferences.js';
import {discoveryNotices} from '../src/ui/notices.js';
import {createGame} from '../src/engine/index.js';
import {createTab,sharedStorage} from './dom-harness.mjs';

const UI_KEY='honeywood-ui-v1';
test('界面偏好只接受有限数量的有效标识与合法目标',()=>{
 const value=normalizePreferences({resourcePins:['honey','wood','honey','science','iron','<img>'],systemPins:['space','unknown'],textSize:'huge',trackedTarget:{section:'__proto__',id:'x'},notices:[{id:'x',title:'标题',body:'说明',route:'javascript:alert(1)'}]});
 assert.deepEqual(value.resourcePins,['honey','wood','science']);assert.deepEqual(value.systemPins,['space']);
 assert.equal(value.textSize,'normal');assert.equal(value.trackedTarget,null);assert.equal(value.notices[0].route,'');
 assert.deepEqual(togglePin(['honey','wood','science'],'iron'),['wood','science','iron']);
 assert.deepEqual(togglePin(['honey','wood'],'honey'),['wood']);
});
test('重要通知去重并限制数量，不改写传入记录',()=>{
 const original=[{id:'a',title:'旧标题',body:'旧内容',route:'build',year:1}];
 const next=addNotices(original,[{id:'a',title:'新标题',body:'新内容',route:'research'},{id:'b',title:'第二项',body:'内容',route:'village'}],2);
 assert.equal(next.length,2);assert.equal(next[0].year,2);assert.equal(next[0].title,'新标题');assert.equal(original[0].title,'旧标题');
 assert.equal(addNotices([],Array.from({length:100},(_,i)=>({id:String(i),title:'事件',body:'说明'}))).length,80);
});
test('发现和迁区通知依据实际前后差异，初次加载与重启不误报',()=>{
 const previous=createGame({storage:null,now:1}).snapshot(),next=structuredClone(previous);
 assert.deepEqual(discoveryNotices(null,next),[]);
 next.science=[...next.science,{id:'new',name:'新知识',unlocked:true}];
 next.buildings.find(c=>c.id==='mine').owned=1;
 const middle=structuredClone(next);middle.buildings.find(c=>c.id==='quarry').owned=1;
 assert.ok(discoveryNotices(previous,next).some(n=>n.researchTab==='science'));
 const moved=discoveryNotices(next,middle).find(n=>n.route==='home/mines');assert.ok(moved);assert.match(moved.body,/现在位于矿脉山岭/);
 assert.deepEqual(discoveryNotices(next,next),[]);
 middle.stats.totalResets=(next.stats.totalResets||0)+1;assert.deepEqual(discoveryNotices(next,middle),[]);
});
test('实际事件处理保存固定资源、追踪目标与字号且不更改游戏规则',async()=>{
 const storage=sharedStorage(s=>s.settings.paused=true),t=await createTab(storage);
 const before=t.snapshot().resources.map(r=>[r.id,r.value]);
 await t.click({resourcePin:'honey'});await t.click({trackTarget:'buildings:hive'});
 await t.click({command:'settings'});await t.click({command:'text-size'});
 const saved=JSON.parse(storage.getItem(UI_KEY));assert.deepEqual(saved.resourcePins,['honey']);assert.deepEqual(saved.trackedTarget,{section:'buildings',id:'hive',targetOwned:1});assert.equal(saved.textSize,'large');
 assert.deepEqual(t.snapshot().resources.map(r=>[r.id,r.value]),before);
 assert.equal(t.doc.documentElement.getAttribute('data-text-size'),'large');
 await t.click({resourcePin:'honey'});await t.click({trackTarget:'buildings:hive'});
 const cleared=JSON.parse(storage.getItem(UI_KEY));assert.deepEqual(cleared.resourcePins,[]);assert.equal(cleared.trackedTarget,null);
});
test('研究开启后的重要通知可以在手记回看并按原分组跳转',async()=>{
 const storage=sharedStorage(s=>{s.settings.paused=true;s.buildings.library=3;s.resources.science=500;}),t=await createTab(storage);
 await t.click({act:'research',id:'calendar'});
 const notes=JSON.parse(storage.getItem(UI_KEY)).notices;
 const found=notes.find(n=>n.researchTab==='science');assert.ok(found);
 await t.click({command:'journal'});assert.match(t.doc.node('#dialog-root').innerHTML,/重要变化与发现/);
 assert.ok(t.doc.node('#dialog-root').innerHTML.includes(found.title));
 await t.click({noticeOpen:found.id});assert.equal(t.location.hash,'research');assert.equal(t.doc.node('#dialog-root').innerHTML,'');
});
test('资源获取链路可返回原详情，不会丢失弹窗父层',async()=>{
 const t=await createTab(sharedStorage(s=>s.settings.paused=true));
 await t.click({detail:'buildings:hive'});await t.click({resource:'honey'});
 assert.match(t.doc.node('#dialog-root').innerHTML,/返回上一项/);
 await t.click({command:'dialog-back'});assert.match(t.doc.node('#dialog-root').innerHTML,/蜂箱/);assert.doesNotMatch(t.doc.node('#dialog-root').innerHTML,/返回上一项/);
});
