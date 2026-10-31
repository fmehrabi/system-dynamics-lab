(function(){
'use strict';
const E=window.SDExplorerEngine;
const $=s=>document.querySelector(s);
const $$=s=>Array.from(document.querySelectorAll(s));
const fmt=(n,k=2)=>Number.isFinite(n)?new Intl.NumberFormat('en-US',{maximumFractionDigits:k}).format(n):'—';
const clamp=(x,a,b)=>Math.min(b,Math.max(a,x));
const fields=[
 {key:'demandSlope',label:'Demand Slope',detail:'Demand sensitivity to price',min:.5,max:40,step:.5,unit:''},
 {key:'supplySlope',label:'Supply Slope',detail:'Desired supply per unit of price',min:1,max:80,step:1,unit:''},
 {key:'delay',label:'Delay',detail:'Capacity adjustment time',min:.25,max:12,step:.25,unit:'mo'},
 {key:'initialPrice',label:'Initial Price',detail:'Price stock at t = 0',min:.5,max:50,step:.5,unit:''},
 {key:'initialCapacity',label:'Initial Capacity',detail:'Capacity stock at t = 0',min:1,max:800,step:1,unit:''}
];
const vars={
 'Price':{type:'Stock',equation:'Price = INTEG(Change in Price, 5)',detail:'Market price accumulates the change induced by the lookup-driven effect.',editor:'initialPrice'},
 'Capacity':{type:'Stock',equation:'Capacity = INTEG(Change in Capacity, 100)',detail:'Supply capacity adjusts over time toward the desired level.',editor:'initialCapacity'},
 'Demand':{type:'Auxiliary',equation:'Demand = 1000 − Demand Slope × Price',detail:'Price-sensitive demand. The intercept 1000 is fixed in the source model.'},
 'Supply':{type:'Auxiliary',equation:'Supply = Capacity',detail:'Actual supply equals the Capacity stock.'},
 'Desired Supply':{type:'Auxiliary',equation:'Desired Supply = Supply Slope × Price',detail:'Target supply level implied by the current price.'},
 'Change in Price':{type:'Rate / flow',equation:'Change in Price = Effect × Price',detail:'Rate of change feeding the Price stock.'},
 'Change in Capacity':{type:'Rate / flow',equation:'Change in Capacity = (Desired Supply − Capacity) / Delay',detail:'First-order adjustment from actual to desired supply.'},
 'Demand To Supply Ratio':{type:'Auxiliary',equation:'Demand To Supply Ratio = Demand / Supply',detail:'Relative demand-to-supply signal entering Effect.'},
 'Effect':{type:'Auxiliary',equation:'Effect = F(Demand To Supply Ratio)',detail:'Combines the demand-to-supply ratio with lookup function F to determine the price adjustment effect.'},
 'F':{type:'Graphical lookup',equation:'F([(0,−0.5)–(2,1)], (0.1,−0.5), (0.5,−0.4), (1,0), (1.5,0.7), (2,1))',detail:'Piecewise-linear lookup function used by Effect. Only the y-values are editable.',editor:'lookup'},
 'Demand Slope':{type:'Constant',equation:'Demand Slope = 10',detail:'Parameter in the demand equation.',editor:'demandSlope'},
 'Supply Slope':{type:'Constant',equation:'Supply Slope = 30',detail:'Parameter in the desired supply equation.',editor:'supplySlope'},
 'Delay':{type:'Constant',equation:'Delay = 2',detail:'Positive supply adjustment delay in months.',editor:'delay'}
};
const diagramNodes={
 'Demand Slope':{id:'Demand Slope',kind:'parameter',x:120,y:105,w:150,h:56,valueKey:'demandSlope'},
 'Demand':{id:'Demand',kind:'aux',x:330,y:105,w:140,h:56},
 'Demand To Supply Ratio':{id:'Demand To Supply Ratio',kind:'aux',x:570,y:105,w:220,h:56},
 'F':{id:'F',kind:'lookup',x:810,y:105,w:120,h:56},
 'Effect':{id:'Effect',kind:'aux',x:1000,y:180,w:140,h:56},
 'Price':{id:'Price',kind:'stock',x:540,y:260,w:210,h:82},
 'Change in Price':{id:'Change in Price',kind:'flow',x:770,y:260},
 'Supply':{id:'Supply',kind:'aux',x:310,y:390,w:150,h:56},
 'Capacity':{id:'Capacity',kind:'stock',x:540,y:530,w:210,h:82},
 'Desired Supply':{id:'Desired Supply',kind:'aux',x:860,y:400,w:170,h:56},
 'Supply Slope':{id:'Supply Slope',kind:'parameter',x:1020,y:350,w:140,h:56,valueKey:'supplySlope'},
 'Change in Capacity':{id:'Change in Capacity',kind:'flow',x:750,y:530},
 'Delay':{id:'Delay',kind:'parameter',x:900,y:590,w:120,h:48,valueKey:'delay'}
};
// Causal links follow the equations in the source model. Stock inflows are drawn separately as flow pipes.
const edges=[
 {from:'Demand Slope',to:'Demand',d:'M 195 105 C 215 105 238 105 260 105'},
 {from:'Price',to:'Demand',d:'M 466 219 C 448 183 418 153 382 135'},
 {from:'Demand',to:'Demand To Supply Ratio',d:'M 400 105 C 420 105 440 105 460 105'},
 {from:'Supply',to:'Demand To Supply Ratio',d:'M 310 362 C 310 300 345 240 405 195 C 435 165 460 145 485 133'},
 {from:'Demand To Supply Ratio',to:'Effect',d:'M 680 132 C 735 174 835 207 930 184'},
 {from:'F',to:'Effect',d:'M 870 110 C 910 116 940 135 960 154'},
 {from:'Effect',to:'Change in Price',d:'M 950 208 C 925 248 858 286 790 278'},
 {from:'Price',to:'Change in Price',d:'M 645 286 C 690 318 735 311 760 280'},
 {from:'Price',to:'Desired Supply',d:'M 645 288 C 700 333 745 361 775 390'},
 {from:'Supply Slope',to:'Desired Supply',d:'M 1020 377 C 1005 391 975 400 945 400'},
 {from:'Desired Supply',to:'Change in Capacity',d:'M 860 428 C 835 460 800 480 755 514'},
 {from:'Capacity',to:'Supply',d:'M 435 530 C 400 505 380 465 370 417'},
 {from:'Capacity',to:'Change in Capacity',d:'M 645 554 C 690 584 730 574 750 546'},
 {from:'Delay',to:'Change in Capacity',d:'M 840 590 C 805 580 775 565 758 546'}
];
let state={p:E.clone(E.DEFAULTS),run:null,baseline:E.simulate(),pins:[],selected:'Price',metric:'Price',time:20,all:true,layout:null};
state.run=E.simulate(state.p);
let toastTimer=null;
const escapeHTML=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function toast(s){const el=$('#toast');el.textContent=s;el.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove('show'),2450)}
function getCss(v){return getComputedStyle(document.documentElement).getPropertyValue(v).trim()}
function loadTheme(){let theme='light';try{theme=localStorage.getItem('sdexplorer-theme')||'light'}catch{}document.documentElement.dataset.theme=theme}
function setTheme(){let next=document.documentElement.dataset.theme==='dark'?'light':'dark';document.documentElement.dataset.theme=next;try{localStorage.setItem('sdexplorer-theme',next)}catch{}requestAnimationFrame(renderPlots);makeDiagram()}
function svgNodeLabel(text,x,y,anchor='start',cls='node-label'){
 return `<text class="${cls}" x="${x}" y="${y}" text-anchor="${anchor}">${escapeHTML(text)}</text>`;
}
function nodeHit(n,pad=8){return `<rect class="node-hit" x="${n.x-n.w/2-pad}" y="${n.y-n.h/2-pad}" width="${n.w+pad*2}" height="${n.h+pad*2}" rx="12" fill="transparent"/>`;}
function auxiliaryNode(n,current){
 const x=n.x-n.w/2,y=n.y-n.h/2,label=n.label||n.id,value=current[n.id];
 return `<g class="node node-kind-aux" data-node="${escapeHTML(n.id)}" tabindex="0" role="button" aria-label="Inspect ${escapeHTML(n.id)}">
  ${nodeHit(n)}<rect class="node-outline" x="${x}" y="${y}" width="${n.w}" height="${n.h}" rx="12"/>
  ${svgNodeLabel(label,x+14,y+25,'start','node-label')}
  ${svgNodeLabel('AUXILIARY',x+14,y+44,'start','node-kicker')}
  ${svgNodeLabel(fmt(value,2),x+n.w-13,y+25,'end','node-value')}
 </g>`;
}
function parameterNode(n){
 const x=n.x-n.w/2,y=n.y-n.h/2,value=state.p[n.valueKey],unit=n.valueKey==='delay'?' mo':'';
 return `<g class="node node-kind-parameter" data-node="${escapeHTML(n.id)}" tabindex="0" role="button" aria-label="Inspect ${escapeHTML(n.id)}">
  ${nodeHit(n)}<rect class="node-outline" x="${x}" y="${y}" width="${n.w}" height="${n.h}" rx="13"/>
  ${svgNodeLabel(n.id,x+14,y+25,'start','node-label')}
  ${svgNodeLabel('CONSTANT',x+14,y+44,'start','node-kicker')}
  ${svgNodeLabel(fmt(value,2)+unit,x+n.w-13,y+25,'end','node-value')}
 </g>`;
}
function lookupNode(n){
 const x=n.x-n.w/2,y=n.y-n.h/2;
 return `<g class="node node-kind-lookup" data-node="F" tabindex="0" role="button" aria-label="Inspect lookup function F">
  ${nodeHit(n)}<rect class="node-outline" x="${x}" y="${y}" width="${n.w}" height="${n.h}" rx="13"/>
  ${svgNodeLabel('F',x+12,y+25,'start','node-label')}
  ${svgNodeLabel('LOOKUP',x+12,y+44,'start','node-kicker')}
  <path d="M ${x+50} ${y+41} L ${x+66} ${y+37} L ${x+82} ${y+25} L ${x+98} ${y+17}" fill="none" stroke="#8b75b8" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
  <circle cx="${x+50}" cy="${y+41}" r="2.2" fill="#8b75b8"/><circle cx="${x+98}" cy="${y+17}" r="2.2" fill="#8b75b8"/>
 </g>`;
}
function stockNode(n,current){
 const x=n.x-n.w/2,y=n.y-n.h/2,initial=n.id==='Price'?state.p.initialPrice:state.p.initialCapacity;
 return `<g class="node node-kind-stock" data-node="${escapeHTML(n.id)}" tabindex="0" role="button" aria-label="Inspect ${escapeHTML(n.id)}">
  ${nodeHit(n,9)}<rect class="node-outline" x="${x}" y="${y}" width="${n.w}" height="${n.h}" rx="14"/>
  <rect x="${x+1}" y="${y+12}" width="4" height="${n.h-24}" rx="2" fill="var(--accent)"/>
  ${svgNodeLabel(n.id,x+17,y+31,'start','node-label')}
  ${svgNodeLabel('STOCK',x+17,y+49,'start','node-kicker')}
  ${svgNodeLabel('CURRENT  '+fmt(current[n.id],2)+'   ·   INITIAL  '+fmt(initial,2),x+17,y+68,'start','node-value')}
 </g>`;
}
function cloudMarkup(x,y,cls){
 return `<path class="flow-cloud ${cls}" transform="translate(${x} ${y})" d="M 10 29 C 1 29 -2 22 2 16 C 3 8 12 4 19 8 C 23 -1 35 -2 41 6 C 50 3 58 9 57 18 C 65 20 65 29 56 31 Z"/>`;
}
function valveMarkup(x,y,cls){
 return `<g class="flow-valve ${cls}"><circle class="flow-valve-ring" cx="${x}" cy="${y}" r="12"/><path class="flow-valve-mark" d="M ${x-6} ${y-6} L ${x} ${y} L ${x-6} ${y+6} M ${x+6} ${y-6} L ${x} ${y} L ${x+6} ${y+6}"/></g>`;
}
function priceFlowNode(){
 return `<g class="node node-kind-flow flow-node-price" data-node="Change in Price" tabindex="0" role="button" aria-label="Inspect Change in Price">
  <rect class="node-hit" x="635" y="207" width="330" height="100" rx="12" fill="transparent"/>
  <path class="flow-pipe" d="M 900 260 H 645" marker-end="url(#priceFlowArrow)"/>
  <path class="flow-pipe-highlight" d="M 895 257 H 654"/>
  ${cloudMarkup(890,238,'price-cloud')}
  ${valveMarkup(770,260,'price-valve')}
  <rect class="flow-pill" x="690" y="213" width="160" height="34" rx="9"/>
  ${svgNodeLabel('Change in Price',702,226,'start','flow-pill-label')}
  ${svgNodeLabel('RATE / FLOW',702,240,'start','flow-pill-kicker')}
 </g>`;
}
function capacityFlowNode(){
 return `<g class="node node-kind-flow flow-node-capacity" data-node="Change in Capacity" tabindex="0" role="button" aria-label="Inspect Change in Capacity">
  <rect class="node-hit" x="635" y="477" width="300" height="112" rx="12" fill="transparent"/>
  <path class="flow-pipe" d="M 850 530 H 645" marker-end="url(#capacityFlowArrow)"/>
  <path class="flow-pipe-highlight" d="M 845 527 H 654"/>
  ${cloudMarkup(840,508,'capacity-cloud')}
  ${valveMarkup(750,530,'capacity-valve')}
  <rect class="flow-pill" x="665" y="481" width="174" height="34" rx="9"/>
  ${svgNodeLabel('Change in Capacity',677,494,'start','flow-pill-label')}
  ${svgNodeLabel('RATE / FLOW',677,508,'start','flow-pill-kicker')}
 </g>`;
}
function causalEdges(){
 return edges.map((e,i)=>`<path class="diagram-edge" data-edge="${i}" data-kind="causal" data-from="${escapeHTML(e.from)}" data-to="${escapeHTML(e.to)}" d="${e.d}" marker-end="url(#causalArrow)"/>`).join('');
}
function makeDiagram(){
 const svg=$('#structureDiagram');
 const current=E.at(state.run,state.time);
 const defs=`<defs>
  <marker id="causalArrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto" markerUnits="strokeWidth"><path d="M 0 0 L 8 4 L 0 8 Z" fill="var(--diagram-causal)"/></marker>
  <marker id="priceFlowArrow" markerWidth="9" markerHeight="9" refX="8" refY="4.5" orient="auto" markerUnits="strokeWidth"><path d="M 0 0 L 9 4.5 L 0 9 Z" fill="var(--diagram-price-flow)"/></marker>
  <marker id="capacityFlowArrow" markerWidth="9" markerHeight="9" refX="8" refY="4.5" orient="auto" markerUnits="strokeWidth"><path d="M 0 0 L 9 4.5 L 0 9 Z" fill="var(--diagram-capacity-flow)"/></marker>
 </defs>`;
 const lanes=`<g class="diagram-lanes">
  <rect class="diagram-lane" x="20" y="24" width="1080" height="286" rx="17"/>
  <rect class="diagram-lane-accent" x="20" y="24" width="4" height="286" rx="2"/>
  <text class="diagram-lane-label" x="42" y="49">PRICE / DEMAND FEEDBACK</text>
  <rect class="diagram-lane" x="20" y="330" width="1080" height="300" rx="17"/>
  <rect class="diagram-lane-accent" x="20" y="330" width="4" height="300" rx="2"/>
  <text class="diagram-lane-label" x="42" y="355">CAPACITY ADJUSTMENT</text>
 </g>`;
 const nodes=Object.values(diagramNodes).map(n=>{
  if(n.kind==='stock')return stockNode(n,current);
  if(n.kind==='parameter')return parameterNode(n);
  if(n.kind==='lookup')return lookupNode(n);
  if(n.kind==='aux')return auxiliaryNode(n,current);
  return '';
 }).join('');
 svg.innerHTML=defs+lanes+causalEdges()+priceFlowNode()+capacityFlowNode()+nodes;
 $$('[data-node]').forEach(el=>{
  el.addEventListener('click',()=>select(el.dataset.node));
  el.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();select(el.dataset.node)}});
 });
 select(state.selected);
}
function select(id){
 state.selected=id;
 const connected=new Set([id]);
 edges.forEach(e=>{if(e.from===id||e.to===id){connected.add(e.from);connected.add(e.to)}});
 $$('[data-node]').forEach(n=>{const own=n.dataset.node===id;n.classList.toggle('selected',own);n.classList.toggle('dim',!state.all&&!connected.has(n.dataset.node))});
 $$('.diagram-edge').forEach(e=>{const has=e.dataset.from===id||e.dataset.to===id;e.classList.toggle('dim',!state.all&&!has);e.classList.toggle('hot',has)});
 renderInspector();
}
function renderInspector(){const id=state.selected,v=vars[id],current=E.at(state.run,state.time);let val=current[id];const editor=v.editor,editable=Boolean(editor);
 $('#inspectType').textContent=v.type.toUpperCase();
 let editText=editor==='lookup'?'Edit lookup F ↘':editor?'Edit '+(editor==='initialPrice'||editor==='initialCapacity'?'initial value':'parameter')+' ↘':'';
 $('#inspector').innerHTML=`<div class="inspect-first"><h3>${escapeHTML(id)}</h3><div class="inspect-number">${fmt(val,3)}</div></div><div class="inspect-description">${escapeHTML(v.detail)}</div><div class="equation">${escapeHTML(v.equation)}</div><div class="inspector-foot">VALUE AT MONTH ${fmt(state.time,2)} · ${editable?'<button type="button" class="inspect-link" id="jumpEditor">'+escapeHTML(editText)+'</button>':'Read-only calculated variable'}</div>`;
 const jump=$('#jumpEditor');if(jump)jump.onclick=()=>{const el=editor==='lookup'?$('#lookup'):$(`[data-control="${editor}"]`);if(el){el.scrollIntoView({behavior:'smooth',block:'center'});setTimeout(()=>el.querySelector('input[type=range],input[type=number]')?.focus({preventScroll:true}),400)}};
}
function renderControls(){const groups={constants:fields.slice(0,3),stocks:fields.slice(3)};
 for(const [name,group] of Object.entries(groups)){
 const el=name==='constants'?$('#constControls'):$('#stockControls');el.innerHTML=group.map(f=>`<div class="control-item" data-control="${f.key}"><div class="control-top"><label class="control-label" for="number-${f.key}"><strong>${escapeHTML(f.label)}</strong><small>${escapeHTML(f.detail)}</small></label><div class="number-wrap"><input type="number" id="number-${f.key}" data-input="${f.key}" min="${f.min}" max="${f.max}" step="${f.step}" value="${state.p[f.key]}" aria-label="Set ${escapeHTML(f.label)}"><small>${f.unit||' '}</small></div></div><input type="range" aria-label="Adjust ${escapeHTML(f.label)}" data-range="${f.key}" min="${f.min}" max="${f.max}" step="${f.step}" value="${state.p[f.key]}"><div class="range-minmax"><span>${f.min}</span><span>${f.max}</span></div></div>`).join('');
 }
 $$('[data-range]').forEach(input=>input.addEventListener('input',()=>setField(input.dataset.range,Number(input.value),'range')));
 $$('[data-input]').forEach(input=>{input.addEventListener('change',()=>{const x=Number(input.value);if(input.value.trim()===''||!Number.isFinite(x)){input.value=state.p[input.dataset.input];return}setField(input.dataset.input,x,'number')});input.addEventListener('keydown',e=>{if(e.key==='Enter')input.blur()})});
}
function setField(key,val){const f=fields.find(f=>f.key===key);if(!f)return;if(val<f.min||val>f.max){toast(`${f.label} must be between ${f.min} and ${f.max}`);syncInputs(key);return}let p={...state.p,[key]:val};if(!replaceRun(p))return;syncInputs(key);}
function syncInputs(key){$(`[data-input="${key}"]`).value=state.p[key];$(`[data-range="${key}"]`).value=state.p[key]}
function replaceRun(p,redrawLookup=false){try{const run=E.simulate(p);state.p=p;state.run=run;refresh();if(redrawLookup)drawLookup();updateUrl();return true}catch(e){toast(e.message);return false}}
function renderKpi(){const end=state.run.rows.at(-1);const b=state.baseline.rows.at(-1);
 const keys=[['Price','FINAL PRICE',end.Price,b.Price],['Capacity','FINAL CAPACITY',end.Capacity,b.Capacity],['Demand','FINAL DEMAND',end.Demand,b.Demand]];
 $('#kpiRow').innerHTML=keys.map(([key,label,num,ref])=>`<div class="kpi"><span>${label}</span><b>${fmt(num,1)}</b><small>${num-ref>=0?'+':''}${fmt(num-ref,1)} vs. original</small></div>`).join('');}
