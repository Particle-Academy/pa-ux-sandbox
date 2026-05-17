import { parseArgs, flagAsString } from "../lib/args.js";
import { DEFAULT_REGISTRY, loadConfig } from "../lib/config.js";
import { RegistryClient } from "../lib/registry.js";
import { color } from "../lib/io.js";

export async function runList(argv: string[]): Promise<number> {
  const { flags } = parseArgs(argv, { stringOpts: ["cwd", "registry"] });
  const cwd = process.cwd();
  const config = await loadConfig(cwd);
  const registry = flagAsString(flags, "registry") ?? config?.registry ?? DEFAULT_REGISTRY;

  const client = new RegistryClient(registry);
  const idx = await client.index();

  // Group by package.
  const byPkg = new Map<string, typeof idx.items>();
  for (const item of idx.items) {
    const list = byPkg.get(item.package) ?? [];
    list.push(item);
    byPkg.set(item.package, list);
  }

  const sortedPkgs = Array.from(byPkg.keys()).sort();
  for (const pkg of sortedPkgs) {
    const items = byPkg.get(pkg)!;
    console.log(`${color.bold(pkg)} ${color.dim(`(${items.length})`)}`);
    for (const item of items) {
      const desc = item.description ? color.dim(`  ${truncate(item.description, 60)}`) : "";
      console.log(`  ${item.name.padEnd(20)} ${color.cyan(item.title.padEnd(20))} ${desc}`);
    }
    console.log("");
  }
  return 0;
}

function truncate(s: string, max: number): string {
  if (s.length <= max) return s;
  return s.slice(0, max - 1) + "…";
}
