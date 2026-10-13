import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame,catalog} from '../src/engine/index.js';
import {createState,serialize} from '../src/engine/save.js';
import {ambassadorLimit,ambassadorOutput,goodsProbability,spiceProbability,tradeVolume} from '../src/engine/diplomacy.js';

const close=(actual,expected,tolerance=1e-9)=>assert.ok(Math.abs(actual-expected)<tolerance,`${actual} != ${expected}`);
const base=()=>{const s=createState(17,1);s.ironWill=false;return s;};
const fixture=edit=>{const s=base();edit(s);return createGame({save:serialize(s,1),storage:null,now:1});};
const raw=game=>JSON.parse(game.export());
const envoy=id=>({id,name:`使节 ${id}`,job:'ambassador',rank:0,experience:0,skills:{},trait:'none'});
const context=state=>({state,isChallenge:()=>false,skillBonus:()=>0});

test('one fully funded unskilled ambassador has exact upkeep and four contribution rates',()=>{
  const s=base();s.bears=[envoy(1)];s.resources.culture=100;s.resources.spice=10;
  const result=ambassadorOutput(context(s),{},1);
  close(result.culture,20);close(result.spice,.8);close(result.tradeVolume,.0007);
  close(result.embassyEffectCap,.00133);close(result.tradeBlueprintChance,.00008);
  close(result.tradeSpiceChance,.00009);close(result.tradeNormalResChance,.00003);
});

test('ambassador shortfall reduces all contributions and both payments to the scarcest input ratio',()=>{
  const s=base();s.bears=[envoy(1)];s.resources.culture=10;s.resources.spice=10;
  const result=ambassadorOutput(context(s),{},1);
  close(result.paid,.5);close(result.culture,10);close(result.spice,.4);
  close(result.tradeVolume,.00035);close(result.tradeBlueprintChance,.00004);
  s.resources.spice=0;
  const empty=ambassadorOutput(context(s),{},1);
  close(empty.culture,0);close(empty.tradeVolume,0);close(empty.tradeNormalResChance,0);
});

test('ambassador upkeep growth begins after five, and treaties scale rank before upkeep',()=>{
  const s=base();s.bears=Array.from({length:6},(_,i)=>envoy(i+1));s.resources.culture=1e6;s.resources.spice=1e6;
  let result=ambassadorOutput(context(s),{},1);
  close(result.culture,6*20*1.025);close(result.spice,6*.8*1.001);
  s.bears=[{...envoy(1),rank:2}];
  result=ambassadorOutput(context(s),{ambassadorBoostPerRank:.1},1);
  close(result.strength,1.2);close(result.culture,24);close(result.spice,.96);
});

test('ambassador slots require the perk, count known ordinary partners, and retain an energized elder slot',()=>{
  const s=base();s.discoveries={lizards:true,sharks:true,leviathans:true};s.embassies={lizards:49,sharks:51};
  assert.equal(ambassadorLimit(s),0);
  s.metaphysics.ambassadors=true;
  assert.equal(ambassadorLimit(s),2);
  assert.equal(ambassadorLimit(s,{embassiesPerAmbassadorSlot:50}),4);
  s.elderState.energy=1;s.discoveries.leviathans=false;
  assert.equal(ambassadorLimit(s),3);
});

test('advanced goods need both embassy level and resource eligibility',()=>{
  const s=base(),partner={id:'lizards',embassyCost:100},good={id:'beam',minLevel:5,chance:.25};
  s.embassies.lizards=4;s.resourceUnlocked.beam=true;
  close(goodsProbability(s,partner,good,{}),0);
  s.embassies.lizards=5;s.resourceUnlocked.beam=false;
  close(goodsProbability(s,partner,good,{}),0);
  s.resourceUnlocked.beam=true;
  close(goodsProbability(s,partner,good,{}),.2625);
  s.ironWill=true;
  close(goodsProbability(s,partner,good,{}),.253125);
});

test('coal uranium and elder goods bypass resource discovery, but negative chances still need envoys',()=>{
  const s=base(),ordinary={id:'nagas',embassyCost:500};
  for(const id of ['coal','uranium'])close(goodsProbability(s,ordinary,{id,chance:.5},{}),.5);
  close(goodsProbability(s,{id:'leviathans',embassyCost:null},{id:'relic',chance:.05},{}),.05);
  s.resourceUnlocked.oil=true;
  close(goodsProbability(s,ordinary,{id:'oil',chance:-.01},{}),0);
  close(goodsProbability(s,ordinary,{id:'oil',chance:-.01},{tradeNormalResChance:.03}),.02);
});

test('spice embassy bonus is multiplicative, can exceed one, and is quarter-strength in Iron Will',()=>{
  const s=base(),partner={id:'lizards',embassyCost:100};s.embassies.lizards=300;
  close(spiceProbability(s,partner,{}),1.4);
  s.ironWill=true;close(spiceProbability(s,partner,{}),.6125);
  close(spiceProbability(s,{id:'leviathans',embassyCost:null},{}),.35);
  close(tradeVolume({tradeVolume:.2},{tradeVolume:.5}),1.8);
});

test('spice probability above one becomes a guaranteed proportionally larger return',()=>{
  const n=20000,game=fixture(s=>{s.discoveries.sharks=true;s.embassies.sharks=300;s.resources.manpower=50*n;s.resources.gold=15*n;s.resources.iron=100*n;});
  const outcome=game.act('trade','sharks',n);
  assert.equal(outcome.success,n);
  close(outcome.gains.spice/n,70,.4);
  assert.ok(outcome.gains.spice>=35*n&&outcome.gains.spice<105*n);
});

test('elder energy multiplies ordinary returns while shortening only successful visit trades',()=>{
  const n=20000,game=fixture(s=>{s.discoveries.leviathans=true;s.elderState={energy:10,duration:10000};s.resources.manpower=50*n;s.resources.gold=15*n;s.resources.unobtainium=5000*n;});
  const outcome=game.act('trade','leviathans',n);
  assert.equal(outcome.success,n);
  close(outcome.gains.timeCrystal/n,.25*.98*1.2,.002);
  assert.equal(raw(game).elderState.duration,1400);
  assert.equal(raw(game).elderState.energy,10);
});

test('advanced partner catalogs expose tier boundaries rather than only first-tier goods',()=>{
  const partner=id=>catalog.trades.find(d=>d.id===id);
  assert.equal(partner('lizards').goods.find(d=>d.id==='beam').minLevel,5);
  assert.equal(partner('sharks').goods.find(d=>d.id==='plastic').minLevel,40);
  assert.equal(partner('nagas').goods.find(d=>d.id==='thorium').minLevel,55);
  assert.equal(partner('zebras').goods.find(d=>d.id==='unobtainium').minLevel,80);
});
