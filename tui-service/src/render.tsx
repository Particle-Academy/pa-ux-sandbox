import { EventEmitter } from "node:events";
import React from "react";
import { render as inkRender } from "ink";
import { DocsApp } from "./app.js";
import type { Catalogue } from "./catalogue.js";
import type { DocsState } from "./model.js";

/**
 * Render the docs app to a single ANSI frame at a given terminal size.
 *
 * ink-testing-library would be the obvious tool, but it hardcodes 100 columns —
 * useless when the frame has to match a specific BROWSER terminal's grid. So
 * this drives Ink directly with a stdout stub whose `columns`/`rows` we set,
 * and `debug: true`, which makes Ink write the whole frame on each flush rather
 * than a cursor-diff — exactly the clean full frame the browser's <Terminal>
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
 * Ink refuses raw mode unless `stdin.isTTY`, and a component that calls
 * `useInput` unconditionally — every overlay in fancy-tui does, to close on
 * Escape — throws during render when it cannot get it. Ink then REPLACES the
 * whole frame with its error screen, so one such component in a live preview
 * blanked the entire page rather than degrading.
 *
 * The real process stdin is the wrong thing to hand it: this service is an HTTP
 * renderer whose keyboard arrives as JSON, and under a test runner or a daemon
 * process.stdin is not a TTY at all. So it gets a stub that claims raw-mode
 * support and does nothing with it — accurate, since nothing here ever types.
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
 * whole frame staircases off the screen.
 *
 * This is the producer's job, not the terminal's: `<Terminal>` writes its
 * `output` verbatim, which is correct, because a PTY-backed consumer already
 * sends CRLF and rewriting a raw byte stream would corrupt it. The `\r?\n`
 * form is idempotent, so a frame that already has CRLF passes through unharmed.
 */
function crlf(frame: string): string {
  return frame.replace(/\r?\n/g, "\r\n");
}

export function renderFrame(
  catalogue: Catalogue,
  state: DocsState,
  cols: number,
  rows: number,
): string {
  const stdout = new FrameStdout(cols, rows) as unknown as NodeJS.WriteStream;
  const stdin = new FrameStdin() as unknown as NodeJS.ReadStream;

  const instance = inkRender(
    <DocsApp catalogue={catalogue} state={state} cols={cols} rows={rows} />,
    { stdout, stdin, debug: true, exitOnCtrlC: false, patchConsole: false },
  );

  const frame = (stdout as unknown as FrameStdout).last;

  // Tear the tree down immediately — this is a one-shot render, and a lingering
  // Ink instance keeps timers alive and leaks across requests.
  instance.unmount();
  instance.cleanup?.();

  return crlf(frame);
}

/** A minimal frame for when the catalogue could not be loaded. */
export function renderError(message: string, cols: number): string {
  const line = (text: string) => text.padEnd(cols).slice(0, cols);
  return crlf([
    line(""),
    line("  Fancy Docs TUI"),
    line(""),
    line(`  Could not reach the registry: ${message}`),
    line("  Press q to return."),
    line(""),
  ].join("\n"));
}
