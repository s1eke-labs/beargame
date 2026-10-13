export const growthAtlases={"buildings":{"width":1448,"height":1086,"crops":{"apiary":{"x":17,"y":120,"width":338,"height":231},"expandedHut":{"x":379,"y":81,"width":333,"height":276},"loghouse":{"x":729,"y":126,"width":321,"height":232},"manor":{"x":1068,"y":79,"width":361,"height":280},"expandedLibrary":{"x":16,"y":388,"width":348,"height":328},"academy":{"x":381,"y":411,"width":335,"height":297},"lumberyard":{"x":727,"y":492,"width":328,"height":221},"granary":{"x":1068,"y":427,"width":368,"height":282},"workshop":{"x":22,"y":775,"width":345,"height":256},"smelter":{"x":398,"y":728,"width":331,"height":301},"factory":{"x":736,"y":759,"width":345,"height":269},"launchpad":{"x":1106,"y":733,"width":324,"height":296}}},"workers":{"width":1448,"height":1086,"crops":{"logCarry":{"x":70,"y":31,"width":249,"height":318},"logLift":{"x":416,"y":30,"width":311,"height":319},"idleWalk":{"x":790,"y":28,"width":239,"height":321},"honeyStand":{"x":1144,"y":23,"width":229,"height":329},"honeyTend":{"x":68,"y":389,"width":255,"height":308},"honeyCarry":{"x":412,"y":381,"width":261,"height":315},"readBook":{"x":786,"y":395,"width":251,"height":305},"turnPage":{"x":1153,"y":395,"width":256,"height":305},"pickDown":{"x":84,"y":741,"width":247,"height":325},"pickUp":{"x":388,"y":727,"width":271,"height":333},"wrenchDown":{"x":804,"y":742,"width":204,"height":324},"wrenchUp":{"x":1136,"y":741,"width":281,"height":325}}}};

