/** Release acceptance operates on dist, never on a filtered runtime snapshot. */
import test from 'node:test';
import assert from 'node:assert/strict';
import {cp,mkdtemp,readFile,writeFile,rm,lstat,symlink} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
import {verifyChapter,assertForestCatalog,assertForestText,FOREST_ASSET_SHA256,FOREST_CONTRACT} from '../scripts/verify-chapter.mjs';
import {catalog} from '../src/chapters/forest/catalog.js';

const root=resolve(import.meta.dirname,'..'),dist=resolve(root,'dist');
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
async function fixture(t){const dir=await mkdtemp(resolve(tmpdir(),'beargame-forest-release-'));await cp(dist,dir,{recursive:true});t.after(()=>rm(dir,{recursive:true,force:true}));return dir;}
async function readManifest(dir){return JSON.parse(await readFile(resolve(dir,'release-manifest.json'),'utf8'));}
async function writeManifest(dir,manifest){await writeFile(resolve(dir,'release-manifest.json'),JSON.stringify(manifest,null,2)+'\n');}
async function rewrite(dir,path,transform,{rehash=true}={}){
 const before=await readFile(resolve(dir,path));const after=await transform(before);await writeFile(resolve(dir,path),after);
 if(rehash){const manifest=await readManifest(dir),entry=manifest.files.find(f=>f.path===path);assert.ok(entry,`fixture file is absent from manifest: ${path}`);const bytes=Buffer.from(after);entry.sha256=hash(bytes);entry.bytes=bytes.length;await writeManifest(dir,manifest);}
}
const rejected=async(dir,pattern)=>assert.rejects(()=>verifyChapter(dir),pattern);

test('actual dist is exactly the forest release with closed data, dependencies and selected assets',async()=>{
 const report=await verifyChapter(dist);
 assert.equal(report.chapter,'forest');assert.equal(report.definitions,49);
 assert.ok(report.assets>0);assert.equal(report.files,8+report.assets+1);assert.ok(report.links>=7+report.assets);
});

test('retained private full source and its original tests are not replaced by chapter extraction',async()=>{
 for(const path of ['src/engine/index.js','src/engine/catalog.js','src/engine/core-catalog.js','src/main.js','src/ui/render.js','src/engine/API.md','tests/progression.test.mjs','tests/industry.test.mjs','tests/redshift.test.mjs'])assert.ok((await lstat(resolve(root,path))).isFile(),path);
 assert.match(await readFile(resolve(root,'src/engine/core-catalog.js'),'utf8'),/chronosphere/);
 assert.match(await readFile(resolve(root,'src/engine/progression-catalog.js'),'utf8'),/timeCrystal/);
});

test('independent chapter IDs remain an explicit positive list',()=>{
 assert.deepEqual(Object.keys(FOREST_CONTRACT),['resources','buildings','science','workshop','crafts','jobs']);
 assert.equal(Object.values(FOREST_CONTRACT).flat().length,49);
 assert.equal(assertForestCatalog(catalog).definitions,49);
});

test('checker rejects unlisted future files even when manifest honestly includes them',async t=>{
 const dir=await fixture(t),path='full-engine.js',bytes=Buffer.from('export const future = true;');
 await writeFile(resolve(dir,path),bytes);const manifest=await readManifest(dir);manifest.files.push({path,bytes:bytes.length,sha256:hash(bytes)});await writeManifest(dir,manifest);
 await rejected(dir,/positive allowlist/);
});

test('checker rejects a missing allowed asset',async t=>{
 const dir=await fixture(t),path=Object.keys(FOREST_ASSET_SHA256)[0];assert.ok(path);
 await rm(resolve(dir,path));await rejected(dir,/positive allowlist/);
});

test('checker rejects missing inventory entries, duplicates, or wrong chapter metadata',async t=>{
 for(const mutate of [m=>m.files.pop(),m=>m.files.push({...m.files[0]}),m=>m.chapter='all']){
  const dir=await fixture(t),manifest=await readManifest(dir);mutate(manifest);await writeManifest(dir,manifest);
  await rejected(dir,/manifest (?:does not enumerate|has duplicate|identity\/schema)/);
 }
});

