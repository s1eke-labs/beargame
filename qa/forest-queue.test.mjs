import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame,loadGame,parseSave,catalog,constants,SAVE_HEADER} from '../src/chapters/forest/engine.js';
import {createGame as createReference} from '../src/engine/index.js';

const NOW=1_000_000;
const raw=game=>JSON.parse(game.export());
const value=(game,id)=>game.snapshot().resources.find(resource=>resource.id===id).value;
const close=(actual,expected)=>assert.ok(Math.abs(actual-expected)<1e-9,`${actual} !== ${expected}`);
function game(edit=()=>{},options={}){
 const save=raw(createGame({seed:123456789,now:NOW,storage:null}));edit(save);
 return createGame({save,now:NOW,storage:null,...options});
}
function storageWith(text){
 const writes=[];const data=new Map([[constants.SAVE_KEY,text]]);
 return {writes,getItem:key=>data.get(key)??null,setItem:(key,value)=>{writes.push([key,value]);data.set(key,value);}};
}
function unchangedAction(game,...args){const before=game.export();assert.equal(game.act(...args).ok,false,JSON.stringify(args));assert.equal(game.export(),before,`${JSON.stringify(args)} must be atomic`);}
const queueRows=game=>raw(game).queue.items;
const source=(game,id)=>game.snapshot().queue.sources.find(item=>item.id===id);

test('forest queue starts with three free slots and chapter-only unlocked candidates without spending',()=>{
 const g=game(),before=raw(g),view=g.snapshot().queue;
 assert.equal(view.enabled,true);assert.equal(view.capacity,3);assert.equal(view.used,0);assert.equal(view.free,3);assert.equal(view.paused,false);
 assert.deepEqual(view.sources.map(item=>[item.id,item.unlocked]),[['buildings',true],['tech',false],['upgrades',false]]);
 assert.deepEqual(view.options.map(item=>item.id),['build:hive','build:hut','build:library']);
 const hive=view.options[0];assert.equal(hive.type,'queueEnqueue');assert.equal(hive.targetType,'build');assert.equal(hive.targetId,'hive');assert.equal(hive.source,'buildings');assert.equal(hive.stackable,true);assert.equal(hive.available,true);
 assert.deepEqual(hive.costs,[{id:'honey',name:'蜂蜜',value:10,owned:0}]);
 assert.equal(g.act('queueEnqueue','build:hive').ok,true);
 const after=raw(g);for(const key of ['resources','buildings','science','workshop','rng','ticks','calendar'])assert.deepEqual(after[key],before[key],key);
 const item=g.snapshot().queue.items[0];assert.equal(item.index,0);assert.equal(item.name,'蜂箱');assert.equal(item.amount,1);assert.equal(item.available,false);assert.equal(item.status,'物资不足');
 for(const id of ['build:barn','research:calendar','upgrade:ironAxes','craft:beam','faith:praise','space:orbitalLaunch','build:chronosphere','research:astronomy','build:constructor','constructor:hive','__proto__:hive'])unchangedAction(g,'queueEnqueue',id);
});

test('forest grouped quantities count slots, clamp to free space, and preserve ordered entries',()=>{
 const g=game();assert.equal(g.act('queueEnqueue','build:hive').queued,1);assert.equal(g.act('queueEnqueue','build:hive',20).queued,2);
 assert.deepEqual(queueRows(g),[{type:'build',id:'hive',amount:3}]);assert.equal(g.snapshot().queue.used,3);assert.equal(g.snapshot().queue.free,0);
 assert.ok(g.snapshot().queue.options.every(item=>!item.available&&item.reason==='建造队列已满'));
 unchangedAction(g,'queueEnqueue','build:hut');
 assert.equal(g.act('queueRemove','0',2).removed,2);assert.equal(g.snapshot().queue.used,1);
 assert.equal(g.act('queueEnqueue','build:hut','max').queued,2);
 assert.deepEqual(queueRows(g),[{type:'build',id:'hive',amount:1},{type:'build',id:'hut',amount:2}]);
 assert.equal(g.act('queueRemove','1','max').removed,2);assert.equal(g.act('queueRemove','0',100).removed,1);assert.equal(g.snapshot().queue.used,0);
});

