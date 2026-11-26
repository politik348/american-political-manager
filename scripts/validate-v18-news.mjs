import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {buildNewsIndex,validatePack,packPattern,validNews,teamRanges,validMetadata,https} from '../v18-news.js';
const root=fileURLToPath(new URL('../',import.meta.url)),argv=process.argv.slice(2);
const full=argv.includes('--full'),release=argv.includes('--release'),errors=[],warnings=[];
const read=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
const exists=p=>fs.existsSync(path.join(root,p));
const sha=s=>createHash('sha256').update(s).digest('hex');
const seed=read('data/v18-news.json'),manifest=read('data/v18-news-index.json'),meta=read('data/v18-news-metadata.json');
if(seed.schema!==1||manifest.schema!==1||meta.schema!==1||!Array.isArray(manifest.packs))throw Error('Invalid base registry');
const entries=[],approved=new Map(),all=[...seed.events],seenIDs=new Set(seed.events.map(n=>n.id)),auditIDs=new Map(),possible=[],packFiles=new Map();
const auditStatus=r=>r.status||r.verificationStatus;
const titleKey=s=>s.normalize('NFKC').toLowerCase().replace(/[^\p{L}\p{N}]+/gu,' ').trim();
const tokens=s=>new Set(titleKey(s).split(' ').filter(w=>w.length>2));
const similarity=(a,b)=>{const A=tokens(a),B=tokens(b);return [...A].filter(x=>B.has(x)).length/Math.max(1,new Set([...A,...B]).size)};
const recordError=(msg)=>errors.push(msg);
for(const p of manifest.packs){if(!packPattern.test(p.path)||approved.has(p.path)||p.approval!=='independently-reviewed'||typeof p.reviewRef!=='string'||!p.reviewRef.trim()||!/^[a-f0-9]{64}$/.test(p.sha256)){recordError('Invalid approval entry '+p.path);continue}approved.set(p.path,p)}
for(const [team,range] of Object.entries(teamRanges)){
 const dir='data/v18-news-packs/'+team,auditPath='docs/audits/V18-NEWS-'+team+'-AUDIT.json';
 const files=exists(dir)?fs.readdirSync(path.join(root,dir)).filter(f=>/^part-.*\.json$/.test(f)).sort():[];
 let audits=[];if(files.length){try{const a=read(auditPath);audits=a.records||a.events||[];if(a.schema!==1||a.team!==team||!Array.isArray(audits))throw Error('Invalid audit')}catch(e){recordError(team+' audit unavailable: '+e.message)}}
 const map=new Map();for(const a of audits){if(map.has(a.id))recordError(team+' duplicate audit '+a.id);map.set(a.id,a)}
 let count=0,matched=0;const local=new Set();for(const f of files){const rel='v18-news-packs/'+team+'/'+f;try{const raw=fs.readFileSync(path.join(root,'data',rel),'utf8'),rows=validatePack(JSON.parse(raw),rel);packFiles.set(rel,{raw,rows});if(rows.some((n,i)=>i&&rows[i-1].date>n.date))warnings.push(rel+' not date-sorted; runtime index sorts globally');
 for(const n of rows){count++;if(seenIDs.has(n.id))recordError('Global ID duplicate '+n.id);seenIDs.add(n.id);local.add(n.id);all.push(n);const a=map.get(n.id);const confirmed=a?.confirmedDate??a?.date;const fact=a?.confirmedFact??a?.confirmedFacts??a?.verifiedFacts;if(!a||a.date!==n.date||confirmed!==n.date||a.source!==n.source||auditStatus(a)!=='verified'||!fact){recordError('Audit mismatch '+n.id)}else {matched++;auditIDs.set(n.id,a)}}
 }catch(e){recordError(rel+': '+e.message)}}
 for(const id of map.keys())if(!local.has(id))recordError('Audit without event '+id);
 entries.push({team,range,packs:files.length,count,matched});if(full&&(files.length!==10||count!==250))recordError(team+' incomplete full batch');
}
for(const n of seed.events)if(!validNews(n))recordError('Invalid seed '+n.id);
const byDate=new Map();for(const n of all){const prior=byDate.get(n.date)||[];for(const p of prior){const exact=titleKey(n.en)===titleKey(p.en)||titleKey(n.ko)===titleKey(p.ko);const near=similarity(n.en,p.en)>=.5||n.source===p.source;if(exact)recordError('Same-date headline duplicate '+p.id+' / '+n.id);else if(near)possible.push({date:n.date,a:p.id,b:n.id,headlineA:p.en,headlineB:n.en,reason:n.source===p.source?'same source/date':'similar wording'})}prior.push(n);byDate.set(n.date,prior)}
const live=[...seed.events];for(const [rel,p] of approved){const f=packFiles.get(rel);if(!f){recordError('Approved pack absent '+rel);continue}if(sha(f.raw)!==p.sha256)recordError('Approved digest mismatch '+rel);for(const n of f.rows){if(!auditIDs.has(n.id))recordError('Approved news lacks matching audit '+n.id);if(!meta.events[n.id])recordError('Missing approved metadata '+n.id);live.push(n)}}
if(release&&approved.size!==packFiles.size)recordError('Release includes unapproved or missing packs');
if(full&&packFiles.size!==70)recordError('Expected 70 valid packs, found '+packFiles.size);
if(full&&all.length!==1769)recordError('Expected 1769 rows, found '+all.length);
try{const index=buildNewsIndex(live,meta.events);const tierCounts={1:0,2:0,3:0};for(const n of index.rows)tierCounts[n.tier]++;console.log('Runtime registry '+JSON.stringify({approvedPacks:approved.size,events:index.rows.length,tierCounts,sorted:index.rows.every((n,i)=>!i||index.rows[i-1].date<=n.date)}))}catch(e){recordError('Registry: '+e.message)}
// A related bill is an explicit canonical congress + number key, not a fabricated legislative scenario.
for(const [id,m] of Object.entries(meta.events)){const n=all.find(n=>n.id===id);if(!n||!validMetadata(m,n)){recordError('Invalid link metadata '+id);continue}for(const x of m.bills||[]){const key='us-'+x.congress+'-'+x.number.toLowerCase().replace(/[^a-z0-9]/g,'');if(x.id!==key)recordError('Noncanonical bill reference '+id+' '+x.id)}}
console.log(JSON.stringify({seed:seed.events.length,teams:entries,total:all.length,packCount:packFiles.size,approvalCount:approved.size,auditMatched:auditIDs.size,semanticReviewCandidates:possible,warnings,errors,limits:'Automated syntax/audit consistency only. Does not independently verify historical facts, sources or semantic duplicates. Review all candidates before approval.'},null,2));
if(errors.length)process.exitCode=1;
