import test from 'node:test';import assert from 'node:assert/strict';import{readFileSync,readdirSync}from'node:fs';
const dir=new URL('../src/styles/',import.meta.url);
const sheets=readdirSync(dir).filter(f=>f.endsWith('.css')).map(f=>({file:f,css:readFileSync(new URL(f,dir),'utf8')}));
test('generic button press feedback never replaces layout coordinates or transforms',()=>{
 let count=0;
 for(const{file,css}of sheets)for(const m of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)){
  const selector=m[1].replace(/\/\*[\s\S]*?\*\//g,'').trim();
  if(!selector.split(',').some(s=>/^button:active(?::not\([^)]*\))?$/.test(s.trim())))continue;
  count++;assert.doesNotMatch(m[2],/(?:^|;)\s*(?:transform|translate|scale|rotate|left|right|top|bottom|inset)\s*:/,file+':'+selector);
 }
 assert.ok(count>0);assert.match(sheets.find(s=>s.file==='game-ui.css').css,/button:active:not\(:disabled\)\{filter:brightness\(\.96\)\}/);
});
test('home building and bear anchor transforms remain intact',()=>{
 const css=sheets.find(s=>s.file==='game-ui.css').css;
 assert.match(css,/\.placed-building,\.panel-view \.placed-building\{[^}]*transform:translate\(-50%,-85%\)/);
 assert.match(css,/\.scene-worker\{[^}]*transform:translate\(-50%,-80%\)/);
 const district=sheets.find(s=>s.file==='semantic-world.css').css;
 assert.match(district,/\.district-site:nth-child\(even\)\{transform:translateY\(8px\)\}/);
});
