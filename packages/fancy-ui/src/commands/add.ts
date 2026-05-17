import { existsSync, promises as fs } from "node:fs";
import { dirname, resolve } from "node:path";
import { execSync } from "node:child_process";
import { parseArgs, flagAsBool, flagAsString } from "../lib/args.js";
import { DEFAULT_CONFIG, FancyConfig, loadConfig, targetForFile } from "../lib/config.js";
import { RegistryClient, RegistryItem } from "../lib/registry.js";
import { color, info, ok, step, warn } from "../lib/io.js";

export async function runAdd(argv: string[]): Promise<number> {
  const { positional, flags } = parseArgs(argv, { stringOpts: ["cwd", "registry"] });
  if (positional.length === 0) {
    console.error(color.red("Usage: fancy-ui add <name...>"));
    return 1;
  }

  const cwd = resolve(process.cwd(), flagAsString(flags, "cwd") ?? ".");
  const overwrite = flagAsBool(flags, "overwrite");

  const config = (await loadConfig(cwd)) ?? { ...DEFAULT_CONFIG };
  if (!(await fileExists(resolve(cwd, "fancy.json")))) {
    warn("No fancy.json found. Using defaults — run `fancy-ui init` to lock in your conventions.");
  }

  const registry = flagAsString(flags, "registry") ?? config.registry;
  const client = new RegistryClient(registry);

  step(`Resolving ${color.bold(positional.join(", "))} from ${color.dim(registry)}`);

  const items = await client.resolve(positional);
  info(`Resolved ${items.length} component${items.length === 1 ? "" : "s"} including dependencies.`);

  // Apply writes — in topological order so registryDependencies land first.
  let written = 0;
  let skipped = 0;
  for (const item of items) {
    for (const file of item.files) {
      const target = targetForFile(cwd, config, file);
      if (existsSync(target) && !overwrite) {
        info(`${color.yellow("skip")} ${displayPath(cwd, target)} ${color.dim("(exists; pass --overwrite to replace)")}`);
        skipped++;
        continue;
      }
      await fs.mkdir(dirname(target), { recursive: true });
      await fs.writeFile(target, file.content, "utf8");
      info(`${color.green("write")} ${displayPath(cwd, target)}`);
      written++;
    }
  }

  // Aggregate npm deps across the resolved set, dedupe, install missing.
  const allDeps = dedupe(items.flatMap((i) => i.dependencies));
  if (allDeps.length > 0) {
    const missing = await missingNpmDeps(cwd, allDeps);
    if (missing.length === 0) {
      info(`All ${allDeps.length} npm dep${allDeps.length === 1 ? "" : "s"} already installed.`);
    } else {
      step(`Installing ${missing.length} npm dependenc${missing.length === 1 ? "y" : "ies"}: ${color.bold(missing.join(" "))}`);
      try {
        execSync(`npm install ${missing.join(" ")}`, { cwd, stdio: "inherit" });
      } catch {
        warn("npm install failed — install the deps above manually.");
      }
    }
  }

  console.log("");
  ok(`Done. ${written} file${written === 1 ? "" : "s"} written, ${skipped} skipped.`);
  console.log(color.dim("Import from your aliases, e.g. `import { Card } from \"@/components/fancy/card\"`."));
  return 0;
}

function dedupe<T>(xs: T[]): T[] {
  return Array.from(new Set(xs));
}

async function fileExists(path: string): Promise<boolean> {
  try {
    await fs.access(path);
    return true;
  } catch {
    return false;
  }
}

function displayPath(cwd: string, abs: string): string {
  return abs.startsWith(cwd) ? abs.slice(cwd.length + 1) : abs;
}

async function missingNpmDeps(cwd: string, deps: string[]): Promise<string[]> {
  const pkgPath = resolve(cwd, "package.json");
  if (!existsSync(pkgPath)) return deps;
  try {
    const pkg = JSON.parse(await fs.readFile(pkgPath, "utf8")) as {
      dependencies?: Record<string, string>;
      devDependencies?: Record<string, string>;
      peerDependencies?: Record<string, string>;
    };
    const present = new Set([
      ...Object.keys(pkg.dependencies ?? {}),
      ...Object.keys(pkg.devDependencies ?? {}),
      ...Object.keys(pkg.peerDependencies ?? {}),
    ]);
    return deps.filter((d) => !present.has(d));
  } catch {
    return deps;
  }
}
