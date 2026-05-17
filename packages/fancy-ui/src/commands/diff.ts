import { existsSync, promises as fs } from "node:fs";
import { resolve } from "node:path";
import { parseArgs, flagAsString } from "../lib/args.js";
import { DEFAULT_CONFIG, loadConfig, targetForFile } from "../lib/config.js";
import { RegistryClient } from "../lib/registry.js";
import { color, info, ok, step, warn } from "../lib/io.js";

export async function runDiff(argv: string[]): Promise<number> {
  const { positional, flags } = parseArgs(argv, { stringOpts: ["cwd", "registry"] });
  if (positional.length === 0) {
    console.error(color.red("Usage: fancy-ui diff <name>"));
    return 1;
  }

  const cwd = resolve(process.cwd(), flagAsString(flags, "cwd") ?? ".");
  const config = (await loadConfig(cwd)) ?? { ...DEFAULT_CONFIG };
  const registry = flagAsString(flags, "registry") ?? config.registry;
  const slug = positional[0];

  step(`Diffing ${color.bold(slug)} against ${color.dim(registry)}`);
  const client = new RegistryClient(registry);
  const item = await client.get(slug);

  let anyDiff = false;
  for (const file of item.files) {
    const target = targetForFile(cwd, config, file);
    if (!existsSync(target)) {
      warn(`missing ${displayPath(cwd, target)} — run \`fancy-ui add ${slug}\` first.`);
      anyDiff = true;
      continue;
    }
    const local = await fs.readFile(target, "utf8");
    if (local === file.content) {
      info(`${color.green("match")} ${displayPath(cwd, target)}`);
      continue;
    }
    anyDiff = true;
    console.log(`${color.yellow("diff")}  ${displayPath(cwd, target)}`);
    printUnifiedDiff(local, file.content);
  }

  if (!anyDiff) {
    ok("Local copies are identical to the registry.");
  }
  return 0;
}

function displayPath(cwd: string, abs: string): string {
  return abs.startsWith(cwd) ? abs.slice(cwd.length + 1) : abs;
}

/**
 * Minimal line-based diff (Myers-lite). Good enough for surfacing drift;
 * not a replacement for `git diff`.
 */
function printUnifiedDiff(a: string, b: string): void {
  const aLines = a.split("\n");
  const bLines = b.split("\n");
  const max = Math.max(aLines.length, bLines.length);
  for (let i = 0; i < max; i++) {
    if (aLines[i] === bLines[i]) continue;
    if (aLines[i] !== undefined) console.log(color.red(`- ${aLines[i]}`));
    if (bLines[i] !== undefined) console.log(color.green(`+ ${bLines[i]}`));
  }
}
