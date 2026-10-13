import test from 'node:test';
import assert from 'node:assert/strict';
import {createTab,sharedStorage,clickRendered,advance} from './dom-harness.mjs';
import {createGame} from '../src/engine/index.js';
import {jobTransferDialog} from '../src/ui/job-transfer.js';
import {page,resourceBar} from '../src/ui/render.js';

const fixture=(paused=true)=>sharedStorage(s=>{
 s.settings.paused=paused;s.settings.offline=false;s.science.agriculture=true;
 s.buildings.hut=3;s.resources.honey=100;
 s.bears=[1,2,3].map(id=>({id,name:`伙伴${id}`,job:'woodcutter',skills:{},rank:0,experience:0}));s.nextBearId=4;
});

test('无空闲伙伴直接调岗：预览与数量切换不修改状态，确认一次转移实际人数',async()=>{
 const tab=await createTab(fixture());tab.location.hash='#village';await tab.windowEvent('hashchange');
 const before=tab.snapshot();assert.equal(before.bears.free,0);
 await clickRendered(tab,{jobTransfer:'farmer'});
 assert.match(tab.doc.node('#dialog-root').innerHTML,/将调动 1 只伙伴/);
 assert.match(tab.doc.node('#dialog-root').innerHTML,/蜂蜜净收支/);
 await tab.event('change',{target:{dataset:{jobTransferField:'amount'},value:'5'}});
 assert.match(tab.doc.node('#dialog-root').innerHTML,/将调动 3 只伙伴/);
 assert.deepEqual(tab.snapshot().jobs.map(j=>j.assigned),before.jobs.map(j=>j.assigned));
 assert.deepEqual(tab.snapshot().resources,before.resources);
 await clickRendered(tab,{command:'confirm-job-transfer'},'#dialog-root');
 const after=tab.snapshot();assert.equal(after.jobs.find(j=>j.id==='woodcutter').assigned,0);assert.equal(after.jobs.find(j=>j.id==='farmer').assigned,3);
 assert.equal(after.bears.free,0);assert.equal(tab.doc.node('#dialog-root').innerHTML,'');
 assert.ok(after.resources.find(r=>r.id==='honey').rate>before.resources.find(r=>r.id==='honey').rate);
});

test('调岗取消不改岗位，失效来源保持明确选中且禁止确认',async()=>{
 const tab=await createTab(fixture());const before=tab.snapshot().jobs.map(j=>j.assigned);
 await tab.click({command:'job-transfer'});await tab.click({command:'close'});
 assert.deepEqual(tab.snapshot().jobs.map(j=>j.assigned),before);
 const vm=createGame({storage:null,now:0}).snapshot({jobTransfer:{from:'woodcutter',to:'farmer',amount:1}});
 const html=jobTransferDialog(vm,{from:'woodcutter',to:'farmer',amount:1});
 assert.match(html,/<option value="woodcutter" selected disabled>[^<]+当前不可用/);
 assert.match(html,/data-command="confirm-job-transfer" aria-disabled="true"/);
});

test('低幸福度主因直接可见，口粮告警保留按钮语义且同一风险级别不会连续播报',async()=>{
 const vm=createGame({storage:null,now:0}).snapshot();vm.bears={...vm.bears,value:3,happiness:50,happinessBreakdown:[{label:'拥挤',value:-30},{label:'基础',value:100}]};
 vm.resources.find(r=>r.id==='honey').rate=-1;vm.settings.paused=false;
 assert.match(page(vm,{page:'village'}),/幸福度偏低 · 主要影响：拥挤/);
 assert.match(resourceBar(vm),/<button class="food-risk"[^>]*aria-label=/);
 assert.doesNotMatch(resourceBar(vm),/<button class="food-risk"[^>]*role="status"/);
 const tab=await createTab(fixture(false));advance(400);tab.step();
 assert.match(tab.doc.node('#announcer').textContent,/口粮|蜂蜜/);
 tab.doc.node('#announcer').textContent='保持当前播报';advance(400);tab.step();
 assert.equal(tab.doc.node('#announcer').textContent,'保持当前播报');
});
