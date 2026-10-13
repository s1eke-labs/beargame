import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame} from '../src/chapters/forest/engine.js';
import {createState,serialize} from '../src/chapters/forest/save.js';
import {forestGuidance,forestBenefits,researchMatches,resourceHorizon,batchPreview,buildingCondition} from '../src/chapters/forest/main.js';
const scenario=edit=>{const s=createState(12,1);edit(s);return createGame({save:serialize(s,1),now:1,storage:null});};
test('森林新手缺粮时只推荐已解锁的补给方式',()=>{
 const game=createGame();for(let n=0;n<610;n++)game.act('gather','honey');game.act('build','hive');for(let n=0;n<5;n++)game.act('refine','wood');game.act('build','hut');game.tick(20);
 const v=game.snapshot(),g=forestGuidance(v);assert.equal(v.bears.value,1);assert.ok(v.resources.find(r=>r.id==='honey').rate<0);assert.equal(g.page,'build');assert.equal(g.card.id,'hive');assert.match(g.text,/尚未解锁/);
 const unlocked=scenario(s=>{s.buildings={hive:1,hut:1};s.science.agriculture=true;s.resources.honey=10;});unlocked.tick(20);assert.equal(forestGuidance(unlocked.snapshot()).job,'farmer');
});
test('森林目标处理知识零产量、仓储不足和等待入住',()=>{
 const game=scenario(s=>{s.buildings={hive:20,hut:1,library:1};s.resources.honey=1500;});let v=game.snapshot();assert.ok('progress' in forestGuidance(v));game.tick(20);v=game.snapshot();v.bears.free=0;
 assert.equal(forestGuidance(v,{section:'science',id:'calendar'}).job,'scholar');
 v.science.find(c=>c.id==='calendar').costs[0].value=1000;
 const g=forestGuidance(v,{section:'science',id:'calendar'});assert.equal(g.card.id,'library');assert.match(g.title,/容量/);
});
test('森林收益和研究查找使用实际解锁与产出数据',()=>{
 const v=createGame().snapshot(),c=v.science.find(c=>c.id==='agriculture');assert.match(forestBenefits(c,'science',v),/养蜂熊/);assert.equal(researchMatches(c,'养蜂熊'),true);assert.equal(researchMatches({...c,available:false},'',true),false);
 assert.match(forestBenefits(v.crafts[0],'crafts',v),/每次获得 1 木材/);assert.match(resourceHorizon({rate:-2,value:120,max:500}),/1 分钟/);assert.match(resourceHorizon({rate:3,value:500,max:500}),/已满仓/);
});
test('森林岗位增量预览与真实分配结果一致且快照不修改存档',()=>{
 const game=scenario(s=>{s.buildings={hive:20,hut:1,library:1};s.resources.honey=1500;s.science.agriculture=true;});game.tick(20);
 const beforeSave=game.exportSave(),before=game.snapshot(),farmer=before.jobs.find(c=>c.id==='farmer');assert.ok(farmer.nextRate>0);game.snapshot();assert.equal(game.exportSave(),beforeSave);
 assert.equal(game.act('assign','farmer').ok,true);const after=game.snapshot();assert.ok(Math.abs(after.resources.find(r=>r.id==='honey').rate-before.resources.find(r=>r.id==='honey').rate-farmer.nextRate-farmer.nextFood)<1e-9);assert.ok(after.jobs.find(c=>c.id==='farmer').currentRate>0);
});

test('森林批量建筑预览包含几何递增成本并与真实扣款相符',()=>{
 const game=scenario(s=>{s.buildings.hive=3;s.resources.honey=1000;});const before=game.snapshot(),card=before.buildings.find(c=>c.id==='hive'),p=batchPreview(card,5,before);
 assert.ok(p.costs[0].value>card.costs[0].value*5);assert.equal(p.affordable,true);assert.equal(game.act('build','hive',5).ok,true);const after=game.snapshot();assert.ok(Math.abs(p.costs[0].remaining-after.resources.find(r=>r.id==='honey').value)<1e-9);
 const max=batchPreview(after.buildings.find(c=>c.id==='hive'),'max',after);assert.equal(game.act('build','hive',max.count).ok,true);assert.equal(game.act('build','hive').ok,false);
});
test('森林批量制作预览明确容量损失与地图异常',()=>{
 const v=createGame().snapshot();v.resources.find(r=>r.id==='wood').value=199;const p=batchPreview({type:'refine',output:'wood',amount:1,costs:[{id:'honey',name:'蜂蜜',value:100,owned:1000}]},5,v);
 assert.equal(p.stored,1);assert.equal(p.overflow,4);assert.equal(buildingCondition({id:'smelter',toggleable:true,enabled:false},v),'已暂停');v.progression.conversions=[{id:'smelter',scale:.5,total:1}];assert.equal(buildingCondition({id:'smelter',toggleable:true,enabled:true},v),'缺原料');
});
test('森林安全新手路径从蜂箱储粮走到学者与养蜂研究且没有伙伴离开',()=>{
 const game=createGame(),gather=n=>{for(let i=0;i<n;i++)assert.equal(game.act('gather','honey').ok,true);};
 gather(10);assert.equal(forestGuidance(game.snapshot()).card.id,'hive');game.act('build','hive');assert.equal(forestGuidance(game.snapshot()).card.id,'hive');
 while(game.snapshot().buildings.find(c=>c.id==='hive').owned<20){const c=game.snapshot().buildings.find(c=>c.id==='hive');gather(Math.ceil(c.costs[0].value-c.costs[0].owned));assert.equal(game.act('build','hive').ok,true);}
 gather(2000);for(let i=0;i<5;i++)game.act('refine','wood');assert.equal(forestGuidance(game.snapshot()).card.id,'hut');game.act('build','hut');assert.match(forestGuidance(game.snapshot()).title,/到来/);game.tick(20);assert.equal(forestGuidance(game.snapshot()).job,'woodcutter');game.act('assign','woodcutter');game.tick(20);game.act('assign','woodcutter');
 game.tick(150);assert.equal(forestGuidance(game.snapshot()).card.id,'library');assert.equal(game.act('build','library').ok,true);assert.equal(forestGuidance(game.snapshot()).job,'scholar');game.act('unassign','woodcutter');game.act('assign','scholar');
 game.tick(160);assert.equal(game.act('research','calendar').ok,true);game.tick(530);assert.equal(game.act('research','agriculture').ok,true);assert.equal(game.snapshot().stats.totalDeaths,0);assert.equal(game.snapshot().jobs.find(c=>c.id==='farmer').unlocked,true);
});
