/**
 * argv parsing. Recognizes:
 *   --flag                       boolean
 *   --opt value | --opt=value    string
 *   -y                           short alias (declared explicitly)
 *   positional args              everything else
 */

export type ParsedArgs = {
  positional: string[];
  flags: Record<string, string | boolean>;
};

const SHORT_ALIASES: Record<string, string> = {
  y: "yes",
  v: "version",
  h: "help",
};

export function parseArgs(argv: string[], options: { stringOpts?: string[] } = {}): ParsedArgs {
  const stringOpts = new Set(options.stringOpts ?? []);
  const positional: string[] = [];
  const flags: Record<string, string | boolean> = {};

  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];

    if (a.startsWith("--")) {
      const eq = a.indexOf("=");
      if (eq !== -1) {
        flags[a.slice(2, eq)] = a.slice(eq + 1);
        continue;
      }
      const key = a.slice(2);
      if (stringOpts.has(key)) {
        flags[key] = argv[++i] ?? "";
      } else {
        flags[key] = true;
      }
      continue;
    }

    if (a.startsWith("-") && a.length > 1) {
      const short = a.slice(1);
      const key = SHORT_ALIASES[short] ?? short;
      flags[key] = true;
      continue;
    }

    positional.push(a);
  }

  return { positional, flags };
}

export function flagAsString(flags: Record<string, string | boolean>, key: string): string | undefined {
  const v = flags[key];
  if (typeof v === "string") return v;
  return undefined;
}

export function flagAsBool(flags: Record<string, string | boolean>, key: string): boolean {
  return flags[key] === true;
}
