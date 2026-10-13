import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame} from '../src/engine/index.js';
import {createState,serialize} from '../src/engine/save.js';

const close=(actual,expected)=>assert.ok(Math.abs(actual-expected)<1e-9,`${actual} != ${expected}`);
const bear=(id,job='woodcutter',skills={},experience=100)=>({id,name:`小熊 ${id}`,job,skills,experience,rank:0,trait:'none'});
const fixture=(edit=()=>{})=>{const s=createState(17,1);s.ironWill=false;s.buildings.hut=2;s.resources.honey=1e6;s.bears=[bear(1)];s.nextBearId=2;edit(s);return createGame({save:serialize(s,1),storage:null,now:1});};
const raw=game=>JSON.parse(game.export());

test('forester skill thresholds use every exact output band',()=>{
  for(const [skill,bonus] of [[0,0],[99.999,0],[100,.0125],[499.999,.0125],[500,.025],[1200,.045],[2500,.075],[5000,.125],[9000,.1875],[20001,.1875]]){
    const game=fixture(s=>{s.bears[0].skills.woodcutter=skill;});
    close(game.snapshot().resources.find(r=>r.id==='wood').rate,.018*5*(1+bonus));
  }
});

test('working bears learn their active skill and lose each inactive skill from separate total experience',()=>{
  const game=fixture(s=>{s.bears[0].skills={woodcutter:10,miner:1,scholar:.0004};});
  game.tick(.2);
  const worker=raw(game).bears[0];
  close(worker.skills.woodcutter,10.01);close(worker.skills.miner,.999);
  close(worker.skills.scholar,0);close(worker.experience,100.0086);
});

test('academy adds learning speed while an idle bear retains all stored skills and experience',()=>{
  const active=fixture(s=>{s.buildings.academy=2;});active.tick(.2);
  close(raw(active).bears[0].skills.woodcutter,.011);
  const idle=fixture(s=>{s.bears=[bear(1,null,{woodcutter:10,miner:1},100)];});idle.tick(.2);
  assert.deepEqual(raw(idle).bears[0].skills,{woodcutter:10,miner:1});close(raw(idle).bears[0].experience,100);
});

test('neural learning counts occupied jobs and replaces forgetting',()=>{
  const game=fixture(s=>{
    s.science.mining=true;s.workshop.neuralNetworks=true;
    s.bears=[bear(1,'woodcutter',{miner:1}),bear(2,'woodcutter'),bear(3,'miner')];s.nextBearId=4;
  });
  game.tick(.2);
  const workers=raw(game).bears;
  close(workers[0].skills.woodcutter,.012);close(workers[0].skills.miner,1.001);
  close(workers[1].skills.woodcutter,.012);close(workers[1].skills.miner,.001);
  close(workers[2].skills.woodcutter,.002);close(workers[2].skills.miner,.011);
});

test('anarchy disables both skill output advantage and learning',()=>{
  const game=fixture(s=>{s.challenge='anarchy';s.activeChallenges=['anarchy'];s.bears[0].skills.woodcutter=10000;});
  close(game.snapshot().resources.find(r=>r.id==='wood').rate,.018*5);
  game.tick(.2);
  close(raw(game).bears[0].skills.woodcutter,10000);close(raw(game).bears[0].experience,100);
});

test('job assignment selects the available bear with highest relevant skill',()=>{
  const game=fixture(s=>{s.bears=[bear(1,null,{woodcutter:1}),bear(2,null,{woodcutter:1000}),bear(3,null,{woodcutter:500})];s.nextBearId=4;});
  assert.equal(game.act('assign','woodcutter',1).ok,true);
  assert.deepEqual(raw(game).bears.filter(b=>b.job==='woodcutter').map(b=>b.id),[2]);
  assert.equal(game.act('assign','woodcutter',1).ok,true);
  assert.deepEqual(raw(game).bears.filter(b=>b.job==='woodcutter').map(b=>b.id),[2,3]);
});
