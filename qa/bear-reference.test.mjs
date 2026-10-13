import test from 'node:test';
import assert from 'node:assert/strict';
import {art,sceneArt,RESOURCE_CELLS} from '../src/ui/render.js';
import {bearAtlas} from '../src/ui/bear-art.js';

test('bear identity is shared by mascot, resident and resource aliases',()=>{
 for(const [id,cell] of Object.entries(RESOURCE_CELLS))if(cell==='bear')assert.match(art('resource',id),/reference-bear-art/);
 assert.doesNotMatch(art('resource','honey'),/reference-bear-art/);
 assert.doesNotMatch(art('building','hut'),/reference-bear-art/);
});
test('all working and resting frames use reference character atlas',()=>{
 for(const key of ['idleWalk','logCarry','logLift','honeyStand','honeyTend','readBook','turnPage','pickDown','pickUp','wrenchDown','wrenchUp'])assert.match(sceneArt('workers',key),/reference-bear-art/);
});
test('sixteen character crops stay within alpha atlas',()=>{
 assert.equal(Object.keys(bearAtlas.crops).length,16);
 for(const c of Object.values(bearAtlas.crops)){assert.ok(c.x>=0&&c.y>=0&&c.width>0&&c.height>0);assert.ok(c.x+c.width<=bearAtlas.width&&c.y+c.height<=bearAtlas.height);}
 for(const [a,b] of [['logCarry','logLift'],['honeyStand','honeyTend'],['readBook','turnPage'],['pickDown','pickUp'],['wrenchDown','wrenchUp']]){assert.equal(bearAtlas.crops[a].width,bearAtlas.crops[b].width);assert.equal(bearAtlas.crops[a].height,bearAtlas.crops[b].height);}
});
