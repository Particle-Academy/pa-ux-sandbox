import "./force-color.js"; // MUST be first — pins chalk to truecolor before ink loads.
import { EventEmitter } from "node:events";
import React from "react";
import { render as inkRender } from "ink";
import { DocsApp } from "./app.js";

/**
 * Render the docs app to a single ANSI frame at a given terminal size.
 *
 * The live app holds its own state (selection, search, focus), so this one-shot
 * render is for tests and never the request path — the browser drives a
 * persistent session (see `session.tsx`). ink-testing-library would be the
 * obvious tool, but it hardcodes 100 columns; this drives Ink directly with a
 * stdout stub whose `columns`/`rows` we set, and `debug: true`, which makes Ink
 * write the whole frame on each flush — the clean full frame a browser terminal
 * wants.
 */

class FrameStdout extends EventEmitter {
  readonly isTTY = true;
  last = "";

  constructor(
    readonly columns: number,
    readonly rows: number,
  ) {
    super();
  }

  write = (frame: string): void => {
    this.last = frame;
  };
}

/**
 * A stdin that exists only to satisfy Ink, and never delivers a keystroke.
 *
 * Ink refuses raw mode unless `stdin.isTTY`, and the app (plus every fancy-tui
 * overlay) calls `useInput`/`useFocus` unconditionally — which throws during
 * render when raw mode is unavailable. Ink then REPLACES the whole frame with
 * its error screen, so a single such call would blank the page. This stub claims
 * raw-mode support and does nothing with it — accurate, since a one-shot render
 * never types.
 */
class FrameStdin extends EventEmitter {
  readonly isTTY = true;
  setRawMode = (): void => {};
  setEncoding = (): void => {};
  resume = (): void => {};
  pause = (): void => {};
  ref = (): void => {};
  unref = (): void => {};
  read = (): null => null;
}

/**
 * Terminate every line with CRLF on the way out.
 *
 * Ink writes `\n` because it targets a TTY, where the kernel's ONLCR turns that
 * into `\r\n`. The consumer here is xterm.js in a browser — a raw emulator with
 * no line discipline — so a bare `\n` moves DOWN a row without returning to
 * column 0 and every line starts one column further right than the last. The
 * `\r?\n` form is idempotent, so a frame that already has CRLF passes through
 * unharmed.
 */
export function crlf(frame: string): string {
  return frame.replace(/\r?\n/g, "\r\n");
}

/** Render the docs app once, at a fixed size, optionally focused on a slug and
 *  in a chosen look (Fancy vs Plain). `fancy` defaults to the app's own default. */
export function renderAppFrame(
  cols: number,
  rows: number,
  opts: { initialSlug?: string; fancy?: boolean } = {},
): string {
  const stdout = new FrameStdout(cols, rows) as unknown as NodeJS.WriteStream;
  const stdin = new FrameStdin() as unknown as NodeJS.ReadStream;

  const instance = inkRender(
    <DocsApp cols={cols} rows={rows} initialSlug={opts.initialSlug} initialFancy={opts.fancy} />,
    { stdout, stdin, debug: true, exitOnCtrlC: false, patchConsole: false },
  );

  const frame = (stdout as unknown as FrameStdout).last;

  // Tear the tree down immediately — this is a one-shot render, and a lingering
  // Ink instance keeps timers alive and leaks across renders.
  instance.unmount();
  instance.cleanup?.();

  return crlf(frame);
}
