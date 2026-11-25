// Encounter engine. Every scene is fictional; every recall answer is derived from a dated record.
export const venues=[
 ['reception','의회 리셉션','Congressional reception','명찰을 확인하던 보좌관이 인사를 주선합니다.','An aide arranges an introduction beside the name badges.','rep','sen'],
 ['caucus','의원 총회','Members’ gathering','회의가 시작되기 전 옆자리에 한 의원이 앉습니다.','A member takes the seat next to you before the meeting.','rep','sen'],
 ['hall','의사당 복도','Capitol corridor','회의실을 찾는 도중 한 의원과 마주칩니다.','You encounter a member while looking for the meeting room.','rep','sen'],
 ['committee','위원회 청문회 대기실','Hearing waiting room','보좌진이 참석자 명단을 정리하고 있습니다.','Staff are organizing the attendance list.','rep','sen'],
 ['delegation','주 대표단 모임','State delegation gathering','대표단 명단을 들고 있는 직원이 당신을 부릅니다.','An aide holding a delegation list calls you over.','rep','sen','gov'],
 ['lunch','정책 오찬','Policy luncheon','식사가 나오기 전 테이블에서 소개가 이어집니다.','Introductions continue around the table before lunch.','rep','sen','gov','prez','vp'],
 ['press','기자회견장','Press room','기자들이 명단을 확인하는 동안 인사를 나눕니다.','You exchange introductions while reporters check the list.','rep','sen','gov','candidate','prez','vp'],
 ['station','출장 대기실','Travel lounge','다음 일정으로 이동하기 전 잠시 대화를 나눌 시간이 생깁니다.','There is time for a conversation before the next appointment.','rep','sen','gov','candidate','prez','vp'],
 ['forum','지역 정책 포럼','Regional policy forum','주최 측이 참가자를 소개해 달라고 부탁합니다.','The host asks you to help introduce a participant.','rep','sen','gov','candidate'],
 ['conference','정책 컨퍼런스','Policy conference','세션 사이 휴식 시간에 참가자가 다가옵니다.','A participant approaches during the break.','rep','sen','gov','candidate','prez','vp','activist'],
 ['office','의원 사무실 방문','Congressional office visit','직원이 방문록에 접견 인물의 정보를 적어 달라고 합니다.','An aide asks you to complete the visitor record.','rep','sen'],
 ['library','정치 자료실','Political archive','자료를 정리하던 직원이 인물 기록을 함께 확인하자고 합니다.','An archivist asks you to check a person’s record together.','rep','sen','gov','candidate','prez','vp','chief','justice','activist'],
 ['convention','정당 대회 로비','Convention lobby','다음 연설을 기다리던 중 참가자와 인사를 나눕니다.','You exchange greetings while waiting for the next speech.','rep','sen','gov','candidate','prez','vp'],
 ['campaign','선거 행사장','Campaign event','행사 진행자가 다음 참가자의 소개를 준비하고 있습니다.','The event host is preparing the next introduction.','rep','sen','candidate','gov','prez','vp'],
 ['brief','선거 상황실','Election briefing room','보좌진이 경쟁 지역의 후보 명단을 펼칩니다.','An aide lays out a list of candidates and districts.','rep','sen','candidate','gov'],
 ['train','지역 방문 일정','Regional visit','일행이 다음 방문 장소로 출발하기 전에 잠시 만납니다.','You meet briefly before the group leaves for its next stop.','rep','sen','gov','candidate'],
 ['dinner','공식 만찬','Formal dinner','자리 배치표를 확인하다가 한 인물과 인사를 나눕니다.','You exchange greetings while checking the seating chart.','rep','sen','gov','prez','vp','chief','justice'],
 ['townhall','공개 간담회','Public town hall','간담회 진행자가 참석자를 확인하고 있습니다.','The moderator is checking the participant list.','rep','sen','gov','candidate','activist'],
 ['gallery','의회 방청석 입구','Capitol gallery entrance','출입구에서 보좌진의 소개를 받습니다.','An aide introduces a participant near the entrance.','rep','sen'],
 ['workshop','입법 실무 세미나','Legislative workshop','자료를 나누는 자리에서 참석자의 경력을 확인합니다.','Participants exchange materials and check their backgrounds.','rep','sen','gov','chief','justice'],
 ['orientation','신규 정치인 오리엔테이션','Political orientation','진행자가 참석자 명단을 건네며 서로 소개하라고 합니다.','The host hands out a roster and asks attendees to introduce one another.','rep','sen','gov'],
 ['newsletter','정치 신문 편집실','Political newsroom','편집자가 인물 소개란의 사실을 확인해 달라고 부탁합니다.','An editor asks you to fact-check a profile caption.','rep','sen','gov','candidate','prez','vp','chief','justice','activist'],
 ['roundtable','대표단 원탁회의','Delegation roundtable','발언 순서를 정하기 전에 참가자 정보를 확인합니다.','The group verifies participant details before assigning speaking order.','rep','sen','gov','activist'],
 ['door','행사장 출입구','Event entrance','진행자가 도착한 인물을 가리키며 안내를 부탁합니다.','An organizer points to an arriving participant and asks for assistance.','rep','sen','gov','candidate','prez','vp','chief','justice','activist']
];
const lines={
 district:[['보좌관','Aide','의원님 지역구를 확인하고 인사드리죠. 어느 선거구였더라?','Let’s confirm the member’s district before we greet them. Which district was it?'],['나','You','의원님, 실례지만 어느 선거구를 대표하고 계시죠?','Congressmember, may I confirm which district you represent?'],['진행자','Host','소개 자료에 지역구가 빠졌네요. 어느 지역구로 적을까요?','The district is missing from the introduction. Which one belongs here?'],['보좌관','Aide','방문 기록에 정확한 지역구를 남겨 주세요.','Please put the correct district in the visit record.']],
 state:[['나','You','어느 주를 대표하고 계시죠?','Which state do you represent?'],['보좌관','Aide','대표단 명단에서 이분은 어느 주에 속하죠?','Which state does this person represent on the roster?'],['진행자','Host','소개하기 전에 주 이름을 확인해 주세요.','Please confirm the state before the introduction.'],['보좌관','Aide','이분의 주 대표 기록을 찾아 주세요.','Please identify this person’s state in the record.']],
 office:[['보좌관','Aide','소개할 때 어떤 직책으로 부르면 될까요?','What office should we use in the introduction?'],['나','You','현재 맡고 계신 직책을 확인하고 싶습니다.','I would like to confirm your current office.'],['진행자','Host','명찰의 직책 칸이 비어 있습니다.','The office field on the badge is blank.'],['편집자','Editor','이 시점의 공식 직책이 무엇인지 확인해 주세요.','Please verify the office held at this date.']],
 candidate:[['보좌관','Aide','이 후보가 출마한 하원 선거구가 어디였죠?','Which House district was this candidate running in?'],['나','You','출마하신 선거구를 확인해도 될까요?','May I confirm the district you are running in?'],['진행자','Host','후보 소개 자료에 선거구를 채워 주세요.','Please fill in the candidate’s district.'],['편집자','Editor','이 후보의 선거구를 기사에 정확히 적어야겠어요.','We need the candidate’s correct district in the article.']],
 party:[['보좌관','Aide','이 기록의 소속 정당을 확인해 주세요.','Please check the party listed in this record.'],['진행자','Host','소개 자료의 정당 표기를 확인할까요?','Shall we check the party in the introduction?'],['나','You','당시 소속 정당을 확인하고 싶습니다.','I would like to confirm your party at this date.'],['편집자','Editor','정당 명칭이 정확한지 확인해 주세요.','Please verify the party label.']],
 name:[['보좌관','Aide','지난번 소개받은 분이 다시 오셨네요. 성함 기억하시죠?','Someone you met before has returned. Do you remember their name?'],['진행자','Host','이분을 다시 소개해 주시겠어요?','Would you introduce this person again?'],['나','You','전에 뵌 분인데… 성함이 무엇이었죠?','We met before… what was their name?'],['보좌관','Aide','사진과 명단을 대조해 주세요.','Please match the portrait to the roster.']]
};
export const roleLabels={rep:['연방 하원의원','U.S. Representative'],sen:['연방 상원의원','U.S. Senator'],gov:['주지사','Governor'],prez:['대통령','President'],vp:['부통령','Vice President'],chief:['연방대법원장','Chief Justice'],justice:['연방대법관','Associate Justice'],candidate:['대통령 후보','Presidential candidate'],housecandidate:['연방 하원 후보','House candidate'],activist:['정치운동가','Activist']};
const norm=x=>String(x||'').trim().toLowerCase().replace(/[^a-z0-9]/g,'');
const uniq=xs=>[...new Set(xs)];
const hash=x=>{let h=2166136261;for(const c of String(x))h=Math.imul(h^c.charCodeAt(0),16777619);return h>>>0};
const pick=(a,seed)=>a[hash(seed)%a.length];
const shuffle=(a,seed)=>a.slice().sort((x,y)=>hash(seed+':'+x)-hash(seed+':'+y)||String(x).localeCompare(String(y)));
const district=t=>Number.isInteger(t.district)&&t.district>=0&&t.state?t.state+'-'+(t.district===0?'AL':t.district):null;
export function encounterBook(s){if(!s.encounters)s.encounters={serial:0,active:null,contacts:{},history:[],seen:{},lastSlot:''};return s.encounters}
export function encounterDate(s){const r=s.politics?.active;if(r&&!r.finished)return r.year+'-10-01';return s.year+'-'+['02-15','05-15','08-15','11-15'][Math.max(0,Math.min(3,s.quarter-1))]}
export function encounterSlot(s){const r=s.politics?.active;return r&&!r.finished?'race:'+r.id+':'+r.week:'career:'+s.year+':'+s.quarter}
export function buildRoster(people,date,closeRaces=[]){
 const year=+date.slice(0,4),map=new Map(),known=new Map(people.map(p=>[norm(p.name),p]));
 for(const p of people){if(!p.name||!p.id||p.sample)continue;for(const t of p.terms||[]){if(!roleLabels[t.type]||t.type==='election'||!t.start||!t.end||date<t.start||date>t.end)continue;if(t.type==='candidate'&&+t.start.slice(0,4)!==year)continue;const key=norm(p.name)+':'+t.type+':'+(t.state||'')+':'+(t.district??'');const old=map.get(key);if(!old||(!p.historical&&old.person.historical))map.set(key,{person:p,term:t,key,source:t.source||p.source||('https://bioguide.congress.gov/search/bio/'+encodeURIComponent(p.id))})}}
 for(const race of closeRaces.filter(x=>x.year===year))for(const c of race.candidates){const p=known.get(norm(c.name))||{id:'candidate:'+norm(c.name),name:c.name,wiki:c.wiki||c.name,historical:true,source:race.source};const t={type:'housecandidate',state:race.state,district:race.district,party:c.party,start:year+'-01-01',end:year+'-12-31',precision:'year'};map.set(norm(c.name)+':housecandidate:'+district(t),{person:p,term:t,source:race.source,race,key:norm(c.name)+':housecandidate:'+district(t)})}
 return [...map.values()]
}
const role=t=>t.type;
function facts(row,roster,states,known){const t=row.term,out=[];const ds=district(t);const vals=(fn,rows=roster)=>uniq(rows.map(fn).filter(Boolean));const add=(type,answer,pool)=>{if(answer&&uniq(pool.filter(x=>x!==answer)).length>=3)out.push({type,answer,pool:uniq(pool.filter(x=>x!==answer))})};
 const samePerson=roster.filter(x=>norm(x.person.name)===norm(row.person.name)&&x.term.type===t.type);if(ds&&(t.type==='rep'||t.type==='housecandidate')&&uniq(samePerson.map(x=>district(x.term)).filter(Boolean)).length===1){const same=vals(x=>district(x.term),roster.filter(x=>x.term.state===t.state&&['rep','housecandidate'].includes(x.term.type)));const other=vals(x=>district(x.term),roster.filter(x=>['rep','housecandidate'].includes(x.term.type)));add(t.type==='housecandidate'?'candidate':'district',ds,[...same,...other])}
 if(t.state&&['rep','sen','gov'].includes(t.type)&&uniq(samePerson.map(x=>x.term.state).filter(Boolean)).length===1)add('state',t.state,vals(x=>x.term.state));
 // Only use office questions when that person's office is unambiguous on this date.
 const roles=uniq(roster.filter(x=>norm(x.person.name)===norm(row.person.name)).map(x=>role(x.term)));
 if(roles.length===1)add('office',t.type,vals(x=>role(x.term)));
 const parties=uniq(roster.filter(x=>norm(x.person.name)===norm(row.person.name)).map(x=>x.term.party).filter(Boolean));
 if(parties.length===1&&t.party)add('party',t.party,vals(x=>x.term.party));
 if(known&&row.person.id&&!row.person.id.startsWith('candidate:'))add('name',row.person.name,vals(x=>x.person.name,roster.filter(x=>x.term.type===t.type)));
 return out}
