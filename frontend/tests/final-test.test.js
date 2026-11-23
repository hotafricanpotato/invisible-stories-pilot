import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import data from '../src/content/finalTest.json' with {type:'json'};
import * as m from '../src/state/model.js';
import {storyRegistry} from '../src/content/storyRegistry.js';
import {finishStory} from './story-helpers.js';
const ready=()=>m.reducer(['liza','nikita','ilya'].reduce((s,id)=>finishStory(s,id,m,storyRegistry),m.initialState()),{type:'STATS_COMPLETE'});
const answer=(s,n,value='A')=>m.reducer(s,{type:'FINAL_ANSWER',id:String(n),value});
test('approved source: all five questions, every option, explanations and introductions are exact',()=>{
 const source=readFileSync(new URL('./fixtures/final-test-1.0.txt',import.meta.url),'utf8');
 assert.equal(data.title,'Что теперь стало заметнее?');assert.equal(data.questions.length,5);assert.deepEqual(data.questions.map(q=>q.key),['B','C','A','B','B']);
 for(const p of [data.title,...data.introduction]) assert.ok(source.includes(p));
 for(const q of data.questions){const section=source.split(`## Вопрос ${q.id}. `)[1].split('\n---')[0];assert.ok(section.startsWith(`«${q.title}»`));assert.equal(section.match(/\*\*Ситуация:\*\*\s*([\s\S]*?)\n\n\*\*Вопрос:/)[1],q.situation);assert.equal(section.match(/\*\*Вопрос:\*\* (.*?)\n/)[1],q.question);assert.deepEqual(Object.keys(q.options),['A','B','C']);for(const [k,v] of Object.entries(q.options))assert.equal(section.match(new RegExp('\\*\\*'+k+'\\.\\*\\* (.*?)\\n'))[1],v);assert.equal(section.split('**Объяснение:**\n\n')[1].trim(),q.explanation);}
});
test('guards require stories plus statistics; no old completion or skipped questions bypass the test',()=>{
 for(const path of ['/final-test','/final-test/1','/final-test/5','/final-test/review','/complete'])assert.equal(m.allowedPath(path,m.initialState()),'/stories');
 let s=ready();assert.equal(m.allowedPath('/complete',s),'/final-test/1');assert.equal(m.allowedPath('/final-test/review',s),'/final-test/1');assert.equal(m.allowedPath('/final-test/5',s),'/final-test/1');
 s.stats.completed=false;assert.equal(m.allowedPath('/final-test/1',s),'/statistics/1');assert.equal(answer(s,1),s);
});
test('answers, back visits, completion, replay and reload never alter story or statistics progress',()=>{
 let s=ready();const stories=structuredClone(s.stories),stats=structuredClone(s.stats);
 for(let n=1;n<=5;n++){assert.equal(m.reducer(s,{type:'FINAL_NEXT',page:n}),s);s=answer(s,n);s=m.reducer(s,{type:'FINAL_NEXT',page:n});assert.deepEqual(m.restore(JSON.stringify(s)),s);}
 assert.equal(s.finalTest.completed,true);assert.equal(m.allowedPath('/final-test/review',s),'/final-test/review');assert.equal(m.allowedPath('/complete',s),'/complete');
 s=m.reducer(s,{type:'FINAL_VISIT',page:2});assert.equal(s.finalTest.completed,true);assert.deepEqual(s.stories,stories);assert.deepEqual(s.stats,stats);
 s=m.reducer(s,{type:'FINAL_RESET'});assert.deepEqual(s.finalTest,m.initialState().finalTest);assert.deepEqual(s.stories,stories);assert.deepEqual(s.stats,stats);assert.equal(m.allowedPath('/complete',s),'/final-test/1');
});
test('legacy versions keep stories, stats and old quiz but never acquire final-test answers',()=>{
 for(const version of [1,2,3,4,5,6]) {const s=ready();s.version=version;delete s.finalTest;if(version===1){s.nikita=s.stories.nikita;delete s.stories;}s.cursor='/complete';const b=m.restore(JSON.stringify(s));assert.deepEqual(b.finalTest,m.initialState().finalTest);assert.deepEqual(b.stats,s.stats);assert.deepEqual(b.quiz,s.quiz);if(version!==1){assert.deepEqual(b.stories,s.stories);assert.equal(b.cursor,'/final-test/1');}}
});
test('malformed or incompatible test state cannot manufacture completion',()=>{
 const s=ready();s.finalTest={revision:'1.0',answers:{1:'A',2:'D',3:'A',4:'B',5:'B'},completed:true,currentQuestion:999};let b=m.restore(JSON.stringify(s));assert.equal(b.finalTest.completed,false);assert.equal(b.finalTest.currentQuestion,2);assert.equal(m.allowedPath('/complete',b),'/final-test/2');
 s.finalTest.revision='other';b=m.restore(JSON.stringify(s));assert.deepEqual(b.finalTest,m.initialState().finalTest);
 const start=ready();assert.equal(answer(start,5),start);
});
