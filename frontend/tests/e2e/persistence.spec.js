import {expect} from '@playwright/test';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {test} from './support.js';
import * as model from '../../src/state/model.js';
import {RESET_KEY} from '../../src/state/persistence.js';
import {storyRegistry} from '../../src/content/storyRegistry.js';
import {finishStory} from '../story-helpers.js';
const key=model.STORAGE_KEY;
const seed=()=>{let s=['liza','nikita','ilya'].reduce((s,id)=>finishStory(s,id,model,storyRegistry),model.initialState());s=model.reducer(s,{type:'STATS_COMPLETE'});for(const [id,value] of [['1','B'],['2','C']]){s=model.reducer(s,{type:'FINAL_ANSWER',id,value});s=model.reducer(s,{type:'FINAL_NEXT',page:Number(id)});}return model.reducer(s,{type:'CURSOR',path:'/final-test/3'});};
const saved=page=>page.evaluate(key=>JSON.parse(localStorage.getItem(key)),key);
async function siblingRoutes(context){await context.route('http://pilot.test/**',async route=>{const url=new URL(route.request().url());const file=url.pathname.startsWith('/assets/')?path.join(process.cwd(),'dist',url.pathname):path.join(process.cwd(),'dist/index.html');await route.fulfill({body:await readFile(file),contentType:({'.html':'text/html','.js':'application/javascript','.css':'text/css','.jpg':'image/jpeg','.webp':'image/webp'})[path.extname(file)]||'application/octet-stream'});});}
test('migrate session once, reopen tabs, preserve final answers and reject stale legacy after reset',async({page,context})=>{
 await siblingRoutes(context);const original=seed();await page.goto('http://pilot.test/');await page.evaluate(({key,reset,s})=>{localStorage.removeItem(key);localStorage.removeItem(reset);sessionStorage.setItem(key,JSON.stringify(s));},{key,reset:RESET_KEY,s:original});await page.reload();
 expect(await saved(page)).toEqual(original);expect(await page.evaluate(key=>sessionStorage.getItem(key),key)).toBeNull();await page.goto('http://pilot.test/final-test/3');
 const second=await context.newPage();await second.goto('http://pilot.test/final-test/3');await expect(second).toHaveURL(/\/final-test\/3$/);expect((await saved(second)).finalTest.answers).toEqual({'1':'B','2':'C'});await page.close();await second.close();
 const reopened=await context.newPage();await reopened.goto('http://pilot.test/final-test/3');await expect(reopened).toHaveURL(/\/final-test\/3$/);expect((await saved(reopened)).stories).toEqual(original.stories);await reopened.reload();expect((await saved(reopened)).finalTest.answers).toEqual(original.finalTest.answers);
 const stale=await context.newPage();await stale.goto('http://pilot.test/final-test/3');await stale.evaluate(({key,s})=>sessionStorage.setItem(key,JSON.stringify(s)),{key,s:original});
 await reopened.getByRole('button',{name:'Начать заново',exact:true}).click();await reopened.getByRole('button',{name:'Отмена',exact:true}).click();expect((await saved(reopened)).finalTest.answers).toEqual(original.finalTest.answers);
 await reopened.getByRole('button',{name:'Начать заново',exact:true}).click();await reopened.getByRole('button',{name:'Удалить прогресс и начать',exact:true}).click();await expect(reopened).toHaveURL('http://pilot.test/');
 await expect(stale).toHaveURL(/\/stories$/);expect((await saved(stale)).finalTest.answers).toEqual({});expect(await stale.evaluate(key=>sessionStorage.getItem(key),key)).toBeNull();
 // Even an obsolete legacy session inserted later cannot replace the reset record.
 await stale.evaluate(({key,s})=>sessionStorage.setItem(key,JSON.stringify(s)),{key,s:original});await stale.reload();expect((await saved(stale)).stories.liza.completed).toBe(false);expect((await saved(stale)).stats.completed).toBe(false);expect((await saved(stale)).finalTest.answers).toEqual({});
 const fresh=await context.newPage();await fresh.goto('http://pilot.test/stories');await expect(fresh.locator('[aria-labelledby="card-liza"] .archive-card-status')).toHaveText('Доступна');await expect(fresh.getByRole('button',{name:'Перейти к „Невидимой статистике“'})).toBeDisabled();await reopened.close();await stale.close();await fresh.close();
});
test('local data wins over old session; corrupted and incompatible records recover safely',async({page})=>{
 const original=seed();await page.goto('http://pilot.test/');
 for(const raw of ['{bad',JSON.stringify({...original,version:99}),JSON.stringify({...original,contentVersion:'other'})]){
  await page.evaluate(({key,raw,s})=>{localStorage.setItem(key,raw);sessionStorage.setItem(key,JSON.stringify(s));},{key,raw,s:original});await page.reload();expect((await saved(page)).stories.liza.completed).toBe(false);expect((await saved(page)).finalTest.answers).toEqual({});expect(await page.evaluate(key=>sessionStorage.getItem(key),key)).toBeNull();
 }
 await page.evaluate(({key,s})=>{localStorage.setItem(key,JSON.stringify(s));sessionStorage.setItem(key,JSON.stringify({...s,finalTest:{revision:'1.0',answers:{},currentQuestion:1,completed:false}}));},{key,s:original});await page.reload();expect((await saved(page)).finalTest.answers).toEqual(original.finalTest.answers);
});
