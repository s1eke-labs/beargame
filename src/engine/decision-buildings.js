/** 建筑按需预览：比较同一时刻的真实生产函数，不推进时间或生成事件。 */
export function buildingDecision(ctx,id,before,project){
 const definition=ctx.buildingDefinition(id);
 if(!definition)return null;
 const card=ctx.card(definition);
 if((!card.unlocked&&!card.owned)||(definition.max&&card.owned>=definition.max))return null;
 const purchase=card.available,after=project(definition,purchase),scale=ctx.realTicksPerSecond();
 const resources=ctx.catalog.resources.map(resource=>{
  const beforeRate=(before.net[resource.id]||0)*scale,afterRate=(after.net[resource.id]||0)*scale;
  const beforeCapacity=before.caps[resource.id],afterCapacity=after.caps[resource.id];
  return {id:resource.id,name:resource.name,beforeRate,afterRate,rateDelta:afterRate-beforeRate,beforeCapacity,afterCapacity,
   capacityDelta:beforeCapacity==null||afterCapacity==null?null:afterCapacity-beforeCapacity};
 }).filter(row=>Math.abs(row.rateDelta)>1e-8||row.beforeCapacity!==row.afterCapacity);
 const energy={beforeSupply:before.effects.energySupply||0,afterSupply:after.effects.energySupply||0,
  beforeDemand:before.effects.energyDemand||0,afterDemand:after.effects.energyDemand||0,
  beforeEfficiency:before.effects.energyDeficit??1,afterEfficiency:after.effects.energyDeficit??1};
 return {id:card.id,name:card.name,amount:1,available:purchase,mode:purchase?'purchase':'structure',resources,energy,
  housing:{before:before.housing,after:after.housing,delta:after.housing-before.housing},
  note:purchase?'按当前季节、天气、库存及加成计算，包含本次购买扣费；后续生产和居民到来会改变结果。':'物资尚未齐备：按当前库存预估新增一座的效果，未扣除建造费用；实际购买时会重新计算。'};
}
