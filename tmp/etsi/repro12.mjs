import { chromium } from "playwright-core";
import { createServer } from "node:http";
import { readFileSync } from "node:fs";

const grab = readFileSync("/tmp/etsi/react-grab.js");
const html = readFileSync("/tmp/etsi/deployed.html", "utf8");
const BASE = "https://z7vh958d7ib50hfe3ltkr-web-etsipro.rork.live";

// 1) Replace the react-grab loader (which refuses to load at top level) with a direct script tag
const rewritten = html
  .replace(
    /<script>\(function\(\)\{\s*if \(window\.parent === window\) return;\s*var script = document\.createElement\("script"\);\s*script\.src = "https:\/\/unpkg\.com\/react-grab@0\.1\.47\/dist\/index\.global\.js";[\s\S]*?\}\)\(\)<\/script>/,
    '<script src="/react-grab.js"></script>',
  )
  .replace(/integrity="sha384-[^"]*"/g, "")
  .replace(/src="\/assets\//g, 'src="/p/assets/')
  .replace(/href="\/assets\//g, 'href="/p/assets/')
  .replace(/href="\/favicon\.png"/g, 'href="/p/favicon.png"')
  .replace(/href="\/icon\.png"/g, 'href="/p/icon.png"');

createServer(async (req, res) => {
  try {
    if (req.url === "/react-grab.js") {
      res.writeHead(200, { "Content-Type": "text/javascript; charset=utf-8" });
      return res.end(grab);
    }
    if (req.url === "/" || req.url.startsWith("/?")) {
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      return res.end(rewritten);
    }
    if (req.url.startsWith("/p/")) {
      const target = BASE + req.url.slice(2);
      const upstream = await fetch(target);
      if (!upstream.ok) {
        res.writeHead(upstream.status);
        return res.end();
      }
      const buf = Buffer.from(await upstream.arrayBuffer());
      const ct = upstream.headers.get("content-type") || "application/octet-stream";
      res.writeHead(200, { "Content-Type": ct });
      return res.end(buf);
    }
    res.writeHead(404);
    res.end("nope");
  } catch (e) {
    res.writeHead(500);
    res.end(String(e));
  }
}).listen(5205);

const browser = await chromium.launch({
  executablePath: "/home/user/.cache/ms-playwright/chromium_headless_shell-1223/chrome-headless-shell-linux64/chrome-headless-shell",
});
const page = await browser.newPage();
const errors = [];
const logs = [];
page.on("pageerror", (err) => {
  errors.push({ phase: currentPhase, message: err.message, stack: (err.stack || "").slice(0, 1200) });
  console.log("PAGEERROR", err.message);
});
page.on("console", (msg) => {
  const text = msg.text().slice(0, 200);
  if (msg.type() === "error" || msg.type() === "warning") logs.push({ type: msg.type(), text });
});
page.on("requestfailed", (req) => {
  const u = req.url();
  if (!u.includes("__logs") && !u.includes("api.rork.com")) console.log("REQFAIL", u.slice(0, 120));
});

let currentPhase = "load";

await page.goto("http://localhost:5205/", { waitUntil: "domcontentloaded", timeout: 30000 }).catch((e) => console.log("goto err", e.message));
await page.waitForTimeout(9000);

const grabInfo = await page.evaluate(() => ({
  hasGrab: !!window.__REACT_GRAB__,
  keys: window.__REACT_GRAB__ ? Object.keys(window.__REACT_GRAB__) : [],
  rootChildren: document.getElementById("root")?.children.length ?? -1,
  url: location.href,
}));
console.log("GRAB INFO:", JSON.stringify(grabInfo));

// ---- Phase A: navigate around (unmounts) ----
currentPhase = "navigation";
const links = await page.evaluate(() =>
  [...document.querySelectorAll("a[href]")]
    .map((a) => a.getAttribute("href"))
    .filter((h) => h && h.startsWith("/") && !h.startsWith("//"))
    .filter((h, i, arr) => arr.indexOf(h) === i),
);
console.log("LINKS:", JSON.stringify(links));

for (const href of links.slice(0, 10)) {
  try {
    await page.evaluate((h) => {
      const a = [...document.querySelectorAll("a[href]")].find((x) => x.getAttribute("href") === h);
      if (a) a.click();
    }, href);
    await page.waitForTimeout(2500);
  } catch {}
}
await page.evaluate(() => history.pushState(null, "", "/"));
await page.waitForTimeout(2500);

// ---- Phase B: grab mode via Alt+hover ----
currentPhase = "grab-hover";
try {
  await page.keyboard.down("Alt");
  await page.mouse.move(300, 200, { steps: 4 });
  await page.waitForTimeout(600);
  await page.mouse.move(620, 460, { steps: 4 });
  await page.waitForTimeout(600);
  await page.mouse.down();
  await page.mouse.up();
  await page.waitForTimeout(4000);
  await page.keyboard.up("Alt");
  await page.waitForTimeout(3000);
} catch (e) {
  console.log("grab hover err", e.message);
}

// ---- Phase C: drive the grab API directly ----
currentPhase = "grab-api";
const apiResult = await page.evaluate(async () => {
  const out = [];
  const api = window.__REACT_GRAB__;
  if (!api) return "no api";
  try {
    api.activate?.();
    out.push("activated");
  } catch (e) {
    out.push("activate threw: " + e.message);
  }
  await new Promise((r) => setTimeout(r, 800));
  const el = document.querySelector("main a, main button, a, button, h1");
  if (el && api.getSource) {
    try {
      const src = await api.getSource(el);
      out.push("getSource ok: " + JSON.stringify(src).slice(0, 200));
    } catch (e) {
      out.push("getSource threw: " + e.message);
    }
  }
  if (el && api.getStackContext) {
    try {
      const ctx = await api.getStackContext(el);
      out.push("getStackContext ok: " + String(ctx).slice(0, 200));
    } catch (e) {
      out.push("getStackContext threw: " + e.message);
    }
  }
  try {
    api.deactivate?.();
    out.push("deactivated");
  } catch (e) {
    out.push("deactivate threw: " + e.message);
  }
  return out;
});
console.log("API:", JSON.stringify(apiResult));

await page.waitForTimeout(3000);

console.log("\n=== CONSOLE errors/warnings ===");
for (const l of logs.slice(0, 40)) console.log(`[${l.type}]`, l.text);

console.log("\n=== PAGE ERRORS (" + errors.length + ") ===");
for (const e of errors) {
  console.log("PHASE:", e.phase, "|", e.message);
  console.log(e.stack);
  console.log("---");
}

await browser.close();
process.exit(0);
