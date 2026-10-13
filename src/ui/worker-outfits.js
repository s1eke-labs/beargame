/** One occupation identity shared by the map actors and assignment portraits. */
export const workerStyles={
 woodcutter:{resource:'wood',poses:['woodcutterReady','woodcutterWork'],name:'举斧伐木'},
 farmer:{resource:'honey',poses:['farmerReady','farmerWork'],name:'检查蜂框'},
 scholar:{resource:'science',poses:['scholarReady','scholarWork'],name:'阅读研究'},
 hunter:{resource:'manpower',poses:['hunterReady','hunterWork'],name:'巡视林地'},
 miner:{resource:'minerals',poses:['minerReady','minerWork'],name:'开采矿石'},
 engineer:{resource:'gear',poses:['engineerReady','engineerWork'],name:'加工零件'},
 priest:{resource:'faith',poses:['priestReady','priestWork'],name:'照看心愿'},
 geologist:{resource:'coal',poses:['geologistReady','geologistWork'],name:'勘察岩层'},
 ambassador:{resource:'parchment',poses:['ambassadorReady','ambassadorWork'],name:'商旅交涉'}
};
export const idleWorkerStyle={resource:'bear',poses:['idleWalk','idleWalk'],name:'待命'};
export const workerPortrait=id=>workerStyles[id]?.poses[0]||'idleWalk';
