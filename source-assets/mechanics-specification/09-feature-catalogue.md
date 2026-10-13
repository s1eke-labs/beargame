# 功能目录索引

本索引依据 Beargame 当前的引擎目录整理，列出中文名称、实际代码标识符和本仓库中的定义位置。总目录入口为 [catalog.js](../../src/engine/catalog.js)。标识符用于查找实现和解释存档，保留代码中的拼写。

条目存在于目录，不代表其全部动态效果、界面交互和完成路径都已验证。标记为未启用的条目不能视为可用功能；其余条目仍需满足解锁、资源、挑战及当前状态等运行时条件。已测试范围与限制见[质量验证结果](../../qa/RESULTS.md)和[全流程质量验证](../../qa/FULL_FLOW_QA.md)。

## 资源（59 项）

定义位置：[catalog.js](../../src/engine/catalog.js)、[progression-catalog.js](../../src/engine/progression-catalog.js)。人口保存在小熊数组中，不计入资源目录。

| 名称 | 代码标识符 |
| --- | --- |
| 条纹猎手 | `zebras` |
| 蜂蜜 | `honey` |
| 木材 | `wood` |
| 矿石 | `minerals` |
| 铁 | `iron` |
| 煤 | `coal` |
| 金 | `gold` |
| 钛 | `titanium` |
| 石油 | `oil` |
| 铀 | `uranium` |
| 月晶 | `unobtainium` |
| 反物质 | `antimatter` |
| 活力 | `manpower` |
| 知识 | `science` |
| 文化 | `culture` |
| 信仰 | `faith` |
| 毛皮 | `furs` |
| 象牙 | `ivory` |
| 香料 | `spice` |
| 木梁 | `beam` |
| 石板 | `slab` |
| 铁板 | `plate` |
| 钢 | `steel` |
| 混凝土 | `concrete` |
| 齿轮 | `gear` |
| 合金 | `alloy` |
| 星合金 | `eludium` |
| 脚手架 | `scaffold` |
| 船 | `ship` |
| 油轮 | `tanker` |
| 纸页 | `parchment` |
| 手稿 | `manuscript` |
| 典籍 | `compendium` |
| 蓝图 | `blueprint` |
| 煤油 | `kerosene` |
| 巨石 | `megalith` |
| 星图 | `starchart` |
| 时晶 | `timeCrystal` |
| 遗珍 | `relic` |
| 泪石 | `sorrow` |
| 黑金 | `blackcoin` |
| 业力 | `karma` |
| 传承 | `paragon` |
| 余烬传承 | `burnedParagon` |
| 时流 | `temporalFlux` |
| 虚空 | `void` |
| 灵鹿 | `unicorns` |
| 塑料 | `plastic` |
| 微芯片 | `microchip` |
| 钍 | `thorium` |
| 血石 | `bloodstone` |
| 秘银 | `tMythril` |
| 算力 | `gflops` |
| 密钥算量 | `hashrates` |
| 远古礼盒 | `elderBox` |
| 礼盒绸纸 | `wrappingPaper` |
| 灵露 | `tears` |
| 星翼鹿 | `alicorn` |
| 夜影鹿 | `necrocorn` |

## 建筑（40 项）

定义位置：[core-catalog.js](../../src/engine/core-catalog.js)、[building-stages.js](../../src/engine/building-stages.js)。

| 名称 | 代码标识符 |
| --- | --- |
| 蜂箱 | `hive` |
| 树洞熊舍 | `hut` |
| 林间书屋 | `library` |
| 蜜粮仓 | `barn` |
| 花间食圃 | `pasture` |
| 林泉水渠 | `aqueduct` |
| 木屋 | `logHouse` |
| 山岭公馆 | `mansion` |
| 山林学院 | `academy` |
| 观星台 | `observatory` |
| 花木实验室 | `biolab` |
| 工料库 | `warehouse` |
| 河湾港 | `harbor` |
| 石矿井 | `mine` |
| 山岩采场 | `quarry` |
| 铸铁炉 | `smelter` |
| 焙烧炉 | `calciner` |
| 蒸汽工坊 | `steamworks` |
| 林原发电机 | `magneto` |
| 木材工场 | `lumberMill` |
| 深林油井 | `oilWell` |
| 手作坊 | `workshop` |
| 精工厂 | `factory` |
| 晶能反应堆 | `reactor` |
| 微粒加速环 | `accelerator` |
| 林间驿站 | `tradepost` |
| 林币铸坊 | `mint` |
| 山谷剧场 | `amphitheatre` |
| 花灯祈堂 | `chapel` |
| 山灵神殿 | `temple` |
| 灵鹿花苑 | `unicornPasture` |
| 叠石祭坛 | `ziggurat` |
| 时光蜜球 | `chronosphere` |
| 森智核心 | `aiCore` |
| 蜜酿坊 | `brewery` |
| 条纹前哨 | `zebraOutpost` |
| 条纹工房 | `zebraWorkshop` |
| 条纹熔炉 | `zebraForge` |
| 条纹休眠舱 | `stasisPod` |
| 白枝研磨堂 | `ivoryTemple` |

## 建筑改建（5 项）

定义位置：[building-stages.js](../../src/engine/building-stages.js)。改建沿用原建筑标识符，由阶段字段区分方案；不额外计入建筑种类。

