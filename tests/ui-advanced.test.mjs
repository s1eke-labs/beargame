import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createGame,catalog} from '../src/engine/index.js';
import {createState,serialize} from '../src/engine/save.js';
import {page,helpDialog,actionCard,detailDialog,cardsFor,sceneGroups} from '../src/ui/render.js';
import {queuePanel,engineeringPanel,leadershipPanel} from '../src/ui/advanced.js';
const ui=(page='home',system='')=>({page,system,buildFilter:'all',researchTab:'science'});
function gameWith(edit){const s=createState(47,0);edit(s);return createGame({storage:null,save:serialize(s,0),now:0});}
test('UI renders bounded leadership pages from the engine paginator, with all residents reachable',()=>{
 const g=gameWith(s=>{s.workshop.register=true;s.nextBearId=1201;s.bears=Array.from({length:1200},(_,i)=>({id:i+1,name:`伙伴${i+1}`,job:null,rank:0,experience:1000,skills:{},trait:'none'}));});
 const vm=g.snapshot();let html=leadershipPanel(vm);assert.equal((html.match(/data-act="leader"/g)||[]).length,25);assert.equal((html.match(/data-act="promote"/g)||[]).length,25);assert.match(html,/共 1,200 只/);
 vm.leadership=g.getLeadership({page:47,pageSize:25});html=leadershipPanel(vm);assert.match(html,/伙伴1200/);assert.doesNotMatch(html,/data-id="1"/);
 vm.leadership=g.getLeadership({page:0,pageSize:25,filter:'伙伴1200'});assert.equal((leadershipPanel(vm).match(/data-act="promote"/g)||[]).length,1);
});
test('large imported queues and source catalogs are paginated instead of fully rendered',()=>{
 const vm=createGame({storage:null,now:0}).snapshot(),base=vm.queue.options[0];
 vm.queue={...vm.queue,items:Array.from({length:400},(_,i)=>({index:i,id:'hive',type:'build',name:`排队${i}`,amount:1,costs:[],available:false})),options:Array.from({length:400},(_,i)=>({...base,id:`build:test${i}`,name:`候选${i}`}))};
 const html=queuePanel(vm,{queuePage:1,queueItemPage:1});assert.equal((html.match(/data-act="queueRemove"/g)||[]).length,25);assert.equal((html.match(/data-act="queueEnqueue"/g)||[]).length,12);assert.match(html,/data-id="25"/);assert.match(html,/候选12/);assert.doesNotMatch(html,/候选399/);
});
test('stage and policy confirmations remain supplied by the engine',()=>{
 const vm=createGame({storage:null,now:0}).snapshot();assert.equal(vm.buildingStages.length,5);
 for(const c of vm.buildingStages){if(!c.unlocked)assert.equal(actionCard(c,'buildingStages'),'');assert.match(actionCard({...c,unlocked:true},'buildingStages'),/data-confirm="[^\"]+"/);}
 const hidden=page(vm,{...ui('research'),researchTab:'policies'});assert.doesNotMatch(hidden,/data-act="policy"/);const advanced=gameWith(s=>{for(const t of catalog.science)s.science[t.id]=true;}).snapshot();const policies=page(advanced,{...ui('research'),researchTab:'policies'});assert.match(policies,/data-research-tab="policies"/);assert.equal((policies.match(/data-act="policy"/g)||[]).length,advanced.policies.filter(c=>c.unlocked&&!c.completed).length);
});
test('building selling exposes one and all with confirmations and respects engine sale rejection',()=>{
 const g=gameWith(s=>s.buildings.hive=3),c=g.snapshot().buildings.find(c=>c.id==='hive');
 const html=detailDialog(c,'buildings');assert.equal((html.match(/data-act="sell"/g)||[]).length,2);assert.match(html,/data-amount="max"/);
 const denied=detailDialog({...c,sellable:false,sellReason:'森智不可拆售'},'buildings');assert.match(denied,/data-act="sell"[^>]+aria-disabled="true"/);assert.match(denied,/data-reason="森智不可拆售"/);
});
test('readable help keeps feature boundaries without original-game explanations or links',()=>{
 const html=helpDialog(createGame({storage:null,now:0}).snapshot());for(const text of ['已实现','部分实现或仍需核验','不支持','Beargame'])assert.ok(html.includes(text));assert.doesNotMatch(html,/&quot;implemented&quot;|&quot;partial&quot;|Kittens|kittensgame|原作|原版|参考作品/);
});
test('advanced facilities use generated building art and real owned progress in the forest',()=>{
 const g=gameWith(s=>{for(const b of catalog.buildings)s.buildings[b.id]=1;s.space.orbitalLaunch=1;s.space.spaceElevator=1;s.spaceReached.orbitalLaunch=true;s.time.blastFurnace=1;}),vm=g.snapshot();
 const html=page(vm,ui());assert.match(html,/data-home-region="challenges"/);assert.match(html,/data-home-region="space"/);assert.match(html,/data-detail="buildings:hive"/);assert.ok((html.match(/placed-building/g)||[]).length>0);assert.doesNotMatch(html,/scene-pagination|data-scene-page/);assert.match(page(vm,{...ui(),district:'challenges'}),/data-detail="time:blastFurnace"/);assert.match(page(vm,{...ui(),district:'space'}),/data-detail="space:orbitalLaunch"/);
 for(const section of ['space','time'])assert.match(actionCard(cardsFor(vm,section).find(c=>c.owned>0),section),/semantic-research|semantic-resource/);
});
test('engineer output clipping warning is visible alongside real progress and assignments',()=>{
 const vm=createGame({storage:null,now:0}).snapshot();vm.engineers.cards=vm.engineers.cards.slice(0,1).map(c=>({...c,assigned:1,progress:.4,status:'制作中',outputCapped:true}));
 const html=engineeringPanel(vm);assert.match(html,/aria-valuenow="40"/);assert.match(html,/库存已满/);assert.match(html,/data-act="engineerUnassign"/);
});
test('short-phone layout compacts scene and keeps full-size primary controls',async()=>{
 const css=await readFile(new URL('../src/styles/main.css',import.meta.url),'utf8');assert.match(css,/@media\(max-width:760px\) and \(max-height:740px\)/);assert.match(css,/height:100dvh/);assert.match(css,/--text-emphasis:1rem/);assert.match(css,/gather-button strong,.refine-button strong\{font-size:var\(--text-emphasis\)\}/);assert.match(css,/min-height:56px/);
});
test('achievement page preserves engine secrecy and unavailable-service boundaries',()=>{
 const vm=createGame({storage:null,now:0}).snapshot();vm.achievements={cards:[{id:'earned',name:'第一步',description:'已完成的里程碑',unlocked:true,visible:true,starred:true},{id:'secret',name:'尚未发现',description:'继续探索',unlocked:false,visible:true,secret:true},{id:'hidden',name:'不应露出的标题',description:'不应露出的条件',visible:false}],total:2,unlocked:1,starsTotal:1,starsUnlocked:1};vm.badges=[{id:'external',name:'暂不可达',description:'需要外部服务',reason:'此版本没有账号服务',available:false,visible:true}];vm.badgeTotals={total:1,unlocked:0};
 const html=page(vm,ui('more','achievements'));assert.match(html,/第一步 ★/);assert.match(html,/尚未发现/);assert.match(html,/此版本没有账号服务/);assert.doesNotMatch(html,/不应露出/);assert.doesNotMatch(html.slice(html.indexOf('<section class="achievement-section"')),/data-act=/);
});
test('faith and space sale controls require explicit engine sale capability and preserve separate purchase confirmation',()=>{
 const vm=createGame({storage:null,now:0}).snapshot();
 for(const [section,type] of [['faith','sellFaith'],['space','sellSpace']]){
  const base=cardsFor(vm,section)[0],c={...base,owned:3,sellType:type,sellable:true,sellConfirmationText:'按当前规则返还可退物资。',confirmationText:''};
  const html=detailDialog(c,section);assert.equal((html.match(new RegExp(`data-act="${type}"`,'g'))||[]).length,2);assert.match(html,/data-amount="max"/);assert.match(html,section==='faith'?/保留一级/:/出售全部 3/);assert.match(html,new RegExp(`data-act="${c.type}"[^>]*data-confirm=""`));
  assert.doesNotMatch(detailDialog({...c,sellType:undefined},section),/data-act="sellFaith"|data-act="sellSpace"/);
  assert.match(detailDialog({...c,sellable:false,sellReason:'此时不能出售'},section),new RegExp(`data-act="${type}"[^>]*aria-disabled="true"`));
 }
});
test('actual religion and space cards expose sale controls only for engine-supported families',()=>{
 const base=createGame({storage:null,now:0}).snapshot();const worship=cardsFor(base,'faith').find(c=>c.repeatAfterTranscendence&&c.family==='worship'),facility=cardsFor(base,'space').find(c=>c.family==='building'&&!c.unsupported);
 const g=gameWith(s=>{s.religion[worship.id]=3;s.religion.transcendence=1;s.space[facility.id]=2;});const vm=g.snapshot();
 for(const [section,id,type] of [['faith',worship.id,'sellFaith'],['space',facility.id,'sellSpace']]){const c=cardsFor(vm,section).find(c=>c.id===id);assert.equal(c.sellable,true);assert.equal(c.sellType,type);assert.match(detailDialog(c,section),new RegExp(`data-act="${type}"`));}
 for(const section of ['faith','space'])for(const c of cardsFor(vm,section).filter(c=>!c.sellType))assert.doesNotMatch(detailDialog({...c,owned:1},section),/data-act="sellFaith"|data-act="sellSpace"/);
});
test('Village gifts appear only when the engine supplies a visible real box card',()=>{
 const vm=createGame({storage:null,now:Date.UTC(2026,9,8)}).snapshot();assert.doesNotMatch(page(vm,ui('village')),/data-act="openGift"/);
 const card={id:'elderBox',type:'openGift',name:'远古礼盒',description:'真实库存中的礼盒',visible:true,unlocked:true,available:true,owned:1,costs:[],confirmationText:'拆开 1 个礼盒？'};
 vm.gifts={seasonActive:false,cards:[card]};const html=page(vm,ui('village'));assert.equal((html.match(/data-act="openGift"/g)||[]).length,1);assert.match(html,/data-confirm="拆开 1 个礼盒？"/);assert.match(html,/打开礼盒/);assert.equal(cardsFor(vm,'gifts')[0].id,'elderBox');
 vm.gifts={seasonActive:true,cards:[{...card,visible:false}]};assert.doesNotMatch(page(vm,ui('village')),/data-act="openGift"/);
});
