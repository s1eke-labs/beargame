/** Independent equations for environmental and industrial effects. */
import {limitedDR} from './math.js';
export function pollutionEffects(pollution) {
 const p=Math.max(0,pollution),level=p>0?Math.max(0,Math.floor(Math.log10(p/1e6))):0;
 let honeyRatio=0,happiness=0,arrivalDivisor=0,solarReduction=0;
 if(level===0)honeyRatio=p<5e6?0:-.2*(p-5e6)/5e6;
 else if(level===1){honeyRatio=-.2-(p-1e7)*.05/1e8;happiness=p<5e7?0:-3.2e-7*(p-5e7);}
 else {
  honeyRatio=limitedDR(-.5-.1*Math.log(p),10)/10;
  happiness=-(level===2?1.08:level===3?1.18:1.2)*Math.log(p);
  arrivalDivisor=level===2?(p<5e8?0:1+1.68e-8*(p-5e8)):(level===3?1.11:1.2)*Math.log10(p);
  if(level>=4)solarReduction=Math.min(1e-10*(p-1e10)/9,1);
 }
 return {level,honeyRatio:Math.max(-.75,honeyRatio),happiness,arrivalDivisor,solarReduction};
}
export function energyDeficit(supply,demand,completedEnergyChallenge=false,activeEnergyChallenge=false){
 if(demand<=supply)return 1;
 const ratio=Math.max(.25,demand>0?supply/demand:1);
 return completedEnergyChallenge&&!activeEnergyChallenge?(1+ratio)/2:ratio;
}
export function pollutionRate(pollution,gross,clean,polluting,emissionRatio=0,cleanup=0,noDissipation=false){
 const cleanFraction=clean+polluting>0?clean/(clean+polluting):0;
 return gross*(1-.5*cleanFraction)*(1+emissionRatio)+cleanup-(noDissipation?0:pollution*1e-7);
}
