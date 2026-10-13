import test from 'node:test';
import assert from 'node:assert/strict';
import {createTab,sharedStorage,advance} from './dom-harness.mjs';
import {journalGroups,markNoticesRead} from '../src/ui/journal.js';
import {createGame} from '../src/engine/index.js';
import {explorationMenu,resourcesDialog} from '../src/ui/render.js';

const key='honeywood-ui-v1';
test('固定第四项明确指出替换并可恢复，游戏资源保持不变',async()=>{
 const storage=sharedStorage(s=>{s.settings.paused=true;s.resources.honey=100;s.resources.wood=50;s.resources.minerals=40;s.resources.science=30;});
 storage.setItem(key,JSON.stringify({resourcePins:['honey','wood','minerals']}));
 const tab=await createTab(storage),before=tab.snapshot().resources.map(r=>[r.id,r.value]);
 await tab.click({command:'resources'});await tab.click({resourcePin:'science'});
 assert.deepEqual(JSON.parse(storage.getItem(key)).resourcePins,['wood','minerals','science']);
 assert.match(tab.doc.node('.dialog-body').innerHTML,/替换了蜂蜜/);
 await tab.click({command:'undo-pin'});
 assert.deepEqual(JSON.parse(storage.getItem(key)).resourcePins,['honey','wood','minerals']);
 assert.deepEqual(tab.snapshot().resources.map(r=>[r.id,r.value]),before);
});

test('手记打开不自动读完，标记只覆盖本次展示的消息',async()=>{
 const storage=sharedStorage(s=>{s.settings.paused=false;s.buildings.hive=20;s.buildings.hut=1;s.resources.honey=2000;s.arrival=.99;});
 storage.setItem(key,JSON.stringify({notices:[{id:'old',title:'已有记录',body:'先前的成长',read:false}]}));
 const tab=await createTab(storage);await tab.click({command:'journal'});
 assert.equal(JSON.parse(storage.getItem(key)).notices.find(n=>n.id==='old').read,false);
 advance(2000);tab.step();await tab.click({command:'read-displayed-notices'});
 const notes=JSON.parse(storage.getItem(key)).notices;
 assert.equal(notes.find(n=>n.id==='old').read,true);
 assert.equal(notes.find(n=>n.id==='story:first-bear').read,false);
 await tab.click({command:'refresh-journal'});assert.match(tab.doc.node('#dialog-root').innerHTML,/家园成长/);
 await tab.click({command:'read-displayed-notices'});
 assert.ok(JSON.parse(storage.getItem(key)).notices.every(n=>n.read));
});

test('离线、解锁和成长分组，未展示的手记不被批量标记',()=>{
 const notes=[{id:'offline:1',read:false},{id:'system:space',read:false},{id:'story:first-bear',read:false},{id:'region:wood',read:false}];
 assert.deepEqual(journalGroups(notes).map(g=>g.id),['return','unlock','growth','other']);
 assert.deepEqual(markNoticesRead(notes,['offline:1']).map(n=>n.read),[true,false,false,false]);
 assert.ok(notes.every(n=>!n.read));
});

test('更多按功能分组且固定入口不重复，库存明确固定上限',()=>{
 const vm=createGame({storage:null,now:0}).snapshot(),html=explorationMenu(vm,{systemPins:['crafts']});
 const ids=[...html.matchAll(/data-system="([^"]+)"/g)].map(m=>m[1]);
 assert.equal(ids.length,new Set(ids).size);assert.match(html,/记录与设置/);
 assert.match(resourcesDialog(vm,null,{resourcePins:['honey']}),/顶部已固定 1\/3/);
});
