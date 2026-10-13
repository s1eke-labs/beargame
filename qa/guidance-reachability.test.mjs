import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createGame} from '../src/engine/index.js';
import {guidance,guidanceStage,acquisitionPlan} from '../src/ui/experience.js';

const campaign=name=>createGame({storage:null,now:1,save:readFileSync(new URL(`./campaign/${name}.save.json`,import.meta.url),'utf8')}).snapshot();

test('工业存档不再把尚无月晶来源的研究说成只需等待知识',()=>{
 const vm=campaign('industry-and-rocketry'),before=structuredClone(vm),guide=guidance(vm);
 assert.notEqual(guide.detail,'science:metaphysics');assert.equal(guide.detail,'science:acoustics');
 const moon=acquisitionPlan(vm,'unobtainium');
 assert.equal(moon.reachable,false);assert.equal(moon.detail,'space:orbitalLaunch');
 assert.match(moon.reason,/月林采晶站.*初探星空.*月林之旅/);
 assert.deepEqual(vm,before);
});

test('已启程仍未抵达时准确引导等待航路，而不是假定资源已经生产',()=>{
 const vm=campaign('first-space'),mission=vm.progression.spaceCards.find(card=>card.id==='moonMission');
 mission.owned=1;mission.completed=true;mission.travelDays=10;mission.reached=false;
 const plan=acquisitionPlan(vm,'unobtainium');
 assert.equal(plan.reachable,false);assert.equal(plan.detail,'space:moonMission');assert.match(plan.reason,/等待月林之旅抵达/);
 const step=guidanceStage(vm).steps.find(item=>item.label==='抵达月林');assert.equal(step.complete,false);
});

test('材料获取按真实状态引导制作、调岗、恢复生产和对应资源扩容',()=>{
 const vm=campaign('first-space');
 vm.resources.find(row=>row.id==='wood').rate=0;
 assert.equal(acquisitionPlan(vm,'wood').job,'woodcutter');
 const steel=vm.crafts.find(card=>card.id==='steel');
 steel.costs=steel.costs.map(cost=>({...cost,owned:cost.value*2}));vm.resources.find(row=>row.id==='steel').rate=0;
 assert.equal(acquisitionPlan(vm,'steel').recipe,'steel');
 assert.equal(acquisitionPlan(vm,'science',{blocked:true}).detail,'buildings:library');
 const smelter=vm.buildings.find(card=>card.id==='smelter');smelter.enabled=false;
 vm.resources.find(row=>row.id==='iron').rate=0;
 const iron=acquisitionPlan(vm,'iron');assert.equal(iron.detail,'buildings:smelter');assert.match(iron.title,/恢复/);
});

test('任一缺口来源未开放时都不能被当成自然等待，生产链循环有明确边界',()=>{
 const vm=campaign('industry-and-rocketry');
 vm.science=vm.science.filter(card=>card.completed||card.id==='metaphysics');
 const guide=guidance(vm);assert.match(guide.reason,/月晶.*月林采晶站/);assert.doesNotMatch(guide.reason,/还需积攒知识/);
 vm.resources.find(row=>row.id==='science').rate=0;
 assert.match(guidance(vm).reason,/月晶.*月林采晶站/,'知识停产不能掩盖尚未开放的另一种材料来源');
 const cyclic={resources:[{id:'a',name:'甲',rate:0,value:0,max:null},{id:'b',name:'乙',rate:0,value:0,max:null}],buildings:[],jobs:[],trades:[],actions:[],crafts:[
  {id:'a',name:'甲',output:'a',unlocked:true,costs:[{id:'b',name:'乙',value:1,owned:0}]},
  {id:'b',name:'乙',output:'b',unlocked:true,costs:[{id:'a',name:'甲',value:1,owned:0}]}
 ]};
 assert.equal(acquisitionPlan(cyclic,'a').reachable,false);
});

test('成长阶段继续覆盖工坊、供能与航行，缺电指向生产管理',()=>{
 const vm=campaign('automation-and-electricity');
 assert.equal(guidanceStage(vm).id,'industry-energy');
 vm.bears.free=0;vm.resources.find(row=>row.id==='honey').rate=1;vm.energy={supply:2,demand:7};
 const guide=guidance(vm);assert.equal(guide.buildTab,'industry');assert.match(guide.reason,/供电 2.*耗电 7/);
 vm.science=vm.science.map(card=>({...card,completed:['calendar','agriculture','mining'].includes(card.id)}));
 assert.equal(guidanceStage(vm).id,'workshop');
 assert.equal(guidanceStage(campaign('first-space')).id,'first-flight');
});
