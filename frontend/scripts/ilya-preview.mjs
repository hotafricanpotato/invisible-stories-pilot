import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
const root = fileURLToPath(new URL("../", import.meta.url));
const build = process.argv[2] === "build";
const result = spawnSync(process.execPath, [fileURLToPath(new URL("../node_modules/vite/bin/vite.js", import.meta.url)),
  ...(build ? ["build", "--outDir", "dist-ilya-preview"] : ["--host", "0.0.0.0"])], {
  cwd: root, env: {...process.env, VITE_ENABLE_ILYA_PREVIEW: "1"}, stdio: "inherit",
});
if (result.error) throw result.error;
process.exitCode = result.status ?? 1;
