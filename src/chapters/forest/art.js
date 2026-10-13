// Forest chapter artwork. Every URL resolves to a chapter-only file.
export const art = {
  "buildings": {
    "hive": "./chapters/forest/buildings/hive.webp",
    "hut": "./chapters/forest/buildings/hut.webp",
    "library": "./chapters/forest/buildings/library.webp",
    "barn": "./chapters/forest/buildings/barn.webp",
    "mine": "./chapters/forest/buildings/mine.webp",
    "smelter": "./chapters/forest/buildings/smelter.webp",
    "logHouse": "./chapters/forest/buildings/logHouse.webp",
    "warehouse": "./chapters/forest/buildings/warehouse.webp",
    "lumberMill": "./chapters/forest/buildings/lumberMill.webp",
    "pasture": "./chapters/forest/buildings/pasture.webp",
    "workshop": "./chapters/forest/buildings/workshop.webp"
  },
  "growth": {
    "hive": "./chapters/forest/growth/hive.webp",
    "hut": "./chapters/forest/growth/hut.webp",
    "library": "./chapters/forest/growth/library.webp",
    "barn": "./chapters/forest/growth/barn.webp",
    "lumberMill": "./chapters/forest/growth/lumberMill.webp",
    "workshop": "./chapters/forest/growth/workshop.webp",
    "warehouse": "./chapters/forest/growth/warehouse.webp"
  },
  "resources": {
    "honey": "./chapters/forest/resources/honey.webp",
    "wood": "./chapters/forest/resources/wood.webp",
    "minerals": "./chapters/forest/resources/minerals.webp",
    "iron": "./chapters/forest/resources/iron.webp",
    "science": "./chapters/forest/resources/science.webp",
    "manpower": "./chapters/forest/resources/manpower.webp",
    "furs": "./chapters/forest/resources/furs.webp",
    "ivory": "./chapters/forest/resources/ivory.webp",
    "unicorns": "./chapters/forest/resources/unicorns.webp",
    "beam": "./chapters/forest/resources/beam.webp",
    "slab": "./chapters/forest/resources/slab.webp",
    "bear": "./chapters/forest/bears/idleFront.webp"
  },
  "research": {
    "calendar": "./chapters/forest/research/calendar.webp",
    "agriculture": "./chapters/forest/research/agriculture.webp",
    "archery": "./chapters/forest/research/archery.webp",
    "mining": "./chapters/forest/research/mining.webp",
    "metal": "./chapters/forest/research/metal.webp",
    "animal": "./chapters/forest/research/animal.webp",
    "construction": "./chapters/forest/research/construction.webp"
  },
  "workers": {
    "woodcutter": {
      "ready": "./chapters/forest/workers/woodcutter-ready.webp",
      "work": "./chapters/forest/workers/woodcutter-work.webp"
    },
    "farmer": {
      "ready": "./chapters/forest/workers/farmer-ready.webp",
      "work": "./chapters/forest/workers/farmer-work.webp"
    },
    "scholar": {
      "ready": "./chapters/forest/workers/scholar-ready.webp",
      "work": "./chapters/forest/workers/scholar-work.webp"
    },
    "hunter": {
      "ready": "./chapters/forest/workers/hunter-ready.webp",
      "work": "./chapters/forest/workers/hunter-work.webp"
    },
    "miner": {
      "ready": "./chapters/forest/workers/miner-ready.webp",
      "work": "./chapters/forest/workers/miner-work.webp"
    },
    "idle": {
      "ready": "./chapters/forest/bears/idleFront.webp",
      "work": "./chapters/forest/bears/idleFront.webp"
    }
  },
  "bears": {
    "idleFront": "./chapters/forest/bears/idleFront.webp",
    "wave": "./chapters/forest/bears/wave.webp"
  },
  "scenery": {
    "background": "./chapters/forest/scenery/background.webp",
    "loading": "./chapters/forest/scenery/loading.webp"
  },
  "background": "./chapters/forest/scenery/background.webp",
  "loading": "./chapters/forest/scenery/loading.webp"
};
export const forestArt = art;
export const forestAssets = [
  "./chapters/forest/bears/idleFront.webp",
  "./chapters/forest/bears/wave.webp",
  "./chapters/forest/buildings/barn.webp",
  "./chapters/forest/buildings/hive.webp",
  "./chapters/forest/buildings/hut.webp",
  "./chapters/forest/buildings/library.webp",
  "./chapters/forest/buildings/logHouse.webp",
  "./chapters/forest/buildings/lumberMill.webp",
  "./chapters/forest/buildings/mine.webp",
  "./chapters/forest/buildings/pasture.webp",
  "./chapters/forest/buildings/smelter.webp",
  "./chapters/forest/buildings/warehouse.webp",
  "./chapters/forest/buildings/workshop.webp",
  "./chapters/forest/growth/barn.webp",
  "./chapters/forest/growth/hive.webp",
  "./chapters/forest/growth/hut.webp",
  "./chapters/forest/growth/library.webp",
  "./chapters/forest/growth/lumberMill.webp",
  "./chapters/forest/growth/warehouse.webp",
  "./chapters/forest/growth/workshop.webp",
  "./chapters/forest/research/agriculture.webp",
  "./chapters/forest/research/animal.webp",
  "./chapters/forest/research/archery.webp",
  "./chapters/forest/research/calendar.webp",
  "./chapters/forest/research/construction.webp",
  "./chapters/forest/research/metal.webp",
  "./chapters/forest/research/mining.webp",
  "./chapters/forest/resources/beam.webp",
  "./chapters/forest/resources/furs.webp",
  "./chapters/forest/resources/honey.webp",
  "./chapters/forest/resources/iron.webp",
  "./chapters/forest/resources/ivory.webp",
  "./chapters/forest/resources/manpower.webp",
  "./chapters/forest/resources/minerals.webp",
  "./chapters/forest/resources/science.webp",
  "./chapters/forest/resources/slab.webp",
  "./chapters/forest/resources/unicorns.webp",
  "./chapters/forest/resources/wood.webp",
  "./chapters/forest/scenery/background.webp",
  "./chapters/forest/scenery/loading.webp",
  "./chapters/forest/workers/farmer-ready.webp",
  "./chapters/forest/workers/farmer-work.webp",
  "./chapters/forest/workers/hunter-ready.webp",
  "./chapters/forest/workers/hunter-work.webp",
  "./chapters/forest/workers/miner-ready.webp",
  "./chapters/forest/workers/miner-work.webp",
  "./chapters/forest/workers/scholar-ready.webp",
  "./chapters/forest/workers/scholar-work.webp",
  "./chapters/forest/workers/woodcutter-ready.webp",
  "./chapters/forest/workers/woodcutter-work.webp"
];
export const forestWorkerFrame = Object.freeze({ width: 256, height: 256, anchorX: 112, baseline: 240 });
export function forestImage(kind, id, pose = 'ready') {
  const group = { building: 'buildings', resource: 'resources', worker: 'workers', bear: 'bears' }[kind] || kind;
  const item = art[group]?.[id];
  return typeof item === 'string' ? item : item?.[pose] || '';
}
