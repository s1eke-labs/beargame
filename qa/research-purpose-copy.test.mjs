import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame,catalog} from '../src/engine/index.js';
import {researchPurposes} from '../src/engine/research-purposes.js';

test('每项研究均解释具体用途，读取文案不改变游戏或随机数',()=>{
 const game=createGame({storage:null,now:1,seed:19});game.snapshot();const before=game.export(),vm=game.snapshot();
 assert.equal(Object.keys(researchPurposes).length,catalog.science.length);
 for(const card of vm.science){
  assert.ok(card.decisionBenefit.length>=15,card.id);
  assert.doesNotMatch(card.decisionBenefit,/为后续项目提供前置条件|具体作用见说明|把这些知识整理/);
 }
 assert.equal(new Set(vm.science.map(card=>card.decisionBenefit)).size,vm.science.length);
 assert.equal(game.export(),before);
});

test('生产、材料、工业与后期研究用途准确对应目录，仍保留完整前置及开启信息',()=>{
 const vm=createGame({storage:null,now:1}).snapshot(),byId=id=>vm.science.find(card=>card.id===id);
 assert.match(byId('biology').decisionBenefit,/塑料.*知识.*采木/);
 assert.match(byId('metalurgy').decisionBenefit,/矿用钻机.*电解冶炼.*氧化焙烧/);
 assert.match(byId('oilProcessing').decisionBenefit,/石油.*煤油/);
 assert.match(byId('genetics').decisionBenefit,/灵鹿.*生物燃料/);
 assert.match(byId('exogeophysics').decisionBenefit,/地脉发电站.*供电/);
 assert.match(byId('artificialGravity').decisionBenefit,/没有.*即时产量加成/);
 assert.ok(byId('biology').opens.includes('塑料'));
 assert.ok(byId('metalurgy').opens.includes('矿用钻机'));
 assert.ok(byId('biology').prerequisites.some(item=>item.id==='archeology'));
});
