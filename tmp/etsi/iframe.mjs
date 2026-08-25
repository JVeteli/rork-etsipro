import { chromium } from "playwright-core";

const browser = await chromium.launch({
  executablePath: "/home/user/.cache/ms-playwright/chromium_headless_shell-1223/chrome-headless-shell-linux64/chrome-headless-shell",
});
const page = await browser.newPage();

const errors = [];
page.on("pageerror", (err) => errors.push({ where: "parent", message: err.message, stack: err.stack }));

// host page with iframe
await page.setContent(`<!doctype html><html><body><iframe id="f" style="width:1200px;height:900px"></iframe></body></html>`);

const frame = page.frames()[0];
frame.on("pageerror", (err) => errors.push({ where: "iframe", message: err.message, stack: err.stack }));

await page.evaluate(() => {
  const f = document.getElementById("f");
  f.src = "http://localhost:5198/";
});
await page.waitForTimeout(6000);

console.log("=== ERRORS (iframe context) ===");
if (!errors.length) console.log("(none)");
for (const e of errors) {
  console.log("WHERE:", e.where);
  console.log("MESSAGE:", e.message);
  console.log(e.stack);
  console.log("---");
}
await browser.close();
