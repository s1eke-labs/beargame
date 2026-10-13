// Generated from the complete private source for this release only.
export const catalog = {
  "resources": [
    {
      "id": "honey",
      "name": "蜂蜜",
      "cap": 5000,
      "description": "熊群的口粮。蜂箱受季节影响，养蜂熊的产出不受季节影响。"
    },
    {
      "id": "wood",
      "name": "木材",
      "cap": 200,
      "description": "林地采集和建设使用的基础材料。"
    },
    {
      "id": "minerals",
      "name": "矿石",
      "cap": 250,
      "description": "山地挖掘出的建筑材料。"
    },
    {
      "id": "iron",
      "name": "铁",
      "cap": 50,
      "description": "熔炉把木材与矿石冶炼成铁。"
    },
    {
      "id": "manpower",
      "name": "活力",
      "cap": 100,
      "description": "巡林熊积攒的狩猎活力。"
    },
    {
      "id": "science",
      "name": "知识",
      "cap": 250,
      "description": "学者熊在书屋里积累的研究成果。"
    },
    {
      "id": "furs",
      "name": "毛皮",
      "cap": null,
      "description": ""
    },
    {
      "id": "ivory",
      "name": "象牙",
      "cap": null,
      "description": ""
    },
    {
      "id": "unicorns",
      "name": "灵鹿",
      "cap": null,
      "description": ""
    },
    {
      "id": "beam",
      "name": "木梁",
      "cap": null,
      "description": ""
    },
    {
      "id": "slab",
      "name": "石板",
      "cap": null,
      "description": ""
    }
  ],
  "buildings": [
    {
      "id": "hive",
      "name": "蜂箱",
      "cost": {
        "honey": 10
      },
      "ratio": 1.12,
      "effect": {
        "honey": 0.125
      },
      "gate": {},
      "description": "蜜蜂沿花径归巢，为营地带回蜂蜜。蜂箱产量随季节与天气变化。",
      "type": "build"
    },
    {
      "id": "hut",
      "name": "树洞熊舍",
      "cost": {
        "wood": 5
      },
      "ratio": 2.5,
      "effect": {
        "bears": 2,
        "manpowerMax": 75
      },
      "gate": {},
      "description": "用木材围起温暖的小屋。每间能迎来两只小熊。",
      "type": "build"
    },
    {
      "id": "library",
      "name": "林间书屋",
      "cost": {
        "wood": 25
      },
      "ratio": 1.15,
      "effect": {
        "scienceRatio": 0.1,
        "scienceMax": 250
      },
      "gate": {},
      "description": "把森林见闻写进书页。书屋为知识留下更多空间。",
      "type": "build"
    },
    {
      "id": "barn",
      "name": "蜜粮仓",
      "cost": {
        "wood": 50
      },
      "ratio": 1.75,
      "effect": {
        "honeyMax": 5000,
        "woodMax": 200,
        "mineralsMax": 250,
        "ironMax": 50
      },
      "gate": {
        "science": "agriculture"
      },
      "description": "把口粮和常用材料妥善存放，给下一次扩建留下余量。",
      "type": "build"
    },
    {
      "id": "pasture",
      "name": "花间食圃",
      "cost": {
        "honey": 100,
        "wood": 10
      },
      "ratio": 1.15,
      "effect": {
        "honeyDemandReduction": 0.005
      },
      "gate": {
        "science": "animal"
      },
      "description": "在营地旁照料可食植物，让熊群少消耗一点蜂蜜。",
      "type": "build"
    },
    {
      "id": "mine",
      "name": "石矿井",
      "cost": {
        "wood": 100
      },
      "ratio": 1.15,
      "effect": {
        "mineralsRatio": 0.2,
        "pollution": 0.08
      },
      "gate": {
        "science": "mining"
      },
      "description": "开出通向矿脉的道路，让矿工熊的挖掘更有效率。",
      "type": "build"
    },
    {
      "id": "workshop",
      "name": "手作坊",
      "cost": {
        "wood": 100,
        "minerals": 400
      },
      "ratio": 1.15,
      "effect": {
        "craftRatio": 0.06
      },
      "gate": {
        "science": "mining"
      },
      "description": "让工具、材料与熟练的双手相遇，提高大部分手工制作产量。",
      "type": "build"
    },
    {
      "id": "smelter",
      "name": "铸铁炉",
      "cost": {
        "minerals": 200
      },
      "ratio": 1.15,
      "effect": {
        "pollution": 0.15
      },
      "gate": {
        "science": "metal"
      },
      "description": "持续消耗木材与矿石，熔炼建设所需的铁。",
      "type": "build",
      "conversion": {
        "input": {
          "wood": 0.05,
          "minerals": 0.1
        },
        "output": {
          "iron": 0.02
        }
      }
    },
    {
      "id": "logHouse",
      "name": "木屋",
      "cost": {
        "wood": 200,
        "minerals": 250
      },
      "ratio": 1.15,
      "effect": {
        "bears": 1,
        "manpowerMax": 50
      },
      "gate": {
        "science": "construction"
      },
      "description": "结实的木屋能在日渐拥挤的营地里增加住处。",
      "type": "build"
    },
    {
      "id": "warehouse",
      "name": "工料库",
      "cost": {
        "beam": 1.5,
        "slab": 2
      },
      "ratio": 1.15,
      "effect": {
        "woodMax": 150,
        "mineralsMax": 200,
        "ironMax": 25
      },
      "gate": {
        "science": "construction"
      },
      "description": "为木材、矿石与铁搭建专门的存放空间。",
      "type": "build"
    },
    {
      "id": "lumberMill",
      "name": "木材工场",
      "cost": {
        "wood": 100,
        "minerals": 250,
        "iron": 50
      },
      "ratio": 1.15,
      "effect": {
        "woodRatio": 0.1
      },
      "gate": {
        "science": "construction"
      },
      "description": "改良木料加工，提高伐木熊的木材产量。",
      "type": "build"
    }
  ],
  "science": [
    {
      "id": "calendar",
      "name": "四季历法",
      "cost": {
        "science": 30
      },
      "gate": {
        "buildings": {
          "library": 1
        }
      },
      "description": "记录季节更替，找到适合蜜蜂与小熊的生活节奏。",
      "type": "research",
      "opens": [
        "养蜂学"
      ]
    },
    {
      "id": "agriculture",
      "name": "养蜂学",
      "cost": {
        "science": 100
      },
      "gate": {
        "scienceAny": [
          "calendar"
        ]
      },
      "description": "学会照料蜜蜂，安排养蜂熊稳定供应口粮。",
      "type": "research",
      "opens": [
        "林间狩猎",
        "采矿学",
        "蜜粮仓",
        "养蜂熊"
      ]
    },
    {
      "id": "archery",
      "name": "林间狩猎",
      "cost": {
        "science": 300
      },
      "gate": {
        "scienceAny": [
          "agriculture"
        ]
      },
      "description": "制作狩猎工具，让巡林熊为营地积攒活力。",
      "type": "research",
      "opens": [
        "山林共生",
        "巡林熊"
      ]
    },
    {
      "id": "mining",
      "name": "采矿学",
      "cost": {
        "science": 500
      },
      "gate": {
        "scienceAny": [
          "agriculture"
        ]
      },
      "description": "认识矿脉，开设石矿井与手作坊。",
      "type": "research",
      "opens": [
        "冶金入门",
        "石矿井",
        "手作坊",
        "矿工熊"
      ]
    },
    {
      "id": "metal",
      "name": "冶金入门",
      "cost": {
        "science": 900
      },
      "gate": {
        "scienceAny": [
          "mining"
        ]
      },
      "description": "掌握冶炼方法，把木材与矿石变成铁。",
      "type": "research",
      "opens": [
        "铸铁炉"
      ]
    },
    {
      "id": "animal",
      "name": "山林共生",
      "cost": {
        "science": 500
      },
      "gate": {
        "scienceAny": [
          "archery"
        ]
      },
      "description": "了解林间动物，照料花间食圃，研究营造方法。",
      "type": "research",
      "opens": [
        "营造学",
        "花间食圃"
      ]
    },
    {
      "id": "construction",
      "name": "营造学",
      "cost": {
        "science": 1300
      },
      "gate": {
        "scienceAny": [
          "animal"
        ]
      },
      "description": "建造木屋、工料库与木材工场，让森林家园扎下根。",
      "type": "research",
      "opens": [
        "木屋",
        "工料库",
        "木材工场"
      ]
    }
  ],
  "workshop": [
    {
      "id": "mineralHoes",
      "name": "石质蜂铲",
      "type": "upgrade",
      "cost": {
        "minerals": 275,
        "science": 100
      },
      "gate": {
        "buildings": {
          "workshop": 1
        }
      },
      "effect": {
        "farmerRatio": 0.5
      },
      "description": "改进营地的工具、方法或设施。",
      "summary": "养蜂熊产出 +50%"
    },
    {
      "id": "ironHoes",
      "name": "铁质蜂铲",
      "type": "upgrade",
      "cost": {
        "iron": 25,
        "science": 200
      },
      "gate": {
        "buildings": {
          "workshop": 1
        }
      },
      "effect": {
        "farmerRatio": 0.3
      },
      "description": "改进营地的工具、方法或设施。",
      "summary": "养蜂熊产出 +30%"
    },
    {
      "id": "mineralAxes",
      "name": "石斧",
      "type": "upgrade",
      "cost": {
        "minerals": 500,
        "science": 100
      },
      "gate": {
        "buildings": {
          "workshop": 1
        }
      },
      "effect": {
        "woodcutterRatio": 0.7
      },
      "description": "改进营地的工具、方法或设施。",
      "summary": "伐木熊产出 +70%"
    },
    {
      "id": "ironAxes",
      "name": "铁斧",
      "type": "upgrade",
      "cost": {
        "iron": 50,
        "science": 200
      },
      "gate": {
        "buildings": {
          "workshop": 1
        }
      },
      "effect": {
        "woodcutterRatio": 0.5
      },
      "description": "改进营地的工具、方法或设施。",
      "summary": "伐木熊产出 +50%"
    },
    {
      "id": "reinforcedSaw",
      "name": "加固锯",
      "type": "upgrade",
      "cost": {
        "iron": 1000,
        "science": 2500
      },
      "gate": {
        "buildings": {
          "workshop": 1
        },
        "science": "construction"
      },
      "effect": {
        "lumberMillRatio": 0.2
      },
      "description": "改进营地的工具、方法或设施。",
      "summary": "木材工场效能 +20%"
    },
    {
      "id": "stoneBarns",
      "name": "石砌蜜仓",
      "type": "upgrade",
      "cost": {
        "wood": 1000,
        "minerals": 750,
        "iron": 50,
        "science": 500
      },
      "gate": {
        "buildings": {
          "workshop": 1
        }
      },
      "effect": {
        "barnRatio": 0.75
      },
      "description": "改进营地的工具、方法或设施。",
      "summary": "蜜粮仓容量加成 +75%"
    },
    {
      "id": "reinforcedBarns",
      "name": "加固蜜仓",
      "type": "upgrade",
      "cost": {
        "iron": 100,
        "science": 800,
        "beam": 25,
        "slab": 10
      },
      "gate": {
        "buildings": {
          "workshop": 1
        }
      },
      "effect": {
        "barnRatio": 0.8
      },
      "description": "改进营地的工具、方法或设施。",
      "summary": "蜜粮仓容量加成 +80%"
    },
    {
      "id": "advancedRefinement",
      "name": "精细补给",
      "type": "upgrade",
      "cost": {
        "honey": 5000,
        "science": 500
      },
      "gate": {
        "buildings": {
          "workshop": 1
        },
        "science": "construction"
      },
      "effect": {
        "honeyPerWood": 50
      },
      "description": "改进营地的工具、方法或设施。",
      "summary": "每份木材的补给口粮改为 50 蜂蜜。"
    },
    {
      "id": "bolas",
      "name": "投索",
      "type": "upgrade",
      "cost": {
        "wood": 50,
        "minerals": 250,
        "science": 1000
      },
      "gate": {
        "buildings": {
          "workshop": 1
        },
        "science": "mining"
      },
      "effect": {
        "hunterRatio": 1
      },
      "description": "改进营地的工具、方法或设施。",
      "summary": "狩猎加成 +100%"
    },
    {
      "id": "huntingArmor",
      "name": "护林甲",
      "type": "upgrade",
      "cost": {
        "iron": 750,
        "science": 2000
      },
      "gate": {
        "buildings": {
          "workshop": 1
        },
        "science": "metal"
      },
      "effect": {
        "hunterRatio": 2
      },
      "description": "改进营地的工具、方法或设施。",
      "summary": "狩猎加成 +200%"
    },
    {
      "id": "compositeBow",
      "name": "复合弓",
      "type": "upgrade",
      "cost": {
        "wood": 200,
        "iron": 100,
        "science": 500
      },
      "gate": {
        "buildings": {
          "workshop": 1
        },
        "science": "construction"
      },
      "effect": {
        "hunterJobRatio": 0.5
      },
      "description": "改进营地的工具、方法或设施。",
      "summary": "巡林熊产出 +50%"
    },
    {
      "id": "prospecting",
      "name": "陨石勘测",
      "type": "upgrade",
      "cost": {
        "minerals": 1000,
        "science": 1000
      },
      "gate": {
        "buildings": {
          "workshop": 1
        },
        "science": "metal"
      },
      "effect": {
        "meteorIronEnabled": true
      },
      "description": "改进营地的工具、方法或设施。",
      "summary": "从陨石中发现铁。"
    }
  ],
  "crafts": [
    {
      "id": "wood",
      "name": "林地采木",
      "cost": {
        "honey": 100
      },
      "output": "wood",
      "amount": 1,
      "gate": {},
      "type": "refine",
      "description": "带上蜂蜜作为口粮，前往林地采回木材。",
      "tier": 1,
      "difficulty": 1
    },
    {
      "id": "beam",
      "name": "木梁",
      "cost": {
        "wood": 175
      },
      "output": "beam",
      "amount": 1,
      "gate": {
        "buildings": {
          "workshop": 1
        }
      },
      "type": "craft",
      "description": "把原料制成木梁；手作坊与相关技术可以增加成品产量。",
      "tier": 1,
      "difficulty": 1
    },
    {
      "id": "slab",
      "name": "石板",
      "cost": {
        "minerals": 250
      },
      "output": "slab",
      "amount": 1,
      "gate": {
        "buildings": {
          "workshop": 1
        }
      },
      "type": "craft",
      "description": "把原料制成石板；手作坊与相关技术可以增加成品产量。",
      "tier": 1,
      "difficulty": 1
    }
  ],
  "jobs": [
    {
      "id": "woodcutter",
      "name": "伐木熊",
      "output": "wood",
      "rate": 0.018,
      "gate": {},
      "description": "沿着林间小路采集木材。"
    },
    {
      "id": "farmer",
      "name": "养蜂熊",
      "output": "honey",
      "rate": 1,
      "gate": {
        "science": "agriculture"
      },
      "description": "亲手养护蜜源，产量不随季节改变。"
    },
    {
      "id": "scholar",
      "name": "学者熊",
      "output": "science",
      "rate": 0.035,
      "gate": {
        "buildings": {
          "library": 1
        }
      },
      "description": "在树下书屋记录发现。"
    },
    {
      "id": "hunter",
      "name": "巡林熊",
      "output": "manpower",
      "rate": 0.06,
      "gate": {
        "science": "archery"
      },
      "description": "巡行森林，积攒用于狩猎的活力。"
    },
    {
      "id": "miner",
      "name": "矿工熊",
      "output": "minerals",
      "rate": 0.05,
      "gate": {
        "science": "mining"
      },
      "description": "从山地带回矿石。"
    }
  ]
};
export const constants = {
  "TICKS_PER_SECOND": 5,
  "TICKS_PER_DAY": 10,
  "DAYS_PER_SEASON": 100,
  "SEASONS_PER_YEAR": 4,
  "SEASONS": [
    "春",
    "夏",
    "秋",
    "冬"
  ],
  "SEASON_FACTORS": [
    1.5,
    1,
    1,
    0.25
  ],
  "MAX_OFFLINE_SECONDS": 8000,
  "SAVE_VERSION": 1,
  "SAVE_KEY": "beargame.chapters.save.v1"
};
export const release = {
  "family": "beargame-chapters",
  "chapter": "forest",
  "contentLevel": 1,
  "schema": 1,
  "title": "森林家园",
  "appVersion": "7.0.0"
};
