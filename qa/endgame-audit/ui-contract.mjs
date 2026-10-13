import {importModule,auditFile} from './audit-paths.mjs';
// SYNTHETIC snapshot/action-contract fixtures. Not an earned progression test.
const {createGame,catalog}=await importModule('src/engine/index.js');
const {createState}=await importModule('src/engine/save.js');
const {page,systemOpen,explorationMenu,detailDialog}=await importModule('src/ui/render.js');
import fs from 'node:fs';
const allTrue=defs=>Object.fromEntries(defs.map(d=>[d.id,true]));const report=[];
for(const mode of ['normal','atheism','pacifism']){
 const s=createState(17,1);s.ironWill=false;s.science=allTrue(catalog.science);s.workshop=allTrue(catalog.workshop);s.metaphysics=allTrue(catalog.metaphysics);s.discoveries=allTrue(catalog.trades);s.challengesUnlocked=allTrue(catalog.challenges);s.transcendence=30;s.praised=1e7;s.faithRatio=1e40;s.usedCryochambers=1;s.timeState.furnaceHeat=1000;s.challengeCompletions['1000Years']=2;
 for(const d of catalog.buildings)s.buildings[d.id]=1;for(const d of catalog.faith)if(!['pact','pactPolicy','pactState'].includes(d.family))s.religion[d.id]=1;for(const d of catalog.space){s.space[d.id]=1;if(d.family==='mission'){s.spaceTravel[d.id]=0;s.spaceReached[d.id]=true;}}for(const d of catalog.time)s.time[d.id]=1;
 for(const r of catalog.resources)s.resources[r.id]=1e20;
 s.bears=[{id:1,name:'Test',job:null,trait:'none',experience:0,rank:0,skills:{}}];s.nextBearId=2;
 if(mode!=='normal'){s.challenge=mode;s.activeChallenges=[mode];}
 const save=JSON.stringify(s);let g=createGame({storage:null,save,now:1});const vm=g.snapshot();let checked=0,contradictions=[];
 const cards=[...vm.buildings,...vm.crafts,...vm.science,...vm.workshop,...vm.jobs,...vm.actions,...vm.progression.actions,...vm.progression.faithCards,...vm.progression.spaceCards,...vm.progression.time,...vm.progression.metaphysics];
 for(const c of cards.filter(c=>c.available)){
  g=createGame({storage:null,save,now:1});let r=g.act(c.type,c.id);checked++;if(!r.ok)contradictions.push({type:c.type,id:c.id,cardReason:c.reason||'',runtimeReason:r.message});
 }
 const rendered=page(vm,{page:'more',system:'challenges',buildFilter:'all',researchTab:'science'})+page(vm,{page:'more',system:'faith'})+page(vm,{page:'more',system:'space'})+page(vm,{page:'more',system:'trades'})+page(vm,{page:'more',system:'prestige'});
 const missing=vm.progression.actions.filter(c=>c.unlocked&&!rendered.includes(`data-act="${c.type}" data-id="${c.id}"`)).map(c=>({id:c.id,type:c.type}));
 report.push({mode,checked,contradictions,missingRenderedProgressionActions:missing});
}
const empty=createState(17,1);empty.science.calendar=true;let g=createGame({storage:null,save:JSON.stringify(empty),now:1});const vm=g.snapshot(),card=vm.progression.actions.find(c=>c.type==='accelerate');report.push({fixture:'calendar with zero temporal flux',card:{available:card.available,reason:card.reason},runtime:g.act('accelerate','toggle')});
fs.writeFileSync(auditFile('ui-contract-report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
