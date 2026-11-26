// V18 protected careers. Fictional progression only; historical data is never modified.
export const protectedMode=s=>['staff','state51'].includes(s?.mode);
export const modeLabel={staff:['실제 역사 · 보좌관','Historical staff'],state51:['가상 51번째 주','Fictional 51st state'],alternate:['대체 역사','Alternate history'],historyMode:['구버전 가상 커리어','Legacy fictional career']};
export const staffRanks=[['인턴','Intern'],['입법 보조원','Legislative assistant'],['정책 참모','Policy aide'],['선임 참모','Senior aide'],['자문역','Advisor'],['선임 자문역','Senior advisor']];
export const stateRanks=[['지역 활동가','Local organizer'],['시의원','City councilor'],['시장','Mayor'],['주 하원의원','State representative'],['주 상원의원','State senator'],['주지사','Governor']];
export const paths=[['policy','정책 연구','Policy research'],['organization','조직 운영','Organization'],['communication','언론 대응','Communication'],['negotiation','협상','Negotiation']];
const cap=x=>Math.max(0,Math.min(100,x));
const stamp=s=>s.year*4+s.quarter;
export function career18(s){if(!protectedMode(s))return null;return s.v18||(s.v18={version:1,xp:0,rank:0,skills:{policy:0,organization:0,communication:0,negotiation:0},trust:20,actionPoints:2,done:[],log:[],awards:[],localElections:[],pending:null,feedback:null});}
export function task18(s){const d=career18(s);if(!d)return null;if(d.pending?.turn===stamp(s))return d.pending;const i=(stamp(s)+d.rank)%paths.length;return {turn:stamp(s),focus:paths[i][0],followup:false}}
export function work18(s,key){const d=career18(s);if(!d||!paths.some(p=>p[0]===key)&&key!=='rest'||d.actionPoints<=0||d.done.includes(key))return false;
const task=task18(s);const fit=key===task.focus;const cost=key==='rest'?-22:fit?10:15;if(s.energy<cost)return false;
s.energy=cap(s.energy-cost);d.actionPoints--;d.done.push(key);const gain=key==='rest'?0:fit?20:12;const trust=key==='rest'?0:fit?6:2;
if(key!=='rest'){d.skills[key]+=fit?3:2;d.xp+=gain;d.trust=cap(d.trust+trust);if(s.mode==='state51')s.support=cap(s.support+(fit?6:3));if(fit)d.pending={turn:stamp(s)+1,focus:paths[(paths.findIndex(p=>p[0]===key)+1)%paths.length][0],followup:true};}
const old=d.rank;if(s.mode==='staff')d.rank=Math.min(staffRanks.length-1,Math.floor(d.xp/60));if(d.rank>old)d.awards.push({type:'promotion',rank:d.rank,year:s.year,quarter:s.quarter});
d.feedback={key,gain,trust,energy:-cost,fit,rank:d.rank>old?d.rank:null};d.log.unshift({year:s.year,quarter:s.quarter,...d.feedback});d.log=d.log.slice(0,100);return true;}
export function canLocalElection(s){const d=career18(s);return !!d&&s.mode==='state51'&&s.quarter===4&&s.year%2===0&&d.rank<stateRanks.length-1&&!d.localElections.some(e=>e.year===s.year)&&d.actionPoints===0;}
export function localElection(s){if(!canLocalElection(s))return false;const d=career18(s),target=d.rank+1;const score=cap(Math.round(s.support*.55+d.trust*.2+Math.min(100,d.xp/2)*.25));const won=score>=35+target*6;const result={year:s.year,rank:target,score,won,fictional:true};d.localElections.push(result);if(won){d.rank=target;d.awards.push({type:'election',rank:target,year:s.year,quarter:s.quarter});s.support=cap(s.support-15)}d.feedback={election:result};return true;}
export function next18(s){const d=career18(s);if(!d||d.actionPoints>0||canLocalElection(s)||s.year===2026&&s.quarter===4)return false;s.quarter++;if(s.quarter===5){s.quarter=1;s.year++;s.age++}s.energy=cap(s.energy+18);d.actionPoints=2;d.done=[];d.feedback=null;return true;}
export function careerAction18(s,action){if(!protectedMode(s))return false;if(action==='next')return next18(s);if(action==='election')return localElection(s);if(action.startsWith('work:'))return work18(s,action.slice(5));return false;}
