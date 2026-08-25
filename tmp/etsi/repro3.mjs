import { chromium } from "playwright-core";

const browser = await chromium.launch({
  executablePath: "/home/user/.cache/ms-playwright/chromium_headless_shell-1223/chrome-headless-shell-linux64/chrome-headless-shell",
});
const page = await browser.newPage();

const errors = [];
page.on("pageerror", (err) => errors.push({ where: "parent", message: err.message, stack: err.stack }));
const logs = [];
page.on("console", (msg) => logs.push({ where: "parent", type: msg.type(), text: msg.text().slice(0, 120) }));

// serve react-grab locally for any unpkg request (applies to all frames)
await page.route("https://unpkg.com/**", async (route) => {
  const fs = await import("node:fs");
  const body = fs.readFileSync("/tmp/etsi/react-grab.js");
  await route.fulfill({ status: 200, contentType: "text/javascript", body });
});

// inject the same script the Rork preview adds, into every frame
await page.addInitScript(() => {
  if (window.parent === window) return;
  const script = document.createElement("script");
  script.src = "https://unpkg.com/react-grab@0.1.47/dist/index.global.js";
  script.crossOrigin = "anonymous";
  script.integrity = "sha384-B0lR/bXC7vo8u59GPfSiTzwDpp8r6xQjwX2bQBhnrW4CW3ExknUsIjhefAhRid5w";
  script.async = false;
  document.head.appendChild(script);
});

await page.setContent(`<!doctype html><html><body><iframe id="f" style="width:1200px;height:900px"></iframe></body></html>`);
const frame = page.frames()[0];
frame.on("pageerror", (err) => errors.push({ where: "iframe", message: err.message, stack: err.stack }));
frame.on("console", (msg) => logs.push({ where: "iframe", type: msg.type(), text: msg.text().slice(0, 120) }));

await page.evaluate(() => {
  const f = document.getElementById("f");
  f.src = "http://localhost:5198/";
});
await page.waitForTimeout(15000);

console.log("=== IFRAME CONSOLE (first 40) ===");
for (const l of logs.filter((x) => x.where === "iframe").slice(0, 40)) {
  console.log(`[${l.type}]`, l.text);
}

console.log("\n=== ERRORS ===");
if (!errors.length) console.log("(none)");
for (const e of errors) {
  console.log("WHERE:", e.where, "|", e.message);
  if (e.where === "iframe") console.log((e.stack || "").slice(0, 800));
}

// simulate hover + navigation
try {
  await frame.hover("h1", { timeout: 4000 }).catch(() => {});
  await frame.hover("a", { timeout: 4000 }).catch(() => {});
  await page.mouse.move(400, 400);
  await page.waitForTimeout(3000);
} catch {}
console.log("\n=== AFTER HOVER ===");
for (const e of errors) console.log(e.where, "|", e.message);

await browser.close();
