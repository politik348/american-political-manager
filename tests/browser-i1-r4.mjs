import {chromium} from 'playwright';
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {catalog,suggestPilot} from '../i1-pilot.js';

const url=process.env.APM_URL||'http://127.0.0.1:8000/';
const data=new URL('../data/',import.meta.url), root=new URL('dialogue-packs/',data);
const read=(p,base=root)=>JSON.parse(fs.readFileSync(new URL(p,base),'utf8'));
const m=read('i1-index.json'), appointmentChecks=Object.fromEntries(m.appointmentAuditFiles.flatMap(p=>read(p).records).map(x=>[x.id,x]));
const c={...catalog(m.parts.map(p=>read(p))),chains:m.chains,photos:m.photos,appointmentPilot:[...new Set([...m.appointmentPilot,...Object.keys(appointmentChecks)])],appointmentChecks,appointmentExcludedIds:m.appointmentExcludedIds,dateHandoffIds:m.dateHandoffIds,archiveHorizon:m.archiveHorizon};
const raw=['legislators-historical.json','legislators-current.json'].flatMap(p=>read(p,data));
const people=[...new Map(raw.filter(p=>p.id?.bioguide).map(p=>[p.id.bioguide,{id:p.id.bioguide,terms:p.terms}])).values()];
const states=read('world.json',data).states;
const cases=[], planned=new Set(['P01-088']);
for(const year of [2026,2025,2024,2023,2022]){
 for(const state of states.filter(x=>x.admitted<=year&&x.id!=='CA').map(x=>x.id)){
  const s={state,office:'local'}, date=year+'-05-15', v=suggestPilot(s,c,people,date,'career:'+year+':2','career');
  if(v&&!planned.has(v.id)&&cases.length<4){cases.push({year,state,expected:v.id});planned.add(v.id)}
 }
}
assert.equal(cases.length,4,'four distinct roster-screened additional careers required');
let senateCase;
for(let year=2026;year>=1900&&!senateCase;year--)for(const state of states.filter(x=>x.admitted<=year&&x.id!=='CA').map(x=>x.id)){const v=suggestPilot({state,office:'local'},c,people,year+'-05-15','career:'+year+':2','career');if(v?.id.startsWith('P02-')&&!planned.has(v.id)){senateCase={year,state,expected:v.id,senate:true};break}}
assert.ok(senateCase,'a real roster-screened Senate career must exist');cases.push(senateCase);
const browser=await chromium.launch({headless:true});
try{
 const actual=new Set(['P01-088']);
 for(const cfg of cases){
  const context=await browser.newContext({serviceWorkers:'block'});
  try{
   const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
   const save=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('apm-save-v1')));
   await page.goto(new URL('index.html',url).href);
   await page.locator('[data-action="lobby:career"]').click();
   await page.locator('#startyear').selectOption(String(cfg.year));
   await page.locator('#startstate').selectOption(cfg.state);
   await page.locator('#startform select[name=mode]').selectOption('alternate');
   await page.locator('#startform button[type=submit]').click();
   await page.locator('[data-action="open-inbox"]').click();
   await page.locator('[data-action="v17:quarter:1"]').click();
   await page.locator('[data-group="home"]').click();
   await page.locator('[data-action="act:rest"]').click();
   await page.locator('[data-action="act:rest"]').click();
   await page.locator('[data-action="next"]').click();
   const before=await save();assert.equal(before.quarter,2);assert.equal(before.state,cfg.state);
   const suggestion=page.locator('[data-action^="meet:pilot:suggest:career:"]');
   await suggestion.waitFor({timeout:30000});
   const id=(await suggestion.getAttribute('data-action')).split(':').at(-1);
   const v=c.scenes.find(x=>x.id===id);assert.ok(v);if(cfg.senate)assert.ok(id.startsWith('P02-'),'actual Senate appointment required');assert.ok(!actual.has(id),'duplicate actual scene '+id);actual.add(id);
   await suggestion.click();await page.locator('#i1-pilot .eyebrow').filter({hasText:id}).waitFor();
   await page.locator('[data-action="meet:pilot:answer:'+v.response.correct+'"]').click();
   await page.locator('[data-i1-result="correct"]').waitFor();
   const after=await save();assert.deepEqual(after.encounters,before.encounters);
   assert.equal(after.i1Pilot.appointments['career:'+cfg.year+':2'],id);
   assert.equal(after.i1Pilot.documents[id].key,v.outcome.key);
   for(const x of v.cast)assert.equal(after.i1Pilot.archiveContacts[x.id].appointments[id],after.i1Pilot.history[id].playedAt);
   await page.locator('[data-action="meet:pilot:close"]').click();
   assert.equal(await page.locator('[data-i1-appointment]').count(),0);
   assert.deepEqual(errors,[]);
   console.log('I1 R4 real schedule '+JSON.stringify({scene:id,year:cfg.year,state:cfg.state,quarter:2,planned:cfg.expected,noSaveInjection:true,noRepeat:true}));
  }finally{await context.close()}
 }
 assert.equal(actual.size,6);
 const context=await browser.newContext();
 try{
  const page=await context.newPage();await page.goto(new URL('icon.svg',url).href);
  await page.evaluate(async()=>{await caches.open('apm-shell-v17.9-i1-rc1');await caches.open('apm-shell-v17.9-i1-rc2');await caches.open('apm-shell-v17.9-i1-rc3');await caches.open('apm-shell-v17.9-i1-rc4');await caches.open('apm-shell-v17.9-i1-rc5');await caches.open('apm-shell-v17.9-i1-rc6');await caches.open('apm-shell-v17.9-i1-rc7');await caches.open('apm-shell-v17.9-i1-rc8-careers');await caches.open('apm-shell-v18-preview1');await caches.open('apm-shell-v18-preview2-calendar');await caches.open('apm-shell-v18-news-engine1');await caches.open('apm-portraits-v1')});
  await page.goto(new URL('index.html',url).href);
  await page.waitForFunction(async()=>{const keys=await caches.keys();return !!navigator.serviceWorker.controller&&keys.includes('apm-shell-v18-release-candidate1')&&!['apm-shell-v17.9-i1-rc1','apm-shell-v17.9-i1-rc2','apm-shell-v17.9-i1-rc3','apm-shell-v17.9-i1-rc4','apm-shell-v17.9-i1-rc5','apm-shell-v17.9-i1-rc6','apm-shell-v17.9-i1-rc7','apm-shell-v17.9-i1-rc8-careers','apm-shell-v18-preview1','apm-shell-v18-preview2-calendar','apm-shell-v18-news-engine1'].some(k=>keys.includes(k))},{},{timeout:45000});
  const result=await page.evaluate(async()=>{const keys=await caches.keys(), cache=await caches.open('apm-shell-v18-release-candidate1');return {keys,manifest:!!await cache.match('./data/dialogue-packs/i1-index.json'),entry:!!await cache.match('./index.html'),careerModules:!!await cache.match('./i1-career-saves.js')&&!!await cache.match('./i1-onboarding-ui.js'),newsPack:!!await cache.match('./data/v18-news-packs/N07/part-10.json')}});
  console.log('V18 original cache diagnostic '+JSON.stringify({...result,...await page.evaluate(async()=>{const cache=await caches.open('apm-shell-v18-release-candidate1');return {controller:navigator.serviceWorker.controller?.scriptURL,cacheURLs:(await cache.keys()).map(r=>r.url),checks:Object.fromEntries(await Promise.all(['./data/v18-news-packs/N07/part-10.json','./i1-career-saves.js','./i1-onboarding-ui.js','./data/dialogue-packs/i1-index.json','./index.html'].map(async p=>[p,!!await cache.match(new URL(p,location.href).href)])))}})}));
  assert.ok(result.newsPack&&result.careerModules&&result.manifest&&result.entry,JSON.stringify(result));assert.ok(result.keys.includes('apm-portraits-v1'));
  await context.setOffline(true);
  const offline=await page.evaluate(async()=>{const r=await fetch('./data/dialogue-packs/i1-index.json');return {ok:r.ok,parts:(await r.json()).parts.length}});
  assert.equal(offline.ok,true);assert.equal(offline.parts,103);
  const local=await page.evaluate(async()=>{const m=await (await fetch('./data/dialogue-packs/i1-index.json')).json();return Promise.all(m.photos.filter(p=>p.localPath).map(async p=>{const r=await fetch(p.localPath);return {id:p.id,ok:r.ok,bytes:(await r.arrayBuffer()).byteLength}}))});assert.ok(local.some(p=>p.id==='L000004'&&p.ok&&p.bytes===1007628),'local original must survive offline');console.log('I1 R5 offline local images '+JSON.stringify(local));
  console.log('I1 R4 service worker '+JSON.stringify({oldShellRemoved:true,portraitCachePreserved:true,offlineManifest:offline.parts}));
 }finally{await context.close()}
}finally{await browser.close()}
