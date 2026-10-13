import test from 'node:test';
import assert from 'node:assert/strict';
import {createTab,sharedStorage} from './dom-harness.mjs';
const switchTo=async(t,route)=>{t.location.hash='#'+route;await t.windowEvent('hashchange');};

test('补材料后返回原详情，并保留建造列表位置',async()=>{
 const t=await createTab(sharedStorage(s=>{s.settings.paused=true;s.resources.honey=1000;}));
 await switchTo(t,'build');t.doc.node('.construction-workbench').scrollTop=240;
 await t.click({detail:'buildings:hut'});await t.click({acquireRecipe:'wood'});
 await switchTo(t,'more/crafts');
 assert.match(t.doc.node('#resource-bar').innerHTML,/return-task/);
 await t.click({act:'refine',id:'wood'});assert.equal(t.snapshot().resources.find(r=>r.id==='wood').value,1);
 await t.click({command:'return-task'});await switchTo(t,'build');
 assert.match(t.doc.node('#dialog-root').innerHTML,/树洞熊舍/);
 assert.equal(t.doc.node('.construction-workbench').scrollTop,240);
 assert.doesNotMatch(t.doc.node('#resource-bar').innerHTML,/return-task/);
});

test('系统返回原来的家园地区，追踪返回可定位其他目标',async()=>{
 const t=await createTab(sharedStorage(s=>{s.settings.paused=true;s.buildings.lumberMill=1;s.buildings.workshop=1;}));
 await switchTo(t,'home/crafts');await t.click({system:'crafts'});await switchTo(t,'more/crafts');
 await t.click({command:'return-system'});assert.equal(t.location.hash,'home/crafts');
 await switchTo(t,'home/crafts');await t.click({trackTarget:'buildings:hive'});
 await t.click({resumeTarget:'buildings:hive'});await switchTo(t,'build');
 assert.match(t.doc.node('#dialog-root').innerHTML,/蜂箱/);
 assert.match(t.doc.node('#resource-bar').innerHTML,/追踪：蜂箱/);
});

test('布局、排序与最近选择可恢复，手记明确标记后清除未读记录',async()=>{
 const storage=sharedStorage(s=>{s.settings.paused=true;s.buildings.library=3;s.resources.science=500;});
 const t=await createTab(storage);await t.click({command:'toggle-management-map'});
 await t.click({buildSort:'recent'});await t.click({buildChoice:'hut'});
 let saved=JSON.parse(storage.getItem('honeywood-ui-v1'));
 assert.equal(saved.managementMapCollapsed,true);assert.equal(saved.buildSort,'recent');assert.deepEqual(saved.recentBuildings,['hut']);
 await t.click({act:'research',id:'calendar'});
 saved=JSON.parse(storage.getItem('honeywood-ui-v1'));assert.ok(saved.notices.some(note=>!note.read));
 await t.click({command:'journal'});assert.ok(JSON.parse(storage.getItem('honeywood-ui-v1')).notices.some(note=>!note.read));
 await t.click({command:'read-displayed-notices'});saved=JSON.parse(storage.getItem('honeywood-ui-v1'));
 assert.ok(saved.notices.length);assert.ok(saved.notices.every(note=>note.read));
});
