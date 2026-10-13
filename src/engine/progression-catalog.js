/** Progression rules and feature definitions. */
const upgrade=(id,name,cost,ratio,gate,effect={},extra={})=>({id,name,cost,ratio,gate,effect,type:'faith',description:'',...extra});
export const faith=[
 {
  "id": "solarchant",
  "name": "晨光祈歌",
  "type": "faith",
  "cost": {
   "faith": 100
  },
  "ratio": 2.5,
  "gate": {
   "science": "theology",
   "praised": 150
  },
  "repeatAfterTranscendence": true,
  "oneTime": false,
  "family": "worship",
  "effect": {
   "faithRatioReligion": 0.1
  },
  "source": "js/religion.js:1046–1254",
  "description": "用信仰实现星愿；颂愿用于开启门槛，不会在购买时扣除。"
 },
 {
  "id": "scholasticism",
  "name": "神殿研习",
  "type": "faith",
  "cost": {
   "faith": 250
  },
  "ratio": 2.5,
  "gate": {
   "science": "theology",
   "praised": 300
  },
  "repeatAfterTranscendence": true,
  "oneTime": false,
  "family": "worship",
  "effect": {},
  "source": "js/religion.js:1046–1254",
  "description": "用信仰实现星愿；颂愿用于开启门槛，不会在购买时扣除。"
 },
 {
  "id": "goldenSpire",
  "name": "金蜜尖塔",
  "type": "faith",
  "cost": {
   "gold": 150,
   "faith": 350
  },
  "ratio": 2.5,
  "gate": {
   "science": "theology",
   "praised": 500
  },
  "repeatAfterTranscendence": true,
  "oneTime": false,
  "family": "worship",
  "effect": {},
  "source": "js/religion.js:1046–1254",
  "description": "用信仰实现星愿；颂愿用于开启门槛，不会在购买时扣除。"
 },
 {
  "id": "sunAltar",
  "name": "朝日坛",
  "type": "faith",
  "cost": {
   "gold": 250,
   "faith": 500
  },
  "ratio": 2.5,
  "gate": {
   "science": "theology",
   "praised": 750
  },
  "repeatAfterTranscendence": true,
  "oneTime": false,
  "family": "worship",
  "effect": {},
  "source": "js/religion.js:1046–1254",
  "description": "用信仰实现星愿；颂愿用于开启门槛，不会在购买时扣除。"
 },
 {
  "id": "stainedGlass",
  "name": "彩光窗",
  "type": "faith",
  "cost": {
   "gold": 250,
   "faith": 500
  },
  "ratio": 2.5,
  "gate": {
   "science": "theology",
   "praised": 750
  },
  "repeatAfterTranscendence": true,
  "oneTime": false,
  "family": "worship",
  "effect": {},
  "source": "js/religion.js:1046–1254",
  "description": "用信仰实现星愿；颂愿用于开启门槛，不会在购买时扣除。"
 },
 {
  "id": "solarRevolution",
  "name": "日耀启明",
  "type": "faith",
  "cost": {
   "gold": 500,
   "faith": 750
  },
  "ratio": 1,
  "gate": {
   "science": "theology",
   "praised": 1000
  },
  "repeatAfterTranscendence": false,
  "oneTime": true,
  "family": "worship",
  "effect": {},
  "source": "js/religion.js:1046–1254",
  "description": "用信仰实现星愿；颂愿用于开启门槛，不会在购买时扣除。"
 },
 {
  "id": "basilica",
  "name": "群山礼堂",
  "type": "faith",
  "cost": {
   "gold": 750,
   "faith": 1250
  },
  "ratio": 2.5,
  "gate": {
   "science": "theology",
   "praised": 10000
  },
  "repeatAfterTranscendence": true,
  "oneTime": false,
  "family": "worship",
  "effect": {},
  "source": "js/religion.js:1046–1254",
  "description": "用信仰实现星愿；颂愿用于开启门槛，不会在购买时扣除。"
 },
 {
  "id": "templars",
  "name": "守林誓约",
  "type": "faith",
  "cost": {
   "gold": 3000,
   "faith": 3500
  },
  "ratio": 2.5,
  "gate": {
   "science": "theology",
   "praised": 75000
  },
  "repeatAfterTranscendence": true,
  "oneTime": false,
  "family": "worship",
  "effect": {},
  "source": "js/religion.js:1046–1254",
  "description": "用信仰实现星愿；颂愿用于开启门槛，不会在购买时扣除。"
 },
 {
  "id": "apocripha",
  "name": "灵悟手记",
  "type": "faith",
  "cost": {
   "gold": 5000,
   "faith": 5000
  },
  "ratio": 1,
  "gate": {
   "science": "theology",
   "praised": 100000
  },
  "repeatAfterTranscendence": false,
  "oneTime": true,
  "family": "worship",
  "effect": {},
  "source": "js/religion.js:1046–1254",
  "description": "用信仰实现星愿；颂愿用于开启门槛，不会在购买时扣除。"
 },
 {
  "id": "transcendence",
  "name": "升华之路",
  "type": "faith",
  "cost": {
   "gold": 7500,
   "faith": 7500
  },
  "ratio": 1,
  "gate": {
   "science": "theology",
   "praised": 125000
  },
  "repeatAfterTranscendence": false,
  "oneTime": true,
  "family": "worship",
  "effect": {},
  "source": "js/religion.js:1046–1254",
  "description": "用信仰实现星愿；颂愿用于开启门槛，不会在购买时扣除。"
 },
 {
  "id": "frescoes",
  "name": "山灵壁画",
  "type": "faith",
  "cost": {
   "gold": 5000,
   "faith": 4000,
   "spice": 8000
  },
  "ratio": 2.5,
  "gate": {
   "science": "theology",
   "praised": 200000
  },
  "repeatAfterTranscendence": true,
  "oneTime": false,
  "family": "worship",
  "effect": {},
  "source": "js/religion.js:1046–1254",
  "description": "用信仰实现星愿；颂愿用于开启门槛，不会在购买时扣除。"
 },
 {
  "id": "blackObelisk",
  "name": "夜晶碑",
  "type": "faith",
  "cost": {
   "relic": 100
  },
  "ratio": 1.15,
  "gate": {
   "science": "cryptotheology",
   "transcendence": 1
  },
  "effect": {
   "solarLimitPerTier": 0.05
  },
  "family": "transcendence",
  "source": "js/religion.js:1257–1480",
  "description": "升华阶位解锁的星愿建筑，重建营地后保留。"
 },
 {
  "id": "blackNexus",
  "name": "暗光汇点",
  "type": "faith",
  "cost": {
   "relic": 5000
  },
  "ratio": 1.15,
  "gate": {
   "science": "cryptotheology",
   "transcendence": 3
  },
  "effect": {
   "relicRefineRatio": 1
  },
  "family": "transcendence",
  "source": "js/religion.js:1257–1480",
  "description": "升华阶位解锁的星愿建筑，重建营地后保留。"
 },
 {
  "id": "blackCore",
  "name": "幽晶核",
  "type": "faith",
  "cost": {
   "relic": 10000
  },
  "ratio": 1.15,
  "gate": {
   "science": "cryptotheology",
   "transcendence": 5
  },
  "effect": {
   "sorrowMax": 1
  },
  "family": "transcendence",
  "source": "js/religion.js:1257–1480",
  "description": "升华阶位解锁的星愿建筑，重建营地后保留。"
 },
 {
  "id": "singularity",
  "name": "群星奇点",
  "type": "faith",
  "cost": {
   "relic": 25000
  },
  "ratio": 1.15,
  "gate": {
   "science": "cryptotheology",
   "transcendence": 7
  },
  "effect": {
   "globalResourceRatio": 0.1
  },
  "family": "transcendence",
  "source": "js/religion.js:1257–1480",
  "description": "升华阶位解锁的星愿建筑，重建营地后保留。"
 },
 {
  "id": "blackLibrary",
  "name": "夜林藏书馆",
  "type": "faith",
  "cost": {
   "relic": 30000
  },
  "ratio": 1.15,
  "gate": {
   "science": "cryptotheology",
   "transcendence": 9
  },
  "effect": {
   "compendiaTTBoostRatio": 0.02
  },
  "family": "transcendence",
  "source": "js/religion.js:1257–1480",
  "description": "升华阶位解锁的星愿建筑，重建营地后保留。"
 },
 {
  "id": "blackRadiance",
  "name": "静夜光辉",
  "type": "faith",
  "cost": {
   "relic": 37500
  },
  "ratio": 1.15,
  "gate": {
   "science": "cryptotheology",
   "transcendence": 12
  },
  "effect": {
   "blsCorruptionRatio": 0.0012
  },
  "family": "transcendence",
  "source": "js/religion.js:1257–1480",
  "description": "升华阶位解锁的星愿建筑，重建营地后保留。"
 },
 {
  "id": "blazar",
  "name": "远星脉冲",
  "type": "faith",
  "cost": {
   "relic": 50000
  },
  "ratio": 1.15,
  "gate": {
   "science": "cryptotheology",
   "transcendence": 15
  },
  "effect": {
   "timeRatio": 0.1,
   "rrRatio": 0.02
  },
  "family": "transcendence",
  "source": "js/religion.js:1257–1480",
  "description": "升华阶位解锁的星愿建筑，重建营地后保留。"
 },
 {
  "id": "darkNova",
  "name": "暗星新生",
  "type": "faith",
  "cost": {
   "relic": 75000,
   "void": 7500
  },
  "ratio": 1.15,
  "gate": {
   "science": "cryptotheology",
   "transcendence": 20
  },
  "effect": {
   "energyProductionRatio": 0.02
  },
  "family": "transcendence",
  "source": "js/religion.js:1257–1480",
  "description": "升华阶位解锁的星愿建筑，重建营地后保留。"
 },
 {
  "id": "mausoleum",
  "name": "长眠星庭",
  "type": "faith",
  "cost": {
   "relic": 50000,
   "void": 12500,
   "necrocorn": 10
  },
  "ratio": 1.15,
  "gate": {
   "science": "cryptotheology",
   "transcendence": 23
  },
  "effect": {
   "pactsAvailable": 1
  },
  "family": "transcendence",
  "source": "js/religion.js:1257–1480",
  "description": "升华阶位解锁的星愿建筑，重建营地后保留。",
  "unsupported": "本版本未启用的实验分支"
 },
 {
  "id": "holyGenocide",
  "name": "族群升格",
  "type": "faith",
  "cost": {
   "relic": 100000,
   "void": 25000
  },
  "ratio": 1.15,
  "gate": {
   "science": "cryptotheology",
   "transcendence": 25
  },
  "effect": {
   "maxKittensRatio": -0.01,
   "simScalingRatio": 0.02
  },
  "family": "transcendence",
  "source": "js/religion.js:1257–1480",
  "description": "升华阶位解锁的星愿建筑，重建营地后保留。"
 },
 {
  "id": "darkParacosm",
  "name": "镜外森林",
  "type": "faith",
  "cost": {
   "relic": 230000,
   "void": 29000,
   "paragon": 8
  },
  "ratio": 1.75,
  "gate": {
   "science": "cryptotheology",
   "transcendence": 27
  },
  "effect": {
   "milleninumParagon": 1
  },
  "family": "transcendence",
  "source": "js/religion.js:1257–1480",
  "description": "升华阶位解锁的星愿建筑，重建营地后保留。",
  "unsupported": "本版本未启用的实验分支"
 }
];
export const space=[
 {
  "id": "orbitalLaunch",
  "name": "初探星空",
  "type": "space",
  "cost": {
   "oil": 15000,
   "manpower": 5000,
   "science": 100000,
   "starchart": 250
  },
  "oneTime": true,
  "family": "mission",
  "destination": "cath",
  "days": 0,
  "anyMissions": [],
  "gate": {
   "science": "rocketry"
  },
  "effect": {},
  "source": "js/space.js:23–209",
  "description": "支付航行物资后启程，航路抵达后开放当地建设。"
 },
 {
  "id": "moonMission",
  "name": "月林之旅",
  "type": "space",
  "cost": {
   "titanium": 5000,
   "oil": 45000,
   "science": 125000,
   "starchart": 500
  },
  "oneTime": true,
  "family": "mission",
  "destination": "moon",
  "days": 30,
  "anyMissions": [
   "orbitalLaunch"
  ],
  "gate": {
   "science": "rocketry"
  },
  "effect": {},
  "source": "js/space.js:23–209",
  "description": "支付航行物资后启程，航路抵达后开放当地建设。"
 },
 {
  "id": "duneMission",
  "name": "远赴沙海",
  "type": "space",
  "cost": {
   "titanium": 7000,
   "science": 175000,
   "starchart": 1000,
   "kerosene": 75
  },
  "oneTime": true,
  "family": "mission",
  "destination": "dune",
  "days": 356,
  "anyMissions": [
   "moonMission"
  ],
  "gate": {
   "science": "rocketry"
  },
  "effect": {},
  "source": "js/space.js:23–209",
  "description": "支付航行物资后启程，航路抵达后开放当地建设。"
 },
 {
  "id": "piscineMission",
  "name": "探访潮星",
  "type": "space",
  "cost": {
   "titanium": 9000,
   "science": 200000,
   "starchart": 1500,
   "kerosene": 250
  },
  "oneTime": true,
  "family": "mission",
  "destination": "piscine",
  "days": 256,
  "anyMissions": [
   "moonMission"
  ],
  "gate": {
   "science": "rocketry"
  },
  "effect": {},
  "source": "js/space.js:23–209",
  "description": "支付航行物资后启程，航路抵达后开放当地建设。"
 },
 {
  "id": "heliosMission",
  "name": "近日前哨",
  "type": "space",
  "cost": {
   "titanium": 15000,
   "science": 250000,
   "starchart": 3000,
   "kerosene": 1250
  },
  "oneTime": true,
  "family": "mission",
  "destination": "helios",
  "days": 1200,
  "anyMissions": [
   "duneMission",
   "terminusMission"
  ],
  "gate": {
   "science": "rocketry"
  },
  "effect": {},
  "source": "js/space.js:23–209",
  "description": "支付航行物资后启程，航路抵达后开放当地建设。"
 },
 {
  "id": "terminusMission",
  "name": "冰境航行",
  "type": "space",
  "cost": {
   "titanium": 12000,
   "science": 225000,
   "starchart": 2500,
   "kerosene": 750
  },
  "oneTime": true,
  "family": "mission",
  "destination": "terminus",
  "days": 2500,
  "anyMissions": [
   "piscineMission"
  ],
  "gate": {
   "science": "rocketry"
  },
  "effect": {},
  "source": "js/space.js:23–209",
  "description": "支付航行物资后启程，航路抵达后开放当地建设。"
 },
 {
  "id": "kairoMission",
  "name": "访寻微星",
  "type": "space",
  "cost": {
   "titanium": 20000,
   "science": 300000,
   "starchart": 5000,
   "kerosene": 7500
  },
  "oneTime": true,
  "family": "mission",
  "destination": "kairo",
  "days": 5000,
  "anyMissions": [
   "terminusMission"
  ],
  "gate": {
   "science": "rocketry"
  },
  "effect": {},
  "source": "js/space.js:23–209",
  "description": "支付航行物资后启程，航路抵达后开放当地建设。"
 },
 {
  "id": "rorschachMission",
  "name": "深空回声",
  "type": "space",
  "cost": {
   "titanium": 80000,
   "science": 500000,
   "starchart": 15000,
   "kerosene": 25000
  },
  "oneTime": true,
  "family": "mission",
  "destination": null,
  "days": 0,
  "anyMissions": [
   "kairoMission"
  ],
  "gate": {
   "science": "rocketry"
  },
  "effect": {},
  "source": "js/space.js:23–209",
  "description": "支付航行物资后启程，航路抵达后开放当地建设。"
 },
 {
  "id": "yarnMission",
  "name": "翠星远征",
  "type": "space",
  "cost": {
   "titanium": 35000,
   "science": 350000,
   "starchart": 7500,
   "kerosene": 12000
  },
  "oneTime": true,
  "family": "mission",
  "destination": "yarn",
  "days": 3800,
  "anyMissions": [
   "heliosMission"
  ],
  "gate": {
   "science": "rocketry"
  },
  "effect": {},
  "source": "js/space.js:23–209",
  "description": "支付航行物资后启程，航路抵达后开放当地建设。"
 },
 {
  "id": "umbraMission",
  "name": "暗隙探航",
  "type": "space",
  "cost": {
   "science": 500000,
   "starchart": 25000,
   "kerosene": 25000,
   "thorium": 15000
  },
  "oneTime": true,
  "family": "mission",
  "destination": "umbra",
  "days": 7500,
  "anyMissions": [
   "yarnMission"
  ],
  "gate": {
   "science": "rocketry"
  },
  "effect": {},
  "source": "js/space.js:23–209",
  "description": "支付航行物资后启程，航路抵达后开放当地建设。"
 },
 {
  "id": "charonMission",
  "name": "遥望冥岸",
  "type": "space",
  "cost": {
   "science": 750000,
   "starchart": 75000,
   "kerosene": 35000,
   "thorium": 35000
  },
  "oneTime": true,
  "family": "mission",
  "destination": "charon",
  "days": 25000,
  "anyMissions": [
   "umbraMission"
  ],
  "gate": {
   "science": "rocketry"
  },
  "effect": {},
  "source": "js/space.js:23–209",
  "description": "支付航行物资后启程，航路抵达后开放当地建设。"
 },
 {
  "id": "centaurusSystemMission",
  "name": "双星归途",
  "type": "space",
  "cost": {
   "titanium": 40000,
   "science": 800000,
   "starchart": 100000,
   "kerosene": 50000,
   "thorium": 50000
  },
  "oneTime": true,
  "family": "mission",
  "destination": "centaurusSystem",
  "days": 120000,
  "anyMissions": [
   "rorschachMission"
  ],
  "gate": {
   "science": "rocketry"
  },
  "effect": {},
  "source": "js/space.js:23–209",
  "description": "支付航行物资后启程，航路抵达后开放当地建设。"
 },
 {
  "id": "furthestRingMission",
  "name": "极远星环",
  "type": "space",
  "cost": {
   "science": 1250000,
   "starchart": 500000,
   "kerosene": 75000,
   "thorium": 75000
  },
  "oneTime": true,
  "family": "mission",
  "destination": "furthestRing",
  "days": 725000000,
  "anyMissions": [
   "centaurusSystemMission"
  ],
  "gate": {
   "science": "rocketry"
  },
  "effect": {},
  "source": "js/space.js:23–209",
  "description": "支付航行物资后启程，航路抵达后开放当地建设。"
 }
];
export const additionalResources=[['tears','灵露'],['alicorn','星翼鹿'],['necrocorn','夜影鹿']].map(([id,name])=>({id,name,cap:null,description:'林间星愿与远古祭坛积累的稀有资源。'}));
// Facts: js/prestige.js:5–488. A new dependency-oriented representation.
const perk=(id,name,price,parent,effect={},summary='')=>({id,name,type:'metaphysics',cost:{paragon:price},gate:{science:'metaphysics',...(parent?{metaphysics:[parent]}:{})},oneTime:true,effect,summary,description:'跨越营地重建后仍然保留。',source:'js/prestige.js:5–488'});
export const metaphysics=[
 perk('engeneering','营建记忆',5,null,{priceReduction:.01},'建筑价格倍率减 0.01'),
 perk('codexVox','口述蜜典',25,'engeneering',{manuscriptCraftRatio:.25,manuscriptGlobalCraftRatio:.05}),
 perk('codexLogos','思辨蜜典',50,'codexVox',{manuscriptGlobalCraftRatio:.05,compendiumCraftRatio:.25,compendiumGlobalCraftRatio:.05}),
 perk('codexAgrum','星野蜜典',75,'codexLogos',{manuscriptGlobalCraftRatio:.05,compendiumGlobalCraftRatio:.05,blueprintCraftRatio:.25,blueprintGlobalCraftRatio:.05}),
 perk('megalomania','远古回声',10,'engeneering',{},'开放远古黑塔'),
 perk('blackCodex','夜色蜜典',25,'megalomania',{},'开放灵鹿古园'),
 perk('codexLeviathanianus','巨鲸蜜典',75,'codexLogos',{},'使升华与黑典藏馆提高百科容量上限'),
 perk('goldenRatio','金蜜比例',50,'engeneering',{priceReduction:(1+Math.sqrt(5))/200}),
 perk('divineProportion','星愿比例',100,'goldenRatio',{priceReduction:16/900}),
 perk('vitruvianFeline','熊掌比例',250,'divineProportion',{priceReduction:.02}),
 perk('renaissance','林地新生',750,'vitruvianFeline',{priceReduction:.0225}),
 perk('diplomacy','林间善意',5,null,{standingRatio:.1}),
 perk('zebraDiplomacy','草原约定',35,'diplomacy'),perk('zebraCovenant','草原盟誓',75,'zebraDiplomacy'),perk('navigationDiplomacy','海路盟誓',300,'zebraCovenant'),
 perk('ambassadors','远行使者',100,'diplomacy'),perk('treaties','营地条约',500,'ambassadors',{embassiesPerAmbassadorSlot:30,ambassadorBoostPerRank:.1}),
 perk('chronomancy','时轮记忆',25,null,{},'随机天象出现机会提高 10%'),
 perk('astromancy','星迹记忆',50,'chronomancy',{},'星象机会与自动观测效率提高'),
 perk('unicornmancy','灵鹿记忆',125,'chronomancy',{},'灵鹿相关天象机会提高 10%'),
 perk('alicornmancy','星翼记忆',200,'unicornmancy',{},'灵鹿建筑在夜影鹿出现前产生星翼鹿'),
 perk('anachronomancy','逆时记忆',125,'chronomancy',{},'重建时保留时晶与时空物理研究'),
 perk('carnivals','蜜林嘉年华',25,null,{},'允许累积节庆时长'),
 perk('numerology','星序规律',50,'carnivals',{},'行星产出随星周期变化'),
 perk('numeromancy','星序共鸣',250,'numerology',{},'节庆期间触发星周期额外增益'),
 perk('willenfluff','绒毛呼唤',150,'numerology',{growthRatio:.75}),perk('pawgan','熊掌召集',400,'willenfluff',{growthRatio:1.5}),
 perk('voidOrder','空境低语',75,'numerology',{},'每个时刻自动积累部分星愿'),
 perk('adjustmentBureau','远行试炼',5,null,{},'开放重建挑战'),perk('ascoh','储备明鉴',5,'adjustmentBureau',{},'显示试炼储备的准确物资与小熊详情'),
];
const wisdomIds=['malkuth','yesod','hod','netzach','tiferet','gevurah','chesed','binah','chokhmah','keter'];
const wisdomPrices=[500,750,1250,1750,2500,5000,7500,15000,30000,60000];
wisdomIds.forEach((id,i)=>metaphysics.push(perk(id,`传承环 ${i+1}`,wisdomPrices[i],i?wisdomIds[i-1]:'numeromancy',{paragonRatio:.05},'传承效力加 5%')));
// Facts: js/time.js:316–644. Gate facts: js/science.js:780–849, js/workshop.js:423–452,2050–2065.
const forge={workshop:'chronoforge'};
const clockwork=(id,name,cost,ratio,gate,effect,extra={})=>({id,name,type:'time',cost,ratio,gate,effect,description:'用于穿越时光或延续营地。',source:'js/time.js:316–644',...extra});
export const time=[
 clockwork('temporalBattery','时流蓄池',{timeCrystal:5},1.25,forge,{temporalFluxMax:750}),
 clockwork('blastFurnace','时焰熔炉',{timeCrystal:25,relic:5},1.25,forge,{heatPerTick:.02,heatMax:100}),
 clockwork('timeBoiler','时焰锅炉',{timeCrystal:25000},1.25,{...forge,time:{blastFurnace:1}},{heatMaxExpansion:10,energyDemand:1}),
 clockwork('controlledDelay','节律闸门',{timeCrystal:1,gear:10},1,{workshop:'tachyonModerator'},{energyDemand:.75},{max:25}),
 clockwork('temporalAccelerator','时轮增幅器',{timeCrystal:10,relic:1000},1.25,forge,{timeRatio:.05}),
 clockwork('temporalImpedance','远时缓冲器',{timeCrystal:100,relic:250},1.05,forge,{timeImpedance:1000}),
 clockwork('ressourceRetrieval','旧年采集器',{timeCrystal:1000},1.3,{science:'paradoxalKnowledge',...forge},{shatterTCGain:.01},{max:100}),
 clockwork('temporalPress','时页压机',{timeCrystal:100,void:10},1.1,forge,{energyDemand:5}),
 clockwork('cryochambers','冬眠舱',{karma:1,timeCrystal:2,void:100},1.25,{science:'voidSpace'},{bears:1}),
 clockwork('voidHoover','空境采集器',{antimatter:1000,timeCrystal:10,void:250},1.25,{workshop:'voidAspiration'},{temporalParadoxVoid:1}),
 clockwork('voidRift','空境裂隙',{void:75},1.3,{workshop:'voidAspiration'},{umbraBoostRatio:.1,globalResourceRatio:.02}),
 clockwork('chronocontrol','时序锚点',{temporalFlux:3000,timeCrystal:30,void:500},1.25,{science:'paradoxalKnowledge'},{temporalParadoxDay:1,energyDemand:15}),
 clockwork('voidResonator','空境共鸣器',{timeCrystal:1000,relic:10000,void:50},1.25,{science:'paradoxalKnowledge'},{voidResonance:.1}),
];
const trial=(id,name,summary,unlock='initial')=>({id,name,type:'challenge',cost:{},gate:{metaphysics:['adjustmentBureau'],...(unlock==='initial'?{}:{challenge:unlock})},description:summary,summary,source:'js/challenges.js:43–485'});
export const challenges=[
 trial('ironWill','独行森林','不建造住房的独行模式。'),trial('winterIsComing','漫长寒冬','始终处于冬季；抵达内侧恒星后完成。'),
 trial('anarchy','自在熊群','技能与领队不可用，部分熊保持休息；建成智能核心后完成。'),
 trial('energy','紧缺能源','设施耗能加倍并随完成次数增加；需要建成全部能源设施。','energy'),
 trial('atheism','无星长夜','不能积累信仰；带着可用冬眠舱重建后完成。','atheism'),
 trial('1000Years','千年之旅','时晶穿越更贵；通过时晶抵达第 1000 年。','1000Years'),
 trial('blackSky','无光天幕','天象不再出现；建成更多深空信标后完成。','blackSky'),
 trial('pacifism','和平山林','停止狩猎与武器加成；达成外空条约后重建。','pacifism'),
 trial('unicornTears','灵露试炼','建造与研究增加灵露费用；首次获得夜影鹿后完成。','unicornTears'),
 trial('postApocalypse','余灰复苏','从高污染的旧营地恢复环境。','postApocalypse'),
];
export {upgrade};

