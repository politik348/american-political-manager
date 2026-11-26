// I1 authored encounters: dated archive reenactments, independent of generated live encounters.
export const isDate=v=>typeof v==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(v)&&!isNaN(Date.parse(v))&&new Date(v).toISOString().slice(0,10)===v;
const bilingual=x=>x&&typeof x.ko==='string'&&x.ko.trim()&&typeof x.en==='string'&&x.en.trim();
export function validScene(s){
 if(!s||!/^P0[12]-\d{3,4}$/.test(s.id)||!isDate(s.date)||s.fictional!==true||!bilingual(s.venue)||!bilingual(s.context)||!Array.isArray(s.cast)||!s.cast.length||!s.cast.every(c=>typeof c.name==='string'&&c.name.trim()&&(c.id===null||/^[A-Z]\d{6}$/.test(c.id))))return false;
 const turn=t=>bilingual(t)&&(/^(player|aide|host)$/.test(t.speaker)||(/^npc:\d+$/.test(t.speaker)&&Number(t.speaker.slice(4))<s.cast.length));
 const turns=v=>Array.isArray(v)&&v.length>0&&v.every(turn);
 const r=s.response,c=r?.choices;
 return turns(s.opening)&&s.opening.length>=2&&s.opening.length<=5&&bilingual(r)&&r.speaker==='player'&&['ko','en'].every(k=>r[k].split('{{blank}}').length===2)&&Array.isArray(c)&&c.length===4&&c.every(bilingual)&&new Set(c.map(x=>x.id)).size===4&&c.every(x=>/^[ABCD]$/.test(x.id))&&['ko','en'].every(k=>new Set(c.map(x=>x[k].trim())).size===4)&&c.some(x=>x.id===r.correct)&&turns(s.followup?.correct)&&turns(s.followup?.incorrect)&&Array.isArray(s.evidence)&&s.evidence.length>0&&s.evidence.every(e=>/^https:\/\//.test(e.url)&&isDate(e.asOf)&&e.asOf<=s.date&&(e.retrievedAt===undefined||isDate(e.retrievedAt)&&e.retrievedAt>=e.asOf))&&s.outcome&&typeof s.outcome.key==='string';
}
export function catalog(parts){
 const scenes=[],rejected=[],seen=new Set(),duplicates=[];
 for(const p of parts){if(p?.schema!==1||!Array.isArray(p.scenes))throw Error('Invalid pack');for(const s of p.scenes){if(seen.has(s.id)){duplicates.push(s.id);continue}seen.add(s.id);if(!validScene(s)||!s.id.startsWith(p.pack+'-')){rejected.push(s.id);continue}scenes.push(s)}}
 if(duplicates.length)throw Error('Duplicate scene IDs: '+duplicates.join(', '));
 return {scenes:scenes.sort((a,b)=>b.date.localeCompare(a.date)||a.id.localeCompare(b.id)),registered:seen.size,rejected};
}
export async function loadCatalog(fetcher=fetch,base='./data/dialogue-packs/'){
 const read=async path=>{let r=await fetcher(base+path);if(!r.ok)throw Error(path+' HTTP '+r.status);return r.json()};
 const m=await read('i1-index.json'),parts=[];
 if(!Array.isArray(m.parts)||new Set(m.parts).size!==m.parts.length||!m.parts.every(p=>/^P0[12]\/part-\d+\.json$/.test(p)))throw Error('Invalid manifest');
 for(let i=0;i<m.parts.length;i+=8)parts.push(...await Promise.all(m.parts.slice(i,i+8).map(read)));
 const audits=await Promise.all((m.appointmentAuditFiles||[]).map(p=>read(p).catch(()=>({records:[]}))));const appointmentChecks=Object.fromEntries(audits.flatMap(a=>a.records||[]).map(x=>[x.id,x]));
 return {...catalog(parts),chains:m.chains||[],photos:m.photos||[],appointmentPilot:[...new Set([...(m.appointmentPilot||[]),...Object.keys(appointmentChecks)])],appointmentChecks,dateHandoffIds:m.dateHandoffIds||m.appointmentPilot||[],archiveHorizon:m.archiveHorizon};
}
export function pilotBook(s){return s.i1Pilot||(s.i1Pilot={version:1,active:null,history:{},pack:'all',page:0})}
export function eligible(c,date,pack='all'){return c.scenes.filter(s=>s.date<=date&&(pack==='all'||s.id.startsWith(pack+'-')))}
export function startPilot(s,c,id,date){const v=c.scenes.find(x=>x.id===id&&x.date<=date);if(!v)return false;pilotBook(s).active={id,selected:null};return true}
export function answerPilot(s,c,choice,date){const b=pilotBook(s),a=b.active,v=c.scenes.find(x=>x.id===a?.id&&x.date<=date);if(!v||a.selected!==null||!v.response.choices.some(x=>x.id===choice))return false;a.selected=choice;a.correct=choice===v.response.correct;b.history[v.id]={correct:a.correct,sceneDate:v.date,playedAt:date,outcome:v.outcome.key,kind:a.kind||'archive'};
 const docs=b.documents||(b.documents={});docs[v.id]={key:v.outcome.key,sceneDate:v.date,playedAt:date,correct:a.correct};
 const contacts=b.archiveContacts||(b.archiveContacts={});for(const x of v.cast){if(!x.id)continue;const p=contacts[x.id]||(contacts[x.id]={id:x.id,name:x.name,scenes:{},appointments:{}});p.scenes[v.id]=v.date;if(a.kind==='appointment-archive')p.appointments[v.id]=date}
 return true}
export function chainIntro(s,c,v,date=v.date){const b=pilotBook(s),link=c.chains.find(x=>x.to===v.id),from=link&&c.scenes.find(x=>x.id===link.from);if(!from||from.date>=v.date||!from.cast.some(x=>x.id===link.person)||!v.cast.some(x=>x.id===link.person))return null;const prior=b.history[from.id];return prior&&prior.sceneDate===from.date&&prior.playedAt<=date?{ko:link.ko,en:link.en}:{ko:link.fallbackKo,en:link.fallbackEn}}
export function approvedPhoto(c,v,i){const p=c.photos.find(x=>x.sceneId===v.id&&x.castIndex===i&&x.id===v.cast[i]?.id&&x.name===v.cast[i]?.name);return p&&/^https:\/\//.test(p.url)&&/^https:\/\//.test(p.metadata)?p:null}

 // Optional dated archive invitation beside, not in place of, a generated encounter.
export function archiveDate(s,liveDate,horizon){return !s.politics?.active||s.politics.active.finished?s.year===2026&&s.quarter===4&&isDate(horizon)&&horizon.slice(0,4)==='2026'&&horizon>liveDate?horizon:liveDate:liveDate}
export function appointmentCore(c,v){
 if(!c.appointmentPilot?.includes(v.id))return false;
 if(c.dateHandoffIds?.includes(v.id))return true;
 const a=c.appointmentChecks?.[v.id];
 return !!a&&a.date===v.date&&a.learningTarget===v.learningTarget&&a.correct===v.response.correct&&a.answer===v.response.choices.find(x=>x.id===a.correct)?.en&&Array.isArray(a.cast)&&a.cast.length===v.cast.length&&a.cast.every((x,i)=>x.name===v.cast[i].name&&(!x.id||x.id===v.cast[i].id));
}
export function appointmentTerms(v,records,date){
 if(v.date>date||Date.parse(date)-Date.parse(v.date)>92*86400000)return null;
 const terms=v.cast.map(x=>records.get(x.id)?.terms?.filter(t=>['rep','sen'].includes(t.type)&&t.precision!=='year'&&isDate(t.start)&&isDate(t.end)&&t.start<=v.date&&t.end>=date)||[]);
 if(terms.some(t=>!t.length))return null;
 const chamber=v.id.startsWith('P01-')?'rep':'sen';return terms.some(ts=>ts.some(t=>t.type===chamber))?terms:null;
}
export function suggestPilot(s,c,people,date,slot,place='career'){
 const b=pilotBook(s);if(b.active||b.appointments?.[slot]||(s.encounters?.active?.slot===slot&&!s.encounters.active.closed&&s.encounters.active.selected===null)||!['career','congress','race','relations','party'].includes(place)||s.development?.retired)return null;
 const contacts=new Set([...Object.values(s.encounters?.contacts||{}),...Object.values(b.archiveContacts||{}).filter(x=>Object.keys(x.appointments||{}).length)].map(x=>x.id).filter(Boolean));
 const records=new Map(people.filter(p=>p.id&&!p.sample).map(p=>[p.id,p]));
 const candidates=c.scenes.filter(v=>{
  if(!appointmentCore(c,v)||b.history[v.id])return false;
  const terms=appointmentTerms(v,records,date);if(!terms)return false;
  const chamber=v.id.startsWith('P01-')?'rep':'sen';
  if(place==='congress'&&!['rep','sen'].includes(s.office))return false;
  if(place==='congress'&&s.office!==chamber&&!v.cast.some(x=>contacts.has(x.id)))return false;
  return terms.some(ts=>ts.some(t=>t.state===s.state))||v.cast.some(x=>contacts.has(x.id));
 });
 return candidates.sort((a,b)=>Number(b.cast.some(x=>contacts.has(x.id)))-Number(a.cast.some(x=>contacts.has(x.id)))||b.date.localeCompare(a.date)||a.id.localeCompare(b.id))[0]||null;
}
export function startSuggested(s,c,people,date,slot,place,id){
 const v=suggestPilot(s,c,people,date,slot,place);if(!v||v.id!==id||!startPilot(s,c,id,date))return false;
 const b=pilotBook(s);(b.appointments||(b.appointments={}))[slot]=id;b.active.kind='appointment-archive';return true;
}

// A display-size derivative of the exact approved Wikimedia file, not a new portrait.
export function portraitUrls(p){if(/^\.\/assets\/i1-approved-portraits\/[A-Z][0-9]{6}-[a-f0-9]{16}\.(jpg|png)$/.test(p.localPath||'')&&/^[a-f0-9]{64}$/.test(p.localSha256||'')&&p.localPath.includes('/'+p.id+'-'+p.localSha256.slice(0,16)+'.'))return [p.localPath];const primary=p.url;if(!p.displayDerivative)return [primary];try{const u=new URL(primary);const match=u.pathname.match(/^\/wikipedia\/commons\/([a-f0-9])\/([a-f0-9]{2})\/([^/]+\.(?:jpg|jpeg|png))$/i);if(u.hostname!=='upload.wikimedia.org'||!match)return [primary];const [,a,b,file]=match,thumb=u.origin+'/wikipedia/commons/thumb/'+a+'/'+b+'/'+file+'/330px-'+file;return [...new Set([thumb,primary,u.origin+u.pathname])]}catch{return [primary]}}
