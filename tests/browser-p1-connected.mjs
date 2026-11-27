import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {connectedPortraitIndex} from '../p1-portrait-index.js';
const read=p=>JSON.parse(fs.readFileSync(new URL('../'+p,import.meta.url)));
const rows=read('data/p1-connected.json'),idx=connectedPortraitIndex(rows,read('data/p1-approved.json'));
assert.ok(rows.length>0,'real connected photos required');
const local=read('data/portraits.json'),oldIds=new Set(local.map(p=>p.id)),oldNames=new Set(local.map(p=>p.name));
const congress=['historical','current'].flatMap(t=>read('data/legislators-'+t+'.json')).filter(p=>p.id?.bioguide).map(p=>({id:p.id.bioguide,name:p.name.official_full||[p.name.first,p.name.middle,p.name.last,p.name.suffix].filter(Boolean).join(' ')}));
const hist=read('data/historical-people.json').people;
const available=[...hist,...congress].filter(p=>idx.has(p.id)&&!oldIds.has(p.id)&&!oldNames.has(p.name));
const selected=[...available.filter(p=>p.id.startsWith('hist:')).slice(0,3),...available.filter(p=>/^[A-Z]\d{6}$/.test(p.id)).slice(0,5)];
assert.ok(selected.length>=5,'representative roster samples required');
const base=process.env.APM_URL||'http://127.0.0.1:8000/',browser=await chromium.launch({headless:true});
try{
 const page=await browser.newPage({serviceWorkers:'block'}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(new URL('index.html',base).href);
 await page.locator('[data-action="lobby:collection"]').click();
 await page.waitForFunction(n=>document.querySelector('#p1-photo-credits summary')?.textContent.includes(String(n)),rows.length,{timeout:60000});
 await page.waitForFunction(()=>document.querySelector('#screen')?.textContent.includes('Congress dataset loaded'),null,{timeout:60000});
 for(const p of selected){
  const rec=idx.get(p.id);
  await page.locator('#search').fill(p.id);await page.locator('#search').press('Enter');
  const card=page.locator('img[data-person="'+p.id+'"]').first();await card.waitFor();
  await card.scrollIntoViewIfNeeded();
  await card.evaluate(async(el)=>{await el.decode()});
  assert.ok((await card.getAttribute('src')).endsWith(rec.path),p.id+' card source');
  assert.ok(await card.evaluate(el=>el.naturalWidth>0&&el.naturalHeight>0),p.id+' decode');
  await page.locator('[data-person-open="'+p.id+'"]').first().click();
  const prof=page.locator('.profile img[data-person="'+p.id+'"]');await prof.waitFor();
  assert.ok((await prof.getAttribute('src')).endsWith(rec.path),p.id+' profile source');
  await prof.evaluate(async el=>{await el.decode()});
  assert.ok(await page.locator('.profile .p1-photo-credit').count()>0,p.id+' source credit');
  await page.locator('[data-action="closeprofile"]').click();
  console.log('P1 verified real card and profile',p.id,p.name,rec.path);
 }
 assert.deepEqual(errors,[]);
 console.log('P1 actual browser verification',selected.length,'people;',rows.length,'connected records');
}finally{await browser.close()}
