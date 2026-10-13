import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {buildingDevelopment,buildingSurroundings} from '../src/ui/growth-art.js';

test('visual milestones preserve early expansions and add a bounded mature tier',()=>{
 for(const id of ['hive','hut','library','barn','lumberMill','workshop','warehouse','mine','temple','spaceport']){
  const first=id==='hive'?5:3,last=id==='hive'?15:10;
  assert.deepEqual(buildingDevelopment({id,owned:first-1}),{tier:1,expanded:false,next:first});
  assert.deepEqual(buildingDevelopment({id,owned:first}),{tier:2,expanded:true,next:last});
  assert.equal(buildingDevelopment({id,owned:last-1}).tier,2);
  assert.deepEqual(buildingDevelopment({id,owned:last}),{tier:3,expanded:true,next:null});
  assert.equal(buildingSurroundings({id,owned:last}),buildingSurroundings({id,owned:1000000}));
 }
});
test('surroundings appear only around actual developed buildings and follow sales',()=>{
 for(const card of [{id:'hut',owned:0},{id:'hut',owned:0,stage:1},{id:'hive',owned:4},{id:'hut',owned:2}])assert.equal(buildingSurroundings(card),'');
 const grown={id:'hut',owned:10},before=JSON.stringify(grown),html=buildingSurroundings(grown);
 assert.match(html,/data-development="3"/);assert.equal((html.match(/data-lot-detail=/g)||[]).length,3);
 assert.equal(JSON.stringify(grown),before);
 grown.owned=3;assert.equal((buildingSurroundings(grown).match(/data-lot-detail=/g)||[]).length,1);
 grown.owned=2;assert.equal(buildingSurroundings(grown),'');
});
test('drawn facilities communicate different building families and rebuilt uses',()=>{
 const cases=[['hut','home','garden'],['hive','flowers','garden'],['lumberMill','timber','logs'],['warehouse','store','crates'],['library','study','books'],['workshop','work','tools'],['mine','stone','stones'],['aqueduct','water','trough'],['reactor','power','panel'],['amphitheatre','gathering','bench'],['temple','shrine','planters'],['spaceport','stars','dish']];
 for(const [id,family,detail]of cases){const html=buildingSurroundings({id,owned:3+(id==='hive'?2:0)});assert.match(html,new RegExp(`data-lot-family="${family}"`));assert.match(html,new RegExp(`data-lot-detail="${detail}"`));}
 for(const [id,family]of [['pasture','power'],['library','power'],['aqueduct','water'],['warehouse','stars']])assert.match(buildingSurroundings({id,owned:1,stage:1}),new RegExp(`data-lot-family="${family}"`));
 assert.match(buildingSurroundings({id:'orbitalThing',owned:3,section:'space'}),/data-lot-family="stars"/);
});
test('lot illustrations are deterministic decorative markup without mutable counters or focus targets',()=>{
 const card={id:'library',owned:10,enabled:true};
 const html=buildingSurroundings(card);
 assert.equal(html,buildingSurroundings({...card,owned:11,enabled:false}));
 assert.match(html,/aria-hidden="true"/);assert.match(html,/focusable="false"/);
 assert.doesNotMatch(html,/<(?:button|a|input)|tabindex|<animate|<script|\bon\w+=/);
 assert.doesNotMatch(html,/data-act=|data-detail=/);
});
test('era scenery uses real assets while growth styles preserve anchors and reduced motion',()=>{
 const css=readFileSync(new URL('../src/styles/visible-growth.css',import.meta.url),'utf8');
 for(const era of ['settlement','industrial','stellar']){assert.ok(css.includes(`.world-board.era-${era} .continuous-map`));assert.ok(existsSync(new URL(`../public/art/explore-${era}-long.webp`,import.meta.url)));}
 assert.doesNotMatch(css,/@keyframes|infinite|--(?:x|y|z):|translate\(|scale\(/);
 assert.match(css,/prefers-reduced-motion:reduce/);assert.match(css,/pointer-events:none/);
});

test('rendered scenery changes at quantity milestones and civilization breakthroughs without moving lots',async()=>{
 const {world}=await import('../src/ui/render.js');
 const {createGame}=await import('../src/engine/index.js');
 const {createState,serialize}=await import('../src/engine/save.js');
 const {sceneKey}=await import('../src/ui/experience.js');
 const state=createState(29,0);state.buildings.hut=2;
 const vm=createGame({storage:null,save:serialize(state,0),now:0}).snapshot(),ui={district:'village'};
 const early=world(vm,ui),oldKey=sceneKey(vm,ui);
 const position=html=>html.match(/style="[^"]*--x:[^"]+" data-detail="buildings:hut"/)?.[0];
 assert.ok(position(early));assert.doesNotMatch(early,/data-lot-family="home"/);
 vm.buildings.find(b=>b.id==='hut').owned=10;
 const mature=world(vm,ui);assert.match(mature,/data-development="3" data-lot-family="home"/);assert.equal(position(mature),position(early));assert.notEqual(sceneKey(vm,ui),oldKey);
 const construction=vm.science.find(c=>c.id==='construction');construction.completed=true;
 assert.match(world(vm,ui),/world-board era-settlement/);
 vm.science.find(c=>c.id==='industrialization').completed=true;
 assert.match(world(vm,ui),/world-board era-industrial/);
 vm.science.find(c=>c.id==='rocketry').completed=true;
 assert.match(world(vm,ui),/world-board era-stellar/);
 assert.equal(position(world(vm,ui)),position(early));
});

test('growth decoration preserves the existing absolute label anchor',async()=>{
 const css=readFileSync(new URL('../src/styles/visible-growth.css',import.meta.url),'utf8');
 assert.doesNotMatch(css,/\.building-label\s*\{[^}]*position\s*:/);
});
