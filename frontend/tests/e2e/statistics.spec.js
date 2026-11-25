import {expect} from '@playwright/test';
import path from 'node:path';
import {test,noOverflow} from './support.js';
import * as model from '../../src/state/model.js';
import {storyRegistry} from '../../src/content/storyRegistry.js';
import {finishStory} from '../story-helpers.js';
import {statisticsRecords as r} from '../../src/content/statisticsExhibition.js';
const complete=()=>['liza','nikita','ilya'].reduce((s,id)=>finishStory(s,id,model,storyRegistry),model.initialState());
const artifacts=process.env.ARTIFACT_DIR||path.resolve('../../output');
async function seed(page,s){await page.goto('http://pilot.test/');await page.evaluate(s=>localStorage.setItem('invisible-stories:pilot:v1',JSON.stringify(s)),s);}
const saved=page=>page.evaluate(()=>JSON.parse(localStorage.getItem('invisible-stories:pilot:v1')));
test('three pages: exact records, navigation, top, screenshots, sources and progress',async({page},info)=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));const state=complete();await seed(page,state);
 await page.goto('http://pilot.test/stories');await page.getByRole('button',{name:'Перейти к „Невидимой статистике“'}).click();
 for(let n=1;n<=3;n++) {
  await expect(page).toHaveURL(`http://pilot.test/statistics/${n}`);await expect(page.locator('.statistics-section')).toHaveCount(1);
  await expect(page.getByLabel(`Страница ${n} из 3`)).toHaveText(`0${n} / 03`);
  await expect(page.locator('.statistics-shell')).toHaveCSS('background-color','rgb(241, 233, 225)');await expect.poll(()=>page.evaluate(()=>scrollY)).toBe(0);
  for(const key of n===1?['recognition']:n===2?['global','regional']:['neglect','alcohol']) {
   await expect(page.locator('main')).toContainText(r[key].limitation);
   await expect(page.getByRole('link',{name:r[key].source.label,exact:false})).toHaveAttribute('href',r[key].source.url);
  }
  if(n===1){await expect(page.locator('.recognition-bar')).toHaveCount(4);for(const [name,value] of r.recognition.values) await expect(page.locator('.recognition-bar').filter({hasText:name})).toContainText(String(value).replace('.',',')+'%');await expect(page.locator('main')).toContainText('опрос 1600 взрослых жителей России');}
  if(n===2){await expect(page.locator('.statistics-dots .is-highlighted')).toHaveCount(6);const v=await page.locator('.statistics-range-track > span').evaluate(el=>({left:el.offsetLeft,width:el.offsetWidth,parent:el.parentElement.offsetWidth}));expect(Math.abs(v.left/v.parent-.36)).toBeLessThan(.01);expect(Math.abs(v.width/v.parent-.33)).toBeLessThan(.01);}
  if(n===3){await expect(page.locator('main')).toContainText('NSDUH, 2023');await expect(page.getByRole('link',{name:r.alcohol.explanationSource.label,exact:false})).toHaveAttribute('href',r.alcohol.explanationSource.url);}
  for(const width of [320,390,768,1440,1920]) {await page.setViewportSize({width,height:1000});await noOverflow(page);}
  const width=info.project.name==='desktop'?1440:390;await page.setViewportSize({width,height:1000});await page.evaluate(()=>document.fonts.ready);
  await page.screenshot({path:`${artifacts}/statistics-page-${n}-${width}px.png`,fullPage:true});
  await page.reload();await expect(page).toHaveURL(`http://pilot.test/statistics/${n}`);expect((await saved(page)).stats.currentPage).toBe(n);
  const source=page.locator('main a').first();await source.focus();await expect(source).toHaveCSS('outline-style','solid');
  expect((await saved(page)).stats.completed).toBe(false);expect((await saved(page)).stories).toEqual(state.stories);
  if(n<3){await page.evaluate(()=>scrollTo(0,document.body.scrollHeight));await page.getByRole('button',{name:'Далее',exact:true}).click();}
 }
 await page.getByRole('button',{name:'Назад',exact:true}).click();await expect(page).toHaveURL(/\/statistics\/2$/);await expect.poll(()=>page.evaluate(()=>scrollY)).toBe(0);
 await page.getByRole('button',{name:'Далее',exact:true}).click();await page.getByRole('button',{name:'Завершить просмотр'}).click();await expect(page).toHaveURL(/\/final-test\/1$/);
 expect((await saved(page)).stats.completed).toBe(true);expect((await saved(page)).stories).toEqual(state.stories);
 await page.goto('http://pilot.test/stories');await page.getByRole('button',{name:'Перейти к „Невидимой статистике“'}).click();await expect(page).toHaveURL(/\/statistics\/1$/);expect((await saved(page)).stats.completed).toBe(true);
 await page.getByRole('button',{name:'Вернуться к историям',exact:true}).click();await expect(page).toHaveURL(/\/stories$/);expect(errors).toEqual([]);
});
test('legacy fourth URL cannot manufacture completion; gate and reset',async({page})=>{
 for(const done of [false,true]) {
  const s=complete();s.stats={unlocked:3,completed:done,filter:'Только нефизические',expanded:['global'],answer:1,revealed:true};await seed(page,s);
  await page.goto('http://pilot.test/statistics/4');await expect(page).toHaveURL(/\/statistics\/3$/);expect((await saved(page)).stats.completed).toBe(done);expect((await saved(page)).stories).toEqual(s.stories);
  await page.goto('http://pilot.test/statistics');await expect(page).toHaveURL(/\/statistics\/1$/);
  expect((await saved(page)).stats.filter).toBe(s.stats.filter);expect((await saved(page)).stats.answer).toBe(1);
 }
 const locked=complete();locked.stories.ilya=model.initialState().stories.ilya;locked.stats.completed=true;locked.stats.unlocked=3;await seed(page,locked);
 for(const url of ['/statistics','/statistics/1','/statistics/2','/statistics/3','/statistics/4','/complete']) {await page.goto(`http://pilot.test${url}`);await expect(page).toHaveURL(/\/stories$/);}
 await page.getByRole('button',{name:'Начать заново',exact:true}).click();await page.getByRole('button',{name:'Удалить прогресс и начать'}).click();await expect(page).toHaveURL('http://pilot.test/');await page.goto('http://pilot.test/statistics/1');await expect(page).toHaveURL(/\/stories$/);await expect(page.getByRole('button',{name:'Перейти к „Невидимой статистике“'})).toBeDisabled();
});
