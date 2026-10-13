import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame,catalog} from '../src/engine/index.js';
import {page,resourceBar,resourcesDialog,detailDialog,hudResources,explorationKey} from '../src/ui/render.js';
import {decisionStatus,acquisitionMarkup} from '../src/ui/decision-navigation.js';
import {sceneKey} from '../src/ui/experience.js';

// 此处为隔离展示逻辑的合成存档，不作为自然进度记录。
function fixture(edit=()=>{}){const g=createGame({storage:null,now:1,seed:83});const s=JSON.parse(g.export());edit(s);assert.equal(g.importSave(JSON.stringify(s)).ok,true);g.snapshot();return g;}
const bear=(id,job=null)=>({id,name:'伙伴'+id,job,skills:{woodcutter:5000,scholar:9000,engineer:0},rank:id===1?3:0,experience:0,trait:'scientist'});
test('岗位边际预览与真实分配后的净收支一致，含季节、领袖与工业联动',()=>{
 for(const job of ['woodcutter','scholar','engineer','farmer'])for(const season of [0,3]){
  const g=fixture(s=>{for(const c of catalog.science)s.science[c.id]=true;s.workshop.register=true;s.workshop.ironAxes=true;s.buildings={library:3,barn:10,smelter:3,factory:1,hive:10,hut:5};s.resources.honey=1000;s.resources.wood=100;s.resources.minerals=100;s.resources.karma=12;s.resources.furs=30;s.calendar.season=season;s.bears=[bear(1),bear(2,'woodcutter'),bear(3)];s.nextBearId=4;s.leaderId=1;s.ironWill=false;});
  const before=g.export(),vm=g.snapshot({jobDetails:true}),d=vm.jobs.find(j=>j.id===job).decision;
  assert.equal(g.export(),before,'预览不得改变游戏或随机数');assert.ok(d.next);assert.ok(vm.bears.happinessBreakdown.length>1);
  assert.ok(Math.abs(vm.bears.happinessBreakdown.reduce((n,r)=>n+r.value,0)-vm.bears.happiness)<1e-7);
  assert.equal(g.act('assign',job,1).ok,true);const after=g.snapshot();
  for(const r of after.resources){const delta=r.rate-vm.resources.find(x=>x.id===r.id).rate,predicted=d.next.find(x=>x.id===r.id)?.rate||0;assert.ok(Math.abs(delta-predicted)<1e-7,`${job}/${season}/${r.id}`);}
 }
});
test('HUD固定资源与口粮风险独立，未解锁养蜂岗位时转向蜂箱',()=>{
 const g=fixture(s=>{s.bears=[bear(1)];s.nextBearId=2;s.buildings.hut=1;s.resources.honey=10;s.resourceUnlocked.science=true;});const vm=g.snapshot();
 const ui={page:'research',resourcePins:['wood','science']};assert.deepEqual(hudResources(vm,ui).slice(0,2).map(r=>r.id),['wood','science']);
 const html=resourceBar(vm,ui);assert.match(html,/resource-name/);assert.match(html,/resource-capacity/);assert.match(html,/class="food-risk" data-detail="buildings:hive"/);
});
test('搜索、主题、可完成筛选与目标所需库存作用于实际卡片',()=>{
 const vm=fixture(s=>{s.buildings.library=1;s.resources.science=100;}).snapshot();
 const html=page(vm,{page:'research',researchTab:'science',researchQuery:'四季',researchFilter:'available'});
 assert.match(html,/data-detail="science:calendar"/);assert.doesNotMatch(html,/data-detail="science:agriculture"/);
 const c=vm.science.find(c=>c.id==='calendar'),details=detailDialog(c,'science',vm,{trackedTarget:{section:'science',id:'calendar'}});
 assert.match(details,/前置条件/);assert.match(details,/开启：养蜂学/);assert.match(details,/data-act="queueEnqueue" data-id="research:calendar"/);assert.match(details,/取消追踪/);
 const stock=resourcesDialog(vm,null,{inventoryFilter:'needed',trackedTarget:{section:'science',id:'calendar'}});assert.match(stock,/data-resource-pin="science"/);assert.doesNotMatch(stock,/data-resource-pin="honey"/);
});
test('后期研究从实际前置关系展示后续用途并隔离返回数组',()=>{
 const g=fixture(),vm=g.snapshot();
 const expectations={metaphysics:'营建记忆',metalurgy:'矿用钻机',ecology:'碳素封存',oilProcessing:'煤油',cryptotheology:'夜晶碑'};
 for(const [id,name] of Object.entries(expectations)){
  const c=vm.science.find(c=>c.id===id);assert.ok(c.opens.includes(name),id);assert.ok(c.decisionBenefit);assert.ok(c.prerequisites.some(p=>p.section==='science'&&p.alternative));
  const html=detailDialog({...c,unlocked:true},'science',vm);assert.match(html,new RegExp(name));assert.match(html,/前置条件/);
 }
 vm.science.find(c=>c.id==='metaphysics').opens.push('错误外部修改');assert.ok(!g.snapshot().science.find(c=>c.id==='metaphysics').opens.includes('错误外部修改'));
});
test('暂停不显示等待倒计时，缺口路径匹配资源与扩容建筑',()=>{
 const vm=fixture(s=>{s.buildings.library=1;s.science.calendar=true;s.science.agriculture=true;}).snapshot();
 vm.settings.paused=true;const c=vm.science.find(c=>c.id==='mining');c.costs=[{id:'wood',name:'木材',value:200,owned:0}];vm.resources.find(r=>r.id==='wood').rate=1;
 assert.doesNotMatch(decisionStatus(c,vm),/按当前净产量约/);
 assert.match(acquisitionMarkup(vm,'science',{blocked:true}),/buildings:library/);assert.doesNotMatch(acquisitionMarkup(vm,'science',{blocked:true}),/buildings:barn/);
});
test('建造、队列、改建和生产管理为同级且状态变化使地图失效',()=>{
 const vm=fixture(s=>{for(const c of catalog.science)s.science[c.id]=true;s.buildings.library=1;s.buildings.smelter=1;s.buildings.pasture=1;}).snapshot();
 const html=page(vm,{page:'build',buildTab:'industry'});assert.match(html,/data-build-tab="build"/);assert.match(html,/data-build-tab="queue"/);assert.match(html,/data-build-tab="stages"/);assert.match(html,/data-build-tab="industry"/);assert.match(html,/data-act="toggle" data-id="smelter"/);assert.doesNotMatch(html,/class="advanced-section queue-panel"/);
 const a=sceneKey(vm,{page:'home'});vm.energy={supply:0,demand:10};assert.notEqual(sceneKey(vm,{page:'home'}),a);
 const b=sceneKey(vm,{page:'home'});vm.resources.find(r=>r.id==='wood').value=vm.resources.find(r=>r.id==='wood').max;assert.notEqual(sceneKey(vm,{page:'home'}),b);
 const map=explorationKey(vm);vm.buildings.find(c=>c.id==='smelter').enabled=false;assert.notEqual(explorationKey(vm),map,'地图异常概览也应随设施状态刷新');
});
