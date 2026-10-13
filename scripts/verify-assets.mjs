/** Static production asset/import audit. This does not execute a browser. */
import {readdir,readFile,stat} from 'node:fs/promises';
import {resolve,dirname,relative,extname} from 'node:path';
const root=resolve(import.meta.dirname,'../dist');
const files=[];
async function walk(dir){for(const entry of await readdir(dir,{withFileTypes:true})){const path=resolve(dir,entry.name);if(entry.isDirectory())await walk(path);else files.push(path);}}
await walk(root);let links=0;
for(const path of files){
 const name=relative(root,path);
 if(/(^|\/)(qa|node_modules|\.git|\.openai|reference)(\/|$)/.test(name))throw Error(`Unexpected production content: ${name}`);
 const ext=extname(path);if(!['.html','.css','.js'].includes(ext))continue;
 const text=await readFile(path,'utf8');
 const patterns=ext==='.html'?[/\b(?:src|href)=["']([^"']+)["']/g]:ext==='.css'?[/url\(["']?([^\)"']+)["']?\)/g]:[/(?:\bfrom\s*|\bimport\s*\(\s*)["']([^"']+)["']/g,/^\s*import\s+["']([^"']+)["']/gm];
 for(const pattern of patterns)for(const match of text.matchAll(pattern)){
  const value=match[1];if(value.startsWith('#')||/^(?:https?:|data:|mailto:)/.test(value))continue;
  if(value.includes('${'))continue;
  const target=resolve(dirname(path),value.split(/[?#]/)[0]);
  if(!target.startsWith(root+'/'))throw Error(`Link escapes production bundle: ${name}: ${value}`);
  if(!(await stat(target).catch(()=>null))?.isFile())throw Error(`Missing production asset: ${name}: ${value}`);
  links++;
 }
}
console.log(`Verified ${files.length} production files and ${links} local asset/import links. No browser/device rendering claimed.`);
