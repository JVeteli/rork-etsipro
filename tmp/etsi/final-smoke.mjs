import { chromium } from "playwright-core";

const BASE = "https://z7vh958d7ib50hfe3ltkr-web-etsipro.rork.live/";
const browser = await chromium.launch({
  executablePath: "/home/user/.cache/ms-playwright/chromium_headless_shell-1223/chrome-headless-shell-linux64/chrome-headless-shell",
});
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
const errors = [];
page.on("pageerror", (err) => errors.push(err.message));

await page.setContent(
  `<html><body><iframe id="app" style="width:1280px;height:900px;border:0" src="${BASE}"></iframe></body></html>`,
  { waitUntil: "domcontentloaded" },
);
const frame = page.frames().find((f) => f !== page.mainFrame());
frame?.on("pageerror", (err) => errors.push(err.message));
await page.waitForTimeout(8000);

console.log("grab loaded:", await frame.evaluate(() => !!window.__REACT_GRAB__).catch(() => false));
console.log("app mounted:", await frame.evaluate(() => (document.getElementById("root")?.children.length ?? 0) > 0).catch(() => false));

const links = await frame.evaluate(() =>
  [...new Set([...document.querySelectorAll("a[href]")].map((a) => a.getAttribute("href")).filter((h) => h && h.startsWith("/") && !h.startsWith("//")))],
);
for (const href of links.slice(0, 6)) {
  await frame.evaluate((h) => {
    const a = [...document.querySelectorAll("a[href]")].find((x) => x.getAttribute("href") === h);
    if (a) a.click();
  }, href).catch(() => {});
  await page.waitForTimeout(1500);
}

// one grab activation cycle
await page.evaluate(() => document.querySelector("iframe#app")?.contentWindow?.postMessage({ type: "rork-web-preview-selection-request", enabled: true }, "*"));
await page.waitForTimeout(1500);
await page.mouse.move(500, 300, { steps: 3 });
await page.mouse.down();
await page.mouse.up();
await page.waitForTimeout(2000);
await page.evaluate(() => document.querySelector("iframe#app")?.contentWindow?.postMessage({ type: "rork-web-preview-selection-request", enabled: false }, "*"));
await page.waitForTimeout(2000);

console.log("page errors:", errors.length);
for (const e of errors) console.log(" -", e);
await browser.close();
process.exit(0);
