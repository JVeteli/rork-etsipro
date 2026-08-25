import { chromium } from "playwright-core";

const browser = await chromium.launch({
  executablePath: "/home/user/.cache/ms-playwright/chromium_headless_shell-1223/chrome-headless-shell-linux64/chrome-headless-shell",
});
const page = await browser.newPage();

const errors = [];
page.on("pageerror", (err) => errors.push({ where: "parent", message: err.message, stack: err.stack }));

await page.setContent(`<!doctype html><html><body><iframe id="f" style="width:1200px;height:900px"></iframe></body></html>`);
const frame = page.frames()[0];
frame.on("pageerror", (err) => errors.push({ where: "iframe", message: err.message, stack: err.stack }));

// inject the react-grab script exactly like the Rork preview does
await frame.addInitScript(() => {
  if (window.parent === window) return;
  const script = document.createElement("script");
  script.src = "https://unpkg.com/react-grab@0.1.47/dist/index.global.js";
  script.crossOrigin = "anonymous";
  document.head.appendChild(script);
});

await page.evaluate(() => {
  const f = document.getElementById("f");
  f.src = "https://z7vh958d7ib50hfe3ltkr-web-etsipro.rork.live/";
});
await page.waitForTimeout(9000);

console.log("=== ERRORS (deployed + react-grab injected) ===");
if (!errors.length) console.log("(none)");
for (const e of errors) {
  console.log("WHERE:", e.where);
  console.log("MESSAGE:", e.message);
  console.log((e.stack || "").slice(0, 1200));
  console.log("---");
}

// navigate to another route
await frame.goto("https://z7vh958d7ib50hfe3ltkr-web-etsipro.rork.live/selaa", { waitUntil: "networkidle", timeout: 30000 }).catch(() => {});
await page.waitForTimeout(3500);
console.log("\n=== AFTER /selaa ===");
for (const e of errors.slice()) {
  console.log("WHERE:", e.where, "|", e.message);
}
await browser.close();
