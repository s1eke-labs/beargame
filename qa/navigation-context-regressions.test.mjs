import test from 'node:test';
import assert from 'node:assert/strict';
import {createTab,sharedStorage,advance,clickRendered} from './dom-harness.mjs';

const route=async(t,hash)=>{t.location.hash='#'+hash;await t.windowEvent('hashchange');};
function browserHistory(t){
 let hash='#home',index=0;const entries=[{hash,state:null}];
 Object.defineProperty(t.location,'hash',{get:()=>hash,set:value=>{const next=value.startsWith('#')?value:'#'+value;if(next===hash)return;hash=next;entries.splice(index+1);entries.push({hash,state:null});index++;}});
 t.window.history={get state(){return entries[index].state;},pushState(state,title,url){if(url)hash=new URL(url,'https://example.test/').hash;entries.splice(index+1);entries.push({hash,state});index++;},replaceState(state,title,url){if(url)hash=new URL(url,'https://example.test/').hash;entries[index]={hash,state};},back(){if(index){index--;hash=entries[index].hash;}}};
 return {entries,get index(){return index;},async back(){const before=hash;t.window.history.back();await t.windowEvent('popstate');if(hash!==before)await t.windowEvent('hashchange');}};
}

test('正在读手记时到达的消息必须实际显示或保持未读',async()=>{
 const storage=sharedStorage(s=>{s.settings.paused=false;s.buildings.hive=20;s.buildings.hut=1;s.resources.honey=2000;s.arrival=.99;}),t=await createTab(storage);
 await t.click({command:'journal'});advance(2000);t.step();
 assert.equal(t.snapshot().bears.value,1);
 const notice=JSON.parse(storage.getItem('honeywood-ui-v1')).notices.find(note=>note.id==='story:first-bear');
 assert.ok(notice);
 assert.ok(!notice.read||t.doc.node('#dialog-root').innerHTML.includes(notice.title),'新消息未出现在手记正文时，不能提前标为已读');
});

test('重启旅程后清除指向未解锁工程配方的返回入口',async()=>{
 const t=await createTab(sharedStorage(s=>{s.settings.paused=true;s.science.mining=true;s.science.mechanization=true;s.buildings.workshop=1;s.buildings.factory=1;s.buildings.hut=1;s.bears=[{id:1,name:'测试熊',job:null,skills:{},rank:0,experience:0,trait:'none'}];s.nextBearId=2;}));
 await route(t,'more/crafts');await clickRendered(t,{recipeChoice:'beam'});
 await clickRendered(t,{nav:'village',returnRecipe:'beam'});await route(t,'village');
 assert.match(t.doc.node('#main-content').innerHTML,/data-return-recipe-action="beam"/);
 await t.click({command:'reset'});await t.click({command:'confirm'});await route(t,'village');
 assert.equal(t.snapshot().crafts.find(c=>c.id==='beam').unlocked,false);
 assert.doesNotMatch(t.doc.node('#main-content').innerHTML,/data-return-recipe-action="beam"/);
});

test('通过浏览器后退回到原项目后，下一次补材料返回新的项目',async()=>{
 const t=await createTab(sharedStorage(s=>{s.settings.paused=true;s.resources.honey=2000;})),history=browserHistory(t);
 await route(t,'build');await clickRendered(t,{detail:'buildings:hut'});await clickRendered(t,{acquireRecipe:'wood'},'#dialog-root');
 assert.equal(t.location.hash,'#more/crafts');
 await history.back();assert.equal(t.location.hash,'#build');
 await t.click({detail:'buildings:library'});await clickRendered(t,{acquireRecipe:'wood'},'#dialog-root');
 await clickRendered(t,{command:'return-task'},'#resource-bar');
 if(t.location.hash==='#build')await t.windowEvent('hashchange');
 assert.match(t.doc.node('#dialog-root').innerHTML,/林间书屋/);
 assert.doesNotMatch(t.doc.node('#dialog-root').innerHTML,/detail-description[^>]*>用木材围起/);
});

test('重复恢复当前页面的目标详情只占一个弹窗历史项',async()=>{
 const t=await createTab(sharedStorage(s=>{s.settings.paused=true;})),history=browserHistory(t);
 await route(t,'build');const base=history.index;
 await t.click({detail:'buildings:hut'});assert.equal(history.index,base+1);
 // 直接调用真实事件处理，覆盖重复恢复请求；普通指针操作会受弹窗 inert 保护。
 await t.click({resumeTarget:'buildings:hive'});
 assert.match(t.doc.node('#dialog-root').innerHTML,/蜂箱/);
 assert.equal(history.index,base+1,'替换当前详情不应再压入第二个弹窗历史项');
 await t.click({command:'close'});
 assert.equal(history.index,base);assert.equal(t.window.history.state?.bearDialog,undefined);
});

test('手记跳转新系统时返回当前阅读来源，不沿用上次系统来源',async()=>{
 const storage=sharedStorage(s=>{s.settings.paused=true;s.buildings.lumberMill=1;s.buildings.workshop=1;s.buildings.library=1;s.science.calendar=true;});
 storage.setItem('honeywood-ui-v1',JSON.stringify({notices:[{id:'time-open',title:'时光研究已开启',body:'查看新的选择',route:'more/challenges'}]}));
 const t=await createTab(storage);
 await route(t,'home/crafts');await clickRendered(t,{system:'crafts'});await route(t,'more/crafts');
 await t.click({nav:'research'});await route(t,'research');await t.click({command:'journal'});
 await clickRendered(t,{noticeOpen:'time-open'},'#dialog-root');await route(t,'more/challenges');
 await clickRendered(t,{command:'return-system'});
 assert.equal(t.location.hash.replace(/^#/,''),'research');
});
