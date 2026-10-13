import test from 'node:test';
import assert from 'node:assert/strict';
import {actionCard,detailDialog,recipePanel} from '../src/ui/render.js';
import {createTab,sharedStorage,clickRendered,renderedButton} from './dom-harness.mjs';
const card={id:'beam',name:'木梁',type:'craft',output:'beam',unlocked:true,available:true,owned:0,costs:[{id:'wood',name:'木材',value:175,owned:600}]};
const confirmFor=(html,query)=>renderedButton({doc:{node:()=>({innerHTML:html})}},query).dataset.confirm;
test('maximum crafting names the count, full cost and overflow risk on both entry points',()=>{
 for(const html of [recipePanel({crafts:[card],engineers:{cards:[]}},{}),detailDialog(card,'crafts')]){
  const text=confirmFor(html,{act:'craft',amount:'max'});
  assert.match(text,/最多制作 3 次木梁/);assert.match(text,/消耗 525 木材/);
  assert.match(text,/确认时库存/);assert.match(text,/可能耗尽所需原料/);assert.match(text,/超过成品容量/);
  assert.equal(confirmFor(html,{act:'craft',id:'beam',...(html.includes('recipe-workbench')?{regionQuick:'true'}:{})}),'');
 }
});
test('ordinary craft ten is direct, maximum bulk construction warns of scaling costs',()=>{
 assert.equal(confirmFor(recipePanel({crafts:[card],engineers:{cards:[]}},{}),{act:'craft',amount:'10'}),'');
 const html=detailDialog({...card,id:'hut',type:'build',name:'小屋'},'buildings');
 assert.match(confirmFor(html,{act:'build',amount:'max'}),/当前单次所需：175 木材/);
 assert.match(confirmFor(html,{act:'build',amount:'max'}),/批量价格可能递增/);
 assert.equal(confirmFor(html,{act:'build',id:'hut'}),'');
});
test('sell all explains quantity, partial refund, capacity limits and lost effects',()=>{
 for(const [section,type]of [['buildings','sell'],['faith','sellFaith'],['space','sellSpace']]){
  const c={...card,id:'hut',type:section==='buildings'?'build':section,name:'设施',owned:5,sellType:type,sellConfirmationText:'按当前价格返还 50% 可退物资。'};
  const text=confirmFor(detailDialog(c,section),{act:type,amount:'max'});
  assert.match(text,type==='sellFaith'?/4 级，并保留一级/:/全部 5 座/);
  assert.match(text,/50%/);assert.match(text,/降低对应效果/);assert.match(text,/退款受库存容量限制/);assert.match(text,/无法直接恢复/);
 }
});
test('stage confirmation includes refund rules, rebuilding and backup advice',()=>{
 const c={...card,type:'stage',confirmationText:'拆售全部 5 座小屋并改建？',description:'返还 50% 可退物资。改建后数量为 0，需要重新购买。'};
 for(const html of [actionCard(c,'buildingStages'),detailDialog(c,'buildingStages')]){
  const text=confirmFor(html,{act:'stage'});assert.match(text,/全部 5 座/);assert.match(text,/50%/);assert.match(text,/数量为 0/);assert.match(text,/备份/);
 }
});
test('detail maximum craft and sell-all cancel without mutation, then execute only on confirmation',async()=>{
 const t=await createTab(sharedStorage(s=>{s.settings.paused=true;s.buildings.workshop=1;s.buildings.hut=3;s.buildings.barn=10;s.resources.wood=600;}));
 await t.click({detail:'crafts:beam'});
 const wood=()=>t.snapshot().resources.find(r=>r.id==='wood').value;
 const before=wood();await clickRendered(t,{act:'craft',id:'beam',amount:'max'},'#dialog-root');assert.equal(wood(),before);
 await clickRendered(t,{command:'cancel'},'#dialog-root');assert.equal(wood(),before);
 await clickRendered(t,{act:'craft',id:'beam',amount:'max'},'#dialog-root');await clickRendered(t,{command:'confirm'},'#dialog-root');assert.equal(wood(),75);
 await t.click({detail:'buildings:hut'});
 const count=()=>t.snapshot().buildings.find(c=>c.id==='hut').owned;
 await clickRendered(t,{act:'sell',id:'hut',amount:'max'},'#dialog-root');assert.equal(count(),3);
 await clickRendered(t,{command:'cancel'},'#dialog-root');assert.equal(count(),3);
 await clickRendered(t,{act:'sell',id:'hut',amount:'max'},'#dialog-root');await clickRendered(t,{command:'confirm'},'#dialog-root');assert.equal(count(),0);
});
