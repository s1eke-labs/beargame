import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame,catalog} from '../src/engine/index.js';

function fixture(edit=()=>{}){
 const game=createGame({storage:null,now:1,seed:73}),state=JSON.parse(game.export());
 for(const card of catalog.science)state.science[card.id]=true;
 state.ironWill=false;state.buildings={hive:20,hut:5,library:4,factory:1};
 state.resources.honey=3000;state.resources.furs=10;state.resources.spice=10;
 state.bears=[1,2,3,4].map(id=>({id,name:`伙伴${id}`,job:'woodcutter',skills:{woodcutter:id*1000,farmer:(5-id)*1000},rank:0,experience:0}));
 state.nextBearId=5;edit(state);assert.equal(game.importSave(JSON.stringify(state)).ok,true);game.snapshot();return game;
}
const near=(a,b,label)=>assert.ok(Math.abs(a-b)<1e-7,`${label}: ${a}/${b}`);

test('直接调岗预览对照真实净收支，预览不写状态、日志或随机数',()=>{
 for(const amount of [1,5,'max'])for(const season of [0,3]){
  const game=fixture(state=>{state.calendar.season=season;}),before=game.export(),vm=game.snapshot({jobTransfer:{from:'woodcutter',to:'farmer',amount}}),preview=vm.jobTransferPreview;
  assert.equal(game.export(),before);assert.equal(preview.actualCount,amount===1?1:4);
  const outcome=game.act('reassign','woodcutter:farmer',amount),after=game.snapshot();
  assert.equal(outcome.ok,true);assert.equal(outcome.actualCount,preview.actualCount);
  for(const resource of vm.resources){
   const changed=preview.resources.find(row=>row.id===resource.id),actual=after.resources.find(row=>row.id===resource.id);
   near(changed?.afterRate??resource.rate,actual.rate,resource.id);
  }
 }
});

test('无空闲伙伴也能原子调岗，选人沿用撤回规则且不影响原有空闲伙伴',()=>{
 const game=fixture(state=>{state.bears.push({id:5,name:'原有空闲',job:null,skills:{farmer:20001},rank:0,experience:0});state.nextBearId=6;});
 assert.equal(game.act('reassign','woodcutter:farmer',1).ok,true);
 const bears=game.snapshot().bears.individuals;
 assert.equal(bears.find(bear=>bear.id===4).job,'farmer');
 assert.equal(bears.find(bear=>bear.id===5).job,null);
});

test('目标容量先限制实际调动人数，不会额外撤回或丢失工程专长',()=>{
 const game=fixture();
 const preview=game.snapshot({jobTransfer:{from:'woodcutter',to:'engineer',amount:5}}).jobTransferPreview;
 assert.equal(preview.actualCount,1);assert.match(preview.reason,/容量限制/);
 assert.equal(game.act('reassign','woodcutter:engineer',5).actualCount,1);
 assert.equal(game.snapshot().bears.free,0);assert.equal(game.snapshot().jobs.find(job=>job.id==='woodcutter').assigned,3);
 const before=game.export();assert.equal(game.act('reassign','woodcutter:engineer',1).ok,false);assert.equal(game.export(),before);
 const engineers=fixture(state=>{state.buildings.factory=2;state.bears[0].job='engineer';state.bears[0].engineerSpecialty='beam';state.bears[1].job='engineer';});
 assert.equal(engineers.act('reassign','engineer:farmer',1).ok,true);
 assert.equal(engineers.snapshot().bears.individuals.find(bear=>bear.id===1).engineerSpecialty,'beam');
 assert.equal(engineers.snapshot().bears.individuals.find(bear=>bear.id===2).job,'farmer');
 assert.equal(engineers.act('reassign','engineer:farmer',1).ok,true);
 assert.equal(engineers.snapshot().bears.individuals.find(bear=>bear.id===1).engineerSpecialty,null);
});

test('岗位门槛与试炼限制在预览和执行中一致，失败不先撤回伙伴',()=>{
 for(const [to,edit] of [['priest',state=>{state.activeChallenges=['atheism'];}],['miner',state=>{delete state.science.mining;}],['farmer',state=>{state.activeChallenges=['anarchy'];}]]){
  const game=fixture(edit),before=game.export(),preview=game.snapshot({jobTransfer:{from:'woodcutter',to,amount:1}}).jobTransferPreview;
  assert.equal(preview.available,false,to);assert.equal(game.act('reassign',`woodcutter:${to}`,1).ok,false,to);assert.equal(game.export(),before,to);
 }
 const game=fixture(state=>{state.activeChallenges=['anarchy'];state.bears[0].job=null;state.bears[1].job=null;});
 assert.equal(game.snapshot({jobTransfer:{from:'woodcutter',to:'farmer',amount:1}}).jobTransferPreview.available,true);
 assert.equal(game.act('reassign','woodcutter:farmer',1).ok,true);assert.equal(game.snapshot().bears.free,2);
});
