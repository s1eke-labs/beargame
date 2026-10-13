import {importModule,auditFile} from './audit-paths.mjs';
// SYNTHETIC CAPACITY / DEPENDENCY WITNESS, not an earned playthrough.
// Inventories are replenished only after a producer has been proven reachable,
// and capped stock is never replenished past the current derived storage cap.
// Time, resource yield and waiting cost are abstracted; research and build gates
// and purchase prices remain the actual production engine's public actions.
const {createGame,catalog}=await importModule('src/engine/index.js');
import fs from 'node:fs';
let game=createGame({storage:null,now:1,seed:17});
const sources=new Map([['honey','manual gather']]), events=[],limits=Object.fromEntries(catalog.buildings.map(d=>[d.id,200]));
for(const id of ['hive','pasture','aqueduct','mine','smelter','calciner','steamworks','magneto','lumberMill','workshop','factory','tradepost','unicornPasture','quarry','aiCore','brewery','zebraOutpost','zebraWorkshop','zebraForge','stasisPod','ivoryTemple'])limits[id]=1;
limits.warehouse=400;limits.harbor=200;limits.oilWell=300;limits.reactor=100;limits.accelerator=100;
const raw=()=>JSON.parse(game.export()), addSource=(id,via)=>{if(!sources.has(id)){sources.set(id,via);events.push({kind:'source',id,via});return true;}return false;};
let caps={}; const canUse=c=>c.unlocked&&c.costs.every(x=>sources.has(x.id)&&(caps[x.id]??Infinity)+1e-9>=x.value);
function refill(){const state=raw(),vm=game.snapshot();for(const r of vm.resources)state.resources[r.id]=sources.has(r.id)?Math.min(r.max??1e30,1e30):0;state.ironWill=false;state.calendar.year=20;
 for(const d of catalog.space.filter(d=>d.family==='mission'&&state.space[d.id])){state.spaceTravel[d.id]=0;state.spaceReached[d.id]=true;}
 if(sources.has('faith'))state.praised=1e6;
 const result=game.importSave(JSON.stringify(state));if(!result.ok)throw Error(result.message);}
