import { chromium } from "playwright-core";

const browser = await chromium.launch({
  executablePath: "/home/user/.cache/ms-playwright/chromium_headless_shell-1223/chrome-headless-shell-linux64/chrome-headless-shell",
});
const page = await browser.newPage();
const errors = [];
const warnings = [];
page.on("pageerror", (err) => errors.push({ message: err.message, stack: err.stack }));
page.on("console", (msg) => {
  const t = msg.text();
  if (msg.type() === "error" || msg.type() === "warning") {
    if (/effect|destroy|return/i.test(t)) warnings.push({ type: msg.type(), text: t.slice(0, 3000) });
  }
});

const BASE = "http://localhost:5199";

// login as Liisa (customer)
await page.goto(`${BASE}/kirjaudu`, { waitUntil: "networkidle" });
await page.waitForTimeout(600);
const liisaBtn = page.locator("button:has-text('Liisa')").first();
if (await liisaBtn.count()) {
  await liisaBtn.click();
  await page.waitForTimeout(1500);
}

// go to browse, open first service
await page.goto(`${BASE}/selaa`, { waitUntil: "networkidle" });
await page.waitForTimeout(800);
const links = await page.locator("a[href^='/palvelu/']").evaluateAll((els) => els.map((e) => e.getAttribute("href")));
if (links.length) {
  await page.goto(`${BASE}${links[0]}`, { waitUntil: "networkidle" });
  await page.waitForTimeout(1000);
  // open booking dialog
  const bookBtn = page.locator("button:has-text('Varaa')").first();
  if (await bookBtn.count()) {
    await bookBtn.click();
    await page.waitForTimeout(800);
    // channel step -> continue
    const cont = page.locator("button:has-text('Jatka maksamaan'), button:has-text('Lähetä varauspyyntö')").first();
    if (await cont.count()) {
      await cont.click();
      await page.waitForTimeout(600);
      // if pay step, fill card
      const num = page.locator("#card-number");
      if (await num.count()) {
        await page.locator("#card-name").fill("Liisa Niemi");
        await num.fill("4242 4242 4242 4242");
        await page.locator("#card-exp").fill("12/28");
        await page.locator("#card-cvc").fill("123");
        const pay = page.locator("button:has-text('Maksa')").first();
        await pay.click();
        await page.waitForTimeout(2500);
      }
      // done -> open thread
      const openThread = page.locator("button:has-text('Avaa viestiketju')").first();
      if (await openThread.count()) {
        await openThread.click();
        await page.waitForTimeout(2000);
      }
    }
  }
}

// messages page directly
await page.goto(`${BASE}/viestit`, { waitUntil: "networkidle" });
await page.waitForTimeout(1500);

console.log("=== EFFECT-RELATED WARNINGS/ERRORS ===");
if (!warnings.length) console.log("(none)");
for (const w of warnings) {
  console.log(`[${w.type}]`, w.text);
  console.log("---");
}
console.log("\n=== PAGE ERRORS ===");
if (!errors.length) console.log("(none)");
for (const e of errors) {
  console.log(e.message);
  console.log((e.stack || "").slice(0, 1200));
  console.log("---");
}
await browser.close();
