import { existsSync, readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import type { NodeKindDefinition, OutputField } from "@particle-academy/fancy-flow/engine";

const root = resolve(process.cwd(), "resources/flow-nodes");
const modules = import.meta.glob("../../../resources/flow-nodes/*/ui/kind.ts", { eager: true });

const nodes = readdirSync(root)
  .filter((dir) => existsSync(resolve(root, dir, "fancy-flow.node.json")))
  .map((dir) => {
    const manifest = JSON.parse(readFileSync(resolve(root, dir, "fancy-flow.node.json"), "utf8"));
    const modulePath = Object.keys(modules).find((path) => path.endsWith(`/flow-nodes/${dir}/ui/kind.ts`));
    const exports = modulePath ? (modules[modulePath] as Record<string, unknown>) : {};
    const kind = Object.values(exports).find(
      (value): value is NodeKindDefinition =>
        typeof value === "object" && value !== null && (value as NodeKindDefinition).name === manifest.kind,
    );

    return { dir, manifest, kind };
  });

/**
 * Marketplace metadata and the vendored authoring surface are two copies of
 * one public contract. The registry serves the manifest to agents before they
 * install anything; the editor reads the kind after vendoring. If those copies
 * drift, an agent wires fields the editor cannot offer, or the editor promises
 * outputs the registry never advertised.
 */
describe.each(nodes)("$dir latest declaration schema", ({ manifest, kind }) => {
  it("ships a discoverable kind", () => {
    expect(kind).toBeDefined();
  });

  it("agrees about replay safety", () => {
    expect(kind?.sideEffects).toBe(manifest.sideEffects);
  });

  it("agrees about its static output shape", () => {
    const shape = kind?.outputShape;
    const resolved = Array.isArray(shape) ? (shape as OutputField[]) : undefined;

    expect(resolved, "marketplace nodes with data-dependent output must omit both copies").toEqual(
      manifest.outputShape,
    );
  });

  it("declares discoverable outputs whenever the executor has a stable shape", () => {
    if (manifest.kind === "@particle-academy/llm_input") return;

    expect(manifest.outputShape?.length).toBeGreaterThan(0);
  });

  it("agrees about how output relates to input", () => {
    expect(typeof kind?.emits === "function" ? undefined : kind?.emits).toBe(manifest.emits);
  });
});
