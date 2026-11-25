import {completeFinalTestInBrowser} from "./support.js";
import { expect } from "@playwright/test";
import { test, openSelection, goNext, assertText, noOverflow, revealAll, completeStoryInBrowser } from "./support.js";
import { storyRegistry, sceneFragments } from "../../src/content/storyRegistry.js";
import path from "node:path";
import { reducer } from "../../src/state/model.js";
const liza=storyRegistry.liza;
const artifacts=process.env.ARTIFACT_DIR || path.resolve("../../work");
const saved = page => page.evaluate(()=>JSON.parse(sessionStorage.getItem("invisible-stories:pilot:v1")));
async function checkArtwork(page, selector = ".scene-artwork img") {
  const images=page.locator(selector);
  for(const image of await images.all()) {
    await expect(image).toHaveJSProperty("complete",true);
    const metrics=await image.evaluate(el=>({naturalWidth:el.naturalWidth,naturalHeight:el.naturalHeight,
      width:el.getBoundingClientRect().width,height:el.getBoundingClientRect().height,
      border:getComputedStyle(el).borderTopWidth,padding:getComputedStyle(el).paddingTop}));
    expect(metrics.naturalWidth).toBeGreaterThan(0);
    expect(Math.abs(metrics.width/metrics.height-metrics.naturalWidth/metrics.naturalHeight)).toBeLessThan(.02);
    expect(metrics.border).toBe("0px");expect(metrics.padding).toBe("0px");
  }
}
async function readScene(page, scene) {
  await expect(page.locator(".artwork-placeholder")).toHaveCount(0);
  await expect(page.locator(".scene-artwork img")).toHaveCount(1);
  await checkArtwork(page);
  for(const [i,part] of sceneFragments(scene).entries()) {
    await expect(page.getByRole("status")).toHaveText(`Фрагмент ${i+1} из ${sceneFragments(scene).length}`);
    if(part.kind==="chat") {
      await expect(page.locator(".scene-reading .message-row")).toHaveCount(part.messages.length);
      for(const m of part.messages) await assertText(page,m.text);
    } else if(part.kind==="message") {
      await expect(page.locator(".live-dialogue")).toHaveCount(1);
      await expect(page.locator(".live-dialogue")).toContainText(part.message.sender);
      await assertText(page,part.message.text);
    } else {
      await assertText(page,part.text);
      await expect(page.locator(".live-dialogue")).toHaveCount(0);
    }
    await noOverflow(page);
    if(i<sceneFragments(scene).length-1) await goNext(page);
  }
}

