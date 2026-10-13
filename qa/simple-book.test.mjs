import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {art,cardArt,page} from '../src/ui/render.js';
import {paintedBuildings} from '../src/ui/painted-buildings.js';
import {semanticBuildings} from '../src/ui/semantic-buildings.js';
import {semanticResources} from '../src/ui/semantic-resources.js';
import {researchArt} from '../src/ui/research-art.js';
import {catalog} from '../src/engine/catalog.js';
import {createGame} from '../src/engine/index.js';
import {createState,serialize} from '../src/engine/save.js';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
test('simple picture-book theme loads last and retains original white bear',()=>{
 const html=read('index.html');assert.match(html,/<body class="simple-book">/);
 assert.ok(html.indexOf('simple-book.css')>html.indexOf('semantic-world.css'));
 assert.match(html,/reference-bears-atlas.webp/);
 const css=read('src/styles/simple-book.css');
 assert.doesNotMatch(css,/gradient\(/);
 assert.match(css,/construction-workbench\{background-image:none\}/);
 assert.match(css,/reference-bear-art[\s\S]*filter:none!important/);
});
test('all new atlas rectangles are bounded and have explicit subjects',()=>{
 for(const registry of [paintedBuildings,semanticBuildings,semanticResources,researchArt])for(const [id,s] of Object.entries(registry)){
 const c=s.crop;assert.ok(c.width>0&&c.height>0,id);assert.ok(c.x>=0&&c.y>=0,id);
 assert.ok(c.x+c.width<=s.width&&c.y+c.height<=s.height,id);
 }
 for(const r of catalog.resources)assert.doesNotMatch(art('resource',r.id),/unassigned-art/,r.id);
 for(const b of catalog.buildings)assert.doesNotMatch(art('building',b.id),/unassigned-art/,b.id);
 for(const c of catalog.science)assert.doesNotMatch(cardArt(c,'science'),/building-art|semantic-building|reference-bear-art/);
});
test('all main screens remain presentation-only under the unified art theme',()=>{
 const s=createState(11,0);for(const b of catalog.buildings)s.buildings[b.id]=3;
 for(const id of ['calendar','agriculture','construction','mining','electricity','rocketry'])s.science[id]=true;
 s.settings.paused=true;const vm=createGame({storage:null,save:serialize(s,0),now:0}).snapshot();
 const before=JSON.stringify(vm);
 for(const p of ['home','build','research','village','more']){
  const h=page(vm,{page:p,district:'home',researchTab:'science',system:''});
  assert.doesNotMatch(h,/data-unassigned-art/);assert.equal(JSON.stringify(vm),before);
 }
});
test('single regional dock action stays full width on narrow phones',()=>{
 assert.match(read('src/styles/simple-book.css'),/district-system-button:only-child\{max-width:none;flex:1;white-space:nowrap\}/);
});
