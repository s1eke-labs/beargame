/** Real main.js handlers, driven only by buttons present in its current rendered HTML. No browser layout. */
import test from 'node:test';
import assert from 'node:assert/strict';
import {createTab,sharedStorage,clickRendered,renderedButton,now,advance} from './dom-harness.mjs';
const go=async(tab,hash)=>{tab.location.hash='#'+hash;await tab.windowEvent('hashchange');};
const html=tab=>tab.doc.node('#main-content').innerHTML;
const resource=(tab,id)=>tab.snapshot().resources.find(r=>r.id===id).value;
const saved=storage=>JSON.parse([...storage.values].find(([key])=>key.includes('beargame.save'))[1]);

test('each actual stage control requires confirmation; cancel preserves old buildings and accept sells all',async()=>{
  const gates={pasture:'ecology',aqueduct:'robotics',library:'electronics',amphitheatre:'electronics',warehouse:'advExogeology'};
  for(const [id,research]of Object.entries(gates)){
    const storage=sharedStorage(s=>{s.ironWill=false;s.buildings[id]=3;s.science[research]=true;});
    const tab=await createTab(storage);await go(tab,'build');
    const control=renderedButton(tab,{act:'stage',id});assert.ok(control.dataset.confirm.includes('3'));
    await clickRendered(tab,{act:'stage',id});assert.equal(tab.snapshot().buildings.find(d=>d.id===id).owned,3);
    await clickRendered(tab,{command:'cancel'},'#dialog-root');assert.equal(tab.snapshot().buildings.find(d=>d.id===id).owned,3);
    await clickRendered(tab,{act:'stage',id});await clickRendered(tab,{command:'confirm'},'#dialog-root');
    assert.equal(tab.snapshot().buildings.find(d=>d.id===id).owned,0);assert.equal(saved(storage).buildingStages[id],1);
    assert.equal(tab.doc.node('#app').inert,false);
  }
});

test('actual leadership pagination and filter can appoint and promote the final bear in a thousand-bear village',async()=>{
  const storage=sharedStorage(s=>{s.ironWill=false;s.workshop.register=true;s.resources.gold=100;s.resources.honey=1e6;s.buildings.hut=500;s.bears=Array.from({length:1000},(_,i)=>({id:i+1,name:`名单熊 ${i+1}`,job:null,trait:'none',rank:0,experience:500,skills:{}}));s.nextBearId=1001;});
  const tab=await createTab(storage);await go(tab,'village');
  assert.equal((html(tab).match(/data-act="leader"/g)||[]).length,25);
  await clickRendered(tab,{leaderPage:1});assert.ok(renderedButton(tab,{act:'leader',id:26}));
  tab.doc.node('#leadership-filter').value='名单熊 1000';await clickRendered(tab,{command:'leadership-search'});
  assert.equal((html(tab).match(/data-act="leader"/g)||[]).length,1);
  await clickRendered(tab,{act:'leader',id:1000});assert.equal(tab.snapshot().leadership.leaderId,1000);
  await clickRendered(tab,{act:'promote',id:1000});assert.equal(tab.snapshot().leadership.leader.rank,1);assert.equal(resource(tab,'gold'),75);
});

test('actual queue controls enqueue without spending and only clear after confirmation',async()=>{
  const tab=await createTab(sharedStorage(s=>{s.resources.honey=100;}));await go(tab,'build');
  await clickRendered(tab,{act:'queueEnqueue',id:'build:hive'});assert.equal(tab.snapshot().queue.used,1);assert.equal(resource(tab,'honey'),100);
  await clickRendered(tab,{act:'queueClear',id:'confirm'});await clickRendered(tab,{command:'cancel'},'#dialog-root');assert.equal(tab.snapshot().queue.used,1);
  await clickRendered(tab,{act:'queueClear',id:'confirm'});await clickRendered(tab,{command:'confirm'},'#dialog-root');assert.equal(tab.snapshot().queue.used,0);assert.equal(resource(tab,'honey'),100);
});

test('actual engineer controls bind an existing engineer and release its recipe without firing the bear',async()=>{
  const tab=await createTab(sharedStorage(s=>{s.ironWill=false;s.science.mechanization=true;s.buildings.factory=1;s.buildings.workshop=1;s.bears=[{id:1,name:'工程熊',job:'engineer',engineerSpecialty:null,rank:1,experience:0,skills:{}}];s.nextBearId=2;}));
  await go(tab,'more/crafts');await clickRendered(tab,{recipeChoice:'beam'});assert.match(html(tab),/data-fold="engineering-beam"/);assert.doesNotMatch(html(tab),/data-act="engineerAssign" data-id="slab"/);await clickRendered(tab,{act:'engineerAssign',id:'beam'});
  assert.equal(tab.snapshot().engineers.assigned,1);assert.equal(tab.snapshot().bears.individuals[0].engineerSpecialty,'beam');
  await clickRendered(tab,{act:'engineerUnassign',id:'beam'});assert.equal(tab.snapshot().engineers.assigned,0);assert.equal(tab.snapshot().bears.individuals[0].job,'engineer');
});