| 名称 | 代码标识符 |
| --- | --- |
| 花原太阳能板 | `pasture` |
| 林泉水电站 | `aqueduct` |
| 林间数据馆 | `library` |
| 山谷广播塔 | `amphitheatre` |
| 林星港 | `warehouse` |

## 研究（61 项）

定义位置：[core-catalog.js](../../src/engine/core-catalog.js)。

| 名称 | 代码标识符 | 状态说明 |
| --- | --- | --- |
| 四季历法 | `calendar` | 按游戏进度和操作条件开放 |
| 养蜂学 | `agriculture` | 按游戏进度和操作条件开放 |
| 林间狩猎 | `archery` | 按游戏进度和操作条件开放 |
| 采矿学 | `mining` | 按游戏进度和操作条件开放 |
| 冶金入门 | `metal` | 按游戏进度和操作条件开放 |
| 山林共生 | `animal` | 按游戏进度和操作条件开放 |
| 聚落制度 | `civil` | 按游戏进度和操作条件开放 |
| 数量学 | `math` | 按游戏进度和操作条件开放 |
| 营造学 | `construction` | 按游戏进度和操作条件开放 |
| 水利工程 | `engineering` | 按游戏进度和操作条件开放 |
| 货币 | `currency` | 按游戏进度和操作条件开放 |
| 文字 | `writing` | 按游戏进度和操作条件开放 |
| 林间哲思 | `philosophy` | 按游戏进度和操作条件开放 |
| 机械 | `machinery` | 按游戏进度和操作条件开放 |
| 炼钢 | `steel` | 按游戏进度和操作条件开放 |
| 山灵学 | `theology` | 按游戏进度和操作条件开放 |
| 天文学 | `astronomy` | 按游戏进度和操作条件开放 |
| 航海 | `navigation` | 按游戏进度和操作条件开放 |
| 建筑学 | `architecture` | 按游戏进度和操作条件开放 |
| 物理学 | `physics` | 按游戏进度和操作条件开放 |
| 超验思辨 | `metaphysics` | 按游戏进度和操作条件开放 |
| 化学 | `chemistry` | 按游戏进度和操作条件开放 |
| 声学 | `acoustics` | 按游戏进度和操作条件开放 |
| 戏剧 | `drama` | 按游戏进度和操作条件开放 |
| 地层考察 | `archeology` | 按游戏进度和操作条件开放 |
| 电学 | `electricity` | 按游戏进度和操作条件开放 |
| 生物学 | `biology` | 按游戏进度和操作条件开放 |
| 生物化学 | `biochemistry` | 按游戏进度和操作条件开放 |
| 遗传学 | `genetics` | 按游戏进度和操作条件开放 |
| 工业化 | `industrialization` | 按游戏进度和操作条件开放 |
| 机械化 | `mechanization` | 按游戏进度和操作条件开放 |
| 精密冶金 | `metalurgy` | 按游戏进度和操作条件开放 |
| 燃烧学 | `combustion` | 按游戏进度和操作条件开放 |
| 生态学 | `ecology` | 按游戏进度和操作条件开放 |
| 电子学 | `electronics` | 按游戏进度和操作条件开放 |
| 自动机械 | `robotics` | 按游戏进度和操作条件开放 |
| 森林智算 | `ai` | 按游戏进度和操作条件开放 |
| 量子密语 | `quantumCryptography` | 按游戏进度和操作条件开放 |
| 幽晶链 | `blackchain` | 按游戏进度和操作条件开放 |
| 核裂变 | `nuclearFission` | 按游戏进度和操作条件开放 |
| 飞天工程 | `rocketry` | 按游戏进度和操作条件开放 |
| 燃料精炼 | `oilProcessing` | 按游戏进度和操作条件开放 |
| 卫星学 | `sattelites` | 按游戏进度和操作条件开放 |
| 轨道工程 | `orbitalEngineering` | 按游戏进度和操作条件开放 |
| 钍能研究 | `thorium` | 按游戏进度和操作条件开放 |
| 异星地质 | `exogeology` | 按游戏进度和操作条件开放 |
| 深空地质 | `advExogeology` | 按游戏进度和操作条件开放 |
| 纳米技术 | `nanotechnology` | 按游戏进度和操作条件开放 |
| 超导 | `superconductors` | 按游戏进度和操作条件开放 |
| 反物质 | `antimatter` | 按游戏进度和操作条件开放 |
| 异星造林 | `terraformation` | 按游戏进度和操作条件开放 |
| 星际水培 | `hydroponics` | 按游戏进度和操作条件开放 |
| 深空物理 | `exogeophysics` | 按游戏进度和操作条件开放 |
| 粒子物理 | `particlePhysics` | 按游戏进度和操作条件开放 |
| 维度物理 | `dimensionalPhysics` | 按游戏进度和操作条件开放 |
| 人工引力 | `artificialGravity` | 目录保留，当前未启用 |
| 时序物理 | `chronophysics` | 按游戏进度和操作条件开放 |
| 超光理论 | `tachyonTheory` | 按游戏进度和操作条件开放 |
| 隐秘神学 | `cryptotheology` | 按游戏进度和操作条件开放 |
| 虚空领域 | `voidSpace` | 按游戏进度和操作条件开放 |
| 悖论知识 | `paradoxalKnowledge` | 按游戏进度和操作条件开放 |