// Authored mechanical records from beargame-spec/06, each carrying source evidence.
space.push(...[
 {
  "id": "spaceElevator",
  "name": "登星藤梯",
  "type": "space",
  "family": "building",
  "planet": "cath",
  "gate": {
   "science": [
    "orbitalEngineering",
    "nanotechnology"
   ]
  },
  "cost": {
   "titanium": 6000,
   "unobtainium": 50,
   "science": 75000
  },
  "ratio": 1.15,
  "effect": {
   "spaceRatio": 0.01,
   "oilReductionRatio": 0.05,
   "prodTransferBonus": 0.001
  },
  "production": {},
  "productionKind": {},
  "source": "js/space.js:215",
  "description": "抵达后可建设的星际设施。"
 },
 {
  "id": "sattelite",
  "name": "巡天蜂舟",
  "type": "space",
  "family": "building",
  "planet": "cath",
  "gate": {
   "science": [
    "sattelites"
   ]
  },
  "cost": {
   "titanium": 2500,
   "oil": 15000,
   "science": 100000,
   "starchart": 325
  },
  "ratio": 1.08,
  "effect": {
   "observatoryRatio": 0.05,
   "energyDemand": 1
  },
  "production": {
   "starchart": 0.001
  },
  "productionKind": {
   "starchart": "BaseSpace"
  },
  "source": "js/space.js:239",
  "description": "抵达后可建设的星际设施。"
 },
 {
  "id": "spaceStation",
  "name": "轨道熊屋",
  "type": "space",
  "family": "building",
  "planet": "cath",
  "gate": {
   "science": [
    "orbitalEngineering"
   ]
  },
  "cost": {
   "oil": 35000,
   "science": 150000,
   "starchart": 425,
   "alloy": 750
  },
  "ratio": 1.12,
  "effect": {
   "scienceRatio": 0.5,
   "bears": 2,
   "energyDemand": 10
  },
  "production": {},
  "productionKind": {},
  "source": "js/space.js:295",
  "description": "抵达后可建设的星际设施。"
 },
 {
  "id": "moonOutpost",
  "name": "月林采晶站",
  "type": "space",
  "family": "building",
  "planet": "moon",
  "gate": {
   "science": []
  },
  "cost": {
   "oil": 55000,
   "uranium": 500,
   "science": 100000,
   "starchart": 650,
   "concrete": 150,
   "alloy": 750
  },
  "ratio": 1.12,
  "effect": {
   "energyDemand": 5
  },
  "production": {
   "unobtainium": 0.007
  },
  "productionKind": {
   "unobtainium": "Space"
  },
  "source": "js/space.js:336",
  "description": "抵达后可建设的星际设施。",
  "conversion": {
   "input": {
    "uranium": 0.35
   },
   "output": {
    "unobtainium": 0.007
   }
  }
 },
 {
  "id": "moonBase",
  "name": "月林基地",
  "type": "space",
  "family": "building",
  "planet": "moon",
  "gate": {
   "science": []
  },
  "cost": {
   "titanium": 9500,
   "oil": 70000,
   "unobtainium": 50,
   "science": 100000,
   "starchart": 700,
   "concrete": 250
  },
  "ratio": 1.12,
  "effect": {
   "honeyMax": 45000,
   "woodMax": 25000,
   "mineralsMax": 30000,
   "coalMax": 3500,
   "ironMax": 9000,
   "titaniumMax": 1250,
   "oilMax": 3500,
   "unobtainiumMax": 150,
   "energyDemand": 10
  },
  "production": {},
  "productionKind": {},
  "source": "js/space.js:377",
  "description": "抵达后可建设的星际设施。"
 },
 {
  "id": "planetCracker",
  "name": "星岩采集器",
  "type": "space",
  "family": "building",
  "planet": "dune",
  "gate": {
   "science": []
  },
  "cost": {
   "science": 125000,
   "starchart": 2500,
   "alloy": 1750,
   "kerosene": 50
  },
  "ratio": 1.18,
  "effect": {
   "uraniumMax": 1750
  },
  "production": {
   "uranium": 0.3
  },
  "productionKind": {
   "uranium": "Space"
  },
  "source": "js/space.js:432",
  "description": "抵达后可建设的星际设施。"
 },
 {
  "id": "hydrofracturer",
  "name": "深砂油泵",
  "type": "space",
  "family": "building",
  "planet": "dune",
  "gate": {
   "science": []
  },
  "cost": {
   "science": 150000,
   "starchart": 750,
   "alloy": 1025,
   "kerosene": 100
  },
  "ratio": 1.18,
  "effect": {},
  "production": {
   "oil": 0.5
  },
  "productionKind": {
   "oil": "AutoprodSpace"
  },
  "source": "js/space.js:454",
  "description": "抵达后可建设的星际设施。"
 },
 {
  "id": "spiceRefinery",
  "name": "星香提炼站",
  "type": "space",
  "family": "building",
  "planet": "dune",
  "gate": {
   "science": []
  },
  "cost": {
   "science": 75000,
   "starchart": 500,
   "alloy": 500,
   "kerosene": 125
  },
  "ratio": 1.15,
  "effect": {},
  "production": {
   "spice": 0.025
  },
  "productionKind": {
   "spice": "AutoprodSpace"
  },
  "source": "js/space.js:478",
  "description": "抵达后可建设的星际设施。"
 },
 {
  "id": "researchVessel",
  "name": "潮星研究船",
  "type": "space",
  "family": "building",
  "planet": "piscine",
  "gate": {
   "science": []
  },
  "cost": {
   "titanium": 12500,
   "starchart": 100,
   "alloy": 2500,
   "kerosene": 250
  },
  "ratio": 1.15,
  "effect": {
   "scienceMax": 10000
  },
  "production": {
   "starchart": 0.01
  },
  "productionKind": {
   "starchart": "BaseSpace"
  },
  "source": "js/space.js:507",
  "description": "抵达后可建设的星际设施。"
 },
 {
  "id": "orbitalArray",
  "name": "环星阵列",
  "type": "space",
  "family": "building",
  "planet": "piscine",
  "gate": {
   "science": []
  },
  "cost": {
   "science": 250000,
   "starchart": 2000,
   "eludium": 100,
   "kerosene": 500
  },
  "ratio": 1.15,
  "effect": {
   "spaceRatio": 0.02,
   "energyDemand": 20
  },
  "production": {},
  "productionKind": {},
  "source": "js/space.js:533",
  "description": "抵达后可建设的星际设施。"
 },
 {
  "id": "sunlifter",
  "name": "采日环",
  "type": "space",
  "family": "building",
  "planet": "helios",
  "gate": {
   "science": []
  },
  "cost": {
   "science": 500000,
   "eludium": 225,
   "kerosene": 2500
  },
  "ratio": 1.15,
  "effect": {
   "antimatterPerYear": 1,
   "energySupply": 30
  },
  "production": {},
  "productionKind": {},
  "source": "js/space.js:561",
  "description": "抵达后可建设的星际设施。"
 },
 {
  "id": "containmentChamber",
  "name": "星质储舱",
  "type": "space",
  "family": "building",
  "planet": "helios",
  "gate": {
   "science": []
  },
  "cost": {
   "science": 500000,
   "kerosene": 2500
  },
  "ratio": 1.125,
  "effect": {
   "antimatterMax": 100,
   "energyDemand": 50
  },
  "production": {},
  "productionKind": {},
  "source": "js/space.js:582",
  "description": "抵达后可建设的星际设施。"
 },
 {
  "id": "heatsink",
  "name": "散热翼",
  "type": "space",
  "family": "building",
  "planet": "helios",
  "gate": {
   "science": []
  },
  "cost": {
   "science": 125000,
   "relic": 1,
   "kerosene": 5000,
   "thorium": 12500
  },
  "ratio": 1.12,
  "effect": {
   "containmentMaxRatio": 0.02,
   "containmentDemandRatio": 0.01
  },
  "production": {},
  "productionKind": {},
  "source": "js/space.js:604",
  "description": "抵达后可建设的星际设施。"
 },
 {
  "id": "sunforge",
  "name": "日焰锻台",
  "type": "space",
  "family": "building",
  "planet": "helios",
  "gate": {
   "science": []
  },
  "cost": {
   "antimatter": 250,
   "science": 100000,
   "relic": 1,
   "kerosene": 1250
  },
  "ratio": 1.12,
  "effect": {
   "baseMetalMaxRatio": 0.01
  },
  "production": {},
  "productionKind": {},
  "source": "js/space.js:623",
  "description": "抵达后可建设的星际设施。"
 },
 {
  "id": "cryostation",
  "name": "冰境仓站",
  "type": "space",
  "family": "building",
  "planet": "terminus",
  "gate": {
   "science": []
  },
  "cost": {
   "science": 200000,
   "concrete": 1500,
   "eludium": 25,
   "kerosene": 500
  },
  "ratio": 1.12,
  "effect": {
   "woodMax": 200000,
   "mineralsMax": 200000,
   "coalMax": 25000,
   "ironMax": 50000,
   "titaniumMax": 7500,
   "oilMax": 7500,
   "uraniumMax": 5000,
   "unobtainiumMax": 750
  },
  "production": {},
  "productionKind": {},
  "source": "js/space.js:649",
  "description": "抵达后可建设的星际设施。"
 },
 {
  "id": "spaceBeacon",
  "name": "远星灯塔",
  "type": "space",
  "family": "building",
  "planet": "kairo",
  "gate": {
   "science": []
  },
  "cost": {
   "antimatter": 50,
   "starchart": 25000,
   "alloy": 25000,
   "kerosene": 7500
  },
  "ratio": 1.15,
  "effect": {
   "scienceMax": 25000
  },
  "production": {
   "starchart": 0.025
  },
  "productionKind": {
   "starchart": "BaseSpace"
  },
  "source": "js/space.js:696",
  "description": "抵达后可建设的星际设施。"
 },
 {
  "id": "terraformingStation",
  "name": "翠星造林站",
  "type": "space",
  "family": "building",
  "planet": "yarn",
  "gate": {
   "science": [
    "terraformation"
   ]
  },
  "cost": {
   "uranium": 5000,
   "antimatter": 25,
   "kerosene": 5000
  },
  "ratio": 1.25,
  "effect": {
   "bears": 1
  },
  "production": {},
  "productionKind": {},
  "source": "js/space.js:740",
  "description": "抵达后可建设的星际设施。"
 },
 {
  "id": "hydroponics",
  "name": "星际蜜园",
  "type": "space",
  "family": "building",
  "planet": "yarn",
  "gate": {
   "science": [
    "hydroponics"
   ]
  },
  "cost": {
   "unobtainium": 1,
   "kerosene": 500
  },
  "ratio": 1.15,
  "effect": {
   "honeyRatio": 0.025,
   "honeyMaxRatio": 0.1
  },
  "production": {},
  "productionKind": {},
  "source": "js/space.js:766",
  "description": "抵达后可建设的星际设施。"
 },
 {
  "id": "hrHarvester",
  "name": "暗隙能量帆",
  "type": "space",
  "family": "building",
  "planet": "umbra",
  "gate": {
   "science": []
  },
  "cost": {
   "antimatter": 1250,
   "relic": 25
  },
  "ratio": 1.15,
  "effect": {
   "energySupply": 1
  },
  "production": {},
  "productionKind": {},
  "source": "js/space.js:805",
  "description": "抵达后可建设的星际设施。"
 },
 {
  "id": "entangler",
  "name": "量子织机",
  "type": "space",
  "family": "building",
  "planet": "charon",
  "gate": {
   "science": [
    "quantumCryptography"
   ]
  },
  "cost": {
   "antimatter": 5250,
   "relic": 1250,
   "eludium": 5000
  },
  "ratio": 1.15,
  "effect": {
   "energyDemand": 25
  },
  "production": {
   "hashrates": 0.1
  },
  "productionKind": {},
  "source": "js/space.js:859",
  "description": "抵达后可建设的星际设施。",
  "conversion": {
   "input": {
    "gflops": 0.1
   },
   "output": {
    "hashrates": 0.1
   }
  }
 },
 {
  "id": "tectonic",
  "name": "地脉发电站",
  "type": "space",
  "family": "building",
  "planet": "centaurusSystem",
  "gate": {
   "science": [
    "terraformation"
   ]
  },
  "cost": {
   "antimatter": 500,
   "thorium": 75000
  },
  "ratio": 1.25,
  "effect": {
   "energySupply": 25
  },
  "production": {},
  "productionKind": {},
  "source": "js/space.js:919",
  "description": "抵达后可建设的星际设施。"
 },
 {
  "id": "moltenCore",
  "name": "熔核井",
  "type": "space",
  "family": "building",
  "planet": "centaurusSystem",
  "gate": {
   "science": [
    "exogeophysics"
   ]
  },
  "cost": {
   "uranium": 5000000,
   "science": 25000000
  },
  "ratio": 1.25,
  "effect": {
   "tectonicBonus": 0.05
  },
  "production": {},
  "productionKind": {},
  "source": "js/space.js:938",
  "description": "抵达后可建设的星际设施。"
 }
]);

