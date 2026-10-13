import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame,loadGame,catalog,constants,parseSave,SAVE_HEADER} from '../src/chapters/forest/engine.js';
import {createGame as createReference} from '../src/engine/index.js';

const NOW=1000000;
const traits=['scientist','manager','engineer','merchant','wise','metallurgist','chemist','none'];
const raw=game=>JSON.parse(game.exportSave());
const fresh=()=>raw(createGame({seed:123456789,now:NOW,storage:null}));
const resource=(game,id)=>game.snapshot().resources.find(r=>r.id===id);
function pair(edit=()=>{}){
 const chapter=fresh();edit(chapter);
 const reference=JSON.parse(createReference({seed:chapter.rng,now:NOW,storage:null}).exportSave());
 for(const key of ['savedAt','startedAt','rng','ticks','tickRemainder','calendar','resourceUnlocked','buildings','science','workshop','disabled','activeBuildings','pollution','arrival','deathCooldown','nextBearId','observation','settings'])reference[key]=structuredClone(chapter[key]);
 Object.assign(reference.resources,chapter.resources);Object.assign(reference.stats,chapter.stats);reference.ironWill=chapter.solitary;
 reference.bears=chapter.bears.map(({disposition,...bear})=>({...bear,trait:traits[disposition??7],rank:0}));
 return [createGame({save:chapter,now:NOW,storage:null}),createReference({save:reference,now:NOW,storage:null})];
}
const close=(a,b,message)=>assert.ok(Math.abs(a-b)<=1e-10*Math.max(1,Math.abs(a),Math.abs(b)),`${message}: ${a} !== ${b}`);
function equalEconomy(a,b,label=''){
 const av=a.snapshot(),bv=b.snapshot();
 for(const left of av.resources){const right=bv.resources.find(r=>r.id===left.id);for(const key of ['value','rate','grossRate','consumptionRate'])close(left[key],right[key],`${label} ${left.id}.${key}`);assert.equal(left.max,right.max,`${label} ${left.id}.max`);}
 for(const key of ['value','max','free','arrival','happiness'])close(av.bears[key],bv.bears[key],`${label} bears.${key}`);
 close(av.pollution.value,bv.pollution.value,`${label} pollution`);assert.deepEqual(av.calendar,bv.calendar);assert.equal(av.ticks,bv.ticks);
 const ar=raw(a),br=raw(b);assert.equal(ar.rng,br.rng,`${label} RNG`);
 for(const key of ['buildings','science','workshop','activeBuildings','disabled'])assert.deepEqual(ar[key],br[key],`${label} ${key}`);
 for(const key of Object.keys(ar.stats))assert.equal(ar.stats[key],br.stats[key],`${label} stats.${key}`);
 assert.deepEqual(ar.bears.map(({disposition,...bear})=>bear),br.bears.map(({disposition,trait,rank,engineerSpecialty,...bear})=>bear),`${label} individuals`);
}
function stocked(s){
 Object.assign(s.resources,{honey:1e6,wood:1e6,minerals:1e6,iron:1e6,science:1e6,manpower:100000,beam:10000,slab:10000});
 s.solitary=false;s.science=Object.fromEntries(catalog.science.map(d=>[d.id,true]));
 s.buildings={hive:40,hut:6,library:12,barn:4,pasture:10,mine:5,workshop:3,smelter:2,logHouse:3,warehouse:4,lumberMill:5};
 s.bears=Array.from({length:12},(_,i)=>({id:i+1,name:`小熊 ${i+1}`,job:catalog.jobs[i%5].id,disposition:i%8,color:i%7,variety:i%5,experience:12000,skills:{[catalog.jobs[i%5].id]:[0,100,500,1200,2500,5000,9000][i%7],woodcutter:321}}));
 s.nextBearId=13;
}

