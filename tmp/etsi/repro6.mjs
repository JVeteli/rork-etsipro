import { chromium } from "playwright-core";
import { createServer } from "node:http";
import { readFileSync } from "node:fs";

const grab = readFileSync("/tmp/etsi/react-grab.js");
createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "text/javascript; charset=utf-8", "Access-Control-Allow-Origin": "*" });
  res.end(grab);
}).listen(5202);

const browser = await chromium.launch({
  executablePath: "/home/user/.cache/ms-playwright/chromium_headless_shell-1223/chrome-headless-shell-linux64/chrome-headless-shell",
});
const page = await browser.newPage();

const errors = [];
const logs = [];
const requests = [];
page.on("pageerror", (err) => errors.push({ message: err.message, stack: err.stack }));
page.on("console", (msg) => logs.push({ type: msg.type(), text: msg.text().slice(0, 110) }));
page.on("request", (req) => {
  if (req.url().includes("react-grab") || req.url().includes("unpkg")) requests.push(req.url());
});
page.on("requestfailed", (req) => requests.push("FAILED: " + req.url()));

// Rewrite deployed HTML: point react-grab at our local server
await page.route("https://z7vh958d7ib50hfe3ltkr-web-etsipro.rork.live/", async (route) => {
  const html = await (await fetch("https://z7vh958d7ib50hfe3ltkr-web-etsipro.rork.live/")).text();
  const swapped = html.replace(
    "https://unpkg.com/react-grab@0.1.47/dist/index.global.js",
    "http://localhost:5202/react-grab.js",
  );
  await route.fulfill({ status: 200, contentType: "text/html; charset=utf-8", body: swapped });
});

await page.setContent(`<!doctype html><html><body><iframe id="f" style="width:1200px;height:900px"></iframe></body></html>`);
await page.evaluate(() => {
  const f = document.getElementById("f");
  f.src = "https://z7vh958d7ib50hfe3ltkr-web-etsipro.rork.live/";
});
await page.waitForTimeout(12000);

console.log("=== react-grab requests ===");
for (const r of requests) console.log(r);
console.log("=== console (first 30) ===");
for (const l of logs.slice(0, 30)) console.log(`[${l.type}]`, l.text);
console.log("grab banner seen:", logs.some((l) => l.text.includes("React Grab")));

console.log("\n=== ERRORS ===");
if (!errors.length) console.log("(none)");
for (const e of errors) {
  console.log("MSG:", e.message);
  console.log((e.stack || "").slice(0, 900));
  console.log("---");
}
await browser.close();
