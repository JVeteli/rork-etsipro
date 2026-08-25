import { chromium } from "playwright-core";

const browser = await chromium.launch({
  executablePath: "/home/user/.cache/ms-playwright/chromium_headless_shell-1223/chrome-headless-shell-linux64/chrome-headless-shell",
});
const page = await browser.newPage();
const errors = [];
const logs = [];
page.on("pageerror", (err) => errors.push({ where: "main", message: err.message, stack: err.stack }));
page.on("console", (msg) => logs.push({ where: "main", type: msg.type(), text: msg.text().slice(0, 120) }));

// serve react-grab locally with CORS so crossOrigin="anonymous" passes
await page.route("https://unpkg.com/**", async (route) => {
  const fs = await import("node:fs");
  const body = fs.readFileSync("/tmp/etsi/react-grab.js");
  await route.fulfill({
    status: 200,
    contentType: "text/javascript",
    headers: { "Access-Control-Allow-Origin": "*" },
    body,
  });
});

await page.setContent(`<!doctype html><html><body><iframe id="f" style="width:1200px;height:900px"></iframe></body></html>`);
await page.evaluate(() => {
  const f = document.getElementById("f");
  f.src = "https://z7vh958d7ib50hfe3ltkr-web-etsipro.rork.live/";
});

// wait for iframe to load and attach listeners
for (let i = 0; i < 30; i++) {
  const frames = page.frames().filter((fr) => fr.url().includes("rork.live"));
  if (frames.length) break;
  await page.waitForTimeout(500);
}
const iframe = page.frames().find((fr) => fr.url().includes("rork.live"));
if (iframe) {
  iframe.on("pageerror", (err) => errors.push({ where: "iframe", message: err.message, stack: err.stack }));
  iframe.on("console", (msg) => logs.push({ where: "iframe", type: msg.type(), text: msg.text().slice(0, 120) }));
}

await page.waitForTimeout(10000);

console.log("=== IFRAME CONSOLE ===");
for (const l of logs.filter((x) => x.where === "iframe").slice(0, 50)) console.log(`[${l.type}]`, l.text);
console.log("grab banner:", logs.some((l) => l.where === "iframe" && l.text.includes("React Grab")));

console.log("\n=== ERRORS ===");
if (!errors.length) console.log("(none)");
for (const e of errors) {
  console.log("WHERE:", e.where, "|", e.message);
  if (e.where === "iframe") console.log((e.stack || "").slice(0, 800));
  console.log("---");
}

// hover to trigger grab freeze
if (iframe) {
  try {
    await iframe.keyboard.down("Alt");
    await iframe.mouse.move(300, 200, { steps: 3 });
    await iframe.mouse.move(600, 450, { steps: 3 });
    await iframe.keyboard.up("Alt");
    await page.waitForTimeout(4000);
  } catch {}
}
console.log("\n=== AFTER HOVER ===");
for (const e of errors) console.log(e.where, "|", e.message);

await browser.close();