test('actual multi-challenge selector postpones reset until explicit start confirmation',async()=>{
  const storage=sharedStorage(s=>{s.ironWill=false;s.metaphysics.adjustmentBureau=true;s.resources.honey=123;});const tab=await createTab(storage);await go(tab,'more/challenges');
  await clickRendered(tab,{act:'challengeSelect',id:'winterIsComing'});await clickRendered(tab,{act:'challengeSelect',id:'anarchy'});assert.equal(resource(tab,'honey'),123);
  await clickRendered(tab,{act:'challengeStart',id:'confirm'});await clickRendered(tab,{command:'cancel'},'#dialog-root');assert.equal(resource(tab,'honey'),123);
  await clickRendered(tab,{act:'challengeStart',id:'confirm'});await clickRendered(tab,{command:'confirm'},'#dialog-root');
  assert.deepEqual(saved(storage).activeChallenges,['winterIsComing','anarchy']);assert.equal(resource(tab,'honey'),0);
});

test('actual time-jump control keeps its progress dialog and persisted checkpoint locked until settlement ends',async()=>{
  const storage=sharedStorage(s=>{s.ironWill=false;s.science.chronophysics=true;s.resources.timeCrystal=100;s.resources.honey=123;});const tab=await createTab(storage);await go(tab,'more/challenges');
  await clickRendered(tab,{act:'shatter',id:'year'});assert.equal(tab.snapshot().catchingUp,true);assert.match(tab.doc.node('#dialog-root').innerHTML,/正在计算时光变化/);
  const checkpoint=saved(storage);assert.equal(checkpoint.calendar.year,0);const honey=resource(tab,'honey');
  await tab.click({act:'gather',id:'honey'});assert.equal(resource(tab,'honey'),honey);await tab.click({command:'close'});await tab.event('keydown',{key:'Escape',preventDefault(){}});
  assert.match(tab.doc.node('#dialog-root').innerHTML,/正在计算时光变化/);await tab.windowEvent('pagehide');assert.deepEqual(saved(storage),checkpoint);
  await go(tab,'build');assert.match(tab.doc.node('#dialog-root').innerHTML,/正在计算时光变化/);await tab.drain();
  assert.equal(tab.snapshot().catchingUp,false);assert.equal(tab.snapshot().pendingOperation,null);assert.equal(saved(storage).calendar.year,1);assert.equal(saved(storage).savedAt,now());assert.equal(tab.doc.node('#app').inert,false);
});

test('ordinary paid builds commit directly with no undo banner or countdown',async()=>{
  const storage=sharedStorage(s=>{s.resources.honey=100;});const tab=await createTab(storage);await go(tab,'build');
  const control=renderedButton(tab,{act:'build',id:'hive'});assert.ok(!control.dataset.confirm);
  await clickRendered(tab,{act:'build',id:'hive'});assert.equal(resource(tab,'honey'),90);assert.equal(tab.snapshot().buildings.find(d=>d.id==='hive').owned,1);
  assert.equal(tab.snapshot().undo.pending,false);assert.equal(tab.snapshot().undo.available,false);
  assert.equal(tab.doc.node('#dialog-root').innerHTML,'');assert.doesNotMatch(html(tab),/data-act="undo"|undo-banner|undo-countdown/);
  assert.throws(()=>renderedButton(tab,{act:'undo'}),/Actual rendered control missing/);
  const checkpoint=saved(storage);await tab.click({act:'undo'});assert.equal(resource(tab,'honey'),90);assert.equal(tab.snapshot().buildings.find(d=>d.id==='hive').owned,1);assert.deepEqual(saved(storage),checkpoint);
  assert.equal(checkpoint.resources.honey,90);assert.equal(checkpoint.buildings.hive,1);
});