function drawCanvas(id,series,cursor=false){const canvas=$(id);if(!canvas)return;let width=canvas.getBoundingClientRect().width||500,height=canvas.getBoundingClientRect().height||220;if(width<10)return;
 let dpr=window.devicePixelRatio||1;canvas.width=Math.floor(width*dpr);canvas.height=Math.floor(height*dpr);const ctx=canvas.getContext('2d');ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,width,height);
 const left=53,right=15,top=18,bottom=28,pw=width-left-right,ph=height-top-bottom;
 let all=series.flatMap(s=>s.rows.map(r=>r[s.key])).filter(Number.isFinite);if(!all.length)return;
 let lo=Math.min(...all),hi=Math.max(...all);let pad=(hi-lo)||Math.max(1,Math.abs(hi)*.05);lo-=pad*.12;hi+=pad*.12;
 const x=t=>left+(t/E.FINAL)*pw,y=v=>top+(hi-v)/(hi-lo)*ph;
 ctx.font='10px Inter, Arial, sans-serif';ctx.strokeStyle=getCss('--chart-grid');ctx.lineWidth=1;ctx.fillStyle=getCss('--text-muted');
 for(let i=0;i<=4;i++){let yy=top+ph*i/4;ctx.beginPath();ctx.moveTo(left,yy);ctx.lineTo(width-right,yy);ctx.stroke();ctx.textAlign='right';ctx.textBaseline='middle';ctx.fillText(fmt(hi-(hi-lo)*i/4,1),left-8,yy)}
 for(let i=0;i<=4;i++){let t=E.FINAL*i/4;let xx=x(t);ctx.textAlign='center';ctx.textBaseline='top';ctx.fillText(String(t),xx,height-bottom+8)}
 for(const s of series){ctx.beginPath();ctx.strokeStyle=s.color;ctx.lineWidth=s.width||2;ctx.lineJoin='round';ctx.setLineDash(s.dash||[]);s.rows.forEach((r,i)=>{let xx=x(r.t),yy=y(r[s.key]);if(i===0)ctx.moveTo(xx,yy);else ctx.lineTo(xx,yy)});ctx.stroke();ctx.setLineDash([])}
 if(cursor){let t=state.time,xx=x(t);ctx.strokeStyle=getCss('--accent');ctx.globalAlpha=.35;ctx.setLineDash([4,4]);ctx.beginPath();ctx.moveTo(xx,top);ctx.lineTo(xx,top+ph);ctx.stroke();ctx.setLineDash([]);ctx.globalAlpha=1;
 const v=E.at(state.run,t)[state.metric];ctx.fillStyle=getCss('--surface');ctx.strokeStyle=getCss('--accent');ctx.lineWidth=2;ctx.beginPath();ctx.arc(xx,y(v),3.8,0,Math.PI*2);ctx.fill();ctx.stroke()}
 return{x,y,left,right,top,bottom,pw,ph,width,height};
}
function renderPlots(){const key=state.metric;let series=[{rows:state.baseline.rows,key,color:getCss('--muted-ink'),dash:[6,5],width:1.7}];state.pins.forEach((p,i)=>series.push({rows:p.run.rows,key,color:['#8b5fbf','#2f855a','#c67a2b'][i],dash:[4,3],width:1.8}));series.push({rows:state.run.rows,key,color:getCss('--accent'),width:2.8});state.layout=drawCanvas('#pricePlot',series,true);
 drawCanvas('#relatedPlot',['Demand','Supply','Desired Supply'].map((key,i)=>({rows:state.run.rows,key,color:['#1f77b4','#2f855a','#8b5fbf'][i],width:1.9})))}
