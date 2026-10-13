import test from 'node:test';import assert from 'node:assert/strict';
import {art,sceneArt} from '../src/ui/render.js';import {hiveAtlas} from '../src/ui/hive-art.js';
test('basic previews and expanded apiary use redesigned wooden hives',()=>{assert.match(art('building','hive'),/data-art-key="beehive"/);assert.match(sceneArt('buildings','apiary'),/data-art-key="apiary"/);for(const c of Object.values(hiveAtlas.crops))assert.ok(c.x>=0&&c.y>=0&&c.x+c.width<=hiveAtlas.width&&c.y+c.height<=hiveAtlas.height);});
