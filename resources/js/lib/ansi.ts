/**
 * ANSI SGR → styled segments, for rendering captured terminal frames as HTML.
 *
 * fancy-tui's showcase harness captures real Ink renders to ANSI. Displaying
 * those in an xterm viewport (`<Terminal>`) does not work here: xterm sizes
 * itself to a *terminal*, and these captures are snippets — a Spinner is one
 * line, 21 characters. In a viewport that is a mostly-empty black box; as a
 * `<pre>` it is exactly what the component looks like.
 *
 * Deliberately covers only what the corpus contains — the 16 basic colours,
 * their bright variants, bold / dim / italic / underline / inverse, and 256 +
 * truecolor for headroom. Cursor movement and screen clears are dropped rather
 * than emulated: a captured static frame has none, and half-emulating them
 * would render worse than ignoring them.
 */

export type AnsiSegment = {
    text: string;
    /** Inline style — colours only, so themes can restyle the rest. */
    style: Record<string, string>;
};

export type AnsiLine = AnsiSegment[];

/** xterm's default 16, in the palette the showcase site already uses. */
const BASIC = [
    "#1e222a", // black
    "#e06c75", // red
    "#98c379", // green
    "#e5c07b", // yellow
    "#61afef", // blue
    "#c678dd", // magenta
    "#56b6c2", // cyan
    "#c8ccd4", // white
];

const BRIGHT = [
    "#5c6370",
    "#ef8a92",
    "#b3d99a",
    "#f0d399",
    "#8cc4f5",
    "#d7a2e8",
    "#7fd0d9",
    "#eceff4",
];

/** The xterm 256-colour cube, computed rather than tabulated. */
function xterm256(n: number): string {
    if (n < 8) return BASIC[n];
    if (n < 16) return BRIGHT[n - 8];
    if (n < 232) {
        const i = n - 16;
        const level = (v: number) => (v === 0 ? 0 : 55 + v * 40);
        return rgb(level(Math.floor(i / 36) % 6), level(Math.floor(i / 6) % 6), level(i % 6));
    }

    const grey = 8 + (n - 232) * 10;

    return rgb(grey, grey, grey);
}

function rgb(r: number, g: number, b: number): string {
    return `rgb(${r} ${g} ${b})`;
}

type State = {
    fg: string | null;
    bg: string | null;
    bold: boolean;
    dim: boolean;
    italic: boolean;
    underline: boolean;
    inverse: boolean;
};

const INITIAL: State = { fg: null, bg: null, bold: false, dim: false, italic: false, underline: false, inverse: false };

/**
 * Apply one SGR sequence's parameters to the running state.
 *
 * Returns a new state; the caller keeps the old one for the segment already
 * emitted. Extended colour (`38;5;n`, `38;2;r;g;b`) consumes its own arguments,
 * hence the index-walking loop rather than a `forEach`.
 */
function applySgr(state: State, params: number[]): State {
    let next = { ...state };

    for (let i = 0; i < params.length; i++) {
        const p = params[i];

        if (p === 0) {
            next = { ...INITIAL };
        } else if (p === 1) {
            next.bold = true;
        } else if (p === 2) {
            next.dim = true;
        } else if (p === 3) {
            next.italic = true;
        } else if (p === 4) {
            next.underline = true;
        } else if (p === 7) {
            next.inverse = true;
        } else if (p === 22) {
            next.bold = false;
            next.dim = false;
        } else if (p === 23) {
            next.italic = false;
        } else if (p === 24) {
            next.underline = false;
        } else if (p === 27) {
            next.inverse = false;
        } else if (p >= 30 && p <= 37) {
            next.fg = BASIC[p - 30];
        } else if (p === 39) {
            next.fg = null;
        } else if (p >= 40 && p <= 47) {
            next.bg = BASIC[p - 40];
        } else if (p === 49) {
            next.bg = null;
        } else if (p >= 90 && p <= 97) {
            next.fg = BRIGHT[p - 90];
        } else if (p >= 100 && p <= 107) {
            next.bg = BRIGHT[p - 100];
        } else if (p === 38 || p === 48) {
            const target = p === 38 ? "fg" : "bg";

            if (params[i + 1] === 5) {
                next[target] = xterm256(params[i + 2] ?? 0);
                i += 2;
            } else if (params[i + 1] === 2) {
                next[target] = rgb(params[i + 2] ?? 0, params[i + 3] ?? 0, params[i + 4] ?? 0);
                i += 4;
            }
        }
    }

    return next;
}

function styleOf(state: State): Record<string, string> {
    const style: Record<string, string> = {};
    // Inverse swaps fg/bg — including the *defaults*, which is how a captured
    // frame draws a selected row without ever naming a colour.
    const fg = state.inverse ? (state.bg ?? "var(--tui-bg, #10141c)") : state.fg;
    const bg = state.inverse ? (state.fg ?? "var(--tui-fg, #c8ccd4)") : state.bg;

    if (fg) style.color = fg;
    if (bg) style.background = bg;
    if (state.bold) style.fontWeight = "600";
    if (state.dim) style.opacity = "0.6";
    if (state.italic) style.fontStyle = "italic";
    if (state.underline) style.textDecoration = "underline";

    return style;
}

/** Matches an SGR sequence; any other CSI is stripped by {@link parseAnsi}. */
const SGR = /\x1b\[([0-9;]*)m/g;
const OTHER_CSI = /\x1b\[[0-9;?]*[A-Za-z]/g;

/**
 * Split an ANSI string into lines of styled segments.
 *
 * Empty lines are preserved as empty arrays: a captured frame's blank rows are
 * layout, and collapsing them would close up the whitespace the component drew.
 */
export function parseAnsi(input: string): AnsiLine[] {
    const lines: AnsiLine[] = [];
    let state = INITIAL;
    let current: AnsiLine = [];

    const push = (text: string, at: State) => {
        if (text === "") return;

        for (const [index, part] of text.split("\n").entries()) {
            if (index > 0) {
                lines.push(current);
                current = [];
            }
            if (part !== "") current.push({ text: part, style: styleOf(at) });
        }
    };

    let last = 0;
    SGR.lastIndex = 0;

    for (let match = SGR.exec(input); match !== null; match = SGR.exec(input)) {
        push(input.slice(last, match.index).replace(OTHER_CSI, ""), state);

        const params = match[1] === "" ? [0] : match[1].split(";").map((p) => Number(p) || 0);
        state = applySgr(state, params);
        last = match.index + match[0].length;
    }

    push(input.slice(last).replace(OTHER_CSI, ""), state);
    lines.push(current);

    return lines;
}

/** Visible width of a frame, in columns — escape sequences excluded. */
export function ansiWidth(input: string): number {
    return parseAnsi(input).reduce((widest, line) => Math.max(widest, line.reduce((n, s) => n + s.text.length, 0)), 0);
}
