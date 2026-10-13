/**
 * An earned, public-API forest campaign. No fixture save, resource injection,
 * direct state edit, debug hook, accelerated calendar or production multiplier.
 * Default target is the built distributable. Simulated seconds are not CPU time
 * or evidence that a human would enjoy this strategy or its pacing.
 */
import assert from 'node:assert/strict';
import {existsSync, writeFileSync} from 'node:fs';
import {resolve, dirname} from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
import {performance} from 'node:perf_hooks';

export const checkout = resolve(dirname(fileURLToPath(import.meta.url)), '..');
export const RESEARCH = ['calendar','agriculture','archery','mining','metal','animal','construction'];
export const UPGRADES = ['mineralHoes','mineralAxes','ironHoes','ironAxes','advancedRefinement'];
export const CONSTRUCTION = ['logHouse','warehouse','lumberMill'];
export const FUTURE_ACTIONS = [
 ['research','astronomy'], ['research','industrialization'], ['research','chronophysics'],
 ['build','factory'], ['build','observatory'], ['build','accelerator'],
 ['upgrade','steelAxe'], ['upgrade','seti'], ['craft','plate'], ['refine','steel'],
 ['assign','geologist'], ['unassign','engineer'], ['gather','oil'], ['toggle','reactor'],
 ['sell','factory'], ['trade','zebras'], ['faith','ziggurat'], ['space','moonMission'],
 ['shatter','timeCrystal'], ['reset','paragon'], ['challenge','anarchy'],
 ['explore','forest'], ['policy','liberty'], ['leader','1'], ['queue','hut'],
 ['futureAction','hive'], ['build','futureBuilding'], ['research','futureResearch'],
 ['upgrade','futureUpgrade'], ['craft','futureCraft'], ['assign','futureJob'],
];

export async function loadForestEngine({root=checkout, source=false}={}) {
 const target = resolve(root, source?'src/chapters/forest/engine.js':'dist/src/chapters/forest/engine.js');
 assert.ok(existsSync(target), `Forest engine is missing: ${target}. Run npm run build first; source fallback is deliberately disabled.`);
 const module = await import(pathToFileURL(target).href);
 for (const method of ['createGame','importGame','loadGame']) assert.equal(typeof module[method], 'function', `Missing public export ${method}`);
 return {...module, target};
}

/** Display history and save timestamps do not represent simulation state. */
export function semanticSave(text) {
 const save=JSON.parse(text);
 for (const key of ['savedAt','log','nextLogId']) delete save[key];
 return save;
}

export function memoryStorage() {
 const values=new Map();
 return {getItem:key=>values.get(key)??null, setItem:(key,value)=>values.set(key,String(value)), removeItem:key=>values.delete(key)};
}

export function assertFutureActionsAreAtomic(game) {
 const before=game.export();
 for(const args of FUTURE_ACTIONS) {
  const outcome=game.act(...args);
  assert.equal(outcome?.ok,false,`Future/unknown action must fail: ${JSON.stringify(args)}`);
  assert.equal(game.export(),before,`Rejected action changed the save: ${JSON.stringify(args)}`);
 }
 return FUTURE_ACTIONS.length;
}

