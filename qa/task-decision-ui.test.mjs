import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createGame} from '../src/engine/index.js';
import {guidance} from '../src/ui/experience.js';
import {buildChoices,recipeChoices,researchCategories,choiceStatus,facilityState,trackedGoal,missingLinks} from '../src/ui/decision-navigation.js';

const fresh=()=>createGame({storage:null,now:1,seed:19}).snapshot();

test('配方搜索实际原料与产物名称，并继续遵守当前可用性筛选',()=>{
 const vm=createGame({storage:null,save:readFileSync(new URL('./campaign/first-space.save.json',import.meta.url),'utf8')}).snapshot();
 assert.ok(recipeChoices(vm,{recipeQuery:'木材'}).some(c=>c.id==='beam'));
 assert.ok(recipeChoices(vm,{recipeQuery:'煤'}).some(c=>c.id==='steel'));
 assert.ok(recipeChoices(vm,{recipeQuery:'齿轮'}).some(c=>c.id==='gear'));
 assert.ok(recipeChoices(vm,{recipeQuery:'煤',recipeAvailability:'available'}).every(c=>c.available));
});

test('阶段建议展示入住终点和建议口粮，不改变可建熊舍条件',()=>{
 const vm=fresh();vm.buildings.find(c=>c.id==='hive').owned=2;
 const before=structuredClone(vm),guide=guidance(vm);
 assert.equal(guide.stage.title,'迎接第一位伙伴');
 assert.match(guide.stage.note,/不是入住的解锁条件/);
 assert.deepEqual(guide.stage.steps.map(s=>s.target),[20,1500,1]);
 assert.equal(guide.stage.steps[0].current,2);
 assert.equal(guide.stage.steps[2].detail,'buildings:hut');
 assert.deepEqual(vm,before);
 vm.bears.value=1;vm.bears.free=1;
 assert.equal(guidance(vm).stage.id,'learning');
 vm.science[0].completed=true;
 assert.equal(guidance(vm).stage,null);
});

test('研究主题从结构化效果及直接解锁推导，文案改变不影响多主题',()=>{
 const vm=fresh(),construction=vm.science.find(c=>c.id==='construction');
 const tags=researchCategories(construction);
 assert.ok(tags.includes('production'));
 assert.ok(tags.includes('storage'));
 assert.ok(tags.includes('village'));
 assert.deepEqual(researchCategories({...construction,name:'改名',effects:'',opens:[]}),tags);
 assert.deepEqual(researchCategories({id:'unknown',type:'upgrade',effect:{scienceRatio:.1,scienceMax:100}}),['production','storage']);
});

test('建筑和配方按可用性或最近操作排序，同时保留筛选范围和原数组',()=>{
 const vm=fresh(),before=vm.buildings.map(c=>c.id);
 for(const c of vm.buildings)c.available=c.id==='library';
 assert.equal(buildChoices(vm,{buildSort:'available'})[0].id,'library');
 assert.equal(buildChoices(vm,{buildSort:'recent',recentBuildings:['hut','hive']})[0].id,'hut');
 assert.deepEqual(vm.buildings.map(c=>c.id),before);
 vm.crafts=[{id:'beam',name:'木梁',unlocked:true,available:false,costs:[]},{id:'slab',name:'石板',unlocked:true,available:true,costs:[]}];
 assert.equal(recipeChoices(vm,{recipeSort:'available'})[0].id,'slab');
 assert.equal(recipeChoices(vm,{recipeSort:'recent',recentRecipes:['beam']})[0].id,'beam');
 assert.deepEqual(recipeChoices(vm,{recipeQuery:'木梁',recipeAvailability:'available'}),[]);
});

test('选择项区分资源短缺、容量阻塞与生产状态',()=>{
 const vm=fresh(),wood=vm.resources.find(r=>r.id==='wood');
 assert.equal(choiceStatus({costs:[{id:'wood',name:'木材',owned:0,value:wood.max+1}]},vm).tone,'blocked');
 assert.match(choiceStatus({costs:[{id:'wood',name:'木材',owned:0,value:1}]},vm).label,/缺木材 1/);
 assert.deepEqual(choiceStatus({type:'build',available:true},vm),{label:'可建造',tone:'ready'});
 assert.deepEqual(facilityState({toggleable:true,enabled:false},vm),{label:'已暂停',tone:'idle'});
 vm.energy={supply:0,demand:1};
 assert.equal(facilityState({id:'factory'},vm).tone,'blocked');
});

test('追踪重复建筑在本次数量达标后才完成，并保留返回原项目入口',()=>{
 const vm=fresh(),hive=vm.buildings.find(c=>c.id==='hive'),ui={trackedTarget:{section:'buildings',id:'hive',targetOwned:2}};
 hive.owned=1;
 assert.doesNotMatch(trackedGoal(vm,ui),/目标已完成/);
 assert.match(trackedGoal(vm,ui),/data-resume-target="buildings:hive"/);
 hive.owned=2;
 assert.match(trackedGoal(vm,ui),/目标已完成/);
 assert.match(trackedGoal(vm,ui),/查看成果/);
 const library=vm.buildings.find(c=>c.id==='library');
 assert.match(missingLinks(library,vm),/data-task-target="buildings:library"/);
});

test('远航追踪区分已启程、暂停与真正抵达',()=>{
 const game=createGame({storage:null,now:1,seed:19}),save=JSON.parse(game.export());
 save.science.rocketry=true;save.space.orbitalLaunch=1;save.spaceTravel.orbitalLaunch=100;
 assert.equal(game.importSave(JSON.stringify(save)).ok,true);
 const vm=game.snapshot(),mission=vm.progression.spaceCards.find(c=>c.id==='orbitalLaunch');
 assert.equal(mission.completed,true);assert.equal(mission.reached,false);assert.ok(mission.travelDays>0);
 const ui={trackedTarget:{section:'space',id:'orbitalLaunch',targetOwned:1}};
 assert.match(trackedGoal(vm,ui),/正在航行/);assert.doesNotMatch(trackedGoal(vm,ui),/目标已完成/);
 vm.settings.paused=true;assert.match(trackedGoal(vm,ui),/已随游戏暂停/);assert.doesNotMatch(trackedGoal(vm,ui),/后抵达/);
 mission.travelDays=0;mission.reached=true;
 assert.match(trackedGoal(vm,ui),/目标已完成/);assert.match(trackedGoal(vm,ui),/查看成果/);
});
