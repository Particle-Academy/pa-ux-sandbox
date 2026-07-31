import { readdirSync, readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const NODES = resolve(process.cwd(), "resources/flow-nodes");
const dirs = readdirSync(NODES).filter((d) => existsSync(resolve(NODES, d, "fancy-flow.node.json")));

/**
 * What survives being COPIED into someone else's project.
 *
 * A node is vendored, not installed, and `fancy-cli` copies only the parts the
 * chosen backend needs: `ui/` on every host, then `js/` OR `php/`. So a file's
 * imports have to be legal under every split it can land in — and nothing
 * checked that, which is how three separate breakages reached a consumer at
 * once (Moic Suite, 2026-07-31).
 */
describe.each(dirs)("%s", (dir) => {
  const node = resolve(NODES, dir);
  const manifest = JSON.parse(readFileSync(resolve(node, "fancy-flow.node.json"), "utf8"));

  it("never imports js/ from ui/", () => {
    // `ui/` lands on a PHP host; `js/` does not. An import across that line is a
    // dangling module the moment the node is vendored for PHP — the editor
    // build fails, on a host that never asked for the TypeScript executor.
    const uiDir = resolve(node, "ui");
    if (!existsSync(uiDir)) return;

    for (const file of readdirSync(uiDir).filter((f) => f.endsWith(".ts") || f.endsWith(".tsx"))) {
      const src = readFileSync(resolve(uiDir, file), "utf8");
      expect(src, `${dir}/ui/${file}`).not.toMatch(/from "\.\.\/js\//);
    }
  });

  it("carries a #[FlowNode] attribute on its PHP executor", () => {
    // `flow:discover` scans for this attribute. Without it a PHP host has to
    // hand-register every vendored node, and nothing tells them to — the node
    // simply never appears in the palette.
    if (!manifest.runtimes?.php) return;

    const phpDir = resolve(node, "php");
    const executor = readdirSync(phpDir).find((f) => f.endsWith("Executor.php"));
    expect(executor, `${dir} declares a php runtime but ships no *Executor.php`).toBeDefined();

    const src = readFileSync(resolve(phpDir, executor!), "utf8");
    expect(src, `${dir}/php/${executor}`).toContain("#[FlowNode(");
    expect(src).toContain(`name: '${manifest.kind}'`);
  });

  it("declares the same kind id in the manifest, the surface, and the attribute", () => {
    // Three files name this node. They drift silently: a rename lands in the
    // manifest, the palette keeps the old id, and a saved graph resolves to
    // neither.
    const uiSrc = readFileSync(resolve(node, "ui", "kind.ts"), "utf8");
    expect(uiSrc).toContain(`"${manifest.kind}"`);

    if (manifest.runtimes?.php) {
      const phpDir = resolve(node, "php");
      const executor = readdirSync(phpDir).find((f) => f.endsWith("Executor.php"))!;
      expect(readFileSync(resolve(phpDir, executor), "utf8")).toContain(`'${manifest.kind}'`);
    }
  });

  it("ships a runnable kind for TS hosts, separate from the surface", () => {
    // The surface carries no executor so it can be vendored alone. Something
    // still has to pair the two for a host that executes on TS, or that host
    // registers a kind that cannot run.
    if (!manifest.runtimes?.ts) return;

    const runnable = resolve(node, "js", "kind.ts");
    expect(existsSync(runnable), `${dir}/js/kind.ts missing`).toBe(true);
    expect(readFileSync(runnable, "utf8")).toContain("executor:");
  });
});
