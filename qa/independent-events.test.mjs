/** Seeded boundary fixtures for factual event rules. This is engine QA, not browser QA. */
import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame} from '../src/engine/index.js';
import {createState,serialize} from '../src/engine/save.js';

const fixture=(edit=()=>{},seed=17)=>{
  const state=createState(seed,1); state.ironWill=false; edit(state);
  return createGame({save:serialize(state,1),storage:null,now:1});
};
const raw=game=>JSON.parse(game.export());
const close=(actual,expected)=>assert.ok(Math.abs(actual-expected)<1e-9,`${actual} != ${expected}`);

test('season weather boundary rolls use exact 175/175/650 intervals after year three',()=>{
  // The selected initial seeds produce integer rolls 0,174,175,349,350,999.
  for(const [seed,expected] of [[1,1],[2920,1],[2840,-1],[5840,-1],[5824,0],[15872,0]]){
    const game=fixture(s=>{s.calendar={year:4,season:0,day:99,tick:9,weather:0};},seed);
    game.tick(.2);
    assert.equal(raw(game).calendar.weather,expected,`seed ${seed}`);
    assert.equal(raw(game).calendar.season,1);
  }
});

test('manual star observation requires a current opportunity and cannot be collected twice',()=>{
  const game=fixture(s=>{s.buildings.library=1;s.science.astronomy=true;s.observation={expires:300};});
  assert.equal(game.act('observe','observe').ok,true);
  close(raw(game).resources.science,27.5);
  close(raw(game).resources.starchart,1);
  const before=game.export();
  assert.equal(game.act('observe','observe').ok,false);
  assert.equal(game.export(),before);
});

test('celestial mechanics multiplies observation science while astronomy gates starcharts',()=>{
  const game=fixture(s=>{s.buildings.library=1;s.workshop.celestialMechanics=true;s.observation={expires:300};});
  game.act('observe','observe');
  close(raw(game).resources.science,33);
  close(raw(game).resources.starchart,0);
});

test('daily astronomical event has the documented base threshold and 300-tick lifetime',()=>{
  for(const [seed,appears] of [[39,true],[40,false]]){
    const game=fixture(s=>{s.buildings.library=1;s.calendar.tick=9;},seed);
    game.tick(.2);
    assert.equal(!!raw(game).observation,appears,`seed ${seed}`);
    if(appears)assert.equal(raw(game).observation.expires,301);
  }
  const locked=fixture(s=>{s.calendar.tick=9;},1);
  locked.tick(.2);
  assert.equal(raw(locked).observation,null);
});

test('SETI consumes its new observation immediately and awards the normal result',()=>{
  const game=fixture(s=>{s.buildings.library=1;s.science.astronomy=true;s.workshop.seti=true;s.calendar.tick=9;},1);
  game.tick(.2);
  const state=raw(game);
  assert.equal(state.observation,null);
  close(state.resources.science,27.5);
  close(state.resources.starchart,1);
});

test('timeout chance preserves the inclusive integer-roll one-percent floor',()=>{
  for(const [seed,observatories,science] of [[1,0,25],[160,0,0],[160,1,31.25]]){
    const game=fixture(s=>{s.buildings.observatory=observatories;s.observation={expires:1};},seed);
    game.tick(.2);
    assert.equal(raw(game).observation,null);
    close(raw(game).resources.science,science);
  }
});

test('meteor needs mining and its fifty-plus-ratio award uses the exact daily threshold',()=>{
  for(const [seed,mining,mines,expected] of [[1,false,0,0],[1,true,0,50],[16,true,0,0],[1,true,1,55]]){
    const game=fixture(s=>{s.science.mining=mining;s.buildings.mine=mines;s.calendar.tick=9;},seed);
    game.tick(.2);
    close(raw(game).resources.minerals,expected);
  }
});

test('negative paradox days halt per-tick food production and consumption',()=>{
  const game=fixture(s=>{s.buildings.hive=5;s.buildings.hut=1;s.resources.honey=100;s.bears=[{id:1,name:'小熊',job:'farmer',skills:{},rank:0,experience:0}];s.nextBearId=2;s.calendar.day=-2;s.calendar.tick=9;},1);
  game.tick(.2);
  assert.equal(raw(game).calendar.day,-1);
  close(raw(game).resources.honey,100);
  assert.equal(raw(game).bears.length,1);
});
