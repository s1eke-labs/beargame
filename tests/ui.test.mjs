import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {registerGameTools} from '../src/ui/webmcp.js';
import {atlasCrops} from '../src/ui/art-data.js';
import {art,esc,fmt,pct,cardsFor} from '../src/ui/render.js';

test('optional WebMCP is silent and safe when unsupported',()=>{
 const result=registerGameTools({},null);assert.equal(result.supported,false);assert.doesNotThrow(()=>result.dispose());
});
test('WebMCP registers only actual non-destructive gameplay tools and validates building identifiers',async()=>{
 const calls=[],actions=[];const state={buildings:[{id:'hive'}]};
 const result=registerGameTools({snapshot:()=>state,canAct:()=>true,act:(...args)=>{actions.push(args);return {ok:true};}},{registerTool:(tool,options)=>calls.push({tool,options})});
 assert.deepEqual(calls.map(c=>c.tool.name),['read_game_state','gather_honey','build']);
 assert.equal(calls[0].tool.annotations.readOnlyHint,true);
 assert.equal(JSON.parse(calls[0].tool.execute().content[0].text).buildings[0].id,'hive');
 assert.equal(JSON.parse(calls[2].tool.execute({id:'unknown'}).content[0].text).ok,false);
 assert.equal(JSON.parse(calls[2].tool.execute({id:'hive',amount:100}).content[0].text).ok,false);
 assert.equal(actions.length,0);
 calls[1].tool.execute({});calls[2].tool.execute({id:'hive'});
 assert.deepEqual(actions,[['gather','honey',1],['build','hive',1]]);
 result.dispose();assert.equal(calls[0].options.signal.aborted,true);
});
test('WebMCP side effects respect read-only tab ownership',()=>{
 const tools=[];let count=0;registerGameTools({snapshot:()=>({buildings:[{id:'hive'}]}),canAct:()=>false,act:()=>count++},{registerTool:t=>tools.push(t)});
 for(const tool of tools.slice(1))assert.equal(JSON.parse(tool.execute({id:'hive'}).content[0].text).ok,false);
 assert.equal(count,0);
});
test('generated raster atlas bounds are finite and contained in original images',()=>{
 for(const group of Object.values(atlasCrops))for(const c of Object.values(group)){assert.ok(c.x>=0&&c.y>=0&&c.width>0&&c.height>0);assert.ok(c.x+c.width<=1254);assert.ok(c.y+c.height<=1254);}
 const rendered=art('resource','honey');assert.match(rendered,/atlas-sprite/);assert.doesNotMatch(rendered,/undefined|NaN|Infinity/);
});
test('display helpers escape imported strings and bound storage fill',()=>{
 assert.equal(esc('<img src=x onerror="x">'), '&lt;img src=x onerror=&quot;x&quot;&gt;');
 assert.equal(pct(1000,10),100);assert.equal(pct(-2,10),0);assert.equal(fmt(0), '0');assert.equal(fmt(null),'∞');
});
test('dynamic late progression cards take precedence over static catalogs',()=>{
 const vm={faith:[{id:'old'}],progression:{faithCards:[{id:'new'}],actions:[{id:'adore'}],time:[{id:'furnace'}]}};
 assert.equal(cardsFor(vm,'faith')[0].id,'new');assert.equal(cardsFor(vm,'progressionActions')[0].id,'adore');assert.equal(cardsFor(vm,'time')[0].id,'furnace');
});
test('runtime remains local with no analytics or network-save endpoints',async()=>{
 const source=await readFile(new URL('../src/main.js',import.meta.url),'utf8');
 assert.doesNotMatch(source,/\bfetch\s*\(|\bXMLHttpRequest\b|navigator\.sendBeacon/);
 assert.match(source,/LEASE_KEY/);assert.match(source,/pointerActive/);assert.match(source,/aria-modal/);assert.match(source,/settings\.offline/);
});
