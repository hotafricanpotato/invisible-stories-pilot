import { expect } from "@playwright/test";
import path from "node:path";
import { test, openSelection, noOverflow, goNext } from "./support.js";
import * as model from "../../src/state/model.js";
import { storyRegistry } from "../../src/content/storyRegistry.js";
import { finishStory } from "../story-helpers.js";
const artifacts=process.env.ARTIFACT_DIR || path.resolve("../../work");
const card=(page,id)=>page.locator(`[aria-labelledby="card-${id}"]`);
const statsButton=page=>page.getByRole("button",{name:"Перейти к „Невидимой статистике“"});
test("selection palettes, breakpoints, resume and reset never return to the entry quiz",async({page},info)=>{
  await page.goto("http://pilot.test/");
  await page.getByRole("button",{name:"Начать выставку →"}).click();
  await expect(page).toHaveURL(/\/stories$/);
  await expect(page.locator(".archive-story-card")).toHaveCount(3);
  for(const [id,color] of [["liza","rgb(238, 230, 232)"],["nikita","rgb(233, 217, 199)"],["ilya","rgb(231, 229, 217)"]])
    await expect(card(page,id)).toHaveCSS("background-color",color);
  await expect(card(page,"ilya")).not.toContainText("История в разработке");
  await expect(card(page,"ilya").locator("img")).toHaveJSProperty("naturalWidth",1672);
  await expect(card(page,"nikita").getByRole("button")).toBeDisabled();
  await expect(statsButton(page)).toBeVisible();await expect(statsButton(page)).toBeDisabled();
  await expect(page.locator("#statistics-condition")).toHaveText("„Невидимая статистика“ откроется после прохождения всех трёх историй");
  for(const width of [320,375,760,768,1200,1920]) {
    await page.setViewportSize({width,height:900});await noOverflow(page);
    const boxes=await Promise.all(["liza","nikita","ilya"].map(id=>card(page,id).boundingBox()));
    if(width<=760) expect(boxes[1].y).toBeGreaterThan(boxes[0].y+boxes[0].height);
    else expect(boxes[1].y).toBe(boxes[0].y);
  }
  await page.setViewportSize(info.project.use.viewport);
  await page.screenshot({path:`${artifacts}/story-selection-${info.project.name}.png`,fullPage:true});
  await card(page,"liza").getByRole("button",{name:"Начать историю"}).click();
  await goNext(page);await page.reload();
  await page.goto("http://pilot.test/stories");
  await expect(card(page,"liza").locator(".archive-card-status")).toHaveText("В процессе");
  await card(page,"liza").getByRole("button",{name:"Продолжить",exact:true}).click();
  await expect(page.getByRole("status")).toHaveText("Фрагмент 2 из 3");
  await page.getByRole("button",{name:"Начать заново",exact:true}).click();
  await page.getByRole("button",{name:"Удалить прогресс и начать"}).click();
  await expect(page).toHaveURL("http://pilot.test/");
  await page.reload();
  await page.getByRole("button",{name:"Начать выставку →"}).click();
  await expect(page).toHaveURL(/\/stories$/);
  await expect(card(page,"liza").locator(".archive-card-status")).toHaveText("Доступна");
  await expect(card(page,"nikita").getByRole("button")).toBeDisabled();
  await expect(statsButton(page)).toBeDisabled();
  await card(page,"liza").getByRole("button",{name:"Начать историю"}).click();
  await expect(page.getByRole("status")).toHaveText("Фрагмент 1 из 3");
  const state=await page.evaluate(()=>JSON.parse(sessionStorage.getItem("invisible-stories:pilot:v1")));
  expect(state.quiz).toEqual({answers:{},completed:false});
  expect(state.stories.nikita.completed).toBe(false);
  expect(state.stats.unlocked).toBe(0);
});
test("v4 partial progress and current reply survive new locks, then resume after Liza",async({page})=>{
  let saved=model.initialState();
  saved=finishStory(saved,"liza",model,storyRegistry);
  for(const a of [{type:"STORY_ADVANCE",index:0},{type:"READ_POSITION",sceneId:"messages_dima",position:1},{type:"STORY_ADVANCE",index:1},
    {type:"READ_POSITION",sceneId:"keys",position:2},{type:"READ_POSITION",sceneId:"keys",position:3},{type:"READ_POSITION",sceneId:"keys",position:2}])
    saved=model.reducer(saved,{...a,storyId:"nikita"});
  saved.stories.nikita.currentStepId="keys";
  saved.stories.liza=model.initialState().stories.liza;
  saved.version=4;saved.cursor="/stories/nikita/keys";
  saved.quiz={answers:{0:"A",1:"C"},completed:false};
  await openSelection(page);
  await page.evaluate(s=>sessionStorage.setItem("invisible-stories:pilot:v1",JSON.stringify(s)),saved);
  await page.goto("http://pilot.test/stories/nikita/keys");
  await expect(page).toHaveURL(/\/stories$/);
  const migrated=await page.evaluate(()=>JSON.parse(sessionStorage.getItem("invisible-stories:pilot:v1")));
  expect(migrated.version).toBe(6);
  expect(migrated.stories.nikita).toEqual(saved.stories.nikita);
  expect(migrated.quiz).toEqual(saved.quiz);
  const unlocked=finishStory(migrated,"liza",model,storyRegistry);
  await page.evaluate(s=>sessionStorage.setItem("invisible-stories:pilot:v1",JSON.stringify(s)),unlocked);
  await page.reload();
  await expect(card(page,"nikita").locator(".archive-card-status")).toHaveText("В процессе");
  await card(page,"nikita").getByRole("button",{name:"Продолжить",exact:true}).click();
  await expect(page).toHaveURL(/nikita\/keys$/);
  await expect(page.getByRole("status")).toHaveText("Фрагмент 2 из 10");
  await page.reload();
  await expect(page.getByRole("status")).toHaveText("Фрагмент 2 из 10");
});
