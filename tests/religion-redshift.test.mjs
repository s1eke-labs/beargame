import test from 'node:test';
import assert from 'node:assert/strict';
import {onReligionRedshift} from '../src/engine/religion-redshift.js';

const near=(actual,expected,label)=>assert.ok(Math.abs(actual-expected)<1e-9,
 `${label}: expected ${expected}, got ${actual}`);

function simulate({days=10,ticks=days*10,herd=100,stock=0,progress=0,debt=0,
 pacts=0,rate=.1,siphoning=false,frenzy=false,faith=0,voidOrder=false,effects={}}={}){
 const state={
  resources:{alicorn:herd,necrocorn:stock,sorrow:0},
  religionCounters:{corruption:progress,pactDebt:debt},
  religion:{pactOfCleansing:pacts,siphoning:Number(siphoning),feedingFrenzy:Number(frenzy)},
  challengeCompletions:{},transcendence:0,faithRatio:0,praised:0,
  metaphysics:{voidOrder},
 };
 const ctx={state,effects:()=>({corruptionRatio:rate,...effects}),
  production:()=>({net:{faith},caps:{}})};
 onReligionRedshift(ctx,days,ticks);
 return {herd:state.resources.alicorn,stock:state.resources.necrocorn,
  progress:state.religionCounters.corruption,debt:state.religionCounters.pactDebt,
  praised:state.praised};
}

function matches(actual,expected){
 for(const [key,value] of Object.entries(expected))near(actual[key],value,key);
}

test('redshift switches to the slower rate after storing its first necrocorn',()=>{
 matches(simulate(),{herd:97,stock:3,progress:.25,debt:0});
});

test('redshift starting above the threshold uses the slower rate throughout',()=>{
 matches(simulate({stock:1}),{herd:98,stock:3,progress:.5,debt:0});
});

test('feeding frenzy moves the threshold to one and reduces both rates by ten percent',()=>{
 matches(simulate({frenzy:true}),{herd:97,stock:3,progress:.8025,debt:0});
});

test('bulk conversion preserves the last whole alicorn and one unit of progress',()=>{
 matches(simulate({herd:2}),{herd:1,stock:1,progress:1,debt:0});
});

test('bulk conversion preserves a positive fractional alicorn remainder',()=>{
 matches(simulate({herd:2.3}),{herd:.3,stock:2,progress:1,debt:0});
});

test('an empty herd preserves stored corruption but still incurs pact debt',()=>{
 matches(simulate({herd:0,progress:.7,debt:2,pacts:1}),
  {herd:0,stock:0,progress:.7,debt:2.005});
});

test('siphoning spends a generated whole unit against debt before storing necrocorns',()=>{
 matches(simulate({days:100,rate:.001,debt:1.2,pacts:1,siphoning:true}),
  {herd:99,stock:0,progress:0,debt:.25});
});

test('bulk pact repayment charges its surcharge and reduces debt separately',()=>{
 matches(simulate({days:100,herd:0,stock:3,debt:2,pacts:1,rate:0}),
  {herd:0,stock:2.9425,progress:0,debt:1.9925});
});

test('paradox days reduce upkeep while Void Order retains the full elapsed ticks',()=>{
 matches(simulate({days:110,herd:0,pacts:1,faith:2,voidOrder:true,
  effects:{temporalParadoxChance:1}}),
 {herd:0,stock:0,progress:0,debt:.05,praised:220});
});

test('pact consumption can cross below the threshold before corruption crosses back',()=>{
 matches(simulate({stock:.15,pacts:200,rate:.02}),
  {herd:99,stock:.125,progress:.175,debt:0});
});

test('siphoning shifts the threshold by projected debt and keeps fractional debt',()=>{
 matches(simulate({debt:1.2,pacts:1,siphoning:true}),
  {herd:96,stock:3,progress:0,debt:.205});
});

test('zero-rate siphoning leaves finite stocks and accumulates only upkeep',()=>{
 matches(simulate({rate:0,debt:1.2,pacts:1,siphoning:true}),
  {herd:100,stock:0,progress:0,debt:1.205});
});

test('a preserved final alicorn cannot stall remaining bulk upkeep',()=>{
 matches(simulate({herd:1,stock:.15,pacts:200,rate:.02}),
  {herd:1,stock:0,progress:1,debt:.85});
});

test('2,880 bounded long-horizon combinations remain finite and nonnegative',()=>{
 let checked=0;
 for(const herd of [0,1,1.25,100])
 for(const stock of [0,.2,1,1.3])
 for(const pacts of [0,1,200])
 for(const rate of [0,.000001,.01,.1,2])
 for(const debt of [0,.2,4])
 for(const siphoning of [false,true])
 for(const frenzy of [false,true]){
  const inputs={herd,stock,pacts,rate,debt,siphoning,frenzy,days:16000};
  const result=simulate(inputs);
  for(const [key,value] of Object.entries(result)){
   assert.ok(Number.isFinite(value)&&value>=-1e-8,
    `${key} must be finite and nonnegative: ${JSON.stringify({inputs,result})}`);
  }
  assert.ok(result.herd<=herd,'conversion must not increase its input stock');
  assert.ok(result.progress<=1,'unconverted corruption is bounded');
  checked++;
 }
 assert.equal(checked,2880);
});
