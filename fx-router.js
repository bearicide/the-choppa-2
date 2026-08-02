(()=>{'use strict';
const ids=['volume','pitch','attack','release','filter','drive','delay','feedback'];
const menus=[
['Volume','Stutter Gate','Tremolo','Pump','Hard Gate'],
['Pitch','Tape Stop','Vinyl Brake','Digital Jitter','Octave Snap'],
['Attack','Glitch Repeat','Micro Loop','Chop Tightness','Reverse Feel'],
['Release','Delay Gate','Freeze Tail','Echo Burst','Smear'],
['Filter','Bitcrush','Sample-Rate Crush','Radio','Darken'],
['Drive','Digital Clip','Fuzz','Glitch Dirt','Crush Stack'],
['Delay','Slap','Dub Throw','Delay Gate','Glitch Repeat'],
['Feedback','Infinite Echo','Chaos Echo','Comb Jitter','Freeze Repeat']
];
const state={guard:false,timers:new Map(),last:new Map(),assign:JSON.parse(localStorage.getItem('choppaFxAssignV1')||'null')||menus.map(x=>x[0])};
const el=id=>document.getElementById(id);
function norm(input){return Math.max(0,Math.min(1,(+input.value-+input.min)/(+input.max-+input.min)))}
function set(id,value){const x=el(id);if(!x)return;x.value=Math.max(+x.min,Math.min(+x.max,value));x.dispatchEvent(new Event('input',{bubbles:true}))}
function clearTimer(i){const t=state.timers.get(i);if(t){clearInterval(t);state.timers.delete(i)}}
function pulse(i,rate,depth,target='volume'){clearTimer(i);let on=true;state.timers.set(i,setInterval(()=>{if(state.guard)return;state.guard=true;const x=el(target);if(x){const base=target==='volume'?0.85:+x.max*.65;x.value=on?base:Math.max(+x.min,base*(1-depth));x.dispatchEvent(new Event('input',{bubbles:true}))}on=!on;state.guard=false},rate))}
function jitter(i,amount){clearTimer(i);state.timers.set(i,setInterval(()=>{if(state.guard)return;state.guard=true;set('pitch',(Math.random()*2-1)*amount);set('filter',Math.max(500,20000-(Math.random()*amount*1200)));state.guard=false},70))}
function apply(i,n){if(state.guard)return;state.guard=true;const a=state.assign[i],v=n;clearTimer(i);
switch(a){
case 'Volume':set('volume',v);break;
case 'Stutter Gate':pulse(i,Math.max(35,220-v*185),.98);break;
case 'Tremolo':pulse(i,Math.max(55,320-v*250),.55);break;
case 'Pump':pulse(i,Math.max(110,520-v*360),.78);break;
case 'Hard Gate':pulse(i,Math.max(45,180-v*120),1);break;
case 'Pitch':set('pitch',-12+v*24);break;
case 'Tape Stop':set('pitch',-12*v);set('release',.12+v*.9);break;
case 'Vinyl Brake':set('pitch',-7*v);set('filter',20000-v*15000);break;
case 'Digital Jitter':jitter(i,1+v*5);break;
case 'Octave Snap':set('pitch',[-12,0,12][Math.min(2,Math.floor(v*3))]);break;
case 'Attack':set('attack',v*.2);break;
case 'Glitch Repeat':set('delay',.18+v*.58);set('feedback',.35+v*.38);set('release',.03+v*.12);break;
case 'Micro Loop':set('release',.01+v*.08);set('delay',.04+v*.18);set('feedback',.2+v*.35);break;
case 'Chop Tightness':set('attack',.001+v*.02);set('release',.02+(1-v)*.16);break;
case 'Reverse Feel':set('attack',v*.18);set('release',.25+v*.8);break;
case 'Release':set('release',.01+v*1.19);break;
case 'Delay Gate':set('delay',.2+v*.55);set('feedback',.25+v*.45);pulse(i,Math.max(65,300-v*220),.9,'delay');break;
case 'Freeze Tail':set('feedback',.55+v*.19);set('release',.5+v*.7);break;
case 'Echo Burst':set('delay',.08+v*.35);set('feedback',.2+v*.5);break;
case 'Smear':set('release',.3+v*.9);set('delay',.12+v*.35);break;
case 'Filter':set('filter',200+v*19800);break;
case 'Bitcrush':set('drive',.2+v*.8);set('filter',20000-v*14500);break;
case 'Sample-Rate Crush':set('filter',20000-v*18000);set('drive',.1+v*.65);break;
case 'Radio':set('filter',1200+v*5200);set('drive',.12+v*.3);break;
case 'Darken':set('filter',20000-v*18500);break;
case 'Drive':set('drive',v);break;
case 'Digital Clip':set('drive',.35+v*.65);set('volume',.9-v*.25);break;
case 'Fuzz':set('drive',.55+v*.45);set('filter',12000-v*7000);break;
case 'Glitch Dirt':set('drive',.3+v*.7);jitter(i,.5+v*2.5);break;
case 'Crush Stack':set('drive',.45+v*.55);set('filter',18000-v*16000);set('feedback',v*.35);break;
case 'Delay':set('delay',v*.8);break;
case 'Slap':set('delay',.08+v*.18);set('feedback',.08+v*.22);break;
case 'Dub Throw':set('delay',.25+v*.5);set('feedback',.35+v*.38);break;
case 'Feedback':set('feedback',v*.75);break;
case 'Infinite Echo':set('feedback',.5+v*.24);set('delay',.25+v*.45);break;
case 'Chaos Echo':set('feedback',.25+v*.48);jitter(i,.4+v*2);break;
case 'Comb Jitter':set('delay',.01+v*.08);set('feedback',.2+v*.5);break;
case 'Freeze Repeat':set('feedback',.62+v*.12);set('delay',.12+v*.5);break;
}
state.guard=false;
}
function build(){const cards=[...document.querySelectorAll('.knob')];cards.forEach((card,i)=>{if(card.querySelector('.fxAssign'))return;const s=document.createElement('select');s.className='fxAssign';menus[i].forEach(name=>{const o=document.createElement('option');o.value=name;o.textContent=name;s.appendChild(o)});s.value=state.assign[i]||menus[i][0];s.addEventListener('change',()=>{state.assign[i]=s.value;localStorage.setItem('choppaFxAssignV1',JSON.stringify(state.assign));clearTimer(i);apply(i,norm(el(ids[i])))});card.appendChild(s)});
const css=document.createElement('style');css.textContent='.fxAssign{width:100%;margin-top:7px;background:#08090d;color:#fff7e8;border:1px solid rgba(127,215,255,.28);border-radius:8px;padding:6px;font-size:.62rem;font-weight:900;text-transform:uppercase;letter-spacing:.04em}.fxAssign:focus{outline:2px solid #7fd7ff}';document.head.appendChild(css);
ids.forEach(id=>{const x=el(id);if(x)state.last.set(id,x.value)});
setInterval(()=>{ids.forEach((id,i)=>{const x=el(id);if(!x)return;const prev=state.last.get(id);if(prev!==x.value&&!state.guard){state.last.set(id,x.value);apply(i,norm(x))}})},35);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',build);else build();
})();