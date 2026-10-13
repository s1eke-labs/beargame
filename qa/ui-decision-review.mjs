/** 决策界面的真实浏览器回归；使用独立测试存档，不代表自然推进记录。 */
import assert from 'node:assert/strict';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {tmpdir} from 'node:os';
import {createGame} from '../src/engine/index.js';

export async function reviewDecisionUi(browser,origin,{output=resolve(tmpdir(),'beargame-ui-v2')}={}){
 await mkdir(output,{recursive:true});const checks=[],errors=[];
 const contextFor=async(seed,viewport={width:390,height:844})=>{
  seed.savedAt=Date.now();seed.settings.paused=true;seed.settings.offline=false;
  const context=await browser.newContext({viewport});
  await context.addInitScript(seed=>{if(!sessionStorage.getItem('decision-review')){localStorage.setItem('beargame.save.v1',JSON.stringify(seed));sessionStorage.setItem('decision-review','1');}},seed);
  const page=await context.newPage();page.setDefaultTimeout(12000);page.on('pageerror',e=>errors.push(e.message));
  return {context,page};
 };
 const go=async(page,route)=>{await page.goto(origin+'#'+route);await page.locator('#loading-screen').waitFor({state:'hidden'});};
 const early=JSON.parse(createGame({storage:null,now:Date.now()}).export());early.resources.honey=1000;
 const {context:ec,page:ep}=await contextFor(early);
 try{
  await go(ep,'build');await ep.locator('[data-build-choice="hut"]').click();
  await ep.locator('.build-station .immediate-shortages [data-acquire-recipe="wood"]').scrollIntoViewIfNeeded();
  const before=await ep.locator('.build-browse-scroll').evaluate(e=>e.scrollTop);
  await ep.locator('.build-station .immediate-shortages [data-acquire-recipe="wood"]').click();
  await ep.locator('.recipe-workbench').waitFor();assert.equal(new URL(ep.url()).hash,'#more/crafts');
  await ep.locator('.recipe-purchase [data-act="refine"]').click();
  await ep.locator('[data-command="return-task"]').click();
  await ep.locator('.dialog .primary-button[data-act="build"][data-id="hut"]').waitFor();
  assert.equal(new URL(ep.url()).hash,'#build');
  assert.equal(await ep.locator('.build-browse-scroll').evaluate(e=>e.scrollTop),before);
  await ep.locator('[data-command="close"]').click();
  checks.push('补料往返保留原建筑、列表位置与实时费用');
 }finally{await ec.close();}
 const late=JSON.parse(await readFile(new URL('campaign/first-space.save.json',import.meta.url),'utf8'));
 const {context,page}=await contextFor(late);
 try{
  await go(page,'research');
  for(let i=0;i<30;i++){await page.keyboard.press('Tab');assert.equal(await page.evaluate(()=>!!document.activeElement.closest('.world-board')),false);}
  await page.setViewportSize({width:1440,height:1000});
  await page.waitForFunction(()=>!document.querySelector('.world-board').inert);
  await page.locator('[data-command="toggle-management-map"]').click();
  assert.equal(await page.locator('.world-board').evaluate(e=>e.inert),true);
  await page.reload();await page.locator('#loading-screen').waitFor({state:'hidden'});
  assert.equal(await page.locator('.world-board').evaluate(e=>e.inert),true);
  await page.locator('.bottom-nav [data-nav="home"]').click();
  await page.waitForFunction(()=>{const e=document.querySelector('.world-board');return e&&!e.inert&&e.checkVisibility();});
  await page.locator('.bottom-nav [data-nav="research"]').click();
  await page.waitForFunction(()=>document.querySelector('.world-board').inert);
  await page.locator('[data-command="toggle-management-map"]').click();
  await page.setViewportSize({width:390,height:844});await page.waitForFunction(()=>document.querySelector('.world-board').inert);
  checks.push('手机键盘跳过隐藏场景，桌面收起地图及刷新持久化');
  await go(page,'more');await page.locator('[data-command="edit-system-pins"]').click();
  await page.locator('[data-system-pin="crafts"]').click();await page.locator('[data-command="edit-system-pins"]').click();
  assert.equal(await page.locator('.more-hub [data-system="crafts"]').count(),1);
  await page.locator('.more-hub [data-system="crafts"]').click();await page.locator('.recipe-workbench').waitFor();
  const recipeTools=page.locator('details').filter({has:page.locator('[data-ui-search="recipeQuery"]')});if(await recipeTools.count())await recipeTools.evaluate(e=>e.open=true);
  await page.locator('[data-ui-search="recipeQuery"]').fill('石板');
  await page.locator('.recipe-purchase [data-id="slab"]').waitFor();
  await page.locator('.batch-controls').first().evaluate(e=>e.open=true);
  const batchIds=await page.locator('.recipe-workbench .batch-controls [data-act]').evaluateAll(es=>es.map(e=>e.dataset.id));
  assert.ok(batchIds.length);assert.ok(batchIds.every(id=>id==='slab'));
  checks.push('常用功能去重，配方筛选与批量预览始终对应同一项目');
  await go(page,'build');
  await page.locator('[data-catalog-view="build"]').click();await page.locator('.catalog-option[data-build-choice="hut"]').click();
  assert.ok((await page.locator('.build-selected-header').innerText()).includes('树洞熊舍'));
  assert.ok((await page.locator('.purchase-preview').innerText()).includes('住处'));
  checks.push('完整建筑目录选中项目并展示实际购买后的住处变化');
  await page.locator('.build-station [data-track-target]').click();
  await go(page,'village');assert.equal(await page.locator('[data-resume-target]').count(),1);
  await page.locator('[data-resume-target]').click();await page.locator('.dialog').waitFor();
  assert.equal(new URL(page.url()).hash,'#build');await page.locator('[data-command="close"]').click();
  checks.push('全局目标跨岗位页可见并返回正确项目');
  await page.locator('[data-command="resources"]').click();
  assert.equal(await page.locator('.inventory-item[open]').count(),0);
  await page.locator('.inventory-item summary').first().click();
  assert.equal(await page.locator('.inventory-item[open]').count(),1);
  await page.waitForTimeout(1200);assert.equal(await page.locator('.inventory-item[open]').count(),1);
  await page.screenshot({path:resolve(output,'库存紧凑总览.png')});
  checks.push('库存默认紧凑，展开状态在定时刷新中保留');
  assert.deepEqual(errors,[]);
 }finally{await context.close();}
 const arrival=JSON.parse(createGame({storage:null,now:Date.now()}).export());arrival.buildings.hut=1;arrival.buildings.hive=20;arrival.resources.honey=100;arrival.arrival=.99;arrival.settings.offline=false;
 const sc=await browser.newContext({viewport:{width:390,height:844}});await sc.addInitScript(seed=>localStorage.setItem('beargame.save.v1',JSON.stringify(seed)),arrival);const sp=await sc.newPage();sp.on('pageerror',e=>errors.push(e.message));
 try{await go(sp,'home');await sp.locator('[data-story-moment="first-bear"]').waitFor();
  const bounds=await sp.evaluate(()=>({story:document.querySelector('.story-moment').getBoundingClientRect().top,hud:document.querySelector('#resource-bar').getBoundingClientRect().bottom}));
  assert.ok(bounds.story>=bounds.hud);await sp.screenshot({path:resolve(output,'成长消息与资源栏.png')});checks.push('真实成长消息不遮挡资源栏');
 }finally{await sc.close();}
 assert.deepEqual(errors,[]);
 const report={checks,errors};await writeFile(resolve(output,'决策交互验收.json'),JSON.stringify(report,null,2)+'\n');return report;
}
if(process.argv[1]&&resolve(process.argv[1])===resolve(import.meta.filename)){
 const url=process.argv[process.argv.indexOf('--url')+1],driver=process.env.BEARGAME_BROWSER_DRIVER;
 if(!process.argv.includes('--url')||!driver)throw Error('请指定 --url 和启用 Chromium 沙箱的 BEARGAME_BROWSER_DRIVER。');
 const {launch}=await import(pathToFileURL(resolve(driver)).href),browser=await launch();
 try{console.log(JSON.stringify({decisions:await reviewDecisionUi(browser,url),shortScreens:await reviewShortBuildUi(browser,url)},null,2));}finally{await browser.close();}
}

