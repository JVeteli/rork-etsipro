import { chromium } from "playwright-core";

const browser = await chromium.launch({
  executablePath: "/home/user/.cache/ms-playwright/chromium_headless_shell-1223/chrome-headless-shell-linux64/chrome-headless-shell",
});
const page = await browser.newPage();

const errors = [];
const logs = [];
page.on("pageerror", (err) => errors.push({ where: "parent", message: err.message, stack: err.stack }));
page.on("console", (msg) => logs.push({ where: "parent", type: msg.type(), text: msg.text().slice(0, 100) }));

await page.route("https://unpkg.com/**", async (route) => {
  const fs = await import("node:fs");
  const body = fs.readFileSync("/tmp/etsi/react-grab.js");
  await route.fulfill({ status: 200, contentType: "text/javascript", body });
});

await page.setContent(`<!doctype html><html><body><iframe id="f" style="width:1200px;height:900px"></iframe></body></html>`);

await page.evaluate(() => {
  const f = document.getElementById("f");
  f.src = "https://z7vh958d7ib50hfe3ltkr-web-etsipro.rork.live/";
});

// wait for the iframe to actually load and grab the real frame reference
await page.waitForTimeout(4000);
const frames = page.frames().filter((fr) => fr.url().includes("rork.live"));
console.log("found iframe frames:", frames.length);
const frame = frames[0];
if (frame) {
  frame.on("pageerror", (err) => errors.push({ where: "iframe", message: err.message, stack: err.stack }));
  frame.on("console", (msg) => logs.push({ where: "iframe", type: msg.type(), text: msg.text().slice(0, 100) }));
}

await page.waitForTimeout(10000);

console.log("=== IFRAME CONSOLE ===");
for (const l of logs.filter((x) => x.where === "iframe").slice(0, 30)) {
  console.log(`[${l.type}]`, l.text);
}
console.log("react-grab loaded:", logs.some((l) => l.where === "iframe" && l.text.includes("React Grab")));

console.log("\n=== ERRORS ===");
if (!errors.length) console.log("(none)");
for (const e of errors) {
  console.log("WHERE:", e.where, "|", e.message);
  if (e.where === "iframe") console.log((e.stack || "").slice(0, 900));
  console.log("---");
}

if (frame) {
  try {
    await frame.keyboard.down("Alt");
    await frame.mouse.move(300, 200);
    await frame.mouse.move(600, 400);
    await frame.mouse.move(900, 600);
    await frame.keyboard.up("Alt");
    await page.waitForTimeout(5000);
  } catch {}
}

console.log("\n=== AFTER GRAB MODE ===");
for (const e of errors) console.log(e.where, "|", e.message);

await browser.close();
