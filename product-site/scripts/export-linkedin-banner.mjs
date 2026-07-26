import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const input = path.join(root, "src", "assets", "linkedin-banner.svg");
const assets = path.join(root, "src", "assets");

const exports = [
  { width: 1128, file: "linkedin-banner.png" },
  { width: 2256, file: "linkedin-banner@2x.png" },
];

for (const item of exports) {
  const output = path.join(assets, item.file);
  const result = spawnSync(
    "npx",
    ["--yes", "@resvg/resvg-js-cli", "--fit-width", String(item.width), "--shape-rendering", "2", input, output],
    { stdio: "inherit", shell: true, cwd: root },
  );
  if (result.status !== 0) process.exit(result.status ?? 1);
}

console.log("Exported LinkedIn banner PNGs.");
