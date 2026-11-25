import { expect } from "@playwright/test";
import path from "node:path";
import { test, goNext, noOverflow, assertText } from "./support.js";
import { storyRegistry, sceneFragments } from "../../src/content/storyRegistry.js";
import { createExhibitionModel } from "../../src/state/model.js";
import { exhibitionConfig } from "../../src/content/exhibitionConfig.js";
import { finishStory } from "../story-helpers.js";
const ilya=storyRegistry.ilya;
const model=createExhibitionModel(storyRegistry,{...exhibitionConfig,availableStoryIds:['liza','nikita','ilya']});
const artifacts=process.env.ARTIFACT_DIR || path.resolve('../../work');
const readState=page=>page.evaluate(()=>JSON.parse(localStorage.getItem('invisible-stories:pilot:v1')));
async function prepare(page,finishNikita=true) {
  await page.goto('http://pilot.test/stories');
  let s=model.initialState();
  s=finishStory(s,'liza',model,storyRegistry);
  if(finishNikita) s=finishStory(s,'nikita',model,storyRegistry);
  await page.evaluate(s=>localStorage.setItem('invisible-stories:pilot:v1',JSON.stringify(s)),s);
  await page.reload();
  return s;
}
async function checkArtwork(page, images=page.locator('.scene-artwork img')) {
  await expect(images).toHaveCount(1);
  const image=images.first();
  await expect(image).toHaveJSProperty('complete',true);
  const m=await image.evaluate(el=>({nw:el.naturalWidth,nh:el.naturalHeight,w:el.getBoundingClientRect().width,h:el.getBoundingClientRect().height,
    attrw:Number(el.getAttribute('width')),attrh:Number(el.getAttribute('height'))}));
  expect(m.nw).toBeGreaterThan(0);expect(m.nh).toBeGreaterThan(0);
  expect(m.nw).toBe(m.attrw);expect(m.nh).toBe(m.attrh);
  expect(Math.abs(m.w/m.h-m.nw/m.nh)).toBeLessThan(.02);
  expect(m.w).toBeGreaterThan(0);expect(m.h).toBeGreaterThan(0);
}
async function assertPart(page,part,scope=page.locator('main')) {
  if(part.kind==='chat') {
    await expect(scope.locator('.message-row')).toHaveCount(part.messages.length);
    for(const m of part.messages) await expect(scope).toContainText(m.text);
  } else if(part.kind==='message') {
    await expect(scope.locator('.live-dialogue')).toHaveCount(1);
    await expect(scope.locator('.live-dialogue')).toContainText(part.message.sender);
    await expect(scope.locator('.live-dialogue')).toContainText(part.message.text);
  } else {
    await expect(scope.locator('.live-dialogue')).toHaveCount(0);
    for(const paragraph of part.text.split('\n\n')) await expect(scope).toContainText(paragraph);
  }
}
async function readScene(page,scene) {
  for(const [i,part] of sceneFragments(scene).entries()) {
    await expect(page.getByRole('status')).toHaveText(`Фрагмент ${i+1} из ${scene.fragments.length}`);
    await assertPart(page,part);await noOverflow(page);
    if(i<scene.fragments.length-1) await goNext(page);
  }
}
async function reachMaterials(page) {
  await page.goto('http://pilot.test/stories/ilya/introduction');
  for(const scene of ilya.scenes) {await readScene(page,scene);await goNext(page);}
}
test('Ilya full exact route, free material order, saved dialogue positions, B/C/A, closing and full statistics',async({page},info)=>{
  const errors=[],requests=[];
  page.on('pageerror',e=>errors.push(e.message));
  page.on('request',r=>requests.push({url:r.url(),method:r.method(),body:r.postData()}));
  const before=await prepare(page);
  await expect(page.locator('[aria-labelledby="card-ilya"] .archive-card-status')).toHaveText('Доступна');
  await expect(page.getByRole('button',{name:'Перейти к „Невидимой статистике“'})).toBeDisabled();
  await page.locator('[aria-labelledby="card-ilya"] button').click();
  await expect(page.locator('.story-shell')).toHaveCSS('background-color','rgb(231, 229, 217)');
  await expect(page.locator('.artwork-placeholder')).toHaveCount(0);
  await checkArtwork(page);
  await reachMaterials(page);
  await expect(page.getByRole('heading',{level:2})).toHaveText(['01 — Семейное застолье','02 — Переписка с мамой','03 — «А у вас не так?»']);
  const next=page.getByRole('button',{name:'К карте невидимого →'});
  await expect(next).toBeDisabled();
  await page.goto('http://pilot.test/stories/ilya/conclusion');await expect(page).toHaveURL(/\/materials$/);
  // Opening the culmination first is allowed; reading it does not open the map yet.
  for(const index of [2,1,0]) {
    const m=ilya.materials[index];const section=page.locator('.material').nth(index);
    await section.getByRole('button',{name:'Открыть материал ↓'}).click();
    await expect(section.locator('.artwork-placeholder')).toHaveCount(0);
    await checkArtwork(page,section.locator('.scene-artwork img'));
    if(m.type==='chat') {
      await expect(section.locator('.message-row')).toHaveCount(7);
      for(const message of m.messages) await expect(section).toContainText(message.text);
      for(const paragraph of m.monologue.split('\n\n')) await expect(section.locator('.monologue')).toContainText(paragraph);
    } else {
      const total=m.fragments.length;
      for(const [i,part] of m.fragments.entries()) {
        await expect(page.getByRole('status')).toHaveText(`Фрагмент ${i+1} из ${total}`);
        await assertPart(page,part,section);
        if(index===2 && i===2) {
          await section.getByRole('button',{name:'← Назад',exact:true}).click();
          await page.reload();
          await expect(page.getByRole('status')).toHaveText(`Фрагмент 2 из ${total}`);
          expect((await readState(page)).stories.ilya.reachedMaterialPositions[m.id]).toBe(3);
          await section.getByRole('button',{name:'Закрыть материал ↑'}).click();
          await section.getByRole('button',{name:'Открыть материал ↓'}).click();
          await expect(page.getByRole('status')).toHaveText(`Фрагмент 2 из ${total}`);
          await section.getByRole('button',{name:'Далее →',exact:true}).click();
        }
        await noOverflow(page);
        if(i<total-1) await section.getByRole('button',{name:'Далее →',exact:true}).click();
      }
      await expect(section.locator('.studied')).toHaveCount(1);
      if(index===2) await page.screenshot({path:`${artifacts}/ilya-kirill-${info.project.name}.png`,fullPage:true});
    }
    if(index!==0) await expect(next).toBeDisabled();
  }
  await page.reload();await expect(next).toBeEnabled();
  await next.click();
  await expect(page.getByRole('heading',{level:1})).toHaveText('Что осталось невидимым?');
  const reveal=page.getByRole('button',{name:'Раскрыть связи'});
  await expect(reveal).toBeDisabled();
  for(const [i,q] of ilya.questions.entries()) {
    const section=page.locator('.map-question').nth(i);
    await expect(section).toContainText(q.question);await expect(section).toContainText(q.fragment);
    await section.getByRole('radio').nth(Object.keys(q.options).indexOf(q.correct)).check();
    if(i<2) await expect(reveal).toBeDisabled();
  }
  await reveal.click();
  for(const q of ilya.questions) await assertText(page,q.explanation);
  await page.reload();await expect(page.getByRole('radio')).toHaveCount(0);
  await page.getByRole('button',{name:'К заключению →'}).click();
  for(const factor of ilya.conclusion.factors) {await assertText(page,factor.title);await assertText(page,factor.text);}
  await assertText(page,ilya.conclusion.final_text);await goNext(page);
  await expect(page).toHaveURL(/\/final-text$/);
  await assertText(page,ilya.steps.at(-1).content.text);
  await expect(page.locator('.closing-lead')).toHaveText('Привычное — не всегда нормальное.');
  await expect(page.locator('.closing-body p')).toHaveCount(2);
  await noOverflow(page);
  await page.screenshot({path:`${artifacts}/ilya-closing-${info.project.name}.png`,fullPage:true});
  await page.getByRole('button',{name:'К выбору историй →'}).click();
  await expect(page).toHaveURL(/\/stories$/);
  await expect(page.getByRole('status')).toHaveText('Все три истории завершены. Теперь доступна „Невидимая статистика“');
  await expect(page.locator('[aria-labelledby="card-ilya"] .archive-card-status')).toHaveText('Пройдена');
  const saved=await readState(page);
  expect(saved.stories.ilya.completed).toBe(true);
  expect(saved.stories.liza).toEqual(before.stories.liza);expect(saved.stories.nikita).toEqual(before.stories.nikita);
  expect(saved.quiz).toEqual(before.quiz);expect(saved.stats).toEqual(before.stats);
  await page.locator('[aria-labelledby="card-ilya"] button').click();await expect(page).toHaveURL(/\/final-text$/);
  await page.goto('http://pilot.test/stories');
  await page.getByRole('button',{name:'Перейти к „Невидимой статистике“'}).click();
  await expect(page).toHaveURL(/\/statistics\/1$/);await expect(page.locator('.story-shell')).toHaveCount(0);
  expect(errors).toEqual([]);
  expect(requests.filter(r=>new URL(r.url).origin!=='http://pilot.test'||r.method!=='GET'||r.body)).toEqual([]);
});
test('Ilya prerequisite guard, mixed scene back/reload and mobile artwork',async({page},info)=>{
  await prepare(page,false);
  await page.goto('http://pilot.test/stories/ilya/introduction');await expect(page).toHaveURL(/\/stories$/);
  await prepare(page,true);
  await page.goto('http://pilot.test/stories/ilya/introduction');
  await readScene(page,ilya.scenes[0]);await goNext(page);
  await goNext(page);await goNext(page);
  await page.reload();await expect(page.getByRole('status')).toHaveText('Фрагмент 3 из 8');
  await page.getByRole('button',{name:'← Назад',exact:true}).click();
  for(const width of [320,390,430,768,1440,1920]) {
    await page.setViewportSize({width,height:900});await noOverflow(page);
    await expect(page.locator('.artwork-placeholder')).toHaveCount(0);
    await checkArtwork(page);
    await expect(page.locator('.live-dialogue')).toHaveCount(1);
  }
  await page.setViewportSize(info.project.use.viewport);
  await page.screenshot({path:`${artifacts}/ilya-dialogue-${info.project.name}.png`,fullPage:true});
});

