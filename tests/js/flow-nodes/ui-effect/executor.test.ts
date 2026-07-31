// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import { validateNodeManifest } from "@particle-academy/fancy-flow/engine";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { uiEffectExecutor } from "../../../../resources/flow-nodes/ui-effect/js/executor";
import { registerUiEffectHost } from "../../../../resources/flow-nodes/ui-effect/js/host";
import { uiEffectKind, UI_EFFECT_KIND } from "../../../../resources/flow-nodes/ui-effect/ui/kind";
import type { UiEffect } from "../../../../resources/flow-nodes/ui-effect/js/types";

const ctx = (config: Record<string, unknown>, inputs: unknown = undefined) =>
  ({
    node: { id: "fx", type: UI_EFFECT_KIND, position: { x: 0, y: 0 }, data: { kind: UI_EFFECT_KIND, config } },
    inputs: { in: inputs },
    emit: () => {},
    abort: (reason?: string) => {
      throw new Error(reason);
    },
  }) as any;

describe("manifest", () => {
  const manifest = JSON.parse(readFileSync(resolve(process.cwd(), "resources/flow-nodes/ui-effect/fancy-flow.node.json"), "utf8"));

  it("validates against the engine's own validator", () => {
    const result = validateNodeManifest(manifest);

    expect(result.problems.filter((p) => p.level === "error")).toEqual([]);
    expect(result.ok).toBe(true);
  });

  it("declares the kind the package actually registers", () => {
    // These drift silently: the manifest is data the registry reads, the kind is
    // code the editor reads, and nothing else compares them.
    expect(manifest.kind).toBe(uiEffectKind.name);
    expect(manifest.aliases).toEqual(uiEffectKind.aliases);
  });

  it("declares itself unsafe to replay, because toggle is", () => {
    // Durable runs retry. add/remove/set are idempotent; toggle-class flips
    // back on a second attempt, so the honest declaration covers the kind.
    expect(manifest.sideEffects).toBe("unsafe-to-replay");
  });
});

describe("executor", () => {
  it("hands the resolved effect to the host and passes the payload through", async () => {
    const seen: UiEffect[] = [];
    const release = registerUiEffectHost({ apply: (e) => void seen.push(e) });

    const out = await uiEffectExecutor(
      ctx({ target: "deal-card", op: "add-class", value: "ff-fx-glow", durationMs: 1200 }, { dealId: 41 }),
    );

    expect(seen).toEqual([
      { target: "deal-card", op: "add-class", value: "ff-fx-glow", name: "", durationMs: 1200 },
    ]);
    expect(out).toMatchObject({ dealId: 41, applied: true });

    release();
  });

  it("fails loudly with no host and no document", async () => {
    // The failure this whole design is arranged against: a queue worker styling
    // nothing and reporting success.
    vi.stubGlobal("document", undefined);

    await expect(uiEffectExecutor(ctx({ target: "page", op: "add-class", value: "x" }))).rejects.toThrow(
      /no UI host/i,
    );

    vi.unstubAllGlobals();
  });

  it("uses the DOM without any registration when there is a document", async () => {
    document.body.innerHTML = '<div data-fancy-id="zero-config"></div>';

    await uiEffectExecutor(ctx({ target: "zero-config", op: "add-class", value: "lit" }));

    expect(document.querySelector('[data-fancy-id="zero-config"]')!.classList.contains("lit")).toBe(true);
  });
});

describe("packaging", () => {
  // Every node in this repo ships in ONE npm package, so `fancy-cli add node`
  // resolves to the same install whichever node you ask for. A manifest naming
  // anything else sends the CLI to install something that does not contain it.
  const manifest = JSON.parse(readFileSync(resolve(process.cwd(), "resources/flow-nodes/ui-effect/fancy-flow.node.json"), "utf8"));
  const pkg = JSON.parse(readFileSync(resolve(process.cwd(), "package.json"), "utf8"));

  it("names the source it is vendored from, not a package to install", () => {
    // Nothing installs this. The name identifies where the files came from.
    expect(manifest.name).toBe("particle-academy/fancy-flow-nodes");
    expect(pkg.private).toBe(true);
  });

  it("points every declared directory at one that exists", () => {
    // A manifest naming a directory that isn't there is a node the registry
    // serves with files missing — and the CLI copies a half node in silence.
    const declared = [
      ...(manifest.ui ?? []),
      ...Object.values(manifest.runtimes as Record<string, { files?: string[] }>).flatMap(
        (r) => r.files ?? [],
      ),
    ];

    expect(declared).toEqual(["ui", "js", "php"]);
    for (const dir of declared) {
      expect(existsSync(resolve(process.cwd(), "resources/flow-nodes/ui-effect", dir))).toBe(true);
    }
  });

  it("keeps the surface out of the backends", () => {
    // The editor is React on every host: a PHP project needs `ui` and must not
    // receive the TypeScript executor.
    expect(manifest.ui).toEqual(["ui"]);
    expect(manifest.runtimes.ts.files).toEqual(["js"]);
    expect(manifest.runtimes.php.files).toEqual(["php"]);
  });

  it("points at fixtures that exist from the repo root", () => {
    expect(() => readFileSync(resolve(process.cwd(), "resources/flow-nodes", manifest.fixtures.replace(/^nodes\//, "")), "utf8")).not.toThrow();
  });
});
