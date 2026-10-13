/** 真实浏览器交互验收；检查点仅用于覆盖已解锁界面，不代表本次自然推进。 */
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {tmpdir} from 'node:os';
import {createGame} from '../src/engine/index.js';

const checkout=resolve(import.meta.dirname,'..');
export async function reviewFullUi(browser,origin,{output=resolve(tmpdir(),'beargame-ui-review')}={}){
 await mkdir(output,{recursive:true});
 const context=await browser.newContext({viewport:{width:390,height:844}}),page=await context.newPage();
 page.setDefaultTimeout(12000);
 const seed=JSON.parse(await readFile(resolve(checkout,'qa/campaign/first-space.save.json'),'utf8'));
 seed.settings.paused=true;seed.settings.offline=false;seed.savedAt=Date.now();
 await context.addInitScript(seed=>{if(!sessionStorage.getItem('ui-review-seeded')){localStorage.clear();localStorage.setItem('beargame.save.v1',JSON.stringify(seed));sessionStorage.setItem('ui-review-seeded','1');}},seed);
 const errors=[],checks=[];page.on('pageerror',error=>errors.push(error.message));
 const go=async route=>{await page.goto(origin+'#'+route);await page.locator('#loading-screen').waitFor({state:'hidden'});};
 try{
  await go('build');
  await page.locator('.build-station [data-track-target="buildings:hive"]').click();
  assert.equal(await page.locator('.build-station [data-track-target="buildings:hive"]').getAttribute('aria-pressed'),'true');
  await page.locator('[data-fold="build-filters"]>summary').click();
  await page.locator('[data-build-availability="unbuilt"]').click();
  assert.equal(await page.locator('[data-build-availability="unbuilt"]').getAttribute('aria-pressed'),'true');
  await page.locator('[data-build-tab="queue"]').click();await page.locator('.queue-panel').waitFor();
  await page.locator('[data-build-tab="build"]').click();checks.push('建筑追踪、未建造筛选与同级队列');

  await go('research');await page.locator('[data-fold="research-categories"] summary').click();
  await page.locator('[data-research-category="village"]').click();
  assert.equal(await page.locator('[data-research-category="village"]').getAttribute('aria-pressed'),'true');
  await page.locator('[data-research-category="all"]').click();
  const search=page.locator('[data-ui-search="researchQuery"]');await search.fill('声学');
  assert.equal(await search.inputValue(),'声学');assert.ok((await page.locator('.research-path').innerText()).includes('声学'));
  await page.waitForTimeout(1200);assert.equal(await search.evaluate(e=>e===document.activeElement),true);
  checks.push('研究搜索、主题筛选与定时刷新保留输入焦点');

  await page.locator('.resource-tile').first().click();await page.locator('[data-ui-search="inventoryQuery"]').fill('蜂蜜');
  await page.locator('.inventory-item').filter({has:page.locator('[data-resource-pin="honey"]')}).evaluate(el=>{el.open=true;});
  await page.locator('[data-resource-pin="honey"]').click();
  assert.equal(await page.locator('[data-resource-pin="honey"]').getAttribute('aria-pressed'),'true');
  await page.locator('[data-command="close"]').click();checks.push('库存搜索与资源固定');

  await go('more');await page.locator('[data-command="edit-system-pins"]').click();await page.locator('[data-system-pin="crafts"]').click();
  assert.equal(await page.locator('[data-system-pin="crafts"]').getAttribute('aria-pressed'),'true');
  await page.locator('.topbar [data-command="settings"]').click();await page.locator('[data-command="text-size"]').click();
  assert.equal(await page.locator('html').getAttribute('data-text-size'),'large');await page.locator('[data-command="close"]').click();
  await page.reload();await page.locator('#loading-screen').waitFor({state:'hidden'});
  const prefs=await page.evaluate(()=>JSON.parse(localStorage.getItem('honeywood-ui-v1')));
  assert.deepEqual(prefs.resourcePins,['honey']);assert.deepEqual(prefs.systemPins,['crafts']);
  assert.deepEqual(prefs.trackedTarget,{section:'buildings',id:'hive',targetOwned:seed.buildings.hive+1});assert.equal(prefs.textSize,'large');
  checks.push('常用系统、目标及大字号在刷新后保持');

  const stable=await page.evaluate(async moduleUrl=>{
   const {updateMarkup}=await import(moduleUrl),host=document.createElement('section');document.body.append(host);
   host.innerHTML='<p id="review-reading">保留正在阅读的文字</p><input data-ui-search="sample" value="旧值"><details data-fold="sample"><summary>说明</summary><b>1</b></details><button data-act="test" data-id="a">甲</button><button data-act="test" data-id="b">乙</button>';
   const paragraph=host.querySelector('p'),input=host.querySelector('input'),details=host.querySelector('details'),button=host.querySelector('[data-id=b]');
   input.focus();input.value='正在输入';input.setSelectionRange(2,4);details.open=true;
   updateMarkup(host,'<p id="review-reading">保留正在阅读的文字</p><input data-ui-search="sample" value="新值"><details data-fold="sample"><summary>说明</summary><b>2</b></details><button data-act="test" data-id="b">乙</button><button data-act="test" data-id="a">甲</button>');
   const result={sameInput:host.querySelector('input')===input,focus:document.activeElement===input,value:input.value,start:input.selectionStart,end:input.selectionEnd,open:details.open,count:details.querySelector('b').textContent,reordered:host.querySelectorAll('button')[0]===button};
   const range=document.createRange();range.selectNodeContents(paragraph);getSelection().removeAllRanges();getSelection().addRange(range);
   updateMarkup(host,host.innerHTML.replace('<b>2</b>','<b>3</b>'));result.sameReading=paragraph===host.querySelector('p');result.selection=getSelection().toString();getSelection().removeAllRanges();host.remove();return result;
  },new URL('src/ui/live-dom.js',origin).href);
  assert.deepEqual(stable,{sameInput:true,focus:true,value:'正在输入',start:2,end:4,open:true,count:'2',reordered:true,sameReading:true,selection:'保留正在阅读的文字'});
  checks.push('动态更新保留静态节点、文本选区、输入选区与展开状态');
  await page.locator('.resource-tile').first().click();
  await page.evaluate(()=>{const body=document.querySelector('.dialog-body');window.__reviewBody=body;window.__reviewItem=body.querySelector('.inventory-item');body.scrollTop=180;window.__reviewScroll=body.scrollTop;});
  await page.waitForTimeout(1600);
  const live=await page.evaluate(()=>({sameBody:window.__reviewBody===document.querySelector('.dialog-body'),sameItem:window.__reviewItem===document.querySelector('.inventory-item'),scroll:document.querySelector('.dialog-body').scrollTop,expected:window.__reviewScroll}));
  assert.equal(live.sameBody,true);assert.equal(live.sameItem,true);assert.equal(live.scroll,live.expected);
  checks.push('资源弹窗定时刷新保留节点和滚动');assert.deepEqual(errors,[]);
  await page.screenshot({path:resolve(output,'完整版本库存.png')});
  const report={checks,errors,stable,live};await writeFile(resolve(output,'交互验收.json'),JSON.stringify(report,null,2)+'\n');return report;
 }finally{await context.close();}
}

