import { Terminal } from "@particle-academy/fancy-term";
import previews from "@particle-academy/fancy-tui/showcase/previews.json";
// Required by fancy-term: without it xterm's character-measurement helper (a
// long run of "w") renders as visible text over the output.
import "@xterm/xterm/css/xterm.css";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ComponentRef } from "react";
import {
    buildCatalogue,
    decodeKey,
    initialState,
    reduce,
    TUI_PACKAGE,
    type CapturedFrame,
    type DocsState,
    type RegistryItem,
} from "./docs-tui/model";
import { buildFrameIndex, render, renderLoading, type Size } from "./docs-tui/render";

const frames = (previews as { components: CapturedFrame[] }).components;

/**
 * The Fancy Docs TUI — the whole /fancy-tui page as a terminal application.
 *
 * This component owns nothing but state and effects: the catalogue browser is
 * a pure `(state, key) -> state` reducer in `docs-tui/model.ts` and a pure
 * `state -> ANSI` function in `docs-tui/render.ts`. `<Terminal>` is only a
 * display surface and a keystroke source.
 */
export default function DocsTui({ onExit }: { onExit: () => void }) {
    const [items, setItems] = useState<RegistryItem[] | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [state, setState] = useState<DocsState>(initialState);
    // A sane first paint; `onResize` corrects it as soon as xterm measures.
    const [size, setSize] = useState<Size>({ cols: 100, rows: 32 });

    // The registry is ~95 KB stripped — fetched here rather than shipped as a
    // page prop so the HTML view never pays for it.
    useEffect(() => {
        const controller = new AbortController();
        fetch("/fancy-tui/catalogue.json", {
            signal: controller.signal,
            headers: { Accept: "application/json" },
        })
            .then((response) => {
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}`);
                }
                return response.json() as Promise<{ items: RegistryItem[] }>;
            })
            .then((payload) => setItems(payload.items ?? []))
            .catch((cause: unknown) => {
                if (!controller.signal.aborted) {
                    setError(cause instanceof Error ? cause.message : String(cause));
                }
            });
        return () => controller.abort();
    }, []);

    const catalogue = useMemo(() => buildCatalogue(items ?? []), [items]);
    const frameIndex = useMemo(() => buildFrameIndex(frames), []);

    // Open on fancy-tui: this IS the fancy-tui page, and it's the one package
    // whose components the terminal can actually draw.
    useEffect(() => {
        if (!items) {
            return;
        }
        const index = catalogue.packages.findIndex((pkg) => pkg.name === TUI_PACKAGE);
        if (index > 0) {
            setState((current) => ({ ...current, packageIndex: index }));
        }
    }, [items, catalogue]);

    // Keystrokes arrive from xterm outside React's render cycle, so the reducer
    // reads the live state through a ref rather than a stale closure.
    const stateRef = useRef(state);
    stateRef.current = state;
    const catalogueRef = useRef(catalogue);
    catalogueRef.current = catalogue;

    const onData = useCallback(
        (data: string) => {
            const key = decodeKey(data);
            if (!key) {
                return;
            }
            const result = reduce(catalogueRef.current, stateRef.current, key);
            stateRef.current = result.state;
            setState(result.state);
            if (result.open) {
                window.open(result.open, "_blank", "noopener,noreferrer");
            }
            if (result.quit) {
                onExit();
            }
        },
        [onExit],
    );

    const onResize = useCallback((next: Size) => {
        setSize((current) => (current.cols === next.cols && current.rows === next.rows ? current : next));
    }, []);

    const output = useMemo(
        () => (items ? render(catalogue, state, frameIndex, size) : renderLoading(size, error)),
        [items, catalogue, state, frameIndex, size, error],
    );

    // Full-viewport takeover: stop the page behind it from scrolling.
    useEffect(() => {
        document.body.classList.add("ftui-takeover-active");
        return () => document.body.classList.remove("ftui-takeover-active");
    }, []);

    // A full-screen terminal app owns the keyboard from the moment it opens —
    // without this the first keystrokes go nowhere until the user clicks in.
    const terminal = useRef<ComponentRef<typeof Terminal>>(null);
    useEffect(() => {
        terminal.current?.focus();
    }, []);

    return (
        <div className="ftui-takeover" role="application" aria-label="Fancy Docs TUI">
            <div className="ftui-takeover__bar">
                <span className="ftui-takeover__dots" aria-hidden="true">
                    <i />
                    <i />
                    <i />
                </span>
                <b>fancy-docs — {size.cols}×{size.rows}</b>
                <button type="button" className="ftui-takeover__exit" onClick={onExit}>
                    Exit <kbd>q</kbd>
                </button>
            </div>
            <div className="ftui-takeover__screen">
                <Terminal
                    ref={terminal}
                    output={output}
                    onData={onData}
                    onResize={onResize}
                    fit
                    fontSize={14}
                    cursorBlink={false}
                    scrollback={0}
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
        </div>
    );
}
