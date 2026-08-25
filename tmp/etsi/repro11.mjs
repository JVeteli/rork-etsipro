import { chromium } from "playwright-core";
import { createServer } from "node:http";
import { readFileSync } from "node:fs";

const grab = readFileSync("/tmp/etsi/react-grab.js");
const html = readFileSync("/tmp/etsi/deployed.html", "utf8");
const BASE = "https://z7vh958d7ib50hfe3ltkr-web-etsipro.rork.live";

// rewrite: react-grab → local, assets → absolute deployed URLs
const rewritten = html
  .replace("https://unpkg.com/react-grab@0.1.47/dist/index.global.js", "/react-grab.js")
  .replace(/integrity="sha384-[^"]*"/, "")
  .replace(/src="\/assets\//g, `src="${BASE}/assets/`)
  .replace(/href="\/assets\//g, `href="${BASE}/assets/`)
  .replace(/href="\/favicon\.png"/g, `href="${BASE}/favicon.png"`)
  .replace(/href="\/icon\.png"/g, `href="${BASE}/icon.png"`);

createServer((req, res) => {
  if (req.url === "/react-grab.js") {
    res.writeHead(200, { "Content-Type": "text/javascript; charset=utf-8" });
    return res.end(grab);
  }
  if (req.url === "/") {
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    return res.end(rewritten);
  }
  res.writeHead(404);
  res.end("nope");
}).listen(5204);

const browser = await chromium.launch({
  executablePath: "/home/user/.cache/ms-playwright/chromium_headless_shell-1223/chrome-headless-shell-linux64/chrome-headless-shell",
});
const page = await browser.newPage();
const errors = [];
const logs = [];
const reqs = [];
page.on("pageerror", (err) => errors.push({ where: "main", message: err.message, stack: err.stack }));
page.on("console", (msg) => logs.push({ where: "main", type: msg.type(), text: msg.text().slice(0, 130) }));
page.on("request", (req) => {
  if (req.url().includes("react-grab")) reqs.push("REQ " + req.url());
});
page.on("requestfailed", (req) => reqs.push("FAIL " + req.url()));

await page.goto("http://localhost:5204/", { waitUntil: "domcontentloaded", timeout: 20000 }).catch(() => {});
await page.waitForTimeout(10000);

console.log("=== requests involving react-grab ===");
for (const r of reqs) console.log(r);

console.log("\n=== CONSOLE ===");
for (const l of logs.slice(0, 50)) console.log(`[${l.type}]`, l.text);
console.log("grab banner:", logs.some((l) => l.text.includes("React Grab")));

console.log("\n=== ERRORS ===");
if (!errors.length) console.log("(none)");
for (const e of errors) {
  console.log("WHERE:", e.where, "|", e.message);
  console.log((e.stack || "").slice(0, 800));
  console.log("---");
}

// grab-mode: Alt + hover
try {
  await page.keyboard.down("Alt");
  await page.mouse.move(300, 200, { steps: 3 });
  await page.mouse.move(600, 450, { steps: 3 });
  await page.mouse.move(900, 650, { steps: 3 });
  await page.keyboard.up("Alt");
  await page.waitForTimeout(5000);
} catch {}

console.log("\n=== AFTER HOVER ===");
for (const e of errors) console.log(e.where, "|", e.message);

await browser.close();
process.exit(0);