faith.push(...[
 {
  "id": "unicornTomb",
  "name": "灵鹿石冢",
  "type": "faith",
  "family": "mythic",
  "cost": {
   "ivory": 500,
   "tears": 5
  },
  "ratio": 1.15,
  "gate": {
   "buildings": {
    "ziggurat": 1
   }
  },
  "effect": {
   "unicornsRatioReligion": 0.05
  },
  "source": "js/religion.js:636",
  "description": "叠石祭坛中的灵鹿与星空仪式。"
 },
 {
  "id": "ivoryTower",
  "name": "白枝高塔",
  "type": "faith",
  "family": "mythic",
  "cost": {
   "ivory": 25000,
   "tears": 25
  },
  "ratio": 1.15,
  "gate": {
   "buildings": {
    "ziggurat": 1
   },
   "faith": {
    "unicornTomb": 1
   }
  },
  "effect": {
   "unicornsRatioReligion": 0.1,
   "riftChance": 0.0005
  },
  "source": "js/religion.js:677",
  "description": "叠石祭坛中的灵鹿与星空仪式。"
 },
 {
  "id": "ivoryCitadel",
  "name": "白枝城垣",
  "type": "faith",
  "family": "mythic",
  "cost": {
   "ivory": 50000,
   "tears": 50
  },
  "ratio": 1.15,
  "gate": {
   "buildings": {
    "ziggurat": 1
   },
   "faith": {
    "ivoryTower": 1
   }
  },
  "effect": {
   "unicornsRatioReligion": 0.25,
   "ivoryMeteorChance": 0.0005
  },
  "source": "js/religion.js:703",
  "description": "叠石祭坛中的灵鹿与星空仪式。"
 },
 {
  "id": "skyPalace",
  "name": "云巅灵宫",
  "type": "faith",
  "family": "mythic",
  "cost": {
   "ivory": 125000,
   "tears": 500,
   "megalith": 5
  },
  "ratio": 1.15,
  "gate": {
   "buildings": {
    "ziggurat": 1
   },
   "faith": {
    "ivoryCitadel": 1
   }
  },
  "effect": {
   "goldMaxRatio": 0.01,
   "unicornsRatioReligion": 0.5,
   "alicornChance": 0.0001,
   "alicornPerTick": 2e-05,
   "ivoryMeteorRatio": 0.05
  },
  "source": "js/religion.js:732",
  "description": "叠石祭坛中的灵鹿与星空仪式。"
 },
 {
  "id": "unicornUtopia",
  "name": "灵鹿乐土",
  "type": "faith",
  "family": "mythic",
  "cost": {
   "gold": 500,
   "ivory": 1000000,
   "tears": 5000
  },
  "ratio": 1.15,
  "gate": {
   "buildings": {
    "ziggurat": 1
   },
   "faith": {
    "skyPalace": 1
   }
  },
  "effect": {
   "unicornsRatioReligion": 2.5,
   "alicornChance": 0.00015,
   "alicornPerTick": 2.5e-05,
   "tcRefineRatio": 0.05,
   "ivoryMeteorRatio": 0.15
  },
  "source": "js/religion.js:780",
  "description": "叠石祭坛中的灵鹿与星空仪式。"
 },
 {
  "id": "sunspire",
  "name": "朝阳灵柱",
  "type": "faith",
  "family": "mythic",
  "cost": {
   "gold": 1250,
   "ivory": 750000,
   "tears": 25000
  },
  "ratio": 1.15,
  "gate": {
   "buildings": {
    "ziggurat": 1
   },
   "faith": {
    "unicornUtopia": 1
   }
  },
  "effect": {
   "unicornsRatioReligion": 5,
   "alicornChance": 0.0003,
   "alicornPerTick": 5e-05,
   "tcRefineRatio": 0.1,
   "ivoryMeteorRatio": 0.5
  },
  "source": "js/religion.js:832",
  "description": "叠石祭坛中的灵鹿与星空仪式。"
 },
 {
  "id": "marker",
  "name": "幽林界碑",
  "type": "faith",
  "family": "mythic",
  "cost": {
   "unobtainium": 2500,
   "spice": 50000,
   "tears": 5000,
   "megalith": 750
  },
  "ratio": 1.15,
  "gate": {
   "buildings": {
    "ziggurat": 1
   },
   "metaphysics": [
    "megalomania"
   ]
  },
  "effect": {
   "corruptionRatio": 1e-06
  },
  "source": "js/religion.js:879",
  "description": "叠石祭坛中的灵鹿与星空仪式。"
 },
 {
  "id": "unicornGraveyard",
  "name": "灵鹿静园",
  "type": "faith",
  "family": "mythic",
  "cost": {
   "necrocorn": 5,
   "megalith": 1000
  },
  "ratio": 1.15,
  "gate": {
   "buildings": {
    "ziggurat": 1
   },
   "metaphysics": [
    "blackCodex"
   ]
  },
  "effect": {
   "cultureMaxRatioBonus": 0.01,
   "blackLibraryBonus": 0.02
  },
  "source": "js/religion.js:910",
  "description": "叠石祭坛中的灵鹿与星空仪式。"
 },
 {
  "id": "unicornNecropolis",
  "name": "静夜鹿城",
  "type": "faith",
  "family": "mythic",
  "cost": {
   "alicorn": 100,
   "necrocorn": 15,
   "void": 5,
   "megalith": 2500
  },
  "ratio": 1.15,
  "gate": {
   "buildings": {
    "ziggurat": 1
   },
   "faith": {
    "unicornGraveyard": 1
   }
  },
  "effect": {
   "corruptionBoostRatio": 0.1
  },
  "source": "js/religion.js:930",
  "description": "叠石祭坛中的灵鹿与星空仪式。"
 },
 {
  "id": "blackPyramid",
  "name": "夜蜜金字塔",
  "type": "faith",
  "family": "mythic",
  "cost": {
   "unobtainium": 5000,
   "spice": 150000,
   "sorrow": 5,
   "megalith": 2500
  },
  "ratio": 1.15,
  "gate": {
   "buildings": {
    "ziggurat": 1
   },
   "metaphysics": [
    "megalomania"
   ]
  },
  "effect": {},
  "source": "js/religion.js:945",
  "description": "叠石祭坛中的灵鹿与星空仪式。"
 }
]);

