import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {createGame,loadGame} from '../src/engine/index.js';
import {createState} from '../src/engine/save.js';
import {catalog} from '../src/engine/catalog.js';
import {triangularInverse} from '../src/engine/math.js';
import {isGiftSeason,giftMarkerCap,seasonalGiftKind,actSeasonalGifts} from '../src/engine/seasonal-gifts.js';

const local=(year,month,day,hour=12)=>new Date(year,month-1,day,hour).getTime();
const OCT=local(2026,10,8),DEC=local(2026,12,20),JAN=local(2027,1,1);
const raw=g=>JSON.parse(g.export());
const near=(a,b)=>assert.ok(Math.abs(a-b)<=1e-10*Math.max(1,Math.abs(b)),`${a} != ${b}`);
function fixture(edit=()=>{},now=OCT){const s=createState(12345,OCT);s.resources.elderBox=1;edit(s);return createGame({storage:null,save:JSON.stringify(s),now});}
function open(g,kind){const result=g.act('openGift','elderBox');assert.equal(result.ok,true,result.message);assert.equal(result.gift,kind);return result;}
function context(s,overrides={}){
 const resources=Object.fromEntries(catalog.resources.map(r=>[r.id,r]));
 const caps=Object.fromEntries(catalog.resources.map(r=>[r.id,r.cap]));caps.sorrow=17;
 return {state:s,catalog,resourceById:resources,now:()=>OCT,effects:()=>({}),production:()=>({caps}),
  enabledCount:id=>s.disabled[id]?0:Math.min(s.buildings[id]||0,s.activeBuildings[id]??s.buildings[id]??0),
  result:(ok,message,extra={})=>({ok,message,...extra}),invalidateEffects(){},log(){},
  add(id,quantity,p){s.resources[id]=Math.max(0,Math.min(p.caps[id]===null?Infinity:Math.max(p.caps[id],s.resources[id]),s.resources[id]+quantity));if(quantity>0)s.resourceUnlocked[id]=true;},
  ...overrides};
}

test('gift season uses local December 15–31 inclusive, with exact midnight boundaries',()=>{
 for(const [stamp,expected]of [
  [local(2026,12,14,23)+59*60000+59999,false],
  [local(2026,12,15,0),true],[local(2026,12,31,23)+59*60000+59999,true],
  [local(2027,1,1,0),false],[OCT,false],[local(2028,12,15,0),true],
 ])assert.equal(isGiftSeason(stamp),expected);
 assert.equal(isGiftSeason(NaN),false);
});

test('date interpretation follows browser-local timezone rather than UTC or game calendar',()=>{
 const url=new URL('../src/engine/seasonal-gifts.js',import.meta.url).href;
 const source=`import {isGiftSeason} from ${JSON.stringify(url)};console.log(JSON.stringify([isGiftSeason(Date.parse('2026-12-14T16:00:00Z')),isGiftSeason(Date.parse('2027-01-01T04:00:00Z'))]));`;
 for(const [TZ,want]of [['Asia/Tokyo',[true,false]],['America/Los_Angeles',[false,true]]]){
  const out=spawnSync(process.execPath,['--input-type=module','-e',source],{env:{...process.env,TZ},encoding:'utf8'});
  assert.equal(out.status,0,out.stderr);assert.deepEqual(JSON.parse(out.stdout),want);
 }
 const g=fixture(s=>{s.calendar.season=3;s.calendar.day=99;},OCT);assert.equal(g.snapshot().gifts.seasonActive,false);
});

test('startup gives a box only during the gift season and only if none is held',()=>{
 for(const [now,want]of [[OCT,0],[local(2026,12,14),0],[local(2026,12,15),1],[local(2026,12,31),1],[JAN,0]]){
  const g=createGame({storage:null,now});assert.equal(raw(g).resources.elderBox,want);
 }
 for(const boxes of [.25,1,2]){
  const g=fixture(s=>{s.resources.elderBox=boxes;},DEC);assert.equal(raw(g).resources.elderBox,boxes);
 }
 const g=fixture(s=>{s.resources.elderBox=0;s.resources.wrappingPaper=7;},DEC);
 assert.equal(raw(g).resources.elderBox,1);assert.equal(raw(g).resourceUnlocked.elderBox,true);
 assert.equal(raw(g).resources.wrappingPaper,7);
 const reload=createGame({storage:null,save:g.export(),now:DEC});assert.equal(raw(reload).resources.elderBox,1);
 const withoutBox=raw(reload);withoutBox.resources.elderBox=0;
 assert.equal(raw(createGame({storage:null,save:JSON.stringify(withoutBox),now:DEC})).resources.elderBox,1);
 assert.equal(Object.keys(raw(g)).some(key=>/giftYear|claimYear|eldermass/i.test(key)),false);
});

