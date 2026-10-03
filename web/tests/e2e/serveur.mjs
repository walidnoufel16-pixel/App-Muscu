/* Petit serveur statique pour out/ (export Next), comme Render. */
import { createServer } from "node:http";
import { readFileSync, existsSync, statSync } from "node:fs";
import { join, extname } from "node:path";
const T = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".css": "text/css", ".jpg": "image/jpeg", ".avif": "image/avif", ".png": "image/png", ".woff2": "font/woff2", ".webmanifest": "application/manifest+json", ".json": "application/json", ".txt": "text/plain" };
export function servir(dir, port) {
  return createServer((q, r) => {
    let p = decodeURIComponent(q.url.split("?")[0]);
    let f = join(dir, p);
    if (existsSync(f) && statSync(f).isDirectory()) f = join(f, "index.html");
    if (!existsSync(f)) { f = join(dir, "404.html"); r.writeHead(404); return r.end(existsSync(f) ? readFileSync(f) : ""); }
    r.writeHead(200, { "Content-Type": T[extname(f)] || "application/octet-stream" });
    r.end(readFileSync(f));
  }).listen(port);
}
