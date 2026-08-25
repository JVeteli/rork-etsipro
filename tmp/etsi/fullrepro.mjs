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
page.on("pageerror", (err) => errors.push({ where: "parent", message: err.message, stack: err.stack }));
page.on("console", (msg) => logs.push({ where: "parent", type: msg.type(), text: msg.text().slice(0, 90) }));

// swap the unpkg react-grab URL for our local copy inside the deployed HTML
await page.route("https://z7vh958d7ib50hfe3ltkr-web-etsipro.rork.live/", async (route) => {
  const resp = await route.fetch();
  let html = await resp.text();
  html = html.replace(
    "https://unpkg.com/react-grab@0.1.47/dist/index.global.js",
    "http://localhost:5202/react-grab.js",
  );
  await route.fulfill({ response: resp, body: html });
});

await page.setContent(`<!doctype html><html><body><iframe id="f" style="width:1200px;height:900px"></iframe></body></html>`);
await page.evaluate(() => {
  const f = document.getElementById("f");
  f.src = "https://z7vh958d7ib50hfe3ltkr-web-etsipro.rork.live/";
});
await page.waitForTimeout(6000);

const frames = page.frames().filter((fr) => fr.url().includes("rork.live"));
const frame = frames[0];
if (frame) {
  frame.on("pageerror", (err) => errors.push({ where: "iframe", message: err.message, stack: err.stack }));
  frame.on("console", (msg) => logs.push({ where: "iframe", type: msg.type(), text: msg.text().slice(0, 90) }));
}

await page.waitForTimeout(8000);
console.log("=== IFRAME CONSOLE ===");
for (const l of logs.filter((x) => x.where === "iframe").slice(0, 40)) console.log(`[${l.type}]`, l.text);
console.log("react-grab loaded:", logs.some((l) => l.where === "iframe" && l.text.includes("React Grab")));

console.log("\n=== ERRORS ===");
for (const e of errors) {
  console.log("WHERE:", e.where, "|", e.message);
  if (e.where === "iframe") console.log((e.stack || "").slice(0, 900));
  console.log("---");
}

// interact: navigate to a service and open booking dialog
if (frame) {
  await frame.goto("https://z7vh958d7ib50hfe3ltkr-web-etsipro.rork.live/selaa", { waitUntil: "networkidle", timeout: 30000 }).catch(() => {});
  await page.waitForTimeout(3000);
  const links = await frame.locator("a[href^='/palvelu/']").evaluateAll((els) => els.map((e) => e.getAttribute("href"))).catch(() => []);
  if (links.length) {
    await frame.goto(`https://z7vh958d7ib50hfe3ltkr-web-etsipro.rork.live${links[0]}`, { waitUntil: "networkidle", timeout: 30000 }).catch(() => {});
    await page.waitForTimeout(3000);
    const book = frame.locator("button:has-text('Varaa')").first();
    if (await book.count()) {
      await book.click().catch(() => {});
      await page.waitForTimeout(2000);
    }
  }
}

console.log("\n=== ERRORS AFTER INTERACTIONS ===");
for (const e of errors) {
  console.log("WHERE:", e.where, "|", e.message);
  if (e.where === "iframe") console.log((e.stack || "").slice(0, 900));
  console.log("---");
}
await browser.close();
