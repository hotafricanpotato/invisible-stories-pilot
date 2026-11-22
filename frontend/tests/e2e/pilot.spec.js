import { test as base, expect } from "@playwright/test";
import { readFile } from "node:fs/promises";
import path from "node:path";
const root = path.resolve("dist");
const artifacts = process.env.ARTIFACT_DIR || path.resolve("../../work");
const quiz = JSON.parse(await readFile("src/content/initialQuiz.json", "utf8"));
const story = JSON.parse(await readFile("src/content/nikita.json", "utf8"));
const stats = JSON.parse(await readFile("src/content/statistics.json", "utf8"));
// Serve the real production bundle inside the browser runner. No preview relay,
// external server, or external network is required for these tests.
const test = base.extend({
  page: async ({ page }, use) => {
    await page.route("http://pilot.test/**", async (route) => {
      const url = new URL(route.request().url());
      const asset = url.pathname.startsWith("/assets/");
      const file = asset
        ? path.join(root, url.pathname)
        : path.join(root, "index.html");
      try {
        const body = await readFile(file);
        const ext = path.extname(file);
        await route.fulfill({
          body,
          contentType:
            {
              ".html": "text/html",
              ".js": "application/javascript",
              ".css": "text/css",
              ".jpg": "image/jpeg",
              ".webp": "image/webp",
            }[ext] || "application/octet-stream",
        });
      } catch {
        await route.fulfill({ status: 404, body: "Not found" });
      }
    });
    await use(page);
  },
});
const goNext = (page) =>
  page.getByRole("button", { name: "Далее →", exact: true }).click();
