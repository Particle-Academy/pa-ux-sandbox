import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { McpClient } from "./mcp.js";
import { CatalogueCache } from "./catalogue.js";
import { reduce, initialState, type DocsState, type Effect } from "./model.js";
import { decodeKey } from "./keys.js";
import { sanitizeState, sanitizeSize } from "./state.js";
import { renderFrame, renderError } from "./render.js";

/**
 * The docs TUI render service.
 *
 * A pure function behind HTTP: `(state, key, size) -> (state, frame, effects)`.
 * It runs the real fancy-tui Ink app and browses the real MCP server, but it
 * holds NO session and spawns NO process. The browser owns the navigation
 * state and sends it with every keystroke; there is nothing here for a request
 * to escape into.
 *
 * Binds 127.0.0.1 only. Laravel is the single client and the public edge — it
 * applies auth and rate limiting. Nothing user-supplied becomes a shell
 * argument, a file path, or a query: the reducer only walks an in-memory
 * catalogue, and incoming state is coerced to sane values before it is used.
 */

const PORT = Number(process.env.TUI_SERVICE_PORT ?? 8790);
const HOST = "127.0.0.1";
const MCP_URL = process.env.TUI_MCP_URL ?? "http://127.0.0.1:8000/mcp";
const MAX_BODY = 64 * 1024; // navigation state is tiny; anything larger is abuse.

const mcp = new McpClient(MCP_URL);
const catalogue = new CatalogueCache(mcp);

type RenderRequest = {
  state?: unknown;
  key?: unknown;
  cols?: unknown;
  rows?: unknown;
};

type RenderResponse = {
  state: DocsState;
  frame: string;
  effects: Effect[];
};

async function handleRender(body: RenderRequest): Promise<RenderResponse> {
  const { cols, rows } = sanitizeSize(body.cols, body.rows);
  let state = sanitizeState(body.state);
  let effects: Effect[] = [];

  const cat = await catalogue.get(Date.now());

  // A keystroke advances the model; its absence is a plain repaint (first load,
  // or a resize). Only a single-character string is a key — anything else is
  // ignored rather than trusted.
  if (typeof body.key === "string" && body.key.length > 0) {
    const key = decodeKey(body.key);
    if (key) {
      const result = reduce(cat, state, key);
      state = result.state;
      effects = result.effects;
    }
  }

  return { state, frame: renderFrame(cat, state, cols, rows), effects };
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
    if (req.method === "GET" && req.url === "/health") {
      send(res, 200, { ok: true });
      return;
    }

    if (req.method !== "POST" || req.url !== "/render") {
      send(res, 404, { error: "not found" });
      return;
    }

    try {
      const raw = await readBody(req);
      const body = raw ? (JSON.parse(raw) as RenderRequest) : {};
      send(res, 200, await handleRender(body));
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      // Render the error INTO a frame so the terminal shows something legible
      // rather than the browser having to invent an error screen.
      const { cols } = sanitizeSize((req as { cols?: number }).cols, undefined);
      send(res, 200, { state: initialState, frame: renderError(message, cols), effects: [] });
    }
  })();
});

server.listen(PORT, HOST, () => {
  // eslint-disable-next-line no-console
  console.log(`fancy docs TUI service on http://${HOST}:${PORT} (MCP: ${MCP_URL})`);
});
