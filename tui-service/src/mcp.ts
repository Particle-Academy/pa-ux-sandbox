/**
 * A minimal MCP client for the docs TUI service.
 *
 * The docs TUI browses the REAL Fancy UI MCP server — the same `list-components`
 * / `get-component` an agent calls — rather than a bespoke snapshot. This speaks
 * the JSON-RPC an agent speaks: `initialize` to open a session, then
 * `tools/call`. The server (Laravel `Mcp::web`) replies with plain JSON and a
 * `MCP-Session-Id` header, so no SSE parsing is needed.
 *
 * READ-ONLY BY CONSTRUCTION. `call()` refuses any tool not on the allowlist, so
 * this service can never invoke a mutating tool (register-showcase-project,
 * rescan-…) even if a future caller asks it to. The docs browser only ever
 * reads.
 */

/** The only tools this service is permitted to call. */
const READ_ONLY_TOOLS = new Set([
  "list-components",
  "search-components",
  "get-component",
  "list-nodes",
  "search-nodes",
  "get-node",
]);

const PROTOCOL_VERSION = "2025-06-18";

export type McpToolResult = {
  content?: Array<{ type: string; text?: string }>;
  isError?: boolean;
};

export class McpClient {
  private sessionId: string | null = null;
  private nextId = 1;

  constructor(
    private readonly endpoint: string,
    private readonly timeoutMs = 10_000,
  ) {}

  /** Open a session. Idempotent — a second call reuses the first session. */
  async connect(): Promise<void> {
    if (this.sessionId) return;

    const { body, sessionId } = await this.post({
      jsonrpc: "2.0",
      id: this.nextId++,
      method: "initialize",
      params: {
        protocolVersion: PROTOCOL_VERSION,
        capabilities: {},
        clientInfo: { name: "fancy-docs-tui", version: "1.0.0" },
      },
    });

    if (body.error) throw new Error(`MCP initialize failed: ${body.error.message}`);
    if (!sessionId) throw new Error("MCP server did not return a session id");
    this.sessionId = sessionId;
  }

  /**
   * Call a read-only tool and return its parsed JSON payload.
   *
   * Fancy MCP tools reply with their JSON encoded as a text content block, so
   * this unwraps `result.content[0].text` back into an object.
   */
  async callTool<T>(name: string, args: Record<string, unknown> = {}): Promise<T> {
    if (!READ_ONLY_TOOLS.has(name)) {
      // A guard, not an error message to surface: reaching here is a bug in the
      // caller, not a runtime condition the TUI can hit.
      throw new Error(`Refusing to call non-allowlisted MCP tool "${name}".`);
    }
    await this.connect();

    const { body } = await this.post({
      jsonrpc: "2.0",
      id: this.nextId++,
      method: "tools/call",
      params: { name, arguments: args },
    });

    if (body.error) throw new Error(`MCP ${name} failed: ${body.error.message}`);

    const result = body.result as McpToolResult | undefined;
    const text = result?.content?.find((c) => c.type === "text")?.text;
    if (text === undefined) throw new Error(`MCP ${name} returned no text content`);

    try {
      return JSON.parse(text) as T;
    } catch {
      throw new Error(`MCP ${name} returned non-JSON content`);
    }
  }

  private async post(
    payload: Record<string, unknown>,
  ): Promise<{ body: { result?: unknown; error?: { message: string } }; sessionId: string | null }> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const res = await fetch(this.endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // The server negotiates plain JSON vs SSE off Accept; offering both
          // and getting JSON back is what keeps this client free of SSE parsing.
          Accept: "application/json, text/event-stream",
          ...(this.sessionId ? { "MCP-Session-Id": this.sessionId } : {}),
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      if (!res.ok) throw new Error(`MCP HTTP ${res.status}`);

      const sessionId = res.headers.get("mcp-session-id") ?? this.sessionId;
      const body = (await res.json()) as { result?: unknown; error?: { message: string } };
      return { body, sessionId };
    } finally {
      clearTimeout(timer);
    }
  }
}