test('fractional boxes repair only on a non-seasonal initial load',()=>{
 for(const [held,want]of [[0,0],[.01,1],[.75,1],[1,1],[1.75,1.75],[2,2]]){
  const g=fixture(s=>{s.resources.elderBox=held;},JAN);assert.equal(raw(g).resources.elderBox,want);
 }
 const g=fixture(s=>{s.resources.elderBox=.5;},DEC);
 assert.equal(raw(g).resources.elderBox,.5);
 assert.equal(raw(createGame({storage:null,save:g.export(),now:JAN})).resources.elderBox,1);
});

test('grant check runs at boot, not during ticking, import, reset, or every snapshot',()=>{
 let now=OCT;const g=createGame({storage:null,now:()=>now});now=DEC;
 g.tick(.2);g.snapshot();assert.equal(raw(g).resources.elderBox,0);
 assert.equal(g.importSave(g.export()).ok,true);assert.equal(raw(g).resources.elderBox,0);
 assert.equal(g.act('reset','confirm').ok,true);assert.equal(raw(g).resources.elderBox,0);
 const loaded=loadGame({storage:{getItem:()=>g.export(),setItem(){}},now:()=>now});
 assert.equal(raw(loaded).resources.elderBox,1);
});

test('season blocks the village card and opening, then local January 1 enables it',()=>{
 let now=DEC;const g=fixture(()=>{},()=>now);
 assert.deepEqual(g.snapshot().gifts.cards,[]);
 const before=g.export();assert.equal(g.act('openGift','elderBox').ok,false);assert.equal(g.export(),before);
 now=JAN;const card=g.snapshot().gifts.cards[0];
 assert.equal(card.type,'openGift');assert.equal(card.id,'elderBox');assert.equal(card.visible,true);assert.equal(card.available,true);
 assert.match(card.confirmationText,/1 个远古礼盒/);open(g,'karma');assert.deepEqual(g.snapshot().gifts.cards,[]);
});

test('gift priority chooses each of the nine branches by overriding all earlier eligibility',()=>{
 const s=createState(123,OCT),ctx=context(s);s.resources.elderBox=1;
 assert.equal(seasonalGiftKind(ctx),'karma');
 s.resources.paragon=100;assert.equal(seasonalGiftKind(ctx),'paragon');
 s.resources.timeCrystal=1;s.metaphysics.anachronomancy=true;s.workshop.stasisChambers=true;
 assert.equal(seasonalGiftKind(ctx),'timeCrystal');
 s.metaphysics.megalomania=true;assert.equal(seasonalGiftKind(ctx),'sorrow');
 s.religion.apocripha=1;assert.equal(seasonalGiftKind(ctx),'apocrypha');
 s.religion.transcendence=1;s.transcendence=10;assert.equal(seasonalGiftKind(ctx),'transcendence');
 s.metaphysics.engeneering=true;assert.equal(seasonalGiftKind(ctx),'metaphysics');
 s.buildings.chronosphere=1;assert.equal(seasonalGiftKind(ctx),'compendiums');
 s.elderState.energy=5;assert.equal(seasonalGiftKind(ctx),'burnedParagon');
 s.elderState.energy=5.001;assert.equal(seasonalGiftKind(ctx),'compendiums');
 s.disabled.chronosphere=true;assert.equal(seasonalGiftKind(ctx),'metaphysics');
 s.metaphysics.renaissance=true;assert.equal(seasonalGiftKind(ctx),'transcendence');
 s.transcendence=11;assert.equal(seasonalGiftKind(ctx),'apocrypha');
 s.religion.apocripha=0;assert.equal(seasonalGiftKind(ctx),'sorrow');
 s.resources.sorrow=17/4;assert.equal(seasonalGiftKind(ctx),'timeCrystal');
 s.workshop.stasisChambers=false;assert.equal(seasonalGiftKind(ctx),'paragon');
 s.resources.paragon=99.999;assert.equal(seasonalGiftKind(ctx),'karma');
});

