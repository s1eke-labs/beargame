import {cp, mkdir, rm, readFile, writeFile, readdir} from 'node:fs/promises';
import {resolve,extname,relative,dirname} from 'node:path';
import {createHash} from 'node:crypto';
const root=resolve(import.meta.dirname,'..'),dist=resolve(root,'.private-build/full');
await rm(dist,{recursive:true,force:true});
await mkdir(dist,{recursive:true});
await cp(resolve(root,'src'),resolve(dist,'src'),{recursive:true});
await cp(resolve(root,'public'),dist,{recursive:true});
await cp(resolve(root,'index.html'),resolve(dist,'index.html'));
for(const file of ['ART_PROVENANCE.md','RULES.md']){try{await cp(resolve(root,file),resolve(dist,file));}catch{}}
const files=[];async function walk(dir){for(const e of await readdir(dir,{withFileTypes:true})){const path=resolve(dir,e.name);if(e.isDirectory())await walk(path);else files.push(path);}}await walk(dist);files.sort();
// Hash original dependency closures: stable leaf assets, correctly invalidated importers,
// including cyclic ES module graphs. Never recursively hash already-rewritten bytes.
const originals=new Map(await Promise.all(files.map(async file=>[file,await readFile(file)])));
function references(file,text){const ext=extname(file);const pattern=ext==='.html'?/\b(?:src|href)=["'](\.[^"']+)["']/g:ext==='.css'?/url\(["']?(\.[^\)"'\s]+)["']?\)/g:ext==='.js'?/(?:\bfrom\s*|\bimport\s*(?:\(\s*)?)["'](\.[^"']+)["']/g:null;return pattern?[...text.matchAll(pattern)].map(m=>resolve(dirname(file),m[1].split(/[?#]/)[0])).filter(p=>originals.has(p)):[];}
const deps=new Map(files.map(f=>[f,references(f,originals.get(f).toString())]));
const hashes=new Map();for(const file of files){const seen=new Set();function visit(f){if(seen.has(f))return;seen.add(f);for(const d of deps.get(f)||[])visit(d);}visit(file);const h=createHash('sha256');for(const f of [...seen].sort()){h.update(relative(dist,f));h.update(originals.get(f));}hashes.set(file,h.digest('hex').slice(0,12));}
for(const file of files){const ext=extname(file);if(!['.html','.css','.js'].includes(ext))continue;let text=originals.get(file).toString();const versioned=url=>{const target=resolve(dirname(file),url.split(/[?#]/)[0]);return url.startsWith('.')&&!url.includes('?')&&hashes.has(target)?`${url}?v=${hashes.get(target)}`:url;};if(ext==='.html')text=text.replace(/\b(src|href)=(['"])(\.[^'"]+)\2/g,(_,key,q,url)=>`${key}=${q}${versioned(url)}${q}`);if(ext==='.js')text=text.replace(/(\bfrom\s*|\bimport\s*(?:\(\s*)?)(['"])(\.[^'"]+\.js)\2/g,(_,pre,q,url)=>`${pre}${q}${versioned(url)}${q}`);if(ext==='.css')text=text.replace(/url\((['"]?)(\.[^)'"\s]+)\1\)/g,(_,q,url)=>`url(${q}${versioned(url)}${q})`);await writeFile(file,text);}
console.log(`Built PRIVATE full development game → .private-build/full (asset revision ${hashes.get(resolve(dist,'index.html'))}, dependency-aware per-file caching).`);
