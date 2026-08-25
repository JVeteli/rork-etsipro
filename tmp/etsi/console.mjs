import { chromium } from "playwright-core";

const browser = await chromium.launch({
  executablePath: "/home/user/.cache/ms-playwright/chromium_headless_shell-1223/chrome-headless-shell-linux64/chrome-headless-shell",
});
const page = await browser.newPage();

const errors = [];
page.on("pageerror", (err) => errors.push({ where: "parent", message: err.message, stack: err.stack }));
const logs = [];
page.on("console", (msg) => logs.push({ where: "parent", type: msg.type(), text: msg.text().slice(0, 200) }));

await page.setContent(`<!doctype html><html><body><iframe id="f" style="width:1200px;height:900px"></iframe></body></html>`);
const frame = page.frames()[0];
frame.on("pageerror", (err) => errors.push({ where: "iframe", message: err.message, stack: err.stack }));
frame.on("console", (msg) => logs.push({ where: "iframe", type: msg.type(), text: msg.text().slice(0, 200) }));

await page.evaluate(() => {
  const f = document.getElementById("f");
  f.src = "https://z7vh958d7ib50hfe3ltkr-web-etsipro.rork.live/";
});
await page.waitForTimeout(10000);

console.log("=== CONSOLE (iframe) ===");
for (const l of logs.filter((x) => x.where === "iframe")) {
  console.log(`[${l.type}]`, l.text);
}
console.log("\n=== ERRORS ===");
if (!errors.length) console.log("(none)");
for (const e of errors) {
  console.log("WHERE:", e.where, "|", e.message);
}
await browser.close();
