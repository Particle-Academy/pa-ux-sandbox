import { Terminal } from "@particle-academy/fancy-term";

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
