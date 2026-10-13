/** Independent QA: exact duplicate detection only; never a legal or originality guarantee. */
import { readdir, readFile, stat } from 'node:fs/promises';
import { resolve, relative, extname } from 'node:path';
import { createHash } from 'node:crypto';
const [gameArg,referenceArg]=process.argv.slice(2);
if(!gameArg||!referenceArg) throw new Error('Usage: node qa/provenance-check.mjs <game-root> <private-reference-root>');
const game=resolve(gameArg),reference=resolve(referenceArg);
const excluded=new Set(['.git','node_modules','dist','qa']);
async function walk(root){const out=[]; for(const ent of await readdir(root,{withFileTypes:true})){if(excluded.has(ent.name))continue; const p=resolve(root,ent.name); if(ent.isDirectory())out.push(...await walk(p)); else if(ent.isFile())out.push(p);}return out;}
const digest=b=>createHash('sha256').update(b).digest('hex');
const referenceFiles=await walk(reference),gameFiles=(await walk(game)).filter(p=>!p.endsWith('package-lock.json'));
const hashes=new Map(),codeWindows=new Map();
function windows(text){const lines=text.split(/\r?\n/).map(v=>v.trim()).filter(v=>v&&!/^([{}\[\]();,]+|\/\*|\*|\/\/)/.test(v)); const out=[]; for(let i=0;i+6<=lines.length;i++){const body=lines.slice(i,i+6).join('\n');if(body.length>=180)out.push(digest(body));}return out;}
for(const path of referenceFiles){const buffer=await readFile(path);if(buffer.length>=32)hashes.set(digest(buffer),relative(reference,path));if(/\.(js|css|html|svg)$/.test(path)&&buffer.length<8_000_000){for(const hash of windows(buffer.toString('utf8'))){if(!codeWindows.has(hash))codeWindows.set(hash,new Set());codeWindows.get(hash).add(relative(reference,path));}}}
const exactFiles=[],matchingWindows=[];
for(const path of gameFiles){const buffer=await readFile(path),r=hashes.get(digest(buffer)); if(r)exactFiles.push({game:relative(game,path),reference:r}); if(/\.(js|css|html|svg)$/.test(path)){const matched=new Set(); for(const hash of windows(buffer.toString('utf8'))){if(codeWindows.has(hash))for(const source of codeWindows.get(hash))matched.add(source);} if(matched.size)matchingWindows.push({game:relative(game,path),reference:[...matched]});}}
const result={checkedAt:new Date().toISOString(),referenceFiles:referenceFiles.length,gameFiles:gameFiles.length,exactFiles,matchingWindows,limitations:'Exact files and six normalized significant-line windows only. Does not establish independent provenance or legal clearance; original descriptions/art and semantic reuse require review.'};
console.log(JSON.stringify(result,null,2));if(exactFiles.length||matchingWindows.length)process.exitCode=1;