## 政策（61 项）

定义位置：[policy-catalog.js](../../src/engine/policy-catalog.js)。

| 名称 | 代码标识符 |
| --- | --- |
| 开放蜂巢 | `liberty` |
| 旧林手札 | `tradition` |
| 长老继任 | `monarchy` |
| 独任领熊 | `authocracy` |
| 全营议事 | `republic` |
| 共享蜜罐 | `socialism` |
| 小工坊约定 | `scientificCommunism` |
| 自由商路 | `liberalism` |
| 集体工场 | `communism` |
| 严整营地 | `fascism` |
| 智识议会 | `technocracy` |
| 星愿议会 | `theocracy` |
| 远林开拓 | `expansionism` |
| 机心共生 | `transkittenism` |
| 黑晶领航 | `necrocracy` |
| 闭门星约 | `radicalXenophobia` |
| 结伴远行 | `diplomacy` |
| 守林互市 | `isolationism` |
| 条纹善邻 | `zebraRelationsAppeasement` |
| 条纹竞逐 | `zebraRelationsBellicosity` |
| 互寄学报 | `knowledgeSharing` |
| 互访艺集 | `culturalExchange` |
| 商路护卫 | `bigStickPolicy` |
| 山丘艺城 | `cityOnAHill` |
| 星空公约 | `outerSpaceTreaty` |
| 轨道守望 | `militarizeSpace` |
| 绿叶护林员 | `lizardRelationsEcologists` |
| 绿叶星愿师 | `lizardRelationsPriests` |
| 绿叶调停员 | `lizardRelationsDiplomats` |
| 潮湾抄写员 | `sharkRelationsScribes` |
| 潮湾行商员 | `sharkRelationsMerchants` |
| 潮湾育林员 | `sharkRelationsBotanists` |
| 云翼炼钢员 | `griffinRelationsMetallurgists` |
| 云翼巡林员 | `griffinRelationsScouts` |
| 云翼机修员 | `griffinRelationsMachinists` |
| 盘藤砌石员 | `nagaRelationsMasons` |
| 盘藤祭仪员 | `nagaRelationsCultists` |
| 盘藤设计员 | `nagaRelationsArchitects` |
| 丝谷地质员 | `spiderRelationsGeologists` |
| 丝谷调配员 | `spiderRelationsChemists` |
| 丝谷寻化石员 | `spiderRelationsPaleontologists` |
| 焰岭物理员 | `dragonRelationsPhysicists` |
| 焰岭观星员 | `dragonRelationsAstrologers` |
| 焰岭动力员 | `dragonRelationsDynamicists` |
| 节用蜜罐 | `stoicism` |
| 林间享乐 | `epicurianism` |
| 花蜜庆典 | `carnivale` |
| 丰盛蜜宴 | `extravagance` |
| 蜜粮配给 | `rationing` |
| 勤俭工坊 | `frugality` |
| 实证手札 | `rationality` |
| 林梦手札 | `mysticism` |
| 深层采石 | `stripMining` |
| 密林轮伐 | `clearCutting` |
| 蜂林守护 | `environmentalism` |
| 循生工艺 | `sustainability` |
| 全营开工 | `fullIndustrialization` |
| 保育林区 | `conservation` |
| 开放林区 | `openWoodlands` |
| 回收休眠仓 | `cryochamberExtraction` |
| 新生星球 | `terraformingInsight` |

## 工坊升级（143 项）

定义位置：[workshop-catalog.js](../../src/engine/workshop-catalog.js)。

