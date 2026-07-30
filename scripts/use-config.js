// Local dev / demo helper — mimics the Factory's scaffold stage: copies a
// client config over src/app-config.json. Usage:
//   node scripts/use-config.js examples/gulf-drones.config.json
import { copyFileSync, existsSync } from "fs";
import { join, dirname, resolve } from "path";
import { fileURLToPath } from "url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const [src] = process.argv.slice(2);
if (!src) {
  console.error("Usage: node scripts/use-config.js <path-to-config.json>");
  process.exit(1);
}
const from = resolve(src);
if (!existsSync(from)) {
  console.error("Not found:", from);
  process.exit(1);
}
copyFileSync(from, join(root, "src", "app-config.json"));
console.log("src/app-config.json <- " + from);