const sceneFits=(v,row)=>v.slice(5).includes(row.term.type==='housecandidate'?'candidate':row.term.type);
const preferred={race:['campaign','brief','press','forum','train','convention'],career:['reception','caucus','hall','committee','delegation','lunch','office','conference','orientation','roundtable','door']};
export function startEncounter(s,people,states,closeRaces=[],portraits=[],place='auto'){
 const b=encounterBook(s),slot=encounterSlot(s);if(b.active&&!b.active.closed){if(b.active.slot===slot)return b.active;b.active.closed=true;}if(b.lastSlot===slot)return null;
 const date=encounterDate(s),year=+date.slice(0,4),roster=buildRoster(people,date,closeRaces),local=new Set(portraits.map(x=>x.id));if(!roster.length)return null;
 const seed=slot+':'+s.name+':'+(b.serial+1),race=slot.startsWith('race'),eligible=[];
 for(const row of roster){if(norm(row.person.name)===norm(s.politics?.active&&!s.politics.active.finished?s.politics.active.player:s.name))continue;const key=norm(row.person.name),contact=b.contacts[key];const f=facts(row,roster,states,!!contact&&contact.meetings>=2&&local.has(row.person.id));if(!f.length)continue;const due=contact&&contact.due<=b.serial+1;let score=(due?12:contact?-2:5)+(local.has(row.person.id)?6:0)+(row.term.state===s.state?3:0)+(row.term.type==='rep'?3:0)+(race&&row.race?12:0)+(race&&row.term.type==='candidate'?4:0)+(hash(seed+key+row.term.type)%1000)/100;eligible.push({row,f,key,score})}
 if(!eligible.length)return null;eligible.sort((a,c)=>c.score-a.score);const chosen=eligible[0],row=chosen.row;
 let fs=chosen.f.slice().sort((a,c)=>{const rank=f=>((chosen.row.race&&f.type==='candidate')?8:f.type==='district'?5:f.type==='name'?4:1)+(b.contacts[chosen.key]?.facts?.[f.type]?.streak===0?5:b.seen[chosen.key+':'+f.type]?-3:2)+(hash(seed+f.type)%100)/100;return rank(c)-rank(a)});
 const f=fs[0],vlist=venues.filter(v=>sceneFits(v,row)),priority=vlist.filter(v=>(place==='congress'?['caucus','hall','committee','gallery','office','roundtable']:preferred[race?'race':'career']).includes(v[0]));const all=priority.length?priority:vlist;const unused=all.filter(v=>!b.history.slice(0,8).some(h=>h.venue===v[0]));const venue=pick(unused.length?unused:all,seed+':venue');if(!venue)return null;
 const line=pick(lines[f.type],seed+':line');const nearby=(f.type==='district'||f.type==='candidate')?f.pool.filter(x=>x.startsWith(row.term.state+'-')):[];const wrong=shuffle(nearby,seed+':near').slice(0,2);const options=shuffle([f.answer,...wrong,...shuffle(f.pool.filter(x=>!wrong.includes(x)),seed+':wrong').slice(0,3-wrong.length)],seed+':options');
 const id=++b.serial,contact=b.contacts[chosen.key];
 b.active={id,slot,date,year,person:{id:row.person.id,name:row.person.name,ko:row.person.ko||'',wiki:row.person.wiki||'',historical:!!row.person.historical,photo:row.person.photo||'',source:row.person.source||row.source},term:row.term,source:row.source,venue:venue.slice(0,5),line,fact:f.type,answer:f.answer,options,key:chosen.key,returning:!!contact,race:row.race||null,selected:null,closed:false};
 b.lastSlot=slot;return b.active
}
export function answerEncounter(s,index){const b=encounterBook(s),e=b.active;if(!e||e.closed||e.selected!==null||!Number.isInteger(index)||index<0||index>=e.options.length)return false;e.selected=index;e.correct=e.options[index]===e.answer;const c=b.contacts[e.key]||(b.contacts[e.key]={name:e.person.name,id:e.person.id,meetings:0,correct:0,attempts:0,facts:{},due:0});c.meetings++;c.attempts++;if(e.correct)c.correct++;const f=c.facts[e.fact]||(c.facts[e.fact]={attempts:0,correct:0,streak:0});f.attempts++;if(e.correct){f.correct++;f.streak++}else f.streak=0;c.due=b.serial+(e.correct?Math.min(12,2+f.streak*2):1);b.seen[e.key+':'+e.fact]=(b.seen[e.key+':'+e.fact]||0)+1;b.history.unshift({id:e.id,year:e.year,name:e.person.name,fact:e.fact,answer:e.answer,correct:e.correct,venue:e.venue[0]});b.history=b.history.slice(0,300);return true}
export function closeEncounter(s){const e=encounterBook(s).active;if(!e||e.closed)return false;e.closed=true;return true}
export function scenarioCount(people,date,states,closeRaces=[]){const rows=buildRoster(people,date,closeRaces);let count=0;for(const row of rows){const f=facts(row,rows,states,false);count+=f.reduce((n,x)=>n+venues.filter(v=>sceneFits(v,row)).length*lines[x.type].length,0)}return count}