| 名称 | 代码标识符 | 状态说明 |
| --- | --- | --- |
| 石质蜂铲 | `mineralHoes` | 按游戏进度和操作条件开放 |
| 铁质蜂铲 | `ironHoes` | 按游戏进度和操作条件开放 |
| 石斧 | `mineralAxes` | 按游戏进度和操作条件开放 |
| 铁斧 | `ironAxes` | 按游戏进度和操作条件开放 |
| 钢斧 | `steelAxe` | 按游戏进度和操作条件开放 |
| 钛斧 | `titaniumAxe` | 按游戏进度和操作条件开放 |
| 合金斧 | `alloyAxe` | 按游戏进度和操作条件开放 |
| 月晶斧 | `unobtainiumAxe` | 目录保留，当前未启用 |
| 加固锯 | `reinforcedSaw` | 按游戏进度和操作条件开放 |
| 钢锯 | `steelSaw` | 按游戏进度和操作条件开放 |
| 钛锯 | `titaniumSaw` | 按游戏进度和操作条件开放 |
| 合金锯 | `alloySaw` | 按游戏进度和操作条件开放 |
| 月晶锯 | `unobtainiumSaw` | 目录保留，当前未启用 |
| 石砌蜜仓 | `stoneBarns` | 按游戏进度和操作条件开放 |
| 加固蜜仓 | `reinforcedBarns` | 按游戏进度和操作条件开放 |
| 钛骨蜜仓 | `titaniumBarns` | 按游戏进度和操作条件开放 |
| 合金蜜仓 | `alloyBarns` | 按游戏进度和操作条件开放 |
| 混凝土蜜仓 | `concreteBarns` | 按游戏进度和操作条件开放 |
| 加固工料库 | `reinforcedWarehouses` | 按游戏进度和操作条件开放 |
| 钛骨工料库 | `titaniumWarehouses` | 按游戏进度和操作条件开放 |
| 合金工料库 | `alloyWarehouses` | 按游戏进度和操作条件开放 |
| 混凝土工料库 | `concreteWarehouses` | 按游戏进度和操作条件开放 |
| 地下储物洞 | `storageBunkers` | 按游戏进度和操作条件开放 |
| 密封蜜罐 | `silos` | 按游戏进度和操作条件开放 |
| 冷藏 | `refrigeration` | 按游戏进度和操作条件开放 |
| 精细补给 | `advancedRefinement` | 按游戏进度和操作条件开放 |
| 金矿分离 | `goldOre` | 按游戏进度和操作条件开放 |
| 深层采煤 | `deepMining` | 按游戏进度和操作条件开放 |
| 煤炭烧制 | `coalFurnace` | 按游戏进度和操作条件开放 |
| 大地测量 | `geodesy` | 按游戏进度和操作条件开放 |
| 矿用钻机 | `miningDrill` | 按游戏进度和操作条件开放 |
| 月晶钻机 | `unobtainiumDrill` | 按游戏进度和操作条件开放 |
| 熊口名册 | `register` | 按游戏进度和操作条件开放 |
| 投索 | `bolas` | 按游戏进度和操作条件开放 |
| 护林甲 | `huntingArmor` | 按游戏进度和操作条件开放 |
| 复合弓 | `compositeBow` | 按游戏进度和操作条件开放 |
| 林地弩 | `crossbow` | 按游戏进度和操作条件开放 |
| 天体运行 | `celestialMechanics` | 按游戏进度和操作条件开放 |
| 星盘 | `astrolabe` | 按游戏进度和操作条件开放 |
| 钛镜 | `titaniumMirrors` | 按游戏进度和操作条件开放 |
| 月晶反光镜 | `unobtainiumReflectors` | 按游戏进度和操作条件开放 |
| 星辉反光镜 | `eludiumReflectors` | 按游戏进度和操作条件开放 |
| 货船扩装 | `cargoShips` | 按游戏进度和操作条件开放 |
| 商队客栈 | `caravanserai` | 按游戏进度和操作条件开放 |
| 全天观星 | `seti` | 按游戏进度和操作条件开放 |
| 铁骨木屋 | `ironwood` | 按游戏进度和操作条件开放 |
| 结构加固 | `strenghtenBuild` | 按游戏进度和操作条件开放 |
| 储能裂隙 | `energyRifts` | 按游戏进度和操作条件开放 |
| 大型粒子环 | `lhc` | 按游戏进度和操作条件开放 |
| 电解冶炼 | `electrolyticSmelting` | 按游戏进度和操作条件开放 |
| 氧化焙烧 | `oxidation` | 按游戏进度和操作条件开放 |
| 炼钢车间 | `steelPlants` | 按游戏进度和操作条件开放 |
| 自动炼钢 | `automatedPlants` | 按游戏进度和操作条件开放 |
| 核能炼钢 | `nuclearPlants` | 按游戏进度和操作条件开放 |
| 旋转窑 | `rotaryKiln` | 按游戏进度和操作条件开放 |
| 流化反应器 | `fluidizedReactors` | 按游戏进度和操作条件开放 |
| 核能熔炼 | `nuclearSmelters` | 按游戏进度和操作条件开放 |
| 轨道测地 | `orbitalGeodesy` | 按游戏进度和操作条件开放 |
| 林间印刷 | `printingPress` | 按游戏进度和操作条件开放 |
| 胶版印刷 | `offsetPress` | 按游戏进度和操作条件开放 |
| 光刻印刷 | `photolithography` | 按游戏进度和操作条件开放 |
| 知识联网 | `uplink` | 按游戏进度和操作条件开放 |
| 星网联结 | `starlink` | 按游戏进度和操作条件开放 |
| 抽油机械 | `pumpjack` | 按游戏进度和操作条件开放 |
| 石油精制 | `oilRefinery` | 按游戏进度和操作条件开放 |
| 培养皿 | `petri` | 按游戏进度和操作条件开放 |
| 花木燃料 | `biofuel` | 按游戏进度和操作条件开放 |
| 山林互联 | `internet` | 按游戏进度和操作条件开放 |
| 神经网络 | `neuralNetworks` | 按游戏进度和操作条件开放 |
| 劳作助手 | `assistance` | 按游戏进度和操作条件开放 |
| 浓缩铀 | `enrichedUranium` | 按游戏进度和操作条件开放 |
| 冷核聚变 | `coldFusion` | 按游戏进度和操作条件开放 |
| 钍反应堆 | `thoriumReactors` | 按游戏进度和操作条件开放 |
| 星空学者 | `astrophysicists` | 按游戏进度和操作条件开放 |
| 微型月站反应堆 | `mWReactor` | 按游戏进度和操作条件开放 |
| 灵鹿选育 | `unicornSelection` | 按游戏进度和操作条件开放 |
| 静滞储仓 | `stasisChambers` | 按游戏进度和操作条件开放 |
| 虚空储能 | `voidEnergy` | 按游戏进度和操作条件开放 |
| 暗能储仓 | `darkEnergy` | 按游戏进度和操作条件开放 |
| 时晶锻艺 | `chronoforge` | 按游戏进度和操作条件开放 |
| 时流调节器 | `tachyonModerator` | 按游戏进度和操作条件开放 |
| 超光加速器 | `tachyonAccelerators` | 按游戏进度和操作条件开放 |
| 时流凝聚 | `fluxCondensator` | 按游戏进度和操作条件开放 |
| 光伏薄板 | `photovoltaic` | 按游戏进度和操作条件开放 |
| 柔性薄膜 | `thinFilm` | 按游戏进度和操作条件开放 |
| 量子光点 | `qdot` | 按游戏进度和操作条件开放 |
| 光能蜂舟 | `solarSatellites` | 按游戏进度和操作条件开放 |
| 载煤驳船 | `barges` | 按游戏进度和操作条件开放 |
| 动力船舱 | `reactorVessel` | 按游戏进度和操作条件开放 |
| 石骨熊舍 | `concreteHuts` | 按游戏进度和操作条件开放 |
| 月晶熊舍 | `unobtainiumHuts` | 按游戏进度和操作条件开放 |
| 星辉熊舍 | `eludiumHuts` | 按游戏进度和操作条件开放 |
| 电磁猎弩 | `railgun` | 按游戏进度和操作条件开放 |
| 钢制护林甲 | `steelArmor` | 按游戏进度和操作条件开放 |
| 合金护林甲 | `alloyArmor` | 按游戏进度和操作条件开放 |
| 纳米护林衣 | `nanosuits` | 按游戏进度和操作条件开放 |
| 星港货运 | `freightfulExchange` | 按游戏进度和操作条件开放 |
| 叠态运输 | `transportSuperposition` | 按游戏进度和操作条件开放 |
| 陨石勘测 | `prospecting` | 按游戏进度和操作条件开放 |
| 木材热解 | `pyrolysis` | 按游戏进度和操作条件开放 |
| 低温计算 | `cryocomputing` | 按游戏进度和操作条件开放 |
| 林智学习 | `machineLearning` | 按游戏进度和操作条件开放 |
| 蒸汽自动化 | `factoryAutomation` | 按游戏进度和操作条件开放 |
| 双季自动化 | `advancedAutomation` | 按游戏进度和操作条件开放 |
| 气动压机 | `pneumaticPress` | 按游戏进度和操作条件开放 |
| 内燃机 | `combustionEngine` | 按游戏进度和操作条件开放 |
| 燃料喷射 | `fuelInjectors` | 按游戏进度和操作条件开放 |
| 厂区调度 | `factoryLogistics` | 按游戏进度和操作条件开放 |
| 碳素封存 | `carbonSequestration` | 按游戏进度和操作条件开放 |
| 工艺优化 | `factoryOptimization` | 按游戏进度和操作条件开放 |
| 机械工匠 | `factoryRobotics` | 按游戏进度和操作条件开放 |
| 轨道工匠 | `spaceEngineers` | 按游戏进度和操作条件开放 |
| 森智工匠 | `aiEngineers` | 按游戏进度和操作条件开放 |
| 时序工匠 | `chronoEngineers` | 按游戏进度和操作条件开放 |
| 星际制造 | `spaceManufacturing` | 按游戏进度和操作条件开放 |
| 水轮改良 | `hydroPlantTurbines` | 按游戏进度和操作条件开放 |
| 反物质基地 | `amBases` | 按游戏进度和操作条件开放 |
| 森智基地 | `aiBases` | 按游戏进度和操作条件开放 |
| 反物质分解 | `amFission` | 按游戏进度和操作条件开放 |
| 星能反应炉 | `amReactors` | 按游戏进度和操作条件开放 |
| 星能反应炉二型 | `amReactorsMK2` | 按游戏进度和操作条件开放 |
| 虚空反应炉 | `voidReactors` | 按游戏进度和操作条件开放 |
| 古物信标站 | `relicStation` | 按游戏进度和操作条件开放 |
| 星质推进器 | `amDrive` | 按游戏进度和操作条件开放 |
| 云鹿居 | `alicornStable` | 按游戏进度和操作条件开放 |
| 蜜源改良 | `gmo` | 按游戏进度和操作条件开放 |
| 辅助制图 | `cadSystems` | 按游戏进度和操作条件开放 |
| 协同劳作 | `logistics` | 按游戏进度和操作条件开放 |
| 感知增强 | `augumentation` | 按游戏进度和操作条件开放 |
| 浓缩钍 | `enrichedThorium` | 按游戏进度和操作条件开放 |
| 深空望远镜 | `hubbleTelescope` | 按游戏进度和操作条件开放 |
| 卫星导航 | `satnav` | 按游戏进度和操作条件开放 |
| 星空广播 | `satelliteRadio` | 按游戏进度和操作条件开放 |
| 星辉裂岩机 | `eludiumCracker` | 按游戏进度和操作条件开放 |
| 钍能引擎 | `thoriumEngine` | 按游戏进度和操作条件开放 |
| 星香导航 | `spiceNavigation` | 目录保留，当前未启用 |
| 远航星舟 | `longRangeSpaceships` | 目录保留，当前未启用 |
| 分馏工艺 | `oilDistillation` | 按游戏进度和操作条件开放 |
| 工厂精炼 | `factoryProcessing` | 按游戏进度和操作条件开放 |
| 虚空收集 | `voidAspiration` | 按游戏进度和操作条件开放 |
| 时空偏折 | `distorsion` | 按游戏进度和操作条件开放 |
| 时流顺行 | `turnSmoothly` | 按游戏进度和操作条件开放 |
| 暗市调律 | `invisibleBlackHand` | 按游戏进度和操作条件开放 |