function renderTime(){const r=E.at(state.run,state.time);$('#timeReadout').textContent=fmt(state.time,2)+' mo';$('#timeValues').innerHTML=[['Price',r.Price],['Capacity',r.Capacity],['Demand / Supply',r['Demand To Supply Ratio']]].map(([k,v])=>`<div>${escapeHTML(k)}<b>${fmt(v,2)}</b></div>`).join('');$('#timeSlider').value=state.time;renderInspector()}
function renderWarnings(){const w=state.run.warnings,items=[];if(w.lookupOutside)items.push(`Lookup evaluated outside its original point range in ${w.lookupOutside} of ${state.run.rows.length} saved time steps; endpoint values were held.`);if(w.negativeDemand)items.push(`Demand becomes negative for ${w.negativeDemand} saved time steps. The source model contains no floor at zero.`);$('#modelWarnings').hidden=!items.length;$('#modelWarnings').textContent=items.join(' ')}
function refresh(){renderKpi();renderTime();renderPlots();renderWarnings();renderScenario();makeDiagram();}
function drawLookup(){const svg=$('#lookupGraph'),pts=state.p.lookup;
 const L=48,R=622,T=24,B=220,X=x=>L+(x-.1)/1.9*(R-L),Y=y=>B-(y+1)/2.5*(B-T);
 let lines='';for(let i=0;i<=5;i++){let y=-1+i*.5,yy=Y(y);lines+=`<line x1="${L}" y1="${yy}" x2="${R}" y2="${yy}" stroke="var(--chart-grid)"/><text x="${L-10}" y="${yy+4}" text-anchor="end" font-size="11" fill="var(--text-muted)">${fmt(y,1)}</text>`}for(const x of [.1,.5,1,1.5,2]){let xx=X(x);lines+=`<line x1="${xx}" y1="${T}" x2="${xx}" y2="${B}" stroke="var(--chart-grid)"/><text x="${xx}" y="${B+18}" font-size="11" text-anchor="middle" fill="var(--text-muted)">${x}</text>`}
 svg.innerHTML=lines+`<line x1="${L}" y1="${Y(0)}" x2="${R}" y2="${Y(0)}" stroke="var(--text-muted)" stroke-width="1.1"/>`+`<path class="curve" d="${pts.map((a,i)=>(i?'L':'M')+X(a[0])+' '+Y(a[1])).join(' ')}" fill="none" stroke="var(--accent)" stroke-width="3.2" stroke-linecap="round"/>`+pts.map((p,i)=>`<circle class="lookup-dot" data-pt="${i}" cx="${X(p[0])}" cy="${Y(p[1])}" r="8.5" stroke="var(--accent)" stroke-width="2.5" fill="var(--surface)"/>`).join('')+`<text x="${R}" y="262" font-size="10" text-anchor="end" fill="var(--text-muted)">Demand / Supply Ratio →</text>`;
 $('#lookupInputs').innerHTML=pts.map((p,i)=>`<label>x = ${fmt(p[0],1)}<input aria-label="F lookup output at x=${p[0]}" type="number" min="-1" max="1.5" step=".05" data-ptinput="${i}" value="${p[1]}"></label>`).join('');
 $$('[data-ptinput]').forEach(n=>n.addEventListener('change',()=>{let y=Number(n.value);if(n.value.trim()===''||!Number.isFinite(y)||y< -1||y>1.5){n.value=state.p.lookup[Number(n.dataset.ptinput)][1];toast('Lookup ordinate must be between −1 and 1.5.');return}setLookup(Number(n.dataset.ptinput),y)}));
 let index=null;svg.onpointerdown=e=>{const point=e.target.closest('[data-pt]');if(!point)return;index=Number(point.dataset.pt);svg.setPointerCapture(e.pointerId);e.preventDefault()};svg.onpointermove=e=>{if(index===null)return;const m=svg.getScreenCTM();if(!m)return;const pt=svg.createSVGPoint();pt.x=e.clientX;pt.y=e.clientY;const local=pt.matrixTransform(m.inverse());let y=clamp((B-local.y)/(B-T)*2.5-1,-1,1.5);setLookup(index,Math.round(y*100)/100,true);};svg.onpointerup=svg.onpointercancel=()=>{index=null};
}
function setLookup(i,y,drag=false){let points=state.p.lookup.map(a=>a.slice());points[i][1]=y;if(!replaceRun({...state.p,lookup:points}))return;
 if(drag){const L=48,R=622,T=24,B=220,X=x=>L+(x-.1)/1.9*(R-L),Y=y=>B-(y+1)/2.5*(B-T);let svg=$('#lookupGraph');svg.querySelector('.curve')?.setAttribute('d',points.map((a,j)=>(j?'L':'M')+X(a[0])+' '+Y(a[1])).join(' '));svg.querySelector(`[data-pt="${i}"]`)?.setAttribute('cy',Y(y));$(`[data-ptinput="${i}"]`).value=y;}
 else drawLookup();}