test('checker rejects altered runtime bytes not reflected in the content-hashed inventory',async t=>{
 const dir=await fixture(t);await rewrite(dir,'src/chapters/forest/engine.js',bytes=>Buffer.concat([bytes,Buffer.from('\n// altered\n')]),{rehash:false});
 await rejected(dir,/hash\/size mismatch/);
});

test('checker rejects a mixed atlas renamed to an approved forest asset and rehashed',async t=>{
 const dir=await fixture(t),path=Object.keys(FOREST_ASSET_SHA256)[0];assert.ok(path);
 await rewrite(dir,path,()=>readFile(resolve(root,'public/art/buildings-atlas.webp')));
 await rejected(dir,/unapproved or mixed asset bytes/);
});

test('checker rejects symlink substitutions',async t=>{
 const dir=await fixture(t),path=Object.keys(FOREST_ASSET_SHA256)[0];assert.ok(path);
 await rm(resolve(dir,path));await symlink(resolve(root,'public/art/buildings-atlas.webp'),resolve(dir,path));
 await rejected(dir,/symlink is not allowed/);
});

test('checker rejects missing local module dependencies despite matching manifest hashes',async t=>{
 const dir=await fixture(t);await rewrite(dir,'src/chapters/forest/engine.js',bytes=>`${bytes}\nimport './absent.js';\n`);
 await rejected(dir,/missing local dependency/);
});

test('checker audits local CSS and dynamically assigned image URL literals',async t=>{
 const css=await fixture(t);await rewrite(css,'src/chapters/forest/style.css',bytes=>`${bytes}\n.audit-probe { background-image: url('/missing.png'); }\n`);await rejected(css,/missing local dependency/);
 const image=await fixture(t);await rewrite(image,'src/chapters/forest/main.js',bytes=>`${bytes}\nconst imageProbe = './other-chapter/missing.webp';\n`);await rejected(image,/missing local dependency/);
});

test('rendered import buttons, text, comments and regex literals are not module imports',async t=>{
 const dir=await fixture(t);
 const harmless=[
  "const importButton = '<button data-command=\"import\">导入存档文件</button>';",
  "const nestedButton = `<section>${true ? '<button data-command=\"import\">读取</button>' : ''}</section>`;",
  "const importExample = \"import './not-an-actual-dependency.js'\";",
  "const patternExample = /import\\('not-a-module'\\)/;",
  "// import './comment-only.js';",
  "/* from './another-comment-only.js' */",
 ].join('\n');
 await rewrite(dir,'src/chapters/forest/main.js',bytes=>`${bytes}\n${harmless}\n`);
 await assert.doesNotReject(()=>verifyChapter(dir));
});

test('template-expression imports and new URL module-relative dependencies remain audited',async t=>{
 for(const code of ["const probe = `${import('./missing.js')}`;", "new URL('./missing.js', import.meta.url);", "import(/* comment */ './missing.js');", "export {value} from './missing.js';"]){
  const dir=await fixture(t);await rewrite(dir,'src/chapters/forest/main.js',bytes=>`${bytes}\n${code}\n`);
  await rejected(dir,/missing local dependency/);
 }
});

test('checker rejects escaping and unauditable module references',async t=>{
 for(const code of ["import '../../../../../../outside.js';", "import 'https://example.com/remote.js';", "const path = './math.js'; import(path);"]){
  const dir=await fixture(t);await rewrite(dir,'src/chapters/forest/engine.js',bytes=>`${bytes}\n${code}\n`);
  await rejected(dir,/dependency escapes|external or embedded|dynamic module path/);
 }
});

