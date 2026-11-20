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

test("initial quiz UI and interaction code is unchanged", async () => {
  const source = await readFile(
    new URL("../src/pages/Exhibition.jsx", import.meta.url),
    "utf8",
  );
  const fn = source
    .split("export function Quiz()")[1]
    .split("export function Transition()")[0];
  assert.equal(
    createHash("sha256").update(fn).digest("hex"),
    baseline["@Quiz"],
  );
});
