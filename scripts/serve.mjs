import http from 'node:http';
import {readFile,stat} from 'node:fs/promises';
import {resolve,extname,sep} from 'node:path';
const root=resolve(process.argv[2]||'.'), port=Number(process.env.PORT||4173);
// Source development uses the same public URLs as the flattened build output.
// Explicit preview directories stay isolated from the source public assets.
const roots=process.argv[2]?[root]:[root,resolve(root,'public')];
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json','.png':'image/png','.webp':'image/webp','.svg':'image/svg+xml','.md':'text/plain; charset=utf-8'};
const server=http.createServer(async(req,res)=>{
 try{
  const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  for(const base of roots){
   let target=resolve(base,'.'+pathname);
   if(target!==base&&!target.startsWith(base+sep)){
    res.writeHead(403);return res.end('Forbidden');
   }
   try{
    if((await stat(target)).isDirectory())target=resolve(target,'index.html');
    const content=await readFile(target);
    res.writeHead(200,{'Content-Type':types[extname(target)]||'application/octet-stream','Cache-Control':'no-cache','X-Content-Type-Options':'nosniff'});
    return res.end(content);
   }catch(error){
    if(error.code!=='ENOENT'&&error.code!=='ENOTDIR')throw error;
   }
  }
 }catch{}
 res.writeHead(404);res.end('Not found');
});
server.listen(port,'0.0.0.0',()=>console.log(`Honeywood: http://localhost:${server.address().port}`));
