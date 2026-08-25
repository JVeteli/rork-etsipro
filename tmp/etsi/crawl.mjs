import { chromium } from "playwright-core";

const browser = await chromium.launch({
  executablePath: "/home/user/.cache/ms-playwright/chromium_headless_shell-1223/chrome-headless-shell-linux64/chrome-headless-shell",
});
const page = await browser.newPage();

const errors = [];
page.on("pageerror", (err) => {
  errors.push({ url: page.url(), message: err.message, stack: err.stack });
});

const routes = ["/", "/selaa", "/liity", "/kirjaudu", "/viestit", "/ohjaamo"];
for (const r of routes) {
  await page.goto(`http://localhost:5198${r}`, { waitUntil: "networkidle" }).catch(() => {});
  await page.waitForTimeout(1200);
}

// service detail + booking dialog
await page.goto("http://localhost:5198/", { waitUntil: "networkidle" }).catch(() => {});
await page.waitForTimeout(800);
const links = await page.locator("a[href^='/palvelu/']").evaluateAll((els) => els.map((e) => e.getAttribute("href")));
if (links.length) {
  await page.goto(`http://localhost:5198${links[0]}`, { waitUntil: "networkidle" }).catch(() => {});
  await page.waitForTimeout(800);
  const bookBtn = page.locator("button:has-text('Varaa')").first();
  if (await bookBtn.count()) {
    await bookBtn.click().catch(() => {});
    await page.waitForTimeout(800);
  }
  const loginBtn = page.locator("a:has-text('Kirjaudu')").first();
  if (await loginBtn.count()) {
    await loginBtn.click().catch(() => {});
    await page.waitForTimeout(1500);
  }
}

// provider profile
const provLinks = await page.locator("a[href^='/tarjoaja/']").evaluateAll((els) => els.map((e) => e.getAttribute("href")));
if (provLinks.length) {
  await page.goto(`http://localhost:5198${provLinks[0]}`, { waitUntil: "networkidle" }).catch(() => {});
  await page.waitForTimeout(1000);
}

console.log("=== PAGE ERRORS ===");
if (!errors.length) console.log("(none)");
for (const e of errors) {
  console.log("URL:", e.url);
  console.log("MESSAGE:", e.message);
  console.log(e.stack);
  console.log("---");
}
await browser.close();
