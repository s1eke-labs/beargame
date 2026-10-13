import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame,catalog} from '../src/engine/index.js';
import {actionCard,detailDialog} from '../src/ui/render.js';

// 合成存档仅用于隔离核对展示与结算，不代表自然取得的游戏进度。
function fixture(edit){const g=createGame({storage:null,now:1,seed:17});const s=JSON.parse(g.export());edit(s);assert.equal(g.importSave(JSON.stringify(s)).ok,true);return g;}
test('祈愿卡准确展示实际投入与颂愿收益且读取不改变存档',()=>{
 const g=fixture(s=>{s.science.theology=true;s.resources.faith=73;s.faithRatio=2;});
 const before=g.export(),vm=g.snapshot(),c=vm.actions.find(c=>c.type==='praise'),html=actionCard(c,'actions');
 assert.equal(g.export(),before);assert.match(html,/投入当前/);assert.doesNotMatch(html,/无需资源/);
 const result=g.act('praise',c.id),after=g.snapshot();assert.equal(result.ok,true);
 assert.ok(Math.abs(after.progression.praised-vm.progression.praised-c.conversionPreview.output)<1e-8);
 assert.ok(after.resources.find(r=>r.id==='faith').value<.001);
});
test('贸易展示当季主要回报、真实概率和仓储损失',()=>{
 const g=fixture(s=>{s.discoveries.lizards=true;s.resourceUnlocked.wood=true;s.resources.wood=200;s.calendar.season=1;});
 const before=g.export(),c=g.snapshot().trades.find(c=>c.id==='lizards'),good=c.tradePreview.goods.find(r=>r.id==='wood');
 assert.equal(g.export(),before);assert.equal(good.totalChance,1);assert.equal(good.season,.35);assert.ok(Math.abs(good.min-648)<1e-8);assert.ok(Math.abs(good.max-877.5)<1e-8);assert.equal(good.room,0);
 const html=detailDialog(c,'trades',g.snapshot());assert.match(html,/木材/);assert.match(html,/夏季/);assert.match(html,/部分回报可能溢出/);
});
test('航行任务在主卡及详情明确区分在途和抵达',()=>{
 const def=catalog.space.find(c=>c.family==='mission'&&c.destination&&c.days>0);assert.ok(def);
 const g=fixture(s=>{for(const c of catalog.science)s.science[c.id]=true;s.space[def.id]=1;s.spaceTravel[def.id]=def.days;});
 const c=g.snapshot().space.find(c=>c.id===def.id);assert.equal(c.completed,true);assert.ok(c.travelDays>0);
 for(const html of [actionCard(c,'space'),detailDialog(c,'space',g.snapshot())]){assert.match(html,/正在航行/);assert.match(html,/后抵达/);assert.doesNotMatch(html,/已掌握/);}
 assert.match(actionCard({...c,travelDays:0,reached:true},'space'),/已抵达/);
});
