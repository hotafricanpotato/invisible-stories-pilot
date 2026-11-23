import { test as base, expect } from "@playwright/test";
import { readFile } from "node:fs/promises";
import path from "node:path";
const root = path.resolve(process.env.PILOT_BUILD_DIR || "dist");
const artifacts = process.env.ARTIFACT_DIR || path.resolve("../../work");
// Serve the real production bundle inside the browser runner. No preview relay,
// external server, or external network is required for these tests.
export const test = base.extend({
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
export const goNext = (page) =>
  page.getByRole("button", { name: "Далее →", exact: true }).click();
export async function noOverflow(page) {
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
}
export async function assertText(page, text) {
  for (const p of text.split("\n\n"))
    await expect(page.locator("main")).toContainText(p);
}
export async function revealAll(page) {
  await expect(page.getByRole("status")).toHaveText(/Фрагмент \d+(?:–\d+)? из \d+/);
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
export async function openSelection(page) {
  await page.goto("http://pilot.test/stories");
  await expect(page.getByRole("heading", {level: 1})).toHaveText("Три истории. Три разных дома.");
}

// Walk a real story in the browser; no saved completion flags are injected.
export async function completeStoryInBrowser(page, story) {
  await page.locator(`[aria-labelledby="card-${story.id}"]`).getByRole('button').click();
  for (const step of story.steps) {
    await expect(page).toHaveURL(new RegExp(`/stories/${story.id}/${step.id}$`));
    if (step.kind === 'scene') {
      await revealAll(page);
      await goNext(page);
    } else if (step.kind === 'materials') {
      await expect(page.locator('.material')).toHaveCount(3);
      for (const [index, material] of story.materials.entries()) {
        const section = page.locator('.material').nth(index);
        const open = section.getByRole('button', {name:'Открыть материал ↓'});
        if (await open.count()) await open.click();
        if (material.type === 'dialogue') {
          while (true) {
            const current = await section.getByRole('status').innerText();
            const [,position,total] = current.match(/Фрагмент (\d+) из (\d+)/);
            if (Number(position) === Number(total)) break;
            await section.getByRole('button', {name:'Далее →',exact:true}).click();
            await expect(section.getByRole('status')).not.toHaveText(current);
          }
        }
      }
      await page.getByRole('button',{name:'К карте невидимого →'}).click();
    } else if (step.kind === 'map') {
      await expect(page.locator('.map-question')).toHaveCount(3);
      const reveal=page.getByRole('button',{name:'Раскрыть связи'});
      if(await reveal.count()) {
        for(const question of await page.locator('.map-question').all()) await question.getByRole('radio').first().check();
        await reveal.click();
      }
      await page.getByRole('button',{name:'К заключению →'}).click();
    } else if (step === story.steps.at(-1)) {
      await page.getByRole('button',{name:'К выбору историй →'}).click();
    } else await goNext(page);
  }
  await expect(page).toHaveURL(/\/stories$/);
}

// Exercise the final test through its real radio controls, with no state injection.
export async function completeFinalTestInBrowser(page) {
  for (let n=1;n<=5;n++) {
    await expect(page).toHaveURL(new RegExp(`/final-test/${n}$`));
    await page.getByRole('radio').first().check();
    await page.getByRole('button',{name:n===5?'Перейти к разбору':'Далее',exact:true}).click();
  }
  await expect(page).toHaveURL(/\/final-test\/review$/);
  await page.getByRole('button',{name:'Завершить просмотр',exact:true}).click();
  await expect(page).toHaveURL(/\/complete$/);
}
