import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {portraitUrls,approvedPhoto,chainIntro,appointmentTerms} from '../i1-pilot.js';
const root=new URL('../',import.meta.url),read=p=>JSON.parse(fs.readFileSync(new URL(p,root),'utf8'));
test('I1 R5 local originals have exact approved paths and SHA-256 provenance',()=>{
 const m=read('data/dialogue-packs/i1-index.json'),policy=read('docs/I1-R5-PORTRAIT-LOCAL-POLICY.json'),local=m.photos.filter(p=>p.localPath);
 const ledger=local.length?read('assets/i1-approved-portraits/manifest.json').assets:[];
 assert.equal(new Set(m.photos.map(x=>x.id)).size,m.photos.length);
 for(const p of local){const a=policy.approved.find(x=>x.id===p.id),l=ledger.find(x=>x.id===p.id);assert.ok(a&&l,p.id);for(const k of ['url','metadata','credit','rights','date','sceneId'])assert.deepEqual(p[k],a[k],p.id+':'+k);assert.deepEqual(portraitUrls(p),[p.localPath]);assert.equal(l.localPath,p.localPath);const data=fs.readFileSync(new URL(p.localPath,root));assert.equal(createHash('sha256').update(data).digest('hex'),p.localSha256);assert.equal(l.sha256,p.localSha256);assert.equal(data.length,l.bytes);assert.ok((data[0]===255&&data[1]===216)||data.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])));}
 console.log('I1 R5 local original readiness '+JSON.stringify({registered:m.photos.length,local:local.length,priorityComplete:policy.required.every(id=>local.some(p=>p.id===id))}));
});
test('I1 R5 unresolved cast cannot receive a photo, chain or appointment even with malicious null record',()=>{
 const from={id:'P01-001',date:'2020-01-01',cast:[{id:null,name:'Unknown'}]},to={id:'P01-002',date:'2020-02-01',cast:[{id:null,name:'Unknown'}]},c={scenes:[from,to],photos:[{sceneId:to.id,castIndex:0,id:null,name:'Unknown',url:'https://example.org/image.jpg',metadata:'https://example.org'}],chains:[{from:from.id,to:to.id,person:null,ko:'x',en:'x',fallbackKo:'x',fallbackEn:'x'}]};
 assert.equal(approvedPhoto(c,to,0),null);assert.equal(chainIntro({},c,to),null);assert.equal(appointmentTerms(to,new Map([[null,{terms:[{type:'rep',state:'CA',start:'2019-01-01',end:'2021-01-01'}]}]]),'2020-02-15'),null);
});

test('I1 R5 editorial accounting retains prior unique applications and avoids double credit',()=>{
 const prev=['I1-Q4-PILOT-REPORT','I1-R2-Q4-BATCH-A','I1-R2-Q4-BATCH-B','I1-R2-Q4-BATCH-C','I1-R3-Q4-A','I1-R3-Q4-B','I1-R3-Q4-C','I1-R3-Q4-D','I1-R4-Q4-BATCH-A','I1-R4-Q4-BATCH-A2','I1-R4-Q4-BATCH-B','I1-R4-Q4-BATCH-C','I1-R4-Q4-BATCH-D'].flatMap(p=>read('docs/'+p+'.json').applied);
 const rows=['P01-P0','P01-BATCH-A','P01-BATCH-B','P01-BATCH-C','P01-BATCH-D','P01-BATCH-E','P01-BATCH-F','P01-BATCH-G','P01-HOLDS','P01-BATCH-H','P01-BATCH-I'].flatMap(p=>read('docs/I1-R5-'+p+'.json').applied);
 const senate=['P02-BATCH-B','P02-BATCH-C'].flatMap(p=>read('docs/I1-R5-'+p+'.json').applied);
 const prevIds=new Set(prev.map(x=>x.id)), ids=new Set(rows.map(x=>x.id));assert.equal(prevIds.size,546);assert.equal(rows.length,261);assert.equal(ids.size,261);assert.ok(rows.every(x=>!prevIds.has(x.id)));assert.equal(rows.filter(x=>x.partial).length,22);assert.equal(new Set(senate.map(x=>x.id)).size,95);
 console.log('I1 R5 editorial accounting '+JSON.stringify({p01Prior:prevIds.size,p01New:ids.size,p01Total:prevIds.size+ids.size,partial:rows.filter(x=>x.partial).length,p02New:senate.length}));
});