test('forest queue reorder and confirmed clear change only pending work',()=>{
 const g=game(s=>{s.resources.honey=100;});
 for(const id of ['library','hive','hut'])assert.equal(g.act('queueEnqueue',`build:${id}`).ok,true);
 assert.equal(g.act('queueUp','1').ok,true);assert.deepEqual(queueRows(g).map(item=>item.id),['hive','library','hut']);
 unchangedAction(g,'queueUp','0');unchangedAction(g,'queueDown','2');
 assert.equal(g.act('queueDown','0').ok,true);assert.deepEqual(queueRows(g).map(item=>item.id),['library','hive','hut']);
 unchangedAction(g,'queueClear');unchangedAction(g,'queueClear','no');
 assert.equal(g.act('queueClear','confirm').ok,true);assert.equal(g.snapshot().queue.used,0);assert.equal(value(g,'honey'),100);assert.deepEqual(raw(g).buildings,{});
});

test('forest invalid queue actions and amounts fail without changing the save',()=>{
 const g=game();g.act('queueEnqueue','build:hive');
 for(const type of ['queueRemove','queueUp','queueDown'])for(const id of [undefined,'-1','1.5','unknown','1e2','99','Infinity','constructor','__proto__'])unchangedAction(g,type,id);
 for(const amount of [0,-1,.5,NaN,Infinity,1000001,'3',null,false,{}])unchangedAction(g,'queueEnqueue','build:hut',amount);
 for(const id of [undefined,'','build',':hive','build:','build:hive:extra',1,{},null])unchangedAction(g,'queueEnqueue',id);
 unchangedAction(g,'queueUnexpected','0');
});

test('forest queue uses one unit per actual tick and current geometric prices after manual construction',()=>{
 const g=game(s=>{s.resources.honey=100;});assert.equal(g.act('queueEnqueue','build:hive',3).queued,3);
 assert.equal(g.tick(.1).ticks,0);assert.equal(raw(g).buildings.hive,undefined);
 assert.equal(g.tick(.1).ticks,1);assert.equal(raw(g).buildings.hive,1);assert.equal(g.snapshot().queue.used,2);close(value(g,'honey'),90);
 assert.equal(g.act('build','hive').ok,true);close(value(g,'honey'),78.8);
 close(g.snapshot().queue.items[0].costs[0].value,12.544);
 assert.equal(g.tick(.2).ok,true);assert.equal(raw(g).buildings.hive,3);assert.equal(g.snapshot().queue.used,1);close(value(g,'honey'),78.8+.375-12.544);
 assert.equal(g.tick(.2).ok,true);assert.equal(raw(g).buildings.hive,4);assert.equal(g.snapshot().queue.used,0);close(value(g,'honey'),78.8+.375-12.544+.5625-14.04928);
});

test('forest queue can spend production earned in the same tick',()=>{
 const g=game(s=>{s.buildings.hive=1;s.resources.honey=11.1;});
 g.act('queueEnqueue','build:hive');assert.equal(g.snapshot().queue.items[0].available,false);
 g.tick(.2);assert.equal(raw(g).buildings.hive,2);assert.equal(g.snapshot().queue.used,0);close(value(g,'honey'),11.1+.1875-11.2);
});

test('forest unfunded head blocks affordable later entries until reordered',()=>{
 const g=game(s=>{s.resources.honey=100;});g.act('queueEnqueue','build:library');g.act('queueEnqueue','build:hive');
 g.tick(1);assert.deepEqual(raw(g).buildings,{});assert.equal(value(g,'honey'),100);assert.equal(g.snapshot().queue.used,2);
 g.act('queueUp','1');g.tick(.2);assert.equal(raw(g).buildings.hive,1);assert.equal(g.snapshot().queue.used,1);assert.equal(g.snapshot().queue.items[0].id,'library');
});

test('forest warehouse-limited queue blocks without charging and displays the capacity reason',()=>{
 const g=game(s=>{s.buildings.library=1;s.science.animal=true;s.resources.science=500;s.resources.honey=100;});
 assert.equal(g.act('queueEnqueue','research:construction').ok,true);g.act('queueEnqueue','build:hive');
 assert.equal(g.snapshot().queue.items[0].status,'仓储不足');g.tick(.2);
 assert.equal(value(g,'science'),500);assert.equal(value(g,'honey'),100);assert.equal(g.snapshot().queue.used,2);assert.equal(raw(g).science.construction,undefined);
 // Imported stock above the normal cap is still usable, as with ordinary purchases.
 const funded=game(s=>{s.buildings.library=1;s.science.animal=true;s.resources.science=1300;});funded.act('queueEnqueue','research:construction');funded.tick(.2);
 assert.equal(raw(funded).science.construction,true);assert.equal(funded.snapshot().queue.capacity,4);assert.equal(value(funded,'science'),0);
});

