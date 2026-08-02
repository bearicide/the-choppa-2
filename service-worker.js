const VERSION='slice-loop-fix-v1';
self.addEventListener('install',event=>event.waitUntil(self.skipWaiting()));
self.addEventListener('activate',event=>event.waitUntil(self.clients.claim()));
self.addEventListener('fetch',event=>{
  const req=event.request;
  const url=new URL(req.url);
  if(req.mode!=='navigate'||url.origin!==self.location.origin||!url.pathname.startsWith('/the-choppa-2/'))return;
  event.respondWith((async()=>{
    const res=await fetch(req,{cache:'no-store'});
    const type=res.headers.get('content-type')||'';
    if(!type.includes('text/html'))return res;
    let html=await res.text();
    const broken="function trigger(i,vel=1,gate=false){ensureAudio();if(!buffer||!slices[i]){beep(i,vel);hit(i);return null}if(choke&&!gate)stopActive(true);const[s,e]=slices[i],entry=makeSource(s,Math.max(.08,e-s),vel,gate,false);if(!entry)return null;entry.pad=i;active.push(entry);hit(i);led(i,'play');entry.src.onended=()=>{active=active.filter(x=>x.src!==entry.src);if(killed.has(entry.src)){led(i,'off');return}if(looping.has(i))trigger(i,vel);else led(i,'off')};return entry}";
    const fixed="function trigger(i,vel=1,gate=false,retrigger=false){ensureAudio();if(!buffer||!slices[i]){beep(i,vel);hit(i);return null}if(choke&&!gate&&!retrigger)stopActive(true);const[s,e]=slices[i],entry=makeSource(s,Math.max(.08,e-s),vel,gate,false);if(!entry)return null;entry.pad=i;active.push(entry);hit(i);led(i,'play');entry.src.onended=()=>{active=active.filter(x=>x.src!==entry.src);if(killed.has(entry.src)){led(i,'off');return}if(looping.has(i))trigger(i,vel,false,true);else led(i,'off')};return entry}";
    html=html.replace(broken,fixed);
    const headers=new Headers(res.headers);
    headers.set('cache-control','no-store, max-age=0');
    headers.set('x-choppa-patch',VERSION);
    headers.delete('content-length');
    return new Response(html,{status:res.status,statusText:res.statusText,headers});
  })().catch(()=>fetch(req)));
});
