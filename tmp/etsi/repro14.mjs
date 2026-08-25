import { chromium } from "playwright-core";

const BASE = "https://z7vh958d7ib50hfe3ltkr-web-etsipro.rork.live/";
const browser = await chromium.launch({
  executablePath: "/home/user/.cache/ms-playwright/chromium_headless_shell-1223/chrome-headless-shell-linux64/chrome-headless-shell",
});

const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });

// ---- init script: instrument dispatcher effect hooks in EVERY frame ----
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
          try {
            ret = create(...args);
          } catch (e) {
            throw e;
          }
          if (ret !== undefined && typeof ret !== "function") {
            const stack = new Error("BAD EFFECT RETURN: " + String(ret)).stack;
            badEffects.push({ ret: String(ret), stack });
            console.error("[bad-effect] returned", ret, "\n" + stack);
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
  window.__stopPoll = () => clearInterval(poll);
});

await page.setContent(
  `<html><body><iframe id="app" style="width:1280px;height:900px;border:0" src="${BASE}"></iframe></body></html>`,
  { waitUntil: "domcontentloaded" },
);
const frame = page.frames().find((f) => f !== page.mainFrame());

const errors = [];
const consoleErrors = [];
frame?.on("pageerror", (err) => {
  errors.push(err.message + "\n" + (err.stack || "").slice(0, 600));
});
page.on("console", (msg) => {
  const t = msg.text();
  if (msg.type() === "error" && !t.includes("React Grab")) consoleErrors.push(t.slice(0, 300));
});
// capture the deployed preview's forwarded ERROR messages
await page.evaluate(() => {
  window.__fwd = [];
  window.addEventListener("message", (e) => {
    if (e.data && e.data.type === "ERROR") {
      window.__fwd.push(e.data.error?.message + " || " + (e.data.error?.stack || "").slice(0, 400));
    }
  });
});

const send = (type, data) =>
  page.evaluate(
    ({ type, data }) => document.querySelector("iframe#app")?.contentWindow?.postMessage({ type, ...data }, "*"),
    { type, data },
  );

const step = async (name, fn) => {
  try {
    await fn();
    console.log("OK  ", name);
  } catch (e) {
    console.log("FAIL", name, "-", e.message.split("\n")[0]);
  }
  await page.waitForTimeout(700);
};

await page.waitForTimeout(7000);
console.log("grab loaded:", await frame.evaluate(() => !!window.__REACT_GRAB__).catch(() => false));

// ============ SWEEP ============
await step("login page", () => frame.click('a[href="/kirjaudu"]'));
await step("fill login", async () => {
  await frame.fill('input[type="email"]', "liisa@etsipro.fi");
  await frame.fill('input[type="password"]', "demo1234");
});
await step("submit login", async () => {
  const btns = await frame.$$("button");
  for (const b of btns) {
    const t = (await b.textContent()) || "";
    if (/kirjaudu/i.test(t)) {
      await b.click();
      break;
    }
  }
});
await page.waitForTimeout(2500);

for (const href of ["/omasivu", "/viestit", "/selaa", "/selaa?cat=koti", "/palvelu/s-muutto", "/palvelu/s-hieronta"]) {
  await step("nav " + href, () =>
    frame.evaluate((h) => {
      window.history.pushState(null, "", h);
      window.dispatchEvent(new PopStateEvent("popstate"));
    }, href),
  );
  await page.waitForTimeout(1200);
}

await step("open booking dialog", () =>
  frame.evaluate(() => {
    const btn = [...document.querySelectorAll("button")].find((b) => /varaa/i.test(b.textContent || ""));
    if (btn) btn.click();
    else throw new Error("no varaa button");
  }),
);
await page.waitForTimeout(1500);
await step("click dialog tabs", async () => {
  const tabs = await frame.$$('[role="tab"]');
  for (const t of tabs) {
    await t.click().catch(() => {});
    await page.waitForTimeout(400);
  }
});
await step("click a select", async () => {
  const triggers = await frame.$$('[role="combobox"], [data-radix-select-trigger]');
  if (triggers.length) {
    await triggers[0].click().catch(() => {});
    await page.waitForTimeout(600);
    const opts = await frame.$$('[role="option"]');
    if (opts.length) await opts[0].click().catch(() => {});
  }
});
await step("close dialog", () =>
  frame.evaluate(() => {
    const btn = [...document.querySelectorAll("button")].find((b) => /sulje|peruuta/i.test(b.textContent || ""));
    if (btn) btn.click();
  }),
);
await page.waitForTimeout(1200);

// grab-mode selection interleaved
await step("grab activate", () => send("rork-web-preview-selection-request", { enabled: true }));
await page.waitForTimeout(1200);
await step("grab hover+click", async () => {
  await page.mouse.move(500, 300, { steps: 3 });
  await page.waitForTimeout(400);
  await page.mouse.down();
  await page.mouse.up();
});
await page.waitForTimeout(2500);
await step("grab deactivate", () => send("rork-web-preview-selection-request", { enabled: false }));
await page.waitForTimeout(2000);

// user menu dropdown
await step("open user menu", () =>
  frame.evaluate(() => {
    const btn = [...document.querySelectorAll("button")].find((b) => /valikko|tili/i.test(b.textContent || ""));
    if (btn) btn.click();
  }),
);
await page.waitForTimeout(800);
await step("close menu (esc)", () => page.keyboard.press("Escape"));
await page.waitForTimeout(800);

// onboarding as logged-out? open /liity
await step("nav /liity", () =>
  frame.evaluate(() => {
    window.history.pushState(null, "", "/liity");
    window.dispatchEvent(new PopStateEvent("popstate"));
  }),
);
await page.waitForTimeout(1500);
await step("liity step next x3", async () => {
  for (let i = 0; i < 3; i++) {
    const btn = await frame
      .$("button:has-text('Jatka'), button:has-text('Seuraava'), button:has-text('Tallenna')")
      .catch(() => null);
    if (!btn) break;
    await btn.click().catch(() => {});
    await page.waitForTimeout(700);
  }
});
await page.waitForTimeout(1500);

// navigate back home and re-run grab
await step("nav /", () =>
  frame.evaluate(() => {
    window.history.pushState(null, "", "/");
    window.dispatchEvent(new PopStateEvent("popstate"));
  }),
);
await page.waitForTimeout(1500);
await step("grab activate 2", () => send("rork-web-preview-selection-request", { enabled: true }));
await page.waitForTimeout(800);
await page.mouse.move(700, 500, { steps: 3 });
await page.waitForTimeout(400);
await page.mouse.down();
await page.mouse.up();
await page.waitForTimeout(2000);
await step("grab deactivate 2", () => send("rork-web-preview-selection-request", { enabled: false }));
await page.waitForTimeout(2000);

// ---- results ----
const bad = await frame.evaluate(() => window.__badEffectReturns || []);
console.log("\n=== BAD EFFECT RETURNS (" + bad.length + ") ===");
for (const b of bad) console.log("ret:", b.ret, "\n" + b.stack + "\n---");

console.log("\n=== PAGE ERRORS (" + errors.length + ") ===");
for (const e of errors) console.log(e + "\n---");

console.log("\n=== FORWARDED ERRORS (" + (await page.evaluate(() => window.__fwd.length)) + ") ===");
for (const e of await page.evaluate(() => window.__fwd)) console.log(e + "\n---");

console.log("\n=== CONSOLE ERRORS (" + consoleErrors.length + ") ===");
for (const c of consoleErrors.slice(0, 20)) console.log(c + "\n---");

await browser.close();
process.exit(0);
