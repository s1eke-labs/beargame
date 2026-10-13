/** Public-action playthrough: no imported save, injected stock, unlocked technology or accelerated clock. */
import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame,importGame} from '../src/engine/index.js';

test('a genuinely empty forest reaches housing, working bears, library and first technologies through ordinary costs',()=>{
  let game=createGame({storage:null,now:1,seed:17}),elapsed=0;
  const resource=id=>game.snapshot().resources.find(r=>r.id===id).value;
  const action=(...args)=>{const outcome=game.act(...args);assert.equal(outcome.ok,true,`${args.join('/')}: ${outcome.message}`);};
  const waitUntil=predicate=>{while(!predicate()){assert.equal(game.tick(2).ok,true);elapsed+=2;assert.ok(elapsed<=3000,'The early path should not stall behind an unreachable prerequisite');}};
  assert.ok(game.snapshot().resources.every(r=>r.value===0));assert.equal(game.snapshot().bears.value,0);
  for(let i=0;i<10;i++)action('gather','honey');action('build','hive');assert.equal(resource('honey'),0);
  while(game.snapshot().buildings.find(b=>b.id==='hive').owned<20){waitUntil(()=>game.snapshot().buildings.find(b=>b.id==='hive').available);action('build','hive');}
  waitUntil(()=>resource('honey')>=2000);
  action('refine','wood',5);assert.equal(resource('wood'),5);action('build','hut');assert.equal(resource('wood'),0);
  waitUntil(()=>game.snapshot().bears.value===1);action('assign','woodcutter');
  waitUntil(()=>game.snapshot().bears.value===2);action('assign','woodcutter');
  waitUntil(()=>resource('wood')>=25);action('build','library');
  game=importGame(game.export(),{storage:null,now:1});
  action('unassign','woodcutter',2);action('assign','scholar',2);
  waitUntil(()=>resource('science')>=30);action('research','calendar');
  waitUntil(()=>resource('science')>=100);action('research','agriculture');
  action('unassign','scholar',1);action('assign','farmer',1);
  const final=game.snapshot();
  assert.equal(final.science.find(d=>d.id==='calendar').completed,true);assert.equal(final.science.find(d=>d.id==='agriculture').completed,true);
  assert.equal(final.jobs.find(d=>d.id==='farmer').assigned,1);assert.equal(final.jobs.find(d=>d.id==='scholar').assigned,1);
  assert.equal(final.bears.value,2);assert.equal(final.stats.totalDeaths,0);assert.equal(final.stats.totalGathered,10);
  assert.equal(final.ticks,elapsed*5);assert.equal(elapsed,702);assert.ok(resource('honey')>2800);
  assert.ok(final.resources.every(r=>Number.isFinite(r.value)&&r.value>=0));
});
