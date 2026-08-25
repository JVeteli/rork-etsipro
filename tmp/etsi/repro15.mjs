import { chromium } from "playwright-core";

const BASE = "https://z7vh958d7ib50hfe3ltkr-web-etsipro.rork.live/";
const browser = await chromium.launch({
  executablePath: "/home/user/.cache/ms-playwright/chromium_headless_shell-1223/chrome-headless-shell-linux64/chrome-headless-shell",
});

const page = await browser.newPage({ viewport: { width: 390, height: 844 } });

await page.addInitScript(() => {
  const badEffects = [];
  window.__badEffectReturns = badEffects;
  const seen = new WeakSet();
  function patch(dispatcher) {
    if (!dispatcher || typeof dispatcher !== "object" || seen.has(dispatcher)) return;
    seen.add(dispatcher);
    for (const name of ["useEffect", "useLayoutEffect", "useInsertionEffect"]) {
      const orig = dispatcher[name];
      if (typeof orig !== "function") continue;
      dispatcher[name] = function (create, deps) {
        const wrapped = (...args) => {
          let ret;
          try { ret = create(...args); } catch (e) { throw e; }
          if (ret !== undefined && typeof ret !== "function") {
            badEffects.push({ ret: String(ret), stack: new Error("BAD: " + String(ret)).stack });
            console.error("[bad-effect] returned", ret, "\n" + new Error().stack);
          }
          return ret;
        };
        return orig(wrapped, deps);
      };
    }
  }
  const poll = setInterval(() => {
    const hook = window.__REACT_DEVTOOLS_GLOBAL_HOOK__;
    if (!hook || !hook.renderers) return;
    for (const renderer of hook.renderers.values()) {
      const ref = renderer.currentDispatcherRef;
      if (!ref || typeof ref !== "object") continue;
      const key = "H" in ref ? "H" : "current";
      const current = ref[key];
      if (current && typeof current === "object") patch(current);
    }
  }, 5);
});

await page.setContent(
  `<html><body><iframe id="app" style="width:390px;height:844px;border:0" src="${BASE}"></iframe></body></html>`,
  { waitUntil: "domcontentloaded" },
);
const frame = page.frames().find((f) => f !== page.mainFrame());

const errors = [];
frame?.on("pageerror", (err) => errors.push(err.message + "\n" + (err.stack || "").slice(0, 600)));
page.on("console", (msg) => {
  const t = msg.text();
  if (msg.type() === "error" && !t.includes("React Grab")) console.log("[console.error]", t.slice(0, 300));
});
await page.evaluate(() => {
  window.__fwd = [];
  window.addEventListener("message", (e) => {
    if (e.data && e.data.type === "ERROR") window.__fwd.push(e.data.error?.message + " || " + (e.data.error?.stack || "").slice(0, 400));
  });
});
const send = (type, data) =>
  page.evaluate(({ type, data }) => document.querySelector("iframe#app")?.contentWindow?.postMessage({ type, ...data }, "*"), { type, data });

const step = async (name, fn) => {
  try { await fn(); console.log("OK  ", name); } catch (e) { console.log("FAIL", name, "-", e.message.split("\n")[0]); }
  await page.waitForTimeout(600);
};

await page.waitForTimeout(7000);

// seed a provider session (mikko) like a returning user
await step("seed session", () =>
  frame.evaluate(() => {
    localStorage.setItem("etsipro_session_v1", "u-mikko");
    window.location.reload();
  }),
);
await page.waitForTimeout(7000);

// mobile menu sheet
await step("open mobile menu", async () => {
  const menuBtn = await frame.$('button[aria-label*="enu"], button[aria-label*="Valikko"], header button').catch(() => null);
  const btn = (await frame.$$("header button"))[0];
  await btn.click();
});
await page.waitForTimeout(1500);
await step("close sheet", () => page.keyboard.press("Escape"));
await page.waitForTimeout(1200);

// navigate as provider: dashboard with tabs
for (const href of ["/omasivu", "/viestit", "/selaa", "/palvelu/s-muutto"]) {
  await step("nav " + href, () =>
    frame.evaluate((h) => { window.history.pushState(null, "", h); window.dispatchEvent(new PopStateEvent("popstate")); }, href),
  );
  await page.waitForTimeout(1200);
}

await step("open booking dialog (mobile)", () =>
  frame.evaluate(() => {
    const btn = [...document.querySelectorAll("button")].find((b) => /varaa/i.test(b.textContent || ""));
    if (btn) btn.click();
  }),
);
await page.waitForTimeout(1500);
await step("dialog tabs", async () => {
  const tabs = await frame.$$('[role="tab"]');
  for (const t of tabs) { await t.click().catch(() => {}); await page.waitForTimeout(400); }
});
await step("dialog select", async () => {
  const sel = (await frame.$$('[role="combobox"]'))[0];
  if (sel) {
    await sel.click().catch(() => {});
    await page.waitForTimeout(600);
    const opt = (await frame.$$('[role="option"]'))[0];
    if (opt) await opt.click().catch(() => {});
  }
});
await page.waitForTimeout(1000);
await step("close dialog", () =>
  frame.evaluate(() => {
    const btn = [...document.querySelectorAll("button")].find((b) => /sulje|peruuta/i.test(b.textContent || ""));
    if (btn) btn.click();
  }),
);
await page.waitForTimeout(1000);

// grab mode with sheet + dialog flows
await step("grab on", () => send("rork-web-preview-selection-request", { enabled: true }));
await page.waitForTimeout(1000);
await step("open mobile menu while frozen", async () => {
  const btn = (await frame.$$("header button"))[0];
  await btn.click();
});
await page.waitForTimeout(1200);
await page.mouse.move(200, 400, { steps: 3 });
await page.mouse.down();
await page.mouse.up();
await page.waitForTimeout(2000);
await step("grab off", () => send("rork-web-preview-selection-request", { enabled: false }));
await page.waitForTimeout(1500);
await step("esc", () => page.keyboard.press("Escape"));
await page.waitForTimeout(1000);

// scroll + navigate while grab cycles
for (let i = 0; i < 3; i++) {
  await step("grab cycle " + i, async () => {
    await send("rork-web-preview-selection-request", { enabled: true });
    await page.waitForTimeout(700);
    await page.mouse.wheel(0, 400);
    await page.waitForTimeout(700);
    await page.mouse.move(150, 300 + i * 60, { steps: 2 });
    await page.mouse.down();
    await page.mouse.up();
    await page.waitForTimeout(1500);
    await send("rork-web-preview-selection-request", { enabled: false });
    await page.waitForTimeout(1000);
  });
}

const bad = await frame.evaluate(() => window.__badEffectReturns || []);
console.log("\n=== BAD EFFECT RETURNS (" + bad.length + ") ===");
for (const b of bad) console.log("ret:", b.ret, "\n" + b.stack + "\n---");
console.log("\n=== PAGE ERRORS (" + errors.length + ") ===");
for (const e of errors) console.log(e + "\n---");
console.log("\n=== FORWARDED (" + (await page.evaluate(() => window.__fwd.length)) + ") ===");
for (const e of await page.evaluate(() => window.__fwd)) console.log(e + "\n---");

await browser.close();
process.exit(0);
