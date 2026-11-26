// V18 protected careers. Fictional progression only; historical data is never modified.
export const protectedMode=s=>['staff','state51'].includes(s?.mode);
export const modeLabel={staff:['실제 역사 · 보좌관','Historical staff'],state51:['가상 51번째 주','Fictional 51st state'],alternate:['대체 역사','Alternate history'],historyMode:['구버전 가상 커리어','Legacy fictional career']};
export const staffRanks=[['자원봉사자','Volunteer'],['인턴','Intern'],['유급 인턴','Paid intern'],['일반 사무원','Staff assistant'],['정책 보조원','Policy assistant'],['입법 보좌관','Legislative assistant'],['정책 참모','Policy aide'],['선임 참모','Senior aide'],['수석 자문역','Senior advisor'],['정책실장','Policy director'],['부비서실장','Deputy chief of staff'],['비서실장','Chief of staff']];
// Game progression, not a claim about the actual hierarchy of congressional offices.
const goals=[0,0,12,30,55,85,120,160,210,270,340,430];
const years=[0,0,1,2,3,4,5,7,9,11,14,17];
const trustGoals=[0,0,5,6,7,8,10,12,15,18,21,25];
export const staffGoal=d=>goals[Math.min(d.rank+1,goals.length-1)];
const exactCongressTerm=t=>['rep','sen'].includes(t.type)&&t.precision!=='year'&&/^\d{4}-\d{2}-\d{2}$/.test(t.start||'')&&/^\d{4}-\d{2}-\d{2}$/.test(t.end||'');
const activeTerm=(person,date)=>person.terms?.find(t=>exactCongressTerm(t)&&t.start<=date&&date<=t.end);
const date18=s=>s.v18?.calendar?.date||s.year+'-'+String((s.quarter-1)*3+1).padStart(2,'0')+'-01';
const sameSeat=(t,office)=>t.type===office.type&&t.state===office.state&&(t.type==='sen'||t.district===office.district);
const tenure=(person,date)=>Math.max(0,Math.floor(person.terms.filter(t=>exactCongressTerm(t)&&t.start<date).reduce((sum,t)=>sum+Math.max(0,Date.parse(t.end<date?t.end:date)-Date.parse(t.start)),0)/(365.25*86400000)));
export const officeTiers=[['초·재선 의원실','Early-career office'],['경력 의원실','Established office'],['장기 재임 의원실','Long-serving office']];
export function officeOptions(s,people=[],date=date18(s)){
 if(s.mode!=='staff')return [];
 const d=career18(s),byTier=[[],[],[]];
 for(const person of people){const t=activeTerm(person,date);if(!t||t.state!==s.state||person.id===d.office?.id||!person.id||!person.name)continue;
 if(s.party!=='Independent'&&t.party!==s.party)continue;
 const service=tenure(person,date),tier=service>=8?2:service>=3?1:0;
 const chance=Math.min(.72,[.43,.23,.08][tier]+Math.min(.25,d.xp/800)+Math.min(.10,(d.bestRank||0)*.015));
 byTier[tier].push({id:person.id,name:person.name,type:t.type,state:t.state,district:t.district??null,service,tier,chance});
 }
 return byTier.flatMap(group=>group.sort((a,b)=>a.id.localeCompare(b.id)).slice(0,4));
}
export function applyOffice18(s,id,people=[],rng=Math.random){
 const d=career18(s);if(!d||s.mode!=='staff'||d.actionPoints<=0||d.done.includes('apply')||s.energy<8)return false;
 const job=officeOptions(s,people).find(x=>x.id===id);if(!job)return false;
 d.actionPoints--;d.done.push('apply');s.energy=cap(s.energy-8);d.feedback=null;
 const won=rng()<job.chance;
 if(won){d.bestRank=Math.max(d.bestRank||0,d.rank);d.rank=Math.max(1,(d.bestRank||0)-1);d.office={id:job.id,name:job.name,type:job.type,state:job.state,district:job.district,tier:job.tier,since:stamp(s)};d.trust=5;d.rankSince=stamp(s);d.bestRank=Math.max(d.bestRank,d.rank);d.awards.push({type:'hire',rank:d.rank,year:s.year,quarter:s.quarter});}
 d.officeNotice={type:won?'hired':'rejected',name:job.name};return true;
}
// Only confirmed exact-date records may end a fictional appointment; missing data never fires the player.
export function reconcileOffice18(s,people=[],complete=false){
 if(s.mode!=='staff'||!complete)return false;const d=career18(s),o=d.office;if(!o)return false;
 const person=people.find(p=>p.id===o.id);if(!person?.terms?.some(t=>exactCongressTerm(t)&&sameSeat(t,o)&&t.end<date18(s)))return false;
 if(person.terms.some(t=>exactCongressTerm(t)&&sameSeat(t,o)&&t.start<=date18(s)&&date18(s)<=t.end))return false;
 d.bestRank=Math.max(d.bestRank||0,d.rank);d.office=null;d.rank=0;d.trust=5;d.rankSince=stamp(s);d.officeNotice={type:'ended',name:o.name};return true;
}
function quarterBudget(s,d){if(d.budgetTurn!==stamp(s)){d.budgetTurn=stamp(s);d.trustEarned=0;d.chatXP=0}}
function changeStaffTrust(s,d,delta){quarterBudget(s,d);const old=d.trust;const permitted=delta>0?Math.min(delta,1-d.trustEarned):delta;d.trust=cap(old+permitted);if(d.trust>old)d.trustEarned+=d.trust-old;return d.trust-old}
export function staffDialogueReward(s,correct,rng=Math.random){const d=career18(s);quarterBudget(s,d);const xp=correct&&d.chatXP<2?1:0;d.chatXP+=xp;d.xp+=xp;const trust=correct&&d.office&&rng()<.025?changeStaffTrust(s,d,1):0;return {xp,trust}}
export function promotionReview18(s,rng=Math.random){
 const d=career18(s);if(s.mode!=='staff'||!d.office||d.rank<1||d.rank>=staffRanks.length-1)return false;
 const target=d.rank+1,now=stamp(s),service=now-d.startedTurn;
 if(d.lastReview===now||service<years[target]*4||now-d.rankSince<4||d.xp<goals[target]||d.trust<trustGoals[target]||Math.max(...Object.values(d.skills))<Math.floor(target/2))return false;
 d.lastReview=now;
 if(rng()>=[.34,.22,.12][d.office.tier]){d.promotionStatus={type:'deferred',turn:now};return false}
 d.rank=target;d.rankSince=now;d.bestRank=Math.max(d.bestRank||0,target);d.promotionStatus={type:'promoted',turn:now};d.awards.push({type:'promotion',rank:target,year:s.year,quarter:s.quarter});return true;
}
export const stateRanks=[['지역 활동가','Local organizer'],['시의원','City councilor'],['시장','Mayor'],['주 하원의원','State representative'],['주 상원의원','State senator'],['주지사','Governor']];
export const paths=[['policy','정책 연구','Policy research'],['organization','조직 운영','Organization'],['communication','언론 대응','Communication'],['negotiation','협상','Negotiation']];
const cap=x=>Math.max(0,Math.min(100,x));
const stamp=s=>s.year*4+s.quarter;
export function career18(s){if(!protectedMode(s))return null;const d=s.v18||(s.v18={version:1,xp:0,rank:0,skills:{policy:0,organization:0,communication:0,negotiation:0},trust:s.mode==='staff'?5:20,actionPoints:2,done:[],log:[],awards:[],localElections:[],pending:null,feedback:null});
 if(s.mode==='staff'&&d.version===1){const fresh=!d.xp&&!d.rank&&!d.log.length&&!d.calendar;const rankMap=[1,5,6,7,8,9];if(!fresh){d.rank=rankMap[Math.min(5,d.rank)]??1;for(const a of d.awards)if(a.type==='promotion')a.rank=rankMap[a.rank]??a.rank;}else d.rank=0;d.version=2;d.startedTurn=stamp(s);d.rankSince=stamp(s);d.bestRank=d.rank;d.office=null;d.trustEarned=0;d.chatXP=0;d.budgetTurn=stamp(s);d.feedback=null;}
 return d;}