test('forest fresh costs, gates and action outcomes match the reference',()=>{
 const [a,b]=pair();equalEconomy(a,b);
 for(const type of ['buildings','science','workshop','crafts','jobs'])for(const card of a.snapshot()[type]){
  const reference=b.snapshot()[type].find(d=>d.id===card.id);
  for(const key of ['costs','unlocked','available','owned','reason'])assert.deepEqual(card[key],reference[key],`${type}.${card.id}.${key}`);
 }
 for(let i=0;i<100;i++){assert.equal(a.act('gather','honey').ok,b.act('gather','honey').ok);}
 for(const action of [['build','hive',3],['refine','wood',1],['build','hut',1],['research','calendar',1],['craft','beam',1]]){assert.equal(a.act(...action).ok,b.act(...action).ok);equalEconomy(a,b,action.join(' '));}
});

test('forest preserved early costs and all released upgrades match original equations',()=>{
 const [a,b]=pair(stocked);
 for(const def of catalog.workshop){assert.equal(a.act('upgrade',def.id).ok,true);assert.equal(b.act('upgrade',def.id).ok,true);equalEconomy(a,b,def.id);}
 for(const [type,id,amount]of [['build','hive',7],['build','warehouse',3],['build','hut',2],['craft','beam',5],['craft','slab',3],['refine','wood',4],['sell','hive',4],['sell','warehouse',2],['toggle','smelter',1]]){
  const x=a.act(type,id,amount),y=b.act(type,id,amount);assert.equal(x.ok,y.ok);equalEconomy(a,b,`${type} ${id}`);
 }
});

test('forest research consumes the unchanged science costs along the released chain',()=>{
 const [a,b]=pair(s=>{s.solitary=false;s.resources.science=20000;s.buildings.library=10;});
 for(const id of ['calendar','agriculture','archery','mining','metal','animal','construction']){assert.equal(a.act('research',id).ok,true);assert.equal(b.act('research',id).ok,true);equalEconomy(a,b,id);}
});

test('forest wood max refinement, batch costs and caps retain reference behavior',()=>{
 const [a,b]=pair(s=>{stocked(s);s.resources.wood=0;s.resources.honey=1500;s.workshop.advancedRefinement=true;});
 assert.equal(a.act('refine','wood','max').ok,true);assert.equal(b.act('refine','wood','max').ok,true);equalEconomy(a,b);
});

test('forest happiness, food, skills and production retain reference mechanics',()=>{
 const [a,b]=pair(s=>{stocked(s);s.workshop=Object.fromEntries(catalog.workshop.map(d=>[d.id,true]));s.resources.furs=1000;s.resources.ivory=1000;s.resources.unicorns=2;s.pollution=6e7;});
 equalEconomy(a,b);
 for(const seconds of [.1,.1,1,12,60]){a.tick(seconds);b.tick(seconds);equalEconomy(a,b,`${seconds} seconds`);}
 for(const action of [['unassign','farmer',1],['assign','woodcutter',1],['unassign','woodcutter','max'],['assign','scholar','max']]){assert.equal(a.act(...action).ok,b.act(...action).ok);equalEconomy(a,b,action.join(' '));}
});

test('forest arrivals preserve deterministic random appearance and timing',()=>{
 const [a,b]=pair(s=>{s.solitary=false;s.buildings={hive:30,hut:2};s.resources.honey=4000;});
 for(const seconds of [19.8,.2,20,40]){a.tick(seconds);b.tick(seconds);equalEconomy(a,b,`${seconds} seconds`);}
 assert.equal(a.snapshot().bears.value,4);
});

test('forest starvation and death cooldown match the reference',()=>{
 const [a,b]=pair(s=>{stocked(s);s.buildings.hive=0;s.resources.honey=0;s.bears.forEach(b=>b.job='woodcutter');});
 for(const seconds of [.2,.2,5,10,30]){a.tick(seconds);b.tick(seconds);equalEconomy(a,b);}
 assert.ok(a.snapshot().stats.totalDeaths>0);
});

