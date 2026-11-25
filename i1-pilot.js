// I1 authored encounters: dated archive reenactments, independent of generated live encounters.
export const isDate=v=>typeof v==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(v)&&!isNaN(Date.parse(v))&&new Date(v).toISOString().slice(0,10)===v;
const bilingual=x=>x&&typeof x.ko==='string'&&x.ko.trim()&&typeof x.en==='string'&&x.en.trim();
export function validScene(s){
 if(!s||!/^P0[12]-\d{3,4}$/.test(s.id)||!isDate(s.date)||s.fictional!==true||!bilingual(s.venue)||!bilingual(s.context)||!Array.isArray(s.cast)||!s.cast.length||!s.cast.every(c=>typeof c.name==='string'&&c.name.trim()&&(c.id===null||/^[A-Z]\d{6}$/.test(c.id))))return false;
 const turn=t=>bilingual(t)&&(/^(player|aide|host)$/.test(t.speaker)||(/^npc:\d+$/.test(t.speaker)&&Number(t.speaker.slice(4))<s.cast.length));
 const turns=v=>Array.isArray(v)&&v.length>0&&v.every(turn);
 const r=s.response,c=r?.choices;
 return turns(s.opening)&&s.opening.length>=2&&s.opening.length<=5&&bilingual(r)&&r.speaker==='player'&&['ko','en'].every(k=>r[k].split('{{blank}}').length===2)&&Array.isArray(c)&&c.length===4&&c.every(bilingual)&&new Set(c.map(x=>x.id)).size===4&&c.every(x=>/^[ABCD]$/.test(x.id))&&['ko','en'].every(k=>new Set(c.map(x=>x[k].trim())).size===4)&&c.some(x=>x.id===r.correct)&&turns(s.followup?.correct)&&turns(s.followup?.incorrect)&&Array.isArray(s.evidence)&&s.evidence.length>0&&s.evidence.every(e=>/^https:\/\//.test(e.url)&&isDate(e.asOf)&&e.asOf<=s.date)&&s.outcome&&typeof s.outcome.key==='string';
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
 return {...catalog(parts),chains:m.chains||[],photos:m.photos||[]};
}
export function pilotBook(s){return s.i1Pilot||(s.i1Pilot={version:1,active:null,history:{},pack:'all',page:0})}
export function eligible(c,date,pack='all'){return c.scenes.filter(s=>s.date<=date&&(pack==='all'||s.id.startsWith(pack+'-')))}
export function startPilot(s,c,id,date){const v=c.scenes.find(x=>x.id===id&&x.date<=date);if(!v)return false;pilotBook(s).active={id,selected:null};return true}
export function answerPilot(s,c,choice,date){const b=pilotBook(s),a=b.active,v=c.scenes.find(x=>x.id===a?.id&&x.date<=date);if(!v||a.selected!==null||!v.response.choices.some(x=>x.id===choice))return false;a.selected=choice;a.correct=choice===v.response.correct;b.history[v.id]={correct:a.correct,sceneDate:v.date,playedAt:date,outcome:v.outcome.key};return true}
export function chainIntro(s,c,v,date=v.date){const b=pilotBook(s),link=c.chains.find(x=>x.to===v.id),from=link&&c.scenes.find(x=>x.id===link.from);if(!from||from.date>=v.date||!from.cast.some(x=>x.id===link.person)||!v.cast.some(x=>x.id===link.person))return null;const prior=b.history[from.id];return prior&&prior.sceneDate===from.date&&prior.playedAt<=date?{ko:link.ko,en:link.en}:{ko:link.fallbackKo,en:link.fallbackEn}}
export function approvedPhoto(c,v,i){const p=c.photos.find(x=>x.sceneId===v.id&&x.castIndex===i&&x.id===v.cast[i]?.id&&x.name===v.cast[i]?.name);return p&&/^https:\/\//.test(p.url)&&/^https:\/\//.test(p.metadata)?p:null}