test("Liza full approved scenario, independent progress, album, gates and exact ending order",async({page},info)=>{
  const errors=[],requests=[];
  page.on("pageerror",e=>errors.push(e.message));
  page.on("request",r=>requests.push({url:r.url(),method:r.method(),body:r.postData()}));
  await openSelection(page);
  const quizBefore=(await saved(page)).quiz;
  const nikitaBefore=(await saved(page)).stories.nikita;
  await page.locator('[aria-labelledby="card-liza"] button').click();
  await expect(page.locator(".story-shell")).toHaveCSS("background-color","rgb(238, 230, 232)");
  await goNext(page);
  const intro=liza.scenes[0];
  for(const m of intro.fragments[1].messages) await assertText(page,m.text);
  await expect(page.getByText(intro.fragments[2].text.split("\n\n")[0],{exact:true})).toHaveCount(0);
  await page.getByRole("button",{name:"← Назад",exact:true}).click();
  await page.reload();
  expect((await saved(page)).stories.liza.currentFragments.introduction).toBe(1);
  expect((await saved(page)).stories.liza.revealedFragments.introduction).toBe(2);
  for(const scene of liza.scenes.slice(0,4)) {
    await expect(page.getByRole("heading",{level:1})).toHaveText(scene.title);
    await readScene(page,scene);
    if(scene.id==="other-plans") await page.screenshot({path:`${artifacts}/liza-dialogue-${info.project.name}.png`,fullPage:true});
    await goNext(page);
  }
  await expect(page).toHaveURL(/\/materials$/);
  await expect(page.getByRole("button",{name:"К карте невидимого →"})).toBeDisabled();
  await page.goto("http://pilot.test/stories/liza/last-scene");
  await expect(page).toHaveURL(/\/materials$/);
  for(const i of [1,2,0]) {
    const material=liza.materials[i];
    await page.locator(".material").nth(i).getByRole("button",{name:"Открыть материал ↓"}).click();
    if(material.type==="chat") for(const m of material.messages) await assertText(page,m.text);
    if(material.type==="album") {
      await expect(page.locator(".photo-album figure")).toHaveCount(2);
      await expect(page.locator(".photo-album img")).toHaveCount(2);
      await checkArtwork(page, ".photo-album img");
      for(const photo of material.photos) { await assertText(page,photo.description);await assertText(page,photo.caption); }
      await assertText(page,material.publication);
      await page.screenshot({path:`${artifacts}/liza-album-${info.project.name}.png`,fullPage:true});
    }
    await assertText(page,material.monologue);await noOverflow(page);
  }
  await page.reload();expect((await saved(page)).stories.liza.opened).toHaveLength(3);
  await page.getByRole("button",{name:"К карте невидимого →"}).click();
  await expect(page.getByRole("heading",{level:1})).toHaveText("Что осталось невидимым?");
  await expect(page.getByRole("button",{name:"Раскрыть связи"})).toBeDisabled();
  for(const [i,q] of liza.questions.entries()) {
    await assertText(page,q.fragment);
    for(const option of Object.values(q.options)) await assertText(page,option);
    await page.locator(".map-question").nth(i).getByRole("radio").first().check();
  }
  await page.getByRole("button",{name:"Раскрыть связи"}).click();
  for(const q of liza.questions) await assertText(page,q.explanation);
  await page.reload();await expect(page.getByRole("radio")).toHaveCount(0);
  await page.getByRole("button",{name:"К заключению →"}).click();
  await assertText(page,liza.conclusion.introduction);
  for(const factor of liza.conclusion.factors) { await assertText(page,factor.title);await assertText(page,factor.text); }
  await expect(page.getByText(liza.steps.at(-1).content.text.split("\n\n")[0],{exact:true})).toHaveCount(0);
  await goNext(page);
  await expect(page).toHaveURL(/\/last-scene$/);
  await readScene(page,liza.scenes.at(-1));
  await page.screenshot({path:`${artifacts}/liza-last-scene-${info.project.name}.png`,fullPage:true});
  await goNext(page);
  await expect(page).toHaveURL(/\/final-text$/);
  await assertText(page,liza.steps.at(-1).content.text);
  await expect(page.getByRole("heading", {name:"Финальный текст", exact:true})).toHaveCount(0);
  await expect(page.getByRole("heading", {name:"Послесловие", exact:true})).toBeVisible();
  await expect(page.locator(".closing-lead")).toHaveText(liza.steps.at(-1).content.text.split("\n\n")[0]);
  await expect(page.getByText("Конец истории Лизы",{exact:true})).toBeVisible();
  for(const width of [360,390,430,1280,1920]) {
    await page.setViewportSize({width,height:900});await noOverflow(page);
    await expect(page.locator(".closing-card")).toBeVisible();
    const sizes=await page.locator(".closing-card").evaluate(el=>({width:el.clientWidth,height:el.clientHeight}));
    expect(sizes.width).toBeLessThanOrEqual(860);expect(sizes.height).toBeLessThan(850);
  }
  await page.setViewportSize(info.project.use.viewport);
  await page.screenshot({path:`${artifacts}/liza-postscript-${info.project.name}.png`,fullPage:true});
  await page.getByRole("button",{name:"← Назад",exact:true}).click();
  await expect(page).toHaveURL(/\/last-scene$/);
  await expect(page.getByRole("status")).toHaveText("Фрагмент 4 из 4");
  await goNext(page);
  await page.getByRole("button",{name:"К выбору историй →"}).click();
  const end=await saved(page);
  expect(end.stories.liza.completed).toBe(true);
  expect(end.stories.nikita).toEqual(nikitaBefore);
  expect(end.quiz).toEqual(quizBefore);
  await expect(page).toHaveURL(/\/stories$/);
  await expect(page.getByRole("status")).toHaveText("История Лизы завершена. Теперь доступна история Никиты");
  await expect(page.locator('[aria-labelledby="card-liza"] .archive-card-status')).toHaveText("Пройдена");
  await expect(page.locator('[aria-labelledby="card-nikita"] .archive-card-status')).toHaveText("Доступна");
  await page.getByRole("button",{name:"Скрыть уведомление"}).click();
  await expect(page.locator(".selection-notice")).toHaveCount(0);
  await page.goto("http://pilot.test/statistics/1");
  await expect(page).toHaveURL(/\/stories$/);
  // Continue the same browser session through Nikita and statistics: no seeded completion.
  await page.locator('[aria-labelledby="card-nikita"]').getByRole("button",{name:"Начать историю",exact:true}).click();
  for(const scene of storyRegistry.nikita.scenes) { await revealAll(page);await goNext(page); }
  await expect(page.locator(".material")).toHaveCount(3);
  for(const material of await page.locator(".material").all())
    await material.getByRole("button",{name:"Открыть материал ↓"}).click();
  await page.getByRole("button",{name:"К карте невидимого →"}).click();
  await expect(page.locator(".map-question")).toHaveCount(3);
  for(const question of await page.locator(".map-question").all()) await question.getByRole("radio").first().check();
  await page.getByRole("button",{name:"Раскрыть связи"}).click();
  await page.getByRole("button",{name:"К заключению →"}).click();
  await page.getByRole("button",{name:"К выбору историй →"}).click();
  await expect(page).toHaveURL(/\/stories$/);
  await expect(page.getByRole("status")).toContainText("Теперь доступна история Ильи");
  await expect(page.getByRole("button",{name:"Перейти к „Невидимой статистике“"})).toBeDisabled();
  await completeStoryInBrowser(page,storyRegistry.ilya);
  await expect(page.getByRole("status")).toHaveText("Все три истории завершены. Теперь доступна „Невидимая статистика“");
  for(const id of ['liza','nikita','ilya']) await expect(page.locator(`[aria-labelledby="card-${id}"] .archive-card-status`)).toHaveText("Пройдена");
  await page.getByRole("button",{name:"Перейти к „Невидимой статистике“"}).click();
  await expect(page).toHaveURL(/\/statistics\/1$/);
  await page.getByRole("button",{name:"Далее",exact:true}).click();
  await page.getByRole("button",{name:"Далее",exact:true}).click();
  await page.getByRole("button",{name:"Завершить просмотр"}).click();
  await completeFinalTestInBrowser(page);
  await expect(page).toHaveURL(/\/epilogue$/);
  expect(errors).toEqual([]);
  expect(requests.filter(r=>new URL(r.url).origin!=="http://pilot.test"||r.method!=="GET"||r.body)).toEqual([]);
});

