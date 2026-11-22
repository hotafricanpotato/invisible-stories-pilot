import { test as base, expect } from "@playwright/test";
import { readFile } from "node:fs/promises";
import path from "node:path";
const root = path.resolve("dist");
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
export async function finishQuiz(page) {
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