test('forest library and workshop milestones unlock sticky sources through manual and queued purchases',()=>{
 const g=game(s=>{s.resources.wood=1000;s.resources.minerals=1000;s.science.mining=true;});
 assert.equal(source(g,'tech').unlocked,false);assert.equal(source(g,'upgrades').unlocked,false);
 g.act('queueEnqueue','build:library');g.tick(.2);assert.equal(source(g,'tech').unlocked,true);
 assert.ok(g.snapshot().queue.options.some(item=>item.id==='research:calendar'&&!item.stackable));
 assert.equal(g.act('build','workshop').ok,true);assert.equal(source(g,'upgrades').unlocked,true);
 assert.ok(g.snapshot().queue.options.some(item=>item.id==='upgrade:ironAxes'&&!item.stackable));
 g.act('sell','library');g.act('sell','workshop');assert.equal(source(g,'tech').unlocked,true);assert.equal(source(g,'upgrades').unlocked,true);
 assert.equal(createGame({save:g.export(),now:NOW,storage:null}).snapshot().queue.sources.find(item=>item.id==='tech').unlocked,true);
 assert.equal(g.snapshot().queue.options.some(item=>item.id==='research:calendar'),false);assert.equal(g.snapshot().queue.options.some(item=>item.targetType==='upgrade'),false);
 const queuedWorkshop=game(s=>{s.science.mining=true;s.resources.wood=100;s.resources.minerals=400;});queuedWorkshop.act('queueEnqueue','build:workshop');queuedWorkshop.tick(.2);assert.equal(source(queuedWorkshop,'upgrades').unlocked,true);
});

test('forest source and individual gates must both be unlocked, with construction granting one slot',()=>{
 const g=game(s=>{s.science.calendar=true;});unchangedAction(g,'queueEnqueue','research:agriculture');
 const h=game(s=>{s.buildings={library:1,workshop:1};});
 unchangedAction(h,'queueEnqueue','research:agriculture');unchangedAction(h,'queueEnqueue','upgrade:bolas');
 assert.equal(h.act('queueEnqueue','upgrade:ironAxes').ok,true);
 const progressed=game(s=>{s.science.construction=true;});assert.equal(progressed.snapshot().queue.capacity,4);assert.equal(progressed.act('queueEnqueue','build:hive','max').queued,4);
});

test('forest a gate lost after enqueue blocks the head even though its source stays unlocked',()=>{
 const g=game(s=>{s.buildings.library=1;s.resources.science=40;s.resources.honey=20;});
 g.act('queueEnqueue','research:calendar');g.act('queueEnqueue','build:hive');g.act('sell','library');
 assert.equal(source(g,'tech').unlocked,true);assert.equal(g.snapshot().queue.items[0].unlocked,false);assert.match(g.snapshot().queue.items[0].reason,/林间书屋/);
 g.tick(.2);assert.equal(value(g,'science'),40);assert.equal(raw(g).science.calendar,undefined);assert.equal(raw(g).buildings.hive,undefined);assert.equal(g.snapshot().queue.used,2);
});

test('forest single-use quantities, adjacent duplicates and one-tick completed skips match original rules',()=>{
 const g=game(s=>{s.buildings.library=1;s.resources.science=100;s.resources.honey=30;});
 assert.equal(g.act('queueEnqueue','research:calendar',99).queued,1);unchangedAction(g,'queueEnqueue','research:calendar');
 g.act('queueEnqueue','build:hive');assert.equal(g.act('queueEnqueue','research:calendar','max').queued,1);
 assert.equal(g.act('research','calendar').ok,true);assert.equal(g.snapshot().queue.items[0].skip,true);assert.equal(g.snapshot().queue.items[0].status,'已完成或失效');
 g.tick(.2);assert.equal(g.snapshot().queue.used,2);assert.equal(raw(g).buildings.hive,undefined);assert.equal(value(g,'science'),70);
 g.tick(.2);assert.equal(g.snapshot().queue.used,1);assert.equal(raw(g).buildings.hive,1);
 g.tick(.2);assert.equal(g.snapshot().queue.used,0);assert.equal(value(g,'science'),70);
 unchangedAction(g,'queueEnqueue','research:calendar');
});

