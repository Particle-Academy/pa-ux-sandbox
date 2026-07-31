import type { UiEffect, UiEffectHost } from "./types";

/**
 * The host most apps want: apply the effect to the real DOM.
 *
 * Handle resolution, in order:
 *
 *  1. `page` / `:root` / `document` → `document.documentElement`. This is the
 *     theme target — `set-var` on the root is how a whole page changes at once.
 *  2. `[data-fancy-id="<handle>"]` — the stable handle a Fancy surface publishes.
 *  3. The string as a CSS selector, last. Useful outside a Fancy surface, but a
 *     host with a real handle registry should pass `resolve` and never get here.
 *
 * A target that resolves to nothing **throws**. It would be easy to no-op, and
 * that is exactly the trap: the run would report success having styled nothing.
 */
export function createDomUiEffectHost(options: DomUiEffectHostOptions = {}): UiEffectHost {
  const { root, resolve } = options;

  const doc = () => root ?? (typeof document !== "undefined" ? document : null);

  const find = (handle: string): HTMLElement => {
    const d = doc();
    if (!d) throw new Error("ui_effect: no document — register a host for non-browser runs.");

    if (handle === "page" || handle === ":root" || handle === "document") {
      return d.documentElement as HTMLElement;
    }

    const custom = resolve?.(handle);
    if (custom) return custom;

    const byHandle = d.querySelector<HTMLElement>(`[data-fancy-id="${cssEscape(handle)}"]`);
    if (byHandle) return byHandle;

    // Selector fallback. Wrapped because an author-supplied string that isn't
    // valid CSS throws a DOMException, and "SyntaxError" tells them nothing.
    let bySelector: HTMLElement | null = null;
    try {
      bySelector = d.querySelector<HTMLElement>(handle);
    } catch {
      throw new Error(`ui_effect: target "${handle}" is neither a known handle nor a valid selector.`);
    }
    if (bySelector) return bySelector;

    throw new Error(`ui_effect: nothing matches target "${handle}".`);
  };

  return {
    resolve: (handle) => find(handle),
    apply(effect: UiEffect) {
      const el = find(effect.target);
      const undo = applyOnce(el, effect);

      // A duration is what turns four plain ops into pulses and flashes: apply,
      // then put it back. setTimeout is deliberate — the node does not stay
      // running, so the effect outlives the run that started it.
      if (effect.durationMs && effect.durationMs > 0) {
        setTimeout(undo, effect.durationMs);
      }
    },
  };
}

export type DomUiEffectHostOptions = {
  /** Document to operate on. Defaults to the ambient one. */
  root?: Document;
  /** A real handle registry, consulted before `[data-fancy-id]`. */
  resolve?: (handle: string) => HTMLElement | null | undefined;
};

/** Apply one effect and return the function that undoes it. */
function applyOnce(el: HTMLElement, effect: UiEffect): () => void {
  const classes = splitClasses(effect.value);

  switch (effect.op) {
    case "add-class": {
      // Only revert what WE added — reverting a class the page already had
      // would leave the page in a state no one asked for.
      const added = classes.filter((c) => !el.classList.contains(c));
      el.classList.add(...classes);

      return () => el.classList.remove(...added);
    }

    case "remove-class": {
      const removed = classes.filter((c) => el.classList.contains(c));
      el.classList.remove(...classes);

      return () => el.classList.add(...removed);
    }

    case "toggle-class": {
      classes.forEach((c) => el.classList.toggle(c));

      return () => classes.forEach((c) => el.classList.toggle(c));
    }

    case "replace-class": {
      const from = splitClasses(effect.name ?? "");
      const had = from.filter((c) => el.classList.contains(c));
      el.classList.remove(...from);
      el.classList.add(...classes);

      return () => {
        el.classList.remove(...classes);
        el.classList.add(...had);
      };
    }

    case "set-var": {
      const name = requireName(effect, "set-var needs `name` — the custom property, e.g. --fa-accent.");
      const previous = el.style.getPropertyValue(name);
      el.style.setProperty(name, effect.value);

      return () => {
        if (previous) el.style.setProperty(name, previous);
        else el.style.removeProperty(name);
      };
    }

    case "set-style": {
      const name = requireName(effect, "set-style needs `name` — the CSS property, e.g. box-shadow.");
      const previous = el.style.getPropertyValue(name);
      el.style.setProperty(name, effect.value);

      return () => {
        if (previous) el.style.setProperty(name, previous);
        else el.style.removeProperty(name);
      };
    }

    default:
      throw new Error(`ui_effect: unknown op "${String((effect as UiEffect).op)}".`);
  }
}

function requireName(effect: UiEffect, message: string): string {
  const name = (effect.name ?? "").trim();
  if (!name) throw new Error(`ui_effect: ${message}`);

  return name;
}

function splitClasses(value: string): string[] {
  return value.split(/\s+/).filter(Boolean);
}

/** Minimal attribute-value escape — CSS.escape isn't everywhere, and this is one quote. */
function cssEscape(value: string): string {
  return value.replace(/["\\]/g, "\\$&");
}
