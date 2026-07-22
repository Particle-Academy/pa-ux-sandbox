import { EventEmitter } from "node:events";
import React from "react";
import { render as inkRender, Box, Text } from "ink";
import { FancyTuiProvider } from "@particle-academy/fancy-tui";
import { findShowcaseExample, type ShowcaseExample } from "@particle-academy/fancy-tui/showcase";
import { crlf } from "./render.js";

/**
 * Interactive preview sessions — the "alive" half of the docs TUI.
 *
 * The navigation model (home/family/detail) stays a pure stateless function:
 * one key in, one frame out, no session. This is the deliberate exception. A
 * component preview cannot be alive under request/response — a Spinner captured
 * once is frozen at frame 0, and a controlled component fed keys does nothing
 * unless something holds its state between requests.
 *
 * So a preview is a PERSISTENT Ink render, held server-side, that:
 *   - receives keystrokes on its own stdin, so its `useInput`/`useFocus` fire;
 *   - re-renders on its own timers, so a Spinner spins with no input;
 *   - pushes each new frame to a long-poll waiter, so the browser animates.
 *
 * The cost is a stateful process where there was none. It is fenced hard:
 * a fixed cap on live sessions, idle-TTL garbage collection, and a slug that
 * must name one of a FIXED set of showcase examples — never user code.
 */

/** Hard ceiling on concurrent live previews. Each is one Ink instance + timers. */
export const MAX_SESSIONS = 24;
/** A session with no activity for this long is swept. */
export const SESSION_TTL_MS = 45_000;
/** How long a long-poll waits for a new frame before returning the current one. */
export const STREAM_HOLD_MS = 2_000;

/**
 * A stdin that DELIVERS keystrokes, unlike the render stub.
 *
 * Ink's `useInput` listens for `'data'` on the stdin it was given; in raw mode
 * it parses escape sequences itself. So feeding the raw bytes the browser's
 * xterm produced (`\x1b[C` for a right arrow, a bare char for a letter) is
 * exactly what a real terminal would hand Ink. It claims raw-mode support
 * because Ink refuses `useInput` without it.
 */
class SessionStdin extends EventEmitter {
  readonly isTTY = true;
  private buffered: string | null = null;
  setRawMode = (): void => {};
  setEncoding = (): void => {};
  resume = (): void => {};
  pause = (): void => {};
  ref = (): void => {};
  unref = (): void => {};

  // Ink 7 reads input via the readable + `read()` pattern, not the `'data'`
  // event alone — this mirrors ink-testing-library's stdin exactly, which is
  // the contract known to deliver keystrokes to `useInput`. Emitting only
  // `'data'` (with `read()` returning null) silently dropped every key.
  read = (): string | null => {
    const data = this.buffered;
    this.buffered = null;
    return data;
  };

  feed(data: string): void {
    this.buffered = data;
    this.emit("readable");
    this.emit("data", data);
  }
}

/** A stdout that captures each rendered frame and notifies on every write. */
class SessionStdout extends EventEmitter {
  readonly isTTY = true;
  last = "";

  constructor(
    readonly columns: number,
    readonly rows: number,
    private readonly onWrite: (frame: string) => void,
  ) {
    super();
  }

  write = (frame: string): void => {
    this.last = frame;
    this.onWrite(frame);
  };
}

/**
 * The frame the preview draws: the live example, clipped to the pane, with a
 * thin hint line. The example is the ONLY focusable thing on screen, so its
 * auto-focus wins with no competition — keys land where they should.
 */
function PreviewHost({ node, cols, rows }: { node: React.ReactNode; cols: number; rows: number }) {
  // One row for the hint, the rest for the component. It is clipped, never
  // allowed to push past the pane — the same fit invariant the whole UI holds.
  const bodyRows = Math.max(1, rows - 1);
  return (
    <FancyTuiProvider width={cols} height={rows}>
      <Box flexDirection="column" width={cols} height={rows}>
        <Box width={cols} height={bodyRows} overflow="hidden" flexDirection="column">
          <Box flexShrink={0} flexDirection="column">{node}</Box>
        </Box>
        <Box flexShrink={0}>
          <Text dimColor>{" [esc] back · live — type to interact".slice(0, cols)}</Text>
        </Box>
      </Box>
    </FancyTuiProvider>
  );
}

type Waiter = { resolve: (payload: StreamPayload) => void; timer: NodeJS.Timeout };
export type StreamPayload = { seq: number; frame: string };
export type SessionInfo = { id: string; seq: number; frame: string };

class PreviewSession {
  seq = 0;
  frame = "";
  lastActivity = Date.now();
  private readonly stdin = new SessionStdin();
  private readonly instance: ReturnType<typeof inkRender>;
  private readonly waiters = new Set<Waiter>();
  private ended = false;