test('all seven approved images keep full proportions at desktop and mobile widths',async({page},info)=>{
  let state=await prepare(page);
  state=finishStory(state,'ilya',model,storyRegistry);
  await page.evaluate(s=>localStorage.setItem('invisible-stories:pilot:v1',JSON.stringify(s)),state);
  for(const width of [320,390,430,1440,1920]) {
    await page.setViewportSize({width,height:900});
    for(const scene of ilya.scenes) {
      await page.goto(`http://pilot.test/stories/ilya/${scene.id}`);
      await expect(page.locator('.artwork-placeholder')).toHaveCount(0);
      await checkArtwork(page);await noOverflow(page);
    }
    await page.goto('http://pilot.test/stories/ilya/materials');
    for(const [index,material] of ilya.materials.entries()) {
      const section=page.locator('.material').nth(index);
      await section.getByRole('button',{name:'Открыть материал ↓'}).click();
      await checkArtwork(page,section.locator('.scene-artwork img'));await noOverflow(page);
      if(material.type==='chat') {
        await expect(section.locator('.message-row')).toHaveCount(7);
        const image=await section.locator('.scene-artwork img').boundingBox();
        const chat=await section.locator('.chat').boundingBox();
        expect(image.y+image.height).toBeLessThanOrEqual(chat.y);
        expect(image.width/image.height).toBeGreaterThan(1.7);
      } else await expect(section.locator('.scene-navigation')).toHaveCount(1);
      await section.getByRole('button',{name:'Закрыть материал ↑'}).click();
    }
  }
  await page.setViewportSize(info.project.use.viewport);
  await page.goto('http://pilot.test/stories/ilya/materials');
  for(const [index,label] of [[0,'feast'],[1,'mother-chat'],[2,'kirill']]) {
    await page.locator('.material').nth(index).getByRole('button',{name:'Открыть материал ↓'}).click();
    await checkArtwork(page);
    await page.screenshot({path:`${artifacts}/ilya-approved-${label}-${info.project.name}.png`,fullPage:true});
  }
  await page.goto('http://pilot.test/stories/ilya/introduction');
  await checkArtwork(page);
  await page.screenshot({path:`${artifacts}/ilya-approved-introduction-${info.project.name}.png`,fullPage:true});
});
