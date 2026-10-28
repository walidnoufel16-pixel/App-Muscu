// Moteur de lecture des codes-barres (zxing-wasm, utilisé par barcode-detector) servi par l'app
// elle-même plutôt que par un CDN : recopié avant chaque build depuis node_modules, il suit
// toujours la version installée. Chargé seulement à l'ouverture du scanner, sur les téléphones
// dont le navigateur ne lit pas les codes-barres tout seul (iPhone).
import { copyFileSync, mkdirSync } from "node:fs";

const SRC = new URL("../node_modules/zxing-wasm/dist/reader/zxing_reader.wasm", import.meta.url).pathname;
const OUT = new URL("../public/zxing/", import.meta.url).pathname;
mkdirSync(OUT, { recursive: true });
copyFileSync(SRC, OUT + "zxing_reader.wasm");
console.log("zxing_reader.wasm copié dans public/zxing/");
