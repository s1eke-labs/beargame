import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createGame} from '../src/engine/index.js';
import {page,actionCard} from '../src/ui/render.js';
import {queuePanel} from '../src/ui/advanced.js';
const fresh=()=>createGame({storage:null,now:0}).snapshot();
test('build management opens directly to one queue without nested queue disclosure',()=>{
 const html=page(fresh(),{page:'build',district:'home',buildFilter:'all'});
 assert.match(html,/data-fold="build-management"/);assert.doesNotMatch(html,/data-fold="queue"/);
 assert.equal((html.match(/class="advanced-section queue-panel"/g)||[]).length,1);
 assert.match(html,/management-hint">返回建造/);assert.doesNotMatch(html,/已用位置|空余位置|建造与研究队列/);
});
test('small queue catalog hides redundant filters and single-page pagination',()=>{
 const vm=fresh(),html=queuePanel(vm,{});assert.match(html,/queue-empty/);assert.match(html,/无需现在付费/);
 assert.doesNotMatch(html,/data-queue-page|aria-label="队列项目分类"/);assert.match(html,/queue-overview/);
});
test('queue choices keep engine IDs and availability with a compact actionable label',()=>{
 const c=fresh().queue.options.find(c=>c.targetId==='hive');const html=actionCard({...c,type:'queueEnqueue'},'queueOptions');
 assert.match(html,/data-act="queueEnqueue"/);assert.match(html,/data-id="build:hive"/);assert.match(html,/<span>排队<\/span>/);
 assert.match(html,/data-detail="queueOptions:build:hive"/);
});
test('hero styles are scoped and management scrolling survives a render',()=>{
 const css=readFileSync(new URL('../src/styles/game-ui.css',import.meta.url),'utf8');
 assert.doesNotMatch(css,/\.sheet-build \.buy-button[\[{]/);assert.doesNotMatch(css,/\.sheet-build \.cost(?:\.short)?\{/);
 assert.match(css,/\.sheet-build \.build-purchase>\.buy-button\{/);
 const main=readFileSync(new URL('../src/main.js',import.meta.url),'utf8');assert.match(main,/management\.scrollTop=full\?0:managementScroll/);
});
