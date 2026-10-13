/** Seasonal gifting through real startup, rendered village controls and main.js lifecycle gates. */
import test from 'node:test';
import assert from 'node:assert/strict';
import {createTab,sharedStorage,clickRendered,renderedButton,advance,now} from './dom-harness.mjs';
const local=(year,month,day)=>new Date(year,month-1,day,12).getTime();
const setClock=value=>advance(value-now());
const go=async(tab,hash)=>{tab.location.hash='#'+hash;await tab.windowEvent('hashchange');};
const resource=(tab,id)=>tab.snapshot().resources.find(r=>r.id===id).value;
const saved=storage=>JSON.parse([...storage.values].find(([key])=>key.includes('beargame.save'))[1]);

test('actual fresh October village has neither a gift resource nor an open-gift control',async()=>{
  setClock(local(2026,10,8));const tab=await createTab(sharedStorage());await go(tab,'village');
  assert.equal(resource(tab,'elderBox'),0);assert.equal(resource(tab,'wrappingPaper'),0);assert.deepEqual(tab.snapshot().gifts.cards,[]);
  assert.throws(()=>renderedButton(tab,{act:'openGift',id:'elderBox'}),/Actual rendered control missing/);
});

test('real December startup grants one unopened box; January cancel preserves it and confirmation opens exactly one',async()=>{
  setClock(local(2026,12,20));const storage=sharedStorage();const december=await createTab(storage);await go(december,'village');
  assert.equal(resource(december,'elderBox'),1);assert.equal(december.snapshot().gifts.seasonActive,true);assert.deepEqual(december.snapshot().gifts.cards,[]);
  assert.throws(()=>renderedButton(december,{act:'openGift',id:'elderBox'}),/Actual rendered control missing/);await december.windowEvent('pagehide');assert.equal(saved(storage).resources.elderBox,1);
  setClock(local(2027,1,1));const january=await createTab(storage);await go(january,'village');
  assert.equal(january.snapshot().gifts.seasonActive,false);assert.equal(resource(january,'elderBox'),1);
  const control=renderedButton(january,{act:'openGift',id:'elderBox'});assert.match(control.dataset.confirm,/1 个远古礼盒/);
  await clickRendered(january,{act:'openGift',id:'elderBox'});assert.equal(resource(january,'elderBox'),1);await clickRendered(january,{command:'cancel'},'#dialog-root');assert.equal(resource(january,'elderBox'),1);assert.equal(resource(january,'karma'),0);
  await clickRendered(january,{act:'openGift',id:'elderBox'});await clickRendered(january,{command:'confirm'},'#dialog-root');
  assert.equal(resource(january,'elderBox'),0);assert.equal(resource(january,'wrappingPaper'),1);assert.equal(saved(storage).karmaKittens,5000);
  assert.ok(Math.abs(resource(january,'karma')-(Math.sqrt(8001)-1)/2)<1e-10);assert.deepEqual(january.snapshot().gifts.cards,[]);
  await january.click(control.dataset,control.attrs);await clickRendered(january,{command:'confirm'},'#dialog-root');assert.equal(resource(january,'wrappingPaper'),1);assert.equal(saved(storage).karmaKittens,5000);
});

test('a stale gift control cannot consume its box after another tab takes ownership',async()=>{
  setClock(local(2027,1,1));const storage=sharedStorage(s=>{s.resources.elderBox=1;});const tab=await createTab(storage);await go(tab,'village');const control=renderedButton(tab,{act:'openGift',id:'elderBox'});const checkpoint=saved(storage);
  storage.setItem('honeywood-active-tab-v1',JSON.stringify({id:'another-owner',until:now()+7000}));await tab.windowEvent('storage',{key:'honeywood-active-tab-v1'});
  await tab.click(control.dataset,control.attrs);await clickRendered(tab,{command:'confirm'},'#dialog-root');await tab.windowEvent('pagehide');
  assert.equal(resource(tab,'elderBox'),1);assert.equal(resource(tab,'wrappingPaper'),0);assert.deepEqual(saved(storage),checkpoint);
});

test('pending offline and time settlements both reject a previously rendered gift control',async()=>{
  for(const operation of ['offline','time']){
    setClock(local(2027,1,1));const storage=sharedStorage(s=>{s.resources.elderBox=1;s.resources.honey=100;s.buildings.hive=1;s.settings.offline=true;s.science.chronophysics=true;s.resources.timeCrystal=10;});const tab=await createTab(storage);await go(tab,'village');const control=renderedButton(tab,{act:'openGift',id:'elderBox'});
    if(operation==='offline'){tab.doc.hidden=true;await tab.event('visibilitychange');advance(60000);tab.doc.hidden=false;await tab.event('visibilitychange');}
    else {await go(tab,'more/challenges');await clickRendered(tab,{act:'shatter',id:'year'});}
    assert.equal(tab.snapshot().catchingUp,true);const checkpoint=saved(storage);await tab.click(control.dataset,control.attrs);assert.equal(resource(tab,'elderBox'),1);assert.equal(resource(tab,'wrappingPaper'),0);await tab.windowEvent('pagehide');assert.deepEqual(saved(storage),checkpoint);
    await tab.drain();assert.equal(tab.snapshot().catchingUp,false);assert.equal(resource(tab,'elderBox'),1);assert.equal(resource(tab,'wrappingPaper'),0);
  }
});
