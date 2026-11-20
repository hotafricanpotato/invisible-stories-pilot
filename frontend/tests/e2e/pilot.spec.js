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
  await page.getByRole("button", { name: "Перейти к истории →" }).click();
  await page.getByRole("button", { name: "Начать историю Никиты →" }).click();
  const scenes = [...story.stages[0].scenes, ...story.stages[1].scenes];
  for (let i = 0; i < 4; i++) {
    const scene = scenes[i];
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      scene.title,
    );
    for (const k of [
      "text",
      "narration",
      "monologue",
      "monologue_before",
      "monologue_middle",
      "monologue_after",
    ])
      if (scene[k]) await assertText(page, scene[k]);
    for (const m of [...(scene.messages || []), ...(scene.dialogue || [])])
      await assertText(page, m.text);
    await expect(page.locator("main img")).toHaveJSProperty(
      "naturalWidth",
      i === 0 ? 587 : i === 1 ? 582 : i === 2 ? 602 : 1122,
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
