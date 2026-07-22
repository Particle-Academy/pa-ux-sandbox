import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { readFileSync } from "node:fs";
import { sanitizeSize } from "./state.js";
import { SessionManager } from "./session.js";

/**
 * The docs TUI render service.
 *
 * The whole docs UI is ONE live Ink app per viewer (see `session.ts`): the
 * browser starts a session, streams frames over a long-poll, and forwards every
 * keystroke. There is no MCP, no catalogue, no per-keystroke reducer — the app
 * holds its own state in a persistent React tree.
 *
 * Binds 127.0.0.1 only. Laravel is the single client and the public edge — it
 * applies auth and rate limiting. A session is one of a FIXED set of app kinds;
 * nothing user-supplied becomes a shell argument, a file path, or a query.
 */

/**
 * Fall back to the app's `.env` for our own settings.
 *
 * `TUI_SERVICE_URL` is documented as a `.env` key because Laravel reads it
 * there — so `.env` is where anyone configuring this feature naturally puts
 * `TUI_SERVICE_PORT` too. A real environment variable always wins; this only
 * fills the gaps. Failure to read the file is not an error.
 */
function envFallback(key: string): string | undefined {
  if (process.env[key] !== undefined) return process.env[key];
  try {
    const url = new URL("../../.env", import.meta.url);
    const line = readFileSync(url, "utf8")
      .split(/\r?\n/)
      .find((l) => l.trimStart().startsWith(`${key}=`));
    if (!line) return undefined;
    return line.slice(line.indexOf("=") + 1).trim().replace(/^["']|["']$/g, "") || undefined;
  } catch {
    return undefined;
  }
}

const PORT = Number(envFallback("TUI_SERVICE_PORT") ?? 8790);
const HOST = "127.0.0.1";
const MAX_BODY = 64 * 1024; // a session request is tiny; anything larger is abuse.

const sessions = new SessionManager();

/** Coerce an incoming string field to a bounded string, or "". */
function asString(value: unknown, max: number): string {
  return typeof value === "string" ? value.slice(0, max) : "";
}

type SessionRequest = {
  action?: unknown;
  kind?: unknown;
  slug?: unknown;
  id?: unknown;
  key?: unknown;
  cols?: unknown;
  rows?: unknown;
};

/**
 * Start / feed / end a live session. One route, dispatched on `action`. The
 * body is untrusted: every field is coerced, the size is clamped, and the kind
 * is checked against the allow-list before a session is ever created.
 */
function handleSession(body: SessionRequest): { status: number; payload: unknown } {
  const action = asString(body.action, 16);

  if (action === "start") {
    const { cols, rows } = sanitizeSize(body.cols, body.rows);
    const kind = asString(body.kind, 32) || "docs";
    const initialSlug = asString(body.slug, 64) || undefined;
    const result = sessions.start(kind, cols, rows, initialSlug);
    if ("error" in result) return { status: 409, payload: result };
    return { status: 200, payload: result };
  }

  if (action === "key") {
    const info = sessions.key(asString(body.id, 64), asString(body.key, 64));
    if (!info) return { status: 404, payload: { error: "no such session" } };
    return { status: 200, payload: info };
  }

  if (action === "end") {
    return { status: 200, payload: { ended: sessions.end(asString(body.id, 64)) } };
  }

  return { status: 400, payload: { error: "unknown action" } };
}

function send(res: ServerResponse, status: number, payload: unknown): void {
  const body = JSON.stringify(payload);
  res.writeHead(status, {
    "Content-Type": "application/json",
    "Content-Length": Buffer.byteLength(body),
  });
  res.end(body);
}

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks: Buffer[] = [];
    req.on("data", (chunk: Buffer) => {
      size += chunk.length;
      if (size > MAX_BODY) {
        reject(new Error("body too large"));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}

const server = createServer((req, res) => {
  void (async () => {
    const url = new URL(req.url ?? "/", "http://localhost");

    if (req.method === "GET" && url.pathname === "/health") {
      send(res, 200, { ok: true });
      return;
    }

    // Long-poll: hold the request open until the session draws a new frame (a
    // keystroke OR a timer tick), raises an effect, or the hold elapses. This is
    // the animation channel — no SSE, because it has to survive Cloudflare.
    if (req.method === "GET" && url.pathname === "/session/stream") {
      const id = asString(url.searchParams.get("id"), 64);
      const since = Number(url.searchParams.get("since") ?? 0);
      const pending = sessions.wait(id, Number.isFinite(since) ? since : 0);
      if (!pending) {
        send(res, 404, { error: "no such session" });
        return;
      }
      send(res, 200, await pending);
      return;
    }

    if (req.method === "POST" && url.pathname === "/session") {
      try {
        const raw = await readBody(req);
        const body = raw ? (JSON.parse(raw) as SessionRequest) : {};
        const { status, payload } = handleSession(body);
        send(res, status, payload);
      } catch (err) {
        send(res, 400, { error: err instanceof Error ? err.message : String(err) });
      }
      return;
    }

    send(res, 404, { error: "not found" });
  })();
});

server.listen(PORT, HOST, () => {
  // eslint-disable-next-line no-console
  console.log(`fancy docs TUI service on http://${HOST}:${PORT}`);
});
