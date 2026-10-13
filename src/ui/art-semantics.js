/** Illustrations describe the subject, never silently substitute buildings or bears. */
export function researchSubject(c={}){
 const exact={calendar:'seasons',agriculture:'agriculture',archery:'hunting',mining:'mining',metal:'metallurgy',animal:'husbandry',civil:'society',math:'mathematics',construction:'construction',engineering:'hydraulics',currency:'currency',writing:'writing',philosophy:'philosophy',theology:'philosophy',machinery:'machinery',chemistry:'chemistry',astronomy:'astronomy',navigation:'navigation',electricity:'electricity',industrialization:'industry',electronics:'computing',rocketry:'space',sattelites:'astronomy',orbitalEngineering:'space',chronophysics:'time'};
 if(exact[c.id])return exact[c.id];const q=(c.id+' '+c.name+' '+(c.description||'')).toLowerCase();
 const patterns=[[/chrono|temporal|tachyon|void|paradox|时间|时序|虚空/,'time'],[/space|rocket|orbital|satellite|sattelite|远航|火箭|太空|星际/,'space'],[/nuclear|fission|fusion|thorium|uranium|antimatter|核|反物质/,'nuclear'],[/computer|electronic|microchip|neural|ai |quantum|计算|芯片|智能/,'computing'],[/biology|ecology|genetic|bio|hydroponic|生物|基因|生态/,'biology'],[/electric|energy|solar|magnet|电|能源/,'electricity'],[/geology|mining|drill|quarry|石|矿|地质/,'mining'],[/metal|steel|smelt|alloy|iron|冶|金属|铁|钢/,'metallurgy'],[/chemical|chemistry|oil|kerosene|fuel|化学|石油|燃料/,'chemistry'],[/hydraulic|aqueduct|water|水利|水渠/,'hydraulics'],[/astronomy|star|telescope|天文|星图|观测/,'astronomy'],[/navigation|ship|harbor|sail|航海|船/,'navigation'],[/currency|trade|gold|econom|货币|交易|经济/,'currency'],[/agri|honey|catnip|pasture|蜂|花圃|种植|农/,'agriculture'],[/hunt|archer|bow|猎|弓/,'hunting'],[/animal|unicorn|alicorn|zebra|鹿|兽|驯/,'husbandry'],[/codex|writing|paper|manuscript|文字|手稿|纸/,'writing'],[/math|ratio|numer|abacus|数学|数量|比例/,'mathematics'],[/construct|architect|concrete|housing|hut|wood|beam|房|建筑|木/,'construction'],[/machine|gear|automation|pneumatic|mechan|齿轮|机械|自动/,'machinery'],[/industry|factory|steam|工业|蒸汽/,'industry'],[/philosophy|theology|faith|religion|神|祈|哲|信仰/,'philosophy'],[/season|calendar|winter|历|季|冬/,'seasons']];
 return patterns.find(([re])=>re.test(q))?.[1]||'society';
}
const SPACE={spaceElevator:'construction',sattelite:'astronomy',orbitalArray:'astronomy',spaceStation:'society',moonBase:'society',moonOutpost:'mining',planetCracker:'mining',moltenCore:'mining',hydrofracturer:'hydraulics',spiceRefinery:'chemistry',researchVessel:'navigation',sunlifter:'electricity',hrHarvester:'electricity',tectonic:'electricity',heatsink:'hydraulics',sunforge:'metallurgy',cryoStation:'construction',cryostation:'construction',spaceBeacon:'navigation',terraformingStation:'biology',hydroponics:'agriculture',entangler:'computing'};
const TIME={blastFurnace:'metallurgy',timeBoiler:'industry',ressourceRetrieval:'mining',temporalPress:'machinery',cryochambers:'biology'};
const CHALLENGES={ironWill:'hunting',winterIsComing:'seasons',anarchy:'society',energy:'electricity',atheism:'philosophy','1000Years':'time',blackSky:'astronomy',pacifism:'husbandry',postApocalypse:'biology'};
export function illustrationFor(c={},section=''){
 const resource=id=>({kind:'resource',id}),subject=id=>({kind:'research',id});
 if(section==='science'||section==='workshop')return subject(researchSubject(c));
 if(section==='policies')return subject(researchSubject({...c,description:''}));
 if(section==='space')return c.id==='containmentChamber'?resource('antimatter'):subject(SPACE[c.id]||'space');
 if(section==='time')return c.id==='temporalBattery'?resource('temporalFlux'):/void/i.test(c.id)?resource('void'):subject(TIME[c.id]||'time');
 if(section==='challenges')return c.id==='unicornTears'?resource('tears'):subject(CHALLENGES[c.id]||'time');
 if(section==='metaphysics'){
  if(['malkuth','yesod','hod','netzach','tiferet','gevurah','chesed','binah','chokhmah','keter'].includes(c.id))return resource('paragon');
  const refs={megalomania:'relic',unicornmancy:'unicorns',alicornmancy:'alicorn',voidOrder:'void'};if(refs[c.id])return resource(refs[c.id]);
  const exact={engeneering:'construction',codexAgrum:'agriculture',renaissance:'biology',ascoh:'mathematics',astromancy:'astronomy',chronomancy:'time',anachronomancy:'time',navigationDiplomacy:'navigation',adjustmentBureau:'navigation'};
  return subject(exact[c.id]||(/codex/i.test(c.id)?'writing':/ratio|proportion|vitruvian|numero/i.test(c.id)?'mathematics':'society'));
 }
 if(['trades','embassies','diplomacy','leadership'].includes(section))return subject(c.type==='embassy'?'society':'navigation');
 if(section==='crafts')return resource(c.output||c.id);
 if(section==='faith')return /tear|unicorn/i.test(c.id)?resource('tears'):/sun/i.test(c.id)?subject('astronomy'):subject('philosophy');
 const type=c.type||'',types={hunt:'hunting',explore:'navigation',observe:'astronomy',festival:'society',challengeStart:'hunting',reclaimReserves:'construction',buyBlackcoin:'currency',sellBlackcoin:'currency',crashBlackcoin:'currency',adore:'philosophy',transcend:'philosophy',praise:'philosophy',accelerate:'time',toggleTemporalPress:'time',shatter:'time',useFurnaceHeat:'metallurgy',toggleFurnace:'metallurgy',repairCryochamber:'biology'};
 if(types[type])return subject(types[type]);
 if(type==='gather'||type==='sacrifice')return resource(c.id);
 if(type==='openGift')return resource('elderBox');
 if(type==='feedElders'||type==='payPactDebt')return resource('necrocorn');
 if(type==='burnParagon')return resource('burnedParagon');
 if(type==='automation')return subject(({oilWell:'hydraulics',biolab:'biology',factory:'industry',steamworks:'industry',calciner:'metallurgy',reactor:'nuclear',warehouse:'space',ivoryTemple:'machinery'})[c.id]||'machinery');
 if(type==='refine'||type==='craft')return resource(c.output||c.id);
 if(type==='embassy')return subject('society');
 if(section==='gifts')return resource('elderBox');
 return subject(researchSubject(c));
}