/** Presentation milestones only. The engine's quantities and effects are untouched. */
export function buildingDevelopment(card={}){
 const n=Math.max(0,Number(card.owned)||0),first=card.id==='hive'?5:3,last=card.id==='hive'?15:10;
 const tier=n>=last?3:n>=first||(n>0&&card.stage>0)?2:1;
 return {tier,expanded:tier>1,next:tier===3?null:tier===2?last:first};
}
const developmentFamilies={
 home:['hut','logHouse','mansion'],flowers:['hive','pasture','unicornPasture','brewery'],
 timber:['lumberMill'],store:['barn','warehouse','harbor','tradepost','zebraOutpost'],
 study:['library','academy','observatory','biolab'],work:['workshop','factory','smelter','steamworks','mint','zebraWorkshop','zebraForge'],
 stone:['mine','quarry','calciner','oilWell'],water:['aqueduct','hydroPlant'],
 power:['magneto','reactor','accelerator','aiCore','dataCenter','solarFarm'],
 gathering:['amphitheatre','broadcastTower'],shrine:['temple','chapel','ziggurat','ivoryTemple'],
 stars:['spaceport','chronosphere','stasisPod']
};
const stageFamily={pasture:'power',aqueduct:'water',library:'power',amphitheatre:'gathering',warehouse:'stars'};
function developmentFamily(card){return card.stage&&stageFamily[card.id]||Object.keys(developmentFamilies).find(k=>developmentFamilies[k].includes(card.id))||(card.section==='space'||card.section==='time'?'stars':'home');}
// Each little facility is an original contour drawing, sharing the book palette.
// Kept separate from the building sprite so the landmark never shifts or pulses.
const motifs={
 garden:'<path fill="#abc58d" d="M3 27q4-10 14-8 13-6 19 7l-2 8H5z"/><path d="M12 27v-9m0 4-5-4m5 1 5-5M27 28V15m0 8 6-5"/><circle fill="#edce7c" cx="12" cy="14" r="4"/><circle fill="#fff7df" cx="27" cy="12" r="5"/>',
 fence:'<path fill="#dbb984" d="M4 10h5v25H4zm26 0h5v25h-5z"/><path fill="#edcf9b" d="M2 16h35v5H2zm0 11h35v5H2z"/>',
 hive:'<path fill="#e6c385" d="M6 16h27v18H6zM3 15l17-9 16 9z"/><path d="M7 23h25m-20 5h7"/><path fill="#637054" d="M21 29h7v5h-7z"/>',
 bench:'<path fill="#d8b982" d="M3 22h33v5H3zm2-12h29v8H5z"/><path d="M7 27v8m25-8v8M9 18v4m21-4v4"/>',
 logs:'<path fill="#c8a16d" d="m3 23 22-8 10 8-23 9zm2-10L24 6l10 8-23 8z"/><ellipse fill="#eed6a5" cx="10" cy="27" rx="7" ry="6"/><ellipse fill="#eed6a5" cx="11" cy="17" rx="7" ry="6"/><path d="M8 25q5-3 5 3M9 15q4-2 4 3"/>',
 cart:'<path fill="#d9b780" d="M4 13h28l-3 16H8z"/><path d="M12 13V8m9 5V6m8 7v-3m3 11 6-3"/><circle fill="#ead9b2" cx="10" cy="32" r="4"/><circle fill="#ead9b2" cx="28" cy="32" r="4"/>',
 crates:'<path fill="#e5c996" d="M3 20h17v16H3zm17-8h16v24H20z"/><path d="m4 21 15 14m0-14L4 35m17-22 14 22m0-22L21 35M20 23h16"/>',
 books:'<path fill="#c5d3ae" d="M3 27h31v6H3z"/><path fill="#f4d282" d="M6 20h27v7H6z"/><path fill="#fff9e9" d="M5 6q8-2 14 3 6-5 14-3v14q-8-2-14 3-6-5-14-3z"/><path d="M19 9v14M9 11l6 2m8 0 6-2"/>',
 desk:'<path fill="#e2c99b" d="M2 18h35v6H2z"/><path d="M7 24v12m25-12v12"/><path fill="#fff8e8" d="m7 10 12 2-2 6-12-2z"/><path fill="#c0d4bd" d="M26 7h6v11h-6z"/>',
 tools:'<path fill="#cdd6bd" d="M5 20h27v15H5z"/><path d="M10 20V9m-4 0h9M22 21 30 8m-3-2 6 4M11 28h14"/><path fill="#d4ad79" d="M3 19h31v5H3z"/>',
 stones:'<path fill="#c3c9b6" d="m1 30 5-12 12-2 6 15zm16 2 6-15 10 5 5 11zM9 16l5-9 10 2 3 10-9 3z"/><path d="m7 24 5-2m14 4 5 2"/>',
 trough:'<path fill="#e2cea0" d="M3 20h34l-5 14H8z"/><path fill="#accfcb" d="M5 21h30l-2 5H7z"/><path d="M10 11v7m0-7q0-8 8-8h8v7"/>',
 panel:'<path fill="#b2c9c0" d="m7 9 25 2 5 19-31-2z"/><path d="m19 11 1 17M8 19l26 2M14 29l-2 7m15-6 3 6"/>',
 lamp:'<path d="M19 34V10m-5 24h10"/><path fill="#f2d486" d="M12 7h14l-2 12H14z"/><path fill="#e1c797" d="m10 7 9-5 9 5z"/>',
 pennants:'<path d="M4 36V8m31 28V8M4 9q15 8 31 0"/><path fill="#efd083" d="m6 11 4 8 5-5zm15 3 5 5 5-8z"/>',
 shrine:'<path fill="#d4d9c3" d="M5 30h29v6H5zM9 24h21v6H9z"/><path fill="#e8c77b" d="m20 3 4 9 9 2-7 6 1 9-8-5-8 4 2-9-6-6 9-1z"/>',
 dish:'<path fill="#e4eadb" d="M6 9q-1 21 22 20z"/><path d="m15 20 16-13M19 28l-5 8m5-8 7 8M9 36h22"/><circle fill="#f0d286" cx="32" cy="6" r="3"/>',
 planters:'<path fill="#d8bd8d" d="M4 23h12l-2 12H6zm20 0h12l-2 12H26z"/><path d="M10 23V10m20 13V10"/><path fill="#abc58d" d="M10 19Q0 17 4 10q7 0 6 9m0-5q0-10 8-8 2 7-8 8M30 18q-9-2-7-8 8 0 7 8m0-3q0-9 7-9 3 7-7 9"/>'
};
const familyMotifs={home:['garden','fence'],flowers:['garden','hive'],timber:['logs','cart'],store:['crates','cart'],study:['books','desk'],work:['tools','cart'],stone:['stones','cart'],water:['trough','garden'],power:['panel','tools'],gathering:['bench','pennants'],shrine:['planters','shrine'],stars:['dish','panel']};
function motif(key,x,y){return `<g data-lot-detail="${key}" transform="translate(${x} ${y})">${motifs[key]}</g>`;}
export function buildingSurroundings(card={}){
 if(!(card.owned>0))return '';
 const growth=buildingDevelopment(card);if(growth.tier<2)return '';
 const family=developmentFamily(card),[left,right]=familyMotifs[family];
 return `<span class="building-surroundings" data-development="${growth.tier}" data-lot-family="${family}" aria-hidden="true"><svg viewBox="0 0 200 150" focusable="false" aria-hidden="true" fill="none" stroke="#414936" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"><path class="lot-clearing" fill="#d4dfb4" stroke="none" d="M5 109q13-20 51-11 32-7 59-2 39-9 77 10l-4 16q-49 12-91 6-63 11-89-5z"/><path class="lot-path" stroke="#ead3a5" stroke-width="10" d="m98 112 1 14 6 9"/>${motif(left,4,79)}${growth.tier===3?motif(right,158,83)+motif(family==='stars'||family==='power'?'lamp':'planters',143,43):''}</svg></span>`;
}
