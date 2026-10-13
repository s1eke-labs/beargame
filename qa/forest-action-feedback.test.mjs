import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
import {resolve} from 'node:path';
import {createGame} from '../src/chapters/forest/engine.js';
import {createState,serialize} from '../src/chapters/forest/save.js';
const root=resolve(import.meta.dirname,'..');
const source=(await readFile(resolve(root,'src/chapters/forest/main.js'),'utf8')).replaceAll("from './engine.js'",`from '${pathToFileURL(resolve(root,'src/chapters/forest/engine.js'))}'`).replaceAll("from './art.js'",`from '${pathToFileURL(resolve(root,'src/chapters/forest/art.js'))}'`).replace(/if\(typeof document!==.*?boot\(\);\s*$/,'')+`
export const fixture={
 init(instance,node){game=instance;vm=game.snapshot();ui.actionErrors={};ui.amounts={};settings={tracked:null};canAct=()=>true;save=()=>({ok:true});persistUI=()=>{};notify=()=>{};refreshDialog=()=>{};closeDialog=()=>{dialog=null;};openDialog=(kind,title,data)=>{dialog={kind,title,...data};};render=()=>{vm=game.snapshot();renderErrors();};globalThis.document={querySelectorAll:(selector)=>selector==='[data-action-error]'?[node]:[]};},
 click(dataset){requestAction({dataset});},refresh(){vm=game.snapshot();renderErrors();},errors:()=>ui.actionErrors,confirm(){dialog.confirm();},preview:()=>dialog?.preview,
 track(section,id,amount){settings.tracked=createTrackedGoal(vm,section,id,amount);},goal:()=>trackedGoal(vm,settings.tracked),markup(section,id){return actionButtons(vm[section].find(c=>c.id===id),section);}
};`;
const {fixture}=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
const scenario=edit=>{const state=createState(12,1);edit(state);return createGame({save:serialize(state,1),now:1,storage:null});};

test('森林批量失败就地保留实际总缺口，物资足够后清除',()=>{
 const game=scenario(s=>{s.resources.honey=15;});const node={dataset:{actionError:'buildings:hive'},hidden:true,innerHTML:''};
 try{fixture.init(game,node);fixture.click({act:'build',id:'hive',section:'buildings',amount:'5'});assert.equal(node.hidden,false);assert.match(node.innerHTML,/蜂蜜还差 48.53/);assert.match(node.innerHTML,/返回家园采蜜/);
 fixture.refresh();assert.equal(node.hidden,false);for(let n=0;n<60;n++)game.act('gather','honey');fixture.refresh();assert.equal(node.hidden,true);assert.equal(fixture.errors()['buildings:hive'],undefined);
 }finally{delete globalThis.document;}
});

test('森林主操作区直接提供最大数量，确认数量与配方目标累计一致',()=>{
 const game=scenario(s=>{s.resources.honey=1000;});const node={dataset:{actionError:'crafts:wood'},hidden:true,innerHTML:''};
 try{fixture.init(game,node);assert.match(fixture.markup('crafts','wood'),/option value="max"/);fixture.track('crafts','wood',5);fixture.click({act:'refine',id:'wood',section:'crafts',amount:'5'});assert.equal(fixture.preview().count,5);assert.equal(fixture.goal().progress,0);fixture.confirm();assert.equal(fixture.goal().progress,5);assert.equal(fixture.goal().done,true);assert.equal(game.snapshot().resources.find(r=>r.id==='wood').value,5);
 }finally{delete globalThis.document;}
});
