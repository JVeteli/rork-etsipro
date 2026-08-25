import { useEffect } from "react";
import { createRoot } from "react-dom/client";

import { installEffectGuard, sanitizeEffectResult } from "@/lib/effect-guard";

test("sanitizeEffectResult keeps functions and undefined, coerces everything else", () => {
  const cleanup = () => {};
  expect(sanitizeEffectResult(undefined)).toBeUndefined();
  expect(sanitizeEffectResult(cleanup)).toBe(cleanup);
  expect(sanitizeEffectResult(null)).toBeUndefined();
  expect(sanitizeEffectResult(false)).toBeUndefined();
  expect(sanitizeEffectResult(0)).toBeUndefined();
  expect(sanitizeEffectResult("teksti")).toBeUndefined();
});

test("invalid effect cleanup returns never crash the app on unmount", async () => {
  installEffectGuard();

  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);

  function BadEffect() {
    useEffect(() => null as unknown as void, []);
    useEffect(() => false as unknown as void, []);
    useEffect(() => {
      return () => {};
    });
    return null;
  }

  root.render(<BadEffect />);
  await new Promise<void>((resolve) => setTimeout(resolve, 20));

  // Unmount runs every passive effect cleanup; without the guard a
  // non-function destroy would throw "destroy is not a function" here.
  expect(() => root.unmount()).not.toThrow();
  container.remove();
});