test("Liza responsive content and independent story resume",async({page},info)=>{
  await openSelection(page);
  await page.goto("http://pilot.test/stories/liza/introduction");
  await goNext(page);
  for(const width of [360,390,430,1280,1920]) {
    await page.setViewportSize({width,height:900});await noOverflow(page);await checkArtwork(page);
    await expect(page.locator(".scene-reading .message-row")).toHaveCount(4);
    await expect(page.getByRole("button",{name:"Далее →",exact:true})).toBeVisible();
  }
  await page.setViewportSize(info.project.use.viewport);
  const before=(await saved(page)).stories.liza;
  await page.goto("http://pilot.test/stories/nikita/sunday");
  await expect(page).toHaveURL(/\/stories$/);
  await page.reload();
  expect((await saved(page)).stories.liza).toEqual(before);
  await page.goto("http://pilot.test/stories/liza/introduction");
  await expect(page.getByRole("status")).toHaveText("Фрагмент 2 из 3");
  await page.screenshot({path:`${artifacts}/liza-chat-${info.project.name}.png`,fullPage:true});
});


test("completed v3 pilot keeps data and replay while statistics waits for Liza",async({page})=>{
  await page.goto("http://pilot.test/");
  await page.evaluate(()=>sessionStorage.setItem("invisible-stories:pilot:v1",JSON.stringify({
    version:3,contentVersion:"pilot-1",cursor:"/complete",
    quiz:{answers:{0:"B",1:"C",2:"C",3:"A",4:"C"},completed:true},
    stories:{nikita:{unlocked:6,currentStepId:"conclusion",opened:["dima_chat","phone_note","voice_message"],active:"phone_note",
      answers:{kitchen:"B",football:"C",unsent_message:"A"},revealed:true,completed:true,
      revealedFragments:{sunday:1,messages_dima:4,keys:10,football:7},
      currentFragments:{sunday:1,messages_dima:1,keys:3,football:7}}},
    stats:{unlocked:3,completed:true,filter:"Только нефизические",expanded:["global"],answer:1,revealed:true}
  })));
  await page.goto("http://pilot.test/complete");
  await expect(page).toHaveURL(/\/stories$/);
  const old=await saved(page);expect(old.legacyStatsAccess).toBe(true);
  await page.goto("http://pilot.test/statistics/4");
  await expect(page).toHaveURL(/\/stories$/);
  await page.goto("http://pilot.test/stories/liza/introduction");
  await goNext(page);await page.reload();
  const current=await saved(page);
  expect(current.stories.nikita).toEqual(old.stories.nikita);
  expect(current.stats).toEqual(old.stats);
  expect(current.stories.liza.currentFragments.introduction).toBe(2);
  await page.goto("http://pilot.test/stories/nikita/keys");
  await expect(page.getByRole("status")).toHaveText("Фрагмент 3 из 10");
});