## 条纹工艺（8 项）

定义位置：[tribal-workshop.js](../../src/engine/tribal-workshop.js)。这 8 项同样包含在工坊总目录中，工坊合计 151 项。

| 名称 | 代码标识符 |
| --- | --- |
| 条纹传承 | `darkRevolution` |
| 夜蜜酿法 | `darkBrew` |
| 条纹猎营 | `zebraTrappers` |
| 前哨重铸 | `reforgedOutposts` |
| 白枝密语 | `whispers` |
| 陨石研究室 | `minerologyDepartment` |
| 赤晶研究所 | `bloodstoneInstitute` |
| 远距测量仪 | `rangefinders` |

## 制作配方（23 项）

定义位置：[core-catalog.js](../../src/engine/core-catalog.js)。

| 名称 | 代码标识符 |
| --- | --- |
| 林地采木 | `wood` |
| 木梁 | `beam` |
| 石板 | `slab` |
| 铁板 | `plate` |
| 钢 | `steel` |
| 混凝土 | `concrete` |
| 齿轮 | `gear` |
| 合金 | `alloy` |
| 星合金 | `eludium` |
| 脚手架 | `scaffold` |
| 船 | `ship` |
| 油轮 | `tanker` |
| 煤油 | `kerosene` |
| 塑料 | `plastic` |
| 微芯片 | `microchip` |
| 纸页 | `parchment` |
| 手稿 | `manuscript` |
| 典籍 | `compendium` |
| 蓝图 | `blueprint` |
| 钍 | `thorium` |
| 巨石 | `megalith` |
| 血石 | `bloodstone` |
| 秘银 | `tMythril` |

