import {newsState,ingestNews,newsOnDate,nextNewsDate,markNews,indexOfNews} from './v18-news.js';
// UTC date arithmetic; only protected careers use this calendar in preview 2.
import {career18,protectedMode,next18,canLocalElection,staffRanks} from './v18-career.js';
import {appointmentCore,validScene,startPilot,answerPilot,pilotBook,chainIntro} from './i1-pilot.js';
const DAY=86400000,END='2026-12-31';
export const paceDays={immersive:4,balanced:8,fast:16};
export const addDays=(date,n)=>new Date(Date.parse(date+'T00:00:00Z')+DAY*n).toISOString().slice(0,10);
const start=s=>s.year+'-'+String((s.quarter-1)*3+1).padStart(2,'0')+'-01';
const boundary=s=>addDays(s.quarter===4?(s.year+1)+'-01-01':s.year+'-'+String(s.quarter*3+1).padStart(2,'0')+'-01',-1);
export function calendar18(s){if(!protectedMode(s))return null;const d=career18(s);if(!d.calendar){const date=start(s);d.calendar={version:1,date,pace:'balanced',nextChat:addDays(date,8),seenNews:[],newsArchive:[],pending:null,conversations:[],contacts:{},lastJump:0}}return newsState(d.calendar)}
export function dueNews(s,news){const c=calendar18(s);return newsOnDate(c,news)[0]||null}
export function setPace(s,pace){const c=calendar18(s);if(!c||!paceDays[pace]||c.pending)return false;c.pace=pace;c.nextChat=addDays(c.date,paceDays[pace]);return true}
function selectScene(s,catalog,date){if(!catalog)return null;const past=addDays(date,-30),history=s.i1Pilot?.history||{};const eligible=catalog.scenes.filter(v=>v.date<=date&&v.date>=past&&!history[v.id]&&validScene(v)&&appointmentCore(catalog,v));const linked=new Set((catalog.chains||[]).filter(x=>history[x.from]).map(x=>x.to));return eligible.sort((a,b)=>Number(linked.has(b.id))-Number(linked.has(a.id))||b.date.localeCompare(a.date)||a.id.localeCompare(b.id))[0]||null}
const generic=[
{key:'research',ko:'정책 자료 검토',en:'Review policy evidence',bodyKo:'가상의 동료가 정책 자료의 검토를 요청했습니다. 어떻게 진행할까요?',bodyEn:'A fictional colleague requests a review of policy evidence. How will you proceed?'},
{key:'schedule',ko:'업무 일정 조정',en:'Coordinate the schedule',bodyKo:'가상의 동료와 여러 업무의 우선순위를 정해야 합니다.',bodyEn:'A fictional colleague needs to coordinate competing assignments.'},
{key:'followup',ko:'지난 업무의 후속 회의',en:'Follow-up meeting',bodyKo:'지난번 협력에 이어 추가 검토 요청이 도착했습니다.',bodyEn:'A follow-up request arrives after your previous collaboration.'}];
export function currentEvent(s,news){const c=calendar18(s);if(c.pending)return c.pending;const n=dueNews(s,news);return n?{kind:'news',id:n.id,date:c.date}:null}
export function continueCalendar(s,news,catalog){const c=calendar18(s),d=career18(s);if(!c||c.pending)return false;ingestNews(c,news,c.date);const immediate=dueNews(s,news);if(immediate){c.pending={kind:'news',id:immediate.id,date:c.date};return true}
if(c.nextChat<=c.date&&c.date<=END){const v=selectScene(s,catalog,c.date);if(v&&startPilot(s,catalog,v.id,c.date))c.pending={kind:'scene',id:v.id,date:c.date};else{const idx=c.conversations.length===0?0:c.conversations.at(-1)?.choice==='collaborate'?2:c.conversations.length%2;c.pending={kind:'chat',index:idx,date:c.date}}return true}
const end=boundary(s);if(c.date===end){if(d.actionPoints||canLocalElection(s)||c.date===END)return false;if(!next18(s))return false;c.date=start(s);ingestNews(c,news,c.date);c.lastJump=1;const n=dueNews(s,news);if(n)c.pending={kind:'news',id:n.id,date:c.date};return true}
const nextNews=nextNewsDate(c,news,end);
const target=[end,c.nextChat,nextNews].filter(x=>x&&x>c.date&&x<=end).sort()[0];c.lastJump=Math.round((Date.parse(target)-Date.parse(c.date))/DAY);c.date=target;ingestNews(c,news,c.date);
if(dueNews(s,news)||c.nextChat<=c.date)return continueCalendar(s,news,catalog);return true;}
export const genericEvent=i=>generic[i]||generic[0];
export function ackNews(s,news){const c=calendar18(s),n=c.pending?.kind==='news'?indexOfNews(news).byId.get(c.pending.id):dueNews(s,news);if(!n||n.date!==c.date||c.pending&&c.pending.kind!=='news')return false;ingestNews(c,news,c.date);if(!markNews(c,news,n.id))return false;c.pending=null;return true}
export function answerCalendar(s,choice,catalog){const c=calendar18(s),d=career18(s),p=c.pending;if(!p||p.answered)return false;let xp=0,trust=0,energy=0;
if(p.kind==='scene'){if(!catalog||!answerPilot(s,catalog,choice,c.date))return false;const a=pilotBook(s).active;p.correct=a.correct;xp=a.correct?10:4;trust=a.correct?2:0;const v=catalog.scenes.find(x=>x.id===p.id);for(const person of v.cast){if(!person.id)continue;const old=c.contacts[person.id]||{name:person.name,count:0,last:null};old.count++;old.last=c.date;c.contacts[person.id]=old}}
else if(p.kind==='chat'){const delta={research:[8,1,-4],collaborate:[5,3,-3],defer:[0,0,4]}[choice];if(!delta||s.energy+delta[2]<0)return false;[xp,trust,energy]=delta}else return false;
s.energy=Math.max(0,Math.min(100,s.energy+energy));d.xp+=xp;d.trust=Math.min(100,d.trust+trust);if(s.mode==='staff'){const old=d.rank;d.rank=Math.min(staffRanks.length-1,Math.floor(d.xp/60));if(d.rank>old)d.awards.push({type:'promotion',rank:d.rank,year:s.year,quarter:s.quarter,date:c.date})}p.answered=true;p.choice=choice;p.reward={xp,trust,energy};c.conversations.push({date:c.date,kind:p.kind,id:p.id||genericEvent(p.index).key,choice,correct:p.correct??null});return true}
export function closeCalendar(s){const c=calendar18(s);if(!c.pending?.answered)return false;if(c.pending.kind==='scene')pilotBook(s).active=null;c.pending=null;c.nextChat=addDays(c.date,paceDays[c.pace]);return true}
export function sceneForCalendar(s,catalog){const c=calendar18(s);return c.pending?.kind==='scene'?catalog?.scenes.find(v=>v.id===c.pending.id)||null:null}
export function sceneChain(s,catalog,v){return chainIntro(s,catalog,v,calendar18(s).date)}
export const atQuarterEnd=s=>calendar18(s)?.date===boundary(s);
