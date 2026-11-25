import {test,expect} from '@playwright/test';
import http from 'node:http';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import * as model from '../../src/state/model.js';
import {storyRegistry} from '../../src/content/storyRegistry.js';
import {finishStory} from '../story-helpers.js';
let server,origin;
const prefix='/invisible-stories-pilot/';
test.beforeAll(async()=>{
 server=http.createServer(async(req,res)=>{
  const p=new URL(req.url,'http://local').pathname;
  // Deliberately no SPA fallback, exactly like a plain static host.
  if(!p.startsWith(prefix)){res.writeHead(404);res.end();return;}
  const relative=decodeURIComponent(p.slice(prefix.length)) || 'index.html';
  if(relative.split('/').includes('..')){res.writeHead(404);res.end();return;}
  try {const file=path.join(process.cwd(),'dist-pages',relative);const body=await readFile(file);res.setHeader('Content-Type',({'.html':'text/html','.js':'application/javascript','.css':'text/css','.webp':'image/webp','.jpg':'image/jpeg'})[path.extname(file)]||'application/octet-stream');res.end(body);}catch{res.writeHead(404);res.end('Not found');}
 });await new Promise(r=>server.listen(0,'127.0.0.1',r));origin=`http://127.0.0.1:${server.address().port}`;
});
test.afterAll(async()=>{await new Promise(r=>server.close(r));});
const url=route=>origin+prefix+'#'+route;
const key=model.STORAGE_KEY;
function completed(){let s=['liza','nikita','ilya'].reduce((s,id)=>finishStory(s,id,model,storyRegistry),model.initialState());s=model.reducer(s,{type:'STATS_COMPLETE'});return s;}
async function seed(page,s){await page.goto(url('/'));await expect(page.locator('.home-shell')).toBeVisible();await page.evaluate(({key,s})=>localStorage.setItem(key,JSON.stringify(s)),{key,s});await page.reload();await expect(page.locator('.home-shell')).toBeVisible();}
async function images(page){await page.waitForFunction(()=>[...document.images].every(i=>i.complete&&i.naturalWidth>0));for(const img of await page.locator('img').all())expect(await img.getAttribute('src')).toMatch(/^\/invisible-stories-pilot\/assets\//);}
test('static subpath, direct links, guards, reload, all story resources and keyboard skip',async({page,request})=>{
 const errors=[];const failures=[];page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)failures.push(r.url());});
 expect((await request.get(origin+prefix+'statistics/2')).status()).toBe(404);
 await page.goto(url('/epilogue'));await expect(page).toHaveURL(/#\/stories$/);
 await page.goto(url('/statistics/2'));await expect(page).toHaveURL(/#\/stories$/);
 await page.goto(url('/final-test/3'));await expect(page).toHaveURL(/#\/stories$/);
 await page.goto(url('/'));await expect(page.locator('.home-shell')).toBeVisible();await page.locator('.skip-link').focus();await page.keyboard.press('Enter');await expect(page.locator('main')).toBeFocused();expect(new URL(page.url()).hash).toBe('#/');await images(page);
 await page.getByRole('button',{name:/^(Начать|Продолжить) выставку →$/}).click();await expect(page).toHaveURL(/#\/stories$/);await images(page);
 await seed(page,completed());
 for(const [id,story] of Object.entries(storyRegistry))for(const step of story.steps){await page.goto(url(`/stories/${id}/${step.id}`));await page.reload();await expect(page.locator('.story-shell')).toBeVisible();await images(page);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);}
 for(const route of ['/statistics/1','/statistics/2','/statistics/3','/final-test/1']){await page.goto(url(route));await expect(page.locator('main')).toBeVisible();await page.reload();await expect(page).toHaveURL(url(route));}
 await page.goto(url('/statistics/4'));await expect(page).toHaveURL(/#\/statistics\/3$/);
 expect(errors).toEqual([]);expect(failures).toEqual([]);
});
test('saved final answers survive reload/reopened tab, browser navigation and reset',async({page,context})=>{
 let s=completed();for(const [id,value] of [['1','B'],['2','C']]){s=model.reducer(s,{type:'FINAL_ANSWER',id,value});s=model.reducer(s,{type:'FINAL_NEXT',page:Number(id)});}await seed(page,s);
 await page.goto(url('/final-test/3'));await page.reload();await expect(page).toHaveURL(url('/final-test/3'));
 const reopened=await context.newPage();await page.close();await reopened.goto(url('/final-test/3'));expect((await reopened.evaluate(key=>JSON.parse(localStorage.getItem(key)),key)).finalTest.answers).toEqual({'1':'B','2':'C'});
 for(const [id,value] of [['3','A'],['4','B'],['5','B']]){s=model.reducer(s,{type:'FINAL_ANSWER',id,value});s=model.reducer(s,{type:'FINAL_NEXT',page:Number(id)});}await seed(reopened,s);
 await reopened.goto(url('/epilogue'));await expect(reopened.locator('.epilogue-shell')).toBeVisible();await reopened.reload();await expect(reopened).toHaveURL(url('/epilogue'));
 await reopened.getByRole('button',{name:'Вернуться к историям',exact:true}).click();await expect(reopened).toHaveURL(/#\/stories$/);await reopened.goBack();await expect(reopened).toHaveURL(/#\/epilogue$/);await reopened.goForward();await expect(reopened).toHaveURL(/#\/stories$/);
 await reopened.getByRole('button',{name:'Начать заново',exact:true}).click();await reopened.getByRole('button',{name:'Отмена',exact:true}).click();expect((await reopened.evaluate(key=>JSON.parse(localStorage.getItem(key)),key)).finalTest.completed).toBe(true);
 await reopened.getByRole('button',{name:'Начать заново',exact:true}).click();await reopened.getByRole('button',{name:'Удалить прогресс и начать',exact:true}).click();await expect(reopened).toHaveURL(url('/'));await reopened.goto(url('/epilogue'));await expect(reopened).toHaveURL(/#\/stories$/);
});
test('every public resource is served byte-identically under the repository prefix',async({request})=>{
 const {readdir}=await import('node:fs/promises');
 async function walk(dir){const files=[];for(const entry of await readdir(dir,{withFileTypes:true})){const f=path.join(dir,entry.name);if(entry.isDirectory())files.push(...await walk(f));else files.push(f);}return files;}
 const publicRoot=path.join(process.cwd(),'public');
 for(const file of await walk(publicRoot)){const relative=path.relative(publicRoot,file).split(path.sep).join('/');const response=await request.get(origin+prefix+relative);expect(response.status(),relative).toBe(200);expect(Buffer.compare(await response.body(),await readFile(file)),relative).toBe(0);}
});

import {registerResetRegression} from '../reset-regression.js';
registerResetRegression(test,url);
