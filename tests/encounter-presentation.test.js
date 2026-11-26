import test from 'node:test';
import assert from 'node:assert/strict';
import {makeEncounterUI} from '../encounters-ui.js';
const person={id:'W000000',name:'William Joseph Wynn',ko:'윌리엄 조지프 윈'};
function render(lang,correct){
 const s={year:1904,quarter:4,encounters:{active:{slot:'career:1904:4',selected:0,correct,person,term:{type:'rep',state:'CA',district:5,party:'Democrat'},date:'1904-10-01',venue:['train','지역 방문 일정','Regional visit','잠시 만납니다.','Meet briefly.'],opening:['인사드립니다.','Greetings.'],line:['진행자','Host','어느 지역구인가요?','Which district?'],fact:'district',answer:'CA-5',source:'https://example.com'},contacts:{}}};
 const L=(ko,en)=>lang==='en'?en:ko,T=(ko,en)=>lang==='en'?en:ko+' ('+en+')';
 return makeEncounterUI({T,L,esc:String,photo:()=>'<img>',button:(l,a)=>'<button data-action="'+a+'">'+l+'</button>',safeUrl:String,tr:()=>T('민주당','Democratic Party'),state:()=>s,people:()=>[person],states:[{id:'CA',name:'California'}],mode:()=> 'career'}).render();
}
test('Korean encounter uses bilingual names and political terms only',()=>{const html=render('ko',true);assert.match(html,/윌리엄 조지프 윈 \(William Joseph Wynn\)/);assert.match(html,/연방 하원의원 \(U\.S\. Representative\)/);assert.match(html,/encounter-result is-correct/);assert.doesNotMatch(html,/You meet a new political figure|\(Host\)|Greetings\.|Which district\?|Verify historical record|California · California/);});
test('English and incorrect feedback remain distinct',()=>{const html=render('en',false);assert.match(html,/Which district\?/);assert.match(html,/encounter-result is-review/);assert.match(html,/Review answer/);assert.doesNotMatch(html,/윌리엄 조지프 윈/);});
