import { expect } from "@playwright/test";
import { test, finishQuiz, goNext, assertText, noOverflow } from "./support.js";
import { storyRegistry, sceneFragments } from "../../src/content/storyRegistry.js";
import path from "node:path";
const liza=storyRegistry.liza;
const artifacts=process.env.ARTIFACT_DIR || path.resolve("../../work");
const saved = page => page.evaluate(()=>JSON.parse(sessionStorage.getItem("invisible-stories:pilot:v1")));
async function readScene(page, scene) {
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
  await finishQuiz(page);
  const quizBefore=(await saved(page)).quiz;
  const nikitaBefore=(await saved(page)).stories.nikita;
  await page.getByRole("button",{name:"Перейти к истории →"}).click();
  await page.getByRole("button",{name:"Начать историю Лизы →"}).click();
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
      await expect(page.locator(".photo-album img")).toHaveCount(0);
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
  await page.getByRole("button",{name:"← Назад",exact:true}).click();
  await expect(page).toHaveURL(/\/last-scene$/);
  await expect(page.getByRole("status")).toHaveText("Фрагмент 4 из 4");
  await goNext(page);
  await page.getByRole("button",{name:"К истории Никиты →"}).click();
  const end=await saved(page);
  expect(end.stories.liza.completed).toBe(true);
  expect(end.stories.nikita).toEqual(nikitaBefore);
  expect(end.quiz).toEqual(quizBefore);
  await expect(page).toHaveURL(/\/nikita\/sunday$/);
  await page.goto("http://pilot.test/statistics/1");
  await expect(page).toHaveURL(/\/nikita\/sunday$/);
  expect(errors).toEqual([]);
  expect(requests.filter(r=>new URL(r.url).origin!=="http://pilot.test"||r.method!=="GET"||r.body)).toEqual([]);
});

test("Liza responsive content and independent story resume",async({page},info)=>{
  await finishQuiz(page);
  await page.goto("http://pilot.test/stories/liza/introduction");
  await goNext(page);
  for(const width of [360,390,430,1280,1920]) {
    await page.setViewportSize({width,height:900});await noOverflow(page);
    await expect(page.locator(".scene-reading .message-row")).toHaveCount(4);
    await expect(page.getByRole("button",{name:"Далее →",exact:true})).toBeVisible();
  }
  await page.setViewportSize(info.project.use.viewport);
  const before=(await saved(page)).stories.liza;
  await page.goto("http://pilot.test/stories/nikita/sunday");
  await goNext(page);await goNext(page);await goNext(page);
  await page.reload();
  expect((await saved(page)).stories.liza).toEqual(before);
  await page.goto("http://pilot.test/stories/liza/introduction");
  await expect(page.getByRole("status")).toHaveText("Фрагмент 2 из 3");
  await page.screenshot({path:`${artifacts}/liza-chat-${info.project.name}.png`,fullPage:true});
});


test("completed v3 pilot keeps statistics and completion while Liza starts independently",async({page})=>{
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
  await expect(page.getByRole("heading",{level:1})).toHaveText("Спасибо за участие");
  const old=await saved(page);expect(old.legacyStatsAccess).toBe(true);
  await page.goto("http://pilot.test/statistics/4");
  await expect(page).toHaveURL(/statistics\/4$/);
  await page.goto("http://pilot.test/stories/liza/introduction");
  await goNext(page);await page.reload();
  const current=await saved(page);
  expect(current.stories.nikita).toEqual(old.stories.nikita);
  expect(current.stats).toEqual(old.stats);
  expect(current.stories.liza.currentFragments.introduction).toBe(2);
  await page.goto("http://pilot.test/stories/nikita/keys");
  await expect(page.getByRole("status")).toHaveText("Фрагмент 3 из 10");
});
