import {importModule,auditFile} from './audit-paths.mjs';
// SYNTHETIC targeted continuation of the stock-replenished capacity witness.
import fs from 'node:fs';const {createGame,catalog}=await importModule('src/engine/index.js');
let game=createGame({storage:null,save:fs.readFileSync(auditFile('witness-primary-save.json'),'utf8'),now:1});const sources=new Set(Object.keys(JSON.parse(fs.readFileSync(auditFile('witness-primary-report.json'))).sources));const events=[];
function fill(){const s=JSON.parse(game.export());for(const r of game.snapshot().resources)s.resources[r.id]=r.id==='paragon'?s.resources[r.id]:sources.has(r.id)?r.max??1e90:0;const a=game.importSave(JSON.stringify(s));if(!a.ok)throw Error(a.message);}
function act(type,id,amount=1){fill();const r=game.act(type,id,amount);events.push({type,id,amount,ok:r.ok,message:r.message});if(!r.ok)throw Error(r.message);}
const capacity=id=>game.snapshot().resources.find(r=>r.id===id).max;
act('stage','library');
while(capacity('science')<25000000){act('build','library',10);if(JSON.parse(game.export()).buildings.library>2000)throw Error('Witness strategy limit');}
const scienceBefore=capacity('science');act('research','exogeophysics');
while(capacity('antimatter')<5250)act('space','containmentChamber');
const amBefore=capacity('antimatter');act('space','entangler');
for(const id of ['temporalBattery','blastFurnace','temporalAccelerator','voidHoover','voidRift','chronocontrol','voidResonator','ressourceRetrieval'])act('time',id);
act('upgrade','tachyonModerator');act('time','controlledDelay');act('time','timeBoiler');
while(capacity('temporalFlux')<6500)act('time','temporalBattery');
const before=game.snapshot(),state=JSON.parse(game.export());
const report={scope:'SYNTHETIC stock-replenished continuation. Actual gates, costs and current storage caps; library stage change and purchase path executed. No resources introduced without a producer.',scienceBeforeExogeophysics:scienceBefore,antimatterBeforeEntangler:amBefore,dataCenters:state.buildings.library,scienceCount:before.science.filter(c=>c.completed).length,spaceCount:before.progression.spaceCards.filter(c=>c.owned).length,timeCount:before.progression.time.filter(c=>c.owned).length,remainingSpace:before.progression.spaceCards.filter(c=>!c.owned).map(c=>({id:c.id,reason:c.reason,costs:c.costs.map(x=>({...x,max:capacity(x.id)}))})),events};
fs.writeFileSync(auditFile('targeted-capacity-save.json'),game.export());
// Separate inherited-currency scenario, explicitly not an earned continuation.
state.resources.paragon=25000;game=createGame({storage:null,save:JSON.stringify(state),now:1});sources.add('paragon');const inheritedBefore=capacity('uranium');fill();const c=game.snapshot().progression.spaceCards.find(c=>c.id==='moltenCore');report.prestigeScenario={scope:'SEEDED 25,000 inherited paragon only, retained from previous runs; demonstrates escape from uranium storage gate, not an earned reset history.',uraniumCapacity:inheritedBefore,scienceCapacity:capacity('science'),moltenCoreAvailable:c.available,result:game.act('space','moltenCore')};
fs.writeFileSync(auditFile('targeted-capacity-report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
