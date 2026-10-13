import test from 'node:test';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdtemp,mkdir,readFile,rm,writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {resolve} from 'node:path';

const root=resolve(import.meta.dirname,'..');

async function startServer(t,args=[]){
 const child=spawn(process.execPath,[resolve(root,'scripts/serve.mjs'),...args],{
  cwd:root,env:{...process.env,PORT:'0',BEARGAME_HOST:'127.0.0.1'},stdio:['ignore','pipe','pipe'],
 });
 const closed=new Promise(resolve=>child.once('close',resolve));
 t.after(async()=>{
  if(child.exitCode===null&&child.signalCode===null)child.kill();
  const timer=setTimeout(()=>child.kill('SIGKILL'),2000);
  try{await closed;}finally{clearTimeout(timer);}
 });
 let output='',errors='';
 child.stdout.setEncoding('utf8');
 child.stderr.setEncoding('utf8');
 child.stderr.on('data',chunk=>{errors+=chunk;});
 return new Promise((resolve,reject)=>{
  const timer=setTimeout(()=>finish(new Error(`Server startup timed out: ${errors}`)),10000);
  function finish(error,url){
   clearTimeout(timer);
   child.stdout.off('data',onData);
   child.off('error',onError);
   child.off('close',onClose);
   if(error)reject(error);else resolve(url);
  }
  function onData(chunk){
   output+=chunk;
   const match=output.match(/http:\/\/localhost:(\d+)/);
   if(match&&Number(match[1])>0)finish(null,`http://127.0.0.1:${match[1]}`);
  }
  function onError(error){finish(error);}
  function onClose(code){finish(new Error(`Server exited before listening (${code}): ${errors}`));}
  child.stdout.on('data',onData);
  child.once('error',onError);
  child.once('close',onClose);
 });
}

async function request(origin,path){
 return fetch(origin+path,{signal:AbortSignal.timeout(5000)});
}

test('dev serves source files and mounts every public startup asset at the site root',{timeout:30000},async t=>{
 const origin=await startServer(t);
 const response=await request(origin,'/');
 assert.equal(response.status,200);
 assert.match(response.headers.get('content-type'),/^text\/html/);
 const html=await response.text();
 assert.equal(html,await readFile(resolve(root,'index.html'),'utf8'));
 const urls=[...new Set([...html.matchAll(/<(?:link|script)\b[^>]*\b(?:href|src)="(\.\/[^\"]+)"/g)].map(match=>match[1]))];
 assert.ok(urls.includes('./art/loading-bear.webp'));
 assert.ok(urls.includes('./favicon.svg'));
 assert.ok(urls.includes('./src/boot.js'));
 await Promise.all(urls.map(async url=>{
  const asset=await request(origin,'/'+url.slice(2));
  assert.equal(asset.status,200,url);
  const actual=Buffer.from(await asset.arrayBuffer());
  const publicAsset=url.startsWith('./art/')||url==='./favicon.svg';
  assert.deepEqual(actual,await readFile(resolve(root,publicAsset?'public':'.',url)),url);
  if(url.endsWith('.webp'))assert.equal(asset.headers.get('content-type'),'image/webp',url);
  if(url.endsWith('.svg'))assert.equal(asset.headers.get('content-type'),'image/svg+xml',url);
 }));
 assert.equal((await request(origin,'/art/does-not-exist.webp')).status,404);
 assert.equal((await request(origin,'/..%2fpackage.json')).status,403);
});

test('explicit preview roots serve their own assets without falling back to source public files',{timeout:30000},async t=>{
 const directory=await mkdtemp(resolve(tmpdir(),'beargame-dev-server-'));
 t.after(()=>rm(directory,{recursive:true,force:true}));
 await mkdir(resolve(directory,'art'));
 await writeFile(resolve(directory,'index.html'),'<!doctype html><title>Preview fixture</title>');
 await writeFile(resolve(directory,'art/fixture.svg'),'<svg xmlns="http://www.w3.org/2000/svg"/>');
 const origin=await startServer(t,[directory]);
 const index=await request(origin,'/');
 assert.equal(index.status,200);
 assert.equal(await index.text(),await readFile(resolve(directory,'index.html'),'utf8'));
 const asset=await request(origin,'/art/fixture.svg');
 assert.equal(asset.status,200);
 assert.equal(asset.headers.get('content-type'),'image/svg+xml');
 assert.equal(await asset.text(),await readFile(resolve(directory,'art/fixture.svg'),'utf8'));
 for(const path of ['/art/loading-bear.webp','/favicon.svg','/src/boot.js','/does-not-exist']){
  assert.equal((await request(origin,path)).status,404,path);
 }
 assert.equal((await request(origin,'/..%2fpackage.json')).status,403);
});
