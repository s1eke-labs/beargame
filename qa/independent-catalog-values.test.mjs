import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {catalog} from '../src/engine/index.js';
import {createState} from '../src/engine/save.js';
import {resolvedBuilding} from '../src/engine/building-stages.js';

const facts=JSON.parse(readFileSync(new URL('./fixtures/reference-numeric-facts.json',import.meta.url),'utf8'));
const catalogs={missions:'space',transcendence:'faith',mythic:'faith'};
for(const [group,items] of Object.entries(facts.groups)){
  test(`factual numeric catalogue: ${items.length} ${group} base prices and declared ratios`,()=>{
    for(const expected of items){
      let actual;
      if(group==='stages'){
        const state=createState(17,1);state.buildingStages[expected.id]=1;
        actual=resolvedBuilding(state,catalog.buildings.find(d=>d.id===expected.id));
      }else actual=catalog[catalogs[group]||group].find(d=>d.id===expected.id);
      const label=`${group}/${expected.id} (${expected.source})`;
      assert.ok(actual,`${label}: missing`);
      assert.deepEqual(actual.cost,expected.cost,`${label}: price`);
      if(expected.ratio===null)assert.equal(actual.oneTime,true,`${label}: non-repeatable`);
      else if(expected.ratio!==undefined)assert.equal(actual.ratio,expected.ratio,`${label}: geometric multiplier`);
      if(expected.amount!==undefined)assert.equal(actual.amount,expected.amount,`${label}: output`);
    }
  });
}

test('default-off unfinished space placeholders are excluded from the playable catalog',()=>{
  for(const id of facts.excludedDefaultOff)assert.equal(catalog.space.some(d=>d.id===id),false,id);
});
