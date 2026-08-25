/**
 * Guards the app against React's "destroy is not a function" crash.
 *
 * React's production builds store whatever a passive effect's `create`
 * callback returns as the effect's cleanup (`inst.destroy`). If `create`
 * ever returns a non-function, non-undefined value (null, a boolean, a
 * promise, …), the next unmount calls that value as a function and takes
 * down the whole tree with `TypeError: destroy is not a function`.
 *
 * The Rork preview embeds the app in an iframe and injects React Grab
 * (element inspection), which patches React internals to freeze and replay
 * renders while an element is selected. That instrumentation is fragile and
 * can surface rare races — races that manifest exactly as this crash.
 *
 * This module neutralizes the entire crash class by wrapping the
 * dispatcher's effect hooks so invalid cleanup returns are coerced to
 * `undefined` before React stores them — the same validation React performs
 * in development mode. Two complementary layers are used:
 *
 * 1. React's shared dispatcher slot (`ReactSharedInternals.H`) is
 *    instrumented. Every effect creation flows through it — including
 *    effect hooks third-party code captured at module load (e.g. Radix's
 *    `useLayoutEffect` helper).
 * 2. As a best-effort fallback for environments where the internals export
 *    is unavailable, the public `React.useEffect` / `useLayoutEffect` /
 *    `useInsertionEffect` exports are wrapped. Production bundles may
 *    expose those as getter-only properties, so this layer can fail — the
 *    dispatcher slot instrumentation above is the one that matters.
 */

import * as React from "react";

type CreateCallback = (...args: unknown[]) => unknown;
type EffectHook = (create: CreateCallback, deps?: unknown) => void;

interface DispatcherLike {
  useEffect?: EffectHook;
  useLayoutEffect?: EffectHook;
  useInsertionEffect?: EffectHook;
}

interface DispatcherSlotLike {
  H?: unknown;
  current?: unknown;
}

const EFFECT_HOOK_NAMES = ["useEffect", "useLayoutEffect", "useInsertionEffect"] as const;

const patchedDispatchers = new WeakSet<object>();
const instrumentedSlots = new WeakSet<object>();

let namespaceHooksWrapped = false;

/**
 * Coerces invalid effect cleanup returns to `undefined` so React never
 * stores a non-function value as an effect's destroy.
 */
export function sanitizeEffectResult(result: unknown): unknown {
  if (result === undefined || typeof result === "function") return result;
  if (typeof console !== "undefined") {
    console.warn("[effect-guard] Effect returned an invalid cleanup value; ignoring it:", result);
  }
  return undefined;
}

function patchDispatcher(dispatcher: object): void {
  if (patchedDispatchers.has(dispatcher)) return;
  patchedDispatchers.add(dispatcher);

  const hooks = dispatcher as DispatcherLike;
  for (const hookName of EFFECT_HOOK_NAMES) {
    const original = hooks[hookName];
    if (typeof original !== "function") continue;
    hooks[hookName] = (create: CreateCallback, deps?: unknown): void => {
      const guarded = (...args: unknown[]): unknown => sanitizeEffectResult(create(...args));
      original(guarded, deps);
    };
  }
}

/** Wraps the public React hook exports. */
function wrapNamespaceHooks(): void {
  if (namespaceHooksWrapped) return;
  namespaceHooksWrapped = true;

  const reactNs = React as unknown as Record<string, unknown>;
  for (const hookName of EFFECT_HOOK_NAMES) {
    const original = reactNs[hookName];
    if (typeof original !== "function") continue;
    reactNs[hookName] = (create: CreateCallback, deps?: unknown): void => {
      const guarded = (...args: unknown[]): unknown => sanitizeEffectResult(create(...args));
      (original as EffectHook)(guarded, deps);
    };
  }
}

/**
 * Instruments React's shared dispatcher slot so any dispatcher React swaps
 * in — including ones third-party code captured before this module ran —
 * wraps effect creates on first use. The accessor keeps the exact same
 * read/write semantics, so react-dom and React Grab keep working normally.
 */
function instrumentDispatcherSlot(slot: DispatcherSlotLike): void {
  if (!slot || typeof slot !== "object" || instrumentedSlots.has(slot)) return;
  instrumentedSlots.add(slot);

  const key: "H" | "current" = "H" in slot ? "H" : "current";
  let current = slot[key];

  try {
    Object.defineProperty(slot, key, {
      configurable: true,
      enumerable: true,
      get: () => {
        if (current && typeof current === "object") patchDispatcher(current);
        return current;
      },
      set: (next: unknown) => {
        current = next;
      },
    });
  } catch {
    // Non-configurable slot (unlikely today, possible in future React
    // versions): patch whatever is current and rely on the namespace
    // wrapping for everything else.
  }

  if (current && typeof current === "object") patchDispatcher(current);
}

/**
 * Installs the guard. Idempotent and guaranteed not to throw; must run
 * before the first render (i.e. at the top of the app entry point, before
 * `createRoot(...).render(...)`).
 */
export function installEffectGuard(): void {
  const reactNs = React as unknown as Record<string, unknown>;
  const internals = reactNs.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE;
  if (internals && typeof internals === "object") {
    instrumentDispatcherSlot(internals as DispatcherSlotLike);
  }

  // Fallback layer; production bundles may expose the React namespace with
  // getter-only properties, so never let this break startup.
  try {
    wrapNamespaceHooks();
  } catch {
    // The dispatcher slot instrumentation above already covers this bundle.
  }
}
