import test from 'node:test';import assert from 'node:assert/strict';
import {createGame,catalog} from '../src/engine/index.js';
import {createState,serialize} from '../src/engine/save.js';
import {page,cardsFor,discovered,explorationMenu} from '../src/ui/render.js';
import {createTab,sharedStorage,clickRendered,renderedButton} from './dom-harness.mjs';
const ui=(system,region='',regionSite='')=>({page:'more',system,region,regionSite,district:'home',regionCatalog:true});
const trade=s=>{s.ironWill=false;s.science.writing=true;s.discoveries.lizards=true;s.resources.culture=1000;};
const fixture=(edit=()=>{})=>{const s=createState(17,0);edit(s);return createGame({storage:null,save:serialize(s,0),now:0});};
const route=async(t,hash)=>{t.location.hash='#'+hash;await t.windowEvent('hashchange');};
test('reachable early trade fallback must expose unlocked embassy',()=>{
 const g=fixture(trade),v=g.snapshot();assert.ok(v.embassies.find(c=>c.id==='lizards').available);
 assert.match(explorationMenu(v),/data-system="trades"/);
 assert.match(page(v,ui('trades')),/data-act="embassy" data-id="lizards"/);
 assert.match(page(v,ui('trades','trades')),/data-act="embassy" data-id="lizards"/);
});
test('developed trade district preserves embassy controls after entry into main panel',()=>{
 const v=fixture(s=>{trade(s);s.buildings.harbor=1;s.buildings.tradepost=1;}).snapshot();
 const scene=page(v,ui('trades','trades'));assert.match(scene,/data-home-district="trades"/);assert.match(scene,/data-system="trades"/);assert.doesNotMatch(scene,/district-floor|data-act="embassy"/);
 assert.match(page(v,ui('trades','trades','main')),/data-act="embassy" data-id="lizards"/);
});
test('real handler on legacy trade route spends embassy culture and persists upgrade',async()=>{
 const t=await createTab(sharedStorage(trade));await route(t,'more/trades');
 await clickRendered(t,{act:'embassy',id:'lizards'});
 assert.equal(t.snapshot().embassies.find(c=>c.id==='lizards').owned,1);
 assert.equal(t.snapshot().resources.find(c=>c.id==='culture').value,900);
});
test('direct regional main cards preserve legacy action mapping for faith space time',()=>{
 const v=fixture(s=>{for(const c of catalog.science)s.science[c.id]=true;s.religion.apocripha=1;s.religion.transcendence=1;s.time.blastFurnace=1;}).snapshot();
 for(const id of ['faith','space','challenges']){
  const legacy=page(v,ui(id)),direct=page(v,ui(id,id));
  const actions=html=>[...html.matchAll(/data-act="([^"]+)" data-id="([^"]+)"/g)].map(x=>x[1]+':'+x[2]).sort();
  assert.deepEqual(actions(direct),actions(legacy),id);
 }
});
test('real faith confirmation cancel and Escape retain parent detail without spending',async()=>{
 const t=await createTab(sharedStorage(s=>{s.religion.apocripha=1;s.praised=1000;}));await route(t,'more/faith');
 await clickRendered(t,{detail:'progressionActions:adore'});
 const before=t.snapshot().progression.praised;
 await clickRendered(t,{act:'adore',id:'adore'},'#dialog-root');
 await clickRendered(t,{command:'cancel'},'#dialog-root');
 assert.match(t.doc.node('#dialog-root').innerHTML,/进行沉淀灵悟/);assert.equal(t.snapshot().progression.praised,before);
 await clickRendered(t,{act:'adore',id:'adore'},'#dialog-root');
 await t.event('keydown',{key:'Escape',preventDefault(){}});
 assert.match(t.doc.node('#dialog-root').innerHTML,/进行沉淀灵悟/);assert.equal(t.snapshot().progression.praised,before);
});
test('locked deep links never expose paid controls and retain home exit',()=>{
 const v=fixture().snapshot();for(const id of ['faith','space','challenges','prestige']){
  const html=page(v,ui(id));assert.doesNotMatch(html.split('<div class="game-sheet-body">')[1],/data-act=/,id);assert.match(html,/data-nav="home"/,id);
 }
});

test('crafts single-facility and developed routes both keep engineer controls',()=>{
 for(const developed of [false,true]){
 const v=fixture(s=>{s.science.mechanization=true;s.buildings.factory=1;s.buildings.workshop=1;if(developed)s.buildings.lumberMill=1;s.bears=[{id:1,name:'Engineer',job:'engineer',skills:{},rank:0,experience:0}];s.nextBearId=2;}).snapshot();
 const html=page(v,ui('crafts','crafts',developed?'main':''));
 assert.match(html,/data-act="engineerAssign" data-id="beam"/);
 }
});


test('challenge choices have individual accessible names and do not repeat their descriptions',async()=>{
 const {challengePanel}=await import('../src/ui/advanced.js');const html=challengePanel({progression:{challengeCards:[{id:'winterIsComing',name:'漫长寒冬',description:'始终处于冬季。',effects:'始终处于冬季。',unlocked:true,available:true,owned:0,pending:false},{id:'anarchy',name:'自在熊群',description:'技能暂不可用。',effects:'技能暂不可用。',unlocked:true,available:true,owned:0,pending:true}]}});
 assert.match(html,/aria-label="选择试炼：漫长寒冬"/);assert.match(html,/aria-label="取消选择：自在熊群"/);assert.equal(html.split('始终处于冬季。').length-1,1);
});