## 信仰升级（11 项）

定义位置：[progression-catalog.js](../../src/engine/progression-catalog.js)。

| 名称 | 代码标识符 |
| --- | --- |
| 晨光祈歌 | `solarchant` |
| 神殿研习 | `scholasticism` |
| 金蜜尖塔 | `goldenSpire` |
| 朝日坛 | `sunAltar` |
| 彩光窗 | `stainedGlass` |
| 日耀启明 | `solarRevolution` |
| 群山礼堂 | `basilica` |
| 守林誓约 | `templars` |
| 灵悟手记 | `apocripha` |
| 升华之路 | `transcendence` |
| 山灵壁画 | `frescoes` |

## 超越升级（11 项）

定义位置：[progression-catalog.js](../../src/engine/progression-catalog.js)。

| 名称 | 代码标识符 |
| --- | --- |
| 夜晶碑 | `blackObelisk` |
| 暗光汇点 | `blackNexus` |
| 幽晶核 | `blackCore` |
| 群星奇点 | `singularity` |
| 夜林藏书馆 | `blackLibrary` |
| 静夜光辉 | `blackRadiance` |
| 远星脉冲 | `blazar` |
| 暗星新生 | `darkNova` |
| 长眠星庭 | `mausoleum` |
| 族群升格 | `holyGenocide` |
| 镜外森林 | `darkParacosm` |

## 灵鹿祭仪设施（10 项）

定义位置：[progression-catalog.js](../../src/engine/progression-catalog.js)。

| 名称 | 代码标识符 |
| --- | --- |
| 灵鹿石冢 | `unicornTomb` |
| 白枝高塔 | `ivoryTower` |
| 白枝城垣 | `ivoryCitadel` |
| 云巅灵宫 | `skyPalace` |
| 灵鹿乐土 | `unicornUtopia` |
| 朝阳灵柱 | `sunspire` |
| 幽林界碑 | `marker` |
| 灵鹿静园 | `unicornGraveyard` |
| 静夜鹿城 | `unicornNecropolis` |
| 夜蜜金字塔 | `blackPyramid` |

## 约定（6 项）

定义位置：[progression-catalog.js](../../src/engine/progression-catalog.js)。

| 名称 | 代码标识符 |
| --- | --- |
| 净林之约 | `pactOfCleansing` |
| 重塑之约 | `pactOfDestruction` |
| 静默之约 | `pactOfExtermination` |
| 澄明之约 | `pactOfPurity` |
| 秘艺之约 | `pactOfArcane` |
| 星史之约 | `pactOfChronicler` |

## 约定策略（3 项）

定义位置：[progression-catalog.js](../../src/engine/progression-catalog.js)。

| 名称 | 代码标识符 |
| --- | --- |
| 引流偿约 | `siphoning` |
| 盛宴馈赠 | `feedingFrenzy` |
| 预付供养 | `upfrontPayment` |

## 约定状态（1 项）

定义位置：[progression-catalog.js](../../src/engine/progression-catalog.js)。此条目表示状态，不是可购买设施。

| 名称 | 代码标识符 | 状态说明 |
| --- | --- | --- |
| 约定破裂 | `fractured` | 本轮供养债务曾达到 50，约定已破裂；重建后恢复。 |

## 太空任务（13 项）

