// Private build policy. Never copied to a public release.
export const profiles = Object.freeze({
 forest: {level:1, ready:true, title:'森林家园',
  resources:['honey','wood','minerals','iron','manpower','science','furs','ivory','unicorns','beam','slab'],
  buildings:['hive','hut','library','barn','pasture','mine','workshop','smelter','logHouse','warehouse','lumberMill'],
  science:['calendar','agriculture','archery','mining','metal','animal','construction'],
  workshop:['mineralHoes','ironHoes','mineralAxes','ironAxes','reinforcedSaw','stoneBarns','reinforcedBarns','advancedRefinement','bolas','huntingArmor','compositeBow','prospecting'],
  crafts:['wood','beam','slab'],jobs:['woodcutter','farmer','scholar','hunter','miner'],
  runtime:['main.js','engine.js','save.js','math.js','catalog.js','art.js','style.css'],
 },
 settlement:{level:2,ready:false,title:'繁荣聚落'},
 industrial:{level:3,ready:false,title:'工业时代'},
 space:{level:4,ready:false,title:'群星远航'},
 time:{level:5,ready:false,title:'时光篇章'},
});
export function releaseProfile(id){
 const profile=profiles[id];
 if(!profile)throw new Error(`Unknown release chapter: ${id}`);
 if(!profile.ready)throw new Error(`Chapter ${id} is not approved for publication; no output was produced.`);
 return profile;
}
