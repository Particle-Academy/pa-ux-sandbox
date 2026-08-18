import { useEffect, useState } from "react";
import { Badge } from "@particle-academy/react-fancy";

/**
 * A code sample on a use-case page.
 *
 * Rendered twice on purpose:
 *
 *  - **On the server, a plain `<pre>`.** These pages are a sales surface and are
 *    server-rendered for exactly that reason, so the code has to arrive in the
 *    first byte where a crawler (and an agent reading the page) can see it.
 *  - **In the browser, `fancy-code`'s `CodeEditor` read-only**, which brings the
 *    real grammar — it registers Markdown, JavaScript, TypeScript, HTML, PHP,
 *    Python and Go.
 *
 * react-fancy's own `CodeView` is deliberately NOT used here: it highlights
 * `html` only and says so in its own docblock, pointing at `fancy-code` for
 * richer languages. Using it would have looked like the kit component while
 * rendering every PHP sample as grey text.
 *
 * The upgrade is loaded through a plain dynamic import rather than `React.lazy`
 * because Inertia v3 renders synchronously and cannot resolve Suspense.
 */

/** Content languages → the ids `fancy-code` actually registers. */
const GRAMMAR: Record<string, string> = {
    php: "php",
    ts: "typescript",
    tsx: "typescript",
    js: "javascript",
    jsx: "javascript",
    json: "javascript",
    blade: "html",
    // Shell has no registered grammar; plaintext is honest rather than wrong.
    bash: "plaintext",
};

export type CodeSampleData = {
    label: string;
    language: string;
    code: string;
};

export function CodeSample({ sample }: { sample: CodeSampleData }) {
    const [Editor, setEditor] = useState<null | React.ComponentType<Record<string, unknown>>>(null);
    const [EditorPanel, setEditorPanel] = useState<null | React.ComponentType<Record<string, unknown>>>(null);

    useEffect(() => {
        let active = true;
        void import("@particle-academy/fancy-code").then((m) => {
            if (!active) return;
            setEditor(() => m.CodeEditor as unknown as React.ComponentType<Record<string, unknown>>);
            setEditorPanel(() => m.CodeEditor.Panel as unknown as React.ComponentType<Record<string, unknown>>);
        });
        return () => {
            active = false;
        };
    }, []);

    const lines = sample.code.trimEnd().split("\n").length;

    return (
        <figure className="m-0 overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800">
            <figcaption className="flex items-center justify-between gap-3 border-b border-zinc-200 bg-zinc-50/80 px-3 py-2 dark:border-zinc-800 dark:bg-zinc-800/40">
                <span className="text-[12px] font-medium text-zinc-600 dark:text-zinc-300">{sample.label}</span>
                <Badge size="sm" variant="soft" color="zinc">
                    {sample.language}
                </Badge>
            </figcaption>

            {Editor && EditorPanel ? (
                // `CodeEditor` is a COMPOUND component: without `<Panel />` as a
                // child it renders its chrome and no source at all. That shipped
                // -- every sample on every use-case page was a 39px header with
                // an empty body, and the test passed because it matched the
                // section heading rather than the code.
                <Editor
                    value={sample.code.trimEnd()}
                    language={GRAMMAR[sample.language] ?? "plaintext"}
                    readOnly
                    lineNumbers={lines > 6}
                    minHeight={0}
                    maxHeight={420}
                >
                    <EditorPanel />
                </Editor>
            ) : (
                // The server pass, and the browser's first frame. Same text, no
                // highlighting — so the page never flashes empty where code goes.
                <pre className="m-0 overflow-x-auto bg-white p-3 text-[12.5px] leading-relaxed dark:bg-zinc-900">
                    <code className="font-mono">{sample.code.trimEnd()}</code>
                </pre>
            )}
        </figure>
    );
}