test('karma gift applies the strict 50 threshold, 5,000 base, 25 multiplier and 25,000 ceiling',()=>{
 for(const [karma,kittens,delta]of [[0,0,5000],[50,6375,5000],[50.001,6376,159400],[200,25000,625000],[300,30000,625000]]){
  const g=fixture(s=>{s.resources.karma=karma;s.karmaKittens=kittens;});open(g,'karma');
  near(raw(g).karmaKittens,kittens+delta);near(raw(g).resources.karma,triangularInverse((kittens+delta)/5));
 }
});

test('paragon gift has a strict 500 breakpoint and a 1,000 grant ceiling',()=>{
 for(const [before,delta]of [[100,100],[500,100],[500.5,500.5],[1000,1000],[1500,1000]]){
  const g=fixture(s=>{s.resources.paragon=before;});open(g,'paragon');near(raw(g).resources.paragon,before+delta);
 }
});

test('time crystal gift requires both unlocks and stock, with strict 100 and 2,000 boundaries',()=>{
 for(const [before,delta]of [[1,50],[100,50],[100.5,100.5],[2000,2000],[3000,2000]]){
  const g=fixture(s=>{s.resources.timeCrystal=before;s.metaphysics.anachronomancy=true;s.workshop.stasisChambers=true;});
  open(g,'timeCrystal');near(raw(g).resources.timeCrystal,before+delta);
 }
 for(const missing of ['stock','perk','workshop']){
  const g=fixture(s=>{s.resources.timeCrystal=missing==='stock'?0:1;s.metaphysics.anachronomancy=missing!=='perk';s.workshop.stasisChambers=missing!=='workshop';});open(g,'karma');
 }
});

test('sorrow gift fills current cap, requires below 25%, megalomania, and fewer than 3 pyramids',()=>{
 const g=fixture(s=>{s.religion.blackCore=3;s.religion.blackPyramid=2;s.resources.sorrow=4.999;s.metaphysics.megalomania=true;});
 const result=open(g,'sorrow');near(result.rewards.sorrow,15.001);near(raw(g).resources.sorrow,20);
 for(const setup of [s=>{s.resources.sorrow=17/4;},s=>{s.religion.blackPyramid=3;},s=>{s.metaphysics.megalomania=false;}]){
  const other=fixture(s=>{s.metaphysics.megalomania=true;setup(s);});open(other,'karma');
 }
});

test('apocrypha gift raises epiphany by 5 or four times its current value, capped at 4,000',()=>{
 for(const [before,delta]of [[0,5],[10,5],[10.5,42],[1000,4000],[1500,4000]]){
  const g=fixture(s=>{s.religion.apocripha=1;s.faithRatio=before;});open(g,'apocrypha');near(raw(g).faithRatio,before+delta);
  near(g.snapshot().progression.praiseMultiplier,1+triangularInverse((before+delta)/.1)*.1);
 }
});

test('transcendence gift adds four tiers through starting tier 10 and does not change paid price',()=>{
 for(const tier of [0,6,10]){
  const g=fixture(s=>{s.religion.transcendence=1;s.transcendence=tier;s.transcendencePrice=42;s.faithRatio=50;});
  open(g,'transcendence');assert.equal(raw(g).transcendence,tier+4);assert.equal(raw(g).transcendencePrice,42);assert.equal(raw(g).faithRatio,50);
 }
 const g=fixture(s=>{s.religion.transcendence=1;s.religion.apocripha=1;s.transcendence=11;});open(g,'apocrypha');
});

test('metaphysics gift follows the four real perks deterministically, spends no paragon, and unlocks successors',()=>{
 const sequence=['goldenRatio','divineProportion','vitruvianFeline','renaissance'];
 const g=fixture(s=>{s.resources.elderBox=4;s.resources.paragon=100;s.metaphysics.engeneering=true;s.science.metaphysics=true;});
 const rng=raw(g).rng;
 for(const [i,id]of sequence.entries()){
  const result=open(g,'metaphysics');assert.equal(result.rewards.metaphysics,id);
  assert.equal(raw(g).metaphysics[id],true);assert.equal(raw(g).resources.paragon,100);assert.equal(raw(g).rng,rng);
  if(i<3)assert.equal(g.snapshot().progression.metaphysics.find(d=>d.id===sequence[i+1]).unlocked,true);
 }
 const full=fixture(s=>{s.metaphysics.engeneering=true;for(const id of sequence)s.metaphysics[id]=true;});
 open(full,'karma');assert.equal(raw(full).rng,12345);
});

