/** SYNTHETIC late-time predicate checks, not an earned continuation. */
import {importModule,auditFile} from './audit-paths.mjs';
import fs from 'node:fs';import assert from 'node:assert/strict';
const{createGame}=await importModule('src/engine/index.js');
const s=JSON.parse(fs.readFileSync(auditFile('targeted-capacity-save.json')));s.calendar.year=40000;s.resources.karma=1;s.challengeCompletions['1000Years']=1;
const g=createGame({storage:null,save:JSON.stringify(s),now:1});const report={scope:'SYNTHETIC year 40,000, previous Thousand Years completion, and one retained karma. Predicates supplied explicitly; not earned progression.',purchases:[]};
for(const id of ['temporalImpedance','temporalPress','cryochambers']){const card=g.snapshot().progression.time.find(c=>c.id===id),result=g.act('time',id);report.purchases.push({id,available:card.available,result});assert.equal(card.available,true);assert.equal(result.ok,true);}
fs.writeFileSync(auditFile('late-time-predicates.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
