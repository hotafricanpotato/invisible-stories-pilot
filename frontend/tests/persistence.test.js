import test from 'node:test';
import assert from 'node:assert/strict';
import {initialState,restore,STORAGE_KEY} from '../src/state/model.js';
import {loadProgress,saveProgress,resetProgress,RESET_KEY} from '../src/state/persistence.js';
const memory=()=>{const data=new Map();return {data,getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,String(v)),removeItem:k=>data.delete(k)};};
const setup=()=>{const local=memory(),session=memory();return {local,session,stores:{local:()=>local,session:()=>session}};};
const partial=()=>({...initialState(),cursor:'/stories/liza/introduction',stories:{...initialState().stories,liza:{...initialState().stories.liza,started:true}}});
test('migrate legacy versions once, keep storage key and normalized progress, delete legacy only after successful write',()=>{
 for(const version of [1,2,3,4,5,6]){const {local,session,stores}=setup();const s={...partial(),version};if(version===1){s.nikita=s.stories.nikita;delete s.stories;s.cursor="/";}session.setItem(STORAGE_KEY,JSON.stringify(s));const result=loadProgress(stores);assert.deepEqual(result.state,restore(JSON.stringify(s)));assert.equal(result.available,true);assert.deepEqual(JSON.parse(local.getItem(STORAGE_KEY)),result.state);assert.equal(session.getItem(STORAGE_KEY),null);session.setItem(STORAGE_KEY,JSON.stringify(partial()));assert.deepEqual(loadProgress(stores).state,result.state);assert.equal(session.getItem(STORAGE_KEY),null);}
});
test('existing local record wins, including malformed or incompatible records; do not resurrect legacy',()=>{
 for(const raw of [JSON.stringify(partial()),'{broken',JSON.stringify({...partial(),version:99}),JSON.stringify({...partial(),contentVersion:'other'})]){const {local,session,stores}=setup();local.setItem(STORAGE_KEY,raw);session.setItem(STORAGE_KEY,JSON.stringify(partial()));const r=loadProgress(stores);assert.deepEqual(r.state,restore(raw));assert.equal(session.getItem(STORAGE_KEY),null);}
});
test('reset clears both old states, preserves unrelated data, and blocks stale tabs or later legacy migration',()=>{
 const {local,session,stores}=setup();local.setItem('unrelated','keep');session.setItem('unrelated','keep');session.setItem(STORAGE_KEY,JSON.stringify(partial()));const old=loadProgress(stores);session.setItem(STORAGE_KEY,JSON.stringify(partial()));const reset=resetProgress(stores);assert.deepEqual(reset.state,initialState());assert.equal(session.getItem(STORAGE_KEY),null);assert.deepEqual(JSON.parse(local.getItem(STORAGE_KEY)),initialState());assert.notEqual(reset.epoch,old.epoch);assert.equal(local.getItem('unrelated'),'keep');assert.equal(session.getItem('unrelated'),'keep');const stale=saveProgress(partial(),old.epoch,stores);assert.equal(stale.conflict,true);assert.deepEqual(stale.state,initialState());assert.deepEqual(JSON.parse(local.getItem(STORAGE_KEY)),initialState());
 local.removeItem(STORAGE_KEY);session.setItem(STORAGE_KEY,JSON.stringify(partial()));assert.deepEqual(loadProgress(stores).state,initialState());assert.equal(session.getItem(STORAGE_KEY),null);assert.equal(local.getItem(RESET_KEY),reset.epoch);
});
test('unavailable storage and quota errors never throw or discard the sole legacy copy during migration',()=>{
 const {local,session,stores}=setup();session.setItem(STORAGE_KEY,JSON.stringify(partial()));local.setItem=()=>{throw Error('quota');};let result=loadProgress(stores);assert.equal(result.available,false);assert.deepEqual(result.state,partial());assert.notEqual(session.getItem(STORAGE_KEY),null);assert.equal(saveProgress(partial(),'0',stores).available,false);assert.equal(resetProgress(stores).available,false);assert.equal(session.getItem(STORAGE_KEY),null);assert.equal(local.getItem(STORAGE_KEY),null);
 const denied={local:()=>{throw Error('blocked');},session:()=>{throw Error('blocked');}};assert.deepEqual(loadProgress(denied).state,initialState());assert.equal(loadProgress(denied).available,false);assert.equal(resetProgress(denied).available,false);
});
test('invalid legacy input produces a safe fresh state and no additional personal fields',()=>{
 for(const raw of ['bad',JSON.stringify({version:100}),JSON.stringify({...partial(),contentVersion:'wrong'})]){const {session,stores}=setup();session.setItem(STORAGE_KEY,raw);const r=loadProgress(stores);assert.deepEqual(r.state,initialState());assert.equal(r.available,true);}
});
