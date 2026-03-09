import { copyFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const source = resolve(root, "node_modules/zxing-wasm/dist/reader/zxing_reader.wasm");
const destination = resolve(root, "public/vendor/zxing_reader.wasm");

if (!existsSync(source)) {
  console.warn(`[sync-zxing-wasm] Skipping copy because ${source} does not exist.`);
  process.exit(0);
}

mkdirSync(dirname(destination), { recursive: true });
copyFileSync(source, destination);
console.log(`[sync-zxing-wasm] Copied ${source} -> ${destination}`);
