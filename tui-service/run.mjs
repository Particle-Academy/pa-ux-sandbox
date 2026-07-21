/**
 * Launcher for the docs TUI render service.
 *
 * Exists for one reason: `NODE_EXTRA_CA_CERTS` is read by Node at STARTUP, so
 * the service cannot fix its own TLS trust from inside itself. Serving the app
 * over Herd/Valet means the MCP endpoint is `https://something.test`, whose
 * certificate Node does not trust — and the failure surfaces in the terminal as
 * the thoroughly unhelpful `Could not reach the registry: fetch failed`.
 *
 * So this sets the variable and then spawns the real service. It supplies the
 * correct trust anchor; it never disables verification.
 *
 * Auto-detection is deliberately scoped to `.test` hosts. A deployed app has a
 * real certificate, so production never trips any of this — it just execs the
 * service straight through.
 */
import { spawn } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { homedir } from "node:os";
import { join } from "node:path";

/** The app root, where `.env` lives. */
const ROOT = new URL("../", import.meta.url);
/** This service's own directory, where `src/` lives. */
const HERE = new URL("./", import.meta.url);

/** Read a key from the app's `.env`, mirroring the service's own fallback. */
function fromEnvFile(key) {
  try {
    const line = readFileSync(new URL(".env", ROOT), "utf8")
      .split(/\r?\n/)
      .find((l) => l.trimStart().startsWith(`${key}=`));
    if (!line) return undefined;
    return line.slice(line.indexOf("=") + 1).trim().replace(/^["']|["']$/g, "") || undefined;
  } catch {
    return undefined;
  }
}

/** Where Herd (Windows) and Valet (macOS/Linux) keep their self-signed CA. */
const CA_CANDIDATES = [
  join(homedir(), ".config", "herd", "config", "valet", "CA", "LaravelValetCASelfSigned.crt"),
  join(homedir(), ".config", "valet", "CA", "LaravelValetCASelfSigned.pem"),
  join(homedir(), ".config", "valet", "CA", "LaravelValetCASelfSigned.crt"),
];

function resolveCa() {
  if (process.env.NODE_EXTRA_CA_CERTS) return undefined; // caller knows best.

  const explicit = process.env.TUI_MCP_CA_FILE ?? fromEnvFile("TUI_MCP_CA_FILE");
  if (explicit) return existsSync(explicit) ? explicit : undefined;

  // Only for a local `.test` host over https — never for a real deployment.
  const mcp = process.env.TUI_MCP_URL ?? fromEnvFile("TUI_MCP_URL") ?? "";
  let host;
  try {
    const url = new URL(mcp);
    if (url.protocol !== "https:") return undefined;
    host = url.hostname;
  } catch {
    return undefined;
  }
  if (!host.endsWith(".test") && host !== "localhost") return undefined;

  return CA_CANDIDATES.find((p) => existsSync(p));
}

const ca = resolveCa();
const env = { ...process.env };
if (ca) {
  env.NODE_EXTRA_CA_CERTS = ca;
  console.log(`[tui-service] trusting local CA for a .test host: ${ca}`);
}

const child = spawn(
  process.execPath,
  [
    fileURLToPath(new URL("../node_modules/tsx/dist/cli.mjs", import.meta.url)),
    fileURLToPath(new URL("src/server.ts", HERE)),
  ],
  { stdio: "inherit", env },
);

/**
 * Pass shutdown signals down to the real server.
 *
 * Supervisor signals only the process it spawned — this launcher. Without
 * forwarding, `supervisorctl restart` stops the launcher while the server keeps
 * running and keeps port 8790, so the restart cannot rebind: supervisor reports
 * success, the old code carries on serving, and a deploy silently does nothing.
 * The same orphaning is what left a stale process holding the port locally.
 */
for (const signal of ["SIGTERM", "SIGINT", "SIGHUP"]) {
  process.on(signal, () => {
    if (!child.killed) child.kill(signal);
  });
}

child.on("exit", (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  else process.exit(code ?? 0);
});