test('checker rejects source maps, unreferenced runtime and undisclosed future code',async t=>{
 const map=await fixture(t);await rewrite(map,'src/chapters/forest/engine.js',bytes=>`${bytes}\n//# sourceMappingURL=engine.js.map\n`);await rejected(map,/source maps/);
 const future=await fixture(t);await rewrite(future,'src/chapters/forest/engine.js',bytes=>`${bytes}\nconst timeCrystal = 0;\n`);await rejected(future,/excluded identifier timeCrystal/);
 const orphan=await fixture(t);await rewrite(orphan,'index.html',bytes=>{
  const value=bytes.toString();const replaced=value.replace(/(\bhref\s*=\s*["'])[^"']*style\.css[^"']*(["'])/g,'$1#style-not-loaded$2');assert.notEqual(replaced,value,'entry must load the chapter stylesheet');return replaced;
 });await rejected(orphan,/unreachable files/);
});

test('actual emitted catalog is validated even after its manifest hash is recomputed',async t=>{
 const dir=await fixture(t);await rewrite(dir,'src/chapters/forest/catalog.js',bytes=>{
  const source=bytes.toString(),changed=source.replace(/("cost":\s*\{\s*"honey":\s*10)(?=\s*[,}])/,'$1, "notAResource": 1');
  assert.notEqual(changed,source,'expected first hive cost in generated data');return changed;
 });
 await rejected(dir,/cost: unavailable resource/);
});

test('catalog cannot add a category, omitted ID, future copy or a disconnected opens target',()=>{
 const extra=structuredClone(catalog);extra.trades=[];assert.throws(()=>assertForestCatalog(extra),/categories differ/);
 const omitted=structuredClone(catalog);omitted.resources.pop();assert.throws(()=>assertForestCatalog(omitted),/ids differ/);
 const copy=structuredClone(catalog);copy.science[0].description+=' 接下来可以探索：山灵神殿。';assert.throws(()=>assertForestCatalog(copy),/excluded future copy/);
 const opens=structuredClone(catalog);opens.science[0].opens.push('山灵神殿');assert.throws(()=>assertForestCatalog(opens),/opens unavailable content/);
 const falseEdge=structuredClone(catalog);falseEdge.science[0].opens.push(catalog.buildings.find(b=>b.id==='hut').name);assert.throws(()=>assertForestCatalog(falseEdge),/opens does not match a real prerequisite/);
});

test('catalog cost, output, conversion, effects and gate domains are independently closed',()=>{
 const scenarios=[
  [c=>c.buildings[0].cost.notAResource=1,/cost: unavailable resource/],
  [c=>c.buildings[0].futureData={},/unreviewed definition field/],
  [c=>c.jobs[0].output='notAResource',/unavailable output/],
  [c=>c.buildings.find(b=>b.id==='smelter').conversion.input.notAResource=1,/conversion input: unavailable resource/],
  [c=>c.buildings[0].effect.energyDemand=1,/excluded or malformed effect/],
  [c=>c.science[0].gate.branch='mining',/unreviewed gate domain/],
  [c=>c.science[0].gate.science='missingResearch',/unavailable science prerequisite/],
  [c=>c.crafts[0].gate.buildings={unknownBuilding:1},/unavailable building prerequisite/],
 ];
 for(const [mutate,pattern]of scenarios){const c=structuredClone(catalog);mutate(c);assert.throws(()=>assertForestCatalog(c),pattern);}
});

test('all included IDs is insufficient when the production graph has a prerequisite deadlock',()=>{
 const c=structuredClone(catalog);c.science.find(d=>d.id==='calendar').gate={science:'construction',buildings:{library:1}};
 assert.throws(()=>assertForestCatalog(c),/unreachable dependency closure/);
});

test('precise future probes reject subsystem code while allowing ordinary scheduling and CSS words',()=>{
 for(const text of ['const chronosphere = 1;', 'const timeCrystal = 1;', '"space": {}', "if(type==='trade'){}", '接下来可以探索：山灵神殿', "import './progression-catalog.js';"]){assert.throws(()=>assertForestText(text),/excluded|private or mixed/);}
 assert.doesNotThrow(()=>assertForestText("const time = Date.now(); const space = ' '; import {geometricCost} from './math.js'; // calendar scheduling"));
});