test('paused UI has no undo countdown before or after the former twenty-second boundary',async()=>{
  const tab=await createTab(sharedStorage(s=>{s.resources.honey=100;s.settings.paused=true;}));await go(tab,'build');await clickRendered(tab,{act:'build',id:'hive'});
  for(const elapsed of [0,19800,200]){
    advance(elapsed);tab.step();assert.equal(tab.snapshot().undo.pending,false);assert.equal(tab.snapshot().undo.available,false);assert.equal(tab.snapshot().undo.remainingTicks,0);assert.equal(tab.snapshot().undo.remainingSeconds,0);
    assert.doesNotMatch(html(tab),/data-act="undo"|undo-banner|undo-countdown/);await tab.click({act:'undo'});assert.equal(tab.snapshot().buildings.find(d=>d.id==='hive').owned,1);assert.equal(resource(tab,'honey'),90);
  }
});

test('losing ownership preserves the committed build and forbids stale undo or checkpoint writes',async()=>{
  const storage=sharedStorage(s=>{s.resources.honey=100;});const tab=await createTab(storage);await go(tab,'build');await clickRendered(tab,{act:'build',id:'hive'});
  assert.equal(tab.snapshot().undo.pending,false);const checkpoint=saved(storage);
  storage.setItem('honeywood-active-tab-v1',JSON.stringify({id:'new-owner',until:now()+7000}));await tab.windowEvent('storage',{key:'honeywood-active-tab-v1'});
  assert.match(html(tab),/本页暂时只读/);assert.throws(()=>renderedButton(tab,{act:'undo'}),/Actual rendered control missing/);
  await tab.click({act:'undo'});await tab.windowEvent('pagehide');assert.equal(resource(tab,'honey'),90);assert.equal(tab.snapshot().buildings.find(d=>d.id==='hive').owned,1);assert.deepEqual(saved(storage),checkpoint);
});

test('time settlement rejects stale undo without reverting the committed build',async()=>{
  const storage=sharedStorage(s=>{s.resources.honey=100;s.resources.timeCrystal=100;s.science.chronophysics=true;});const tab=await createTab(storage);await go(tab,'build');await clickRendered(tab,{act:'build',id:'hive'});assert.equal(tab.snapshot().undo.pending,false);
  await go(tab,'more/challenges');await clickRendered(tab,{act:'shatter',id:'year'});assert.equal(tab.snapshot().catchingUp,true);
  const owned=tab.snapshot().buildings.find(d=>d.id==='hive').owned;await tab.click({act:'undo'});assert.equal(tab.snapshot().buildings.find(d=>d.id==='hive').owned,owned);assert.equal(saved(storage).calendar.year,0);
  await tab.drain();assert.equal(tab.snapshot().catchingUp,false);assert.equal(saved(storage).calendar.year,1);
});

test('return-from-hidden offline settlement blocks undo and preserves its pre-settlement checkpoint',async()=>{
  const storage=sharedStorage(s=>{s.resources.honey=100;s.settings.offline=true;});const tab=await createTab(storage);await go(tab,'build');await clickRendered(tab,{act:'build',id:'hive'});assert.equal(tab.snapshot().undo.pending,false);
  tab.doc.hidden=true;await tab.event('visibilitychange');const checkpoint=saved(storage);advance(60000);tab.doc.hidden=false;await tab.event('visibilitychange');
  assert.equal(tab.snapshot().catchingUp,true);await tab.click({act:'undo'});await tab.windowEvent('pagehide');assert.deepEqual(saved(storage),checkpoint);assert.equal(tab.snapshot().buildings.find(d=>d.id==='hive').owned,1);
  await tab.drain();assert.equal(tab.snapshot().catchingUp,false);assert.equal(tab.snapshot().undo.pending,false);assert.equal(saved(storage).buildings.hive,1);assert.equal(saved(storage).savedAt,now());
});

test('actual achievement route reveals an earned action badge while keeping secrets and service limits honest',async()=>{
  const tab=await createTab(sharedStorage(s=>{s.ironWill=false;s.science.mechanization=true;s.buildings.factory=1;s.bears=[{id:1,name:'工匠',job:'engineer',rank:1,experience:0,skills:{}}];s.nextBearId=2;}));
  await go(tab,'more/crafts');await clickRendered(tab,{act:'engineerAssign',id:'wood'});assert.equal(tab.snapshot().badges.find(b=>b.id==='woodSpecialist').unlocked,true);
  await go(tab,'more/achievements');assert.match(html(tab),/木屑围裙/);assert.match(html(tab),/未揭晓/);assert.match(html(tab),/未连接公告服务/);assert.match(html(tab),/未连接错误报告服务/);
  assert.doesNotMatch(html(tab),/旧冬日的蜜封|旧册中的青林印|先走进时光/);
  assert.equal(tab.snapshot().achievements.catalogueTotal,31);assert.equal(tab.snapshot().badgeTotals.catalogueTotal,21);
});