定义位置：[progression-catalog.js](../../src/engine/progression-catalog.js)。任务目录包含航路与前置条件；抵达和建设仍需满足运行时条件。

| 名称 | 代码标识符 |
| --- | --- |
| 初探星空 | `orbitalLaunch` |
| 月林之旅 | `moonMission` |
| 远赴沙海 | `duneMission` |
| 探访潮星 | `piscineMission` |
| 近日前哨 | `heliosMission` |
| 冰境航行 | `terminusMission` |
| 访寻微星 | `kairoMission` |
| 深空回声 | `rorschachMission` |
| 翠星远征 | `yarnMission` |
| 暗隙探航 | `umbraMission` |
| 遥望冥岸 | `charonMission` |
| 双星归途 | `centaurusSystemMission` |
| 极远星环 | `furthestRingMission` |

## 太空设施（22 项）

定义位置：[progression-catalog.js](../../src/engine/progression-catalog.js)。

| 名称 | 代码标识符 |
| --- | --- |
| 登星藤梯 | `spaceElevator` |
| 巡天蜂舟 | `sattelite` |
| 轨道熊屋 | `spaceStation` |
| 月林采晶站 | `moonOutpost` |
| 月林基地 | `moonBase` |
| 星岩采集器 | `planetCracker` |
| 深砂油泵 | `hydrofracturer` |
| 星香提炼站 | `spiceRefinery` |
| 潮星研究船 | `researchVessel` |
| 环星阵列 | `orbitalArray` |
| 采日环 | `sunlifter` |
| 星质储舱 | `containmentChamber` |
| 散热翼 | `heatsink` |
| 日焰锻台 | `sunforge` |
| 冰境仓站 | `cryostation` |
| 远星灯塔 | `spaceBeacon` |
| 翠星造林站 | `terraformingStation` |
| 星际蜜园 | `hydroponics` |
| 暗隙能量帆 | `hrHarvester` |
| 量子织机 | `entangler` |
| 地脉发电站 | `tectonic` |
| 熔核井 | `moltenCore` |

## 时光设施（13 项）

定义位置：[progression-catalog.js](../../src/engine/progression-catalog.js)。

| 名称 | 代码标识符 |
| --- | --- |
| 时流蓄池 | `temporalBattery` |
| 时焰熔炉 | `blastFurnace` |
| 时焰锅炉 | `timeBoiler` |
| 节律闸门 | `controlledDelay` |
| 时轮增幅器 | `temporalAccelerator` |
| 远时缓冲器 | `temporalImpedance` |
| 旧年采集器 | `ressourceRetrieval` |
| 时页压机 | `temporalPress` |
| 冬眠舱 | `cryochambers` |
| 空境采集器 | `voidHoover` |
| 空境裂隙 | `voidRift` |
| 时序锚点 | `chronocontrol` |
| 空境共鸣器 | `voidResonator` |

## 挑战（10 项）

定义位置：[progression-catalog.js](../../src/engine/progression-catalog.js)。列入目录不代表所有挑战完成路径均已测试。

| 名称 | 代码标识符 |
| --- | --- |
| 独行森林 | `ironWill` |
| 漫长寒冬 | `winterIsComing` |
| 自在熊群 | `anarchy` |
| 紧缺能源 | `energy` |
| 无星长夜 | `atheism` |
| 千年之旅 | `1000Years` |
| 无光天幕 | `blackSky` |
| 和平山林 | `pacifism` |
| 灵露试炼 | `unicornTears` |
| 余灰复苏 | `postApocalypse` |

## 传承能力（40 项）

定义位置：[progression-catalog.js](../../src/engine/progression-catalog.js)。

| 名称 | 代码标识符 |
| --- | --- |
| 营建记忆 | `engeneering` |
| 口述蜜典 | `codexVox` |
| 思辨蜜典 | `codexLogos` |
| 星野蜜典 | `codexAgrum` |
| 远古回声 | `megalomania` |
| 夜色蜜典 | `blackCodex` |
| 巨鲸蜜典 | `codexLeviathanianus` |
| 金蜜比例 | `goldenRatio` |
| 星愿比例 | `divineProportion` |
| 熊掌比例 | `vitruvianFeline` |
| 林地新生 | `renaissance` |
| 林间善意 | `diplomacy` |
| 草原约定 | `zebraDiplomacy` |
| 草原盟誓 | `zebraCovenant` |
| 海路盟誓 | `navigationDiplomacy` |
| 远行使者 | `ambassadors` |
| 营地条约 | `treaties` |
| 时轮记忆 | `chronomancy` |
| 星迹记忆 | `astromancy` |
| 灵鹿记忆 | `unicornmancy` |
| 星翼记忆 | `alicornmancy` |
| 逆时记忆 | `anachronomancy` |
| 蜜林嘉年华 | `carnivals` |
| 星序规律 | `numerology` |
| 星序共鸣 | `numeromancy` |
| 绒毛呼唤 | `willenfluff` |
| 熊掌召集 | `pawgan` |
| 空境低语 | `voidOrder` |
| 远行试炼 | `adjustmentBureau` |
| 储备明鉴 | `ascoh` |
| 传承环 1 | `malkuth` |
| 传承环 2 | `yesod` |
| 传承环 3 | `hod` |
| 传承环 4 | `netzach` |
| 传承环 5 | `tiferet` |
| 传承环 6 | `gevurah` |
| 传承环 7 | `chesed` |
| 传承环 8 | `binah` |
| 传承环 9 | `chokhmah` |
| 传承环 10 | `keter` |

