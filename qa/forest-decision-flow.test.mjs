import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
import {resolve} from 'node:path';
import {createGame} from '../src/chapters/forest/engine.js';
import {forestStages,stableResources,decisionState} from '../src/chapters/forest/main.js';

test('森林成长阶段按实际成果推进，安全建议不成为游戏条件',()=>{
 const snapshot=createGame().snapshot();
 assert.deepEqual(forestStages(snapshot).map(s=>s.done),[false,false,false,false]);
 snapshot.buildings.find(c=>c.id==='hive').owned=1;
 snapshot.bears.value=1;
 assert.deepEqual(forestStages(snapshot).map(s=>s.done),[true,true,false,false]);
 snapshot.buildings.find(c=>c.id==='library').owned=1;
 snapshot.science.find(c=>c.id==='agriculture').completed=true;
 assert.equal(forestStages(snapshot)[2].done,true);
 for(const id of ['logHouse','warehouse','lumberMill'])snapshot.buildings.find(c=>c.id===id).owned=1;
 assert.equal(forestStages(snapshot)[3].done,false);
 snapshot.science.find(c=>c.id==='construction').completed=true;
 assert.equal(forestStages(snapshot)[3].done,true);
});

test('固定资源始终保留口粮且不会因为缺少显示资源或重复固定挤出槽位',()=>{
 const snapshot=createGame().snapshot();
 for(const r of snapshot.resources)r.visible=true;
 assert.deepEqual(stableResources(snapshot).map(r=>r.id),['honey','wood','science']);
 assert.deepEqual(stableResources(snapshot,['science','minerals']).map(r=>r.id),['honey','science','minerals']);
 assert.deepEqual(stableResources(snapshot,['honey','science']).map(r=>r.id),['honey','science','wood']);
 assert.deepEqual(stableResources(snapshot,['missing']).map(r=>r.id),['honey','wood','science']);
});

test('决策状态区别等待资源与容量阻塞，不把可见项目误报为能完成',()=>{
 const snapshot=createGame().snapshot(),capacity=snapshot.resources.find(r=>r.id==='wood').max;
 assert.equal(decisionState({available:false,costs:[{id:'wood',value:capacity+1}]},snapshot).kind,'blocked');
 assert.equal(decisionState({available:false,costs:[{id:'wood',value:1}]},snapshot).kind,'waiting');
 assert.equal(decisionState({available:true,costs:[]},snapshot).kind,'ready');
 assert.equal(decisionState({completed:true},snapshot).kind,'done');
});

// 使用真实控制器处理点击与返回；绘制替身只记录定位选择器和滚动结果。
const root=resolve(import.meta.dirname,'..');
const source=(await readFile(resolve(root,'src/chapters/forest/main.js'),'utf8'))
 .replaceAll("from './engine.js'",`from '${pathToFileURL(resolve(root,'src/chapters/forest/engine.js'))}'`)
 .replaceAll("from './art.js'",`from '${pathToFileURL(resolve(root,'src/chapters/forest/art.js'))}'`)
 .replace(/if\(typeof document!==.*?boot\(\);\s*$/,'')+`
export const fixture={
 init(snapshot){vm=snapshot;settings={pinned:[]};ui.page='research';ui.region='village';ui.buildChoice='hive';ui.queuePage=0;ui.researchTab='science';ui.researchQuery='农事';ui.researchReady=true;ui.returnContext=null;ui.pendingTarget=null;ui.pageScrolls={};dialog={kind:'resources',resource:'science'};dialogHistory=false;app={querySelector(){return null;}};closeDialog=()=>{dialog=null;};render=()=>{};openDialog=(kind,title,data)=>{dialog={kind,title,...data};};},
 click(data){onClick({target:{closest:()=>({dataset:data})}});}, readHash,rememberPage,restorePage,returnToTask,
 setPage(page){ui.page=page;},select(options){Object.assign(ui,options);},
 view:()=>({page:ui.page,query:ui.researchQuery,ready:ui.researchReady,target:ui.pendingTarget,origin:ui.returnContext,dialog,scrolls:ui.pageScrolls}),
};`;
const {fixture}=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));