export function runEarnedForestCampaign(engine,{seed=17,maxSimulatedSeconds=86400,onMilestone=()=>{}}={}) {
 const started=performance.now(), cpuStarted=process.cpuUsage();
 let now=1_790_000_000_000, game=engine.createGame({seed,storage:null,now:()=>now});
 let simulatedSeconds=0, tickCalls=0, activePhase='fresh', minimumObservedHoney=Infinity;
 const calls=[], milestones=[];
 const view=()=>game.snapshot();
 const resource=id=>view().resources.find(item=>item.id===id);
 const card=(group,id)=>{const result=view()[group].find(item=>item.id===id);assert.ok(result,`Missing ${group}/${id}`);return result;};
 const check=()=>{
  const state=view();
  assert.equal(state.stats.totalDeaths,0,`${activePhase}: a bear died after ${simulatedSeconds} simulated seconds`);
  assert.ok(state.resources.every(item=>Number.isFinite(item.value)&&item.value>=0),`${activePhase}: invalid resource`);
  assert.ok(state.bears.value<=state.bears.max,`${activePhase}: population exceeds earned housing`);
  assert.equal(state.jobs.reduce((sum,item)=>sum+item.assigned,0)+state.bears.free,state.bears.value,`${activePhase}: invalid job allocation`);
  if(state.bears.value)minimumObservedHoney=Math.min(minimumObservedHoney,resource('honey').value);
 };
 const act=(...args)=>{
  const outcome=game.act(...args);
  assert.equal(outcome?.ok,true,`${activePhase} at ${simulatedSeconds}s, ${JSON.stringify(args)}: ${outcome?.message}`);
  calls.push({method:'act',args});check();return outcome;
 };
 const tick=seconds=>{
  assert.ok(simulatedSeconds+seconds<=maxSimulatedSeconds,`${activePhase} exceeded ${maxSimulatedSeconds}s simulation safety budget; this is not a pacing target`);
  const outcome=game.tick(seconds);
  assert.equal(outcome?.ok,true,`${activePhase}: tick(${seconds}): ${outcome?.message}`);
  calls.push({method:'tick',args:[seconds]});tickCalls++;simulatedSeconds+=seconds;now+=seconds*1000;check();
 };
 const until=(predicate,label)=>{
  const phaseStart=simulatedSeconds;
  while(!predicate()) {
   assert.ok(simulatedSeconds-phaseStart<21600,`${activePhase}/${label} stalled for six simulated hours; ${JSON.stringify(view().resources.map(({id,value,rate,max})=>({id,value,rate,max})))}`);
   tick(2);
  }
 };
 const stock=(id,amount)=>{
  const item=resource(id);
  assert.ok(item.max===null||item.max+1e-8>=amount,`${activePhase}: ${id} needs ${amount}, but earned capacity is ${item.max}`);
  until(()=>resource(id).value+1e-8>=amount,`${id} >= ${amount}`);
 };
 const buy=(group,id,{honeyReserve=0}={})=>{
  assert.ok(card(group,id).unlocked,`${activePhase}: locked ${group}/${id}: ${card(group,id).reason}`);
  for(const cost of card(group,id).costs)assert.ok(resource(cost.id).max===null||resource(cost.id).max+1e-8>=cost.value,`${activePhase}: ${id} cost exceeds ${cost.id} capacity`);
  until(()=>card(group,id).available&&resource('honey').value-(card(group,id).costs.find(c=>c.id==='honey')?.value||0)>=honeyReserve,`afford ${id}`);
  act({buildings:'build',science:'research',workshop:'upgrade'}[group],id);
 };
 const jobs=desired=>{
  assert.equal(Object.values(desired).reduce((a,b)=>a+b,0),view().bears.value,`${activePhase}: allocate all earned bears`);
  for(const job of view().jobs){const surplus=job.assigned-(desired[job.id]||0);if(surplus>0)act('unassign',job.id,surplus);}
  for(const [id,count]of Object.entries(desired)){const shortage=count-card('jobs',id).assigned;if(shortage>0)act('assign',id,shortage);}
 };
 const milestone=id=>{
  activePhase=id;
  const state=view();
  const result={id,simulatedSeconds,ticks:state.ticks,year:state.calendar.year,bears:state.bears.value,deaths:state.stats.totalDeaths,buildings:Object.fromEntries(state.buildings.filter(x=>x.owned).map(x=>[x.id,x.owned])),research:state.science.filter(x=>x.completed).map(x=>x.id),upgrades:state.workshop.filter(x=>x.completed).map(x=>x.id)};
  milestones.push(result);onMilestone(result);
 };

 assert.ok(view().resources.every(item=>item.value===0),'Campaign must begin with no resources');
 assert.equal(view().bears.value,0,'Campaign must begin with no bears');
 assert.ok(view().science.every(item=>!item.completed),'Campaign must begin with no research');
 assert.ok(view().buildings.every(item=>item.owned===0),'Campaign must begin with no buildings');
 milestone('empty-forest');
 for(let i=0;i<10;i++)act('gather','honey');
 buy('buildings','hive');
 while(card('buildings','hive').owned<20)buy('buildings','hive');
 stock('honey',2000);act('refine','wood',5);buy('buildings','hut');
 until(()=>view().bears.value===2,'first two arrivals');jobs({woodcutter:2});
 buy('buildings','library');jobs({scholar:2});
 buy('science','calendar');buy('science','agriculture');
 milestone('first-research-and-arrivals');

 jobs({farmer:1,woodcutter:1});
 while(card('buildings','hive').owned<35)buy('buildings','hive',{honeyReserve:2000});
 buy('buildings','hut',{honeyReserve:2000});until(()=>view().bears.value===4,'four arrivals');jobs({farmer:2,woodcutter:2});
 buy('buildings','barn');
 buy('buildings','hut',{honeyReserve:2500});until(()=>view().bears.value===6,'six arrivals');jobs({farmer:4,woodcutter:2});
 buy('buildings','hut',{honeyReserve:2500});until(()=>view().bears.value===8,'eight arrivals');jobs({farmer:6,woodcutter:2});
 while(card('buildings','library').owned<5)buy('buildings','library');
 stock('wood',200);jobs({farmer:6,scholar:2});
 buy('science','mining');stock('science',100);
 jobs({farmer:6,miner:2});buy('buildings','mine');buy('buildings','workshop');
 stock('minerals',275);buy('workshop','mineralHoes');
 milestone('earned-mining-and-workshop');

 jobs({farmer:5,scholar:3});stock('science',100);
 jobs({farmer:5,miner:3});buy('workshop','mineralAxes');
 jobs({farmer:5,scholar:3});buy('science','archery');buy('science','animal');buy('science','metal');
 jobs({farmer:5,miner:3});buy('buildings','smelter');
 jobs({farmer:5,woodcutter:2,miner:1});stock('iron',25);
 jobs({farmer:5,scholar:3});buy('workshop','ironHoes');
 jobs({farmer:4,woodcutter:2,miner:2});stock('iron',50);
 jobs({farmer:4,scholar:4});buy('workshop','ironAxes');buy('science','construction');
 milestone('all-seven-research');

 // Stock construction materials with workers; workshop crafts pay full costs.
 jobs({farmer:4,woodcutter:2,miner:2});
 stock('iron',50);act('toggle','smelter'); // Preserve timber/stone after earning the mill's iron.
 buy('buildings','logHouse');until(()=>view().bears.value===9,'log house arrival');
 jobs({farmer:5,woodcutter:2,miner:2});
 for(let i=0;i<2;i++){stock('wood',175);act('craft','beam');}
 for(let i=0;i<2;i++){stock('minerals',250);act('craft','slab');}
 buy('buildings','warehouse');buy('buildings','lumberMill');
 jobs({farmer:5,scholar:4});buy('workshop','advancedRefinement',{honeyReserve:2000});
 // Confirm the purchased refinement actually performs an ordinary paid action.
 const beforeWood=resource('wood').value,beforeHoney=resource('honey').value;
 assert.ok(beforeWood+1<=resource('wood').max,'Keep room for the refinement output');
 act('refine','wood');
 assert.equal(resource('honey').value,beforeHoney-50,'Advanced refinement charges its baseline 50 honey');
 assert.equal(resource('wood').value,beforeWood+1,'Advanced refinement earns one wood');
 milestone('construction-buildings-and-tools');

 jobs({farmer:8,hunter:1});stock('manpower',100);act('hunt','hunt');
 jobs({farmer:9});stock('honey',5000);
 const beforeSurvivalYear=view().calendar.year;
 tick(800); // Four whole seasons, at five ticks/second, no fast calendar path.
 assert.equal(view().calendar.year,beforeSurvivalYear+1,'Final settlement survives a complete seasonal cycle');
 milestone('stable-seasonal-settlement');
 check();
 const final=view();
 for(const id of RESEARCH)assert.equal(card('science',id).completed,true,`Earned research ${id}`);
 for(const id of UPGRADES)assert.equal(card('workshop',id).completed,true,`Earned upgrade ${id}`);
 for(const id of CONSTRUCTION)assert.ok(card('buildings',id).owned>=1,`Earned building ${id}`);
 assert.equal(final.stats.totalGathered,10,'Only the ten initial manual gathers were used');
 assert.equal(final.stats.totalDeaths,0);
 assert.equal(final.ticks,simulatedSeconds*5,'Every simulated second uses ordinary five-Hz ticks');
 const finalSave=game.export();
 const cpu=process.cpuUsage(cpuStarted);
 const report={
  seed,target:engine.target??'explicit engine',scope:'Earned chapter-one reachability and survival, not human-play pacing validation',
  simulationSeconds:simulatedSeconds,simulationHours:simulatedSeconds/3600,
  cpuSeconds:(cpu.user+cpu.system)/1e6,wallSeconds:(performance.now()-started)/1000,
  actionCalls:calls.length-tickCalls,tickCalls,totalTicks:final.ticks,manualGathers:final.stats.totalGathered,
  deaths:final.stats.totalDeaths,finalBears:final.bears.value,minimumObservedHoney,
  research:final.science.filter(x=>x.completed).map(x=>x.id),upgrades:final.workshop.filter(x=>x.completed).map(x=>x.id),
  buildings:Object.fromEntries(final.buildings.filter(x=>x.owned).map(x=>[x.id,x.owned])),
  finalSaveSha256:createHash('sha256').update(finalSave).digest('hex'),
  callsSha256:createHash('sha256').update(JSON.stringify(calls)).digest('hex'),milestones,
 };
 return {game,finalSave,report,calls,now};
}

if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
 const args=process.argv.slice(2),source=args.includes('--source');
 const value=key=>args.includes(key)?args[args.indexOf(key)+1]:undefined;
 const engine=await loadForestEngine({root:value('--checkout')?resolve(value('--checkout')):checkout,source});
 const result=runEarnedForestCampaign(engine,{seed:Number(value('--seed')??17),onMilestone:point=>console.error(`${point.id}: ${point.simulatedSeconds}s simulated, ${point.bears} bears, ${point.deaths} deaths`)});
 result.report.rejectedFutureActions=assertFutureActionsAreAtomic(result.game);
 if(value('--report'))writeFileSync(resolve(value('--report')),JSON.stringify(result.report,null,2)+'\n');
 if(value('--save'))writeFileSync(resolve(value('--save')),result.finalSave);
 if(value('--calls'))writeFileSync(resolve(value('--calls')),result.calls.map(call=>JSON.stringify(call)).join('\n')+'\n');
 console.log(JSON.stringify(result.report,null,2));
}
