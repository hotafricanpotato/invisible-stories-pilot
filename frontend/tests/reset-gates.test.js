import test from 'node:test';
import assert from 'node:assert/strict';
import * as model from '../src/state/model.js';
import {storyRegistry} from '../src/content/storyRegistry.js';
import {finishStory} from './story-helpers.js';
test('reset revokes every closed route while preserving first-story access',()=>{
 let s=['liza','nikita','ilya'].reduce((s,id)=>finishStory(s,id,model,storyRegistry),model.initialState());s=model.reducer(s,{type:'STATS_COMPLETE'});
 for(const [id,value] of [['1','B'],['2','C'],['3','A'],['4','B'],['5','B']]){s=model.reducer(s,{type:'FINAL_ANSWER',id,value});s=model.reducer(s,{type:'FINAL_NEXT',page:Number(id)});}
 assert.equal(model.allowedPath('/epilogue',s),'/epilogue');
 s=model.reducer(s,{type:'RESET'});assert.deepEqual(s,model.initialState());
 for(const route of ['/epilogue','/complete','/statistics/2','/final-test/3','/final-test/review','/stories/nikita/sunday','/stories/ilya/introduction']) assert.equal(model.allowedPath(route,s),'/stories');
 assert.equal(model.allowedPath('/',s),'/');assert.equal(model.allowedPath('/stories/liza/introduction',s),'/stories/liza/introduction');
});