export function task18(s){const d=career18(s);if(!d)return null;if(d.pending?.turn===stamp(s))return d.pending;const i=(stamp(s)+d.rank)%paths.length;return {turn:stamp(s),focus:paths[i][0],followup:false}}
export function work18(s,key,rng=Math.random){const d=career18(s);if(!d||!paths.some(p=>p[0]===key)&&key!=='rest'||d.actionPoints<=0||d.done.includes(key))return false;
const task=task18(s);const fit=key===task.focus;const cost=key==='rest'?-22:fit?10:15;if(s.energy<cost)return false;
s.energy=cap(s.energy-cost);d.actionPoints--;d.done.push(key);
let gain=0,trust=0,followup=false,outcome=null;
if(key!=='rest'){
 if(s.mode==='staff'){
  const skill=d.skills[key]||0,adjust=(fit?.04:0)+Math.min(.08,skill*.003)-(s.energy<35?.08:0),roll=rng()-adjust;
  outcome=roll<.05?'great':roll<.20?'good':roll<.75?'normal':roll<.90?'weak':'fail';
  gain={great:5,good:3,normal:2,weak:1,fail:1}[outcome];
  if(outcome==='great'||outcome==='good'){d.skills[key]=cap(skill+1);if(d.office)trust=changeStaffTrust(s,d,1);}
  else if(outcome==='fail'&&d.office)trust=changeStaffTrust(s,d,-1);
  followup=fit&&(outcome==='great'||outcome==='good')&&rng()<.35;
 }else{gain=fit?20:12;const before=d.trust;d.skills[key]+=fit?3:2;d.trust=cap(d.trust+(fit?6:2));trust=d.trust-before;s.support=cap(s.support+(fit?6:3));followup=fit}
 d.xp+=gain;if(followup)d.pending={turn:stamp(s)+1,focus:paths[(paths.findIndex(p=>p[0]===key)+1)%paths.length][0],followup:true};
}
d.feedback={key,gain,trust,energy:-cost,fit,followup,outcome,rank:null};d.log.unshift({year:s.year,quarter:s.quarter,...d.feedback});d.log=d.log.slice(0,100);return true;}
export function canLocalElection(s){const d=career18(s);return !!d&&s.mode==='state51'&&s.quarter===4&&s.year%2===0&&d.rank<stateRanks.length-1&&!d.localElections.some(e=>e.year===s.year)&&d.actionPoints===0;}
export function localElection(s){if(!canLocalElection(s))return false;const d=career18(s),target=d.rank+1;const score=cap(Math.round(s.support*.55+d.trust*.2+Math.min(100,d.xp/2)*.25));const won=score>=35+target*6;const result={year:s.year,rank:target,score,won,fictional:true};d.localElections.push(result);if(won){d.rank=target;d.awards.push({type:'election',rank:target,year:s.year,quarter:s.quarter});s.support=cap(s.support-15)}d.feedback={election:result};return true;}
export function next18(s){const d=career18(s);if(!d||d.actionPoints>0||canLocalElection(s)||s.year===2026&&s.quarter===4)return false;if(s.mode==='staff')promotionReview18(s);s.quarter++;if(s.quarter===5){s.quarter=1;s.year++;s.age++}s.energy=cap(s.energy+18);d.actionPoints=2;d.done=[];d.feedback=null;return true;}
export function careerAction18(s,action,people=[]){if(!protectedMode(s))return false;if(action==='next')return next18(s);if(action==='election')return localElection(s);if(action.startsWith('apply:'))return applyOffice18(s,action.slice(6),people);if(action.startsWith('work:'))return work18(s,action.slice(5));return false;}
