import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
const baseline = JSON.parse(
  await readFile(
    new URL("./fixtures/pilot-baseline.json", import.meta.url),
    "utf8",
  ),
);
test("approved pilot content, statistics implementation, Vercel and all images remain byte-identical", async () => {
  for (const [path, hash] of Object.entries(baseline).filter(
    ([path]) => !path.startsWith("@"),
  ))
    assert.equal(
      createHash("sha256")
        .update(await readFile(new URL("../" + path, import.meta.url)))
        .digest("hex"),
      hash,
      path,
    );
});

test("entry quiz routes and score calculations are absent from the active interface", async () => {
  const main = await readFile(new URL("../src/main.jsx", import.meta.url), "utf8");
  const exhibition = await readFile(new URL("../src/pages/Exhibition.jsx", import.meta.url), "utf8");
  const provider = await readFile(new URL("../src/state/Provider.jsx", import.meta.url), "utf8");
  assert.doesNotMatch(main, /element=\{<(Quiz|Transition)/);
  assert.doesNotMatch(exhibition, /initialQuiz|quizPath|первоначальная проверка|сравнение ответов до и после/i);
  assert.doesNotMatch(provider, /initialScore|initialQuiz/);
});
