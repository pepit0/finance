import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const assets = path.join(root, "src", "assets");

const variants = [
  { svg: "logo-mark-dark.svg", png: "logo-mark-dark" },
  { svg: "logo-mark-light.svg", png: "logo-mark-light" },
];

const sizes = [1024, 2048];

for (const { svg, png } of variants) {
  const input = path.join(assets, svg);
  for (const size of sizes) {
    const output = path.join(assets, `${png}-${size}.png`);
    const result = spawnSync(
      "npx",
      ["--yes", "@resvg/resvg-js-cli", "--fit-width", String(size), "--shape-rendering", "2", input, output],
      { stdio: "inherit", shell: true, cwd: root },
    );
    if (result.status !== 0) process.exit(result.status ?? 1);
  }

  const defaultOutput = path.join(assets, `${png}.png`);
  spawnSync("node", ["-e", `require('fs').copyFileSync(${JSON.stringify(path.join(assets, `${png}-1024.png`))}, ${JSON.stringify(defaultOutput)})`], {
    stdio: "inherit",
    cwd: root,
  });
}

console.log("Exported logo PNGs at 1024px and 2048px.");
