/**
 * ANSI-aware string helpers for the Fancy Docs TUI renderer.
 *
 * Everything the renderer emits is measured in VISIBLE columns, not string
 * length — captured Ink frames are full of SGR escapes, and naive `.slice()`
 * would cut a sequence in half and leave the terminal stuck in a colour.
 */

/** Matches a CSI / SGR escape sequence. */
const ESCAPE = /\x1b\[[0-9;?]*[ -/]*[@-~]/g;

export function stripAnsi(value: string): string {
  return value.replace(ESCAPE, "");
}

/** Visible width of a string, ignoring escape sequences. */
export function width(value: string): number {
  return stripAnsi(value).length;
}

/**
 * Truncate to `max` visible columns, preserving escape sequences and closing
 * with a reset when any styling was emitted. Adds an ellipsis when it cuts.
 */
export function clip(value: string, max: number): string {
  if (max <= 0) {
    return "";
  }
  if (width(value) <= max) {
    return value;
  }

  const budget = max - 1; // room for the ellipsis
  let out = "";
  let visible = 0;
  let styled = false;

  for (let i = 0; i < value.length; i += 1) {
    if (value[i] === "\x1b") {
      const rest = value.slice(i);
      const match = /^\x1b\[[0-9;?]*[ -/]*[@-~]/.exec(rest);
      if (match) {
        out += match[0];
        styled = true;
        i += match[0].length - 1;
        continue;
      }
    }
    if (visible >= budget) {
      break;
    }
    out += value[i];
    visible += 1;
  }

  return `${out}…${styled ? RESET : ""}`;
}

/** Clip to `size` columns, then pad with spaces to exactly `size`. */
export function pad(value: string, size: number): string {
  const clipped = clip(value, size);
  return clipped + " ".repeat(Math.max(0, size - width(clipped)));
}

/** Wrap plain text (no escapes) to `size` columns on word boundaries. */
export function wrap(value: string, size: number): string[] {
  if (size <= 0) {
    return [];
  }
  const lines: string[] = [];
  for (const paragraph of value.split("\n")) {
    let line = "";
    for (const word of paragraph.split(/\s+/).filter(Boolean)) {
      if (!line) {
        line = word;
      } else if (line.length + 1 + word.length <= size) {
        line += ` ${word}`;
      } else {
        lines.push(line);
        line = word;
      }
      while (line.length > size) {
        lines.push(line.slice(0, size));
        line = line.slice(size);
      }
    }
    lines.push(line);
  }
  return lines;
}

export const RESET = "\x1b[0m";

const sgr = (code: string) => (value: string) => `\x1b[${code}m${value}${RESET}`;

export const bold = sgr("1");
export const dim = sgr("2");
export const inverse = sgr("7");
export const violet = sgr("95");
export const cyan = sgr("96");
export const green = sgr("92");
export const yellow = sgr("93");
export const grey = sgr("90");

/**
 * The start of a frame: clear the screen + scrollback, home the cursor, and
 * hide it. This app paints its own caret (an inverse space on the search line),
 * so a real block cursor parked wherever the last write ended is just noise.
 */
export const CLEAR = "\x1b[?25l\x1b[2J\x1b[3J\x1b[H";