test("all seven approved images keep full composition on desktop and mobile", async({page},info)=>{
  // Real reducer actions prepare reached steps; the full-route test above covers the gates.
  await openSelection(page);
  let state=await saved(page);
  for(let i=0;i<liza.steps.length;i++) {
    const step=liza.steps[i];
    if(step.kind==="scene") while(state.stories.liza.revealedFragments[step.id]<sceneFragments(step.scene).length)
      state=reducer(state,{type:"REVEAL_FRAGMENT",storyId:"liza",sceneId:step.id});
    if(step.kind==="materials") for(const m of liza.materials) state=reducer(state,{type:"MATERIAL",storyId:"liza",id:m.id});
    if(step.kind==="map") {
      for(const q of liza.questions) state=reducer(state,{type:"MAP_ANSWER",storyId:"liza",id:q.id,value:q.correct});
      state=reducer(state,{type:"MAP_REVEAL",storyId:"liza"});
    }
    if(i<liza.steps.length-1) state=reducer(state,{type:"STORY_ADVANCE",storyId:"liza",index:i});
  }
  state.stories.liza.active="family-album";
  await page.evaluate(s=>sessionStorage.setItem("invisible-stories:pilot:v1",JSON.stringify(s)),state);
  for(const width of [360,390,430,1280,1920]) {
    await page.setViewportSize({width,height:900});
    for(const scene of liza.scenes) {
      await page.goto(`http://pilot.test/stories/liza/${scene.id}`);
      await checkArtwork(page);await noOverflow(page);
    }
    await page.goto("http://pilot.test/stories/liza/materials");
    await expect(page.locator(".album-placeholder")).toHaveCount(0);
    await checkArtwork(page,".photo-album img");await noOverflow(page);
    for(const figure of await page.locator(".photo-album figure").all()) {
      await expect(figure).toHaveCSS("border-top-width","0px");
      await expect(figure).toHaveCSS("box-shadow","none");
    }
  }
  await page.setViewportSize(info.project.use.viewport);
  await page.screenshot({path:`${artifacts}/liza-approved-album-${info.project.name}.png`,fullPage:true});
  await page.goto("http://pilot.test/stories/liza/other-plans");
  await page.screenshot({path:`${artifacts}/liza-approved-kitchen-${info.project.name}.png`,fullPage:true});
});
