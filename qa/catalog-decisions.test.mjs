import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createGame} from '../src/engine/index.js';
import {page,detailDialog} from '../src/ui/render.js';
import {purchasePreview,itemCatalog} from '../src/ui/catalog.js';
import {immediateShortages,acquisitionMarkup} from '../src/ui/decision-navigation.js';
import {createTab,sharedStorage,clickRendered} from './dom-harness.mjs';

test('目录选择保留实际建筑，浏览和收益预览不会花费资源',async()=>{
 const tab=await createTab(sharedStorage(s=>{s.settings.paused=true;s.resources.honey=1000;}));
 tab.location.hash='#build';await tab.windowEvent('hashchange');const before=tab.snapshot().resources.map(r=>r.value);
 await clickRendered(tab,{catalogView:'build'});assert.match(tab.doc.node('#main-content').innerHTML,/class="item-catalog"/);
 await clickRendered(tab,{buildChoice:'hut'});assert.match(tab.doc.node('#main-content').innerHTML,/aria-label="建造一座树洞熊舍"/);
 assert.deepEqual(tab.snapshot().resources.map(r=>r.value),before);
 assert.match(tab.doc.node('#main-content').innerHTML,/class="immediate-shortages" data-task-target="buildings:hut"/);
 assert.match(tab.doc.node('#main-content').innerHTML,/data-acquire-recipe="wood"/);
});

test('建造和详情展示真实净产量，缺材料时明确说明未扣费',()=>{
 const seed=JSON.parse(readFileSync(new URL('campaign/first-space.save.json',import.meta.url)));seed.savedAt=0;
 const game=createGame({storage:null,save:JSON.stringify(seed),now:0}),vm=game.snapshot({batchTarget:{section:'buildings',id:'hive'}});
 const preview=vm.buildingPreviews.find(p=>p.id==='hive'),honey=preview.resources.find(r=>r.id==='honey');assert.ok(honey.rateDelta>3);
 const body=page(vm,{page:'build',buildChoice:'hive'});assert.match(body,/建成后的变化/);assert.match(body,/蜂蜜净产量/);
 assert.match(detailDialog(vm.buildings.find(c=>c.id==='hive'),'buildings',vm),/建成后的变化/);
 const fresh=createGame({storage:null,now:0}).snapshot({buildingTargets:['hut']});assert.match(purchasePreview(fresh,'hut'),/未扣除建造费用/);
});

test('扩容入口优先于等待材料，目录完整展示可选项目',()=>{
 const vm=createGame({storage:null,now:0}).snapshot(),hut=vm.buildings.find(c=>c.id==='hut');
 const blocked={...hut,costs:[{id:'wood',name:'木材',value:1000,owned:0}]};
 assert.match(immediateShortages(blocked,'buildings',vm),/木材需扩容/);
 const catalog=itemCatalog(vm.buildings.filter(c=>c.unlocked),'buildings','hut',vm);
 assert.match(catalog,/aria-label="全部建筑"/);assert.match(catalog,/基础：/);assert.match(catalog,/需要/);
});

test('研究与配方搜索按需展开，同时保留可检索的具体用途',()=>{
 const game=createGame({storage:null,now:0}),vm=game.snapshot();
 const research=page(vm,{page:'research',researchTab:'science'});
 assert.match(research,/<details class="choice-filters research-filter-options research-controls"[^>]*><summary>/);
 assert.match(research,/data-ui-search="researchQuery"/);
});

test('尚未开放的月晶来源给出前置行动，不会把玩家送进空白来源页',()=>{
 const seed=JSON.parse(readFileSync(new URL('campaign/industry-and-rocketry.save.json',import.meta.url)));seed.savedAt=0;
 const vm=createGame({storage:null,save:JSON.stringify(seed),now:0}).snapshot();
 const source=acquisitionMarkup(vm,'unobtainium');
 assert.match(source,/acquisition-explanation/);assert.match(source,/月|轨道|远航/);assert.match(source,/data-detail=|data-system=|data-nav=/);
 const card={id:'test',costs:[{id:'unobtainium',name:'月晶',value:1,owned:0}]};
 const shortage=immediateShortages(card,'science',vm);assert.match(shortage,/data-task-target="science:test"/);
 assert.doesNotMatch(shortage,/data-resource="unobtainium"/);
});
