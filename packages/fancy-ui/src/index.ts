/**
 * fancy-ui — CLI for installing Fancy UI components.
 *
 * Zero third-party deps by design. Argument parsing, output, network, file
 * I/O are all hand-rolled on Node 18+ primitives.
 *
 * Usage:
 *   fancy-ui init
 *   fancy-ui add <name...>
 *   fancy-ui list
 *   fancy-ui search <query>
 *   fancy-ui diff <name>
 */
import { runInit } from "./commands/init.js";
import { runAdd } from "./commands/add.js";
import { runList } from "./commands/list.js";
import { runSearch } from "./commands/search.js";
import { runDiff } from "./commands/diff.js";
import { color } from "./lib/io.js";

const VERSION = "0.1.0";

const HELP = `
${color.bold("fancy-ui")} ${color.dim("v" + VERSION)}
Install Fancy UI components into your project.

${color.bold("Usage:")}
  fancy-ui <command> [args...]

${color.bold("Commands:")}
  init                  Configure this project (writes fancy.json).
  add <name...>         Vendor one or more components.
  list                  List every component in the registry.
  search <query>        Search components by name/title/description.
  diff <name>           Diff your local copy against the registry.

${color.bold("Options:")}
  --registry <url>      Override the registry URL.
                        Default: https://ui.particle.academy
  --cwd <path>          Run as if invoked from this directory.
  --overwrite           Allow overwriting files that already exist (add).
  --yes, -y             Skip prompts; accept defaults.
  --help, -h            Show this help.
  --version, -v         Print version.

${color.bold("Examples:")}
  fancy-ui init
  fancy-ui add card action tabs
  fancy-ui search calendar
  fancy-ui list

Docs:    https://ui.particle.academy/docs/cli
Registry: https://ui.particle.academy/docs/registry
`.trim();

async function main(): Promise<number> {
  const argv = process.argv.slice(2);

  if (argv.length === 0 || argv[0] === "--help" || argv[0] === "-h") {
    console.log(HELP);
    return 0;
  }
  if (argv[0] === "--version" || argv[0] === "-v") {
    console.log(VERSION);
    return 0;
  }

  const command = argv[0];
  const rest = argv.slice(1);

  try {
    switch (command) {
      case "init":
        return await runInit(rest);
      case "add":
        return await runAdd(rest);
      case "list":
        return await runList(rest);
      case "search":
        return await runSearch(rest);
      case "diff":
        return await runDiff(rest);
      default:
        console.error(color.red(`Unknown command: ${command}`));
        console.error(`Run ${color.bold("fancy-ui --help")} for usage.`);
        return 1;
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(color.red(`fancy-ui: ${message}`));
    if (process.env.FANCY_UI_DEBUG && err instanceof Error && err.stack) {
      console.error(color.dim(err.stack));
    }
    return 1;
  }
}

main().then((code) => process.exit(code));
