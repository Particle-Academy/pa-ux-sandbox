import { Terminal } from "@particle-academy/fancy-term";
// Required by fancy-term. Without it xterm's character-measurement helper —
// a long run of "w" it uses to size the grid — renders as visible text above
// the output, and the helper textarea sits at full opacity.
//
// Loaded from fancy-term rather than from xterm (0.6.0 added the subpath): it
// re-exports the same stylesheet via @import, so this app names no third-party
// package for a dependency it only has because fancy-term needs it.
import "@particle-academy/fancy-term/styles.css";

export default function ConsoleSurface({ output, label }: { output: string; label: string }) {
    return (
        <div className="ftui-terminal" role="region" aria-label={`${label} console preview`}>
            <Terminal
                output={output}
                readOnly
                fit
                cursorBlink={false}
                fontSize={14}
                scrollback={2_000}
                theme={{
                    background: "#090b10",
                    foreground: "#e4e4e7",
                    cursor: "#a78bfa",
                    black: "#18181b",
                    brightBlack: "#71717a",
                    cyan: "#22d3ee",
                    green: "#4ade80",
                    magenta: "#c084fc",
                    yellow: "#facc15",
                }}
            />
        </div>
    );
}