test('forest queued upgrades purchase exactly once with ordinary effects and costs',()=>{
 const g=game(s=>{s.buildings.workshop=1;s.resources.iron=100;s.resources.science=300;});
 assert.equal(g.act('queueEnqueue','upgrade:ironAxes',3).queued,1);assert.equal(value(g,'iron'),100);
 g.tick(.2);assert.equal(raw(g).workshop.ironAxes,true);assert.equal(value(g,'iron'),50);assert.equal(value(g,'science'),100);assert.equal(g.snapshot().queue.used,0);
 assert.equal(g.snapshot().queue.options.some(item=>item.id==='upgrade:ironAxes'),false);unchangedAction(g,'queueEnqueue','upgrade:ironAxes');
});

test('forest pause freezes automatic work while queue editing remains available',()=>{
 const g=game(s=>{s.resources.honey=100;s.settings.paused=true;});g.act('queueEnqueue','build:hive',2);
 assert.equal(g.snapshot().queue.paused,true);assert.equal(g.tick(100).ticks,0);assert.equal(g.snapshot().queue.used,2);assert.equal(raw(g).buildings.hive,undefined);
 g.act('queueRemove','0');g.setSetting('paused',false);g.tick(.2);assert.equal(raw(g).buildings.hive,1);assert.equal(g.snapshot().queue.used,0);
});

test('forest queue snapshots and aliases are read-only and detached from pending state',()=>{
 const g=game(s=>{s.buildings={library:1,workshop:1};});g.act('queueEnqueue','build:hive',2);const before=g.export();
 for(const read of [g.snapshot,g.getState,g.getViewModel]){
  const view=read();view.queue.items[0].amount=999;view.queue.items[0].costs[0].value=0;view.queue.sources[0].unlocked=false;view.queue.options[0].available=false;view.queue.options.length=0;
 }
 assert.equal(g.export(),before);assert.equal(g.snapshot().queue.used,2);
});

test('forest subscribers only see committed purchases after queue decrement and full simulation',()=>{
 const g=game(s=>{s.resources.honey=100;});g.act('queueEnqueue','build:hive',3);const notifications=[];
 g.subscribe(view=>notifications.push({ticks:view.ticks,used:view.queue.used,built:view.buildings.find(item=>item.id==='hive').owned}));
 g.tick(1);assert.deepEqual(notifications,[{ticks:5,used:0,built:3}]);
});

test('forest old version-one saves load an empty queue without resetting any settlement',()=>{
 const original=game(s=>{s.resources.honey=123;s.buildings={hive:3,library:2,workshop:1};s.science.calendar=true;s.ticks=91;s.calendar.day=9;s.calendar.tick=1;});
 const old=raw(original);delete old.queue;const text=JSON.stringify(old),storage=storageWith(text),restored=loadGame({storage,now:NOW});
 assert.equal(restored.snapshot().storageProtected,false);assert.equal(storage.writes.length,0);assert.equal(restored.snapshot().queue.used,0);
 assert.deepEqual(raw(restored).queue,{items:[],sources:{buildings:true,tech:true,upgrades:true}});
 for(const key of Object.keys(old).filter(key=>!['log','nextLogId'].includes(key)))assert.deepEqual(raw(restored)[key],old[key],key);
 for(const [key,value]of Object.entries(SAVE_HEADER))assert.equal(raw(restored)[key],value);
});

test('forest queue order, groups and source history survive export, import and storage reload',()=>{
 const g=game(s=>{s.buildings={library:1,workshop:1};s.science.construction=true;});
 g.act('queueEnqueue','build:hut',2);g.act('queueEnqueue','upgrade:ironAxes');g.act('queueEnqueue','research:calendar');g.act('queueUp','2');
 g.act('sell','library');g.act('sell','workshop');const exported=g.export(),expected=raw(g).queue;
 const imported=game();assert.equal(imported.importSave(exported).ok,true);assert.deepEqual(raw(imported).queue,expected);
 const storage=storageWith(exported),loaded=loadGame({storage,now:NOW});assert.deepEqual(raw(loaded).queue,expected);assert.equal(loaded.save().ok,true);assert.deepEqual(JSON.parse(storage.getItem(constants.SAVE_KEY)).queue,expected);
});

