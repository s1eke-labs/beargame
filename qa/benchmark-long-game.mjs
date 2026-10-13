/** CPU-only stress fixture. Does not measure browser layout, painting, or mobile hardware. */
import {performance} from 'node:perf_hooks';
import {writeFileSync} from 'node:fs';
import {createState,serialize} from '../src/engine/save.js';
import {createGame,catalog} from '../src/engine/index.js';
import {page} from '../src/ui/render.js';

function sample(fn){
  for(let i=0;i<5;i++)fn();
  const times=[];
  for(let i=0;i<30;i++){const started=performance.now();fn();times.push(performance.now()-started);}
  times.sort((a,b)=>a-b);
  return {median:times[15],p95:times[28],max:times[29]};
}
const results=[];
for(const population of [0,100,1000]){
  const state=createState(17,1);
  state.ironWill=false;
  state.science=Object.fromEntries(catalog.science.map(d=>[d.id,true]));
  state.workshop={register:true,neuralNetworks:true};
  state.resources.honey=1e10;state.resources.gold=1e10;
  state.buildings.hut=Math.ceil(population/2);
  state.bears=Array.from({length:population},(_,index)=>({id:index+1,name:`小熊 ${index+1}`,job:'woodcutter',trait:'none',rank:1,experience:1000,skills:{woodcutter:1000}}));
  state.nextBearId=population+1;state.leaderId=population||null;
  const game=createGame({save:serialize(state,1),storage:null,now:1});
  const snapshot=game.snapshot();
  const ui={page:'village',system:null,buildFilter:'all',researchTab:'science',reducedMotion:false,rosterPage:0};
  results.push({population,leadershipCardCount:snapshot.leadership?.cards?.length??null,snapshotCharacters:JSON.stringify(snapshot).length,villageHTMLCharacters:page(snapshot,ui).length,snapshotMs:sample(()=>game.snapshot()),renderStringMs:sample(()=>page(snapshot,ui)),singleTickMs:sample(()=>game.tick(.2))});
}
const report={sampledAt:new Date().toISOString(),runtime:process.version,scope:'Node CPU only, 30 timed samples after 5 warmups. Synthetic all-research stress save; no browser or real-device performance conclusion.',fixture:'All research, 0/100/1000 woodcutters, final bear selected as leader, register and neural networks, ample food and gold.',results};
const text=JSON.stringify(report,null,2);
console.log(text);
if(process.argv.includes('--save'))writeFileSync(new URL('./latest-long-game-benchmark.json',import.meta.url),text+'\n');
