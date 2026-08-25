import { chromium } from "playwright-core";

const browser = await chromium.launch({
  executablePath: "/home/user/.cache/ms-playwright/chromium_headless_shell-1223/chrome-headless-shell-linux64/chrome-headless-shell",
});
const page = await browser.newPage();
const logs = [];
page.on("console", (msg) => {
  const t = msg.text();
  if (!t.includes("Download the React DevTools")) logs.push(`[${msg.type()}] ${t.slice(0, 160)}`);
});
page.on("pageerror", (err) => logs.push(`[pageerror] ${err.message}`));

await page.goto("http://localhost:8080/", { waitUntil: "domcontentloaded", timeout: 30000 }).catch((e) => logs.push("[goto] " + e.message));
await page.waitForTimeout(4000);

const result = await page.evaluate(() => {
  const out = {};
  const hook = window.__REACT_DEVTOOLS_GLOBAL_HOOK__;
  out.hookExists = !!hook;
  out.hookProps = hook ? Object.keys(hook) : [];
  out.hookIsDisabled = hook ? hook.isDisabled : null;
  out.hookSupportsFiber = hook ? hook.supportsFiber : null;
  out.hookHasInject = !!(hook && typeof hook.inject === "function");
  out.renderersSize = hook && hook.renderers ? hook.renderers.size : -1;

  out.rootChildren = document.getElementById("root") ? document.getElementById("root").children.length : -1;

  if (hook && hook.renderers && hook.renderers.size) {
    const renderer = [...hook.renderers.values()][0];
    const ref = renderer ? renderer.currentDispatcherRef : null;
    out.refKeys = ref ? Object.keys(ref) : null;
    out.hasH = !!(ref && "H" in ref);
    out.HType = ref && "H" in ref ? typeof ref.H : null;
    if (ref && "H" in ref && typeof ref.H === "object") {
      out.dispKeys = Object.keys(ref.H).slice(0, 25);
      out.useEffectIsFunction = typeof ref.H.useEffect === "function";
      out.hasUseLayoutEffect = typeof ref.H.useLayoutEffect === "function";
      out.hasUseInsertionEffect = typeof ref.H.useInsertionEffect === "function";
    }
  }
  return out;
});
console.log(JSON.stringify(result, null, 2));
for (const l of logs.slice(0, 25)) console.log(l);

await browser.close();
process.exit(0);
