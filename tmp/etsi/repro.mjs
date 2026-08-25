import { chromium } from "playwright-core";

const browser = await chromium.launch({ executablePath: "/home/user/.cache/ms-playwright/chromium_headless_shell-1223/chrome-headless-shell-linux64/chrome-headless-shell" });
const page = await browser.newPage();

const errors = [];
page.on("pageerror", (err) => {
  errors.push({ message: err.message, stack: err.stack });
});
page.on("console", (msg) => {
  if (msg.type() === "error" || msg.type() === "warning") {
    console.log(`[${msg.type()}]`, msg.text().slice(0, 500));
  }
});

await page.goto("http://localhost:5199/", { waitUntil: "networkidle" });
await page.waitForTimeout(3000);

console.log("\n=== PAGE ERRORS ===");
for (const e of errors) {
  console.log("MESSAGE:", e.message);
  console.log("STACK:");
  console.log(e.stack);
  console.log("---");
}
await browser.close();
