import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame} from '../src/engine/index.js';
import {explorationMenu,resourcesDialog,shell} from '../src/ui/render.js';

const snapshot=()=>createGame({storage:null,now:0}).snapshot();
test('常用功能只出现一次，固定操作仅在编辑常用时出现',()=>{
 const vm=snapshot();vm.crafts=[{id:'beam',name:'木梁',unlocked:true,available:true}];
 const view=explorationMenu(vm,{systemPins:['crafts']});
 assert.equal((view.match(/data-system="crafts"/g)||[]).length,1);
 assert.match(view,/常用功能/);assert.doesNotMatch(view,/data-system-pin=/);
 const editing=explorationMenu(vm,{systemPins:['crafts'],editSystemPins:true});
 assert.equal((editing.match(/data-system="crafts"/g)||[]).length,1);
 assert.match(editing,/data-system-pin="crafts" aria-pressed="true"/);
});
test('库存默认折叠，定向访问只展开目标物资及其明细',()=>{
 const vm=snapshot(),plain=resourcesDialog(vm,null,{}),focused=resourcesDialog(vm,'honey',{});
 const inventoryTags=html=>[...html.matchAll(/<details class="inventory-item[^>]+>/g)].map(m=>m[0]);
 assert.ok(inventoryTags(plain).length>0);assert.ok(inventoryTags(plain).every(tag=>!tag.includes(' open')));
 assert.equal(inventoryTags(focused).filter(tag=>tag.includes(' open')).length,1);
 assert.match(inventoryTags(focused).find(tag=>tag.includes(' open')),/inventory-honey/);
 assert.match(focused,/data-breakdown="honey" open/);
});
test('追踪目标在所有主页面只有一个全局入口',()=>{
 const vm=snapshot();
 for(const page of ['home','build','research','village','more']){
  const html=shell(vm,{page,district:'village',trackedTarget:{section:'buildings',id:'hut'}});
  assert.equal((html.match(/aria-label="当前追踪目标"/g)||[]).length,1,page);
  assert.equal((html.match(/data-resume-target="buildings:hut"/g)||[]).length,1,page);
 }
});
