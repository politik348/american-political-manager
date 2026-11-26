import {encounterBook,encounterSlot,startEncounter,answerEncounter,closeEncounter,roleLabels} from './encounters.js';
export function makeEncounterUI(ctx){
const {T,L,esc,photo,button,safeUrl}=ctx;
const S=()=>ctx.state();
const personLabel=p=>{const ko=p.ko||({'William Joseph Wynn':'윌리엄 조지프 윈'}[p.name]);return ko&&ko!==p.name?T(ko,p.name):p.name};
const stateName=id=>ctx.states.find(x=>x.id===id)?.name||id;
function districtLabel(v){const [st,d]=v.split('-');return stateName(st)+' · '+(d==='AL'?T('주 전체','At-large'):T('제'+d+'선거구','District '+d))+' ('+v+')'}
function format(f,v){return f==='district'||f==='candidate'?districtLabel(v):f==='state'?stateName(v)+' ('+v+')':f==='office'?T(...(roleLabels[v]||[v,v])):f==='party'?ctx.tr(v):f==='name'?personLabel(ctx.people().find(p=>p.name===v)||{name:v}):v}
function B(ko,en,act){return button(L(ko,en),'meet:'+act)}
function picture(e,hidden){const person=ctx.people().find(x=>x.id===e.person.id)||e.person;return photo(person,true,hidden)}
function render(place='auto'){const s=S(),b=encounterBook(s),slot=encounterSlot(s),e=b.active;const race=s.politics?.active;const activeRace=race&&!race.finished;
if(ctx.mode()==='collection'||ctx.mode()==='challenges'&&!activeRace||s.development?.retired&&!activeRace)return '';
if(e&&!e.closed&&e.slot===slot){
const answer=e.selected!==null,hidden=e.fact==='name'&&!answer,term=e.term,role=roleLabels[term.type]||[term.type,term.type];
const person=ctx.people().find(x=>x.id===e.person.id)||e.person;
const name=hidden?L('전에 만난 인물','A familiar face'):personLabel({...person,...e.person,ko:e.person.ko||person.ko});
const district= ['rep','housecandidate'].includes(term.type)&&Number.isInteger(term.district)?districtLabel(term.state+'-'+(term.district===0?'AL':term.district)):'';
const facts=answer?'<div class="encounter-facts">'+[T(...role),district|| (term.state?stateName(term.state):''),term.party?ctx.tr(term.party):''].filter(Boolean).map(v=>'<span>'+esc(v)+'</span>').join('')+'</div>':'';
const speech=(speaker,body,kind)=>'<div class="encounter-speech encounter-'+kind+'"><small>'+esc(speaker)+'</small><p>'+esc(body)+'</p></div>';
return '<section class="panel encounter-scene v18-readable-encounter" id="encounter-scene"><div class="eyebrow">'+L('정치 일정','Political encounter')+' · '+esc(e.term.precision==='year'?String(e.year):e.date)+'</div><h2>'+esc(L(e.venue[1],e.venue[2]))+'</h2><p class="encounter-context">'+esc(L(e.venue[3],e.venue[4]))+'</p><div class="encounter-person encounter-profile">'+picture(e,hidden)+'<div><small>'+L(e.returning?'다시 만난 인물':'새로운 인물',e.returning?'Returning contact':'New contact')+'</small><h2>'+esc(name)+'</h2>'+facts+'</div></div><div class="encounter-dialogue">'+(e.opening?speech(name,L(e.opening[0],e.opening[1]),'npc'):'')+speech(L(e.line[0],e.line[1]),L(e.line[2],e.line[3]),'question')+'</div>'+(!answer?'<div class="encounter-options">'+e.options.map((v,i)=>button(esc(format(e.fact,v)),'meet:answer:'+i)).join('')+'</div><div class="toolbar">'+B('인사만 하고 돌아가기','Just greet and return','close')+'</div>':'<div class="encounter-result '+(e.correct?'is-correct':'is-review')+'" role="status"><small>'+(e.correct?L('정답','Correct'):L('정답 확인','Review answer'))+'</small><strong>'+esc(format(e.fact,e.answer))+'</strong></div>'+(e.race?'<div class="notice"><strong>'+L('실제 접전 선거의 사후 기록','Historical post-election record')+'</strong><p>'+e.race.year+' · '+esc(districtLabel(e.race.state+'-'+e.race.district))+' · '+L('최종 표 차이','Final margin')+' '+e.race.margin.toLocaleString()+'</p><p>'+esc(e.race.candidates.map(x=>personLabel(x)).join(' / '))+'</p></div>':'')+'<div class="encounter-footer"><a href="'+safeUrl(e.source)+'" target="_blank" rel="noopener">'+L('실제 기록 확인','Verify historical record')+'</a>'+button(L('일정으로 돌아가기','Return to your schedule'),'meet:close','class="primary"')+'</div>')+'<small class="encounter-disclaimer">'+L('가상 대화 · 실제 발언 아님','Fictional dialogue · not actual quotations')+'</small></section>'

}
if(b.lastSlot===slot)return '';
const label=activeRace?L('선거 일정 중 만남','Campaign encounter'):place==='congress'?L('의회 일정 중 만남','Congressional encounter'):L('오늘의 정치 일정','Today’s political appointment');
return '<section class="panel encounter-invite"><div class="eyebrow">INVITATION</div><h2>'+label+'</h2><p>'+L('보좌진이 행사 참가자와의 인사를 주선했습니다.','Staff have arranged an introduction at an event.')+'</p>'+B('행사에 참석하기','Attend the event','start:'+place)+'</section>'
}
function journal(){const b=encounterBook(S()),cs=Object.values(b.contacts).sort((a,c)=>c.meetings-a.meetings);return '<details class="panel encounter-journal"><summary>'+L('인맥 수첩','Contact notebook')+' · '+cs.length+'</summary>'+(cs.length?cs.slice(0,30).map(c=>'<p><strong>'+esc(personLabel(ctx.people().find(p=>p.id===c.id)||c))+'</strong> · '+L('만남','Meetings')+' '+c.meetings+' · '+L('기억한 정보','Recalled facts')+' '+c.correct+'/'+c.attempts+'</p>').join(''):'<p>'+L('아직 기록된 만남이 없습니다.','No recorded encounters yet.')+'</p>')+'</details>'}
function handle(a){const s=S();if(a.startsWith('start:')){return !!startEncounter(s,ctx.people(),ctx.states,ctx.closeRaces,ctx.portraits(),a.slice(6))}if(a==='close')return closeEncounter(s);if(a.startsWith('answer:'))return answerEncounter(s,+a.slice(7));return false}
return {render,journal,handle};
}
