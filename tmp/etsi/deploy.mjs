import { chromium } from "playwright-core";

const browser = await chromium.launch({
  executablePath: "/home/user/.cache/ms-playwright/chromium_headless_shell-1223/chrome-headless-shell-linux64/chrome-headless-shell",
});
const page = await browser.newPage();

const errors = [];
page.on("pageerror", (err) => {
  errors.push({ url: page.url(), message: err.message, stack: err.stack });
});

// fresh profile → mimic first visit
await page.goto("https://z7vh958d7ib50hfe3ltkr-web-etsipro.rork.live/", {
  waitUntil: "networkidle",
  timeout: 30000,
}).catch(() => {});
await page.waitForTimeout(3000);

console.log("=== PAGE ERRORS (fresh) ===");
if (!errors.length) console.log("(none)");
for (const e of errors) {
  console.log("URL:", e.url);
  console.log("MESSAGE:", e.message);
  console.log(e.stack);
  console.log("---");
}

// second: seed a session like a returning user and reload
await page.evaluate(() => {
  localStorage.setItem("etsipro_session_v1", "u-liisa");
});
await page.goto("https://z7vh958d7ib50hfe3ltkr-web-etsipro.rork.live/", {
  waitUntil: "networkidle",
  timeout: 30000,
}).catch(() => {});
await page.waitForTimeout(3000);

console.log("\n=== PAGE ERRORS (with session) ===");
if (!errors.length) console.log("(none)");
for (const e of errors) {
  console.log("URL:", e.url);
  console.log("MESSAGE:", e.message);
  console.log(e.stack);
  console.log("---");
}
await browser.close();
