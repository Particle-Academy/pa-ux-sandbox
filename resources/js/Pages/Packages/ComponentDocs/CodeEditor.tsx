import type { ComponentDoc } from "./types";
import { CodeEditor } from "@particle-academy/fancy-code";
import { useState } from "react";

const sampleJs = `function fib(n) {
    if (n < 2) return n;
    return fib(n - 1) + fib(n - 2);
}

const out = fib(10);
console.log(out);
`;

const samplePy = `def fib(n):
    if n < 2:
        return n
    return fib(n - 1) + fib(n - 2)

print(fib(10))
`;

function CodeEditorDemo() {
    const [value, setValue] = useState(sampleJs);
    return (
        <div className="w-full max-w-2xl">
            <CodeEditor value={value} onChange={setValue} language="javascript">
                        <CodeEditor.Panel />
                    </CodeEditor>
        </div>
    );
}

const longSource = Array.from({ length: 120 }, (_, i) => `export const step${i + 1} = run(${i + 1});`).join(
    String.fromCharCode(10),
);

/** Jump between lines: each target is scrolled to the middle and banded. */
function LandOnLineDemo() {
    const [line, setLine] = useState(80);
    return (
        <div className="w-full max-w-2xl space-y-2">
            <div className="flex gap-2 text-xs">
                {[12, 47, 80, 115].map((n) => (
                    <button
                        key={n}
                        type="button"
                        onClick={() => setLine(n)}
                        className={`rounded px-2 py-1 ${n === line ? "bg-violet-600 text-white" : "bg-zinc-100 dark:bg-zinc-800"}`}
                    >
                        line {n}
                    </button>
                ))}
            </div>
            <CodeEditor
                value={longSource}
                language="javascript"
                readOnly
                maxHeight={260}
                cursorLine={line}
                cursorColumn={1}
                highlightLines={[line]}
            >
                <CodeEditor.Panel />
            </CodeEditor>
        </div>
    );
}

