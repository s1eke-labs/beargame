import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {sceneWorkers,bearLifeMarkup,bearConversation,activityKey,villageWorkers} from '../src/ui/scene.js';
import {workerStyles} from '../src/ui/worker-outfits.js';
const fixture=(job='woodcutter')=>({bears:{individuals:[{id:1,name:'阿圆',job}],free:job==='idle'?1:0},jobs:[{id:job,name:'伙伴',assigned:1}],settings:{},calendar:{day:1},resources:[{id:workerStyles[job]?.resource||'honey',value:10,max:100,grossRate:1}],engineers:{cards:[]}});
test('every real occupation has a stable small scene moment and optional dialogue',()=>{
 const props=new Set();
 for(const job of [...Object.keys(workerStyles),'idle']){
  const vm=fixture(job),before=JSON.stringify(vm),w=sceneWorkers(vm)[0],markup=bearLifeMarkup(w),chat=bearConversation(vm,1);
  assert.match(markup,new RegExp(`life-${job}`));assert.match(markup,/aria-hidden="true"/);assert.doesNotMatch(markup,/<button|data-act|on\w+=/);
  assert.equal(chat.name,'阿圆');assert.equal(chat.jobId,job);assert.ok(chat.line.length<40);assert.ok(chat.activity.length>0);
  assert.deepEqual(bearConversation(vm,1),chat);assert.equal(JSON.stringify(vm),before);props.add(markup);
 }
 assert.equal(props.size,10);assert.equal(bearConversation(fixture(),999),null);
});
test('paused and settled scenes stop work and resting motion without changing identities',()=>{
 for(const flag of ['paused','readOnly','catchingUp','pendingOffline','pendingOperation','paradox']){
  const vm=fixture(),ui={};
  if(flag==='paused')vm.settings.paused=true;else if(flag==='readOnly')ui.readOnly=true;else if(flag==='paradox')vm.calendar.day=-1;else vm[flag]=true;
  const worker=sceneWorkers(vm,ui)[0];assert.equal(worker.lifeState,'paused');assert.equal(worker.bearId,1);assert.equal(worker.working,false);
  assert.match(bearLifeMarkup(worker),/data-life-state="paused"/);assert.equal(bearConversation(vm,1,ui).activity,'静静等候');
 }
});
test('capacity creates a quiet pause with occupation art intact and no invented need',()=>{
 const vm=fixture('farmer');vm.resources[0].value=100;
 const w=sceneWorkers(vm)[0],chat=bearConversation(vm,1);assert.equal(w.lifeState,'resting');assert.equal(w.atCapacity,true);assert.deepEqual(w.poses,workerStyles.farmer.poses);
 assert.match(chat.status,/库存已满/);assert.match(chat.line,/歇一会儿/);assert.doesNotMatch(chat.line,/需要|饥饿|喂|任务|倒计时/);
});
test('pause changes cache for a resting actor but ordinary stock ticks do not',()=>{
 const vm=fixture('idle'),key=activityKey(vm,{});vm.resources[0].value+=1;assert.equal(activityKey(vm,{}),key);
 vm.settings.paused=true;assert.notEqual(activityKey(vm,{}),key);
});
test('resident decoration keeps representative bounds and stable lot anchors',()=>{
 const vm=fixture();vm.bears.individuals=Array.from({length:3000},(_,i)=>({id:i,name:'伙伴',job:'woodcutter'}));vm.jobs[0].assigned=3000;
 assert.equal(sceneWorkers(vm,{limit:Infinity}).length,1);
 const built=[{id:'lumberMill',sceneSlot:2}],before=villageWorkers(vm,{},built)[0];vm.settings.paused=true;const after=villageWorkers(vm,{},built)[0];
 assert.deepEqual([before.x,before.y,before.z],[after.x,after.y,after.z]);assert.equal(after.count,3000);
});
test('life style moves only decorative descendants and honors reduced motion and hidden scenes',()=>{
 const css=readFileSync(new URL('../src/styles/bear-life.css',import.meta.url),'utf8');
 assert.match(css,/@media\(prefers-reduced-motion:reduce\)/);assert.match(css,/\.scene-hidden \.bear-life/);assert.match(css,/\.motion-reduced \.bear-life/);assert.match(css,/data-life-state="paused"/);
 for(const match of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)){
  const selector=match[1].replace(/\/\*[\s\S]*?\*\//g,'').trim();
  if(selector.split(',').some(s=>/\.scene-worker(?:\s*:has\([^)]*\))?$/.test(s.trim())))assert.doesNotMatch(match[2],/(?:^|;)\s*(transform|translate|left|right|top|bottom|inset|animation)\s*:/);
 }
 assert.doesNotMatch(css,/\.placed-building|\.building-cluster/);
});