test('从研究成本进入岗位后可返回原筛选、滚动与资源详情',()=>{
 let hash='#research',top=420;
 globalThis.location={get hash(){return hash;},set hash(value){hash=value.startsWith('#')?value:'#'+value;}};
 globalThis.window={get scrollY(){return top;},scrollTo({top:value}){top=value;}};
 globalThis.history={pushState(_state,_title,url){hash=url;}};
 try{
  const snapshot=createGame().snapshot();snapshot.science[0].unlocked=true;fixture.init(snapshot);
  fixture.click({nav:'village',flow:'true',jobTarget:'scholar'});
  assert.equal(hash,'#village');
  assert.equal(fixture.view().target,'[data-job-card="scholar"]');
  assert.equal(fixture.view().origin.researchQuery,'农事');
  assert.equal(fixture.view().origin.scroll,420);
  fixture.readHash();top=780;
  fixture.returnToTask();
  assert.equal(hash,'#research');
  assert.equal(fixture.view().query,'农事');
  assert.equal(fixture.view().ready,true);
  assert.equal(top,420);
  assert.equal(fixture.view().dialog.resource,'science');
  assert.equal(fixture.view().origin,null);
 }finally{delete globalThis.location;delete globalThis.window;delete globalThis.history;}
});

test('目标研究导航清除旧筛选并保留明确项目定位',()=>{
 let hash='#research';
 globalThis.location={get hash(){return hash;},set hash(value){hash=value.startsWith('#')?value:'#'+value;}};
 globalThis.window={scrollY:0,scrollTo(){}};
 try{
  fixture.init(createGame().snapshot());
  fixture.click({nav:'research',flow:'true',researchChoice:'workshop',researchTarget:'ironAxes'});
  assert.equal(fixture.view().query,'');assert.equal(fixture.view().ready,false);
  // 同页导航立即消费定位，因此不存在残留的下一页焦点请求。
  assert.equal(fixture.view().target,null);
  assert.equal(fixture.view().origin.researchQuery,'农事');
 }finally{delete globalThis.location;delete globalThis.window;}
});

test('队列成本的资源补给流程返回建造队列而不是家园',()=>{
 let hash='#build/queue';
 globalThis.location={get hash(){return hash;},set hash(value){hash=value.startsWith('#')?value:'#'+value;}};
 globalThis.window={scrollY:180,scrollTo(){}};
 globalThis.history={pushState(_state,_title,url){hash=url;}};
 try{
  fixture.init(createGame().snapshot());fixture.setPage('queue');
  fixture.click({nav:'village',flow:'true',jobTarget:'woodcutter'});fixture.readHash();
  fixture.returnToTask();assert.equal(hash,'#build/queue');assert.equal(fixture.view().page,'queue');
  assert.equal(fixture.view().dialog.resource,'science');
 }finally{delete globalThis.location;delete globalThis.window;delete globalThis.history;}
});

test('岗位与工坊列表滚动不受其他页面的建筑和研究选择影响',()=>{
 let top=380;
 globalThis.window={get scrollY(){return top;},scrollTo({top:value}){top=value;}};
 try{
  fixture.init(createGame().snapshot());fixture.setPage('village');fixture.rememberPage();
  fixture.select({page:'build',buildChoice:'warehouse',researchTab:'workshop',region:'woodland',queuePage:2});top=90;fixture.rememberPage();
  fixture.setPage('village');fixture.restorePage();assert.equal(top,380);
  fixture.setPage('crafts');top=270;fixture.rememberPage();
  fixture.select({page:'research',researchTab:'science',buildChoice:'hut',queuePage:0});top=30;fixture.rememberPage();
  fixture.setPage('crafts');fixture.restorePage();assert.equal(top,270);
 }finally{delete globalThis.window;}
});

test('研究分类和队列页各自记忆位置而不共用一次滚动',()=>{
 let top=180;
 globalThis.window={get scrollY(){return top;},scrollTo({top:value}){top=value;}};
 try{
  fixture.init(createGame().snapshot());
  fixture.click({researchTab:'workshop'});assert.equal(top,0);top=420;
  fixture.select({buildChoice:'warehouse'});fixture.click({researchTab:'science'});assert.equal(top,180);
  fixture.click({researchTab:'workshop'});assert.equal(top,420);
  fixture.select({page:'queue',queuePage:0});top=250;
  fixture.click({queuePage:'1'});assert.equal(top,0);top=70;
  fixture.select({researchTab:'science'});fixture.click({queuePage:'0'});assert.equal(top,250);
  fixture.click({queuePage:'1'});assert.equal(top,70);
 }finally{delete globalThis.window;}
});
