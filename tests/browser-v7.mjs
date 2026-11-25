import {chromium} from 'playwright';import assert from 'node:assert/strict';
const browser=await chromium.launch({headless:true});
const url=process.env.APM_URL||'http://127.0.0.1:8000/';
const fixture=[{id:{bioguide:'A000001'},name:{first:'Fixture',last:'Alpha'},terms:[{start:'1963-01-03',end:'1965-01-03',type:'rep',state:'CA',party:'Democrat',district:1}]},{id:{bioguide:'B000001'},name:{first:'Fixture',last:'Beta'},terms:[{start:'1963-01-03',end:'1965-01-03',type:'rep',state:'CA',party:'Democrat',district:2}]}];
const geo={type:'FeatureCollection',features:[{type:'Feature',properties:{district:1},geometry:{type:'Polygon',coordinates:[[[0,0],[1,0],[1,1],[0,1],[0,0]]]}}]};
try{for(const viewport of [{width:1440,height:900},{width:390,height:844}]){
 const context=await browser.newContext({viewport,serviceWorkers:'block'});const page=await context.newPage();let errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/legislators-*.json',r=>r.fulfill({json:r.request().url().includes('historical')?fixture:[]}));
 await page.route('**/data/map-index.json',r=>r.fulfill({json:['GeoJson/California_088_to_088.geojson']}));
 await page.route('**/California_088_to_088.geojson',r=>r.fulfill({json:geo}));
 await page.route('**/gubernatorial_bios_final.csv',r=>r.fulfill({contentType:'text/csv',body:'state_territory,governor,party,years_in_office\nCalifornia,Fixture Governor,Democratic,1963-1965\n'}));
 await page.addInitScript(()=>{localStorage.setItem('apm-save-v1',JSON.stringify({schema:1,name:'Test',state:'CA',party:'Independent',year:1964,quarter:1,mode:'alternate',office:'rep',target:'rep',funds:40,energy:100,skill:20,support:25,network:10,age:30,termUntil:1966,points:0,actionsLeft:2,history:[],collection:[],reviews:[],legislation:[],elections:[]}))});
 await page.goto(url);await page.locator('[data-action="lobby:career"]').click();await page.locator('[data-group="collection"]').click();await page.locator('[data-person-open="A000001"]').waitFor();await page.locator('[data-person-open="A000001"]').click();await page.getByText('CAREER DOSSIER').waitFor();assert.equal(await page.locator('.peer-map').count(),1);
 await page.locator('[data-tab="states"]').click();await page.locator('.district-map path').waitFor();await page.locator('[data-state="NY"]').click();assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('apm-save-v1')).state),'CA');
 await page.locator('[data-group="government"]').click();await page.locator('[data-action="newbill:infra"]').click();for(const action of ['refer','hearing','markup','schedule','amend','amend','vote','vote','agree','present'])await page.locator('[data-action="bill:1:'+action+'"]').click();
 assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('apm-save-v1')).legislature.bills[0].result),'enacted');await page.screenshot({path:'v7-'+viewport.width+'.png',fullPage:true});assert.deepEqual(errors,[]);await context.close();
 }}finally{await browser.close()}