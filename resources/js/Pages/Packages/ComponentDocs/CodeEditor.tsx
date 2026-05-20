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
            <CodeEditor value={value} onChange={setValue} language="javascript" />
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

<CodeEditor value={code} onChange={setCode} language="javascript" />`,
        },
        {
            name: "Language switcher",
            description: "Pair `language` + `onLanguageChange` to let the user switch via the toolbar.",
            render: () => {
                const [lang, setLang] = useState("python");
                const [value, setValue] = useState(samplePy);
                return (
                    <div className="w-full max-w-2xl">
                        <CodeEditor value={value} onChange={setValue} language={lang} onLanguageChange={setLang} />
                    </div>
                );
            },
            code: `const [lang, setLang] = useState("python");

<CodeEditor
    value={code}
    onChange={setCode}
    language={lang}
    onLanguageChange={setLang}
/>`,
        },
        {
            name: "Read-only",
            description: "Useful for snippet display.",
            render: () => (
                <div className="w-full max-w-2xl">
                    <CodeEditor value={sampleJs} language="javascript" readOnly />
                </div>
            ),
            code: `<CodeEditor value={snippet} language="typescript" readOnly />`,
        },
        {
            name: "Themes + line numbers",
            description: "Toggle line numbers and pick a built-in or registered theme.",
            render: () => (
                <div className="w-full max-w-2xl">
                    <CodeEditor value={sampleJs} language="javascript" theme="dark" lineNumbers />
                </div>
            ),
            code: `<CodeEditor
    value={code}
    onChange={setCode}
    language="javascript"
    theme="dark"
    lineNumbers
/>`,
        },
        {
            name: "Word wrap + height limits",
            render: () => (
                <div className="w-full max-w-2xl">
                    <CodeEditor value={sampleJs.repeat(3)} language="javascript" wordWrap maxHeight={180} />
                </div>
            ),
            code: `<CodeEditor
    value={code}
    onChange={setCode}
    language="javascript"
    wordWrap
    minHeight={120}
    maxHeight={400}
/>`,
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
