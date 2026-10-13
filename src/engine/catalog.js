import {engineerJobs} from './engineer-automation.js';
import {additionalBuildings} from './building-stages.js';
import {additionalWorkshop,additionalJobs} from './workshop-dynamics.js';
import {ambassadorJob} from './diplomacy.js';
import {policies} from './policy-catalog.js';
export {policies};
import {faith, space, challenges, metaphysics, time, additionalResources} from './progression-catalog.js';
export {faith, space, challenges, metaphysics, time};

/** Original catalog structure and Chinese writing. Numeric rules are documented in coverage.md. */
const resource = (id, name, cap = null, description = '') => ({id,name,cap,description});
export const resources = [
 resource('zebras','条纹猎手',1,'循着山林的足迹而来，帮助营地狩猎与积攒活力。'),
 resource('honey','蜂蜜',5000,'熊群的口粮。蜂箱受季节影响，养蜂熊的产出不受季节影响。'),
 resource('wood','木材',200,'林地采集和建设使用的基础材料。'),
 resource('minerals','矿石',250,'山地挖掘出的建筑材料。'),
 resource('iron','铁',50,'熔炉把木材与矿石冶炼成铁。'),
 resource('coal','煤',60,'燃料，也是炼钢需要的原料。'),
 resource('gold','金',10,'交换物资与远行使用。'),
 resource('titanium','钛',2,'由贸易与深层工业获得。'),
 resource('oil','石油',1500,'工业与航行燃料。'),
 resource('uranium','铀',250,'核能设施需要的原料。'),
 resource('unobtainium','月晶',150,'远方卫星上的稀有矿物。'),
 resource('antimatter','反物质',100,'需要能源盈余的星际资源。'),
 resource('manpower','活力',100,'巡林熊积攒的狩猎与探索能力。'),
 resource('science','知识',250,'学者熊在书屋里积累的研究成果。'),
 resource('culture','文化',100,'营地艺术、礼仪与记忆的积累。'),
 resource('faith','信仰',100,'静心与节庆积累的心愿，可通过祈愿汇入星光。'),
 resource('furs','毛皮'), resource('ivory','象牙'), resource('spice','香料'),
 resource('beam','木梁'),resource('slab','石板'),resource('plate','铁板'),resource('steel','钢'),
 resource('concrete','混凝土'),resource('gear','齿轮'),resource('alloy','合金'),resource('eludium','星合金'),
 resource('scaffold','脚手架'),resource('ship','船'),resource('tanker','油轮'),
 resource('parchment','纸页'),resource('manuscript','手稿'),resource('compendium','典籍'),resource('blueprint','蓝图'),
 resource('kerosene','煤油'),resource('megalith','巨石'),resource('starchart','星图'),
 resource('timeCrystal','时晶'),resource('relic','遗珍'),resource('sorrow','泪石'),resource('blackcoin','黑金'),
 resource('karma','业力'),resource('paragon','传承'),resource('burnedParagon','余烬传承'),
 resource('temporalFlux','时流',3000),resource('void','虚空'),resource('unicorns','灵鹿'),resource('plastic','塑料'),resource('microchip','微芯片'),resource('thorium','钍'),resource('bloodstone','血石'),resource('tMythril','秘银'),resource('gflops','算力'),resource('hashrates','密钥算量'),resource('elderBox','远古礼盒'),resource('wrappingPaper','礼盒绸纸'),
];
export {buildings, science, crafts} from './core-catalog.js';
import {buildings, science, crafts} from './core-catalog.js';
export {workshop} from './workshop-catalog.js';
import {workshop} from './workshop-catalog.js';
export const jobs = [
 {id:'woodcutter',name:'伐木熊',output:'wood',rate:.018,gate:{},description:'沿着林间小路采集木材。'},
 {id:'farmer',name:'养蜂熊',output:'honey',rate:1,gate:{science:'agriculture'},description:'亲手养护蜜源，产量不随季节改变。'},
 {id:'scholar',name:'学者熊',output:'science',rate:.035,gate:{buildings:{library:1}},description:'在树下书屋记录发现。'},
 {id:'hunter',name:'巡林熊',output:'manpower',rate:.06,gate:{science:'archery'},description:'巡行森林，积攒用于狩猎和远行的活力。'},
 {id:'miner',name:'矿工熊',output:'minerals',rate:.05,gate:{science:'mining'},description:'从山地带回矿石。'},
 {id:'priest',name:'祈愿熊',output:'faith',rate:.0015,gate:{science:'theology'},description:'在晨光里照看营地的心愿。'},
 {id:'geologist',name:'地质熊',output:'coal',rate:.015,gate:{science:'archeology'},description:'勘测地层，寻找煤脉。'},
];
export {trades} from './trade-catalog.js';
import {trades} from './trade-catalog.js';

export const constants = Object.freeze({TICKS_PER_SECOND:5,TICKS_PER_DAY:10,DAYS_PER_SEASON:100,SEASONS_PER_YEAR:4,SEASONS:['春','夏','秋','冬'],SEASON_FACTORS:[1.5,1,1,.25],SAVE_VERSION:1,SAVE_KEY:'beargame.save.v1',MAX_OFFLINE_SECONDS:8000,MAX_OFFLINE_SECONDS_PRESTIGE:32000});
resources.push(...additionalResources);
buildings.push(...additionalBuildings);workshop.push(...additionalWorkshop);jobs.push(...additionalJobs,ambassadorJob,...engineerJobs);
export const catalog = {resources,buildings,science,workshop,crafts,jobs,faith,space,trades,challenges,metaphysics,time,policies};

