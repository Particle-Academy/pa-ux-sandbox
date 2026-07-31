// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createDomUiEffectHost } from "../../../../resources/flow-nodes/ui-effect/js/dom";

/**
 * The DOM host, against a real document.
 *
 * Half of what this package does is here, and a mock that agrees with whatever
 * we wrote would prove nothing — so these run in jsdom and read the element
 * back afterwards.
 */

const host = createDomUiEffectHost();

beforeEach(() => {
  document.documentElement.className = "";
  document.documentElement.removeAttribute("style");
  document.body.innerHTML = `
    <div id="plain" class="card"></div>
    <div data-fancy-id="deal-card" class="card theme-light"></div>
  `;
});

const card = () => document.querySelector<HTMLElement>('[data-fancy-id="deal-card"]')!;

describe("targeting", () => {
  it("resolves a stable handle before anything else", () => {
    host.apply({ target: "deal-card", op: "add-class", value: "ff-fx-glow" });

    expect(card().classList.contains("ff-fx-glow")).toBe(true);
  });

  it("treats `page` as the document root — the theme target", () => {
    host.apply({ target: "page", op: "set-var", name: "--fa-accent", value: "#a855f7" });

    expect(document.documentElement.style.getPropertyValue("--fa-accent")).toBe("#a855f7");
  });

  it("falls back to a CSS selector for surfaces with no handle", () => {
    host.apply({ target: "#plain", op: "add-class", value: "lit" });

    expect(document.querySelector("#plain")!.classList.contains("lit")).toBe(true);
  });

  it("throws when nothing matches, rather than silently styling nothing", () => {
    // The whole design leans on this. A no-op here means a workflow that
    // "highlights the card" reports success having done nothing at all.
    expect(() => host.apply({ target: "no-such-card", op: "add-class", value: "lit" })).toThrow(
      /nothing matches target/i,
    );
  });

  it("says so when the target is not even a valid selector", () => {
    expect(() => host.apply({ target: "]][[", op: "add-class", value: "lit" })).toThrow(
      /neither a known handle nor a valid selector/i,
    );
  });
});

describe("operations", () => {
  it("adds and removes classes", () => {
    host.apply({ target: "deal-card", op: "add-class", value: "a b" });
    expect(card().classList.contains("a")).toBe(true);
    expect(card().classList.contains("b")).toBe(true);

    host.apply({ target: "deal-card", op: "remove-class", value: "a" });
    expect(card().classList.contains("a")).toBe(false);
    expect(card().classList.contains("b")).toBe(true);
  });

  it("toggles", () => {
    host.apply({ target: "deal-card", op: "toggle-class", value: "theme-light" });
    expect(card().classList.contains("theme-light")).toBe(false);

    host.apply({ target: "deal-card", op: "toggle-class", value: "theme-light" });
    expect(card().classList.contains("theme-light")).toBe(true);
  });

  it("swaps one class for another", () => {
    host.apply({ target: "deal-card", op: "replace-class", name: "theme-light", value: "theme-dark" });

    expect(card().classList.contains("theme-light")).toBe(false);
    expect(card().classList.contains("theme-dark")).toBe(true);
    expect(card().classList.contains("card")).toBe(true); // untouched
  });

  it("sets an inline style property", () => {
    host.apply({ target: "deal-card", op: "set-style", name: "box-shadow", value: "0 0 24px #a855f7" });

    expect(card().style.getPropertyValue("box-shadow")).toBe("0 0 24px #a855f7");
  });

  it("refuses set-var with no property name", () => {
    expect(() => host.apply({ target: "page", op: "set-var", value: "#fff" })).toThrow(/needs `name`/);
  });
});

describe("durationMs — how a pulse happens", () => {
  beforeEach(() => vi.useFakeTimers());

  it("puts the class back afterwards", () => {
    host.apply({ target: "deal-card", op: "add-class", value: "ff-fx-glow", durationMs: 1200 });
    expect(card().classList.contains("ff-fx-glow")).toBe(true);

    vi.advanceTimersByTime(1200);
    expect(card().classList.contains("ff-fx-glow")).toBe(false);

    vi.useRealTimers();
  });

  it("only reverts what it actually added", () => {
    // `card` was already on the element. Reverting it would leave the page in a
    // state nobody asked for — worse than the effect never running.
    host.apply({ target: "deal-card", op: "add-class", value: "card ff-fx-glow", durationMs: 500 });
    vi.advanceTimersByTime(500);

    expect(card().classList.contains("card")).toBe(true);
    expect(card().classList.contains("ff-fx-glow")).toBe(false);

    vi.useRealTimers();
  });

  it("restores a custom property's previous value, not just removes it", () => {
    document.documentElement.style.setProperty("--fa-accent", "#0ea5e9");

    host.apply({ target: "page", op: "set-var", name: "--fa-accent", value: "#a855f7", durationMs: 800 });
    expect(document.documentElement.style.getPropertyValue("--fa-accent")).toBe("#a855f7");

    vi.advanceTimersByTime(800);
    expect(document.documentElement.style.getPropertyValue("--fa-accent")).toBe("#0ea5e9");

    vi.useRealTimers();
  });
});
