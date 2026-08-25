import { chromium } from "playwright-core";

const BASE = "https://z7vh958d7ib50hfe3ltkr-web-etsipro.rork.live/";
const browser = await chromium.launch({
  executablePath: "/home/user/.cache/ms-playwright/chromium_headless_shell-1223/chrome-headless-shell-linux64/chrome-headless-shell",
});

async function runScenario(name, useIframe, phase, actions) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const errors = [];
  const iframeErrors = [];
  page.on("pageerror", (err) => errors.push({ phase: phase(), message: err.message, stack: (err.stack || "").slice(0, 1000) }));

  if (useIframe) {
    await page.setContent(`<html><body><iframe id="app" style="width:1280px;height:900px;border:0" src="${BASE}"></iframe></body></html>`, { waitUntil: "domcontentloaded" });
    const frame = page.frames().find((f) => f !== page.mainFrame());
    frame?.on("pageerror", (err) => iframeErrors.push({ phase: phase(), message: err.message, stack: (err.stack || "").slice(0, 1000) }));
  } else {
    await page.goto(BASE, { waitUntil: "domcontentloaded", timeout: 30000 }).catch(() => {});
  }
  const ctx = useIframe ? page.frames().find((f) => f !== page.mainFrame()) : page;
  await page.waitForTimeout(6000);

  const grabLoaded = useIframe ? await ctx.evaluate(() => !!window.__REACT_GRAB__).catch(() => false) : false;
  console.log(`[${name}] grab loaded: ${grabLoaded}`);

  try {
    await actions(ctx, page);
  } catch (e) {
    console.log(`[${name}] action error: ${e.message}`);
  }
  await page.waitForTimeout(2500);

  console.log(`[${name}] === ERRORS (${errors.length + iframeErrors.length}) ===`);
  for (const e of [...errors, ...iframeErrors]) {
    console.log(`  phase=${e.phase} | ${e.message}`);
    console.log((e.stack || "").split("\n").slice(0, 4).join("\n"));
  }
  await page.close();
}

// --- Test A: top-level (no react-grab) ---
await runScenario("A top-level", false, () => "A", async (ctx) => {
  const links = await ctx.evaluate(() =>
    [...document.querySelectorAll("a[href]")].map((a) => a.getAttribute("href")).filter((h) => h && h.startsWith("/") && !h.startsWith("//")),
  );
  const uniq = [...new Set(links)];
  console.log("[A] links:", uniq.join(","));
  for (const href of uniq.slice(0, 8)) {
    await ctx.evaluate((h) => {
      const a = [...document.querySelectorAll("a[href]")].find((x) => x.getAttribute("href") === h);
      if (a) a.click();
    }, href);
    await page.waitForTimeout(1800);
  }
  // open booking dialog on service detail
  await ctx.evaluate(() => {
    const btn = [...document.querySelectorAll("button")].find((b) => /varaa/i.test(b.textContent || ""));
    if (btn) btn.click();
  });
  await page.waitForTimeout(2000);
});

// --- Test B: iframe (react-grab loads), editor-like selection messages ---
await runScenario("B iframe+grab", true, () => "B", async (ctx, page) => {
  const send = (type, data) =>
    page.evaluate(({ type, data }) => {
      const f = document.querySelector("iframe#app");
      f?.contentWindow?.postMessage({ type, ...data }, "*");
    }, { type, data });

  // navigate a bit first
  await ctx.evaluate(() => {
    const a = [...document.querySelectorAll("a[href]")].find((x) => (x.getAttribute("href") || "").startsWith("/selaa"));
    if (a) a.click();
  });
  await page.waitForTimeout(2000);

  // editor activates selection
  await send("rork-web-preview-selection-request", { enabled: true });
  await page.waitForTimeout(1500);
  // hover + click an element while selection is active
  await page.mouse.move(400, 300, { steps: 3 });
  await page.waitForTimeout(500);
  await page.mouse.down();
  await page.mouse.up();
  await page.waitForTimeout(2500);
  await send("rork-web-preview-selection-request", { enabled: false });
  await page.waitForTimeout(1500);

  // navigate (unmount pages) with grab loaded
  for (const href of ["/selaa?cat=koti", "/palvelu/s-muutto", "/", "/liity"]) {
    await ctx.evaluate((h) => {
      const a = [...document.querySelectorAll("a[href]")].find((x) => x.getAttribute("href") === h);
      if (a) a.click();
      else window.history.pushState(null, "", h), window.dispatchEvent(new PopStateEvent("popstate"));
    }, href);
    await page.waitForTimeout(2000);
  }

  // activate selection again while on a service page, then open dialog during active selection
  await send("rork-web-preview-selection-request", { enabled: true });
  await page.waitForTimeout(800);
  await ctx.evaluate(() => {
    const btn = [...document.querySelectorAll("button")].find((b) => /varaa/i.test(b.textContent || ""));
    if (btn) btn.click();
  });
  await page.waitForTimeout(2000);
  await send("rork-web-preview-selection-request", { enabled: false });
  await page.waitForTimeout(1500);
  await ctx.evaluate(() => {
    const close = [...document.querySelectorAll("button")].find((b) => /sulje|peruuta/i.test(b.textContent || ""));
    if (close) close.click();
  });
  await page.waitForTimeout(2000);
});

await browser.close();
process.exit(0);
