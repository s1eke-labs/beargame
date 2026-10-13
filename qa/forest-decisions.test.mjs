import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame} from '../src/chapters/forest/engine.js';
import {createState,serialize} from '../src/chapters/forest/save.js';
import {forestGuidance,forestBenefits,researchMatches,resourceHorizon} from '../src/chapters/forest/main.js';
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
