import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {approvedPortraitIndex} from '../p1-portrait-index.js';
const rows=JSON.parse(fs.readFileSync(new URL('../data/p1-approved.json',import.meta.url)));
if(!rows.length){console.log('P1 NO APPROVED PHOTOS — real-image browser validation NOT performed');process.exit(0)}
const idx=approvedPortraitIndex(rows),base=process.env.APM_URL||'http://127.0.0.1:8000/';
const browser=await chromium.launch({headless:true});
try{
 const page=await browser.newPage({serviceWorkers:'block'}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto(new URL('index.html',base).href);
 await page.locator('[data-action="lobby:collection"]').click();
 await page.locator('#p1-photo-credits').waitFor();
 await page.locator('#p1-photo-credits summary').click();
 for(const p of rows){
  assert.equal(idx.get(p.id),p);
  const response=await page.request.get(new URL(p.path,base).href);assert.equal(response.status(),200,p.id);
  const image=await page.evaluate(async url=>{const i=new Image();i.src=url;await i.decode();return [i.naturalWidth,i.naturalHeight]},new URL(p.path,base).href);
  assert.ok(image.every(n=>n>0&&n<=768),p.id);
  assert.ok((await page.locator('#p1-photo-credits').innerText()).includes(p.name),p.id);
 }
 assert.deepEqual(errors,[]);
 console.log('P1 actual local HTTP/decode and Photo Credits verified for '+rows.length+' approved records; other UI surfaces require separate tests');
}finally{await browser.close()}