## 成就（31 项）

定义位置：[achievements.js](../../src/engine/achievements.js)。

| 名称 | 代码标识符 |
| --- | --- |
| 花径上的新邻居 | `forestGuest` |
| 捧住一滴星露 | `dewKeepsake` |
| 树冠以上的来客 | `wingedGuest` |
| 月影中的脚步 | `nightGuest` |
| 把时光装进蜜罐 | `crystalMemory` |
| 百颗沉静的心愿 | `hundredStones` |
| 并肩巡过山林 | `stripedCompany` |
| 独自敲开的山门 | `loneQuarry` |
| 独自码好的木箱 | `loneStore` |
| 四十五片花圃 | `loneMeadow` |
| 林中第一声汽笛 | `loneSteam` |
| 为独行点亮电灯 | `lonePower` |
| 一熊的精工蓝图 | `loneFactory` |
| 独行者的月光信 | `loneMoon` |
| 第二个春天前的远行 | `earlyOrbit` |
| 百座望星台 | `watchfulForest` |
| 一张床与高高石阶 | `oneBedTemple` |
| 山林捧起的曙光 | `brightWishes` |
| 带回一缕温柔 | `rememberedKindness` |
| 每只熊都在家 | `safeHaven` |
| 蜜香满林 | `joyfulGrove` |
| 森林尽头还有星星 | `outermostTrail` |
| 四万圈年轮 | `fortyMillennia` |
| 百年花灯长明 | `longCelebration` |
| 五条山路的归来者 | `manyJourneys` |
| 先为明天种树 | `clearTomorrow` |
| 记住十个空床位 | `tenEmptyBeds` |
| 山林的沉重记录 | `hundredEmptyBeds` |
| 停不下来的采蜜爪 | `racingPaws` |
| 不肯离开的森智 | `stubbornCore` |
| 旧冬日的蜜封 | `winterArchive` |

## 徽记（21 项）

定义位置：[achievements.js](../../src/engine/achievements.js)。需要在线服务的徽记仍应以运行时可用状态为准。

| 名称 | 代码标识符 |
| --- | --- |
| 木屑围裙 | `woodSpecialist` |
| 慢悠悠的领队 | `easygoingLeader` |
| 花色披肩 | `colorfulLeader` |
| 归林五十次 | `fiftyReturns` |
| 独行夜归 | `loneNightReturn` |
| 日历夹缝里的新家 | `betweenDays` |
| 不带猎队的商旅 | `gentleExchange` |
| 千熊露天营 | `unhousedThousand` |
| 五百盏地上花灯 | `moonlessHerd` |
| 绕过月亮的航线 | `duneDetour` |
| 先走进时光 | `clockBeforeRocket` |
| 解开打结的年轮 | `untieTime` |
| 比旧蜜罐更满 | `overflowingReturn` |
| 借走的五年 | `fiveBorrowedYears` |
| 远古商队的盛宴 | `elderBanquet` |
| 翠星上的大熊村 | `farawayHomes` |
| 四十二对星翼 | `fortyTwoWings` |
| 试走的新林径 | `previewTrail` |
| 没有新告示的一天 | `quietNotice` |
| 留住一颗故障火星 | `caughtSpark` |
| 旧册中的青林印 | `oldClearSky` |

## 职业（9 项）

定义位置：[catalog.js](../../src/engine/catalog.js)、[diplomacy.js](../../src/engine/diplomacy.js)、[engineer-automation.js](../../src/engine/engineer-automation.js)。

| 名称 | 代码标识符 |
| --- | --- |
| 伐木熊 | `woodcutter` |
| 养蜂熊 | `farmer` |
| 学者熊 | `scholar` |
| 巡林熊 | `hunter` |
| 矿工熊 | `miner` |
| 祈愿熊 | `priest` |
| 地质熊 | `geologist` |
| 使节熊 | `ambassador` |
| 工程熊 | `engineer` |

## 商团（8 项）

定义位置：[trade-catalog.js](../../src/engine/trade-catalog.js)。

| 名称 | 代码标识符 |
| --- | --- |
| 绿叶商团 | `lizards` |
| 潮湾商团 | `sharks` |
| 云翼商团 | `griffins` |
| 盘藤商团 | `nagas` |
| 条纹商团 | `zebras` |
| 丝谷商团 | `spiders` |
| 焰岭商团 | `dragons` |
| 星海来客 | `leviathans` |

## 星象周期（10 项）

定义位置：[progression-catalog.js](../../src/engine/progression-catalog.js)。周期影响建筑和节庆产出，不等同于可航行目的地清单。

| 名称 | 代码标识符 |
| --- | --- |
| 冥岸星轮 | `charon` |
| 暗隙星轮 | `umbra` |
| 翠星轮 | `yarn` |
| 朝日星轮 | `helios` |
| 故林星轮 | `cath` |
| 月林星轮 | `redmoon` |
| 沙海星轮 | `dune` |
| 潮星轮 | `piscine` |
| 冰境星轮 | `terminus` |
| 微光星轮 | `kairo` |
