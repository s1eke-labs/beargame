import {sceneWorkers,buildingWorkKey} from './scene.js';
import {districts,districtFacilities,geographicRegions,civilizationEra} from './districts.js';
const configs=Object.fromEntries(districts.map(d=>[d.id,d]));
const known=c=>c&&(c.unlocked||c.owned>0||c.completed);
export function regionalState(vm,id,ui={}){
 const cfg=configs[id];if(!cfg)return {materials:[],facilities:[],workers:[],quick:[],main:null};
 const materials=cfg.materials.map(id=>vm.resources?.find(r=>r.id===id)).filter(r=>r&&(r.visible||r.value>0)).map(r=>({...r,pile:r.value<=0?0:r.value<25?1:r.value<250?2:3}));
 const facilities=geographicRegions(vm).find(d=>d.id===id)?.facilities||[];
 const actors=sceneWorkers(vm,{...ui,limit:Infinity});const workers=cfg.jobs.flatMap(id=>actors.filter(w=>w.id===id)).slice(0,2);
 // Only reversible ordinary one-shot production shortcuts. No resets, sacrifices,
 // challenge starts, time jumps, toggles, or implicit maximum-quantity operations.
 const quick=(id==='crafts'?(vm.crafts||[]).filter(c=>['craft','refine'].includes(c.type)&&known(c)):id==='trades'?(vm.actions||[]).filter(c=>c.type==='hunt'&&known(c)):[]).slice(0,2);
 return {materials,facilities,workers,quick,main:vm.buildings?.find(b=>b.id===cfg.main)||null};
}
export function regionalStateKey(vm,id,ui={}){const s=regionalState(vm,id,ui);return JSON.stringify([civilizationEra(vm).id,id,ui.regionSite,ui.readOnly,vm.settings?.paused,buildingWorkKey(vm,ui),!!vm.pendingOffline,!!vm.pendingOperation,s.materials.map(r=>[r.id,r.pile]),s.facilities.map(b=>[b.id,b.owned,b.enabled,b.stage]),s.workers.map(w=>[w.bearId,w.id,w.count,w.working,w.atCapacity]),s.quick.map(c=>[c.id,c.available,c.reason,c.costs?.map(x=>[x.id,x.value]),c.confirmationText||c.confirm||'']),vm.engineers?.cards?.map(c=>[c.id,c.assigned,c.status]),vm.diplomacy?.cards?.map(c=>[c.id,c.unlocked,c.owned])]);}
