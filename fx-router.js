(()=>{'use strict';
const ids=['volume','pitch','attack','release','filter','drive','delay','feedback'];
const menus=[
['Volume','Stutter Gate','Tremolo','Pump','Hard Gate'],
['Pitch','Tape Stop','Vinyl Brake','Digital Jitter','Octave Snap'],
['Attack','Glitch Repeat','Micro Loop','Chop Tightness','Reverse Feel'],
['Release','Delay Gate','Freeze Tail','Echo Burst','Smear'],
['Filter','Bass Wobble','Bitcrush','Sample-Rate Crush','Darken'],
['Drive','Digital Clip','Fuzz','Glitch Dirt','Crush Stack'],
['Delay','Slap','Dub Throw','Delay Gate','Glitch Repeat'],
['Feedback','Infinite Echo','Chaos Echo','Comb Jitter','Freeze Repeat']
];
const state={guard:false,timers:new Map(),last:new Map(),assign:JSON.parse(localStorage.getItem('choppaFxAssignV2')||'null')||menus.map(x=>x[0]),audio:null,eq:[0,0,0],wobble:{on:false,rate:2,depth:0},visualTimer:0};
const el=id=>document.getElementById(id);
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
function norm(input){return clamp((+input.value-+input.min)/(+input.max-+input.min),0,1)}
function set(id,value,quiet=false){const x=el(id);if(!x)return;x.value=clamp(value,+x.min,+x.max);if(!quiet)x.dispatchEvent(new Event('input',{bubbles:true}))}
function clearTimer(i){const t=state.timers.get(i);if(t){clearInterval(t);state.timers.delete(i)}if(state.audio)state.audio.gate(1);if(state.audio)state.audio.delayGate(1)}
function safeInterval(i,fn,ms){clearTimer(i);state.timers.set(i,setInterval(fn,Math.max(80,ms)))}

/* Capture the app master output before audio starts and insert a stable post-FX chain. */
(function installAudioBridge(){
 const proto=window.AudioNode&&AudioNode.prototype;if(!proto||proto.__choppaEqBridge)return;
 proto.__choppaEqBridge=true;const original=proto.connect;
 proto.connect=function(dest,...rest){
   try{
     if(dest&&dest.constructor&&dest.constructor.name==='AudioDestinationNode'&&!this.__choppaRouted){
       this.__choppaRouted=true;const c=this.context;
       const low=c.createBiquadFilter(),mid=c.createBiquadFilter(),high=c.createBiquadFilter(),gate=c.createGain(),delayGate=c.createGain();
       low.type='lowshelf';low.frequency.value=120;mid.type='peaking';mid.frequency.value=1000;mid.Q.value=.8;high.type='highshelf';high.frequency.value=7000;
       gate.gain.value=1;delayGate.gain.value=1;
       original.call(this,low);original.call(low,mid);original.call(mid,high);original.call(high,gate);original.call(gate,dest,...rest);
       state.audio={context:c,low,mid,high,gateNode:gate,delayGateNode:delayGate,
         eq(l,m,h){low.gain.setTargetAtTime(clamp(l,-12,12),c.currentTime,.025);mid.gain.setTargetAtTime(clamp(m,-12,12),c.currentTime,.025);high.gain.setTargetAtTime(clamp(h,-12,12),c.currentTime,.025)},
         gate(v){gate.gain.setTargetAtTime(clamp(v,0,1),c.currentTime,.008)},
         delayGate(v){const d=el('delay');if(d){const base=+d.value;d.value=clamp(base*v,+d.min,+d.max);d.dispatchEvent(new Event('input',{bubbles:true}))}},
         wobble(rate,depth,on){state.wobble={rate,depth,on};}
       };
       state.audio.eq(...state.eq);
       return dest;
     }
   }catch(e){console.warn('Choppa EQ bridge fallback',e)}
   return original.call(this,dest,...rest);
 };
})();

function pulse(i,rate,depth,target='master'){
 let on=true;safeInterval(i,()=>{if(!state.audio)return;const value=on?1:Math.max(.04,1-depth);if(target==='delay')state.audio.delayGate(value);else state.audio.gate(value);on=!on},rate);
}
function jitter(i,amount){
 safeInterval(i,()=>{if(state.guard)return;state.guard=true;set('pitch',clamp((Math.random()*2-1)*amount,-12,12));set('filter',clamp(18000-Math.random()*amount*900,450,20000));state.guard=false},120);
}
function wobbleTick(){
 const now=performance.now()/1000,w=state.wobble;if(!w.on||!w.depth)return;
 const base=+el('filter').dataset.wobbleBase||+el('filter').value||12000;
 const phase=(Math.sin(now*Math.PI*2*w.rate)+1)/2;
 const hz=clamp(base*(1-w.depth*.82)+base*w.depth*.82*phase,180,20000);
 const f=el('filter');if(f){state.guard=true;f.value=hz;f.dispatchEvent(new Event('input',{bubbles:true}));state.guard=false}
 requestAnimationFrame(wobbleTick);
}
let wobbleRAF=false;
function startWobble(){if(wobbleRAF)return;wobbleRAF=true;requestAnimationFrame(wobbleTick)}

function apply(i,n){if(state.guard)return;state.guard=true;const a=state.assign[i],v=n;clearTimer(i);
 switch(a){
 case 'Volume':set('volume',v);break;
 case 'Stutter Gate':pulse(i,220-v*130,.92);break;
 case 'Tremolo':pulse(i,360-v*210,.42);break;
 case 'Pump':pulse(i,520-v*290,.68);break;
 case 'Hard Gate':pulse(i,180-v*90,.98);break;
 case 'Pitch':set('pitch',-12+v*24);break;
 case 'Tape Stop':set('pitch',-12*v);set('release',.12+v*.72);break;
 case 'Vinyl Brake':set('pitch',-7*v);set('filter',20000-v*14500);break;
 case 'Digital Jitter':jitter(i,.5+v*3);break;
 case 'Octave Snap':set('pitch',[-12,0,12][Math.min(2,Math.floor(v*3))]);break;
 case 'Attack':set('attack',v*.2);break;
 case 'Glitch Repeat':set('delay',.12+v*.42);set('feedback',.25+v*.38);set('release',.03+v*.1);break;
 case 'Micro Loop':set('release',.01+v*.07);set('delay',.04+v*.14);set('feedback',.18+v*.3);break;
 case 'Chop Tightness':set('attack',.001+v*.018);set('release',.02+(1-v)*.14);break;
 case 'Reverse Feel':set('attack',v*.16);set('release',.22+v*.7);break;
 case 'Release':set('release',.01+v*1.19);break;
 case 'Delay Gate':set('delay',.16+v*.46);set('feedback',.2+v*.38);pulse(i,300-v*170,.82,'delay');break;
 case 'Freeze Tail':set('feedback',.48+v*.24);set('release',.45+v*.65);break;
 case 'Echo Burst':set('delay',.08+v*.28);set('feedback',.18+v*.42);break;
 case 'Smear':set('release',.25+v*.75);set('delay',.1+v*.28);break;
 case 'Filter':set('filter',200+v*19800);state.wobble.on=false;break;
 case 'Bass Wobble':{const f=el('filter');if(f)f.dataset.wobbleBase=String(clamp(900+v*8500,900,12000));state.wobble={on:v>.02,rate:.5+v*7.5,depth:.15+v*.75};startWobble();break}
 case 'Bitcrush':set('drive',.18+v*.68);set('filter',19000-v*11500);break;
 case 'Sample-Rate Crush':set('filter',20000-v*16500);set('drive',.08+v*.52);break;
 case 'Darken':set('filter',20000-v*18000);break;
 case 'Drive':set('drive',v);break;
 case 'Digital Clip':set('drive',.28+v*.62);set('volume',.9-v*.18);break;
 case 'Fuzz':set('drive',.45+v*.5);set('filter',13000-v*6200);break;
 case 'Glitch Dirt':set('drive',.24+v*.62);jitter(i,.25+v*1.5);break;
 case 'Crush Stack':set('drive',.35+v*.58);set('filter',18000-v*14500);set('feedback',v*.24);break;
 case 'Delay':set('delay',v*.8);break;
 case 'Slap':set('delay',.07+v*.17);set('feedback',.06+v*.2);break;
 case 'Dub Throw':set('delay',.22+v*.46);set('feedback',.3+v*.4);break;
 case 'Feedback':set('feedback',v*.75);break;
 case 'Infinite Echo':set('feedback',.48+v*.25);set('delay',.22+v*.4);break;
 case 'Chaos Echo':set('feedback',.22+v*.42);jitter(i,.2+v*1.2);break;
 case 'Comb Jitter':set('delay',.01+v*.07);set('feedback',.18+v*.42);break;
 case 'Freeze Repeat':set('feedback',.58+v*.15);set('delay',.12+v*.42);break;
 }
 state.guard=false;
}

function buildEQ(){
 const hero=document.querySelector('#heroSection .hero .panel');if(!hero||document.getElementById('globalEQ'))return;
 const box=document.createElement('div');box.id='globalEQ';box.className='globalEQ';box.innerHTML='<div class="eqHead"><b>Global EQ</b><span>Low-end control after all FX</span></div><div class="eqBands"></div><div class="eqWobble"><label><span>Bass Wobble</span><input id="heroWobble" type="range" min="0" max="1" step=".01" value="0"></label><output id="heroWobbleVal">Off</output></div>';
 const bands=[['LOW',0],['MID',0],['HIGH',0]],wrap=box.querySelector('.eqBands');
 bands.forEach((b,i)=>{const l=document.createElement('label');l.innerHTML='<span>'+b[0]+'</span><input type="range" min="-12" max="12" step="1" value="0"><output>0 dB</output>';const input=l.querySelector('input'),out=l.querySelector('output');input.oninput=()=>{state.eq[i]=+input.value;out.textContent=(+input.value>0?'+':'')+input.value+' dB';if(state.audio)state.audio.eq(...state.eq)};wrap.appendChild(l)});
 const w=box.querySelector('#heroWobble'),wo=box.querySelector('#heroWobbleVal');w.oninput=()=>{const v=+w.value;state.wobble={on:v>.01,rate:.5+v*7.5,depth:v*.78};wo.textContent=v<.01?'Off':(state.wobble.rate.toFixed(1)+' Hz');const f=el('filter');if(f)f.dataset.wobbleBase=String(+f.value||8000);startWobble()};
 hero.appendChild(box);
}
function build(){
 const cards=[...document.querySelectorAll('.knob')];cards.forEach((card,i)=>{if(card.querySelector('.fxAssign'))return;const s=document.createElement('select');s.className='fxAssign';menus[i].forEach(name=>{const o=document.createElement('option');o.value=name;o.textContent=name;s.appendChild(o)});s.value=state.assign[i]||menus[i][0];s.addEventListener('change',()=>{state.assign[i]=s.value;localStorage.setItem('choppaFxAssignV2',JSON.stringify(state.assign));clearTimer(i);apply(i,norm(el(ids[i])))});card.appendChild(s)});
 const css=document.createElement('style');css.textContent=`
 .fxAssign{width:100%;margin-top:7px;background:#08090d;color:#fff7e8;border:1px solid rgba(127,215,255,.28);border-radius:8px;padding:6px;font-size:.62rem;font-weight:900;text-transform:uppercase;letter-spacing:.04em}.fxAssign:focus{outline:2px solid #7fd7ff}
 .globalEQ{margin-top:14px;border:1px solid rgba(125,255,159,.24);border-radius:14px;background:rgba(0,0,0,.22);padding:12px}.eqHead{display:flex;justify-content:space-between;gap:8px;align-items:center;margin-bottom:10px}.eqHead b{text-transform:uppercase;letter-spacing:.1em;color:#7dff9f}.eqHead span{font-size:.72rem;color:#c8bca8}.eqBands{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}.eqBands label,.eqWobble label{display:grid;gap:5px}.eqBands span,.eqWobble span{font-size:.62rem;font-weight:900;letter-spacing:.08em;color:#7fd7ff}.eqBands output,.eqWobble output{font-size:.68rem;color:#fff7e8}.eqWobble{display:grid;grid-template-columns:1fr auto;gap:10px;align-items:end;margin-top:10px}.globalEQ input{width:100%;accent-color:#7dff9f}
 .pad.hit{transition:filter .08s ease,transform .08s ease;filter:brightness(1.08)!important;transform:scale(.992)!important}.pad.looping{animation:none!important;box-shadow:0 0 18px var(--glow),inset 0 0 16px rgba(255,255,255,.12)!important}.knob.resetFlash{box-shadow:0 0 10px rgba(125,255,159,.16)!important}.btn.panic{animation:none!important}
 @media(max-width:620px){.eqBands{grid-template-columns:1fr}.eqHead{align-items:flex-start;flex-direction:column}}
 `;document.head.appendChild(css);
 ids.forEach(id=>{const x=el(id);if(x)state.last.set(id,x.value)});buildEQ();
 setInterval(()=>{ids.forEach((id,i)=>{const x=el(id);if(!x)return;const prev=state.last.get(id);if(prev!==x.value&&!state.guard){state.last.set(id,x.value);apply(i,norm(x))}})},70);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',build);else build();
})();