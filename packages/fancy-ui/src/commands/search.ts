import { parseArgs, flagAsString } from "../lib/args.js";
import { DEFAULT_REGISTRY, loadConfig } from "../lib/config.js";
import { RegistryClient } from "../lib/registry.js";
import { color } from "../lib/io.js";

export async function runSearch(argv: string[]): Promise<number> {
  const { positional, flags } = parseArgs(argv, { stringOpts: ["cwd", "registry"] });
  if (positional.length === 0) {
    console.error(color.red("Usage: fancy-ui search <query>"));
    return 1;
  }

  const cwd = process.cwd();
  const config = await loadConfig(cwd);
  const registry = flagAsString(flags, "registry") ?? config?.registry ?? DEFAULT_REGISTRY;

  const query = positional.join(" ").toLowerCase();
  const client = new RegistryClient(registry);
  const idx = await client.index();

  const matches = idx.items.filter(
    (i) =>
      i.name.toLowerCase().includes(query) ||
      i.title.toLowerCase().includes(query) ||
      i.description.toLowerCase().includes(query),
  );

  if (matches.length === 0) {
    console.log(color.dim(`No matches for "${query}".`));
    return 0;
  }

  for (const item of matches) {
    const desc = item.description ? color.dim(`  ${truncate(item.description, 60)}`) : "";
    console.log(
      `${item.name.padEnd(20)} ${color.cyan(item.title.padEnd(20))} ${color.dim(item.package.padEnd(20))}${desc}`,
    );
  }
  return 0;
}

function truncate(s: string, max: number): string {
  if (s.length <= max) return s;
  return s.slice(0, max - 1) + "…";
}
