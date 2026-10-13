import test from 'node:test';
import assert from 'node:assert/strict';
import {catalog as complete} from '../src/engine/catalog.js';
import {makeChapterCatalog} from '../scripts/releases/catalog.mjs';
import {profiles,releaseProfile} from '../scripts/releases/profiles.mjs';
test('forest numbers and prerequisites are projected from complete source without rebalancing',()=>{
 const {catalog}=makeChapterCatalog();
 for(const [section,defs] of Object.entries(catalog))for(const d of defs){const original=complete[section].find(x=>x.id===d.id);assert.ok(original);for(const key of ['cost','ratio','gate','conversion','output','amount','rate','cap','tier','difficulty'])assert.deepEqual(d[key],original[key],`${section}/${d.id}/${key}`);for(const [key,value] of Object.entries(d.effect||{}))assert.equal(value,original.effect[key]);}
 assert.equal(catalog.buildings.length,11);assert.equal(catalog.science.length,7);assert.equal(catalog.resources.length,11);
});
test('complete catalogue remains complete while unpublished profiles fail closed',()=>{
 assert.ok(complete.space.length>0);assert.ok(complete.time.length>0);assert.ok(complete.science.length>50);
 for(const chapter of ['settlement','industrial','space','time'])assert.throws(()=>releaseProfile(chapter),/not approved/);
 assert.throws(()=>releaseProfile('full'),/Unknown/);assert.throws(()=>releaseProfile('../full'),/Unknown/);
 assert.deepEqual(Object.values(profiles).map(p=>p.level),[1,2,3,4,5]);
});
test('chapter save namespace is stable across cumulative content upgrades and separate from legacy',()=>{
 const {constants,release}=makeChapterCatalog();assert.equal(constants.SAVE_KEY,'beargame.chapters.save.v1');assert.equal(release.family,'beargame-chapters');assert.equal(release.contentLevel,1);assert.equal(release.schema,1);
});
