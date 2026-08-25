import { chromium } from "playwright-core";

const browser = await chromium.launch({
  executablePath: "/home/user/.cache/ms-playwright/chromium_headless_shell-1223/chrome-headless-shell-linux64/chrome-headless-shell",
});
const page = await browser.newPage();

const errors = [];
page.on("pageerror", (err) => errors.push({ where: "parent", message: err.message, stack: err.stack }));

// Serve the downloaded react-grab locally by routing unpkg requests to localhost file
await page.route("https://unpkg.com/**", async (route) => {
  const fs = await import("node:fs");
  const body = fs.readFileSync("/tmp/etsi/react-grab.js");
  await route.fulfill({ status: 200, contentType: "text/javascript", body });
});

await page.setContent(`<!doctype html><html><body><iframe id="f" style="width:1200px;height:900px"></iframe></body></html>`);
const frame = page.frames()[0];
frame.on("pageerror", (err) => errors.push({ where: "iframe", message: err.message, stack: err.stack }));

// The deployed HTML injects react-grab itself when inside an iframe.
await page.evaluate(() => {
  const f = document.getElementById("f");
  f.src = "https://z7vh958d7ib50hfe3ltkr-web-etsipro.rork.live/";
});
await page.waitForTimeout(10000);

console.log("=== ERRORS (deployed + react-grab actually loaded) ===");
if (!errors.length) console.log("(none)");
for (const e of errors) {
  console.log("WHERE:", e.where);
  console.log("MESSAGE:", e.message);
  console.log((e.stack || "").slice(0, 1000));
  console.log("---");
}

// navigate inside iframe
await frame.goto("https://z7vh958d7ib50hfe3ltkr-web-etsipro.rork.live/selaa", { waitUntil: "networkidle", timeout: 30000 }).catch(() => {});
await page.waitForTimeout(5000);
console.log("\n=== AFTER /selaa ===");
for (const e of errors) console.log(e.where, "|", e.message);
await browser.close();
