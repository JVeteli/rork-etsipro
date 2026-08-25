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

page.on("pageerror", (err) => errors.push({ message: err.message, stack: err.stack }));

// inject react-grab ONLY inside the iframe (dev server page has no injection script)
await page.addInitScript(() => {
  try {
    if (window.self === window.top) return;
    const s = document.createElement("script");
    s.src = "http://localhost:5202/react-grab.js";
    document.head.appendChild(s);
  } catch {}
});

const framePromise = page.waitForEvent("frameattached");
await page.setContent(`<!doctype html><html><body><iframe id="f" style="width:1200px;height:900px"></iframe></body></html>`);

const frame = await framePromise;
frame.on("pageerror", (err) => errors.push({ message: err.message, stack: err.stack }));
frame.on("console", (msg) => logs.push({ type: msg.type(), text: msg.text().slice(0, 200) }));

await page.evaluate(() => {
  const f = document.getElementById("f");
  f.src = "http://localhost:5199/";
});
await page.waitForTimeout(10000);

console.log("=== CONSOLE (first 40) ===");
for (const l of logs.slice(0, 40)) console.log(`[${l.type}]`, l.text);
console.log("grab banner:", logs.some((l) => l.text.includes("React Grab")));

console.log("\n=== ERRORS ===");
if (!errors.length) console.log("(none)");
for (const e of errors) {
  console.log("MSG:", e.message);
  console.log((e.stack || "").slice(0, 800));
  console.log("---");
}

// interact: hover with Alt held (grab mode), navigate around
try {
  await frame.keyboard.down("Alt");
  await frame.mouse.move(300, 200);
  await frame.mouse.move(600, 400);
  await frame.mouse.move(900, 600);
  await frame.keyboard.up("Alt");
  await page.waitForTimeout(3000);

  await frame.goto("http://localhost:5199/selaa", { waitUntil: "networkidle", timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(3000);
} catch {}

console.log("\n=== AFTER INTERACTIONS ===");
for (const e of errors) {
  console.log("MSG:", e.message);
  console.log((e.stack || "").slice(0, 800));
  console.log("---");
}
await browser.close();
