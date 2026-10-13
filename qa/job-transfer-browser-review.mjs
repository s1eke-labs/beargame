/** 在启用沙箱的真实浏览器中验收调岗预览、取消和确认。 */
import assert from 'node:assert/strict';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {tmpdir} from 'node:os';

export async function reviewJobTransfer(browser,origin,{output=resolve(tmpdir(),'beargame-job-transfer')}={}){
 await mkdir(output,{recursive:true});const cases=[],errors=[];
 const base=JSON.parse(await readFile(new URL('campaign/first-space.save.json',import.meta.url),'utf8'));
 for(const viewport of [{width:320,height:568},{width:820,height:1180},{width:1440,height:1000}])for(const textSize of ['normal','large']){
  const seed=structuredClone(base);seed.savedAt=Date.now();seed.settings.paused=true;seed.settings.offline=false;
  const context=await browser.newContext({viewport});await context.addInitScript(({seed,textSize})=>{
   localStorage.setItem('beargame.save.v1',JSON.stringify(seed));localStorage.setItem('honeywood-ui-v1',JSON.stringify({textSize}));
  },{seed,textSize});
  const page=await context.newPage();page.setDefaultTimeout(12000);page.on('pageerror',e=>errors.push(e.message));
  const count=id=>page.locator(`[data-job="${id}"] .stepper strong`).innerText().then(Number);
  const label=`${viewport.width}×${viewport.height}-${textSize}`;
  try{
   await page.goto(origin+'#village');await page.locator('#loading-screen').waitFor({state:'hidden'});
   const trigger=page.locator('[data-job-transfer="farmer"]');await trigger.click();
   const source=await page.locator('[data-job-transfer-field="from"]').inputValue();
   const before=await count(source),targetBefore=await count('farmer');
   assert.notEqual(source,'farmer');assert.ok(before>0);
   await page.locator('[data-job-transfer-field="amount"]').selectOption('5');
   const actual=Math.min(5,before);await page.locator('.purchase-preview').getByText(`将调动 ${actual} 只伙伴`,{exact:true}).waitFor();
   assert.ok((await page.locator('.purchase-preview').innerText()).includes('蜂蜜净收支'));
   assert.equal(await count(source),before);assert.equal(await count('farmer'),targetBefore);
   for(const select of await page.locator('.job-transfer-form select').all()){
    const box=await select.boundingBox();assert.ok(box.height>=44&&box.width>=44,`${label} 控件触摸面积不足`);
   }
   await page.screenshot({path:resolve(output,`${label}.png`),animations:'disabled'});
   await page.locator('[data-command="close"]').click();assert.equal(await count(source),before);
   await trigger.click();await page.locator('[data-job-transfer-field="amount"]').selectOption('5');
   await page.locator('[data-command="confirm-job-transfer"]').click();await page.locator('.job-transfer-form').waitFor({state:'hidden'});
   assert.equal(await count(source),before-actual);assert.equal(await count('farmer'),targetBefore+actual);
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
   cases.push({label,source,target:'farmer',actual});
  }finally{await context.close();}
 }
 assert.deepEqual(errors,[]);const report={cases,errors};await writeFile(resolve(output,'调岗验收.json'),JSON.stringify(report,null,2)+'\n');return report;
}
if(process.argv[1]&&resolve(process.argv[1])===resolve(import.meta.filename)){
 const driver=process.env.BEARGAME_BROWSER_DRIVER,url=process.argv[process.argv.indexOf('--url')+1];
 if(!driver||!process.argv.includes('--url'))throw Error('请指定 --url 和启用 Chromium 沙箱的 BEARGAME_BROWSER_DRIVER。');
 const {launch}=await import(pathToFileURL(resolve(driver)).href),browser=await launch();
 try{console.log(JSON.stringify(await reviewJobTransfer(browser,url),null,2));}finally{await browser.close();}
}
