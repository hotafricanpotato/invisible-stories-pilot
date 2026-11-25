import {expect} from '@playwright/test';
import path from 'node:path';
import {test,noOverflow} from './support.js';
import * as model from '../../src/state/model.js';
import {storyRegistry} from '../../src/content/storyRegistry.js';
import {finishStory} from '../story-helpers.js';
import content from '../../src/content/finalTest.json' with {type:'json'};
const ready=()=>['liza','nikita','ilya'].reduce((s,id)=>finishStory(s,id,model,storyRegistry),model.initialState());
const saved=page=>page.evaluate(()=>JSON.parse(sessionStorage.getItem('invisible-stories:pilot:v1')));
async function seed(page,s){await page.goto('http://pilot.test/');await page.evaluate(s=>sessionStorage.setItem('invisible-stories:pilot:v1',JSON.stringify(s)),s);}
const artifacts=process.env.ARTIFACT_DIR||path.resolve('../../output');
test('exact five-question route, review, reload, replay and screenshots',async({page},info)=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));const original=ready();await seed(page,original);await page.goto('http://pilot.test/statistics/1');
 await page.getByRole('button',{name:'Далее',exact:true}).click();await page.getByRole('button',{name:'Далее',exact:true}).click();await page.getByRole('button',{name:'Завершить просмотр',exact:true}).click();
 const before=await saved(page),width=info.project.name==='desktop'?1440:390;await page.setViewportSize({width,height:1000});const choices=['A','C','C','B','A'];
 for(const [i,q] of content.questions.entries()){
  const n=i+1;await expect(page).toHaveURL(`http://pilot.test/final-test/${n}`);await expect.poll(()=>page.evaluate(()=>scrollY)).toBe(0);
  await expect(page.getByRole('heading',{level:1})).toHaveText(content.title);await expect(page.locator('main')).toContainText(q.situation);await expect(page.locator('legend')).toHaveText(q.question);
  for(const text of Object.values(q.options))await expect(page.getByRole('radio',{name:text,exact:true})).toHaveCount(1);
  const next=()=>page.getByRole('button',{name:n===5?'Перейти к разбору':'Далее',exact:true});await expect(next()).toBeDisabled();
  if(n===1)for(const p of content.introduction)await expect(page.locator('main')).toContainText(p);
  await page.getByRole('radio',{name:q.options[choices[i]],exact:true}).check();await page.reload();await expect(page.getByRole('radio',{name:q.options[choices[i]],exact:true})).toBeChecked();expect((await saved(page)).finalTest.currentQuestion).toBe(n);
  if(n===1||n===3){await page.evaluate(()=>document.fonts.ready);await page.screenshot({path:`${artifacts}/final-test-question-${n}-${width}px.png`,fullPage:true});}
  for(const w of [320,390,768,1440]){await page.setViewportSize({width:w,height:1000});await noOverflow(page);}await page.setViewportSize({width,height:1000});
  if(n===3){await page.getByRole('button',{name:'Назад',exact:true}).click();await expect(page).toHaveURL(/\/final-test\/2$/);await expect(page.getByRole('radio',{name:content.questions[1].options.C,exact:true})).toBeChecked();await page.getByRole('button',{name:'Далее',exact:true}).click();}
  await next().click();
 }
 await expect(page).toHaveURL(/\/final-test\/review$/);await page.reload();await expect(page.locator('.final-review-entry')).toHaveCount(5);
 for(const [i,q] of content.questions.entries()){const block=page.locator('.final-review-entry').nth(i);await expect(block.locator('dd').first()).toHaveText(`${choices[i]}. ${q.options[choices[i]]}`);await expect(block.locator('dd').last()).toHaveText(`${q.key}. ${q.options[q.key]}`);await expect(block).toContainText(q.explanation);}
 await expect(page.locator('main')).not.toContainText(/балл|процент|до\/после|\d+%/i);await page.screenshot({path:`${artifacts}/final-test-review-${width}px.png`,fullPage:true});await noOverflow(page);
 let s=await saved(page);expect(s.stories).toEqual(original.stories);expect(s.stats).toEqual(before.stats);expect(s.finalTest.completed).toBe(true);
 await page.getByRole('button',{name:'Перейти к эпилогу',exact:true}).click();await expect(page).toHaveURL(/\/epilogue$/);
 await page.goto('http://pilot.test/final-test/review');await page.getByRole('button',{name:'Пройти ещё раз'}).click();await expect(page).toHaveURL(/\/final-test\/1$/);s=await saved(page);expect(s.finalTest.answers).toEqual({});expect(s.finalTest.completed).toBe(false);expect(s.stories).toEqual(original.stories);expect(s.stats).toEqual(before.stats);
 await page.goto('http://pilot.test/complete');await expect(page).toHaveURL(/\/final-test\/1$/);
 for(let n=1;n<=5;n++){await page.getByRole('radio').first().check();await page.getByRole('button',{name:n===5?'Перейти к разбору':'Далее',exact:true}).click();}
 await expect(page).toHaveURL(/\/final-test\/review$/);s=await saved(page);expect(s.finalTest.completed).toBe(true);expect(s.stories).toEqual(original.stories);expect(s.stats).toEqual(before.stats);expect(errors).toEqual([]);
});
test('old completion and direct routes cannot skip test; keyboard and global reset',async({page})=>{
 await page.goto('http://pilot.test/final-test/review');await expect(page).toHaveURL(/\/stories$/);const s=ready();await seed(page,s);await page.goto('http://pilot.test/final-test/1');await expect(page).toHaveURL(/\/statistics\/1$/);
 s.stats.completed=true;s.stats.unlocked=3;delete s.finalTest;s.cursor='/complete';await seed(page,s);
 for(const url of ['/complete','/final-test/5','/final-test/review']){await page.goto('http://pilot.test'+url);await expect(page).toHaveURL(/\/final-test\/1$/);}
 const first=page.getByRole('radio').first();await first.focus();await page.keyboard.press('Space');await expect(first).toBeChecked();await expect(first).toHaveCSS('outline-style','solid');await page.getByRole('button',{name:'Далее',exact:true}).focus();await page.keyboard.press('Enter');await expect(page).toHaveURL(/\/final-test\/2$/);await page.reload();await expect(page).toHaveURL(/\/final-test\/2$/);
 await page.goto('http://pilot.test/final-test/review');await expect(page).toHaveURL(/\/final-test\/2$/);
 await page.getByRole('button',{name:'Начать заново',exact:true}).click();await page.getByRole('button',{name:'Удалить прогресс и начать'}).click();await expect(page).toHaveURL('http://pilot.test/');expect((await saved(page)).finalTest.answers).toEqual({});
});
