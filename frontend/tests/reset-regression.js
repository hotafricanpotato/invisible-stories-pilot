import {expect} from '@playwright/test';
import * as model from '../src/state/model.js';
import {storyRegistry} from '../src/content/storyRegistry.js';
import {finishStory} from './story-helpers.js';
export function registerResetRegression(test,url){
 test('reset commits both stores before exposing home and immediately guards closed routes',async({page})=>{
  let s=['liza','nikita','ilya'].reduce((s,id)=>finishStory(s,id,model,storyRegistry),model.initialState());s=model.reducer(s,{type:'STATS_COMPLETE'});
  for(const [id,value] of [['1','B'],['2','C'],['3','A'],['4','B'],['5','B']]){s=model.reducer(s,{type:'FINAL_ANSWER',id,value});s=model.reducer(s,{type:'FINAL_NEXT',page:Number(id)});}
  await page.goto(url('/'));await expect(page.locator('.home-shell')).toBeVisible();await page.evaluate(({key,s})=>localStorage.setItem(key,JSON.stringify(s)),{key:model.STORAGE_KEY,s});await page.reload();await page.goto(url('/epilogue'));await expect(page.locator('.epilogue-shell')).toBeVisible();
  await page.evaluate(({key,s})=>{
   sessionStorage.setItem(key,JSON.stringify(s));
   for(const method of ['pushState','replaceState']){const original=history[method].bind(history);history[method]=(...args)=>{
    const target=args[2] && new URL(args[2],location.href);
    if(target && (target.hash ? target.hash==='#/' : target.pathname==='/'))window.__resetAtHome={local:JSON.parse(localStorage.getItem(key)),session:sessionStorage.getItem(key)};
    return original(...args);
   };}
  },{key:model.STORAGE_KEY,s});
  await page.getByRole('button',{name:'Начать заново',exact:true}).click();await page.getByRole('button',{name:'Удалить прогресс и начать',exact:true}).click();await expect(page).toHaveURL(url('/'));
  const boundary=await page.evaluate(()=>window.__resetAtHome);
  expect(boundary.session).toBeNull();expect(boundary.local).toEqual(model.initialState());
  // No delay, reload, or extra waiting for storage before the first closed URL.
  await page.goto(url('/epilogue'));await expect(page).toHaveURL(url('/stories'));
  for(const route of ['/statistics/2','/final-test/3','/final-test/review','/complete','/stories/nikita/sunday','/stories/ilya/introduction']){await page.goto(url(route));await expect(page).toHaveURL(url('/stories'));}
  await page.reload();await expect(page).toHaveURL(url('/stories'));
  const saved=await page.evaluate(key=>({local:JSON.parse(localStorage.getItem(key)),session:sessionStorage.getItem(key)}),model.STORAGE_KEY);
  expect(saved.session).toBeNull();expect(saved.local.stories).toEqual(model.initialState().stories);expect(saved.local.finalTest).toEqual(model.initialState().finalTest);expect(saved.local.stats).toEqual(model.initialState().stats);
  await page.getByRole('button',{name:'Начать историю',exact:true}).first().click();await expect(page).toHaveURL(url('/stories/liza/introduction'));
 });
}