test('forest hunting RNG, luxury returns and costs match exactly',()=>{
 const [a,b]=pair(s=>{stocked(s);s.workshop.bolas=true;s.workshop.huntingArmor=true;});
 for(const count of [1,7,100]){const x=a.act('hunt','hunt',count),y=b.act('hunt','hunt',count);assert.equal(x.ok,true);assert.deepEqual(x.gains,y.gains);equalEconomy(a,b);}
 assert.ok(resource(a,'furs').value>0);assert.ok(resource(a,'unicorns').value>0);
});

test('forest smelter fuel uses fractional operation and existing per-tick worker supply',()=>{
 for(const fuel of [{wood:0,minerals:0},{wood:.05,minerals:.01},{wood:.03,minerals:.13},{wood:2,minerals:2}]){
  const [a,b]=pair(s=>{stocked(s);Object.assign(s.resources,fuel);s.buildings.smelter=4;});
  for(let i=0;i<8;i++){equalEconomy(a,b);a.tick(.2);b.tick(.2);}
  a.act('toggle','smelter');b.act('toggle','smelter');a.tick(2);b.tick(2);equalEconomy(a,b);
 }
});

test('forest weather, seasons, meteors and library events preserve housed RNG',()=>{
 const [a,b]=pair(s=>{stocked(s);s.calendar={year:4,season:2,day:99,tick:7,weather:0};s.workshop.prospecting=true;s.resources.minerals=0;s.resources.science=0;});
 for(const seconds of [.6,200,200,200]){a.tick(seconds);b.tick(seconds);equalEconomy(a,b);}
});

test('forest early observation bonuses and solitary refinement are preserved',()=>{
 // Specialist visitors are outside this release; this pre-housing fixture does not unlock hunting.
 const [a,b]=pair(s=>{s.resources.honey=1000;s.resources.science=0;s.buildings={library:3,lumberMill:2};s.observation={expires:10};});
 a.act('refine','wood',2);b.act('refine','wood',2);equalEconomy(a,b);
 a.act('observe','observe');b.act('observe','observe');equalEconomy(a,b);
 a.tick(80);b.tick(80);equalEconomy(a,b);
});

test('forest imports round-trip and reject incompatible or unknown state without mutation',()=>{
 const a=createGame({seed:19,now:NOW,storage:null});a.act('gather','honey');const exported=a.exportSave();
 assert.equal(a.importSave(exported).ok,true);assert.deepEqual(Object.fromEntries(Object.keys(SAVE_HEADER).map(k=>[k,raw(a)[k]])),SAVE_HEADER);
 const reference=createReference({seed:1,now:NOW,storage:null}).exportSave();
 const bads=[reference,'{',JSON.stringify({...raw(a),schema:99}),JSON.stringify({...raw(a),contentLevel:2}),JSON.stringify({...raw(a),surprise:true}),JSON.stringify({...raw(a),resources:{...raw(a).resources,unreleased:1}}),JSON.stringify({...raw(a),bears:[{id:1,job:'unknown'}],nextBearId:2})];
 for(const bad of bads){const before=a.exportSave();assert.equal(a.importSave(bad).ok,false);assert.equal(a.exportSave(),before);assert.throws(()=>parseSave(bad));}
 const before=a.exportSave();for(const action of [['__proto__','x'],['build','constructor'],['build','hive',0],['craft','unknown'],['gather','wood']]){assert.equal(a.act(...action).ok,false);assert.equal(a.exportSave(),before);}
});

test('forest cumulative storage protects incompatible bytes and leaves other slots alone',()=>{
 const foreign=createReference({now:NOW,storage:null}).exportSave(),store=new Map([[constants.SAVE_KEY,foreign],['beargame.save.v1',foreign]]),calls=[];
 const storage={getItem:key=>store.get(key)??null,setItem:(key,value)=>{calls.push(key);store.set(key,value);}};
 const game=loadGame({storage,now:NOW});assert.equal(game.snapshot().storageProtected,true);assert.equal(game.save().ok,false);assert.equal(game.tick(1).ok,false);assert.equal(game.act('gather','honey').ok,false);assert.equal(store.get(constants.SAVE_KEY),foreign);assert.equal(calls.length,0);
 assert.equal(game.importSave(createGame({now:NOW,storage:null}).exportSave()).ok,true);assert.equal(game.save().ok,true);assert.deepEqual(calls,[constants.SAVE_KEY]);assert.equal(store.get('beargame.save.v1'),foreign);
});

