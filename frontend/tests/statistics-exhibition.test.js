import test from 'node:test';
import assert from 'node:assert/strict';
import {statisticsRecords as r} from '../src/content/statisticsExhibition.js';
import {initialState,reducer,restore,allowedPath} from '../src/state/model.js';
import * as model from '../src/state/model.js';
import {storyRegistry} from '../src/content/storyRegistry.js';
import {finishStory} from './story-helpers.js';
const completed=()=>['liza','nikita','ilya'].reduce((s,id)=>finishStory(s,id,model,storyRegistry),initialState());
test('five approved records, one shared UNICEF estimate and exact sources/definitions',()=>{
 assert.equal(Object.keys(r).length,5);
 assert.deepEqual(r.recognition.values.map(v=>v[1]),[95.5,88,87,61.3]);
 assert.equal(r.recognition.sampleSize,1600);assert.equal(r.recognition.population,'взрослые жители России');
 assert.equal(r.global.numerator,6);assert.equal(r.global.denominator,10);assert.equal(r.global.publicationDate,'2024-06-11');
 assert.equal(r.global.source.url,'https://www.unicef.org/press-releases/nearly-400-million-young-children-worldwide-regularly-experience-violent-discipline');
 assert.deepEqual([r.regional.min,r.regional.max],[40,69]);
 assert.deepEqual([r.neglect.value,r.neglect.affected,r.neglect.sampleSize],[35.7,81,227]);
 assert.equal(r.neglect.source.url,'https://psyjournals.ru/journals/sps/archive/2016_n2/volkova');
 assert.equal(r.neglect.publicationYear,2016);assert.equal(r.neglect.dataPeriod,null);
 assert.equal(r.alcohol.age,'младше 18 лет');assert.equal(r.alcohol.dataPeriod,'2023');assert.equal(r.alcohol.publicationYear,2025);
 assert.equal(r.alcohol.qualifier,'moreThan');assert.equal(r.alcohol.source.url,'https://jamanetwork.com/journals/jamapediatrics/fullarticle/2833575');
 assert.equal(r.alcohol.explanationSource.url,'https://www.nih.gov/news-events/nih-research-matters/millions-us-kids-live-parents-substance-use-disorders');
});
test('canonical page, every legacy URL and completion require all three stories',()=>{
 let s=initialState();
 for(const id of ['liza','nikita','ilya']) {
  for(const url of ['/statistics','/statistics/1','/statistics/2','/statistics/3','/statistics/4','/complete']) assert.equal(allowedPath(url,s),'/stories');
  assert.equal(reducer(s,{type:'STATS_COMPLETE'}),s);
  s=finishStory(s,id,model,storyRegistry);
 }
 for(const url of ['/statistics','/statistics/1','/statistics/2','/statistics/3','/statistics/4']) assert.equal(allowedPath(url,s),url==='/statistics'?'/statistics/1':url==='/statistics/4'?'/statistics/3':url);
 assert.equal(allowedPath('/complete',s),'/statistics/1');
 const before=structuredClone(s.stories);
 s=reducer(s,{type:'STATS_COMPLETE'});assert.equal(s.stats.completed,true);assert.equal(s.stats.unlocked,3);
 assert.deepEqual(s.stories,before);assert.equal(allowedPath('/complete',s),'/complete');
 assert.deepEqual(restore(JSON.stringify(s)),s);
});
test('old opened screens, filters, answers and completion are retained on canonical migration',()=>{
 for(const version of [1,2,3,4,5,6]) for(const done of [false,true]) {
  const s=completed();s.version=version;s.stats={unlocked:done?3:2,completed:done,filter:'Только нефизические',expanded:['global','connection-1'],answer:1,revealed:true};s.cursor='/statistics/4';
  if(version===1) {s.nikita=s.stories.nikita;delete s.stories;}
  const b=restore(JSON.stringify(s));assert.deepEqual(b.stats,s.stats);
  assert.equal(b.cursor,version===1?'/stories':'/statistics/3');
  assert.equal(b.stories.nikita.completed,true);
 }
 const s=reducer(completed(),{type:'STATS_COMPLETE'});
 const reset=reducer(s,{type:'RESET'});assert.equal(reset.stats.completed,false);assert.equal(allowedPath('/statistics',reset),'/stories');
});

test('page visits preserve completion and stories; invalid or locked visits do nothing',()=>{
 let s=completed();const stories=structuredClone(s.stories);
 for(const page of [1,2,3,2,1]) {s=reducer(s,{type:'STATS_VISIT',page});assert.equal(s.stats.currentPage,page);assert.equal(s.stats.completed,false);assert.deepEqual(s.stories,stories);assert.deepEqual(restore(JSON.stringify(s)),s);}
 assert.equal(reducer(s,{type:'STATS_VISIT',page:4}),s);
 const locked=initialState();assert.equal(reducer(locked,{type:'STATS_VISIT',page:1}),locked);
 s=reducer(s,{type:'STATS_COMPLETE'});s=reducer(s,{type:'STATS_VISIT',page:1});assert.equal(s.stats.completed,true);
});