export const codeEditorDoc: ComponentDoc = {
    intro: (
        <p>
            Lightweight embedded code editor — custom engine, no Monaco / CodeMirror / Shiki.
            Tokenized syntax highlighting for many languages out of the box. Themes are
            switchable, languages are pluggable via <code>registerLanguage</code>.
        </p>
    ),
    examples: [
        {
            name: "Default",
            description: "Controlled — `value` + `onChange` + `language`.",
            render: () => <CodeEditorDemo />,
            code: `import { CodeEditor } from "@particle-academy/fancy-code";

const [code, setCode] = useState(\`function hello() {
    return "world";
}\`);

<CodeEditor value={code} onChange={setCode} language="javascript">
                        <CodeEditor.Panel />
                    </CodeEditor>`,
        },
        {
            name: "Language switcher",
            description: "Pair `language` + `onLanguageChange` to let the user switch via the toolbar.",
            render: () => {
                const [lang, setLang] = useState("python");
                const [value, setValue] = useState(samplePy);
                return (
                    <div className="w-full max-w-2xl">
                        <CodeEditor value={value} onChange={setValue} language={lang} onLanguageChange={setLang}>
                        <CodeEditor.Panel />
                    </CodeEditor>
                    </div>
                );
            },
            code: `const [lang, setLang] = useState("python");

<CodeEditor
    value={code}
    onChange={setCode}
    language={lang}
    onLanguageChange={setLang}>
                        <CodeEditor.Panel />
                    </CodeEditor>`,
        },
        {
            name: "Read-only",
            description: "Useful for snippet display.",
            render: () => (
                <div className="w-full max-w-2xl">
                    <CodeEditor value={sampleJs} language="javascript" readOnly>
                        <CodeEditor.Panel />
                    </CodeEditor>
                </div>
            ),
            code: `<CodeEditor value={snippet} language="typescript" readOnly>
                        <CodeEditor.Panel />
                    </CodeEditor>`,
        },
        {
            name: "Themes + line numbers",
            description: "Toggle line numbers and pick a built-in or registered theme.",
            render: () => (
                <div className="w-full max-w-2xl">
                    <CodeEditor value={sampleJs} language="javascript" theme="dark" lineNumbers>
                        <CodeEditor.Panel />
                    </CodeEditor>
                </div>
            ),
            code: `<CodeEditor
    value={code}
    onChange={setCode}
    language="javascript"
    theme="dark"
    lineNumbers>
                        <CodeEditor.Panel />
                    </CodeEditor>`,
        },
        {
            name: "Word wrap + height limits",
            render: () => (
                <div className="w-full max-w-2xl">
                    <CodeEditor value={sampleJs.repeat(3)} language="javascript" wordWrap maxHeight={180}>
                        <CodeEditor.Panel />
                    </CodeEditor>
                </div>
            ),
            code: `<CodeEditor
    value={code}
    onChange={setCode}
    language="javascript"
    wordWrap
    minHeight={120}
    maxHeight={400}>
                        <CodeEditor.Panel />
                    </CodeEditor>`,
        },
        {
            name: "Land on a line",
            description:
                "cursorLine scrolls a line to the middle of the view and puts the caret on it, on mount and whenever it changes. highlightLines bands any lines you list and bolds their gutter numbers. Together they are how a viewer opens a file at a search hit or a stack-trace line. FileViewer does both from one prop: line.",
            render: () => <LandOnLineDemo />,
            code: `<CodeEditor value={source} readOnly cursorLine={line} highlightLines={[line]}>
    <CodeEditor.Panel />
</CodeEditor>

{/* FileViewer: one prop does both. */}
<FileViewer filename="app.ts" value={source} line={line} />`,
        },
    ],
    props: [
        { name: "value", type: `string`, default: "—", description: "Controlled value. Use with `onChange`." },
        { name: "defaultValue", type: `string`, default: "—", description: "Initial value (uncontrolled)." },
        { name: "onChange", type: `(value: string) => void`, default: "—", description: "Called on every edit." },
        { name: "language", type: `string`, default: `"javascript"`, description: "Language name or alias — used to pick the tokenizer." },
        { name: "onLanguageChange", type: `(lang: string) => void`, default: "—", description: "Called when the user picks a language via the toolbar selector." },
        { name: "theme", type: `string`, default: `"auto"`, description: "`\"light\"`, `\"dark\"`, `\"auto\"`, or a custom registered theme name." },
        { name: "readOnly", type: `boolean`, default: `false`, description: "Prevent editing." },
        { name: "lineNumbers", type: `boolean`, default: `true`, description: "Show line numbers in the gutter." },
        { name: "wordWrap", type: `boolean`, default: `false`, description: "Wrap long lines instead of scrolling." },
        { name: "tabSize", type: `number`, default: `2`, description: "Tab width in spaces." },
        { name: "placeholder", type: `string`, default: "—", description: "Placeholder shown when empty." },
        { name: "minHeight", type: `number`, default: "—", description: "Minimum editor height in px." },
        { name: "maxHeight", type: `number`, default: "—", description: "Maximum editor height in px (scrolls beyond)." },
        { name: "cursorLine", type: `number`, default: "—", description: "1-based line to scroll to the middle and put the caret on — on mount and whenever it changes. Does not steal focus." },
        { name: "cursorColumn", type: `number`, default: `1`, description: "Column for `cursorLine`." },
        { name: "highlightLines", type: `number[]`, default: "—", description: "Lines to band, with bold gutter numbers. Lines outside the document are ignored." },
        { name: "className", type: `string`, default: "—", description: "Extra classes on the root wrapper." },
    ],
    notes: (
        <p className="text-xs text-zinc-600 dark:text-zinc-300">
            <strong>Extending:</strong> register custom languages via{" "}
            <code>registerLanguage()</code> and custom themes via{" "}
            <code>registerTheme()</code>. Both are exported from the package root.
        </p>
    ),
};