async function noOverflow(page) {
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
}
async function assertText(page, text) {
  for (const p of text.split("\n\n"))
    await expect(page.locator("main")).toContainText(p);
}
async function revealAll(page) {
  let text = await page.locator("main").innerText();
  while (true) {
    const old = await page.getByRole("status").innerText();
    const match = old.match(/Фрагмент (\d+)(?:–(\d+))? из (\d+)/);
    if (Number(match[2] ?? match[1]) >= Number(match[3])) break;
    await goNext(page);
    await expect(page.getByRole("status")).not.toHaveText(old);
    text += "\n" + await page.locator("main").innerText();
  }
  return text;
}
async function finishQuiz(page) {
  await page.goto("http://pilot.test/quiz/1");
  for (let i = 0; i < 5; i++) {
    await expect(page).toHaveURL(new RegExp(`/quiz/${i + 1}$`));
    await page.getByRole("radio").nth(1).check();
    await page
      .getByRole("button", {
        name: i === 4 ? "Завершить проверку →" : "Далее →",
        exact: true,
      })
      .click();
  }
}
test("complete production pilot, exact content, gates, reload, reset and no answer transmission", async ({
  page,
}, info) => {
  const errors = [];
  const requests = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("request", (r) =>
    requests.push({ url: r.url(), method: r.method(), body: r.postData() }),
  );
  await page.goto("http://pilot.test/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "НЕВИДИМЫЕ",
  );
  await noOverflow(page);
  await page.screenshot({
    path: `${artifacts}/home-${info.project.name}.png`,
    fullPage: true,
  });
  await page
    .getByRole("button", { name: /^(Начать|Продолжить) выставку →$/ })
    .click();
  for (let i = 0; i < 5; i++) {
    await assertText(page, quiz[i].situation);
    await assertText(page, quiz[i].question);
    for (const text of Object.values(quiz[i].options))
      await assertText(page, text);
    const next = page.getByRole("button", {
      name: i === 4 ? "Завершить проверку →" : "Далее →",
      exact: true,
    });
    await expect(next).toBeDisabled();
    await expect(
      page.getByText(quiz[i].explanation, { exact: true }),
    ).toHaveCount(0);
    await page
      .getByRole("radio")
      .nth(i % 4)
      .check();
    if (i === 1) {
      await page.getByRole("button", { name: "← Назад", exact: true }).click();
      await expect(page.getByRole("radio").nth(0)).toBeChecked();
      await goNext(page);
    }
    await noOverflow(page);
    await next.click();
  }
  await expect(page).toHaveURL(/quiz\/complete$/);
  await expect(page.locator(".story-shell")).toHaveCount(0);
  await page.getByRole("button", { name: "Перейти к истории →" }).click();
  await page.getByRole("button", { name: "Начать историю Никиты →" }).click();
  const scenes = [...story.stages[0].scenes, ...story.stages[1].scenes];
  for (let i = 0; i < 4; i++) {
    const scene = scenes[i];
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      scene.title,
    );
    const visitedText = await revealAll(page);
    for (const k of [
      "text",
      "narration",
      "monologue",
      "monologue_before",
      "monologue_middle",
      "monologue_after",
    ])
      if (scene[k]) for (const paragraph of scene[k].split("\n\n")) expect(visitedText).toContain(paragraph);
    for (const m of [...(scene.messages || []), ...(scene.dialogue || [])])
      expect(visitedText).toContain(m.text);
    await expect(page.locator("main img")).toHaveJSProperty(
      "naturalWidth",
      i === 0 ? 587 : i === 1 ? 582 : i === 2 ? 1920 : 1122,
    );
    await noOverflow(page);
    if (i === 2)
      await page.screenshot({
        path: `${artifacts}/dialogue-${info.project.name}.png`,
        fullPage: true,
      });
    await goNext(page);
  }
  await expect(
    page.getByRole("button", { name: "К карте невидимого →" }),
  ).toBeDisabled();
  // Direct nested URL cannot skip materials.
  await page.goto("http://pilot.test/stories/nikita/conclusion");
  await expect(page).toHaveURL(/\/materials$/);
  for (let i = 0; i < 3; i++) {
    const m = story.stages[2].materials[i];
    const section = page.locator(".material").nth(i);
    await section.getByRole("button", { name: "Открыть материал ↓" }).click();
    for (const message of m.messages || [])
      await assertText(page, message.text);
    for (const item of m.items || []) await assertText(page, item);
    for (const key of ["monologue", "transcript", "status", "highlight"])
      if (m[key]) await assertText(page, m[key]);
    if (i < 2)
      await expect(
        page.getByRole("button", { name: "К карте невидимого →" }),
      ).toBeDisabled();
  }
  await page.reload();
  await expect(
    page.getByText("Изучено материалов", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "К карте невидимого →" }),
  ).toBeEnabled();
  await page.getByRole("button", { name: "К карте невидимого →" }).click();
  await expect(
    page.getByRole("button", { name: "Раскрыть связи" }),
  ).toBeDisabled();
  await expect(
    page.getByRole("button", { name: "К заключению →" }),
  ).toBeDisabled();
  for (const [i, q] of story.stages[3].questions.entries()) {
    const section = page.locator(".map-question").nth(i);
    await assertText(page, q.fragment);
    await section.getByRole("radio").nth(i).check();
  }
  await page.screenshot({
    path: `${artifacts}/map-${info.project.name}.png`,
    fullPage: true,
  });
  await noOverflow(page);
  await page.getByRole("button", { name: "Раскрыть связи" }).click();
  for (const q of story.stages[3].questions)
    await assertText(page, q.explanation);
  await expect(page.getByRole("radio")).toHaveCount(0);
  await page.reload();
  await expect(
    page.getByRole("button", { name: "К заключению →" }),
  ).toBeEnabled();
  await page.getByRole("button", { name: "К заключению →" }).click();
  await expect(page.locator(".story-shell")).toHaveCount(0);
  const end = story.stages[4];
  for (const f of end.factors) {
    await assertText(page, f.title);
    await assertText(page, f.text);
  }
  for (const k of ["introduction", "final_text", "final_emphasis"])
    await assertText(page, end[k]);
  await page.getByRole("button", { name: "К невидимой статистике →" }).click();
  await page.goto("http://pilot.test/statistics/4");
  await expect(page).toHaveURL(/statistics\/1$/);
  await expect(page.locator(".story-shell")).toHaveCount(0);
  for (const line of stats.russia.slice(0, 4))
    await assertText(page, line.text);
  for (const [name, val] of stats.values) {
    await expect(
      page.locator(".stat-bar").filter({ hasText: name }),
    ).toContainText(String(val).replace(".", ",") + "%");
  }
  await page
    .getByRole("radio", { name: "Только нефизические", exact: true })
    .check();
  await expect(page.locator(".stat-bar")).toHaveCount(2);
  await page.reload();
  await expect(
    page.getByRole("radio", { name: "Только нефизические", exact: true }),
  ).toBeChecked();
  await goNext(page);
  for (let i = 0; i < 2; i++) {
    await page.locator(".document").nth(i).getByRole("button").click();
    await assertText(page, stats.data[i][4]);
  }
  await assertText(page, stats.world[3].text);
  await noOverflow(page);
  await goNext(page);
  await expect(
    page.getByRole("button", { name: "Раскрыть объяснение" }),
  ).toBeDisabled();
  await page.getByRole("radio").nth(1).check();
  await page.getByRole("button", { name: "Раскрыть объяснение" }).click();
  await assertText(page, stats.limits[4].text);
  await goNext(page);
  for (const [label, text] of stats.connections) {
    await page.getByRole("button", { name: label }).click();
    await assertText(page, text);
  }
  await page.getByRole("button", { name: "Завершить пилот →" }).click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Спасибо за участие",
  );
  await page.reload();
  await expect(page).toHaveURL(/\/complete$/);
  await page
    .getByRole("button", { name: "Начать заново", exact: true })
    .click();
  await page.getByRole("button", { name: "Отмена", exact: true }).click();
  await expect(page).toHaveURL(/\/complete$/);
  await page
    .getByRole("button", { name: "Начать заново", exact: true })
    .click();
  await page.getByRole("button", { name: "Удалить прогресс и начать" }).click();
  await expect(page).toHaveURL("http://pilot.test/");
  await page.goto("http://pilot.test/complete");
  await expect(page).toHaveURL(/quiz\/1$/);
  await expect(page.getByRole("radio").first()).not.toBeChecked();
  expect(errors).toEqual([]);
  expect(
    requests.filter(
      (r) =>
        new URL(r.url).origin !== "http://pilot.test" ||
        r.method !== "GET" ||
        r.body,
    ),
  ).toEqual([]);
});
test("guarded direct links, small layouts, keyboard and unavailable storage", async ({
  page,
}) => {
  await page.goto("http://pilot.test/statistics/4");
  await expect(page).toHaveURL(/quiz\/1$/);
  await page.goto("http://pilot.test/");
  for (const width of [320, 390, 768, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    await noOverflow(page);
  }
  await page.setViewportSize({ width: 320, height: 900 });
  await page
    .getByRole("button", { name: /^(Начать|Продолжить) выставку →$/ })
    .click();
  await page.getByRole("radio").first().focus();
  await page.keyboard.press("Space");
  await expect(page.getByRole("radio").first()).toBeChecked();
  await noOverflow(page);
  await finishQuiz(page);
  await page.goto("http://pilot.test/stories/nikita/map");
  await expect(page).toHaveURL(/\/sunday$/);
  await page.addInitScript(() => {
    Object.defineProperty(window, "sessionStorage", {
      get() {
        throw new Error("blocked");
      },
    });
  });
  await page.goto("http://pilot.test/");
  await expect(page.getByRole("status")).toContainText(
    "Хранилище браузера недоступно",
  );
  await page
    .getByRole("button", { name: /^(Начать|Продолжить) выставку →$/ })
    .click();
  await expect(page.getByRole("radio")).toHaveCount(4);
});

test("single live reply, full chat, back, reload, keyboard and responsive layouts", async ({ page }, info) => {
  await finishQuiz(page);
  await page.goto("http://pilot.test/stories/nikita/sunday");
  await goNext(page);
  for (const message of story.stages[0].scenes[1].messages) await assertText(page, message.text);
  await expect(page.locator(".scene-navigation button")).toHaveCount(2);
  await goNext(page);
  await expect(page).toHaveURL(/\/keys$/);
  await expect(page.locator(".live-dialogue")).toHaveCount(0);
  const forward = page.getByRole("button", { name: "Далее →", exact: true });
  await forward.focus();
  await page.keyboard.down("Enter");
  await expect(page.locator(".live-dialogue")).toHaveCount(1);
  await expect(page.locator(".live-dialogue")).toContainText("Никит, иди сюда. Поговорим.");
  await page.keyboard.down("Enter");
  await page.keyboard.up("Enter");
  await expect(page.getByRole("status")).toHaveText("Фрагмент 2 из 10");
  await forward.click();
  await expect(page.locator(".live-dialogue")).toHaveCount(1);
  await expect(page.getByText("Никит, иди сюда. Поговорим.", { exact: true })).toHaveCount(0);
  await page.getByRole("button", { name: "← Назад", exact: true }).click();
  await page.reload();
  await expect(page.getByRole("status")).toHaveText("Фрагмент 2 из 10");
  const saved = await page.evaluate(() => JSON.parse(sessionStorage.getItem("invisible-stories:pilot:v1")));
  expect(saved.stories.nikita.revealedFragments.keys).toBe(3);
  for (const width of [320, 360, 390, 430, 768, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    await noOverflow(page);
    const image = page.locator(".scene-artwork img");
    const dimensions = await image.evaluate(el => ({ width: el.clientWidth, height: el.clientHeight, ratio: el.naturalWidth / el.naturalHeight }));
    expect(Math.abs(dimensions.width / dimensions.height - dimensions.ratio)).toBeLessThan(.03);
  }
  await page.setViewportSize(info.project.use.viewport);
  await revealAll(page);
  await page.getByRole("button", { name: "← Назад", exact: true }).click();
  await expect(page.getByRole("button", { name: "Далее →", exact: true })).toBeEnabled();
  await page.screenshot({ path: `${artifacts}/single-dialogue-${info.project.name}.png`, fullPage: true });
});

test("existing v1 session migrates in the browser without replaying visited scenes or losing answers", async ({
  page,
}) => {
  const legacy = {
    version: 1,
    contentVersion: "pilot-1",
    cursor: "/stories/nikita/map",
    quiz: {
      answers: { 0: "B", 1: "C", 2: "C", 3: "A", 4: "C" },
      completed: true,
    },
    nikita: {
      unlocked: 5,
      opened: ["dima_chat", "phone_note", "voice_message"],
      active: "phone_note",
      answers: { kitchen: "B", football: "C", unsent_message: "A" },
      revealed: true,
      completed: false,
    },
    stats: {
      unlocked: 0,
      filter: "Только нефизические",
      expanded: [],
      answer: null,
      revealed: false,
      completed: false,
    },
  };
  await page.goto("http://pilot.test/");
  await page.evaluate(
    (value) =>
      sessionStorage.setItem(
        "invisible-stories:pilot:v1",
        JSON.stringify(value),
      ),
    legacy,
  );
  await page.goto("http://pilot.test/stories/nikita/map");
  await expect(
    page.getByRole("button", { name: "К заключению →" }),
  ).toBeEnabled();
  await expect(page.getByRole("radio")).toHaveCount(0);
  await page.getByRole("button", { name: "← Назад", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "К карте невидимого →" }),
  ).toBeEnabled();
  await expect(page.locator(".studied")).toHaveCount(3);
  await expect(
    page.getByText("НЕ СПРАШИВАТЬ, ЕСЛИ ПАПА ВЫПИЛ", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "← Назад", exact: true }).click();
  await expect(page).toHaveURL(/\/football$/);
  await expect(page.getByRole("status")).toHaveText("Фрагмент 7 из 7");
  await page.reload();
  await expect(page.getByRole("status")).toHaveText("Фрагмент 7 из 7");
  const saved = await page.evaluate(() =>
    JSON.parse(sessionStorage.getItem("invisible-stories:pilot:v1")),
  );
  expect(saved.version).toBe(3);
  expect(saved.quiz).toEqual(legacy.quiz);
  expect(saved.stories.nikita.answers).toEqual(legacy.nikita.answers);
  expect(saved.stories.nikita.currentStepId).toBe("football");
  expect(saved.stats.filter).toBe("Только нефизические");
});

test("v2 reading migration, theme tokens, material close and mobile reading", async ({ page }, info) => {
  await finishQuiz(page);
  await page.goto("http://pilot.test/stories/nikita/sunday");
  await goNext(page);
  await goNext(page);
  await revealAll(page);
  await page.evaluate(() => {
    const key = "invisible-stories:pilot:v1";
    const saved = JSON.parse(sessionStorage.getItem(key));
    saved.version = 2;
    delete saved.stories.nikita.currentFragments;
    saved.stories.nikita.revealedFragments.keys = 6;
    sessionStorage.setItem(key, JSON.stringify(saved));
  });
  await page.reload();
  await expect(page.getByRole("status")).toHaveText("Фрагмент 6 из 10");
  await page.getByRole("button", { name: "← Назад", exact: true }).click();
  await page.reload();
  await expect(page.getByRole("status")).toHaveText("Фрагмент 5 из 10");
  await revealAll(page);
  await goNext(page);
  await revealAll(page);
  await goNext(page);
  await page.locator(".material").nth(1).getByRole("button", { name: "Открыть материал ↓" }).click();
  for (const [theme, accent] of [["nikita", "#9d5946"], ["liza", "#76647f"], ["ilya", "#65745b"]]) {
    const value = await page.locator(".story-shell").evaluate((el, theme) => {
      el.dataset.storyTheme = theme;
      return getComputedStyle(el).getPropertyValue("--story-accent").trim();
    }, theme);
    expect(value).toBe(accent);
  }
  await page.locator(".story-shell").evaluate(el => { el.dataset.storyTheme = "nikita"; });
  for (const width of [360, 390, 430, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    await noOverflow(page);
    await expect(page.getByText("НЕ СПРАШИВАТЬ, ЕСЛИ ПАПА ВЫПИЛ", { exact: true })).toBeVisible();
  }
  await page.setViewportSize(info.project.use.viewport);
  await page.screenshot({ path: `${artifacts}/material-viewer-${info.project.name}.png`, fullPage: true });
  await page.getByRole("button", { name: "Закрыть материал ↑", exact: true }).focus();
  await page.keyboard.press("Escape");
  await expect(page.locator(".material-viewer")).toHaveCount(0);
  await expect(page.locator(".material").nth(1).getByRole("button", { name: "Открыть материал ↓" })).toBeFocused();
  await page.reload();
  await expect(page.locator(".studied")).toHaveCount(1);
});


test("full-window themes, comfortable reading, single navigation and zoom", async ({ page }, info) => {
  await finishQuiz(page);
  await page.goto("http://pilot.test/stories/nikita/sunday");
  for (const [theme, color] of [["nikita", "rgb(233, 217, 199)"], ["liza", "rgb(238, 230, 232)"], ["ilya", "rgb(231, 229, 217)"]]) {
    await page.locator(".story-shell").evaluate((el, theme) => { el.dataset.storyTheme = theme; }, theme);
    await expect(page.locator(".story-shell")).toHaveCSS("background-color", color);
    for (const width of [360, 390, 430, 1280, 1920]) {
      await page.setViewportSize({ width, height: 1000 });
      await noOverflow(page);
      const metrics = await page.evaluate(() => {
        const shell = document.querySelector(".story-shell");
        const main = document.querySelector("main");
        const reading = document.querySelector(".monologue-panel");
        return { width: shell.getBoundingClientRect().width, height: shell.getBoundingClientRect().height,
          headerColor: getComputedStyle(document.querySelector("header")).color,
          mainWidth: main.getBoundingClientRect().width, font: parseFloat(getComputedStyle(reading.querySelector("p")).fontSize),
          readingWidth: reading.getBoundingClientRect().width, background: getComputedStyle(shell).backgroundColor };
      });
      expect(metrics.width).toBe(width);
      expect(metrics.height).toBeGreaterThanOrEqual(1000);
      expect(metrics.mainWidth).toBeLessThanOrEqual(1200);
      expect(metrics.font).toBeGreaterThanOrEqual(20);
      expect(metrics.readingWidth).toBeLessThanOrEqual(850);
      expect(metrics.headerColor).not.toBe("rgb(242, 238, 233)");
    }
  }
  await page.locator(".story-shell").evaluate(el => { el.dataset.storyTheme = "nikita"; });
  await page.setViewportSize(info.project.use.viewport);
  await expect(page.locator(".scene-navigation button")).toHaveCount(2);
  await expect(page.locator(".step-nav")).toHaveCount(0);
  await page.locator("body").evaluate(el => { el.style.zoom = "2"; });
  await noOverflow(page);
  await expect(page.getByRole("button", { name: "Далее →", exact: true })).toBeVisible();
  await page.locator("body").evaluate(el => { el.style.zoom = "1"; });
  await page.screenshot({ path: `${artifacts}/story-environment-${info.project.name}.png`, fullPage: true });
  await goNext(page);
  await expect(page).toHaveURL(/messages_dima$/);
  await page.getByRole("button", { name: "← Назад", exact: true }).click();
  await expect(page).toHaveURL(/sunday$/);
  await page.reload();
  await expect(page.locator(".story-shell")).toHaveCSS("background-color", "rgb(233, 217, 199)");
});