test('forest blocked storage reads do not permit fallback overwrite',()=>{
 let writes=0;const game=loadGame({now:NOW,storage:{getItem(){throw new Error('blocked');},setItem(){writes++;}}});assert.equal(game.snapshot().saveStatus.ok,false);assert.equal(game.save().ok,false);assert.equal(writes,0);
});

test('forest exact offline settlement matches online ticks and rolls back cancellation',async()=>{
 const s=fresh();stocked(s);s.settings.offline=true;
 const online=createGame({save:s,now:NOW,storage:null}),offline=createGame({save:s,now:NOW,storage:null});online.tick(62);const report=await offline.catchUpAsync(62);assert.equal(report.ok,true);equalEconomy(offline,online);assert.equal(report.ticks,310);
 const pending=createGame({save:s,now:NOW,storage:null}),before=pending.exportSave(),controller=new AbortController();
 const outcome=await pending.catchUpAsync(100,{signal:controller.signal,onProgress:()=>controller.abort()});assert.equal(outcome.cancelled,true);assert.equal(pending.exportSave(),before);
 const paused=createGame({save:s,now:NOW,storage:null});paused.setSetting('paused',true);assert.equal(paused.tick(30).ticks,0);
});

test('forest load schedules only opted-in offline progress',async()=>{
 const seed=createGame({now:NOW,storage:null});seed.setSetting('offline',true);const text=seed.exportSave();let stored=text;
 const storage={getItem:key=>key===constants.SAVE_KEY?stored:null,setItem:(key,value)=>{stored=value;}};
 const game=loadGame({storage,now:NOW+60000,deferOffline:true});assert.equal(game.snapshot().pendingOffline,60);assert.equal(game.act('gather','honey').ok,false);assert.equal((await game.catchUpAsync()).ok,true);assert.equal(game.snapshot().ticks,300);assert.equal(game.snapshot().pendingOffline,0);assert.equal(game.save().ok,true);
});

test('forest empty saved text is corruption, not permission to replace the slot',()=>{
 let writes=0;const game=loadGame({now:NOW,storage:{getItem(){return '';},setItem(){writes++;}}});
 assert.equal(game.snapshot().storageProtected,true);assert.equal(game.save().ok,false);assert.equal(writes,0);assert.throws(()=>createGame({save:'',now:NOW,storage:null}));
});

test('forest numeric and identity validation rejects damaged records atomically',()=>{
 const game=createGame({now:NOW,storage:null}),original=game.exportSave();
 const edits=[
  s=>s.tickRemainder=1,
  s=>s.resources.honey=-1,
  s=>s.resources.honey='10',
  s=>s.resources.honey=1e101,
  s=>s.calendar.day=-1,
  s=>s.activeBuildings.hive=1,
  s=>{s.bears=[{id:1},{id:1}];s.nextBearId=2;},
  s=>{s.bears=[{id:2,skills:{woodcutter:20002}}];s.nextBearId=3;},
  s=>s.settings.paused='false',
  s=>s.science.calendar=1,
 ];
 for(const edit of edits){const damaged=JSON.parse(original);edit(damaged);assert.equal(game.importSave(JSON.stringify(damaged)).ok,false);assert.equal(game.exportSave(),original);}
});

test('forest settlement overflow rolls back resources, clocks and RNG',async()=>{
 const save=fresh();save.calendar={year:1e9,season:3,day:99,tick:9,weather:0};save.buildings.hive=1;save.resources.honey=30;
 const game=createGame({save,now:NOW,storage:null}),before=game.exportSave();assert.equal(game.tick(.2).ok,false);assert.equal(game.exportSave(),before);assert.equal((await game.catchUpAsync(6)).ok,false);assert.equal(game.exportSave(),before);
});

