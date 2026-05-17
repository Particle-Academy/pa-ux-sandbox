import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { parseArgs, flagAsBool, flagAsString } from "../lib/args.js";
import { DEFAULT_CONFIG, DEFAULT_REGISTRY, FancyConfig, configPath, loadConfig, saveConfig } from "../lib/config.js";
import { color, ok, prompt, step, warn } from "../lib/io.js";

export async function runInit(argv: string[]): Promise<number> {
  const { flags } = parseArgs(argv, { stringOpts: ["cwd", "registry"] });
  const cwd = resolve(process.cwd(), flagAsString(flags, "cwd") ?? ".");
  const yes = flagAsBool(flags, "yes");

  const existing = await loadConfig(cwd);
  if (existing) {
    warn(`fancy.json already exists at ${configPath(cwd)} — keeping it.`);
    return 0;
  }

  step(`Initializing in ${color.dim(cwd)}`);

  const config: FancyConfig = { ...DEFAULT_CONFIG };

  if (yes) {
    if (flagAsString(flags, "registry")) {
      config.registry = flagAsString(flags, "registry")!;
    }
  } else {
    config.registry = (await prompt("Registry URL?", DEFAULT_REGISTRY)) || DEFAULT_REGISTRY;
    config.aliases.components =
      (await prompt("Where should component sources land?", DEFAULT_CONFIG.aliases.components)) ||
      DEFAULT_CONFIG.aliases.components;
    config.aliases.utils =
      (await prompt("Where should shared utilities land?", DEFAULT_CONFIG.aliases.utils)) ||
      DEFAULT_CONFIG.aliases.utils;
    config.tailwind.css =
      (await prompt("Path to your Tailwind CSS file?", DEFAULT_CONFIG.tailwind.css)) ||
      DEFAULT_CONFIG.tailwind.css;
  }

  if (!existsSync(resolve(cwd, "package.json"))) {
    warn("No package.json found — fancy-ui works best inside an npm project.");
  }

  await saveConfig(cwd, config);
  ok(`Wrote ${color.bold("fancy.json")}`);
  console.log("");
  console.log(`Next: ${color.bold("npx fancy-ui add <component>")}`);
  console.log(color.dim("e.g.  npx fancy-ui add card action tabs"));
  return 0;
}
