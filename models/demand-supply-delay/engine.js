/* System Dynamics Lab — explicit transcription of uploaded Vensim equations.
   Source: Demand and Supply+Lookup+Delay(1).mdl.
   Integration: Euler; DT=.125, INITIAL TIME=0, FINAL TIME=20.
   Lookup: linear interpolation with Vensim-style endpoint hold.
   No other Vensim functionality is claimed or implied. */
(function(root){
'use strict';
const DT=.125, FINAL=20;
const LOOKUP=[[.1,-.5],[.5,-.4],[1,0],[1.5,.7],[2,1]];
const DEFAULTS={demandSlope:10,supplySlope:30,delay:2,initialPrice:5,initialCapacity:100,lookup:LOOKUP.map(a=>a.slice())};
const clone=a=>JSON.parse(JSON.stringify(a));
function lookup(x,points){
 if(!Number.isFinite(x))throw Error('Lookup input is non-finite.');
 if(x<=points[0][0])return points[0][1];
 if(x>=points[points.length-1][0])return points[points.length-1][1];
 for(let i=1;i<points.length;i++)if(x<=points[i][0]){const [xa,ya]=points[i-1],[xb,yb]=points[i];return ya+(x-xa)*(yb-ya)/(xb-xa)}
 throw Error('Interpolation failed');
}
const LIMITS={demandSlope:[.5,40],supplySlope:[1,80],delay:[.25,12],initialPrice:[.5,50],initialCapacity:[1,800]};
function validate(p){for(const [k,[lo,hi]] of Object.entries(LIMITS))if(!Number.isFinite(p[k])||p[k]<lo||p[k]>hi)throw Error(`${k} must be in [${lo}, ${hi}]`);
 if(!Array.isArray(p.lookup)||p.lookup.length!==5||p.lookup.some((xy,i)=>!Array.isArray(xy)||xy.length!==2||!xy.every(Number.isFinite)||(i>0&&xy[0]<=p.lookup[i-1][0])||xy[1]<-1||xy[1]>1.5))throw Error('Lookup points must have increasing x and y between -1 and 1.5.');
}
function equations(p,price,capacity){
 const demand=1000-p.demandSlope*price;
 const supply=capacity;
 const ratio=demand/supply;
 const effect=lookup(ratio,p.lookup);
 const desired=p.supplySlope*price;
 const dPrice=effect*price;
 const dCapacity=(desired-capacity)/p.delay;
 return {Price:price,Capacity:capacity,Demand:demand,Supply:supply,'Demand To Supply Ratio':ratio,F:effect,Effect:effect,'Desired Supply':desired,'Change in Price':dPrice,'Change in Capacity':dCapacity,'Demand Slope':p.demandSlope,'Supply Slope':p.supplySlope,Delay:p.delay};
}
function simulate(overrides={}){
 const p={...clone(DEFAULTS),...clone(overrides)};validate(p);
 const rows=[];let price=p.initialPrice,capacity=p.initialCapacity;
 const warnings={lookupOutside:0,negativeDemand:0};
 for(let i=0;i<=Math.round(FINAL/DT);i++){
  let row={t:Number((i*DT).toFixed(9)),...equations(p,price,capacity)};
  if(Object.values(row).some(v=>!Number.isFinite(v)))throw Error(`The model diverged at t=${row.t}.`);
  if(row['Demand To Supply Ratio']<p.lookup[0][0]||row['Demand To Supply Ratio']>p.lookup.at(-1)[0])warnings.lookupOutside++;
  if(row.Demand<0)warnings.negativeDemand++;
  rows.push(row);
  if(i<FINAL/DT){const nextPrice=price+DT*row['Change in Price'];const nextCapacity=capacity+DT*row['Change in Capacity'];price=nextPrice;capacity=nextCapacity;}
 }
 return {rows,params:p,warnings};
}
function at(run,time){return run.rows[Math.max(0,Math.min(run.rows.length-1,Math.round(time/DT)))]}
function theoreticalEquilibrium(p){const price=1000/(p.demandSlope+p.supplySlope);return{price,capacity:p.supplySlope*price,lookupAtOne:lookup(1,p.lookup)}}
const api={DT,FINAL,DEFAULTS,LIMITS,LOOKUP,lookup,validate,equations,simulate,at,theoreticalEquilibrium,clone};
root.SDExplorerEngine=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
