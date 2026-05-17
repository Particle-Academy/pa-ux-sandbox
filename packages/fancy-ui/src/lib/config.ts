/**
 * fancy.json — the per-project config. Mirrors the schema documented at
 * https://ui.particle.academy/docs/cli.
 */
import { existsSync, promises as fs } from "node:fs";
import { resolve, join } from "node:path";

export const DEFAULT_REGISTRY = "https://ui.particle.academy";

export type FancyConfig = {
  $schema?: string;
  registry: string;
  aliases: {
    components: string;
    utils: string;
  };
  tsx: boolean;
  rsc: boolean;
  tailwind: {
    css: string;
  };
};

export const DEFAULT_CONFIG: FancyConfig = {
  $schema: "https://ui.particle.academy/schema/fancy.json",
  registry: DEFAULT_REGISTRY,
  aliases: {
    components: "@/components/fancy",
    utils: "@/lib/utils",
  },
  tsx: true,
  rsc: false,
  tailwind: { css: "src/index.css" },
};

export function configPath(cwd: string): string {
  return resolve(cwd, "fancy.json");
}

export async function loadConfig(cwd: string): Promise<FancyConfig | null> {
  const p = configPath(cwd);
  if (!existsSync(p)) return null;
  try {
    return JSON.parse(await fs.readFile(p, "utf8")) as FancyConfig;
  } catch (err) {
    throw new Error(`fancy.json is not valid JSON: ${(err as Error).message}`);
  }
}

export async function saveConfig(cwd: string, config: FancyConfig): Promise<void> {
  await fs.writeFile(configPath(cwd), JSON.stringify(config, null, 2) + "\n", "utf8");
}

/**
 * Resolve an alias like "@/components/fancy" against the user's project.
 * If the alias maps via the tsconfig (paths: { "@/*": ["./src/*"] }) we
 * resolve through it; otherwise we strip the alias prefix and place under
 * `src/`.
 */
export function resolveAliasTarget(cwd: string, alias: string): string {
  if (alias.startsWith("@/")) return resolve(cwd, "src", alias.slice(2));
  if (alias.startsWith("~/")) return resolve(cwd, "src", alias.slice(2));
  return resolve(cwd, alias);
}

export function targetForFile(cwd: string, config: FancyConfig, file: { target: string }): string {
  // file.target is registry-relative, e.g. "components/fancy/card/Card.tsx".
  // We strip the leading "components/fancy/" segment if present so the
  // alias controls the actual landing spot.
  const stripped = file.target.replace(/^components\/fancy\//, "");
  const base = resolveAliasTarget(cwd, config.aliases.components);
  return join(base, stripped);
}
