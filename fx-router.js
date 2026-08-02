(()=>{'use strict';
const ids=['volume','pitch','attack','release','filter','drive','delay','feedback'];
const options=[
'Volume','Pitch','Attack','Release','Filter Cutoff','Drive','Delay Mix','Delay Feedback',
'Stutter Rate','Stutter Depth','Delay Gate Rate','Delay Gate Depth',
'Wobble Rate','Wobble Depth','Tremolo Rate','Tremolo Depth',
'Pitch Jitter Rate','Pitch Jitter Depth'
];
const defaults=['Volume','Pitch','Attack','Release','Filter Cutoff','Drive','Delay Mix','Delay Feedback'];
const state={guard:false,assign:JSON.parse(localStorage.getItem('choppaFxAssignV4')||'null')||defaults,timers:new Map(),vals:{stutterRate:6,stutterDepth:.85,delayGateRate:4,delayGateDepth:.8,wobbleRate:2,wobbleDepth:.45,tremoloRate:4,tremoloDepth:.5,jitterRate:6,jitterDepth:1.5}};
const el=id=>document.getElementById(id),clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),norm=x=>clamp((+x.value-+x.min)/(+x.max-+x.min),0,1);
function set(id,v){const x=el(id);if(!x)return;x.value=clamp(v,+x.min,+x.max);x.dispatchEvent(new Event('input',{bubbles:true}))}
function clearSlot(i){const t=state.timers.get(i);if(t){clearInterval(t);state.timers.delete(i)}}
function startTimer(i,ms,fn){clearSlot(i);state.timers.set(i,setInterval(fn,Math.max(80,ms)))}
function restartModulation(){if(window.__choppaModTimer)clearInterval(window.__choppaModTimer);let phase=0;window.__choppaModTimer=setInterval(()=>{if(state.guard)return;phase+=.035;state.guard=true;
const wobbleOn=state.assign.includes('Wobble Rate')||state.assign.includes('Wobble Depth');
const tremOn=state.assign.includes('Tremolo Rate')||state.assign.includes('Tremolo Depth');
const jitterOn=state.assign.includes('Pitch Jitter Rate')||state.assign.includes('Pitch Jitter Depth');
if(wobbleOn)set('filter',clamp(20000-(.5+.5*Math.sin(phase*state.vals.wobbleRate*2))*state.vals.wobbleDepth*18000,200,20000));
if(tremOn)set('volume',clamp(.85*(1-state.vals.tremoloDepth*(.5+.5*Math.sin(phase*state.vals.tremoloRate*2))),0,1));
if(jitterOn&&Math.random()<state.vals.jitterRate/120)set('pitch',clamp((Math.random()*2-1)*state.vals.jitterDepth,-12,12));
state.guard=false;},80)}
function apply(i,v){if(state.guard)return;state.guard=true;const a=state.assign[i];clearSlot(i);
switch(a){
case 'Volume':set('volume',v);break;
case 'Pitch':set('pitch',-12+v*24);break;
case 'Attack':set('attack',v*.2);break;
case 'Release':set('release',.01+v*1.19);break;
case 'Filter Cutoff':set('filter',200+v*19800);break;
case 'Drive':set('drive',v);break;
case 'Delay Mix':set('delay',v*.8);break;
case 'Delay Feedback':set('feedback',v*.75);break;
case 'Stutter Rate':state.vals.stutterRate=2+v*14;startTimer(i,1000/state.vals.stutterRate,()=>{state.guard=true;set('volume',+el('volume').value>.1?0:.85*(1-state.vals.stutterDepth*.15));state.guard=false});break;
case 'Stutter Depth':state.vals.stutterDepth=v;break;
case 'Delay Gate Rate':state.vals.delayGateRate=1+v*11;startTimer(i,1000/state.vals.delayGateRate,()=>{state.guard=true;set('delay',+el('delay').value>.05?0:.65*(.35+state.vals.delayGateDepth*.65));state.guard=false});break;
case 'Delay Gate Depth':state.vals.delayGateDepth=v;break;
case 'Wobble Rate':state.vals.wobbleRate=.5+v*7.5;restartModulation();break;
case 'Wobble Depth':state.vals.wobbleDepth=v;restartModulation();break;
case 'Tremolo Rate':state.vals.tremoloRate=.5+v*11.5;restartModulation();break;
case 'Tremolo Depth':state.vals.tremoloDepth=v;restartModulation();break;
case 'Pitch Jitter Rate':state.vals.jitterRate=1+v*15;restartModulation();break;
case 'Pitch Jitter Depth':state.vals.jitterDepth=.2+v*5.8;restartModulation();break;
}
state.guard=false}
function build(){const cards=[...document.querySelectorAll('.knob')];cards.forEach((card,i)=>{let s=card.querySelector('.fxAssign');if(!s){s=document.createElement('select');s.className='fxAssign';card.appendChild(s)}s.innerHTML='';options.forEach(name=>{const o=document.createElement('option');o.value=name;o.textContent=name;s.appendChild(o)});s.value=state.assign[i]||defaults[i];s.onchange=()=>{state.assign[i]=s.value;localStorage.setItem('choppaFxAssignV4',JSON.stringify(state.assign));clearSlot(i);apply(i,norm(el(ids[i])));restartModulation()}});
ids.forEach((id,i)=>{const x=el(id);if(x)x.addEventListener('input',()=>{if(!state.guard)apply(i,norm(x))})});
const css=document.createElement('style');css.textContent=`.knobs{grid-template-columns:repeat(4,minmax(150px,1fr))!important;gap:14px!important}.knob{padding:14px 12px!important;border-radius:16px!important;min-height:184px!important}.dial{width:76px!important;height:76px!important;margin:12px auto 10px!important}.dial i{top:8px!important;height:22px!important;transform-origin:50% 29px!important}.knob strong{font-size:.84rem!important}.knob em{font-size:.69rem!important}.knob output{font-size:.84rem!important}.fxAssign{width:100%;margin-top:10px;background:#08090d;color:#fff7e8;border:1px solid rgba(127,215,255,.32);border-radius:10px;padding:9px 8px;font-size:.72rem;font-weight:900;text-transform:uppercase;letter-spacing:.04em}.fxAssign:focus{outline:2px solid #7fd7ff}.pad.hit{filter:brightness(1.1)!important;transform:scale(.994)!important}.btn.panic{animation:none!important}@media(max-width:900px){.knobs{grid-template-columns:repeat(2,minmax(140px,1fr))!important}}@media(max-width:520px){.knobs{grid-template-columns:1fr 1fr!important}.knob{min-height:172px!important}}`;document.head.appendChild(css);restartModulation()}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',build);else build();
})();