test('missing metaphysics catalog candidates never create a phantom perk or consume the gift',()=>{
 const s=createState(123,OCT);s.resources.elderBox=1;s.metaphysics.engeneering=true;
 const ctx=context(s,{catalog:{...catalog,metaphysics:[]}}),before=structuredClone(s);
 const result=actSeasonalGifts(ctx,'openGift','elderBox');assert.equal(result.ok,false);assert.deepEqual(s,before);
 assert.equal(actSeasonalGifts(ctx,'unrelated','elderBox'),undefined);
});

test('compendium gift has strict 500,000 breakpoint, while necrocorns use the greater of 10 and held stock',()=>{
 for(const [before,delta,necrocorns,gain]of [[0,100000,0,10],[500000,100000,8,10],[500001,2000004,15,15]]){
  const g=fixture(s=>{s.buildings.chronosphere=1;s.resources.compendium=before;s.resources.necrocorn=necrocorns;});
  open(g,'compendiums');near(raw(g).resources.compendium,before+delta);near(raw(g).resources.necrocorn,necrocorns+gain);
 }
});

test('compendium necrocorns include both geometric construction totals without live discounts',()=>{
 const g=fixture(s=>{s.buildings.chronosphere=1;s.religion.unicornGraveyard=3;s.religion.unicornNecropolis=2;s.resources.necrocorn=1;s.challengeCompletions.unicornTears=20;});
 const expected=5*(1+1.15+1.15**2)+15*(1+1.15);const result=open(g,'compendiums');
 near(result.rewards.necrocorn,expected);near(raw(g).resources.necrocorn,1+expected);
 const off=fixture(s=>{s.buildings.chronosphere=2;s.activeBuildings.chronosphere=0;});open(off,'karma');
});

test('burned paragon gift uses strict 500 and 1,500 grant limits and exact elder energy equality',()=>{
 for(const [before,delta]of [[0,150],[500,150],[500.25,500.25],[1500,1500],[2000,1500]]){
  const g=fixture(s=>{s.elderState.energy=5;s.resources.burnedParagon=before;});open(g,'burnedParagon');near(raw(g).resources.burnedParagon,before+delta);
 }
 for(const energy of [4.999,5.001,6]){const g=fixture(s=>{s.elderState.energy=energy;});open(g,'karma');}
});

test('elder energy cap includes effective markers, black sky reward suppression and energy modifier',()=>{
 const s=createState(123,OCT);s.religion.marker=2;s.challengeCompletions.blackSky=5;
 const ctx=context(s,{effects:()=>({leviathansEnergyModifier:.2})});
 assert.equal(giftMarkerCap(ctx),24);s.elderState.energy=24;assert.equal(seasonalGiftKind(ctx),'burnedParagon');
 s.activeChallenges=['blackSky'];assert.equal(giftMarkerCap(ctx),18);assert.equal(seasonalGiftKind(ctx),'karma');
 const g=fixture(s=>{s.religion.marker=2;s.challengeCompletions.blackSky=5;s.elderState.energy=20;});open(g,'burnedParagon');
});

test('opening consumes one box and adds one paper every time; empty/unknown/batch requests are inert',()=>{
 const g=fixture(s=>{s.resources.elderBox=2;s.resources.wrappingPaper=3;});
 open(g,'karma');assert.equal(raw(g).resources.elderBox,1);assert.equal(raw(g).resources.wrappingPaper,4);
 open(g,'karma');assert.equal(raw(g).resources.elderBox,0);assert.equal(raw(g).resources.wrappingPaper,5);
 assert.equal(raw(g).resourceUnlocked.wrappingPaper,true);assert.equal(raw(g).log.filter(x=>x.text.includes('礼盒打开了')).length,2);
 for(const [id,amount]of [['elderBox',1],['unknown',1],['elderBox',2],['elderBox','max']]){
  const before=g.export();assert.equal(g.act('openGift',id,amount).ok,false);assert.equal(g.export(),before);
 }
});

