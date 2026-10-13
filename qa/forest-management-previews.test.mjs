import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame,catalog} from '../src/chapters/forest/engine.js';
import {createState,serialize} from '../src/chapters/forest/save.js';
const close=(a,b)=>assert.ok(Math.abs(a-b)<1e-8,`${a} 与 ${b} 应相同`);
function fixture(edit=()=>{}){const s=createState(12,1);s.science=Object.fromEntries(catalog.science.map(d=>[d.id,true]));s.buildings={hive:20,hut:6,library:3,barn:2,pasture:2,mine:1,workshop:1,smelter:1,logHouse:1,warehouse:1,lumberMill:1};for(const id of Object.keys(s.resources))s.resources[id]=100000;s.bears=Array.from({length:8},(_,i)=>({id:i+1,name:`小熊 ${i+1}`,job:catalog.jobs[i%5].id,disposition:0,color:0,variety:0,experience:500,skills:{woodcutter:i*500,farmer:2500-i*100}}));s.nextBearId=9;edit(s);return createGame({save:serialize(s,1),now:1,storage:null});}

test('森林建筑购买预览与当季真实扣款后的净产、容量及住房一致且不改变存档',()=>{
 for(const season of [0,3])for(const def of catalog.buildings){const game=fixture(s=>{s.calendar.season=season;s.workshop.stoneBarns=true;});const before=game.snapshot(),saved=game.exportSave(),p=game.previewBuilding(def.id,2);assert.equal(p.ok,true);assert.equal(p.affordable,true);assert.equal(game.exportSave(),saved,def.id+' 预览不改变存档');assert.equal(game.act('build',def.id,2).ok,true);const after=game.snapshot();for(const r of p.resources){const b=before.resources.find(x=>x.id===r.id),a=after.resources.find(x=>x.id===r.id);close(r.delta,a.rate-b.rate);close(r.capacityDelta,a.max-b.max);}close(p.housingDelta,after.bears.max-before.bears.max);}
});

test('森林直接调岗原子完成，所有净收支变化与预览相同且保留伙伴技能',()=>{
 const game=fixture(),before=game.snapshot(),saved=game.exportSave(),p=game.previewTransfer('woodcutter','farmer',2);assert.equal(p.ok,true);assert.equal(game.exportSave(),saved);assert.equal(game.act('reassign','woodcutter:farmer',2).ok,true);const after=game.snapshot();assert.equal(after.jobs.find(j=>j.id==='woodcutter').assigned,0);assert.equal(after.jobs.find(j=>j.id==='farmer').assigned,4);for(const r of p.resources)close(r.delta,after.resources.find(x=>x.id===r.id).rate-before.resources.find(x=>x.id===r.id).rate);assert.deepEqual(after.bears.individuals.map(b=>b.skills),before.bears.individuals.map(b=>b.skills));
 const unchanged=game.exportSave();assert.equal(game.act('reassign','woodcutter:farmer',1).ok,false);assert.equal(game.exportSave(),unchanged);assert.equal(game.previewTransfer('farmer','farmer',1).ok,false);assert.equal(game.previewTransfer('farmer','woodcutter',0).ok,false);
});

test('森林所有资源的建筑、岗位和消耗分项合计等于实时净产',()=>{
 for(const season of [0,3])for(const low of [false,true]){const game=fixture(s=>{s.calendar.season=season;s.pollution=60000000;if(low){s.resources.wood=0;s.resources.minerals=0;}}),saved=game.exportSave();for(const r of game.snapshot().resources)close(r.breakdown.reduce((sum,x)=>sum+x.rate,0),r.rate);assert.equal(game.exportSave(),saved);const honey=game.snapshot().resources.find(r=>r.id==='honey');assert.ok(honey.breakdown.some(x=>x.label==='伙伴口粮'));assert.ok(honey.breakdown.some(x=>x.label==='养蜂熊'));}
});
