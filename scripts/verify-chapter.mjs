/** Independent, fail-closed audit of the actual emitted forest distribution.
 * This deliberately does not import the private build profile or full catalogue.
 */
import {readFile, readdir, lstat} from 'node:fs/promises';
import {resolve, dirname, relative, extname, posix} from 'node:path';
import {pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';

export const FOREST_CONTRACT = Object.freeze({
 resources:['honey','wood','minerals','iron','manpower','science','furs','ivory','unicorns','beam','slab'],
 buildings:['hive','hut','library','barn','pasture','mine','workshop','smelter','logHouse','warehouse','lumberMill'],
 science:['calendar','agriculture','archery','mining','metal','animal','construction'],
 workshop:['mineralHoes','ironHoes','mineralAxes','ironAxes','reinforcedSaw','stoneBarns','reinforcedBarns','advancedRefinement','bolas','huntingArmor','compositeBow','prospecting'],
 crafts:['wood','beam','slab'], jobs:['woodcutter','farmer','scholar','hunter','miner'],
});
export const FOREST_RUNTIME = Object.freeze(['index.html', ...['main.js','engine.js','catalog.js','art.js','style.css','math.js','save.js'].map(p=>`src/chapters/forest/${p}`)]);
// Approved, individually selected raster bytes from the 50-image chapter asset pack.
// Pinning bytes independently prevents renaming an entire mixed/future atlas to an allowed filename.
export const FOREST_ASSET_SHA256 = Object.freeze({
 "chapters/forest/bears/idleFront.webp": "5bd7eec2885de211534e5f92afd6ccab401d5b68d9d07fa89bb8dae8d3082e06",
 "chapters/forest/bears/wave.webp": "af38b6f3f838e0e8553a69843ae381ef653731209185828dc4b644b90dd31c5e",
 "chapters/forest/buildings/barn.webp": "bb1cdfd56c6cb2f93595a046804340aab08605e024a64875bcb5bbbbb0ccc1ea",
 "chapters/forest/buildings/hive.webp": "43919e9606178adfdb5a58813b407a9a29a3845d9f0aab547e78fafbd5dcb88c",
 "chapters/forest/buildings/hut.webp": "68a13329e05094044b311b263cfb4131a8184b930352fe1081c2e2cba50dd7f8",
 "chapters/forest/buildings/library.webp": "41ae8f09674e3485af3bc213f57cddfb47838285c5c2f6cf8a34fa386966720b",
 "chapters/forest/buildings/logHouse.webp": "a116094767ec2c71be6a9b29fa7688042d509ec1cee761002a13b650acb33f36",
 "chapters/forest/buildings/lumberMill.webp": "6395671e29c4f4dcc65fd664fe52d7881bb047053fb1e54ae0af2b2f2fc4f2c4",
 "chapters/forest/buildings/mine.webp": "6b0dd336c43c1ad7a84bad469691304a56d2000345a26b62af985f8149ff71e0",
 "chapters/forest/buildings/pasture.webp": "9be2ba4c4831e19b2a4a20d9cf04846c7362a76e6049f9eb8b43a392f2cd14d3",
 "chapters/forest/buildings/smelter.webp": "23aea20f1812085088f4370867fbb35aded7f80b1c4034c3a496c7edee769709",
 "chapters/forest/buildings/warehouse.webp": "45997d83810ecbc337f8b8efea6f5200d47a43c701c68bacdcbba6a76aa6f906",
 "chapters/forest/buildings/workshop.webp": "44699be624d0caaf432a1ca60a1768d5d60ac0716c24c804e930a60f66514e37",
 "chapters/forest/growth/barn.webp": "89821aef1190b58988591981ca278dc147b7a81c0b7ba00bc111754a54ac67ed",
 "chapters/forest/growth/hive.webp": "4c9b27460c0178e85b29388597510d44eba217ce7e689af33e311ce4c2299788",
 "chapters/forest/growth/hut.webp": "ea94d27ecfd362abdfdc961c07044a43e8149ea25036044abd63da60a414de3b",
 "chapters/forest/growth/library.webp": "ea0ab8c1f4ec064a840b48667f917c0a5437a598efef02b9642f5b4b7a070792",
 "chapters/forest/growth/lumberMill.webp": "611b6be1dab4d77a9c8c6565468e8b31f17c8ddc2d2b4249a1288b3031a02186",
 "chapters/forest/growth/warehouse.webp": "c93f3c0632406fb68cdd49cb3c892f061316b8dc00d0d6244e90e0d91acc0946",
 "chapters/forest/growth/workshop.webp": "e2bde61db0c8a7fdf76ce180e807d82de602a92752384b16b6c3fba015ab0e9c",
 "chapters/forest/research/agriculture.webp": "7c38ff2e217d3781512f549a5ae277572b3f6660860f961c27ea547e46d7c5eb",
 "chapters/forest/research/animal.webp": "83ebd60276492c0d3fef68582c64bd0b24f73efd48db09ed45462c7a248ecde4",
 "chapters/forest/research/archery.webp": "eb36a35b0a29a7bb8872598558a99c3a2c00abd1cf17becd798090cfbb5c6a95",
 "chapters/forest/research/calendar.webp": "473ba99a2548eba031cbef2cb6e8b52e0cbdcde9d5e9c31d20f8164e631d8c29",
 "chapters/forest/research/construction.webp": "87e674f7edc1e6b2d120b165e40b71eeed0faa5088561ecc69d3d62aa3648f71",
 "chapters/forest/research/metal.webp": "bb1bbd803cd536ee0272d420c0a339e33c143d99be43cd6462e4045f49a723d2",
 "chapters/forest/research/mining.webp": "bdaae761fad7ee8690cfbb9dc8fa81f1c012e3bf2ba498f67aa7d3ef8a833a3e",
 "chapters/forest/resources/beam.webp": "a44befde4c2f052d05387f1256b832bdb05ca1f63dba86316dba675f12eaed5b",
 "chapters/forest/resources/furs.webp": "58d7024bffed4ca1e1db89cf56080c3d9237ad9b2bba955a9a3d4822ad66cee4",
 "chapters/forest/resources/honey.webp": "7411762eaf5ee3c8686035ce2c6b0218804b7ed2de27ca51ab494e4fd39882b7",
 "chapters/forest/resources/iron.webp": "14bd985b542b548c0aae7594b20a18fc05b5054abb7b2eaade754446181ea2af",
 "chapters/forest/resources/ivory.webp": "981441292aeb9db080590aacca0fe0776ee7d5ae073d0273be5b984c8f9bb45e",
 "chapters/forest/resources/manpower.webp": "eeddeb8bab544b53b773de0740aab09129f1810873422cfea1acc557b363baf8",
 "chapters/forest/resources/minerals.webp": "c08b2b8009edabe7b4df42029ca57c30c283ff197c45646b7cd0974334a49424",
 "chapters/forest/resources/science.webp": "cebffa300117f831701de161d8dc9ad912e3da5787c18b7d20cd7178c8ee184d",
 "chapters/forest/resources/slab.webp": "398519e66af9132e6a16e53ad562244276959b24caaf283dd89702731855e394",
 "chapters/forest/resources/unicorns.webp": "aee8b555d695207824f56cecfb33a50c2b2a6ff8eef35555f910b040b2551999",
 "chapters/forest/resources/wood.webp": "650f611834bff569a1b50517474f302e4ebfd88e61c4dd5a9c0a68f031e2f930",
 "chapters/forest/scenery/background.webp": "ba18ee091e33b499a08547b455e53469582d809af4f05dcf6771491ce41ead21",
 "chapters/forest/scenery/loading.webp": "14dcb31ce1ced2dd104c60b16c4b5141401dd3f76f5984e2f5a0e1f06f0ef800",
 "chapters/forest/workers/farmer-ready.webp": "4df1765fe0109d1d8f08eea50080f19d7b7068c4a253a9dc61d63d94bdd008da",
 "chapters/forest/workers/farmer-work.webp": "ce21cbff9d33833c5d4a607fc21247f2988cdd02fda0e5207377f4c02d79b735",
 "chapters/forest/workers/hunter-ready.webp": "c13834363ce4bccdca5bd7c23dbadd52277ac317407727e96ca3e980d36a836e",
 "chapters/forest/workers/hunter-work.webp": "b62877d9c83c46bbf7bf2dd8234c1733b22dbdb583aa3efd93d37bba12278ef3",
 "chapters/forest/workers/miner-ready.webp": "fffb46e5afefcb023151d1681988c6333fd49d1f37b7ae08e727b636b6d25570",
 "chapters/forest/workers/miner-work.webp": "ebbf11bfa8f24d646060f0909c0149bfb0760314e33007fa0443a33afcf5cbfc",
 "chapters/forest/workers/scholar-ready.webp": "a5a0a782491b74eec4c1fbcab99037b2406291a2f16265029a209e25e9981c77",
 "chapters/forest/workers/scholar-work.webp": "42bffe92c98a6b7ce8cb58a6ac9d3169e9ff08e1bf99520244e98d1de569e7dd",
 "chapters/forest/workers/woodcutter-ready.webp": "1252e1ec6f9d26d321f0dcdb898a6621c9544a8e91935c48650b236b3138c5d6",
 "chapters/forest/workers/woodcutter-work.webp": "bd23cd0d048270b5bee51a4ba2357204a6256d644a6274cf480afad952253eae",
});
const rowFields={
 resources:['id','name','cap','description'],
 buildings:['id','name','cost','ratio','effect','gate','description','type','conversion'],
 science:['id','name','cost','gate','description','type','opens'],
 workshop:['id','name','type','cost','gate','effect','description','summary'],
 crafts:['id','name','cost','output','amount','gate','type','description','tier','difficulty'],
 jobs:['id','name','output','rate','gate','description'],
};
const MANIFEST='release-manifest.json';
const CATALOG='src/chapters/forest/catalog.js';
const effects=new Set(['bears','craftRatio','refineRatio','honeyDemandReduction','barnRatio','warehouseRatio','farmerRatio','woodcutterRatio','hunterRatio','hunterJobRatio','lumberMillRatio','honeyPerWood','meteorIronEnabled','pollution']);
for(const id of FOREST_CONTRACT.resources)for(const suffix of ['', 'Max','Ratio'])effects.add(id+suffix);
const futureIdentifiers=[
 'chronosphere','aiCore','nuclearFission','particlePhysics','dimensionalPhysics','chronophysics','tachyonTheory','cryptotheology','voidSpace','paradoxalKnowledge','artificialGravity',
 'timeCrystal','unobtainium','antimatter','temporalFlux','burnedParagon','blackcoin','elderBox','wrappingPaper','gflops','hashrates','bloodstone','tMythril',
 'reactor','accelerator','steamworks','magneto','oilWell','factory','calciner','biolab','observatory','aqueduct','unicornPasture','ziggurat','tradepost','amphitheatre','chapel','temple','mansion','harbor','academy','mint','quarry',
 'rorschachMission','moonMission','orbitalLaunch','leviathans','lizards','sharks','griffins','nagas','zebras','spiders','dragons','ambassador','geologist','priest',
 'engineering','civil','math','currency','writing','philosophy','machinery','theology','astronomy','navigation','architecture','metaphysics','chemistry','acoustics','drama','archeology','electricity','biology','biochemistry','genetics','industrialization','mechanization','electronics','robotics',
 'prestige','transcend','transcendence','shatter','sacrifice','praise','adore','feedElders','tradeAll','blackcoinBuy','blackcoinSell','engineerJobs','faithRatio','energySupply','energyDemand','explorerAtk','explorerDef',
 'steel','titanium','uranium','coal','gold','oil','culture','faith','paragon','relic','starchart','microchip','plastic','blueprint','compendium','manuscript','parchment','scaffold','megalith','kerosene','thorium','eludium','sorrow',
];
// Plain `math` is a legitimate forest helper; `Math` is JavaScript. Names such as
// space/time/policy can be ordinary CSS or scheduling words and are not scanned bare.
const bareFuture=futureIdentifiers.filter(id=>id!=='math');
const futureCopy=['时光蜜球','森智核心','晶能反应堆','微粒加速环','蒸汽工坊','林原发电机','深林油井','精工厂','焙烧炉','花木实验室','观星台','林泉水渠','灵鹿花苑','叠石祭坛','林间驿站','山谷剧场','花灯祈堂','山灵神殿','山岭公馆','河湾港','山林学院','林币铸坊','山岩采场','时序物理','超光理论','虚空领域','隐秘神学','星海来客','星际','时晶','反物质','黑金','余烬传承','外交','商团','祈愿','传承重建','工程师自动制作'];
const forbiddenPath=/(?:^|\/)(?:engine|ui|styles|docs|tests|qa|scripts|source-assets|node_modules|\.git|\.openai|full)(?:\/|$)|(?:\.map|\.md|\.zip|\.tar(?:\.gz)?|\.bak)$/i;
const fail=message=>{throw new Error(`Forest release rejected: ${message}`);};
const check=(condition,message)=>{if(!condition)fail(message);};
const sorted=value=>[...value].sort();
const same=(a,b)=>JSON.stringify(sorted(a))===JSON.stringify(sorted(b));
const plain=value=>!!value&&typeof value==='object'&&!Array.isArray(value);
const sha256=bytes=>createHash('sha256').update(bytes).digest('hex');

export function assertForestText(text,name='content') {
 check(!/sourceMappingURL|sourceURL\s*=|data:application\/(?:javascript|ecmascript)|data:text\/javascript/i.test(text),`${name}: source maps or embedded executable payload`);
 for(const id of bareFuture)check(!new RegExp(`(?<![A-Za-z0-9_$])${id}(?![A-Za-z0-9_$])`).test(text),`${name}: excluded identifier ${id}`);
 for(const copy of futureCopy)check(!text.includes(copy),`${name}: excluded future copy ${copy}`);
 check(!/["'](?:math|currency)["']/.test(text),`${name}: excluded research identity`);
 check(!/["'](?:space|trade|challenge|challengeStart|engineerAssign|policy|embassy|accelerate|timeSkip)["']/.test(text),`${name}: excluded action identity`);
 check(!/["'](?:space|time|faith|trades|challenges|metaphysics|policies|full)["']\s*:/.test(text),`${name}: excluded subsystem`);
 check(!/(?:world|explore)-(?:industrial|stellar|settlement)|(?:buildings|resources|research-subjects|worker-roles)-atlas|progression-catalog|workshop-catalog|full-profile|profiles\.mjs/i.test(text),`${name}: private or mixed content reference`);
}

export function assertForestCatalog(catalog) {
 check(plain(catalog),'catalog must be an object');
 check(same(Object.keys(catalog),Object.keys(FOREST_CONTRACT)),'catalog categories differ from the chapter contract');
 const sets={}, names=new Map();
 for(const [group,ids] of Object.entries(FOREST_CONTRACT)){
  const rows=catalog[group];check(Array.isArray(rows),`${group} is not an array`);
  check(rows.every(row=>plain(row)&&typeof row.id==='string'&&typeof row.name==='string'&&row.name.trim()),`${group}: malformed definitions`);
  check(new Set(rows.map(row=>row.id)).size===rows.length,`${group}: duplicate ids`);
  check(same(rows.map(row=>row.id),ids),`${group}: ids differ from the chapter allowlist`);
  sets[group]=new Set(ids);
  for(const row of rows){const list=names.get(row.name)||[];list.push({group,row});names.set(row.name,list);}
 }
 const amounts=(value,label,allowEmpty=true)=>{
  check(plain(value),`${label}: expected resource amount map`);
  check(allowEmpty||Object.keys(value).length,`${label}: empty amount map`);
  for(const [id,amount]of Object.entries(value))check(sets.resources.has(id)&&typeof amount==='number'&&Number.isFinite(amount)&&amount>0,`${label}: unavailable resource or invalid amount ${id}`);
 };
 const gate=(value,label)=>{
  check(plain(value),`${label}: gate must be an object`);
  for(const [key,dependency]of Object.entries(value)){
   if(key==='science'||key==='workshop')check(typeof dependency==='string'&&sets[key].has(dependency),`${label}: unavailable ${key} prerequisite ${dependency}`);
   else if(key==='scienceAny')check(Array.isArray(dependency)&&dependency.length>0&&dependency.every(id=>sets.science.has(id)),`${label}: unavailable scienceAny prerequisite`);
   else if(key==='buildings'){
    check(plain(dependency),`${label}: malformed building gate`);
    for(const [id,count]of Object.entries(dependency))check(sets.buildings.has(id)&&Number.isInteger(count)&&count>0,`${label}: unavailable building prerequisite ${id}`);
   }else fail(`${label}: unreviewed gate domain ${key}`);
  }
 };
 for(const [group,rows]of Object.entries(catalog))for(const row of rows){
  const label=`${group}/${row.id}`;
  check(Object.keys(row).every(key=>rowFields[group].includes(key)),`${label}: unreviewed definition field`);
  for(const key of ['name','description','summary'])if(row[key]!==undefined)check(typeof row[key]==='string',`${label}: malformed ${key}`);
  if(row.cost!==undefined)amounts(row.cost,`${label} cost`,false);
  if(group!=='resources')gate(row.gate??{},label);
  if(row.output!==undefined)check(typeof row.output==='string'&&sets.resources.has(row.output),`${label}: unavailable output ${row.output}`);
  if(row.conversion!==undefined){
   check(plain(row.conversion)&&Object.keys(row.conversion).every(k=>['input','output','global'].includes(k)),`${label}: unreviewed conversion`);
   amounts(row.conversion.input,`${label} conversion input`);amounts(row.conversion.output,`${label} conversion output`);
  }
  if(row.effect!==undefined){
   check(plain(row.effect),`${label}: malformed effect`);
   for(const [key,value]of Object.entries(row.effect))check(effects.has(key)&&(typeof value==='boolean'||typeof value==='number'&&Number.isFinite(value)),`${label}: excluded or malformed effect ${key}`);
  }
  if(row.opens!==undefined){
   check(group==='science'&&Array.isArray(row.opens),`${label}: malformed opens`);
   for(const target of row.opens){
    check(typeof target==='string'&&names.has(target),`${label}: opens unavailable content ${target}`);
    check(names.get(target).some(({row:next})=>next.gate?.science===row.id||next.gate?.scienceAny?.includes(row.id)),`${label}: opens does not match a real prerequisite: ${target}`);
   }
  }
 }
 // Reachability uses only included producers and dependencies. It catches cycles
 // and inputs whose only producer has been removed, rather than only matching ids.
 const reachable=Object.fromEntries(Object.keys(catalog).map(k=>[k,new Set()]));
 reachable.resources.add('honey');
 const gateReady=g=>(!g.science||reachable.science.has(g.science))&&(!g.workshop||reachable.workshop.has(g.workshop))&&(!g.scienceAny||g.scienceAny.some(id=>reachable.science.has(id)))&&Object.keys(g.buildings||{}).every(id=>reachable.buildings.has(id));
 const inputsReady=values=>Object.keys(values||{}).every(id=>reachable.resources.has(id));
 let changed=true;
 while(changed){changed=false;const add=(group,id)=>{if(!reachable[group].has(id)){reachable[group].add(id);changed=true;}};
  for(const [group,rows]of Object.entries(catalog))if(group!=='resources')for(const row of rows){
   if(!gateReady(row.gate||{})||!inputsReady(row.cost)||!inputsReady(row.conversion?.input))continue;
   add(group,row.id);
   if(row.output)add('resources',row.output);
   for(const id of Object.keys(row.conversion?.output||{}))add('resources',id);
   for(const [key,value]of Object.entries(row.effect||{}))if(sets.resources.has(key)&&value>0)add('resources',key);
  }
  if(reachable.jobs.has('hunter'))for(const id of ['furs','ivory','unicorns'])add('resources',id);
 }
 for(const [group,ids]of Object.entries(FOREST_CONTRACT))check(ids.every(id=>reachable[group].has(id)),`${group}: unreachable dependency closure: ${ids.filter(id=>!reachable[group].has(id)).join(', ')}`);
 assertForestText(JSON.stringify(catalog),'catalog');
 return {definitions:Object.values(catalog).reduce((sum,rows)=>sum+rows.length,0)};
}

function readCatalogModule(text){
 const exports={};let source=text.replace(/^\s*(?:\/\/[^\n]*\n\s*)*/,'');
 while(source.trim()){
  const match=/^export const (catalog|constants|release) = ([\s\S]*?);\s*(?=export const|$)/.exec(source);
  check(match,'catalog.js must contain only the generated data exports');
  check(!Object.hasOwn(exports,match[1]),`catalog.js has duplicate ${match[1]} export`);
  try{exports[match[1]]=JSON.parse(match[2]);}catch{fail(`catalog.js ${match[1]} is not JSON data`);}
  source=source.slice(match[0].length);
 }
 check(same(Object.keys(exports),['catalog','constants','release']),'catalog.js exports changed');
 check(same(Object.keys(exports.constants),['TICKS_PER_SECOND','TICKS_PER_DAY','DAYS_PER_SEASON','SEASONS_PER_YEAR','SEASONS','SEASON_FACTORS','MAX_OFFLINE_SECONDS','SAVE_VERSION','SAVE_KEY']),'catalog.js contains unreviewed constants');
 check(same(Object.keys(exports.release),['family','chapter','contentLevel','schema','title','appVersion']),'catalog.js contains unreviewed release metadata');
 check(exports.constants.SAVE_KEY==='beargame.chapters.save.v1'&&exports.constants.SAVE_VERSION===1,'chapter save key/schema mismatch');
 check(exports.release.chapter==='forest'&&exports.release.contentLevel===1&&exports.release.schema===1&&exports.release.family==='beargame-chapters','release data is not forest level 1');
 return exports;
}

function assertWebP(bytes,name){
 check(bytes.length>=20&&bytes.subarray(0,4).toString()==='RIFF'&&bytes.subarray(8,12).toString()==='WEBP'&&bytes.readUInt32LE(4)+8===bytes.length,`${name}: invalid image container or appended payload`);
 let offset=12,images=0;
 while(offset<bytes.length){
  check(offset+8<=bytes.length,`${name}: truncated image chunk`);
  const tag=bytes.subarray(offset,offset+4).toString(),size=bytes.readUInt32LE(offset+4);
  check(['VP8X','ALPH','VP8 ','VP8L'].includes(tag),`${name}: hidden image metadata or animation`);
  if(tag==='VP8X')check(size===10&&!(bytes[offset+8]&0x2e),`${name}: unsupported extended image flags`);
  if(tag==='VP8 '||tag==='VP8L')images++;
  offset+=8+size+(size%2);
 }
 check(offset===bytes.length&&images===1,`${name}: malformed or multiple image payloads`);
}

async function walk(root,dir=root,result=[]){
 for(const entry of await readdir(dir,{withFileTypes:true})){
  const path=resolve(dir,entry.name),name=relative(root,path).split('\\').join('/');
  const info=await lstat(path);check(!info.isSymbolicLink(),`symlink is not allowed: ${name}`);
  if(info.isDirectory())await walk(root,path,result);
  else{check(info.isFile(),`not a regular file: ${name}`);result.push(name);}
 }
 return result.sort();
}
function localReference(source,url,rootRelative=false){
 const value=url.trim();
 if(!value||value.startsWith('#'))return null;
 check(!/^(?:[a-z][a-z0-9+.-]*:|\/\/)/i.test(value),`${source}: external or embedded dependency ${value}`);
 check(!value.includes('${')&&!value.includes('\\'),`${source}: unresolvable dynamic path ${value}`);
 let path;try{path=decodeURIComponent(value.split(/[?#]/)[0]);}catch{fail(`${source}: invalid escaped path ${value}`);}
 check(!path.includes('\0')&&!path.includes('\\'),`${source}: invalid dependency path ${value}`);
 const target=posix.normalize(path.startsWith('/')?path.slice(1):posix.join(rootRelative?'':posix.dirname(source),path));
 check(target!=='..'&&!target.startsWith('../')&&!posix.isAbsolute(target),`${source}: dependency escapes release ${value}`);
 return target;
}
// A small lexical scanner distinguishes JavaScript code from rendered HTML strings,
// comments, regex literals and nested templates. It never executes the release.
function jsTokens(source){
 const tokens=[];let i=0;
 const literal=(raw)=>raw.replace(/\\(?:u\{([0-9a-f]+)\}|u([0-9a-f]{4})|x([0-9a-f]{2})|(\r?\n)|(.))/gi,(all,long,unicode,hex,newline,one)=>long||unicode||hex?String.fromCodePoint(parseInt(long||unicode||hex,16)):newline?'':({n:'\n',r:'\r',t:'\t',b:'\b',f:'\f',v:'\v','0':'\0'}[one]??one));
 function string(quote){const start=++i;let raw='';while(i<source.length){if(source[i]==='\\'){raw+=source.slice(i,i+2);i+=2;}else if(source[i]===quote){i++;break;}else raw+=source[i++];}tokens.push({type:'string',value:literal(raw),start});}
 function template(){
  i++;let raw='',dynamic=false;
  while(i<source.length){
   if(source[i]==='\\'){raw+=source.slice(i,i+2);i+=2;}
   else if(source[i]==='`'){i++;if(!dynamic)tokens.push({type:'string',value:literal(raw)});return;}
   else if(source[i]==='$'&&source[i+1]==='{'){dynamic=true;i+=2;code(true);}
   else raw+=source[i++];
  }
 }
 function code(templateExpression=false){
  let depth=0;
  while(i<source.length){
   const ch=source[i],next=source[i+1];
   if(/\s/.test(ch)){i++;continue;}
   if(ch==='/'&&next==='/'){i+=2;while(i<source.length&&source[i]!=='\n')i++;continue;}
   if(ch==='/'&&next==='*'){i+=2;while(i<source.length&&!(source[i]==='*'&&source[i+1]==='/'))i++;i+=2;continue;}
   if(ch==='"'||ch==="'"){string(ch);continue;}
   if(ch==='`'){template();continue;}
   if(ch==='}'&&templateExpression&&depth===0){i++;return;}
   if(ch==='{')depth++;if(ch==='}')depth--;
   if(ch==='/'){
    const prev=tokens.at(-1);
    const regex=!prev||['(','[','{','=',':',',',';','!','?','&','|','>'].includes(prev.value)||prev.type==='word'&&['return','throw','case','yield','typeof','void'].includes(prev.value);
    if(regex){i++;let inClass=false;while(i<source.length){if(source[i]==='\\'){i+=2;continue;}if(source[i]==='[')inClass=true;if(source[i]===']')inClass=false;if(source[i]==='/'&&!inClass){i++;break;}i++;}while(/[a-z]/i.test(source[i]||'')&&i<source.length)i++;tokens.push({type:'regex',value:'regex'});continue;}
   }
   if(/[\w$]/.test(ch)){const start=i++;while(i<source.length&&/[\w$]/.test(source[i]))i++;tokens.push({type:'word',value:source.slice(start,i)});continue;}
   tokens.push({type:'punct',value:ch});i++;
  }
 }
 code();return tokens;
}

function references(source,text){
 const refs=[],ext=extname(source);
 const collect=(regex,root=false)=>{for(const match of text.matchAll(regex)){const target=localReference(source,match[1],root);if(target)refs.push(target);}};
 if(ext==='.html'){
  collect(/\b(?:src|href|poster)\s*=\s*["']([^"']+)["']/gi);
  check(!/\bsrcset\s*=|<base\b|\bstyle\s*=/i.test(text),`${source}: unreviewed inline/srcset/base dependency`);
 }else if(ext==='.css'){
  collect(/url\(\s*["']?([^\)"']+?)["']?\s*\)/gi);
  collect(/@import\s+["']([^"']+)["']/gi);
 }else if(ext==='.js'){
  const tokens=jsTokens(text),add=(value,root=false)=>{const target=localReference(source,value,root);if(target)refs.push(target);};
  for(let i=0;i<tokens.length;i++){
   const token=tokens[i],next=tokens[i+1];if(token.type!=='word')continue;
   if(token.value==='from'&&next?.type==='string')add(next.value);
   if(token.value==='import'&&tokens[i-1]?.value!=='.'){
    if(next?.type==='string')add(next.value);
    else if(next?.value==='('){check(tokens[i+2]?.type==='string'&&tokens[i+3]?.value===')',`${source}: dynamic module path cannot be audited`);add(tokens[i+2].value);}
   }
   if(token.value==='new'&&next?.value==='URL'&&tokens[i+2]?.value==='('&&tokens[i+3]?.type==='string'&&tokens.slice(i+4,i+10).map(t=>t.value).join('')===',import.meta.url'&&tokens[i+10]?.value===')')add(tokens[i+3].value);
   if(['fetch','importScripts','Worker','SharedWorker','XMLHttpRequest','WebSocket','EventSource'].includes(token.value)&&next?.value==='(')fail(`${source}: unreviewed network or worker dependency`);
  }
  // Art URLs inserted into HTML/CSS resolve from index.html, whereas module imports
  // resolve from the JavaScript file. The pack uses complete literal root paths.
  collect(/["'`]([^"'`\s]+\.(?:webp|png|svg|jpe?g|gif|avif|woff2?)(?:\?[^"'`\s]*)?)["'`]/g,true);
 }
 return [...new Set(refs)];
}

export async function verifyChapter(directory=resolve(import.meta.dirname,'../dist')){
 const root=resolve(directory),files=await walk(root),set=new Set(files);
 check(set.has(MANIFEST),'missing release-manifest.json');
 check(Object.keys(FOREST_ASSET_SHA256).length>0,'approved chapter asset fingerprints have not been recorded');
 const allowed=[...FOREST_RUNTIME,...Object.keys(FOREST_ASSET_SHA256),MANIFEST];
 check(same(files,allowed),`file inventory differs from the positive allowlist; unexpected: ${files.filter(f=>!allowed.includes(f)).join(', ')||'(none)'}; missing: ${allowed.filter(f=>!set.has(f)).join(', ')||'(none)'}`);
 for(const file of files)check(!forbiddenPath.test(file),`private source/docs/archive path ${file}`);
 let manifest;try{manifest=JSON.parse(await readFile(resolve(root,MANIFEST),'utf8'));}catch{fail('manifest is not valid JSON');}
 check(plain(manifest)&&same(Object.keys(manifest),['schema','chapter','entry','files','catalog','revision'])&&/^[a-f0-9]{12}$/.test(manifest.revision)&&manifest.schema===1&&manifest.chapter==='forest'&&manifest.entry==='index.html'&&manifest.catalog===CATALOG,'manifest identity/schema mismatch');
 check(Array.isArray(manifest.files),'manifest files must be an array');
 check(manifest.files.every(f=>plain(f)&&same(Object.keys(f),['path','bytes','sha256'])&&typeof f.path==='string'&&Number.isInteger(f.bytes)&&f.bytes>=0&&/^[a-f0-9]{64}$/.test(f.sha256)),'manifest file record malformed');
 check(new Set(manifest.files.map(f=>f.path)).size===manifest.files.length,'manifest has duplicate file entries');
 check(same(manifest.files.map(f=>f.path),files.filter(f=>f!==MANIFEST)),'manifest does not enumerate exactly the emitted files');
 const graph=new Map(),data=new Map();let links=0;
 for(const entry of manifest.files){
  const bytes=await readFile(resolve(root,entry.path));data.set(entry.path,bytes);
  check(bytes.length===entry.bytes&&sha256(bytes)===entry.sha256,`manifest hash/size mismatch: ${entry.path}`);
  if(Object.hasOwn(FOREST_ASSET_SHA256,entry.path)){check(sha256(bytes)===FOREST_ASSET_SHA256[entry.path],`unapproved or mixed asset bytes: ${entry.path}`);assertWebP(bytes,entry.path);}
  if(['.html','.js','.css','.svg','.json'].includes(extname(entry.path))){
   const text=bytes.toString('utf8');assertForestText(text,entry.path);
   const deps=references(entry.path,text);graph.set(entry.path,deps);
   for(const dependency of deps){check(set.has(dependency),`${entry.path}: missing local dependency ${dependency}`);links++;}
  }
 }
 assertForestText(JSON.stringify(manifest),'release manifest');
 const loaded=readCatalogModule(data.get(CATALOG).toString('utf8'));
 const {definitions}=assertForestCatalog(loaded.catalog);
 const reached=new Set();const visit=file=>{if(reached.has(file))return;reached.add(file);for(const dep of graph.get(file)||[])visit(dep);};visit('index.html');
 check(files.filter(f=>f!==MANIFEST).every(f=>reached.has(f)),`unreachable files are shipped: ${files.filter(f=>f!==MANIFEST&&!reached.has(f)).join(', ')}`);
 return {chapter:'forest',files:files.length,links,definitions,assets:Object.keys(FOREST_ASSET_SHA256).length};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
 try{const report=await verifyChapter(process.argv[2]);console.log(`Verified forest release: ${report.files} allowlisted files, ${report.links} local links, ${report.definitions} closed catalogue definitions, ${report.assets} pinned chapter assets. No browser/device rendering claimed.`);}
 catch(error){console.error(error.message);process.exitCode=1;}
}
