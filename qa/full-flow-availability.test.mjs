/** SYNTHETIC regression fixtures. These test snapshot/action parity, not earned progression. */
import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame} from '../src/engine/index.js';
const gameWith=configure=>{const g=createGame({storage:null,now:1,seed:17});const s=JSON.parse(g.export());configure(s);const result=g.importSave(JSON.stringify(s));assert.equal(result.ok,true,result.message);return g;};
const bears=(s,jobs=[null,null])=>{s.ironWill=false;s.buildings.hut=Math.ceil(jobs.length/2);s.bears=jobs.map((job,i)=>({id:i+1,name:`测试熊 ${i+1}`,job,trait:'none',rank:0,experience:0,skills:{}}));s.nextBearId=jobs.length+1;};
const challenge=(s,id)=>{s.challenge=id;s.activeChallenges=[id];};
const regular=(g,type)=>g.snapshot().actions.find(c=>c.type===type);
const progression=(g,type,id)=>g.snapshot().progression.actions.find(c=>c.type===type&&(!id||c.id===id));
function denied(card){assert.ok(card,'snapshot contains the action');assert.equal(card.available,false);assert.ok(card.reason,'unavailable actions explain why');}

test('atheism priest assignment is visibly unavailable; ordinary priest assignment still works',()=>{
 const g=gameWith(s=>{bears(s);s.science.theology=true;challenge(s,'atheism');});
 denied(g.snapshot().jobs.find(c=>c.id==='priest'));assert.equal(g.act('assign','priest').ok,false);
 const normal=gameWith(s=>{bears(s);s.science.theology=true;});
 assert.equal(normal.snapshot().jobs.find(c=>c.id==='priest').available,true);assert.equal(normal.act('assign','priest').ok,true);
 assert.equal(normal.snapshot().jobs.find(c=>c.id==='priest').assigned,1);assert.equal(normal.snapshot().bears.free,1);
 assert.equal(normal.act('assign','priest').ok,true);assert.equal(normal.snapshot().jobs.find(c=>c.id==='priest').assigned,2);
 assert.equal(normal.snapshot().jobs.find(c=>c.id==='priest').available,false);assert.equal(normal.snapshot().bears.free,0);
});
test('atheism still permits removing an existing priest assignment',()=>{
 const g=gameWith(s=>{bears(s,['priest',null]);s.science.theology=true;challenge(s,'atheism');});
 assert.equal(g.snapshot().jobs.find(c=>c.id==='priest').assigned,1);assert.equal(g.act('unassign','priest').ok,true);
 assert.equal(g.snapshot().jobs.find(c=>c.id==='priest').assigned,0);assert.equal(g.snapshot().bears.free,2);
});
test('atheism praise is visibly unavailable even with theology and faith',()=>{
 const g=gameWith(s=>{s.science.theology=true;s.resources.faith=100;challenge(s,'atheism');});
 denied(regular(g,'praise'));assert.equal(g.act('praise').ok,false);
});
test('praise exactly at the residual 0.0001 threshold is unavailable; above it works',()=>{
 for(const faith of [0,.0001]){const g=gameWith(s=>{s.science.theology=true;s.resources.faith=faith;});denied(regular(g,'praise'));assert.equal(g.act('praise').ok,false);}
 const g=gameWith(s=>{s.science.theology=true;s.resources.faith=.00010001;});assert.equal(regular(g,'praise').available,true);assert.equal(g.act('praise').ok,true);denied(regular(g,'praise'));
});
test('pacifism hunting is visibly unavailable; ordinary and atheism hunts still work',()=>{
 const g=gameWith(s=>{s.science.archery=true;s.resources.manpower=100;challenge(s,'pacifism');});denied(regular(g,'hunt'));assert.equal(g.act('hunt').ok,false);
 for(const mode of [null,'atheism']){const g=gameWith(s=>{s.science.archery=true;s.resources.manpower=100;if(mode)challenge(s,mode);});assert.equal(regular(g,'hunt').available,true);assert.equal(g.act('hunt').ok,true);denied(regular(g,'hunt'));}
});
test('starting acceleration needs one flux; stopping acceleration remains possible at zero',()=>{
 for(const flux of [0,.999]){const g=gameWith(s=>{s.science.calendar=true;s.resources.temporalFlux=flux;});denied(progression(g,'accelerate'));assert.equal(g.act('accelerate','toggle').ok,false);}
 const g=gameWith(s=>{s.science.calendar=true;s.resources.temporalFlux=1;});assert.equal(progression(g,'accelerate').available,true);assert.equal(g.act('accelerate','toggle').ok,true);
 const stopping=gameWith(s=>{s.science.calendar=true;s.resources.temporalFlux=0;s.timeState.accelerating=true;});assert.equal(progression(stopping,'accelerate').available,true);assert.equal(stopping.act('accelerate','toggle').ok,true);assert.equal(stopping.snapshot().progression.accelerating,false);denied(progression(stopping,'accelerate'));
});
test('tear sacrifice reflects the real sorrow cap and becomes available when space remains',()=>{
 const full=gameWith(s=>{s.metaphysics.megalomania=true;s.resources.tears=10000;s.resources.sorrow=17;});assert.equal(full.snapshot().resources.find(r=>r.id==='sorrow').max,17);denied(progression(full,'sacrifice','tears'));assert.equal(full.act('sacrifice','tears').ok,false);
 const open=gameWith(s=>{s.metaphysics.megalomania=true;s.resources.tears=10000;s.resources.sorrow=16;});assert.equal(progression(open,'sacrifice','tears').available,true);assert.equal(open.act('sacrifice','tears').ok,true);assert.equal(open.snapshot().resources.find(r=>r.id==='sorrow').value,17);
});
test('unicorn sacrifice also reflects challenge-only tear capacity',()=>{
 const g=gameWith(s=>{s.buildings.ziggurat=4;challenge(s,'unicornTears');s.resources.unicorns=2500;s.resources.tears=13;});const r=g.snapshot().resources.find(r=>r.id==='tears');assert.equal(r.max,13);denied(progression(g,'sacrifice','unicorns'));assert.equal(g.act('sacrifice','unicorns').ok,false);
});
