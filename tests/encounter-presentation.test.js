import test from 'node:test';
import assert from 'node:assert/strict';
import {makeEncounterUI} from '../encounters-ui.js';
const person={id:'W000000',name:'William Joseph Wynn',ko:'윌리엄 조지프 윈'};
function render(lang,correct,selected=0,fact='district'){
 const s={year:1904,quarter:4,encounters:{active:{slot:'career:1904:4',selected,correct,person,term:{type:'rep',state:'CA',district:5,party:'Democrat'},date:'1904-10-01',venue:['train','지역 방문 일정','Regional visit','잠시 만납니다.','Meet briefly.'],opening:['인사드립니다.','Greetings.'],line:['진행자','Host','어느 지역구인가요?','Which district?'],fact,options:fact==='name'?['William Joseph Wynn','Other person']:['CA-5','CA-6'],answer:fact==='name'?'William Joseph Wynn':'CA-5',source:'https://example.com'},contacts:{}}};
 const L=(ko,en)=>lang==='en'?en:ko,T=(ko,en)=>lang==='en'?en:ko+' ('+en+')';
 return makeEncounterUI({T,L,esc:String,photo:(p,large,hidden)=>'<img class="portrait" alt="'+(hidden?'Portrait':p.name)+'">',button:(l,a)=>'<button data-action="'+a+'">'+l+'</button>',safeUrl:String,tr:()=>T('민주당','Democratic Party'),state:()=>s,people:()=>[person],states:[{id:'CA',name:'California'}],mode:()=> 'career'}).render();
}
test('Korean encounter uses bilingual names and political terms only',()=>{const html=render('ko',true);assert.match(html,/윌리엄 조지프 윈 \(William Joseph Wynn\)/);assert.match(html,/연방 하원의원 \(U\.S\. Representative\)/);assert.match(html,/encounter-result is-correct/);assert.doesNotMatch(html,/You meet a new political figure|\(Host\)|Greetings\.|Which district\?|Verify historical record|California · California/);});
test('English and incorrect feedback remain distinct',()=>{const html=render('en',false);assert.match(html,/Which district\?/);assert.match(html,/encounter-result is-review/);assert.match(html,/Review answer/);assert.doesNotMatch(html,/윌리엄 조지프 윈/);});

test('historical portrait stays to the right of the identity before and after answering',()=>{for(const selected of [null,0]){const html=render('ko',true,selected);assert.match(html,/<div class="encounter-identity">[\s\S]*?<figure class="encounter-portrait-slot"><img class="portrait" alt="William Joseph Wynn">/);}});
test('name quiz keeps its portrait without revealing name in the image alt',()=>{const html=render('ko',true,null,'name');assert.match(html,/<figure class="encounter-portrait-slot"><img class="portrait" alt="Portrait">/);assert.match(html,/<h2>전에 만난 인물<\/h2>/);});
