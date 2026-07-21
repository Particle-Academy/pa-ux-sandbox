import type { Key } from "./model.js";

/**
 * Translate a raw xterm keystroke into a key the reducer understands.
 *
 * The browser sends the exact bytes xterm produced. Anything unrecognised
 * returns null so a stray escape sequence never types garbage into search.
 */
export function decodeKey(data: string): Key | null {
  switch (data) {
    case "\x1b[A": return { type: "up" };
    case "\x1b[B": return { type: "down" };
    case "\x1b[C": return { type: "right" };
    case "\x1b[D": return { type: "left" };
    case "\x1b[5~": return { type: "pageUp" };
    case "\x1b[6~": return { type: "pageDown" };
    case "\r": case "\n": return { type: "enter" };
    case "\x1b": return { type: "escape" };
    case "\x7f": case "\b": return { type: "backspace" };
    default:
      if (data.length === 1 && data >= " " && data !== "\x7f") return { type: "char", value: data };
      return null;
  }
}
