import { chromium } from "playwright-core";
import { createServer } from "node:http";
import { readFileSync } from "node:fs";

// serve react-grab locally
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
page.on("console", (msg) => logs.push({ type: msg.type(), text: msg.text().slice(0, 160) }));

// inject react-grab into the page directly (simulates preview injection)
await page.addInitScript(() => {
  try {
    const s = document.createElement("script");
    s.src = "http://localhost:5202/react-grab.js";
    document.head.appendChild(s);
  } catch {}
});

// dev server: readable component names in any crash
await page.goto("http://localhost:5199/", { waitUntil: "load", timeout: 20000 }).catch(() => {});
await page.waitForTimeout(6000);

console.log("=== CONSOLE ===");
for (const l of logs.slice(0, 50)) console.log(`[${l.type}]`, l.text);
console.log("grab banner:", logs.some((l) => l.text.includes("React Grab")));

console.log("\n=== ERRORS ===");
if (!errors.length) console.log("(none)");
for (const e of errors) {
  console.log("MSG:", e.message);
  console.log((e.stack || "").slice(0, 900));
  console.log("---");
}

// simulate grab mode: hold Alt and move around
try {
  await page.keyboard.down("Alt");
  await page.mouse.move(200, 150);
  await page.mouse.move(500, 300);
  await page.mouse.move(800, 500);
  await page.keyboard.up("Alt");
  await page.waitForTimeout(4000);
} catch {}

console.log("\n=== AFTER GRAB ===");
for (const e of errors) console.log("MSG:", e.message);

await browser.close();
