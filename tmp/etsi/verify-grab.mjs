import { chromium } from "playwright-core";

const browser = await chromium.launch({
  executablePath: "/home/user/.cache/ms-playwright/chromium_headless_shell-1223/chrome-headless-shell-linux64/chrome-headless-shell",
});
const page = await browser.newPage();

const errors = [];
const logs = [];
page.on("pageerror", (err) => errors.push({ where: "parent", message: err.message, stack: err.stack }));
page.on("console", (msg) => logs.push({ where: "parent", type: msg.type(), text: msg.text().slice(0, 150) }));

await page.route("https://unpkg.com/**", async (route) => {
  const fs = await import("node:fs");
  const body = fs.readFileSync("/tmp/etsi/react-grab.js");
  await route.fulfill({ status: 200, contentType: "text/javascript", body });
});

await page.setContent(`<!doctype html><html><body><iframe id="f" style="width:1200px;height:900px"></iframe></body></html>`);
const frame = page.frames()[0];
frame.on("pageerror", (err) => errors.push({ where: "iframe", message: err.message, stack: err.stack }));
frame.on("console", (msg) => logs.push({ where: "iframe", type: msg.type(), text: msg.text().slice(0, 150) }));

await page.evaluate(() => {
  const f = document.getElementById("f");
  f.src = "https://z7vh958d7ib50hfe3ltkr-web-etsipro.rork.live/";
});
await page.waitForTimeout(12000);

console.log("=== IFRAME CONSOLE ===");
for (const l of logs.filter((x) => x.where === "iframe")) {
  console.log(`[${l.type}]`, l.text);
}

console.log("\n=== ERRORS ===");
if (!errors.length) console.log("(none)");
for (const e of errors) {
  console.log("WHERE:", e.where, "|", e.message);
}

// simulate grab mode: move mouse over elements to trigger scanning
try {
  await frame.hover("h1").catch(() => {});
  await frame.hover("a").catch(() => {});
  await page.mouse.move(300, 300);
  await page.waitForTimeout(4000);
} catch {}

console.log("\n=== AFTER HOVER ===");
for (const e of errors) console.log(e.where, "|", e.message);
await browser.close();
