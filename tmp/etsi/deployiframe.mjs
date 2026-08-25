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

await page.evaluate(() => {
  const f = document.getElementById("f");
  f.src = "https://z7vh958d7ib50hfe3ltkr-web-etsipro.rork.live/";
});
await page.waitForTimeout(8000);

console.log("=== ERRORS (deployed app inside iframe) ===");
if (!errors.length) console.log("(none)");
for (const e of errors) {
  console.log("WHERE:", e.where);
  console.log("MESSAGE:", e.message);
  console.log((e.stack || "").slice(0, 1500));
  console.log("---");
}

// try navigating to other routes inside the iframe
for (const r of ["/selaa", "/liity", "/kirjaudu"]) {
  await frame.goto(`https://z7vh958d7ib50hfe3ltkr-web-etsipro.rork.live${r}`, { waitUntil: "networkidle", timeout: 30000 }).catch(() => {});
  await page.waitForTimeout(2500);
}
console.log("\n=== AFTER ROUTE NAVIGATION ===");
for (const e of errors.slice(errors.length ? errors.length : 0)) {
  console.log("WHERE:", e.where);
  console.log("MESSAGE:", e.message);
}
await browser.close();