test('forest saved above-cap queues remain ordered and editable without new enqueue',()=>{
 const g=game(s=>{s.resources.honey=100;s.queue={items:[{type:'build',id:'hive',amount:5},{type:'build',id:'hut',amount:1}],sources:{buildings:true}};});
 assert.equal(g.snapshot().queue.used,6);assert.equal(g.snapshot().queue.free,0);unchangedAction(g,'queueEnqueue','build:hive');
 assert.equal(g.act('queueDown','0').ok,true);assert.equal(g.act('queueUp','1').ok,true);g.tick(.2);assert.equal(g.snapshot().queue.used,5);assert.equal(raw(g).buildings.hive,1);
 assert.equal(g.act('queueRemove','0',3).removed,3);assert.equal(g.snapshot().queue.used,2);assert.equal(g.act('queueEnqueue','build:library').ok,true);
});

test('forest malformed, prototype-shaped and future queue saves are rejected atomically',()=>{
 const g=game();g.act('queueEnqueue','build:hive');const before=g.export();
 const item={type:'build',id:'hive',amount:1},queue={items:[item],sources:{buildings:true}};
 const bads=[null,[],0,{}, {...queue,items:null},{...queue,items:{}},{...queue,extra:true},{...queue,sources:[]},{...queue,sources:{buildings:'yes'}},{...queue,sources:{spaceMission:true}},{...queue,sources:JSON.parse('{"__proto__":true}')},
  ...[null,[],{}, {...item,type:'reset'}, {...item,type:'space',id:'orbitalLaunch'}, {...item,id:'chronosphere'}, {...item,type:'research',id:'astronomy'}, {...item,type:'upgrade',id:'factoryOptimization'}, {...item,type:'constructor'}, {...item,id:'constructor'}, {...item,id:'__proto__'}, {...item,amount:0}, {...item,amount:-1}, {...item,amount:1.5}, {...item,amount:1000001}, {...item,amount:'1'}, {...item,type:'research',id:'calendar',amount:2}, {...item,extra:true}].map(bad=>({...queue,items:[bad]})),
  {...queue,items:[{...item,amount:1000000},item]},
 ];
 for(const queue of bads){const corrupted=JSON.stringify({...JSON.parse(before),queue});assert.throws(()=>parseSave(corrupted),undefined,JSON.stringify(queue));assert.equal(g.importSave(corrupted).ok,false);assert.equal(g.export(),before);}
 const protectedStorage=storageWith(JSON.stringify({...JSON.parse(before),queue:bads[0]})),loaded=loadGame({storage:protectedStorage,now:NOW});
 assert.equal(loaded.snapshot().storageProtected,true);assert.equal(loaded.save().ok,false);assert.equal(loaded.act('queueEnqueue','build:hive').ok,false);assert.equal(protectedStorage.writes.length,0);
});

test('forest online, synchronous offline and chunked offline have exact queue and economy parity',async()=>{
 const initial=game(s=>{s.resources={...s.resources,honey:100,wood:25,science:30};s.queue={items:[{type:'build',id:'library',amount:1},{type:'research',id:'calendar',amount:1},{type:'build',id:'hive',amount:2}],sources:{buildings:true}};});
 const save=initial.export(),online=createGame({save,now:NOW,storage:null}),sync=createGame({save,now:NOW,storage:null}),asyncGame=createGame({save,now:NOW,storage:null});
 assert.equal(online.tick(62).ok,true);assert.equal(sync.simulate(62,{offline:true}).ok,true);assert.equal((await asyncGame.catchUpAsync(62)).ok,true);
 assert.deepEqual(raw(sync),raw(online));assert.deepEqual(raw(asyncGame),raw(online));assert.equal(online.snapshot().queue.used,0);assert.equal(raw(online).science.calendar,true);assert.equal(raw(online).buildings.hive,2);
});

