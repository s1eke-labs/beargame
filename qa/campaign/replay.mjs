import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {gunzipSync} from 'node:zlib';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const args=process.argv.slice(2),arg=name=>args[args.indexOf(name)+1];
const here=path.dirname(fileURLToPath(import.meta.url));
const checkout=args.includes('--checkout')?path.resolve(arg('--checkout')):fs.existsSync(path.resolve('src/engine/index.js'))?path.resolve('.'):path.resolve(here,'../..');
const {createGame,importGame}=await import(pathToFileURL(path.join(checkout,'src/engine/index.js')));
const manifest=JSON.parse(fs.readFileSync(path.join(here,'manifest.json'),'utf8'));
const cases=[...manifest.stages,...(manifest.branches||[])];
if(args.includes('--stage'))assert.ok(cases.some(x=>x.id===arg('--stage')),'Unknown stage');
let game=createGame({storage:null,now:1,seed:17});
const results=[];
for(const stage of cases){
 assert.equal(createHash('sha256').update(fs.readFileSync(path.join(here,stage.checkpoint))).digest('hex'),stage.checkpointSha256,stage.id+' checkpoint integrity');
 if(args.includes('--stage')&&stage.id!==arg('--stage'))continue;
 if(stage.parent&&(args.includes('--stage')||stage.branch))game=importGame(fs.readFileSync(path.join(here,stage.parent),'utf8'),{storage:null,now:1});
 else if(stage.parent)game=importGame(game.export(),{storage:null,now:1});
 const rows=gunzipSync(fs.readFileSync(path.join(here,stage.calls))).toString().trim().split('\n').map(JSON.parse);
 for(const row of rows){const isShatter=row.method==='act'&&row.args[0]==='shatter';const beforeYear=isShatter?game.snapshot().calendar.year:null;const resetting=row.method==='act'&&['challenge','reset'].includes(row.args[0]);const beforeResets=resetting?game.snapshot().stats.totalResets:null;let out=game[row.method](...row.args);assert.equal(out.ok,true,`${stage.id} #${row.n} ${row.method} ${JSON.stringify(row.args)}: ${out.message}`);if(isShatter)assert.equal(game.snapshot().calendar.year,beforeYear+row.args[2],stage.id+' exact shatter year advance');if(resetting)assert.equal(game.snapshot().stats.totalResets,beforeResets+1,stage.id+' reset transition');if(row.method==='act'&&row.args[0]==='challenge')assert.ok(game.snapshot().progression.activeChallenges.includes(row.args[1]),stage.id+' challenge started');if(row.method==='act'&&row.args[0]==='reset')assert.equal(game.snapshot().progression.activeChallenges.length,0,stage.id+' challenge exited');for(const point of stage.checkpoints||[])if(point.afterCall===row.n){const text=fs.readFileSync(path.join(here,point.file),'utf8');assert.equal(createHash('sha256').update(text).digest('hex'),point.sha256,stage.id+' intermediate integrity');assert.deepEqual(JSON.parse(game.export()),JSON.parse(text),stage.id+' intermediate checkpoint');}}
 const view=game.snapshot(),expected=importGame(fs.readFileSync(path.join(here,stage.checkpoint),'utf8'),{storage:null,now:1}).snapshot();
 assert.equal(view.bears.value,expected.bears.value,stage.id+' population');
 assert.equal(view.stats.totalDeaths,expected.stats.totalDeaths,stage.id+' deaths');
 assert.equal(view.stats.totalResets,expected.stats.totalResets,stage.id+' resets');
 assert.equal(view.calendar.year,expected.calendar.year,stage.id+' year');
 for(const c of expected.science.filter(x=>x.completed))assert.equal(view.science.find(x=>x.id===c.id).completed,true,stage.id+' research '+c.id);
 for(const c of expected.space.filter(x=>x.owned))assert.equal(view.space.find(x=>x.id===c.id).owned,c.owned,stage.id+' space '+c.id);
 assert.ok(view.resources.every(x=>Number.isFinite(x.value)&&x.value>=0),stage.id+' valid resources');
 const actualSave=JSON.parse(game.export()),expectedSave=JSON.parse(fs.readFileSync(path.join(here,stage.checkpoint),'utf8'));
 let exact=true;try{assert.deepEqual(actualSave,expectedSave);}catch{exact=false;}
 results.push({id:stage.id,calls:rows.length,year:view.calendar.year,bears:view.bears.value,exactSave:exact});console.log(JSON.stringify(results.at(-1)));
 assert.equal(exact,true,stage.id+' exact save');
}
console.log(JSON.stringify({ok:true,stages:results.length,totalCalls:results.reduce((a,x)=>a+x.calls,0)}));
