import "./force-color.js"; // MUST be first — pins chalk to truecolor before ink loads.
import { EventEmitter } from "node:events";
import React from "react";
import { render as inkRender } from "ink";
import { DocsApp, type AppEffect } from "./app.js";
import { crlf } from "./render.js";

/**
 * The live docs app — one persistent Ink render per viewer, streamed.
 *
 * The whole docs UI is a single React tree that holds its own navigation state
 * and receives every keystroke. Because it is always mounted, every preview is
 * alive: a Spinner spins on its own timer, an Input types as keys arrive, and a
 * long-poll pushes each new frame to the browser — a keystroke OR a timer tick.
 *
 * The cost is a stateful process where a stateless one would do. It is fenced
 * hard: a fixed cap on live sessions, idle-TTL garbage collection, and an
 * allow-list of app KINDS — a session is one of a FIXED set, never arbitrary.
 */

/** Hard ceiling on concurrent live apps. Each is one Ink instance + timers. */
export const MAX_SESSIONS = 24;
/** A session with no activity for this long is swept. */
export const SESSION_TTL_MS = 45_000;
/** How long a long-poll waits for a new frame before returning the current one. */
export const STREAM_HOLD_MS = 2_000;

/** The app kinds a session may run. The gate that keeps a session non-arbitrary. */
const APP_KINDS = new Set<string>(["docs"]);

/**
 * A stdin that DELIVERS keystrokes, unlike the one-shot render stub.
 *
 * Ink 7 reads input via the readable + `read()` pattern, not the `'data'` event
 * alone — this mirrors ink-testing-library's stdin exactly, the contract known
 * to deliver keys to `useInput`. Emitting only `'data'` (with `read()`
 * returning null) silently dropped every key. It claims raw-mode support because
 * Ink refuses `useInput` without it.
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

type Waiter = { resolve: (payload: StreamPayload) => void; timer: NodeJS.Timeout };
export type StreamPayload = { seq: number; frame: string; effects: AppEffect[] };
export type SessionInfo = { id: string; seq: number; frame: string; effects: AppEffect[] };

class AppSession {
  seq = 0;
  frame = "";
  lastActivity = Date.now();
  private readonly stdin = new SessionStdin();
  private readonly instance: ReturnType<typeof inkRender>;
  private readonly waiters = new Set<Waiter>();
  private pendingEffects: AppEffect[] = [];
  private ended = false;

  constructor(
    readonly id: string,
    readonly kind: string,
    readonly cols: number,
    readonly rows: number,
    initialSlug: string | undefined,
  ) {
    const stdout = new SessionStdout(cols, rows, (frame) => this.onFrame(frame));
    this.instance = inkRender(
      <DocsApp cols={cols} rows={rows} initialSlug={initialSlug} onEffect={(e) => this.onEffect(e)} />,
      {
        stdout: stdout as unknown as NodeJS.WriteStream,
        stdin: this.stdin as unknown as NodeJS.ReadStream,
        debug: true,
        exitOnCtrlC: false,
        patchConsole: false,
      },
    );
    // The synchronous first render has already written; make sure we hold it.
    this.frame = crlf(stdout.last);
  }

  private onFrame(frame: string): void {
    if (this.ended) return;
    this.seq++;
    this.frame = crlf(frame);
    this.wake();
  }

  /** An effect the app raised (quit / open). Delivered with the next payload,
   *  and it wakes waiters at once so `q` is never stuck behind the poll hold. */
  private onEffect(effect: AppEffect): void {
    if (this.ended) return;
    this.pendingEffects.push(effect);
    this.wake();
  }

  private drainEffects(): AppEffect[] {
    if (this.pendingEffects.length === 0) return [];
    const effects = this.pendingEffects;
    this.pendingEffects = [];
    return effects;
  }

  private wake(): void {
    if (this.waiters.size === 0) return;
    const payload: StreamPayload = { seq: this.seq, frame: this.frame, effects: this.drainEffects() };
    for (const waiter of this.waiters) {
      clearTimeout(waiter.timer);
      waiter.resolve(payload);
    }
    this.waiters.clear();
  }

  info(): SessionInfo {
    return { id: this.id, seq: this.seq, frame: this.frame, effects: this.drainEffects() };
  }

  key(data: string): SessionInfo {
    this.lastActivity = Date.now();
    if (!this.ended && data) this.stdin.feed(data);
    return this.info();
  }

  /** Long-poll: resolve as soon as a frame past `since` (or an effect) exists,
   *  else after the hold. */
  wait(since: number): Promise<StreamPayload> {
    this.lastActivity = Date.now();
    if (this.ended || this.seq > since || this.pendingEffects.length > 0) {
      return Promise.resolve({ seq: this.seq, frame: this.frame, effects: this.drainEffects() });
    }
    return new Promise<StreamPayload>((resolve) => {
      const waiter: Waiter = {
        resolve,
        timer: setTimeout(() => {
          this.waiters.delete(waiter);
          resolve({ seq: this.seq, frame: this.frame, effects: this.drainEffects() });
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
      waiter.resolve({ seq: this.seq, frame: this.frame, effects: [] });
    }
    this.waiters.clear();
    // Unmount stops the app's own timers (a Spinner's interval), which is the
    // whole point of GC — an abandoned session must not keep ticking.
    this.instance.unmount();
    this.instance.cleanup?.();
  }
}

export class SessionManager {
  private readonly sessions = new Map<string, AppSession>();
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
   * Start a live app. `kind` MUST be an allowed app kind — the allow-list that
   * keeps a session from being anything but one of a fixed set. `initialSlug`
   * only picks which showcase example is selected on mount; it never widens what
   * a session can be.
   */
  start(kind: string, cols: number, rows: number, initialSlug?: string): SessionInfo | { error: string } {
    if (!APP_KINDS.has(kind)) return { error: `unknown app: ${kind}` };

    if (this.sessions.size >= MAX_SESSIONS && !this.evictIdle()) {
      return { error: "too many live sessions; try again in a moment" };
    }

    // A monotone counter, not randomness — unguessable is not the property that
    // matters (Laravel is the auth edge), uniqueness is. Time-seeded so a
    // restart cannot collide with an id a client is still holding.
    const id = `s${Date.now().toString(36)}-${(this.counter++).toString(36)}`;
    const session = new AppSession(id, kind, cols, rows, initialSlug);
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
    let oldest: AppSession | null = null;
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
