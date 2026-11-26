import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {performance} from 'node:perf_hooks';
import {newGame} from '../engine.js';
import {calendar18,continueCalendar,ackNews,currentEvent,setPace} from '../v18-calendar.js';
import {buildNewsIndex,loadNewsRegistry,sha256,searchNews,newsOnDate,markNews,visibleLinks,teamRanges,validatePack,validDate} from '../v18-news.js';
const read=p=>JSON.parse(fs.readFileSync(new URL('../data/'+p,import.meta.url)));
const seed=read('v18-news.json'),seedMeta={schema:1,events:Object.fromEntries(seed.events.map(n=>[n.id,read('v18-news-metadata.json').events[n.id]]))};
const row=(id,date)=>({id,date,ko:'테스트 '+id,en:'Synthetic '+id,bodyKo:'검증 전용 가상 자료',bodyEn:'Test-only fixture, not historical content',source:'https://example.invalid/test',precision:'day',historical:true});
const meta=(tier=3)=>({tier,category:'other'});
const game=()=>newGame('Test','CA','Independent',1960,'staff');
test('tier 1 always interrupts; tier 2 optional; daily news automatically archived; same-day queue survives reload',()=>{
 const rows=[row('daily','1960-01-03'),row('major-off','1960-01-05'),row('break-a','1960-01-10'),row('break-b','1960-01-10'),row('major-on','1960-01-12'),row('future','1960-01-20')];
 const m={daily:meta(3),'major-off':meta(2),'break-a':meta(1),'break-b':meta(1),'major-on':meta(2),future:meta(3)},idx=buildNewsIndex(rows,m);
 let s=game(),c=calendar18(s);setPace(s,'fast');c.stopMajor=false;assert.ok(continueCalendar(s,idx,null));assert.equal(c.date,'1960-01-10');assert.equal(c.pending.id,'break-a');assert.equal(c.newsArchive.length,4);assert.equal(searchNews(c,idx,{unread:true}).length,4);assert.equal(searchNews(c,idx,{query:'future'}).length,0);
 assert.ok(markNews(c,idx,'daily'));assert.equal(markNews(c,idx,'future'),false);assert.equal(continueCalendar(s,idx,null),false);s=JSON.parse(JSON.stringify(s));c=calendar18(s);assert.ok(ackNews(s,idx));assert.equal(currentEvent(s,idx).id,'break-b');assert.ok(ackNews(s,idx));assert.equal(currentEvent(s,idx),null);assert.equal(c.newsArchive.length,4);c.stopMajor=true;assert.ok(continueCalendar(s,idx,null));assert.equal(c.date,'1960-01-12');assert.equal(c.pending.id,'major-on');assert.ok(ackNews(s,idx));assert.deepEqual(searchNews(c,idx,{tier:'2'}).map(n=>n.id),['major-on','major-off']);assert.deepEqual(s.elections,[]);assert.deepEqual(s.legislation,[]);
});
test('links are dated, canonical and hidden from earlier search; old save archive migrates without backfill',()=>{
 const m={tier:3,category:'legislation',bills:[{id:'us-88-hr7152',number:'H.R. 7152',congress:88,stage:'enacted',availableOn:'1960-01-15',source:'https://example.invalid/bill',verified:true}]};
 const idx=buildNewsIndex([row('old','1959-01-01'),row('current','1960-01-01'),row('future','1960-01-20')],{current:m});const s=game(),c=calendar18(s);delete c.newsCursor;delete c.stopMajor;c.newsArchive=[{id:'old',date:'1959-01-01'},{id:'current',date:'1960-01-01'}];c.seenNews=['old'];assert.equal(calendar18(s).newsCursor,'1960-01-01');assert.equal(calendar18(s).stopMajor,true);assert.equal(visibleLinks(idx.byId.get('current'),c.date).bills.length,0);assert.equal(searchNews(c,idx,{query:'7152'}).length,0);c.date='1960-01-15';assert.equal(searchNews(c,idx,{query:'7152'}).length,1);assert.equal(searchNews(c,idx,{unread:true}).length,1);
});
test('invalid dates, duplicate IDs, wrong era, unverified links and orphan metadata rejected',()=>{
 assert.equal(validDate('1960-02-30'),false);assert.throws(()=>buildNewsIndex([row('x','1960-01-01'),row('x','1960-01-02')]));assert.throws(()=>buildNewsIndex([row('x','2026-12-31')]));assert.throws(()=>buildNewsIndex([row('x','1960-01-01')],{orphan:meta()}));assert.throws(()=>buildNewsIndex([row('x','1960-01-01')],{x:{tier:3,category:'other',people:[{id:'fake',name:'Fake',availableOn:'1960-01-01',source:'https://example.invalid',verified:false}]}}));assert.throws(()=>validatePack({schema:1,events:[row('N01-0001','1960-01-01')]},'v18-news-packs/N01/part-01.json'));
});
test('70 approved synthetic packs / 1,769 total rows load, index, search; unapproved and changed files fail closed',async()=>{
 const files=new Map(),metadata=structuredClone(seedMeta),manifest={schema:1,packs:[]};for(const [team,[lo,hi]] of Object.entries(teamRanges)){for(let p=1;p<=10;p++){const path='v18-news-packs/'+team+'/part-'+String(p).padStart(2,'0')+'.json',events=[];for(let j=1;j<=25;j++){const i=(p-1)*25+j,id=team+'-'+String(i).padStart(4,'0'),year=lo+(i%(hi-lo+1)),n=row(id,year+'-01-'+String(1+i%28).padStart(2,'0'));events.push(n);metadata.events[id]=meta(1+i%3)}events.sort((a,b)=>a.date.localeCompare(b.date));const raw=JSON.stringify({schema:1,coverage:'TEST ONLY',events});files.set(path,raw);manifest.packs.push({path,sha256:await sha256(raw),approval:'independently-reviewed',reviewRef:'SYNTHETIC_TEST_ONLY'})}}
 files.set('v18-news.json',JSON.stringify(seed));files.set('v18-news-metadata.json',JSON.stringify(metadata));files.set('v18-news-index.json',JSON.stringify(manifest));const fetcher=async path=>{const v=files.get(path.replace('./data/',''));return {ok:v!==undefined,text:async()=>v}};
 const start=performance.now(),idx=await loadNewsRegistry(fetcher);assert.equal(manifest.packs.length,70);assert.equal(idx.rows.length,1769);assert.equal(idx.byId.size,1769);assert.equal(idx.rows.filter(n=>n.id.startsWith('N07')).length,250);assert.ok(idx.rows.every((n,i)=>!i||idx.rows[i-1].date<=n.date));const c={date:'2026-11-26',newsCursor:'1900-01-01',seenNews:[],newsArchive:idx.rows.map(n=>({id:n.id,date:n.date}))};assert.equal(searchNews(c,idx,{query:'N07-0250'}).length,1);assert.ok(searchNews(c,idx,{year:'1960'}).length>0);console.log('Synthetic 70-pack benchmark: '+Math.round(performance.now()-start)+'ms (in-memory, not network)');
 const first=manifest.packs[0];files.set(first.path,files.get(first.path)+' ');await assert.rejects(loadNewsRegistry(fetcher),/digest mismatch/);first.approval='team-verified';files.set('v18-news-index.json',JSON.stringify(manifest));await assert.rejects(loadNewsRegistry(fetcher),/Unapproved pack/);
});
