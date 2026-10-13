import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createGame,catalog} from '../src/engine/index.js';

const close=(actual,expected,label)=>assert.ok(Math.abs(actual-expected)<=Math.max(1e-7,Math.abs(expected)*1e-10),`${label}: ${actual} / ${expected}`);
function developed(edit=()=>{}){
 const game=createGame({storage:null,now:1,seed:19}),state=JSON.parse(game.export());
 for(const card of catalog.science)state.science[card.id]=true;
 for(const resource of catalog.resources)state.resources[resource.id]=1000000;
 state.buildings={hive:20,hut:5,library:3,barn:3,warehouse:2,smelter:2,magneto:1,reactor:1};
 state.bears=[{id:1,name:'采集伙伴',job:'farmer',skills:{farmer:9000},rank:0,experience:0},{id:2,name:'学者伙伴',job:'scholar',skills:{scholar:5000},rank:0,experience:0}];
 state.nextBearId=3;state.ironWill=false;edit(state);
 assert.equal(game.importSave(JSON.stringify(state)).ok,true);game.snapshot();return game;
}

test('建筑边际预览逐项对照真实购买的净产量、容量、住房与电力',()=>{
 for(const id of ['hive','pasture','aqueduct','library','barn','warehouse','smelter','calciner','magneto','reactor','hut'])for(const season of [0,3]){
  const game=developed(state=>{state.calendar.season=season;if(id==='smelter'){state.disabled.smelter=true;state.activeBuildings.smelter=0;}if(id==='hut')state.ironWill=true;});
  const before=game.snapshot(),withPreview=game.snapshot({buildingTargets:[id]}),preview=withPreview.buildingPreviews[0];
  assert.equal(preview?.mode,'purchase',id);assert.equal(game.act('build',id,1).ok,true,id);
  const after=game.snapshot(),changed=new Map(preview.resources.map(row=>[row.id,row]));
  for(const resource of before.resources){
   const next=after.resources.find(row=>row.id===resource.id),projected=changed.get(resource.id);
   close(projected?.afterRate??resource.rate,next.rate,`${id}/${season}/${resource.id}/净产量`);
   if(resource.max!=null)close(projected?.afterCapacity??resource.max,next.max,`${id}/${season}/${resource.id}/容量`);
  }
  close(preview.energy.afterSupply,after.energy.supply,`${id}/供电`);close(preview.energy.afterDemand,after.energy.demand,`${id}/耗电`);
  close(preview.energy.afterEfficiency,after.energy.efficiency,`${id}/电力效率`);assert.equal(preview.housing.after,after.bears.max,id);
 }
});

test('真实远航存档的蜂箱增益包含季节和加成，且预览不触发存档、通知或随机数变化',()=>{
 const game=createGame({storage:null,now:1,save:readFileSync(new URL('./campaign/first-space.save.json',import.meta.url),'utf8')});game.snapshot();const before=game.export();
 let notices=0;const stop=game.subscribe(()=>notices++);
 const vm=game.snapshot({batchTarget:{section:'buildings',id:'hive'}}),preview=vm.buildingPreviews[0],honey=preview.resources.find(row=>row.id==='honey');
 assert.equal(preview.id,'hive');close(honey.rateDelta,3.7752513198761335,'蜂箱真实增益');
 assert.equal(game.export(),before);assert.equal(notices,0);stop();
 assert.deepEqual(game.snapshot().buildingPreviews,[]);
});

test('不足物资的建筑明确标记为未扣费估算，请求去重并限制比较数量',()=>{
 const game=developed(state=>{state.resources.wood=0;}),before=game.export();
 const preview=game.snapshot({buildingTargets:['library']}).buildingPreviews[0];
 assert.equal(preview.available,false);assert.equal(preview.mode,'structure');assert.match(preview.note,/未扣除/);
 assert.ok(preview.resources.some(row=>row.id==='science'&&row.capacityDelta>0));assert.equal(game.export(),before);
 const targets=['library','library','hive','barn','hut','warehouse','smelter','reactor','unknown'];
 const rows=game.snapshot({buildingTargets:targets}).buildingPreviews;
 assert.equal(rows.length,6);assert.equal(new Set(rows.map(row=>row.id)).size,6);
});
