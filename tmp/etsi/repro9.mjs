import { chromium } from "playwright-core";
import { createServer } from "node:http";
import { readFileSync } from "node:fs";

const grab = readFileSync("/tmp/etsi/react-grab.js");
const html = readFileSync("/tmp/etsi/deployed.html", "utf8");
// point the injected react-grab script at our local copy (keeps integrity intact? no – remove integrity)
const rewritten = html
  .replace("https://unpkg.com/react-grab@0.1.47/dist/index.global.js", "/react-grab.js")
  .replace(/integrity="sha384-[^"]*"/, "");

const server = createServer((req, res) => {
  if (req.url === "/react-grab.js") {
    res.writeHead(200, { "Content-Type": "text/javascript; charset=utf-8" });
    return res.end(grab);
  }
  res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
  res.end(rewritten);
}).listen(5203);

const browser = await chromium.launch({
  executablePath: "/home/user/.cache/ms-playwright/chromium_headless_shell-1223/chrome-headless-shell-linux64/chrome-headless-shell",
});
const page = await browser.newPage();
const errors = [];
const logs = [];
page.on("pageerror", (err) => errors.push({ message: err.message, stack: err.stack }));
page.on("console", (msg) => logs.push({ type: msg.type(), text: msg.text().slice(0, 140) }));

// route the app's own assets to the real deployed site
await page.route("https://z7vh958d7ib50hfe3ltkr-web-etsipro.rork.live/**", (route) => route.continue());

await page.goto("http://localhost:5203/", { waitUntil: "domcontentloaded", timeout: 15000 }).catch(() => {});
await page.waitForTimeout(8000);

console.log("=== CONSOLE ===");
for (const l of logs.slice(0, 60)) console.log(`[${l.type}]`, l.text);
console.log("grab banner:", logs.some((l) => l.text.includes("React Grab")));

console.log("\n=== ERRORS ===");
if (!errors.length) console.log("(none)");
for (const e of errors) {
  console.log("MSG:", e.message);
  console.log((e.stack || "").slice(0, 700));
  console.log("---");
}

// hover around to trigger grab-mode freeze
try {
  await page.keyboard.down("Alt");
  await page.mouse.move(250, 200, { steps: 4 });
  await page.mouse.move(600, 450, { steps: 4 });
  await page.mouse.move(900, 650, { steps: 4 });
  await page.keyboard.up("Alt");
  await page.waitForTimeout(4000);
} catch {}

console.log("\n=== AFTER HOVER ===");
for (const e of errors) console.log("MSG:", e.message);

await browser.close();
server.close();
