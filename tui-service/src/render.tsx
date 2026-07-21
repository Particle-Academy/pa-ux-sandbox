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

export function renderFrame(
  catalogue: Catalogue,
  state: DocsState,
  cols: number,
  rows: number,
): string {
  const stdout = new FrameStdout(cols, rows) as unknown as NodeJS.WriteStream;

  const instance = inkRender(
    <DocsApp catalogue={catalogue} state={state} cols={cols} rows={rows} />,
    { stdout, debug: true, exitOnCtrlC: false, patchConsole: false },
  );

  const frame = (stdout as unknown as FrameStdout).last;

  // Tear the tree down immediately — this is a one-shot render, and a lingering
  // Ink instance keeps timers alive and leaks across requests.
  instance.unmount();
  instance.cleanup?.();

  return frame;
}

/** A minimal frame for when the catalogue could not be loaded. */
export function renderError(message: string, cols: number): string {
  const line = (text: string) => text.padEnd(cols).slice(0, cols);
  return [
    line(""),
    line("  Fancy Docs TUI"),
    line(""),
    line(`  Could not reach the registry: ${message}`),
    line("  Press q to return."),
    line(""),
  ].join("\n");
}
