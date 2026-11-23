import { expect } from '@playwright/test';
import path from 'node:path';
import { test, completeStoryInBrowser, goNext, noOverflow } from './support.js';
import * as model from '../../src/state/model.js';
import { createExhibitionModel } from '../../src/state/model.js';
import { exhibitionConfig } from '../../src/content/exhibitionConfig.js';
import { storyRegistry } from '../../src/content/storyRegistry.js';
import { finishStory } from '../story-helpers.js';
const button=page=>page.getByRole('button',{name:'Перейти к „Невидимой статистике“'});
const status=(page,id)=>page.locator(`[aria-labelledby="card-${id}"] .archive-card-status`);
const saved=page=>page.evaluate(()=>JSON.parse(sessionStorage.getItem('invisible-stories:pilot:v1')));
const notice='Все три истории завершены. Теперь доступна „Невидимая статистика“';
const artifacts=process.env.ARTIFACT_DIR||path.resolve('../../work');
test('full route twice: three real UI completions, exact notice, reset, replay, statistics and technical finish',async({page},info)=>{
  test.setTimeout(120000);
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://pilot.test/');
  await expect(page.locator('body')).not.toContainText('Пилотная версия');
  await expect(page.locator('main')).toContainText('Три истории.');
  for(let round=0;round<2;round++) {
    await page.getByRole('button',{name:'Начать выставку →'}).click();
    await expect(status(page,'liza')).toHaveText('Доступна');
    for(const id of ['nikita','ilya']) await expect(status(page,id)).toHaveText('Недоступна');
    await expect(page.locator('[aria-labelledby="card-ilya"]')).not.toContainText('В разработке');
    await expect(page.locator('.archive-card-pending')).toHaveCount(0);
    await expect(button(page)).toBeVisible();await expect(button(page)).toBeDisabled();
    await expect(page.locator('#statistics-condition')).toHaveText('„Невидимая статистика“ откроется после прохождения всех трёх историй');
    await expect(page.locator('body')).not.toContainText('Локальное тестирование');
    for(const [index,id] of ['liza','nikita','ilya'].entries()) {
      await completeStoryInBrowser(page,storyRegistry[id]);
      await expect(status(page,id)).toHaveText('Пройдена');
      if(index<2) {
        await expect(button(page)).toBeDisabled();
        const next=['nikita','ilya'][index];await expect(status(page,next)).toHaveText('Доступна');
        await page.goto('http://pilot.test/statistics/1');await expect(page).toHaveURL(/\/stories$/);
      }
    }
    await expect(page).toHaveURL(/\/stories$/);
    for(const id of ['liza','nikita','ilya']) await expect(status(page,id)).toHaveText('Пройдена');
    await expect(page.getByRole('status')).toHaveText(notice);
    await expect(button(page)).toBeEnabled();await noOverflow(page);
    if(round===0) await page.screenshot({path:`${artifacts}/full-stories-completed-${info.project.name}.png`,fullPage:true});
    const completed=await saved(page);
    for(const id of ['liza','nikita','ilya']) {
      await page.locator(`[aria-labelledby="card-${id}"]`).getByRole('button',{name:'Посмотреть снова'}).click();
      await expect(page).toHaveURL(new RegExp(`/stories/${id}/`));
      await page.goto('http://pilot.test/stories');
      const current=await saved(page);
      expect(current.stories[id].completed).toBe(true);
      expect(current.stories[id].answers).toEqual(completed.stories[id].answers);
      expect(current.stories[id].opened).toEqual(completed.stories[id].opened);
    }
    await button(page).click();await expect(page).toHaveURL(/\/statistics\/1$/);
    await page.reload();await expect(page.locator('.story-shell')).toHaveCount(0);
    await page.getByRole('button',{name:'Далее',exact:true}).click();
    await page.getByRole('button',{name:'Далее',exact:true}).click();
    await page.getByRole('button',{name:'Завершить просмотр',exact:true}).click();
    await expect(page).toHaveURL(/\/complete$/);
    await expect(page.locator('main')).toContainText('Итоговый тест и эпилог пока не подключены.');
    await expect(page.locator('main')).not.toContainText('История Ильи');
    if(round===0) {
      await page.getByRole('button',{name:'Начать заново',exact:true}).click();
      await page.getByRole('button',{name:'Удалить прогресс и начать'}).click();
      await expect(page).toHaveURL('http://pilot.test/');
      await expect(page.getByRole('button',{name:'Начать выставку →'})).toBeVisible();
      const reset=await saved(page);expect(reset.stats.completed).toBe(false);
      for(const id of ['liza','nikita','ilya']) expect(reset.stories[id].completed).toBe(false);
    }
  }
  expect(errors).toEqual([]);
});
test('old pilot statistics access survives as data, never as permission; partial Ilya resumes',async({page})=>{
  const pilot=createExhibitionModel(storyRegistry,{...exhibitionConfig,mode:'pilot',availableStoryIds:['liza','nikita']});
  let old=finishStory(finishStory(pilot.initialState(),'liza',pilot,storyRegistry),'nikita',pilot,storyRegistry);
  for(let i=0;i<3;i++) old=pilot.reducer(old,{type:'STATS_ADVANCE',index:i});
  old=pilot.reducer(old,{type:'STATS_COMPLETE'});
  old.stats={...old.stats,filter:'Только нефизические',expanded:['global'],answer:1,revealed:true};
  old.legacyStatsAccess=true;old.legacyStoryAccess=['nikita'];old.cursor='/complete';
  await page.goto('http://pilot.test/');
  for(const version of [4,5,6]) {
    const input=structuredClone(old);input.version=version;
    await page.evaluate(s=>sessionStorage.setItem('invisible-stories:pilot:v1',JSON.stringify(s)),input);
    await page.goto('http://pilot.test/complete');await expect(page).toHaveURL(/\/stories$/);
    await expect(button(page)).toBeDisabled();await expect(status(page,'ilya')).toHaveText('Доступна');
    for(const route of ['/statistics/1','/statistics/4','/complete']) {
      await page.goto(`http://pilot.test${route}`);await expect(page).toHaveURL(/\/stories$/);
    }
    expect((await saved(page)).stats).toEqual(old.stats);
  }
  await page.locator('[aria-labelledby="card-ilya"] button').click();
  await goNext(page);await goNext(page);await page.reload();
  await expect(page.getByRole('status')).toHaveText('Фрагмент 3 из 9');
  const partial=await saved(page);expect(partial.stats).toEqual(old.stats);
  await page.goto('http://pilot.test/stories');
  await expect(status(page,'ilya')).toHaveText('В процессе');
  await page.locator('[aria-labelledby="card-ilya"] button').click();
  await expect(page.getByRole('status')).toHaveText('Фрагмент 3 из 9');
  // Preserve the exact partial state through migration; complete via the real model to verify the old stats return.
  let completed=model.restore(JSON.stringify(await saved(page)));
  completed=finishStory(completed,'ilya',model,storyRegistry);
  await page.evaluate(s=>sessionStorage.setItem('invisible-stories:pilot:v1',JSON.stringify(s)),completed);
  await page.goto('http://pilot.test/stories');await expect(button(page)).toBeEnabled();
  await button(page).click();await expect(page).toHaveURL(/\/statistics\/1$/);
  expect((await saved(page)).stats).toEqual({...old.stats,currentPage:1});
});
