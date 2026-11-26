import {chromium,devices} from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const read=p=>JSON.parse(fs.readFileSync(new URL('../data/'+p,import.meta.url)));
const seed=read('v18-news.json'),meta=read('v18-news-metadata.json');
for(const [id,date,tier] of [['fixture-day','1960-01-03',3],['fixture-major-off','1960-01-05',2],['fixture-break-a','1960-01-10',1],['fixture-break-b','1960-01-10',1],['fixture-major-on','1960-01-12',2],['fixture-future','1960-01-20',3]]){
 seed.events.push({id,date,ko:'테스트 '+id,en:'Synthetic '+id,bodyKo:'검증용',bodyEn:'Test-only fictional fixture',source:'https://example.invalid/test',precision:'day',historical:true});meta.events[id]={tier,category:'other'};
}
const browser=await chromium.launch({headless:true}),url=new URL('index.html',process.env.APM_URL||'http://127.0.0.1:8000/').href;
try{for(const mobile of [false,true]){const context=await browser.newContext(mobile?{...devices['Pixel 7'],serviceWorkers:'block'}:{viewport:{width:1280,height:800},serviceWorkers:'block'});const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/data/v18-news.json',r=>r.fulfill({json:seed}));await page.route('**/data/v18-news-metadata.json',r=>r.fulfill({json:meta}));await page.route('**/data/v18-news-index.json',r=>r.fulfill({json:{schema:1,packs:[]}}));
 const click=action=>page.locator('[data-action="'+action+'"]').click(),save=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('apm-v18-protected-p1')));
 await page.goto(url);await click('lobby:career');await page.locator('#careermode').selectOption('staff');await page.locator('#startyear').selectOption('1960');await page.locator('#startform button[type=submit]').click();await page.locator('.v18-desk').waitFor();assert.equal(await page.locator('[data-group="government"]').count(),0);
 await click('v18:calendar:pace:fast');await click('v18:news:major');await click('v18:next');await page.locator('.v18-newspaper[data-v18-news="fixture-break-a"]').waitFor();assert.equal((await save()).v18.calendar.date,'1960-01-10');
 assert.equal(await page.locator('[data-news-id="fixture-future"]').count(),0);await page.reload();await click('lobby:career');await page.locator('.v18-newspaper[data-v18-news="fixture-break-a"]').waitFor();
 await click('v18:calendar:ack');await page.locator('.v18-newspaper[data-v18-news="fixture-break-b"]').waitFor();await click('v18:calendar:ack');assert.equal((await save()).v18.calendar.date,'1960-01-10');assert.equal((await save()).v18.calendar.newsArchive.length,4);
 await page.locator('.v18-news-center > [data-news-id="fixture-day"] button').click();await page.locator('[data-v18-news-detail="fixture-day"]').waitFor();assert.ok((await save()).v18.calendar.seenNews.includes('fixture-day'));await click('v18:news:close');
 await click('v18:news:major');await click('v18:next');await page.locator('.v18-major-news[data-v18-news="fixture-major-on"]').waitFor();assert.equal(await page.locator('.v18-newspaper').count(),0);await click('v18:calendar:ack');
 const filter=page.locator('[data-v18-news-filter]');if(!(await filter.isVisible()))await page.locator('.v18-news-center details > summary').click();await filter.locator('[name="query"]').fill('fixture-day');await filter.locator('button[type=submit]').click();await page.locator('.v18-news-center details [data-news-id="fixture-day"]').waitFor();assert.equal(await page.locator('.v18-news-center details [data-news-id]').count(),1);assert.deepEqual((await save()).elections,[]);assert.deepEqual(errors,[]);await context.close();
}}finally{await browser.close()}console.log('V18 news browser: tier gating, same-day reload, read and archive filter on desktop/mobile');
