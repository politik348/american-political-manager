const KEY='apm-shell-v18-staff-study-r5',PHOTO='apm-portraits-v1',SHELL=["./v18-study.js","./i1-pilot-app.js","./v18-career.js","./v18-calendar.js","./v18-news.js","./v18-news-ui.js","./data/v18-news-index.json","./data/v18-news-metadata.json","./v18-calendar-ui.js","./data/v18-news.json","./data/v18-house-margins.json","./v18-career-ui.js","./v18-career.css","./i1-onboarding-ui.js","./i1-career-saves.js","./i1-pilot.js","./i1-pilot-ui.js","./app.js","./engine.js","./expansion.js","./v7.js","./v11.js","./v17.js","./v17-ui.js","./onboarding.js","./onboarding-ui.js","./dynamics.js","./encounters.js","./encounters-ui.js","./data/dialogue-packs/i1-index.json","./","./index.html","./start.html","./play-17.8.html","./release/17.8.0/app.js","./release/17.8.0/engine.js","./release/17.8.0/expansion.js","./release/17.8.0/v7.js","./release/17.8.0/v11.js","./release/17.8.0/v17.js","./release/17.8.0/v17-ui.js","./release/17.8.0/onboarding.js","./release/17.8.0/onboarding-ui.js","./release/17.8.0/style.css","./release/17.8.0/dynamics.js","./release/17.8.0/encounters.js","./release/17.8.0/encounters-ui.js","./data/challenges.json","./data/historical-people.json","./data/scenarios.json","./data/world.json","./data/portraits.json","./data/encounter-records.json","./manifest.webmanifest","./icon.svg"];
const scopeURL=p=>new URL(p,self.registration.scope).href;
const packPath=/^v18-news-packs\/N0[1-7]\/part-(0[1-9]|10)\.json$/;
const request=p=>new Request(scopeURL(p),{cache:'reload'});
const cached=async(c,p)=>{const r=await c.match(scopeURL(p));if(!r||!r.ok)throw Error('Missing cached resource: '+p);return r};
const sha=async r=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',await r.arrayBuffer())),b=>b.toString(16).padStart(2,'0')).join('');
async function installShell(){
 const c=await caches.open(KEY);
 try{
  await c.addAll(SHELL.map(request));
  const m=await (await cached(c,'./data/dialogue-packs/i1-index.json')).json();
  const photos=(m.photos||[]).map(p=>p.localPath).filter(p=>/^\.\/assets\/i1-approved-portraits\/[A-Z][0-9]{6}-[a-f0-9]{16}\.(jpg|png)$/.test(p||''));
  if(photos.length)await c.addAll(photos.map(request));
  const news=await (await cached(c,'./data/v18-news-index.json')).json();
  const packs=news.packs;
  if(news.schema!==1||!Array.isArray(packs)||packs.length!==70||new Set(packs.map(p=>p.path)).size!==70||!packs.every(p=>packPath.test(p.path)&&/^[a-f0-9]{64}$/.test(p.sha256)&&p.approval==='independently-reviewed'))throw Error('Incomplete or invalid news manifest');
  for(let i=0;i<packs.length;i+=8){
   await Promise.all(packs.slice(i,i+8).map(async p=>{
    const path='./data/'+p.path,r=await fetch(request(path));
    if(!r.ok||await sha(r.clone())!==p.sha256)throw Error('Invalid news pack: '+p.path);
    await c.put(scopeURL(path),r);
   }));
  }
  for(const p of [...SHELL,...photos,...packs.map(p=>'./data/'+p.path)])await cached(c,p);
  // A marker is written only after every required entry and pack digest is verified.
  await c.put(scopeURL('./__apm_shell_ready__'),new Response(JSON.stringify({version:KEY,packs:packs.length}),{headers:{'content-type':'application/json'}}));
 }catch(e){await caches.delete(KEY);throw e}
}
self.addEventListener('install',e=>e.waitUntil(installShell().then(()=>self.skipWaiting())));
async function retireOldShells(){
 const c=await caches.open(KEY),ready=await (await cached(c,'./__apm_shell_ready__')).json();
 if(ready.version!==KEY||ready.packs!==70)throw Error('Invalid shell readiness marker');
 const obsolete=k=>k.startsWith('apm-shell-')&&k!==KEY;
 for(let attempt=0;attempt<4;attempt++){
  const keys=await caches.keys();
  for(const k of keys.filter(obsolete))await caches.delete(k);
  const remaining=await caches.keys();
  if(remaining.includes(KEY)&&!remaining.some(obsolete))return remaining;
 }
 throw Error('Old shell caches still present');
}
self.addEventListener('activate',e=>e.waitUntil((async()=>{
 await retireOldShells();await self.clients.claim();
})()));
self.addEventListener('message',e=>{
 if(e.data?.type!=='APM_VERIFY_SHELL'||!e.ports[0])return;
 const port=e.ports[0];
 e.waitUntil(retireOldShells().then(keys=>port.postMessage({ok:true,version:KEY,keys})).catch(error=>port.postMessage({ok:false,version:KEY,error:String(error)})));
});
async function portrait(req){let c=await caches.open(PHOTO);let hit=await c.match(req);if(hit)return hit;let res=await fetch(req);if(res.ok||res.type==='opaque'){try{await c.put(req,res.clone());const keys=await c.keys();for(const k of keys.slice(0,Math.max(0,keys.length-180)))await c.delete(k)}catch{}}return res}

const shellURLs=new Set(SHELL.map(scopeURL));
const isReleaseAsset=u=>shellURLs.has(u.href)||u.pathname.startsWith(new URL('./data/v18-news-packs/',self.registration.scope).pathname);
async function serve(req,u){
 const c=await caches.open(KEY);
 // Keep the shell and its hash-pinned news data from a single installed generation.
 if(isReleaseAsset(u)){const hit=await c.match(req);if(hit)return hit}
 try{
  const r=await fetch(req,{cache:req.mode==='navigate'||u.pathname.includes('/data/dialogue-packs/')?'reload':'default'});
  if(r.ok){try{await c.put(req,r.clone())}catch{}}
  return r;
 }catch(e){return await c.match(req)||(req.mode==='navigate'?await c.match(scopeURL('./index.html')):null)||Response.error()}
}
self.addEventListener('fetch',e=>{
 if(e.request.method!=='GET')return;const u=new URL(e.request.url);
 if(e.request.destination==='image'&&((u.hostname==='unitedstates.github.io'||u.hostname==='theunitedstates.io')&&u.pathname.startsWith('/images/congress/')||u.hostname==='upload.wikimedia.org'||(u.hostname==='raw.githubusercontent.com'&&u.pathname.startsWith('/unitedstates/images/gh-pages/congress/')))){e.respondWith(portrait(e.request));return}
 if(u.origin!==location.origin||!u.href.startsWith(self.registration.scope))return;
 e.respondWith(serve(e.request,u));
});