  constructor(
    readonly id: string,
    readonly slug: string,
    readonly cols: number,
    readonly rows: number,
    example: ShowcaseExample,
  ) {
    const stdout = new SessionStdout(cols, rows, (frame) => this.onFrame(frame));
    this.instance = inkRender(<PreviewHost node={example.node} cols={cols} rows={rows} />, {
      stdout: stdout as unknown as NodeJS.WriteStream,
      stdin: this.stdin as unknown as NodeJS.ReadStream,
      debug: true,
      exitOnCtrlC: false,
      patchConsole: false,
    });
    // The synchronous first render has already written; make sure we have it
    // even if the component drew nothing yet.
    this.frame = crlf(stdout.last);
  }

  private onFrame(frame: string): void {
    if (this.ended) return;
    this.seq++;
    this.frame = crlf(frame);
    // Wake everyone waiting; a fresh frame is a fresh frame for all of them.
    for (const waiter of this.waiters) {
      clearTimeout(waiter.timer);
      waiter.resolve({ seq: this.seq, frame: this.frame });
    }
    this.waiters.clear();
  }

  info(): SessionInfo {
    return { id: this.id, seq: this.seq, frame: this.frame };
  }

  key(data: string): SessionInfo {
    this.lastActivity = Date.now();
    if (!this.ended && data) this.stdin.feed(data);
    return this.info();
  }

  /** Long-poll: resolve as soon as a frame past `since` exists, else after the hold. */
  wait(since: number): Promise<StreamPayload> {
    this.lastActivity = Date.now();
    if (this.ended || this.seq > since) {
      return Promise.resolve({ seq: this.seq, frame: this.frame });
    }
    return new Promise<StreamPayload>((resolve) => {
      const waiter: Waiter = {
        resolve,
        timer: setTimeout(() => {
          this.waiters.delete(waiter);
          resolve({ seq: this.seq, frame: this.frame });
        }, STREAM_HOLD_MS),
      };
      this.waiters.add(waiter);
    });
  }

  end(): void {
    if (this.ended) return;
    this.ended = true;
    for (const waiter of this.waiters) {
      clearTimeout(waiter.timer);
      waiter.resolve({ seq: this.seq, frame: this.frame });
    }
    this.waiters.clear();
    // Unmount stops the component's own timers (a Spinner's interval), which is
    // the whole point of GC — an abandoned session must not keep ticking.
    this.instance.unmount();
    this.instance.cleanup?.();
  }
}

export class SessionManager {
  private readonly sessions = new Map<string, PreviewSession>();
  private counter = 0;
  private readonly sweeper: NodeJS.Timeout;

  constructor() {
    this.sweeper = setInterval(() => this.sweep(), SESSION_TTL_MS / 3);
    this.sweeper.unref?.();
  }

  /** Live session count — for tests and diagnostics. */
  get size(): number {
    return this.sessions.size;
  }

  /**
   * Start a preview. The slug MUST resolve to a known showcase example — this is
   * the allow-list that keeps a session from being anything but one of a fixed
   * set of components. A scrollback example is refused: it cannot be windowed.
   */
  start(slug: string, cols: number, rows: number): SessionInfo | { error: string } {
    const example = findShowcaseExample(slug);
    if (!example) return { error: `unknown preview: ${slug}` };
    if (example.scrollback) return { error: `preview is not interactive: ${slug}` };

    if (this.sessions.size >= MAX_SESSIONS && !this.evictIdle()) {
      return { error: "too many live previews; try again in a moment" };
    }

    // A monotone counter, not randomness — unguessable is not the property that
    // matters (Laravel is the auth edge), uniqueness is. Time-seeded so a
    // restart cannot collide with an id a client is still holding.
    const id = `s${Date.now().toString(36)}-${(this.counter++).toString(36)}`;
    const session = new PreviewSession(id, slug, cols, rows, example);
    this.sessions.set(id, session);
    return session.info();
  }

  key(id: string, data: string): SessionInfo | null {
    return this.sessions.get(id)?.key(data) ?? null;
  }

  wait(id: string, since: number): Promise<StreamPayload> | null {
    return this.sessions.get(id)?.wait(since) ?? null;
  }

  end(id: string): boolean {
    const session = this.sessions.get(id);
    if (!session) return false;
    session.end();
    this.sessions.delete(id);
    return true;
  }

  /** Drop the least-recently-used idle session; returns whether one was freed. */
  private evictIdle(): boolean {
    let oldest: PreviewSession | null = null;
    const now = Date.now();
    for (const session of this.sessions.values()) {
      // Only evict something actually idle — never yank a session a viewer is
      // mid-interaction with just because the cap was hit.
      if (now - session.lastActivity < 1_000) continue;
      if (!oldest || session.lastActivity < oldest.lastActivity) oldest = session;
    }
    if (!oldest) return false;
    this.end(oldest.id);
    return true;
  }

  private sweep(): void {
    const now = Date.now();
    for (const [id, session] of this.sessions) {
      if (now - session.lastActivity > SESSION_TTL_MS) this.end(id);
    }
  }

  /** For a clean shutdown / test teardown. */
  destroy(): void {
    clearInterval(this.sweeper);
    for (const id of [...this.sessions.keys()]) this.end(id);
  }
}