export async function reviewAttentionUi(browser,origin){
 const context=await browser.newContext({viewport:{width:390,height:844}}),page=await context.newPage();
 page.setDefaultTimeout(12000);
 const seed=JSON.parse(createGame({storage:null,now:Date.now()}).export());
 seed.buildings.hut=1;seed.buildings.hive=20;seed.resources.honey=100;seed.arrival=.99;seed.settings.offline=false;
 await context.addInitScript(seed=>{if(!sessionStorage.getItem('attention-review-seeded')){localStorage.clear();localStorage.setItem('beargame.save.v1',JSON.stringify(seed));sessionStorage.setItem('attention-review-seeded','1');}},seed);
 const errors=[];page.on('pageerror',error=>errors.push(error.message));
 try{
  await page.goto(origin);await page.locator('#loading-screen').waitFor({state:'hidden'});
  const story=page.locator('[data-story-moment="first-bear"]');await story.waitFor();
  await story.locator('button').focus();await page.waitForTimeout(7300);assert.equal(await story.count(),1);
  await page.locator('.gather-button').focus();await story.waitFor({state:'detached',timeout:9000});
  assert.ok(await page.evaluate(()=>JSON.parse(localStorage.getItem('honeywood-ui-v1')).notices.some(n=>n.id==='story:first-bear')));
  await page.reload();await page.locator('#loading-screen').waitFor({state:'hidden'});
  assert.ok(await page.evaluate(()=>JSON.parse(localStorage.getItem('honeywood-ui-v1')).notices.some(n=>n.id==='story:first-bear')));
  await page.goto(origin+'#build');await page.locator('#loading-screen').waitFor({state:'hidden'});
  await page.locator('[data-build-choice="hut"]').click();
  await page.locator('.build-extra>summary').click();
  await page.locator('.build-station .batch-controls summary').click();
  const single=page.locator('.build-station .buy-button'),batch=page.locator('.build-station [data-amount="5"]');
  for(const button of [single,batch]){
   // aria-disabled 保留解释入口；跳过驱动的可用性等待，仍发送真实点击。
   assert.equal(await button.getAttribute('aria-disabled'),'true');await button.click({force:true});
   assert.equal(await button.evaluate(el=>el.nextElementSibling?.classList.contains('inline-action-feedback')),true);
   assert.equal(await page.locator('[aria-describedby="action-feedback"]').count(),1);
  }
  assert.deepEqual(errors,[]);
  return {checks:['故事获得焦点后超过自动收起时长仍保留，移出焦点后收起','成长消息刷新后仍可回看','连续失败与不同批量操作的错误信息紧邻当前按钮'],errors};
 }finally{await context.close();}
}

if(process.argv[1]&&resolve(process.argv[1])===resolve(import.meta.filename)){
 const url=process.argv[process.argv.indexOf('--url')+1];
 if(!process.argv.includes('--url')||!url)throw Error('请传入 --url 本地完整版本地址。');
 const driver=process.env.BEARGAME_BROWSER_DRIVER;
 if(!driver)throw Error('请通过 BEARGAME_BROWSER_DRIVER 指定导出 launch() 的本地浏览器适配模块，必须开启浏览器自身沙箱。');
 const {launch}=await import(pathToFileURL(resolve(driver)).href),browser=await launch();
 try{const controls=await reviewFullUi(browser,url),attention=await reviewAttentionUi(browser,url);console.log(JSON.stringify({controls,attention},null,2));}finally{await browser.close();}
}
