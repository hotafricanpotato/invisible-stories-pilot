import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import content from '../src/content/epilogue.json' with {type:'json'};
import final from '../src/content/finalTest.json' with {type:'json'};
import * as m from '../src/state/model.js';
import {storyRegistry} from '../src/content/storyRegistry.js';
import {finishStory} from './story-helpers.js';
const storiesDone=()=>['liza','nikita','ilya'].reduce((s,id)=>finishStory(s,id,m,storyRegistry),m.initialState());
const ready=()=>{let s=m.reducer(storiesDone(),{type:'STATS_COMPLETE'});for(const q of final.questions){s=m.reducer(s,{type:'FINAL_ANSWER',id:q.id,value:q.key});s=m.reducer(s,{type:'FINAL_NEXT',page:Number(q.id)});}return s;};
test('epilogue exactly reproduces approved paragraphs, punctuation, emphasis and separators',()=>{
 const source=readFileSync(new URL('./fixtures/epilogue-approved.md',import.meta.url),'utf8');
 const render=b=>b.type==='divider'?'---':b.type==='strong'?`**${b.text}**`:b.type==='note'?`*${b.text}*`:b.text;
 assert.equal(`# ${content.title}\n\n${content.blocks.map(render).join('\n\n')}\n`,source);
 assert.equal(content.title,'Невидимое не значит несуществующее.');assert.equal(content.blocks.filter(b=>b.type==='strong').length,4);
 assert.equal(content.sources[0].url,'https://www.rscf.ru/project/24-28-00424/');assert.equal(content.sources[1].url,'https://journals.rudn.ru/sociology/article/view/43856');
});
test('epilogue and legacy complete require stories, statistics and valid completed final test',()=>{
 for(const route of ['/epilogue','/complete']){
  assert.equal(m.allowedPath(route,m.initialState()),'/stories');let s=storiesDone();assert.equal(m.allowedPath(route,s),'/statistics/1');s=m.reducer(s,{type:'STATS_COMPLETE'});assert.equal(m.allowedPath(route,s),'/final-test/1');
  s.finalTest.completed=true;assert.equal(m.allowedPath(route,s),'/final-test/1');s=ready();assert.equal(m.allowedPath(route,s),'/epilogue');delete s.finalTest.answers['3'];assert.equal(m.allowedPath(route,s),'/final-test/3');
 }
});
test('opening, reloading and returning from epilogue preserve progress; reset and legacy cursors are safe',()=>{
 const s=ready();for(const version of [2,3,4,5,6]){const input={...s,version,cursor:'/complete'};const restored=m.restore(JSON.stringify(input));assert.equal(restored.cursor,'/epilogue');assert.deepEqual(restored.stories,s.stories);assert.deepEqual(restored.stats,s.stats);assert.deepEqual(restored.finalTest,s.finalTest);}
 let current=m.reducer(s,{type:'CURSOR',path:'/epilogue'});assert.deepEqual(m.restore(JSON.stringify(current)),current);current=m.reducer(current,{type:'CURSOR',path:'/stories'});assert.deepEqual(current.stories,s.stories);assert.deepEqual(current.stats,s.stats);assert.deepEqual(current.finalTest,s.finalTest);
 const reset=m.reducer(current,{type:'RESET'});assert.equal(m.allowedPath('/epilogue',reset),'/stories');assert.deepEqual(reset.finalTest,m.initialState().finalTest);
 const old=ready();delete old.finalTest;old.cursor='/complete';assert.equal(m.restore(JSON.stringify(old)).cursor,'/final-test/1');
});
