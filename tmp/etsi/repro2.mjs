import { chromium } from "playwright-core";

const browser = await chromium.launch({
  executablePath: "/home/user/.cache/ms-playwright/chromium_headless_shell-1223/chrome-headless-shell-linux64/chrome-headless-shell",
});
const page = await browser.newPage();

const errors = [];
page.on("pageerror", (err) => {
  errors.push({ message: err.message, stack: err.stack });
});
page.on("console", (msg) => {
  if (msg.type() === "error") {
    console.log("[console.error]", msg.text().slice(0, 2000));
  }
});

await page.goto("http://localhost:5198/", { waitUntil: "networkidle" });
await page.waitForTimeout(2500);

console.log("\n=== PAGE ERRORS ===");
for (const e of errors) {
  console.log("MESSAGE:", e.message);
  console.log(e.stack);
  console.log("---");
}
await browser.close();