function get(type,id){const v=game.snapshot();return (type==='build'?v.buildings:type==='research'?v.science:type==='upgrade'?v.workshop:type==='faith'?v.progression.faithCards:type==='space'?v.progression.spaceCards:[]).find(d=>d.id===id);}
let stopped=false, lastResearch=0;
for(let round=0;round<550;round++){
 let progress=0;refill();let v=game.snapshot(),s=raw(),cap=Object.fromEntries(v.resources.map(r=>[r.id,r.max]));caps=cap;
 if(s.buildings.library)progress+=addSource('science','library celestial observation');
 if(s.science.mining)progress+=addSource('minerals','mining meteor');
 for(const d of v.jobs)if(d.unlocked&&v.bears.max>0&&d.output)progress+=addSource(d.output,'job '+d.id+' with reachable housing');
 if(s.science.archery&&sources.has('manpower')&&cap.manpower>=100)for(const id of ['furs','ivory','unicorns'])progress+=addSource(id,'hunt');
 if(s.science.astronomy)progress+=addSource('starchart','astronomy celestial observation');
 if(s.buildings.smelter&&s.workshop.goldOre)progress+=addSource('gold','goldOre smelter');
 if(s.buildings.smelter&&s.workshop.coalFurnace||s.buildings.mine&&s.workshop.deepMining)progress+=addSource('coal','smelter/mine coal upgrade');
 for(const b of catalog.buildings)if(s.buildings[b.id]){for(const r of catalog.resources)if((b.effect?.[r.id]||0)>0)progress+=addSource(r.id,'building '+b.id);if(Object.keys(b.conversion?.input||{}).every(id=>sources.has(id)))for(const id of Object.keys(b.conversion?.output||{}))progress+=addSource(id,'conversion '+b.id);}
 if(s.buildings.quarry&&s.workshop.orbitalGeodesy)progress+=addSource('uranium','orbitalGeodesy quarry');
 for(const c of v.crafts)if(canUse(c))progress+=addSource(c.output,'craft '+c.id);
 const discovery={lizards:true,sharks:false,griffins:false,nagas:sources.has('culture')&&cap.culture>=1500,zebras:sources.has('ship'),spiders:sources.has('ship')&&cap.science>125000,dragons:!!s.science.nuclearFission};
 if(sources.has('manpower')&&cap.manpower>=1000)for(const[id,yes]of Object.entries(discovery))if(yes&&!s.discoveries[id]){s.discoveries[id]=true;progress++;}
 if(sources.has('manpower')&&sources.has('gold')&&cap.manpower>=50&&cap.gold>=15&&sources.has('minerals')&&cap.minerals>=1000){progress+=addSource('spice','ordinary trade');progress+=addSource('blueprint','ordinary trade');}
 if(s.discoveries.zebras&&sources.has('gold')&&cap.gold>=15&&sources.has('slab'))progress+=addSource('titanium','zebra trade after ship and exploration');
 if(s.discoveries.dragons&&sources.has('titanium')&&cap.titanium>=250)progress+=addSource('uranium','dragon trade');
 for(const b of catalog.space)if(s.space[b.id]){for(const id of Object.keys(b.production||{}))if(Object.keys(b.conversion?.input||{}).every(id=>sources.has(id)))progress+=addSource(id,'space '+b.id);if(b.effect?.antimatterPerYear)progress+=addSource('antimatter','sunlifter annual surplus energy');}
 if(s.buildings.ziggurat&&sources.has('unicorns')&&cap.unicorns===null)progress+=addSource('tears','2500-unicorn sacrifice');
 if(s.religion.skyPalace)progress+=addSource('alicorn','skyPalace rare arrival');
 if(s.buildings.ziggurat&&sources.has('alicorn'))progress+=addSource('timeCrystal','25-alicorn sacrifice');
 if(s.buildings.ziggurat&&sources.has('timeCrystal'))progress+=addSource('relic','25-timeCrystal sacrifice');
 if(s.buildings.chronosphere)progress+=addSource('void','chronosphere season-boundary paradox');
 if(s.science.calendar)progress+=addSource('temporalFlux','calendar offline flux');
 if(s.religion.marker&&sources.has('alicorn'))progress+=addSource('necrocorn','marker corruption');
 if(s.metaphysics.megalomania&&sources.has('tears'))progress+=addSource('sorrow','tear sacrifice');
 // No inherited or passive prestige stock is injected: this witness intentionally
 // checks the first non-prestige run capacity chain separately.
 game.importSave(JSON.stringify(s));refill();
 for(const type of ['research','upgrade','faith','space','build']){
  const defs={research:catalog.science,upgrade:catalog.workshop,faith:catalog.faith,space:catalog.space,build:catalog.buildings}[type];
  const phase=game.snapshot();caps=Object.fromEntries(phase.resources.map(r=>[r.id,r.max]));const cards=(type==='build'?phase.buildings:type==='research'?phase.science:type==='upgrade'?phase.workshop:type==='faith'?phase.progression.faithCards:phase.progression.spaceCards);for(const d of defs){const c=cards.find(c=>c.id===d.id);if(!c||c.completed||!c.unlocked)continue;
   if(type==='build'&&c.owned>=limits[d.id])continue;
   if(type==='faith'&&c.owned>=1)continue;
   if(type==='space'&&d.family==='building'&&c.owned>=100)continue;
   if(type==='faith'&&['transcendence','apocripha'].includes(d.id)){};
   if(!canUse(c))continue;refill();const r=game.act(type,d.id);if(r.ok){progress++;events.push({round,kind:type,id:d.id,owned:c.owned+1});}
  }
 }
 if(round%10===0){v=game.snapshot();console.log(JSON.stringify({round,research:v.science.filter(c=>c.completed).length,unlockedResources:sources.size,scienceCap:v.resources.find(r=>r.id==='science').max,progress}));}
 if(!progress){console.log('FIXED_POINT',round);stopped=true;break;}
}
refill();const v=game.snapshot();const report={scope:'SYNTHETIC dependency/capacity witness. Replenished stock, instant travel, and worship threshold; no earned-playtime or balanced production conclusion. No prestige stock injected.',sources:Object.fromEntries(sources),stopped,counts:{research:v.science.filter(c=>c.completed).length,workshop:v.workshop.filter(c=>c.completed).length,space:v.progression.spaceCards.filter(c=>c.owned).length},incompleteResearch:v.science.filter(c=>!c.completed).map(c=>({id:c.id,reason:c.reason,costs:c.costs.map(x=>({...x,max:v.resources.find(r=>r.id===x.id).max,sourced:sources.has(x.id)}))})),incompleteSpace:v.progression.spaceCards.filter(c=>!c.owned).map(c=>({id:c.id,reason:c.reason,costs:c.costs.map(x=>({...x,max:v.resources.find(r=>r.id===x.id).max,sourced:sources.has(x.id)}))})),events};fs.writeFileSync(auditFile('witness-primary-report.json'),JSON.stringify(report,null,2));fs.writeFileSync(auditFile('witness-primary-save.json'),game.export());console.log(JSON.stringify({counts:report.counts,incompleteResearch:report.incompleteResearch,incompleteSpace:report.incompleteSpace},null,2));
