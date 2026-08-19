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

  it("declares every shared directory it reaches into", () => {
    // A connector node imports the shared runtime with `../../_connector/…`.
    // That path resolves here because the whole marketplace is on disk; in a
    // consumer's project it resolves only if the registry ALSO copied that
    // directory, which happens only because the manifest named it in `shared`.
    //
    // Miss the declaration and the node installs cleanly, looks complete in the
    // file list, and fails at the consumer's first build with a module that is
    // not there. Exactly the shape of the PSR-4 bug the Moic Suite hit.
    const declared: string[] = manifest.shared ?? [];
    const parts = [
      ...(manifest.ui ?? []),
      ...Object.values(manifest.runtimes ?? {}).flatMap((r: any) => r.files ?? []),
    ];

    for (const part of new Set<string>(parts as string[])) {
      const dirPath = resolve(node, part);
      if (!existsSync(dirPath)) continue;

      for (const file of readdirSync(dirPath).filter((f) => /\.(ts|tsx)$/.test(f))) {
        const src = readFileSync(resolve(dirPath, file), "utf8");
        for (const [, target] of src.matchAll(/from "\.\.\/\.\.\/(_[a-z0-9-]+)\//g)) {
          expect(declared, `${dir}/${part}/${file} imports ${target}`).toContain(target);
        }
      }

      for (const file of readdirSync(dirPath).filter((f) => f.endsWith(".php"))) {
        const src = readFileSync(resolve(dirPath, file), "utf8");
        for (const [, ns] of src.matchAll(/^use FancyFlow\\Nodes\\(\w+)\\/gm)) {
          // A node's own namespace is itself; anything else must be a declared
          // shared root, spelled as its directory.
          const own = dir.split(/[-_]/).map((s) => s[0].toUpperCase() + s.slice(1)).join("");
          if (ns === own) continue;

          const asDirectory = "_" + ns.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();
          expect(declared, `${dir}/${part}/${file} uses FancyFlow\Nodes\${ns}`).toContain(asDirectory);
        }
      }
    }
  });

  it("keeps its shared directories out of the node's own tree", () => {
    // A shared root is a SIBLING of the node once vendored, never a child. The
    // relative depth is what makes `../../_connector/js/mode` resolve after the
    // copy as well as before it.
    for (const shared of manifest.shared ?? []) {
      expect(shared).toMatch(/^_[a-z0-9-]+$/);
      expect(existsSync(resolve(NODES, shared)), `${shared} is declared but not on disk`).toBe(true);
    }
  });
});

/**
 * `_connector` is GENERATED, and a hand edit here is a fix that disappears.
 *
 * The shared connector runtime is one source with two distribution channels: it
 * ships as `@particle-academy/fancy-connector-core` for a host that installs
 * things,
 * and it is copied in here so a flow node still costs a consumer no dependency.
 * The copy is produced by `scripts/vendor.mjs` in the CORE repo and overwritten on
 * every run.
 *
 * So the failure this guards is specific and quiet: someone opens
 * `_connector/js/delivery.ts`, fixes a real bug, and the fix is gone at the next
 * build with nothing to say it ever existed. Every generated file carries a
 * banner saying so, and this fails the build when one does not.
 *
 * The stronger check — regenerating and diffing — lives in the package's own CI,
 * because it needs the package's source, which this repository deliberately does
 * not have.
 */
describe("_connector is generated, not maintained here", () => {
  const shared = resolve(NODES, "_connector");

  for (const part of ["js", "php"]) {
    const dir = resolve(shared, part);
    if (!existsSync(dir)) continue;

    const files = readdirSync(dir).filter((f) => f.endsWith(".ts") || f.endsWith(".php"));

    it(`every ${part}/ file says where it came from (${files.length} files)`, () => {
      for (const file of files) {
        const src = readFileSync(resolve(dir, file), "utf8");
        expect(src, `${part}/${file} has no GENERATED banner — either it was hand-written here, or someone edited a generated file and stripped it. Both mean the next \`vendor.mjs\` run silently discards the change.`)
          .toMatch(/GENERATED from [^\n]*fancy-connector-core/);
      }
    });
  }

  it("the authoring surface is NOT generated — it is fancy-flow's, and stays here", () => {
    // `ui/connector.ts` imports the flow engine to build a node's config schema.
    // A general connector package has no business with that, so it is the one
    // part of `_connector` that is genuinely maintained in this repository.
    const ui = resolve(shared, "ui", "connector.ts");
    expect(existsSync(ui)).toBe(true);
    expect(readFileSync(ui, "utf8")).not.toMatch(/GENERATED from/);
  });
});

/**
 * `ui/connector.ts` is the ONE part of `_connector` maintained here, because it
 * imports the flow engine. That is also what makes it the one part that can
 * drift from the generated runtime beside it — and it re-declares `SandboxKind`,
 * which is the field where being wrong sends someone to a live estate believing
 * it is a test one.
 *
 * So the two declarations are compared. A hand-maintained mirror with nothing
 * checking it is the shape this repository keeps finding.
 */
describe("the authoring surface and the generated runtime agree", () => {
  const kinds = (source: string): string[] =>
    [...source.matchAll(/"(credential|base-url|separate-account|restricted-reach|none|unverified)"/g)]
      .map((m) => m[1]!)
      .filter((value, index, all) => all.indexOf(value) === index)
      .sort();

  it("declares the same SandboxKind values", () => {
    const runtime = readFileSync(resolve(NODES, "_connector", "js", "mode.ts"), "utf8");
    const ui = readFileSync(resolve(NODES, "_connector", "ui", "connector.ts"), "utf8");

    const fromRuntime = kinds(runtime.slice(runtime.indexOf("export type SandboxKind"), runtime.indexOf("export const SANDBOX_KINDS")));
    const fromUi = kinds(ui.slice(ui.indexOf("export type SandboxKind"), ui.indexOf("const SELECTABLE_SANDBOX")));

    expect(fromUi, "the authoring surface offers a different set of sandbox shapes than the runtime resolves")
      .toEqual(fromRuntime);
  });

  it("offers `sandbox` as a mode only for the kinds the runtime can actually select", () => {
    // Offering a mode the resolver refuses is an invitation to pick it and read
    // an error; NOT offering one it would honour hides a real estate.
    const ui = readFileSync(resolve(NODES, "_connector", "ui", "connector.ts"), "utf8");
    const selectable = kinds(ui.slice(ui.indexOf("const SELECTABLE_SANDBOX"), ui.indexOf("export type ConnectorMeta")));

    expect(selectable).toEqual(["base-url", "credential", "separate-account"]);
  });
});
