import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame} from '../src/chapters/forest/engine.js';
import {createState,serialize} from '../src/chapters/forest/save.js';
import {createTrackedGoal,trackedGoal,chapterChecklist,forestGuidance} from '../src/chapters/forest/main.js';
const scenario=edit=>{const state=createState(12,1);edit(state);return createGame({save:serialize(state,1),now:1,storage:null});};

test('森林重复建筑目标只计算固定目标后的新建筑，真实购买逐项推进',()=>{
 const game=scenario(s=>{s.buildings.hive=3;s.resources.honey=1000;});
 const before=game.exportSave(),target=createTrackedGoal(game.snapshot(),'buildings','hive',2);
 assert.equal(game.exportSave(),before);assert.equal(trackedGoal(game.snapshot(),target).progress,0);
 assert.equal(game.act('build','hive').ok,true);assert.equal(trackedGoal(game.snapshot(),target).progress,1);assert.equal(trackedGoal(game.snapshot(),target).done,false);
 assert.equal(game.act('build','hive').ok,true);assert.equal(trackedGoal(game.snapshot(),target).done,true);
});

test('森林研究目标兼容旧偏好，配方目标指向工坊且不会被消耗库存重置',()=>{
 const game=scenario(s=>{s.buildings.library=1;s.resources.science=100;s.resources.honey=1000;});
 const research={section:'science',id:'calendar'};
 assert.equal(trackedGoal(game.snapshot(),research).done,false);game.act('research','calendar');assert.equal(trackedGoal(game.snapshot(),research).done,true);
 const craft=createTrackedGoal(game.snapshot(),'crafts','wood',5);craft.produced=3;
 assert.equal(trackedGoal(game.snapshot(),craft).progress,3);assert.equal(trackedGoal(game.snapshot(),craft).page,'crafts');assert.equal(forestGuidance(game.snapshot(),craft).page,'crafts');
 assert.equal(createTrackedGoal(game.snapshot(),'buildings','missing'),null);
});

test('森林完成清单逐项对应实际章节完成条件',()=>{
 const snapshot=createGame().snapshot();assert.equal(chapterChecklist(snapshot).filter(x=>x.done).length,0);
 snapshot.science.find(c=>c.id==='construction').completed=true;
 for(const id of ['logHouse','warehouse'])snapshot.buildings.find(c=>c.id===id).owned=1;
 const list=chapterChecklist(snapshot);assert.equal(list.filter(x=>x.done).length,3);assert.equal(list.find(x=>!x.done).id,'lumberMill');
});
