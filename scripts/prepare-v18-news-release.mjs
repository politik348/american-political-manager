import fs from 'node:fs';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {buildNewsIndex,validatePack,validNews,categories,loadNewsRegistry} from '../v18-news.js';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const sha=x=>createHash('sha256').update(x).digest('hex');
const digest=x=>sha(JSON.stringify(x));
const norm=x=>String(x??'').normalize('NFKC').toLowerCase().replace(/[^\p{L}\p{N}]+/gu,' ').trim();
const pins=read('docs/audits/V18-NEWS-HQ-RELEASE-PINS.json'),seed=read('data/v18-news.json');
const currentMeta=read('data/v18-news-metadata.json');
const approvedSeed=Object.fromEntries(seed.events.map(n=>[n.id,currentMeta.events[n.id]]));
const exclusions=new Map(pins.articleHoldIds.map(id=>[id,{id,disposition:'HOLD',reason:'Independent R2 audit did not clear exact event date and claims; preserve source record.'}]));
const manifest={schema:1,status:'STAGING_CANDIDATE_NOT_USER_APPROVED',packs:[],excluded:[]}, metadata={schema:1,events:{...approvedSeed}}, all=[...seed.events],rows=[],auditRows=[],errors=[];
const categoryMap={election:'election',elections:'election',legislation:'legislation',congress:'legislation',amendment:'legislation',judiciary:'judiciary',executive:'government',appointment:'government',appointments:'government',personnel:'government',presidency:'government',institution:'government',administration:'government',oversight:'government',investigation:'government',ethics:'government',leadership:'party',party:'party',state_politics:'government',movement:'society',social:'society',civil_rights:'society',labor:'society',prohibition:'society',economy:'economy',foreign:'foreign',foreign_policy:'foreign',policy:'other'};
// HQ editorial overrides after reading the dated producer audit facts, not a numeric quota.
const presidentialElections=new Set(["N01-0096","N02-0023","N03-0010","N03-0027","N03-0037","N03-0046","N03-0091","N05-0020","N05-0037","N05-0055","N05-0091","N06-0089"]),presidentialOaths=new Set(["N01-0186","N02-0018","N02-0090","N02-0113","N03-0028","N03-0236","N04-0154","N04-0199","N05-0209"]);
function classify(n,a){
 if(presidentialElections.has(n.id))return {tier:1,category:'election',reason:'HQ reviewed: actual presidential general election'};
 if(presidentialOaths.has(n.id))return {tier:1,category:'government',reason:'HQ reviewed: actual presidential oath or succession'};
 const h=n.en.toLowerCase(), full=(n.en+' '+n.bodyEn).toLowerCase();
 const routine=/\b(introduc\w*|propos\w*|refer\w*|committee|hearings?|reports?|amendment|cloture|motion|procedural|debate|resolution|filibuster)\b/.test(h)&&!/\b(constitutional|ratifi\w*|(?:\d+(?:st|nd|rd|th)) amendment|constitutional amendment)\b/.test(h);
 const national=/\b(presidential election|president(?:ial)? (?:inaugurat\w*|resign\w*|dies|assassinat\w*)|takes office|inaugurat\w*|electoral college|president.*(?:elected|sworn in|resigns)|(?:amendment|constitution).*ratifi\w*|(?:war|attack|invasion).*declared|declar\w* war|pearl harbor|september 11|watergate|great depression|stock market crash)\b/.test(h);
 const landmark=/\b(civil rights act|voting rights act|social security act|medicare|medicaid|new deal|affordable care act|brown v\.|roe v\.|dobbs|shelby county|oberg\w*|obergefell|americans with disabilities act|gi bill|marshall plan|nato|emancipation|federal reserve act|national labor relations act|patriot act|cares act|inflation reduction act)\b/.test(h)&&/\b(sign\w*|enact\w*|ratif\w*|pass\w*|rul\w*|decid\w*|strikes|overturn\w*|becomes law|establish\w*|upholds|adopt\w*)\b/.test(h);
 const final=/\b(sign\w*|enact\w*|becomes law|final passage|pass\w*|veto\w*|overrid\w*|confirm\w*|appoint\w*|rul\w*|decid\w*|elect\w*|resign\w*|inaugurat\w*|ratifi\w*|acquit\w*|convict\w*|impeach\w*|adopt\w*)\b/.test(h);
 const raw=String(a.category||'').toLowerCase().replace(/\s+/g,'_');
 let category=categoryMap[raw];
 if(!category||category==='other'){
  category=/\b(supreme court|court|justice|judg\w*|v\.)\b/.test(h)?'judiciary':/\b(election|electoral|primary|nomination|votes for president)\b/.test(h)?'election':/\b(bill|law|act|amendment|senate|house|congress|cloture|roll call|veto)\b/.test(h)?'legislation':/\b(treaty|war|foreign|nato|united nations|diplom\w*)\b/.test(h)?'foreign':/\b(party|convention|caucus)\b/.test(h)?'party':/\b(strike|protest|march|rights|suffrage)\b/.test(h)?'society':/\b(bank|tariff|econom\w*|recession|market)\b/.test(h)?'economy':/\b(president|cabinet|governor|administration|secretary)\b/.test(h)?'government':'other';
 }
 const tier=!routine&&(national||landmark)?1:routine?3:final||Number(a.tierCandidate)===1||Number(a.tierCandidate)===2||category!=='other'?2:3;
 return {tier,category,reason:!routine&&national?'national milestone':!routine&&landmark?'landmark final action':routine?'intermediate process':final?'substantive final action':'substantive or routine context'};
}
const auditPath=t=>'docs/audits/V18-NEWS-Q'+t+'-R2-REAUDIT.json';
function hashes(team,j){
 const data=team==='N05'?read('docs/audits/V18-NEWS-QN05-REAUDIT.json').integrity.records:
  [j.integrity,j.integrity?.allArticleHashes,j.integrityInventory,j.integrity?.articleHashes,j.allContentHashes].find(a=>Array.isArray(a)&&a.length===250);
 assert.equal(data?.length,250,team+' complete hash inventory');
 const m=new Map(data.map(x=>[x.id,String(x.currentHash??x.afterHash??x.afterContentHash??x.afterSHA256??x.sha256??'').replace(/^sha256:/,'')]));
 assert.equal(m.size,250);for(const h of m.values())assert.match(h,/^[a-f0-9]{64}$/);return m;
}
for(const pin of pins.teams){
 const t=pin.team,j=read(auditPath(t)),actual=j.latestProductionSha??j.productionSha??j.latestProducerHead;
 assert.equal(actual,pin.productionSha,t+' R2 production pin');const inventory=hashes(t,j);
 const eligible=j.summary?.eligibleArticles??j.summary?.articleReleaseEligible??j.articleEligibility?.eligible??j.summary?.articleEligible??j.summary?.newsArticleEligibleSubjectToHQ;
 const teamHolds=[...exclusions.keys()].filter(id=>id.startsWith(t+'-'));
 assert.equal(eligible,250-teamHolds.length,t+' R2 eligibility');
 const a=read('docs/audits/V18-NEWS-'+t+'-AUDIT.json'),audits=a.records||a.events,map=new Map(audits.map(x=>[x.id,x]));assert.equal(map.size,250);
 const independent=read('docs/audits/V18-NEWS-Q'+t+'-INDEPENDENT-AUDIT.json'),indRows=independent.records||independent.events||independent.entries;
 assert.equal(new Set(indRows.map(x=>x.id)).size,250,t+' original audit inventory');
 for(let i=1;i<=10;i++){
  const path='v18-news-packs/'+t+'/part-'+String(i).padStart(2,'0')+'.json',raw=fs.readFileSync('data/'+path,'utf8'),ns=validatePack(JSON.parse(raw),path);
  manifest.packs.push({path,sha256:sha(raw),approval:'independently-reviewed',reviewRef:'https://github.com/politik348/american-political-manager/blob/'+pin.auditSha+'/'+auditPath(t)});
  for(const n of ns){
   const h=digest(n);assert.equal(h,inventory.get(n.id),'R2 hash mismatch '+n.id);
   const rec=map.get(n.id);assert.ok(rec&&rec.date===n.date&&(rec.confirmedDate??rec.date)===n.date&&rec.source===n.source&&(rec.confirmedFact??rec.confirmedFacts??rec.verifiedFacts),'Producer audit mismatch '+n.id);
   const decision=classify(n,rec);all.push(n);
   if(exclusions.has(n.id)){Object.assign(exclusions.get(n.id),{sha256:h,reviewRef:manifest.packs.at(-1).reviewRef});}
   else metadata.events[n.id]={tier:decision.tier,category:decision.category};
   rows.push({id:n.id,date:n.date,sha256:h,source:n.source,disposition:exclusions.has(n.id)?'HOLD':'ELIGIBLE_SUBJECT_TO_HQ',tier:decision.tier,category:decision.category,editorialReason:decision.reason,productionSha:pin.productionSha,auditSha:pin.auditSha});
  }
 }
 auditRows.push({team:t,articleHashesMatched:250,producerAuditsMatched:250,independentAuditInventory:250,eligible,hold:teamHolds});
}
assert.equal(manifest.packs.length,70);assert.equal(all.length,1769);assert.equal(new Set(all.map(n=>n.id)).size,1769);
manifest.excluded=[...exclusions.values()];for(const x of manifest.excluded)assert.match(x.sha256,/^[a-f0-9]{64}$/);
// All exact and near-title/body candidates are logged, not silently removed. Different procedural stages remain distinct.
const stop=new Set('the a an of in on to for and by with as at is was were are be that this it from its'.split(' '));
const tokens=x=>new Set(norm(x).split(' ').filter(w=>w.length>2&&!stop.has(w)));
const sim=(a,b)=>{const intersection=[...a].filter(x=>b.has(x)).length;return intersection/Math.max(1,a.size+b.size-intersection)};
const candidates=[],exact=[],ordered=all.map(n=>({...n,days:Date.parse(n.date)/864e5,title:tokens(n.en),body:tokens(n.bodyEn)})).sort((a,b)=>a.days-b.days);
for(let i=0;i<ordered.length;i++)for(let k=i+1;k<ordered.length;k++){
 const a=ordered[i],b=ordered[k],delta=b.days-a.days, sameTitle=norm(a.en)===norm(b.en)||norm(a.ko)===norm(b.ko);
 if(delta>7&&!sameTitle)continue;
 const ts=sim(a.title,b.title),bs=sim(a.body,b.body);
 if(delta===0&&sameTitle)exact.push({a:a.id,b:b.id});
 if(sameTitle||delta===0&&(ts>=.45||bs>=.55||a.source===b.source)||delta<=7&&(ts>=.72||bs>=.72)){
  candidates.push({a:a.id,b:b.id,dateA:a.date,dateB:b.date,headlineA:a.en,headlineB:b.en,titleSimilarity:+ts.toFixed(3),bodySimilarity:+bs.toFixed(3),sameSource:a.source===b.source,reason:sameTitle?'same normalized title':delta===0?'same-date candidate':'near-date text similarity'});
 }
}
const semantic=read('docs/audits/V18-NEWS-HQ-SEMANTIC-REVIEW.json'),pairKey=x=>[x.a,x.b].sort().join('|'),decisions=new Map(semantic.decisions.map(x=>[pairKey(x),x]));assert.equal(decisions.size,semantic.decisions.length);assert.equal(decisions.size,candidates.length,'Semantic decision inventory changed');for(const c of candidates){const d=decisions.get(pairKey(c));assert.ok(d?.disposition==='DISTINCT_RETAIN_BOTH'&&d.reason,'Unreviewed pair '+pairKey(c));c.review=d.disposition;c.reviewReason=d.reason;}
const live=all.filter(n=>!exclusions.has(n.id));
const idx=buildNewsIndex(live,metadata.events);assert.equal(idx.rows.length,1768);
const tierCounts={1:0,2:0,3:0};for(const n of idx.rows)tierCounts[n.tier]++;
// Roster cross-reference screening: only exact full-name matches, never infer positions or publish new links.
const rosterFiles=['data/legislators-historical.json','data/legislators-current.json','data/historical-people.json'];
const roster=new Map();for(const path of rosterFiles){const data=read(path);for(const p of (Array.isArray(data)?data:data.people||[])){const id=p.id?.bioguide||p.id,name=typeof p.name==='string'?p.name:p.name?.official_full||[p.name?.first,p.name?.last].filter(Boolean).join(' ');if(typeof id==='string'&&name&&p.terms?.length)roster.set(id,{id,name,terms:p.terms});}}
const nameMatches=[];const names=[...roster.values()].filter(p=>norm(p.name).split(' ').length>=2).map(p=>({...p,key:' '+norm(p.name)+' '}));
for(const n of live){const body=' '+norm(n.en+' '+n.bodyEn)+' ';for(const p of names){if(!body.includes(p.key))continue;const terms=p.terms.filter(t=>t.start&&t.end&&t.start<=n.date&&t.end>=n.date);nameMatches.push({newsId:n.id,personId:p.id,name:p.name,date:n.date,matchingTerms:terms.map(t=>({type:t.type,start:t.start,end:t.end,precision:t.precision??null})),status:terms.length?'DATE_RANGE_MATCH_REVIEW_ROLE':'NO_DATED_TERM_MATCH_REVIEW'});}}
for(const n of idx.rows)for(const p of n.people){const match=roster.get(p.id);assert.ok(match&&match.terms.some(t=>t.start<=n.date&&t.end>=n.date),'Existing person link date mismatch '+n.id);}
const report={schema:1,status:'STAGING_CANDIDATE_NOT_USER_APPROVED',pins,counts:{preserved:all.length,eligibleNew:1749,proposedRuntime:idx.rows.length,hold:manifest.excluded.length,packCount:manifest.packs.length,articleHashesMatched:rows.length},tierCounts,exactTitleDateDuplicates:exact,semanticCandidateCount:candidates.length,semanticCandidates:candidates,roster:{uniquePeople:roster.size,exactNameDateScreenedMatches:nameMatches.length,withDateTerm:nameMatches.filter(x=>x.matchingTerms.length).length,withoutDateTerm:nameMatches.filter(x=>!x.matchingTerms.length).length,candidates:nameMatches,limitation:'Full-name/date-range screen only; historical office claims and aliases require human review; no new person links published.'},auditRows,articles:rows,legislation:{playableApproved:0,release:'HOLD',rawMetadataPreserved:true,newLinksPublished:0},limits:['No new historical source verification claimed; carried forward pinned independent audit verdicts.','All 86 heuristic duplicate candidates were reviewed by dates/headlines; close procedural pairs by original bodies. Unflagged pairs and underlying historical sources were not manually re-audited.','Tier classification is a uniform provisional editorial rule, not a historical fact.','No unverified legislative dossiers or new person links included.']};
assert.equal(exact.length,0,'Exact duplicate candidates require explicit disposition');
const files={'data/v18-news-index.json':manifest,'data/v18-news-metadata.json':metadata,'docs/audits/V18-NEWS-HQ-RELEASE-MANIFEST.json':report};
for(const [p,v] of Object.entries(files)){const raw=JSON.stringify(v,null,2)+'\n';if(process.argv.includes('--write'))fs.writeFileSync(p,raw);else if(process.argv.includes('--check'))assert.equal(fs.readFileSync(p,'utf8'),raw,p+' differs from deterministic manifest');}
const start=performance.now();const actual=await loadNewsRegistry(async p=>{const file=p.replace(/^\.\//,'');return {ok:fs.existsSync(file),text:async()=>fs.readFileSync(file,'utf8')}});assert.equal(actual.rows.length,1768);assert.ok(!actual.byId.has('N01-0244'));assert.ok(actual.rows.every((n,i)=>!i||actual.rows[i-1].date<=n.date));
console.log('REAL_REGISTRY '+JSON.stringify({counts:report.counts,tierCounts,exactDuplicates:exact.length,semanticCandidates:candidates.length,roster:{people:roster.size,matched:report.roster.exactNameDateScreenedMatches,withTerm:report.roster.withDateTerm,withoutTerm:report.roster.withoutDateTerm},actualLoadMs:Math.round(performance.now()-start),legislation:report.legislation}));
console.log('REVIEW_CANDIDATES '+JSON.stringify(candidates.slice(0,40)));