test('imported positive fractional box remains openable until next initial-load repair',()=>{
 const g=fixture();const s=raw(g);s.resources.elderBox=.4;assert.equal(g.importSave(JSON.stringify(s)).ok,true);
 assert.equal(raw(g).resources.elderBox,.4);assert.equal(g.snapshot().gifts.cards[0].available,true);
 open(g,'karma');assert.equal(raw(g).resources.elderBox,0);assert.equal(raw(g).resources.wrappingPaper,1);
});

test('gift event resource gains obey capacity while retaining already-over-cap quantities',()=>{
 const s=createState(123,OCT);s.resources.elderBox=1;s.resources.paragon=500;
 const ctx=context(s);const p=ctx.production();p.caps.paragon=550;p.caps.wrappingPaper=0;ctx.production=()=>p;
 assert.equal(actSeasonalGifts(ctx,'openGift','elderBox').ok,true);assert.equal(s.resources.paragon,550);assert.equal(s.resources.wrappingPaper,0);
 s.resources.elderBox=1;s.resources.paragon=600;
 assert.equal(actSeasonalGifts(ctx,'openGift','elderBox').ok,true);assert.equal(s.resources.paragon,600);
});

test('unsafe enormous reward calculations preserve the entire gift transaction',()=>{
 for(const edit of [s=>{s.buildings.chronosphere=1;s.religion.unicornGraveyard=1000000;},s=>{s.buildings.chronosphere=1;s.resources.compendium=1e100;}]){
  const g=fixture(edit),before=g.export();assert.equal(g.snapshot().gifts.cards[0].available,false);
  assert.equal(g.act('openGift','elderBox').ok,false);assert.equal(g.export(),before);
 }
});

test('gift state and reward survive serialization and ordinary reset without a new grant',()=>{
 const g=fixture(s=>{s.resources.elderBox=2;s.resources.wrappingPaper=4;s.metaphysics.engeneering=true;});open(g,'metaphysics');
 const roundtrip=createGame({storage:null,save:g.export(),now:OCT});
 assert.equal(raw(roundtrip).resources.elderBox,1);assert.equal(raw(roundtrip).resources.wrappingPaper,5);assert.equal(raw(roundtrip).metaphysics.goldenRatio,true);
 assert.equal(roundtrip.act('reset','confirm').ok,true);
 assert.equal(raw(roundtrip).resources.elderBox,1);assert.equal(raw(roundtrip).resources.wrappingPaper,5);assert.equal(raw(roundtrip).metaphysics.goldenRatio,true);
 open(roundtrip,'metaphysics');assert.equal(raw(roundtrip).metaphysics.divineProportion,true);
});

test('pending offline work blocks card and open action, then settlement unlocks it',async()=>{
 const g=fixture();g._scheduleOffline(20);
 assert.equal(g.snapshot().gifts.cards[0].available,false);
 assert.equal(g.act('openGift','elderBox').ok,false);assert.equal(g.snapshot().resources.find(r=>r.id==='elderBox').value,1);
 const attempts=[];const result=await g.catchUpAsync(20,{onProgress(){
  attempts.push({available:g.snapshot().gifts.cards[0].available,ok:g.act('openGift','elderBox').ok});
 }});
 assert.equal(result.ok,true,result.message);assert.ok(attempts.length>0);
 assert.ok(attempts.every(x=>!x.available&&!x.ok));assert.equal(g.snapshot().gifts.cards[0].available,true);open(g,'karma');
});

test('ongoing asynchronous year jumps cannot open or consume a gift',async()=>{
 const g=fixture(s=>{s.science.chronophysics=true;s.resources.timeCrystal=1000;});
 const attempts=[];const result=await g.actAsync('shatter','year',100,{onProgress(){
  attempts.push({pending:g.snapshot().pendingOperation?.kind,available:g.snapshot().gifts.cards[0].available,ok:g.act('openGift','elderBox').ok});
 }});
 assert.equal(result.ok,true,result.message);assert.ok(attempts.length>0);
 assert.ok(attempts.every(x=>x.pending==='timeJump'&&!x.available&&!x.ok));
 assert.equal(raw(g).resources.elderBox,1);assert.equal(raw(g).resources.wrappingPaper,0);
 assert.equal(g.snapshot().gifts.cards[0].available,true);
});

test('gift remains one luxury after opening because box and paper share its happiness slot',()=>{
 const g=fixture(s=>{s.resources.paragon=100;});const before=g.snapshot().bears.happiness;
 open(g,'paragon');near(g.snapshot().bears.happiness,before);
});