test('forest fractional ticks, full storage and luxury depletion match original',()=>{
 const [a,b]=pair(s=>{stocked(s);s.resources.honey=0;s.resources.furs=.05;s.resources.ivory=.05;s.resources.unicorns=1;s.buildings.hive=80;});
 for(let i=0;i<12;i++){a.tick(.07);b.tick(.07);equalEconomy(a,b);}
 const [c,d]=pair(s=>{s.resources.honey=5000;s.resources.wood=200;});
 for(const action of [['gather','honey'],['refine','wood']]){const before=c.exportSave();assert.equal(c.act(...action).ok,false);assert.equal(d.act(...action).ok,false);assert.equal(c.exportSave(),before);equalEconomy(c,d);}
});

test('forest arrival identifier overflow cannot create an unreadable save',async()=>{
 const save=fresh();save.buildings={hut:1,hive:20};save.resources.honey=5000;save.arrival=.999;save.nextBearId=Number.MAX_SAFE_INTEGER;save.solitary=false;
 const game=createGame({save,now:NOW,storage:null}),before=game.exportSave();
 assert.equal(game.tick(.2).ok,false);assert.equal(game.exportSave(),before);assert.doesNotThrow(()=>parseSave(game.exportSave()));
 assert.equal((await game.catchUpAsync(6)).ok,false);assert.equal(game.exportSave(),before);assert.doesNotThrow(()=>parseSave(game.exportSave()));
});

test('forest normalized save expansion cannot produce an unreadable export',()=>{
 const save=fresh();save.bears=Array.from({length:40000},(_,i)=>({id:i+1}));save.nextBearId=40001;const compact=JSON.stringify(save);
 assert.ok(Buffer.byteLength(compact)<4*1024*1024);assert.throws(()=>parseSave(compact),/大小上限/);
 const game=createGame({now:NOW,storage:null}),before=game.exportSave();assert.equal(game.importSave(compact).ok,false);assert.equal(game.exportSave(),before);
 let writes=0;const loaded=loadGame({now:NOW,storage:{getItem:()=>compact,setItem:()=>{writes++;}}});assert.equal(loaded.snapshot().storageProtected,true);assert.equal(loaded.save().ok,false);assert.equal(writes,0);
});

test('forest named hunt and observation actions reject unknown ids unchanged',()=>{
 const save=fresh();stocked(save);save.observation={expires:100};const game=createGame({save,now:NOW,storage:null}),before=game.exportSave();
 for(const action of [['hunt','unknown'],['observe','unknown']]){assert.equal(game.act(...action).ok,false);assert.equal(game.exportSave(),before);}
 assert.equal(game.act('hunt','hunt').ok,true);assert.equal(game.act('observe','observe').ok,true);
});

test('forest observation deadlines cannot overflow the safe clock range',async()=>{
 const save=fresh();save.rng=1;save.ticks=Number.MAX_SAFE_INTEGER-100;save.calendar.tick=9;save.buildings.library=1;
 const game=createGame({save,now:NOW,storage:null}),before=game.exportSave();
 assert.equal(game.tick(.2).ok,false);assert.equal(game.exportSave(),before);assert.doesNotThrow(()=>parseSave(game.exportSave()));
 assert.equal((await game.catchUpAsync(6)).ok,false);assert.equal(game.exportSave(),before);
});

test('forest tick-counter overflow rolls back rather than persisting an unsafe number',()=>{
 const save=fresh();save.ticks=Number.MAX_SAFE_INTEGER;const game=createGame({save,now:NOW,storage:null}),before=game.exportSave();
 assert.equal(game.tick(.2).ok,false);assert.equal(game.exportSave(),before);assert.doesNotThrow(()=>parseSave(game.exportSave()));
});
