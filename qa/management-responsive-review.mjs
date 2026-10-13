/** 管理页的真实尺寸验收；检查点仅用于覆盖布局，不代表自然推进记录。 */
import assert from 'node:assert/strict';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {tmpdir} from 'node:os';
import {pathToFileURL} from 'node:url';

export async function reviewManagementLayout(browser,origin,{output=resolve(tmpdir(),'beargame-management-layout')}={}){
 await mkdir(output,{recursive:true});
 const seed=JSON.parse(await readFile(new URL('campaign/first-space.save.json',import.meta.url),'utf8'));
 seed.savedAt=Date.now();seed.settings.paused=true;seed.settings.offline=false;
 const checks=[],errors=[];
 for(const viewport of [{width:320,height:568},{width:390,height:844},{width:820,height:1180},{width:1440,height:1000}])for(const textSize of ['normal','large']){
  const context=await browser.newContext({viewport});
  await context.addInitScript(({seed,textSize})=>{
   localStorage.setItem('beargame.save.v1',JSON.stringify(seed));
   localStorage.setItem('honeywood-ui-v1',JSON.stringify({textSize}));
  },{seed,textSize});
  const page=await context.newPage();page.on('pageerror',error=>errors.push(error.message));
  try{
   for(const route of ['build','research','more/crafts','more']){
    await page.goto(origin+'#'+route);await page.locator('#loading-screen').waitFor({state:'hidden'});
    const label=`${viewport.width}×${viewport.height} ${textSize} ${route}`;
    const bounds=await page.evaluate(()=>{
     const box=e=>{if(!e)return null;const r=e.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height,bottom:r.bottom,right:r.right};};
     const action=document.querySelector('.build-purchase>.buy-button,.recipe-purchase>.buy-button,.research-path>.discovery-card>.buy-button');
     const hit=action&&box(action),sheet=document.querySelector('.game-sheet');
     const card=document.querySelector('.research-path>.discovery-card');
     return {sheet:box(sheet),main:box(document.querySelector('#main-content')),nav:box(document.querySelector('.bottom-nav')),action:hit,
      actionHit:!!hit&&document.elementFromPoint(hit.x+hit.width/2,hit.y+hit.height/2)?.closest('.buy-button')===action,
      worldVisible:document.querySelector('.world-board').checkVisibility(),card:box(card),
      viewportWidth:innerWidth,scrollWidth:document.documentElement.scrollWidth};
    });
    await page.screenshot({path:resolve(output,`${viewport.width}-${route.replaceAll('/','-')}-${textSize}.png`)});
    assert.ok(bounds.scrollWidth<=bounds.viewportWidth,`${label} 页面横向溢出`);
    if(viewport.width<1000){
     assert.equal(bounds.worldVisible,false,`${label} 不应保留不可操作的背景场景`);
     assert.ok(Math.abs(bounds.sheet.y-bounds.main.y)<=1,`${label} 管理面板未紧接资源栏`);
     assert.ok(bounds.sheet.width>=viewport.width-2,`${label} 管理面板未使用可用宽度`);
     assert.ok(bounds.sheet.bottom<=bounds.nav.y+1,`${label} 面板遮挡主导航`);
    }
    if(bounds.card)assert.ok(bounds.card.width>=Math.min(280,viewport.width-32),`${label} 研究卡过窄`);
    if(bounds.action){
     assert.ok(bounds.action.height>=44&&bounds.action.width>=44,`${label} 主操作触控范围不足`);
     assert.ok(bounds.action.bottom<=bounds.nav.y+1&&bounds.actionHit,`${label} 首项主操作未完整露出`);
    }
    checks.push({label,...bounds});
    if(textSize==='normal'&&['build','more/crafts'].includes(route)){
     const building=route==='build',kind=building?'build':'recipe',id=building?'hut':'beam';
     const toggle=page.locator(`[data-catalog-view="${kind}"]`);
     if(await toggle.getAttribute('aria-pressed')!=='true')await toggle.click();
     await page.locator(`.item-catalog [data-${kind}-choice="${id}"]`).click();
     const action=page.locator(`${building?'.build-purchase':'.recipe-purchase'}>.buy-button`);
     assert.equal(await action.getAttribute('data-id'),id,`${label} 目录选择未同步主操作`);
     if(viewport.width<1000)assert.equal(await page.locator('.item-catalog').count(),0,`${label} 选择后应返回当前操作`);
     checks.at(-1).catalogSelection=id;
    }
   }
  }finally{await context.close();}
 }
 assert.deepEqual(errors,[]);
 const report={checks,errors};await writeFile(resolve(output,'管理布局验收.json'),JSON.stringify(report,null,2)+'\n');return report;
}

if(process.argv[1]&&resolve(process.argv[1])===resolve(import.meta.filename)){
 const index=process.argv.indexOf('--url'),driver=process.env.BEARGAME_BROWSER_DRIVER;
 if(index<0||!driver)throw Error('请指定 --url 和启用 Chromium 沙箱的 BEARGAME_BROWSER_DRIVER。');
 const {launch}=await import(pathToFileURL(resolve(driver)).href),browser=await launch();
 try{const result=await reviewManagementLayout(browser,process.argv[index+1]);console.log(`管理布局验收通过：${result.checks.length} 个组合，${result.errors.length} 个页面错误。`);}finally{await browser.close();}
}