// These branches stay visible but cannot consume resources until their full contracts are implemented.
for(const d of metaphysics)if(["codexLeviathanianus","zebraDiplomacy","zebraCovenant","navigationDiplomacy","ambassadors","treaties","numerology","numeromancy","ascoh"].includes(d.id))d.unsupported="该分支的联动规则仍在核验，暂不消耗传承";
for(const d of challenges)if(["energy","pacifism","unicornTears","postApocalypse"].includes(d.id))d.unsupported="该试炼的完整规则仍在核验，暂不开放重建";

export const cycles=[
 {
  "name": "冥岸星轮",
  "buildingMultipliers": [
   {
    "building": "moonOutpost",
    "effect": "unobtainiumPerTickSpace",
    "factor": 0.9
   },
   {
    "building": "entangler",
    "effect": "gflopsConsumption",
    "factor": 2
   }
  ],
  "festivalResourceMultipliers": {
   "honey": 1.5,
   "wood": 1.5,
   "minerals": 1.5
  },
  "id": "charon"
 },
 {
  "name": "暗隙星轮",
  "buildingMultipliers": [
   {
    "building": "hydrofracturer",
    "effect": "oilPerTickAutoprodSpace",
    "factor": 0.75
   },
   {
    "building": "planetCracker",
    "effect": "uraniumPerTickSpace",
    "factor": 0.9
   },
   {
    "building": "hrHarvester",
    "effect": "energySupply",
    "factor": 1.5
   }
  ],
  "festivalResourceMultipliers": {
   "coal": 1.5,
   "iron": 1.5,
   "titanium": 1.5,
   "gold": 1.5
  },
  "id": "umbra"
 },
 {
  "name": "翠星轮",
  "buildingMultipliers": [
   {
    "building": "hydroponics",
    "effect": "honeyRatio",
    "factor": 2
   },
   {
    "building": "researchVessel",
    "effect": "starchartPerTickBaseSpace",
    "factor": 0.5
   }
  ],
  "festivalResourceMultipliers": {
   "culture": 2
  },
  "id": "yarn"
 },
 {
  "name": "朝日星轮",
  "buildingMultipliers": [
   {
    "building": "cryostation",
    "effect": "woodMax",
    "factor": 0.9
   },
   {
    "building": "cryostation",
    "effect": "mineralsMax",
    "factor": 0.9
   },
   {
    "building": "cryostation",
    "effect": "coalMax",
    "factor": 0.9
   },
   {
    "building": "cryostation",
    "effect": "ironMax",
    "factor": 0.9
   },
   {
    "building": "cryostation",
    "effect": "titaniumMax",
    "factor": 0.9
   },
   {
    "building": "cryostation",
    "effect": "oilMax",
    "factor": 0.9
   },
   {
    "building": "cryostation",
    "effect": "uraniumMax",
    "factor": 0.9
   },
   {
    "building": "cryostation",
    "effect": "unobtainiumMax",
    "factor": 0.9
   },
   {
    "building": "sunlifter",
    "effect": "energySupply",
    "factor": 1.5
   }
  ],
  "festivalResourceMultipliers": {
   "faith": 2,
   "unicorns": 1.25
  },
  "id": "helios"
 },
 {
  "name": "故林星轮",
  "buildingMultipliers": [
   {
    "building": "spaceStation",
    "effect": "scienceRatio",
    "factor": 1.5
   },
   {
    "building": "sattelite",
    "effect": "observatoryRatio",
    "factor": 2
   },
   {
    "building": "sattelite",
    "effect": "starchartPerTickBaseSpace",
    "factor": 2
   },
   {
    "building": "spaceBeacon",
    "effect": "starchartPerTickBaseSpace",
    "factor": 0.1
   },
   {
    "building": "spaceElevator",
    "effect": "prodTransferBonus",
    "factor": 2
   }
  ],
  "festivalResourceMultipliers": {
   "manpower": 2
  },
  "id": "cath"
 },
 {
  "name": "月林星轮",
  "buildingMultipliers": [
   {
    "building": "moonOutpost",
    "effect": "unobtainiumPerTickSpace",
    "factor": 1.2
   },
   {
    "building": "entangler",
    "effect": "gflopsConsumption",
    "factor": 0.5
   }
  ],
  "festivalResourceMultipliers": {
   "unobtainium": 2
  },
  "id": "redmoon"
 },
 {
  "name": "沙海星轮",
  "buildingMultipliers": [
   {
    "building": "hydrofracturer",
    "effect": "oilPerTickAutoprodSpace",
    "factor": 1.5
   },
   {
    "building": "planetCracker",
    "effect": "uraniumPerTickSpace",
    "factor": 1.1
   },
   {
    "building": "hrHarvester",
    "effect": "energySupply",
    "factor": 0.75
   }
  ],
  "festivalResourceMultipliers": {
   "uranium": 2
  },
  "id": "dune"
 },
 {
  "name": "潮星轮",
  "buildingMultipliers": [
   {
    "building": "hydroponics",
    "effect": "honeyRatio",
    "factor": 0.5
   },
   {
    "building": "researchVessel",
    "effect": "starchartPerTickBaseSpace",
    "factor": 1.5
   }
  ],
  "festivalResourceMultipliers": {
   "science": 2
  },
  "id": "piscine"
 },
 {
  "name": "冰境星轮",
  "buildingMultipliers": [
   {
    "building": "cryostation",
    "effect": "woodMax",
    "factor": 1.2
   },
   {
    "building": "cryostation",
    "effect": "mineralsMax",
    "factor": 1.2
   },
   {
    "building": "cryostation",
    "effect": "coalMax",
    "factor": 1.2
   },
   {
    "building": "cryostation",
    "effect": "ironMax",
    "factor": 1.2
   },
   {
    "building": "cryostation",
    "effect": "titaniumMax",
    "factor": 1.2
   },
   {
    "building": "cryostation",
    "effect": "oilMax",
    "factor": 1.2
   },
   {
    "building": "cryostation",
    "effect": "uraniumMax",
    "factor": 1.2
   },
   {
    "building": "cryostation",
    "effect": "unobtainiumMax",
    "factor": 1.2
   },
   {
    "building": "sunlifter",
    "effect": "energySupply",
    "factor": 0.5
   }
  ],
  "festivalResourceMultipliers": {
   "oil": 2
  },
  "id": "terminus"
 },
 {
  "name": "微光星轮",
  "buildingMultipliers": [
   {
    "building": "spaceStation",
    "effect": "scienceRatio",
    "factor": 0.75
   },
   {
    "building": "sattelite",
    "effect": "observatoryRatio",
    "factor": 0.75
   },
   {
    "building": "sattelite",
    "effect": "starchartPerTickBaseSpace",
    "factor": 0.75
   },
   {
    "building": "spaceBeacon",
    "effect": "starchartPerTickBaseSpace",
    "factor": 5
   },
   {
    "building": "spaceElevator",
    "effect": "prodTransferBonus",
    "factor": 0.5
   }
  ],
  "festivalResourceMultipliers": {
   "starchart": 5
  },
  "id": "kairo"
 }
];

