/** Optional, standard WebMCP integration. The game also works without it. */
export function registerGameTools({snapshot,act,canAct},context=globalThis.document?.modelContext){
 if(!context||typeof context.registerTool!=='function')return {supported:false,dispose(){}};
 const controller=new AbortController();
 const result=(value)=>({content:[{type:'text',text:JSON.stringify(value)}]});
 const execute=(type,id,amount)=>{if(!canAct())return result({ok:false,message:'Game is read-only in this tab.'});return result(act(type,id,amount));};
 const tools=[
  {name:'read_game_state',title:'Read Honeywood game state',description:'Read the current local Honeywood resources, buildings, research and progression without changing the game.',inputSchema:{type:'object',properties:{},additionalProperties:false},annotations:{readOnlyHint:true,untrustedContentHint:false},execute:()=>result(snapshot())},
  {name:'gather_honey',title:'Gather honey',description:'Gather one unit of honey in the current local Honeywood game, exactly like pressing the gather button.',inputSchema:{type:'object',properties:{},additionalProperties:false},annotations:{readOnlyHint:false,untrustedContentHint:false},execute:()=>execute('gather','honey',1)},
  {name:'build',title:'Construct a Honeywood building',description:'Spend the displayed in-game resources to construct one unlocked building. First use read_game_state to find the exact building id and cost. No real money is involved.',inputSchema:{type:'object',properties:{id:{type:'string',description:'Exact id of an unlocked building from read_game_state'}},required:['id'],additionalProperties:false},annotations:{readOnlyHint:false,untrustedContentHint:false},execute:input=>{if(!input||typeof input.id!=='string'||Object.keys(input).some(k=>k!=='id'))return result({ok:false,message:'Provide only a valid building id.'});if(!snapshot().buildings.some(b=>b.id===input.id))return result({ok:false,message:'Unknown building id.'});return execute('build',input.id,1);}}
 ];
 for(const tool of tools){try{Promise.resolve(context.registerTool(tool,{signal:controller.signal})).catch(()=>{});}catch{}}
 globalThis.addEventListener?.('pagehide',()=>controller.abort(),{once:true});
 return {supported:true,dispose:()=>controller.abort()};
}
