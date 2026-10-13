import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame,catalog} from '../src/engine/index.js';
import {createState,serialize} from '../src/engine/save.js';
import {page,explorationMenu,systemOpen,gameNav,world,settingsDialog} from '../src/ui/render.js';
import {geographicRegions} from '../src/ui/districts.js';

const fixture=(developed=false)=>{const s=createState(17,0);s.settings.paused=true;if(developed){for(const b of catalog.buildings)s.buildings[b.id]=1;for(const c of catalog.science)s.science[c.id]=true;for(const c of catalog.space)s.space[c.id]=1;for(const c of catalog.time)s.time[c.id]=1;s.discoveries.lizards=true;s.ironWill=false;}return createGame({storage:null,save:serialize(s,0),now:0}).snapshot();};
const ui=(pageName,extra={})=>({page:pageName,district:'village',system:'',region:'',regionSite:'',...extra});
const sheet=html=>html.split('<div class="game-sheet-body">')[1]||'';

test('More is a compact illustrated function hub, without the world map',()=>{
 for(const vm of [fixture(),fixture(true)]){
  const before=JSON.stringify(vm),html=sheet(page(vm,ui('more')));
  assert.match(html,/<h1>更多<\/h1>/);
  assert.match(html,/class="more-hub" aria-label="更多功能"/);
  assert.match(html,/class="more-hub-art"/);
  assert.doesNotMatch(html,/world-map|data-home-region|data-nav="map"|data-command="explore-menu"/);
  assert.equal(JSON.stringify(vm),before);
 }
});

test('More shows every unlocked system exactly once, even when a geographic region exists',()=>{
 for(const vm of [fixture(),fixture(true)]){
  const html=explorationMenu(vm),ids=[...html.matchAll(/data-system="([^"]+)"/g)].map(m=>m[1]);
  const expected=['crafts','trades','faith','space','challenges','prestige','achievements'].filter(id=>systemOpen(vm,id));
  assert.deepEqual(ids.sort(),expected.sort());
  assert.equal(ids.length,new Set(ids).size);
  for(const command of ['journal','help','settings'])assert.equal([...html.matchAll(new RegExp('data-command="'+command+'"','g'))].length,1);
  assert.doesNotMatch(html,/aria-disabled|data-act=|data-command="reset"|data-unassigned-art/);
 }
});

test('world map is standalone, maintains canonical geographic targets, and returns home',()=>{
 const vm=fixture(true),html=page(vm,ui('map')),body=sheet(html);
 assert.match(html,/sheet-map explore-overview map-overview/);
 assert.match(html,/aria-label="世界地图"/);
 assert.match(body,/<h1>世界地图<\/h1>/);
 assert.match(html,/class="sheet-close icon-button" data-nav="home"/);
 assert.doesNotMatch(body,/more-hub|data-system=|explore-menu/);
 const targets=[...body.matchAll(/data-home-region="([^"]+)"/g)].map(m=>m[1]);
 assert.deepEqual(targets,geographicRegions(vm).map(r=>r.id));
 assert.match(world(vm,ui('home')),/data-nav="map" aria-label="打开世界地图"/);
 assert.match(page(vm,ui('map',{reuseMap:true})),/data-map-placeholder/);
 assert.doesNotMatch(page(vm,ui('more',{reuseMap:true})),/data-map-placeholder/);
});

test('map highlights Home, More remains independent, and system back buttons return to More',()=>{
 assert.match(gameNav(ui('map'),'home'),/class="active" aria-current="page"/);
 assert.doesNotMatch(gameNav(ui('map'),'more'),/aria-current/);
 assert.match(gameNav(ui('more'),'more'),/class="active" aria-current="page"/);
 assert.match(gameNav(ui('more'),'more'),/<span>更多<\/span>/);
 const vm=fixture(true);
 for(const id of ['crafts','trades','faith','space','challenges','prestige','achievements'].filter(id=>systemOpen(vm,id))){const html=sheet(page(vm,ui('more',{system:id})));assert.match(html,/data-system=""[^>]*>[\s\S]*?返回更多<\/button>/);assert.doesNotMatch(html,/返回大地图|返回探索/);}
 assert.match(settingsDialog(vm,{}),/v6\.5\.2/);
});