test('forest pending and running offline work blocks all public queue mutations and unsafe saves',async()=>{
 const g=game(s=>{s.resources.honey=100;s.settings.offline=true;});g.act('queueEnqueue','build:hive',3);const storage=storageWith(g.export()),loaded=loadGame({storage,now:NOW+62000,deferOffline:true});
 const blocked=()=>{for(const action of [['queueEnqueue','build:hut'],['queueRemove','0'],['queueUp','0'],['queueDown','0'],['queueClear','confirm']])assert.equal(loaded.act(...action).ok,false);assert.equal(loaded.save().ok,false);assert.equal(loaded.tick(.2).ok,false);assert.equal(loaded.setSetting('paused',true).ok,false);assert.throws(()=>loaded.export());};
 blocked();let checked=false;
 const result=await loaded.catchUpAsync(undefined,{onProgress:()=>{checked=true;blocked();}});
 assert.equal(result.ok,true);assert.equal(checked,true);assert.equal(loaded.snapshot().queue.used,0);assert.equal(raw(loaded).buildings.hive,3);assert.equal(storage.writes.length,0);assert.equal(loaded.save().ok,true);
});

test('forest cancelled offline queue purchases roll back exactly and retry deterministically',async()=>{
 const g=game(s=>{s.resources.honey=100;});g.act('queueEnqueue','build:hive',3);const before=g.export(),controller=new AbortController();
 const result=await g.catchUpAsync(100,{signal:controller.signal,onProgress:()=>controller.abort()});
 assert.equal(result.ok,false);assert.equal(result.cancelled,true);assert.equal(g.export(),before);
 const online=game(s=>{s.resources.honey=100;});online.act('queueEnqueue','build:hive',3);online.tick(100);assert.equal((await g.catchUpAsync(100)).ok,true);assert.deepEqual(raw(g),raw(online));
});

test('forest simulation failure restores queued payment, source unlocks, logs and clocks',async()=>{
 const g=game(s=>{s.resources.wood=100;s.calendar={year:1e9,season:3,day:99,tick:9,weather:0};});g.act('queueEnqueue','build:library');const before=g.export();
 const notifications=[];g.subscribe(view=>notifications.push(view));assert.equal(g.tick(.2).ok,false);assert.equal(g.export(),before);assert.equal(notifications.length,0);
 assert.equal((await g.catchUpAsync(6)).ok,false);assert.equal(g.export(),before);assert.equal(source(g,'tech').unlocked,false);assert.doesNotThrow(()=>parseSave(g.export()));
});

test('forest restored queue preserves full-reference action rules and per-tick economic results',()=>{
 const chapter=game(s=>{s.resources.honey=1000;s.resources.wood=200;s.resources.minerals=500;s.resources.iron=50;s.resources.science=500;s.buildings={library:1,workshop:1};});
 const a=raw(chapter),b=raw(createReference({seed:a.rng,now:NOW,storage:null}));
 for(const key of ['savedAt','startedAt','rng','ticks','tickRemainder','calendar','buildings','science','workshop','disabled','activeBuildings','pollution','arrival','deathCooldown','nextBearId','observation','settings','queue'])b[key]=structuredClone(a[key]);
 Object.assign(b.resources,a.resources);b.ironWill=a.solitary;
 const reference=createReference({save:b,now:NOW,storage:null});
 const compare=()=>{
  const x=raw(chapter),y=raw(reference);for(const key of ['buildings','science','workshop','activeBuildings','disabled','calendar','rng','ticks'])assert.deepEqual(x[key],y[key],key);
  for(const resource of catalog.resources)close(x.resources[resource.id],y.resources[resource.id]);assert.deepEqual(x.queue.items,y.queue.items);
  for(const key of ['capacity','used','free','paused'])assert.equal(chapter.snapshot().queue[key],reference.snapshot().queue[key],key);
  const fields=['id','type','amount','index','name','source','costs','available','unlocked','skip','status','reason'];
  const pick=item=>Object.fromEntries(fields.map(key=>[key,item[key]]));assert.deepEqual(chapter.snapshot().queue.items.map(pick),reference.snapshot().queue.items.map(pick));
 };
 for(const action of [['queueEnqueue','research:calendar'],['queueEnqueue','research:calendar'],['queueEnqueue','build:hive',2],['queueDown','0'],['queueRemove','0'],['queueEnqueue','upgrade:ironAxes'],['queueUp','2']]){
  const actual=chapter.act(...action),expected=reference.act(...action);assert.equal(actual.ok,expected.ok);assert.equal(actual.queued,expected.queued);assert.equal(actual.removed,expected.removed);compare();
 }
 for(let i=0;i<10;i++){assert.equal(chapter.tick(.2).ok,true);assert.equal(reference.tick(.2).ok,true);compare();}
});
