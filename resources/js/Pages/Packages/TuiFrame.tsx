import { useMemo } from "react";
import { ansiWidth, parseAnsi } from "../../lib/ansi";

/**
 * A captured fancy-tui frame, rendered as a terminal tile.
 *
 * `fancy-tui` renders to a terminal, so its previews cannot be React — they are
 * ANSI, captured from real Ink renders by the package's own `npm run showcase`
 * harness. This paints that ANSI as styled text rather than mounting an xterm:
 * the captures are snippets (a Spinner is one line, 21 characters) and an xterm
 * viewport would frame each one in a mostly-empty black box.
 *
 * The frame is scaled to fit its tile instead of wrapped or clipped. Wrapping
 * destroys a terminal frame — box-drawing characters are positional, so a
 * wrapped border lands in the middle of the next row — and clipping hides the
 * right-hand side of every wide component.
 */
export default function TuiFrame({ frame, columns = 68 }: { frame: string; columns?: number }) {
    const lines = useMemo(() => parseAnsi(frame), [frame]);
    // The declared column count is the harness's viewport, not the drawing:
    // most components render far narrower than the terminal they were captured
    // in, and scaling to the viewport would shrink every one of them to nothing.
    const width = useMemo(() => Math.max(ansiWidth(frame), 1), [frame]);

    return (
        <div className="tui-frame" style={{ ["--tui-cols" as string]: Math.min(width, columns) }}>
            <pre className="tui-frame__pre" aria-label="Captured terminal frame">
                {lines.map((line, row) => (
                    // Frames are static captures, so index keys are stable by
                    // construction — there is no reorder to survive.
                    <div key={row} className="tui-frame__row">
                        {line.length === 0
                            ? " "
                            : line.map((segment, index) => (
                                  <span key={index} style={segment.style}>
                                      {segment.text}
                                  </span>
                              ))}
                    </div>
                ))}
            </pre>
        </div>
    );
}
