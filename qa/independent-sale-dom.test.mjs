/** Sale contracts through actual rendered detail controls and main.js confirmations. */
import test from 'node:test';
import assert from 'node:assert/strict';
import {createTab,sharedStorage,clickRendered,renderedButton} from './dom-harness.mjs';
const go=async(tab,hash)=>{tab.location.hash='#'+hash;await tab.windowEvent('hashchange');};
const open=async(tab,section,id)=>clickRendered(tab,{detail:`${section}:${id}`});
const resource=(tab,id)=>tab.snapshot().resources.find(r=>r.id===id).value;
const saved=storage=>JSON.parse([...storage.values].find(([key])=>key.includes('beargame.save'))[1]);
const close=(actual,expected)=>assert.ok(Math.abs(actual-expected)<1e-8,`${actual} != ${expected}`);

test('worship detail sells one or max only after confirmation, and max retains the stated first level',async()=>{
  const storage=sharedStorage(s=>{s.ironWill=false;s.science.theology=true;s.buildings.temple=100;s.religion={transcendence:1,solarchant:3};});
  const tab=await createTab(storage);await go(tab,'more/faith');await open(tab,'faith','solarchant');
  let button=renderedButton(tab,{act:'sellFaith',id:'solarchant'},'#dialog-root');assert.equal(button.dataset.amount,undefined);assert.match(button.dataset.confirm,/至少保留一级/);
  await clickRendered(tab,{act:'sellFaith',id:'solarchant'},'#dialog-root');assert.equal(tab.snapshot().progression.faithCards.find(c=>c.id==='solarchant').owned,3);assert.equal(resource(tab,'faith'),0);
  await clickRendered(tab,{command:'cancel'},'#dialog-root');assert.equal(saved(storage).religion.solarchant,3);
  await open(tab,'faith','solarchant');await clickRendered(tab,{act:'sellFaith',id:'solarchant'},'#dialog-root');await clickRendered(tab,{command:'confirm'},'#dialog-root');
  assert.equal(saved(storage).religion.solarchant,2);close(resource(tab,'faith'),312.5);
  await open(tab,'faith','solarchant');button=renderedButton(tab,{act:'sellFaith',id:'solarchant',amount:'max'},'#dialog-root');assert.equal(button.text,'出售至一级');assert.match(button.dataset.confirm,/保留一级/);
  await clickRendered(tab,{act:'sellFaith',id:'solarchant',amount:'max'},'#dialog-root');await clickRendered(tab,{command:'confirm'},'#dialog-root');
  assert.equal(saved(storage).religion.solarchant,1);close(resource(tab,'faith'),437.5);
  await open(tab,'faith','solarchant');assert.equal(renderedButton(tab,{act:'sellFaith',id:'solarchant'},'#dialog-root').attrs['aria-disabled'],'true');
  await clickRendered(tab,{act:'sellFaith',id:'solarchant'},'#dialog-root');assert.equal(saved(storage).religion.solarchant,1);close(resource(tab,'faith'),437.5);assert.doesNotMatch(tab.doc.node('#dialog-root').innerHTML,/data-command="confirm"/);
});

test('planetary detail cancellation is atomic; one and all sales use the correct quantities and exclude fuel refunds',async()=>{
  const storage=sharedStorage(s=>{s.ironWill=false;s.space.sattelite=3;s.resources.oil=19;});const tab=await createTab(storage);await go(tab,'more/space');await open(tab,'space','sattelite');
  const control=renderedButton(tab,{act:'sellSpace',id:'sattelite'},'#dialog-root');assert.equal(control.dataset.amount,undefined);assert.match(control.dataset.confirm,/油类与钍不返还/);
  await clickRendered(tab,{act:'sellSpace',id:'sattelite'},'#dialog-root');await clickRendered(tab,{command:'cancel'},'#dialog-root');assert.equal(saved(storage).space.sattelite,3);assert.equal(resource(tab,'starchart'),0);
  await open(tab,'space','sattelite');await clickRendered(tab,{act:'sellSpace',id:'sattelite'},'#dialog-root');await clickRendered(tab,{command:'confirm'},'#dialog-root');
  assert.equal(saved(storage).space.sattelite,2);close(resource(tab,'starchart'),162.5*1.08**2);assert.equal(resource(tab,'oil'),19);
  await open(tab,'space','sattelite');assert.equal(renderedButton(tab,{act:'sellSpace',id:'sattelite',amount:'max'},'#dialog-root').text,'出售全部');
  await clickRendered(tab,{act:'sellSpace',id:'sattelite',amount:'max'},'#dialog-root');await clickRendered(tab,{command:'confirm'},'#dialog-root');
  assert.equal(saved(storage).space.sattelite,0);close(resource(tab,'starchart'),162.5*(1+1.08+1.08**2));assert.equal(resource(tab,'oil'),19);
});

test('mission, research, pact, mythic and transcendence details expose no worship or planet sale controls',async()=>{
  const tab=await createTab(sharedStorage(s=>{s.ironWill=false;s.science.calendar=true;s.religion={transcendence:1,pactOfCleansing:1,unicornTomb:1,blackObelisk:1};s.space.orbitalLaunch=1;}));
  for(const [page,section,id]of [['more/space','space','orbitalLaunch'],['research','science','calendar'],['more/faith','faith','transcendence'],['more/faith','faith','pactOfCleansing'],['more/faith','faith','unicornTomb'],['more/faith','faith','blackObelisk']]){
    await go(tab,page);await open(tab,section,id);assert.doesNotMatch(tab.doc.node('#dialog-root').innerHTML,/data-act="sellFaith"|data-act="sellSpace"/,id);await clickRendered(tab,{command:'close'},'#dialog-root');
  }
});

test('confirmed worship sale is final with no undo control and stale undo cannot reclaim the ranks',async()=>{
  const storage=sharedStorage(s=>{s.ironWill=false;s.buildings.temple=100;s.religion={transcendence:1,solarchant:3};});const tab=await createTab(storage);await go(tab,'more/faith');await open(tab,'faith','solarchant');
  await clickRendered(tab,{act:'sellFaith',id:'solarchant',amount:'max'},'#dialog-root');await clickRendered(tab,{command:'confirm'},'#dialog-root');assert.equal(saved(storage).religion.solarchant,1);close(resource(tab,'faith'),437.5);
  assert.equal(tab.snapshot().undo.pending,false);assert.equal(tab.snapshot().undo.available,false);assert.throws(()=>renderedButton(tab,{act:'undo'}),/Actual rendered control missing/);
  const checkpoint=saved(storage);await tab.click({act:'undo'});assert.deepEqual(saved(storage),checkpoint);assert.equal(saved(storage).religion.solarchant,1);close(resource(tab,'faith'),437.5);
});
