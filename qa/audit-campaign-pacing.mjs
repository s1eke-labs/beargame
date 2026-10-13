/** Read-only statistics of the earned campaign journal; deliberately not a player pacing benchmark. */
import fs from 'node:fs';
import {gunzipSync} from 'node:zlib';
const dir=new URL('./campaign/',import.meta.url);
const manifest=JSON.parse(fs.readFileSync(new URL('manifest.json',dir),'utf8'));
const counts={},stages=[];
for(const stage of manifest.stages){
 const rows=gunzipSync(fs.readFileSync(new URL(stage.calls,dir))).toString().trim().split('\n').map(JSON.parse);
 const actions={},offline=rows.filter(row=>row.method==='simulate'&&row.args[1]?.offline);
 for(const row of rows)if(row.method==='act'){const id=`${row.args[0]}:${row.args[1]}`;actions[id]=(actions[id]||0)+1;counts[id]=(counts[id]||0)+1;}
 let longestIdenticalCallRun=0,run=0,last=null;
 for(const row of rows){const key=JSON.stringify([row.method,row.args]);run=key===last?run+1:1;last=key;longestIdenticalCallRun=Math.max(longestIdenticalCallRun,run);}
 const requestedOfflineSeconds=offline.reduce((sum,row)=>sum+row.args[0],0);
 stages.push({id:stage.id,calls:rows.length,offlineCalls:offline.length,requestedOfflineSeconds,longestIdenticalCallRun,mostRepeatedActions:Object.entries(actions).sort((a,b)=>b[1]-a[1]).slice(0,5)});
}
console.log(JSON.stringify({scope:'Recorded unoptimized public-API planner lineage. Counts are API calls, not necessary UI taps. Seconds are requested compressed offline time before runtime rounding/caps, not measured wall time or required playtime. Separate prestige branch excluded.',totalCalls:stages.reduce((s,r)=>s+r.calls,0),offlineCalls:stages.reduce((s,r)=>s+r.offlineCalls,0),requestedOfflineSeconds:stages.reduce((s,r)=>s+r.requestedOfflineSeconds,0),mostRepeatedActions:Object.entries(counts).sort((a,b)=>b[1]-a[1]).slice(0,10),stages},null,2));