const pinColors=['#8b5fbf','#2f855a','#c67a2b'];
function renderScenario(){let html='<div class="scenario-row"><i class="scenario-dot" style="background:var(--muted-ink)"></i><div class="scenario-label"><strong>Original model</strong><small>Unmodified source parameters</small></div><span class="info-tag">BASELINE</span></div>';
 state.pins.forEach((r,i)=>html+=`<div class="scenario-row"><i class="scenario-dot" style="background:${pinColors[i]}"></i><div class="scenario-label"><strong>${escapeHTML(r.name)}</strong><small>Final price: ${fmt(r.run.rows.at(-1).Price,2)} · Final capacity: ${fmt(r.run.rows.at(-1).Capacity,1)}</small></div><button class="scenario-remove" type="button" data-remove="${i}">Remove ×</button></div>`);
 if(!state.pins.length)html+='<p class="controls-note" style="margin:0;border:0">No saved scenarios yet. Adjust parameters, then pin the current run.</p>';
 $('#scenarioRows').innerHTML=html;$$('[data-remove]').forEach(n=>n.onclick=()=>{state.pins.splice(Number(n.dataset.remove),1);renderScenario();renderPlots()})}
function saveRun(){if(state.pins.length>=3){toast('Maximum three saved scenarios for visual clarity.');return}let i=state.pins.length+1;state.pins.push({name:'Scenario '+i,p:E.clone(state.p),run:E.simulate(state.p)});renderScenario();renderPlots();toast('Scenario '+i+' pinned to the chart.')}
function exportCsv(){let keys=Object.keys(state.run.rows[0]);const rows=[keys.join(',')].concat(state.run.rows.map(r=>keys.map(k=>String(r[k])).join(',')));const blob=new Blob([rows.join('\r\n')],{type:'text/csv;charset=utf-8'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='demand-supply-delay-current-run.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),2500)}
function updateUrl(){try{const payload=encodeURIComponent(JSON.stringify({p:state.p}));history.replaceState(null,'',location.pathname+location.search+'#config='+payload)}catch{}}
function readUrl(){try{let h=location.hash;if(!h.startsWith('#config='))return;const c=JSON.parse(decodeURIComponent(h.slice(8)));if(c&&c.p){state.run=E.simulate(c.p);state.p=state.run.params}}catch{}}
function reset(){state.p=E.clone(E.DEFAULTS);state.run=E.simulate(state.p);state.time=20;renderControls();drawLookup();refresh();updateUrl();toast('Parameters and original stock values restored.')}
function init(){loadTheme();readUrl();renderControls();makeDiagram();drawLookup();refresh();
 $('#themeToggle').onclick=setTheme;$('#resetParams').onclick=reset;$('#diagramReset').onclick=()=>{state.selected='Price';state.all=true;$('#showAll').checked=true;select('Price');toast('Diagram focus reset.')};$('#showAll').onchange=e=>{state.all=e.target.checked;select(state.selected)};
 $('#resetLookup').onclick=()=>{replaceRun({...state.p,lookup:E.clone(E.LOOKUP)},true);toast('Lookup restored.')};
 $('#primaryVariable').onchange=e=>{state.metric=e.target.value;renderPlots()};$('#timeSlider').oninput=e=>{state.time=Number(e.target.value);renderTime();renderPlots()};
 $('#saveRun').onclick=saveRun;$('#exportCsv').onclick=exportCsv;$('#shareLink').onclick=()=>{updateUrl();if(location.protocol==='file:'){toast('Configuration links can be shared after deployment to GitHub Pages.');return}navigator.clipboard?.writeText(location.href).then(()=>toast('Configuration URL copied.')).catch(()=>toast('Copy the URL from the address bar.'))};
 let w;window.addEventListener('resize',()=>{clearTimeout(w);w=setTimeout(()=>{renderPlots();makeDiagram()},80)});
 $('#pricePlot').addEventListener('pointermove',e=>{if(!state.layout)return;const l=state.layout;let rect=e.currentTarget.getBoundingClientRect();let px=e.clientX-rect.left;if(px<l.left||px>l.width-l.right){$('#chartTooltip').hidden=true;return}let t=clamp(Math.round(((px-l.left)/l.pw)*E.FINAL/E.DT)*E.DT,0,E.FINAL);state.time=t;renderTime();renderPlots();let tip=$('#chartTooltip');tip.hidden=false;tip.textContent=`Month ${fmt(t,2)}  ·  ${state.metric}: ${fmt(E.at(state.run,t)[state.metric],3)}`;tip.style.left=clamp(px,75,l.width-75)+'px';tip.style.top=Math.max(10,e.clientY-rect.top-36)+'px'});$('#pricePlot').onpointerleave=()=>$('#chartTooltip').hidden=true;
 window.addEventListener('hashchange',()=>{readUrl();renderControls();drawLookup();refresh()});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
