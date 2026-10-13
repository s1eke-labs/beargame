import {cp,mkdir,rm,readFile,writeFile,readdir,stat,rename} from 'node:fs/promises';
import {resolve,relative,dirname,extname} from 'node:path';
import {createHash} from 'node:crypto';
import {releaseProfile} from './releases/profiles.mjs';
import {generateChapterCatalog} from './releases/catalog.mjs';
const root=resolve(import.meta.dirname,'..');
const args=process.argv.slice(2);let chapter='forest';
if(args.length){if(args.length!==2||args[0]!=='--chapter')throw new Error('Usage: build.mjs [--chapter forest]');chapter=args[1];}
const profile=releaseProfile(chapter); // Fail BEFORE altering the current output.
await generateChapterCatalog(root,chapter);
const {spawnSync}=await import('node:child_process');
const art=spawnSync('python3',[resolve(root,'scripts/art/build-forest-assets.py'),'--check'],{cwd:root,stdio:'inherit'});
if(art.status!==0)throw new Error('Release art pack is missing or failed integrity verification.');
const stage=resolve(root,'.private-build/release-stage'),dist=resolve(root,'dist');
await rm(stage,{recursive:true,force:true});await mkdir(stage,{recursive:true});
const chapterRoot=resolve(root,'src/chapters',chapter);
await cp(resolve(chapterRoot,'index.html'),resolve(stage,'index.html'));
await mkdir(resolve(stage,'src/chapters',chapter),{recursive:true});
for(const file of profile.runtime)await cp(resolve(chapterRoot,file),resolve(stage,'src/chapters',chapter,file));
await cp(resolve(root,'public/chapters',chapter),resolve(stage,'chapters',chapter),{recursive:true,filter:src=>!src.endsWith('manifest.json')});
const files=[];async function walk(dir){for(const e of await readdir(dir,{withFileTypes:true})){const file=resolve(dir,e.name);if(e.isSymbolicLink())throw new Error(`Symlink is not allowed in release: ${file}`);if(e.isDirectory())await walk(file);else files.push(file);}}await walk(stage);files.sort();
// One content revision invalidates all emitted module imports when any chapter input changes.
const hash=createHash('sha256');for(const file of files){hash.update(relative(stage,file));hash.update(await readFile(file));}const revision=hash.digest('hex').slice(0,12);
for(const file of files){const ext=extname(file);if(!['.html','.js','.css'].includes(ext))continue;let source=await readFile(file,'utf8');const v=url=>url.startsWith('.')&&!url.includes('?')?`${url}?v=${revision}`:url;
 if(ext==='.html')source=source.replace(/\b(src|href)=(['"])(\.[^'"]+)\2/g,(_,key,q,url)=>`${key}=${q}${v(url)}${q}`);
 if(ext==='.js')source=source.replace(/(\bfrom\s*|\bimport\s*(?:\(\s*)?)(['"])(\.[^'"]+\.js)\2/g,(_,pre,q,url)=>`${pre}${q}${v(url)}${q}`);
 if(ext==='.css')source=source.replace(/url\((['"]?)(\.[^)'"\s]+)\1\)/g,(_,q,url)=>`url(${q}${v(url)}${q})`);
 if(ext==='.js'&&file.endsWith('/art.js'))source=source.replace(/(['"])(\.\/chapters\/forest\/[^'"]+\.webp)\1/g,(_,q,url)=>`${q}${v(url)}${q}`);
 await writeFile(file,source);
}
const manifest={schema:1,chapter,entry:'index.html',catalog:`src/chapters/${chapter}/catalog.js`,revision,files:[]};
for(const file of files){const bytes=await readFile(file);manifest.files.push({path:relative(stage,file).replaceAll('\\','/'),sha256:createHash('sha256').update(bytes).digest('hex'),bytes:bytes.length});}
await writeFile(resolve(stage,'release-manifest.json'),JSON.stringify(manifest,null,2)+'\n');
const {verifyChapter}=await import('./verify-chapter.mjs');await verifyChapter(stage);
await rm(dist,{recursive:true,force:true});await rename(stage,dist);
console.log(`Built public ${chapter} chapter: ${files.length} files, revision ${revision}. Complete source retained outside dist.`);
