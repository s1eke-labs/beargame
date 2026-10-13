import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {readFileSync,readdirSync} from 'node:fs';
import {createGame} from '../src/engine/index.js';
import * as render from '../src/ui/render.js';
const game=createGame({storage:null,now:()=>1800000000000});
const vm=game.snapshot();
const makeUI=(page='home',system=null)=>({page,system,buildFilter:'all',researchTab:'science',reducedMotion:false});
function fragments(){const out={};for(const p of ['home','build','research','village','more'])out[p]=render.shell(vm,makeUI(p));for(const s of ['crafts','trades','faith','space','prestige','challenges'])out[`system-${s}`]=render.page(vm,makeUI('more',s));out.resources=render.resourcesDialog(vm);out.help=render.helpDialog(vm);out.settings=render.settingsDialog(vm,{reducedMotion:false});for(const [section,cards]of Object.entries({buildings:vm.buildings,science:vm.science,crafts:vm.crafts,faith:vm.faith,space:vm.space})){if(cards[0])out[`detail-${section}`]=render.detailDialog(cards[0],section);}return out;}
test('every top-level page/system/dialog renders from an actual engine snapshot',()=>{for(const[name,html]of Object.entries(fragments())){assert.equal(typeof html,'string',name);assert.ok(html.length>100,name);assert.ok(!html.includes('[object Object]'),name);assert.ok(!html.includes('undefined'),name);assert.ok(!html.includes('NaN'),name);}});
test('rendered HTML has balanced tags, unique ids and no nested interactive controls',()=>{const check=spawnSync('python3',[new URL('./inspect-html.py',import.meta.url).pathname],{input:JSON.stringify(fragments()),encoding:'utf8'});assert.equal(check.status,0,check.stderr);const result=JSON.parse(check.stdout);for(const[name,audit]of Object.entries(result))assert.deepEqual(audit.issues,[],`${name}: ${audit.issues.join('; ')}`);});
test('imported text is escaped before being inserted into HTML',()=>{const unsafe='<img src=x onerror=alert(1)>';const c={...vm.buildings[0],name:unsafe,description:unsafe,effects:unsafe,reason:unsafe};for(const html of [render.actionCard(c,'buildings'),render.detailDialog(c,'buildings')]){assert.ok(!html.includes(unsafe));assert.ok(html.includes('&lt;img'));}assert.equal(render.esc('&<>"\''),'&amp;&lt;&gt;&quot;&#39;');});
test('mobile layout source contains viewport, safe areas, narrow breakpoints and focus access',()=>{const css=readFileSync(new URL('../src/styles/main.css',import.meta.url),'utf8');const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');assert.match(html,/width=device-width/);assert.match(html,/viewport-fit=cover/);assert.match(css,/@media\(max-width:760px\)/);assert.match(css,/@media\(max-width:380px\)/);assert.match(css,/safe-area-inset-bottom/);assert.match(css,/prefers-reduced-motion/);assert.match(css,/:focus-visible/);assert.match(css,/touch-action:manipulation/);});
test('统一字号令牌保证辅助文字至少十二像素并随大字号设置放大',()=>{
 const directory=new URL('../src/styles/',import.meta.url),base=readFileSync(new URL('main.css',directory),'utf8');
 assert.match(base,/--text-caption:\.75rem/);assert.match(base,/--text-body:\.875rem/);assert.match(base,/--text-emphasis:1rem/);
 assert.match(base,/:root\[data-text-size="large"\]\{font-size:112\.5%\}/);
 for(const file of readdirSync(directory).filter(name=>name.endsWith('.css'))){
  const css=readFileSync(new URL(file,directory),'utf8');
  const tiny=[...css.matchAll(/font-size\s*:\s*(\d*\.?\d+)(px|rem)/g)].filter(([,value,unit])=>Number(value)>0&&Number(value)*(unit==='rem'?16:1)<12);
  assert.deepEqual(tiny.map(match=>match[0]),[],file);
 }
});