/** 短屏需能同时识别建筑和状态，并在告警、追踪、大字下完成当前购买。 */
export async function reviewShortBuildUi(browser,origin,{output=resolve(tmpdir(),'beargame-ui-v2')}={}){
 await mkdir(output,{recursive:true});const cases=[],errors=[];
 const base=JSON.parse(await readFile(new URL('campaign/first-space.save.json',import.meta.url),'utf8'));
 for(const viewport of [{width:320,height:568},{width:844,height:390},{width:568,height:320}])for(const textSize of ['normal','large']){
  const seed=structuredClone(base);seed.savedAt=Date.now();seed.settings.paused=false;seed.settings.offline=false;
  seed.resources.honey=100000;for(const bear of seed.bears||[])bear.job='woodcutter';
  const context=await browser.newContext({viewport});
  await context.addInitScript(({seed,textSize})=>{
   localStorage.setItem('beargame.save.v1',JSON.stringify(seed));
   localStorage.setItem('honeywood-ui-v1',JSON.stringify({textSize,trackedTarget:{section:'buildings',id:'hut'}}));
  },{seed,textSize});
  const page=await context.newPage();page.setDefaultTimeout(12000);page.on('pageerror',e=>errors.push(e.message));
  const label=`${viewport.width}×${viewport.height} ${textSize==='large'?'大字':'普通字号'}`;
  try{
   await page.goto(origin+'#build');await page.locator('#loading-screen').waitFor({state:'hidden'});
   await page.locator('.food-risk').waitFor();await page.locator('[data-resume-target]').waitFor();
   const measure=()=>page.evaluate(()=>{
    const box=e=>{const r=e.getBoundingClientRect();return {top:r.top,bottom:r.bottom,left:r.left,right:r.right,width:r.width,height:r.height};};
    const browse=box(document.querySelector('.build-browse-scroll')),picker=box(document.querySelector('.building-picker'));
    const choices=[...document.querySelectorAll('.building-option')].filter(e=>{const r=e.getBoundingClientRect();return r.left>=picker.left&&r.right<=picker.right;}).map(e=>({name:e.querySelector('b').textContent,button:box(e),title:box(e.querySelector('b')),status:box(e.querySelector('.choice-status'))}));
    const button=document.querySelector('.build-purchase>.buy-button'),buy=box(button),search=document.querySelector('.build-search-controls>summary'),searchBox=box(search);
    return {browse,choices,buy,nav:box(document.querySelector('.bottom-nav')),search:searchBox,warning:box(document.querySelector('.food-risk')),warningText:document.querySelector('.food-risk').textContent,
     buyHit:document.elementFromPoint((buy.left+buy.right)/2,(buy.top+buy.bottom)/2)?.closest('.buy-button')===button,
     searchHit:document.elementFromPoint((searchBox.left+searchBox.right)/2,(searchBox.top+searchBox.bottom)/2)?.closest('summary')===search,
     viewportWidth:innerWidth,scrollWidth:document.documentElement.scrollWidth};
   });
   const check=bounds=>{
    assert.ok(bounds.choices.length>=1,`${label} 至少完整呈现一项建筑`);
    for(const choice of bounds.choices){
     assert.ok(choice.title.top>=bounds.browse.top-1&&choice.title.bottom<=bounds.browse.bottom+1,`${label} ${choice.name}名称被裁切`);
     assert.ok(choice.status.top>=bounds.browse.top-1&&choice.status.bottom<=bounds.browse.bottom+1,`${label} ${choice.name}状态被裁切`);
     assert.ok(choice.button.height>=44&&choice.button.width>=44,`${label} 建筑触控范围不足`);
    }
    assert.ok(bounds.buy.bottom<=bounds.nav.top&&bounds.buy.top>=0,`${label} 购买按钮与主导航重叠`);
    assert.ok(bounds.buy.height>=44&&bounds.buy.width>=44&&bounds.buyHit,`${label} 购买按钮不可点击`);
    assert.ok(bounds.search.height>=44&&bounds.search.width>=44&&bounds.searchHit,`${label} 搜索入口不可点击`);
    assert.ok(bounds.warning.height>=44&&/蜂蜜减少.*耗尽.*调整/.test(bounds.warningText),`${label} 口粮告警信息不完整`);
    assert.ok(bounds.scrollWidth<=bounds.viewportWidth,`${label} 页面横向溢出`);
   };
   const initial=await measure();check(initial);assert.ok(initial.choices.length>=2,`${label} 默认至少可比较两项建筑`);
   await page.screenshot({path:resolve(output,`短屏建造-${viewport.width}x${viewport.height}-${textSize}.png`)});
   await page.locator('.build-search-controls>summary').click();
   await page.locator('[data-ui-search="buildQuery"]').fill('树洞熊舍');
   await page.waitForFunction(()=>document.querySelectorAll('.building-option').length===1&&document.querySelector('.building-option')?.dataset.id==='hut');
   await page.locator('.build-search-controls>summary').click();
   const filtered=await measure();check(filtered);
   cases.push({label,initial,filtered});
  }finally{await context.close();}
 }
 assert.deepEqual(errors,[]);
 const report={checks:['三种短屏普通与大字下，告警和追踪并存时建筑名称与状态完整可见、购买不遮挡导航、搜索能打开并筛选'],cases,errors};
 await writeFile(resolve(output,'短屏建造验收.json'),JSON.stringify(report,null,2)+'\n');return report;
}
