import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame,catalog} from '../src/engine/index.js';
import {detailDialog,recipePanel} from '../src/ui/render.js';

// 用合成库存对照真实批量结算，避免通过展示公式自证。
function fixture(edit=()=>{}){const g=createGame({storage:null,now:1,seed:13}),s=JSON.parse(g.export());edit(s);const result=g.importSave(JSON.stringify(s));assert.equal(result.ok,true,result.message);g.snapshot();return g;}
function rich(s){for(const c of catalog.science)s.science[c.id]=true;for(const r of catalog.resources)s.resources[r.id]=1e8;s.praised=1e8;s.religion.transcendence=1;s.workshop.chronoforge=true;s.buildings.workshop=2;s.discoveries.lizards=true;for(const d of catalog.space)if(d.family==='mission'){s.space[d.id]=1;if(d.destination)s.spaceReached[d.id]=true;}s.space.sattelite=2;s.time.blastFurnace=2;s.religion.solarchant=2;s.embassies.lizards=2;}
test('建造、祈愿、星际、时间与使馆的批量总价等于真实扣款',()=>{
 const targets=[['buildings','hive','build'],['faith','solarchant','faith'],['space','sattelite','space'],['time','blastFurnace','time'],['embassies','lizards','embassy']];
 for(const [section,id,type] of targets)for(const amount of [5,'max']){
  const g=fixture(rich),before=g.export(),vm=g.snapshot({batchTarget:{section,id}}),preview=vm.batchPreview?.options.find(o=>o.amount===amount);assert.equal(g.export(),before);assert.ok(preview?.available,`${section}/${id}/${amount}`);
  const result=g.act(type,id,amount);assert.equal(result.ok,true,result.message);const after=g.snapshot();
  for(const cost of preview.costs){const actual=vm.resources.find(r=>r.id===cost.id).value-after.resources.find(r=>r.id===cost.id).value;assert.ok(Math.abs(actual-cost.value)<1e-5,`${section}/${id}/${cost.id}`);}
 }
});
test('几何递增价格不能用单价乘数量代替',()=>{
 const g=fixture(s=>{s.buildings.hive=3;s.resources.honey=10000;}),vm=g.snapshot({batchTarget:{section:'buildings',id:'hive'}}),[one,five]=vm.batchPreview.options;
 assert.ok(five.costs[0].value>one.costs[0].value*5);assert.match(detailDialog(vm.buildings.find(c=>c.id==='hive'),'buildings',vm),/总消耗/);
});
test('制作预览准确标注满仓损失，批量操作继续要求确认',()=>{
 const g=fixture(s=>{s.resources.wood=195;s.resources.honey=10000;}),vm=g.snapshot({batchTarget:{section:'crafts',id:'wood'}}),preview=vm.batchPreview.options.find(o=>o.amount==='max');
 assert.equal(preview.output.stored,5);assert.equal(preview.output.lost,95);
 const html=recipePanel(vm,{recipeChoice:'wood'});assert.match(html,/实际入库 5/);assert.match(html,/溢出损失 95/);assert.match(html,/data-amount="max"[^>]*data-confirm="[^"]+总消耗/);
 assert.equal(g.act('refine','wood','max').ok,true);assert.equal(g.snapshot().resources.find(r=>r.id==='wood').value,200);
});
test('工坊与领袖制作加成计入预览，贸易总价沿用真实费用',()=>{
 const g=fixture(s=>{s.buildings.workshop=5;s.buildings.factory=3;s.workshop.register=true;s.resources.wood=17500;s.ironWill=false;s.bears=[{id:1,name:'巧手领袖',trait:'engineer',job:null,rank:0,experience:0,skills:{}}];s.nextBearId=2;s.leaderId=1;}),vm=g.snapshot({batchTarget:{section:'crafts',id:'beam'}}),five=vm.batchPreview.options.find(o=>o.amount===5);
 assert.ok(five.output.total>5);assert.equal(g.act('craft','beam',5).ok,true);assert.ok(Math.abs(g.snapshot().resources.find(r=>r.id==='beam').value-five.output.stored)<1e-9);
 const trade=fixture(rich),before=trade.snapshot({batchTarget:{section:'trades',id:'lizards'}}),bill=before.batchPreview.options.find(o=>o.amount===5);assert.equal(trade.act('trade','lizards',5).ok,true);const after=trade.snapshot();
 for(const cost of bill.costs)assert.ok(Math.abs(before.resources.find(r=>r.id===cost.id).value-after.resources.find(r=>r.id===cost.id).value-cost.value)<1e-6);
});
test('不请求目标时不计算批量信息，未解锁与一次性项目不生成批次',()=>{
 const g=fixture();assert.equal(g.snapshot().batchPreview,null);assert.equal(g.snapshot({batchTarget:{section:'buildings',id:'reactor'}}).batchPreview,null);assert.equal(g.snapshot({batchTarget:{section:'science',id:'calendar'}}).batchPreview,null);
});