faith.push(...[
 {
  "id": "pactOfCleansing",
  "name": "净林之约",
  "type": "faith",
  "family": "pact",
  "cost": {
   "relic": 100
  },
  "ratio": 1,
  "gate": {
   "faith": {
    "mausoleum": 1
   }
  },
  "effect": {
   "pactGlobalResourceRatio": 0.0005,
   "pactDeficitRecoveryRatio": 0.003
  },
  "source": "js/religion.js:2573–2717",
  "description": "占用一个约定名额，每日消耗夜影鹿；供养不足会形成债务。"
 },
 {
  "id": "pactOfDestruction",
  "name": "重塑之约",
  "type": "faith",
  "family": "pact",
  "cost": {
   "relic": 100
  },
  "ratio": 1,
  "gate": {
   "faith": {
    "mausoleum": 1
   }
  },
  "effect": {
   "pactGlobalProductionRatio": 0.0005,
   "pactDeficitRecoveryRatio": -0.0001
  },
  "source": "js/religion.js:2573–2717",
  "description": "占用一个约定名额，每日消耗夜影鹿；供养不足会形成债务。"
 },
 {
  "id": "pactOfExtermination",
  "name": "静默之约",
  "type": "faith",
  "family": "pact",
  "cost": {
   "relic": 100
  },
  "ratio": 1,
  "gate": {
   "faith": {
    "mausoleum": 1
   }
  },
  "effect": {
   "pactFaithRatio": 0.001
  },
  "source": "js/religion.js:2573–2717",
  "description": "占用一个约定名额，每日消耗夜影鹿；供养不足会形成债务。"
 },
 {
  "id": "pactOfPurity",
  "name": "澄明之约",
  "type": "faith",
  "family": "pact",
  "cost": {
   "relic": 100
  },
  "ratio": 1,
  "gate": {
   "faith": {
    "mausoleum": 1
   }
  },
  "effect": {
   "pactDeficitRecoveryRatio": 0.005,
   "pactBlackLibraryBoost": 0.0005,
   "pactSpaceCompendiumRatio": 0.001
  },
  "source": "js/religion.js:2573–2717",
  "description": "占用一个约定名额，每日消耗夜影鹿；供养不足会形成债务。"
 },
 {
  "id": "pactOfArcane",
  "name": "秘艺之约",
  "type": "faith",
  "family": "pact",
  "cost": {
   "relic": 100
  },
  "ratio": 1,
  "gate": {
   "faith": {
    "mausoleum": 1
   }
  },
  "effect": {
   "pactcraftRatio": 0.001,
   "pactUniversalKnowHow": 0.1
  },
  "source": "js/religion.js:2573–2717",
  "description": "占用一个约定名额，每日消耗夜影鹿；供养不足会形成债务。"
 },
 {
  "id": "pactOfChronicler",
  "name": "星史之约",
  "type": "faith",
  "family": "pact",
  "cost": {
   "relic": 100
  },
  "ratio": 1,
  "gate": {
   "faith": {
    "mausoleum": 1
   }
  },
  "effect": {
   "pactPerYearRatio": 0.003,
   "umbraBoostRatio": 0.1,
   "pacttimeRatio": 0.1
  },
  "source": "js/religion.js:2573–2717",
  "description": "占用一个约定名额，每日消耗夜影鹿；供养不足会形成债务。"
 },
 {
  "id": "siphoning",
  "name": "引流偿约",
  "type": "faith",
  "family": "pactPolicy",
  "cost": {
   "necrocorn": 1
  },
  "ratio": 1,
  "oneTime": true,
  "gate": {
   "faith": {
    "mausoleum": 1,
    "marker": 1
   }
  },
  "effect": {},
  "source": "js/science.js:2055–2158",
  "description": "三种供养策略每轮只能选择一种。"
 },
 {
  "id": "feedingFrenzy",
  "name": "盛宴馈赠",
  "type": "faith",
  "family": "pactPolicy",
  "cost": {
   "necrocorn": 1
  },
  "ratio": 1,
  "oneTime": true,
  "gate": {
   "faith": {
    "mausoleum": 1,
    "marker": 1
   }
  },
  "effect": {},
  "source": "js/science.js:2055–2158",
  "description": "三种供养策略每轮只能选择一种。"
 },
 {
  "id": "upfrontPayment",
  "name": "预付供养",
  "type": "faith",
  "family": "pactPolicy",
  "cost": {
   "necrocorn": 1
  },
  "ratio": 1,
  "oneTime": true,
  "gate": {
   "faith": {
    "mausoleum": 1,
    "marker": 1
   }
  },
  "effect": {},
  "source": "js/science.js:2055–2158",
  "description": "三种供养策略每轮只能选择一种。"
 },
 {
  "id": "fractured",
  "name": "约定破裂",
  "type": "faith",
  "family": "pactState",
  "cost": {},
  "ratio": 1,
  "gate": {},
  "oneTime": true,
  "effect": {},
  "unsupported": "本轮供养债务曾达到 50，约定已破裂；重建后恢复。",
  "source": "js/religion.js:2753–2815"
 }
]);

for(const d of [...faith,...metaphysics])if(["mausoleum","darkParacosm","numerology","numeromancy"].includes(d.id))delete d.unsupported;

// Core challenge contracts and reserve selection are implemented independently in progression.js.
for(const d of challenges)delete d.unsupported;
for(const d of metaphysics)if(d.id==='ascoh')delete d.unsupported;

for(const d of metaphysics)if(['ambassadors','treaties','navigationDiplomacy'].includes(d.id))delete d.unsupported;

for(const d of metaphysics)if(d.id==='codexLeviathanianus')delete d.unsupported;

// Visitor retention and inherited capacity are supplied by the independent tribal subsystem.
for(const d of metaphysics)if(['zebraDiplomacy','zebraCovenant'].includes(d.id))delete d.unsupported;
