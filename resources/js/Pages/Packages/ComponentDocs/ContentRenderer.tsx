import { useEffect, useRef, useState } from "react";
import type { ComponentDoc } from "./types";
import { Button, ContentRenderer, Switch, Text } from "@particle-academy/react-fancy";
import type { ContentClipboardPayload, ContentCopyEvent } from "@particle-academy/react-fancy";

const COPYABLE = `Install it, then check the version:

\`\`\`bash
npm install @particle-academy/react-fancy
\`\`\`

| Package | Version |
|---|---|
| react-fancy | 5.71.0 |
| agent-integrations | 0.51.0 |
`;

function CopyButtonsDemo() {
    const [tables, setTables] = useState(true);
    const [events, setEvents] = useState<ContentCopyEvent[]>([]);

    return (
        <div className="w-full space-y-2">
            <Switch label="Copy buttons on tables" checked={tables} onCheckedChange={setTables} />
            <div className="prose prose-sm dark:prose-invert">
                <ContentRenderer
                    value={COPYABLE}
                    format="markdown"
                    copyButtons={{ code: true, table: tables }}
                    onCopy={(e) => setEvents((all) => [e, ...all].slice(0, 3))}
                />
            </div>
            <Text size="xs" className="!text-zinc-500">
                {events.length === 0
                    ? "onCopy has not fired yet. Copy the code or the table."
                    : events.map((e) => `onCopy: ${e.kind} #${e.index}, ${e.ok ? "ok" : "failed"}, ${e.text.length} chars`).join(" | ")}
            </Text>
        </div>
    );
}

function ClipboardWriterDemo() {
    const [refuse, setRefuse] = useState(false);
    const [held, setHeld] = useState<ContentClipboardPayload | null>(null);

    return (
        <div className="w-full space-y-2">
            <Switch label="The host clipboard refuses (returns false)" checked={refuse} onCheckedChange={setRefuse} />
            <div className="prose prose-sm dark:prose-invert">
                <ContentRenderer
                    value={COPYABLE}
                    format="markdown"
                    clipboardWriter={(payload) => {
                        if (refuse) return false;
                        setHeld(payload);
                        return true;
                    }}
                />
            </div>
            <Text size="xs" className="!text-zinc-500">
                {held === null ? "The host clipboard is empty." : `Host clipboard (${held.kind}, TSV for tables):`}
            </Text>
            {held !== null && (
                <ContentRenderer value={"```\n" + held.text + "\n```"} format="markdown" copyButtons={false} />
            )}
        </div>
    );
}

const STREAM = [
    "Here is the fix:\n\n",
    "```ts\nconst total = items\n",
    "    .map((i) => i.price)\n",
    "    .reduce((a, b) => a + b, 0);\n",
    "```\n\nThat sums every price.",
];

function StreamingDemo() {
    const [chunks, setChunks] = useState(STREAM.length);
    const timer = useRef<number | null>(null);

    useEffect(() => () => {
        if (timer.current !== null) window.clearInterval(timer.current);
    }, []);

    const start = () => {
        if (timer.current !== null) window.clearInterval(timer.current);
        setChunks(0);
        timer.current = window.setInterval(() => {
            setChunks((n) => {
                if (n + 1 >= STREAM.length && timer.current !== null) {
                    window.clearInterval(timer.current);
                    timer.current = null;
                }
                return Math.min(n + 1, STREAM.length);
            });
        }, 900);
    };

    const value = STREAM.slice(0, chunks).join("");
    const live = chunks < STREAM.length;

    return (
        <div className="w-full space-y-3">
            <Button size="sm" color="zinc" onClick={start} disabled={live}>
                {live ? `Streaming… ${chunks}/${STREAM.length}` : "Stream the reply"}
            </Button>
            <div className="grid gap-3 md:grid-cols-2">
                <div>
                    <Text size="xs" className="mb-1 !text-zinc-500">
                        streaming (true): the open fence is held back
                    </Text>
                    <div className="prose prose-sm min-h-40 dark:prose-invert">
                        <ContentRenderer value={value} format="markdown" streaming={live} />
                    </div>
                </div>
                <div>
                    <Text size="xs" className="mb-1 !text-zinc-500">
                        streaming="progressive": it shows as it fills, no copy button until it closes
                    </Text>
                    <div className="prose prose-sm min-h-40 dark:prose-invert">
                        <ContentRenderer value={value} format="markdown" streaming={live ? "progressive" : false} />
                    </div>
                </div>
            </div>
        </div>
    );
}

const markdown = `# Welcome

This is **markdown** with a [link](#) and \`inline code\`.

- Bullet one
- Bullet two

\`\`\`js
const x = 1;
\`\`\`
`;

const html = `<h1>Welcome</h1>
<p>This is <strong>HTML</strong> with a <a href="#">link</a>.</p>
<ul><li>Bullet one</li><li>Bullet two</li></ul>`;

export const contentRendererDoc: ComponentDoc = {
    intro: (
        <p>
            Render markdown or HTML to the page with the Fancy aesthetic. By default it
            sanitizes the input (strips <code>&lt;script&gt;</code>,
            <code>&lt;iframe&gt;</code>, <code>javascript:</code> hrefs, event handlers), so it's
            safe for untrusted user content. Extensions plug in custom renderers for
            shortcodes and embeds.
        </p>
    ),
    examples: [
        {
            name: "Markdown",
            description: "`format=\"markdown\"` parses CommonMark.",
            render: () => (
                <div className="prose prose-sm dark:prose-invert">
                    <ContentRenderer value={markdown} format="markdown" />
                </div>
            ),
            code: `const markdown = \`# Welcome
This is **markdown** with a [link](/) and \\\`inline code\\\`.\`;

<ContentRenderer value={markdown} format="markdown" />`,
        },
        {
            name: "HTML",
            description: "`format=\"html\"` renders pre-parsed HTML — still sanitized.",
            render: () => (
                <div className="prose prose-sm dark:prose-invert">
                    <ContentRenderer value={html} format="html" />
                </div>
            ),
            code: `const html = "<h1>Welcome</h1><p>This is <strong>HTML</strong>.</p>";

<ContentRenderer value={html} format="html" />`,
        },
        {
            name: "Auto-detect",
            description: "`format=\"auto\"` sniffs the content — markdown if it has heading / list markers, HTML otherwise.",
            render: () => (
                <div className="prose prose-sm dark:prose-invert">
                    <ContentRenderer value="**Auto-detected** as markdown." format="auto" />
                </div>
            ),
            code: `<ContentRenderer value={userInput} format="auto" />`,
        },
        {
            name: "Custom line spacing",
            description: "Tune paragraph spacing to match your typography.",
            render: () => (
                <div className="prose prose-sm dark:prose-invert">
                    <ContentRenderer value={markdown} format="markdown" lineSpacing={1.8} />
                </div>
            ),
            code: `<ContentRenderer value={markdown} format="markdown" lineSpacing={1.8} />`,
        },
        {
            name: "Copy buttons, and onCopy",
            description:
                "Every code block and table gets a copy button by default. Code copies exactly what is between the fences; a table copies as TSV. copyButtons={false} turns them off, or per kind with { table: false }. onCopy reports each copy: kind, index, text, html and ok. Turn table buttons off with the switch, then copy something.",
            render: () => <CopyButtonsDemo />,
            code: `<ContentRenderer
    value={markdown}
    format="markdown"
    copyButtons={{ code: true, table: false }}
    onCopy={(e) => analytics.track("copy", { kind: e.kind, ok: e.ok })}
/>`,
        },
        {
            name: "clipboardWriter: route the copy yourself",
            description:
                "For a sandboxed window where navigator.clipboard can fail silently, hand the renderer your own writer. It gets { kind, text, html }. Throwing, rejecting, returning false or not settling within 5 s is a failure, and the button says so: a failure is never silent. This writer copies into the panel below; flip the switch and it refuses.",
            render: () => <ClipboardWriterDemo />,
            code: `<ContentRenderer
    value={markdown}
    format="markdown"
    clipboardWriter={(payload) => window.electron.clipboard.write(payload)}
/>`,
        },
        {
            name: "streaming: render a reply while it arrives",
            description:
                "While a reply streams, half of a code fence or a custom tag would flash as raw text. streaming={true} holds an open fence or a registered tag back until it closes; streaming=\"progressive\" shows it as it fills, with no copy button until it closes. Turn streaming off when the stream ends and everything renders.",
            render: () => <StreamingDemo />,
            code: `<ContentRenderer value={soFar} format="markdown" streaming={isStreaming} />

// Show an open block as it fills:
<ContentRenderer value={soFar} format="markdown" streaming={isStreaming ? "progressive" : false} />`,
        },
    ],
    props: [
        { name: "value", type: `string`, default: "—", description: "Raw markdown / HTML to render. Required." },
        { name: "format", type: `"html" | "markdown" | "auto"`, default: `"auto"`, description: "How to parse `value`. `auto` sniffs for markdown markers." },
        { name: "lineSpacing", type: `number`, default: `1.5`, description: "Multiplier on paragraph line height." },
        { name: "extensions", type: `RenderExtension[]`, default: "—", description: "Per-instance render extensions. Merged with globally-registered extensions via `registerExtension`." },
        { name: "unsafe", type: `boolean`, default: `false`, description: "Skip sanitization. Only set this for content you fully trust (your own server-rendered markdown)." },
        { name: "copyButtons", type: `boolean | { code?: boolean; table?: boolean }`, default: `true`, description: "Copy buttons on code blocks and tables. `false` restores the old markup." },
        { name: "onCopy", type: `(event: ContentCopyEvent) => void`, default: "—", description: "After every copy attempt: `{ kind, index, text, html, ok }`." },
        { name: "clipboardWriter", type: `(payload) => void | boolean | Promise<void | boolean>`, default: "ClipboardItem, then writeText", description: "Your own clipboard write. Throw, reject, return `false` or take over 5 s and the copy reports a failure." },
        { name: "streaming", type: `boolean | "progressive"`, default: `false`, description: "`true` holds back an unfinished trailing fence or registered tag; `\"progressive\"` shows it as it fills. The root carries `data-streaming`." },
        { name: "className", type: `string`, default: "—", description: "Extra classes on the root wrapper." },
    ],
    notes: (
        <p className="text-xs text-zinc-600 dark:text-zinc-300">
            <strong>Security:</strong> sanitization runs unconditionally unless <code>unsafe</code>
            is true. It strips <code>&lt;script&gt;</code>, <code>&lt;iframe&gt;</code>, event handler
            attributes, and <code>javascript:</code>-URL hrefs. Never enable
            <code>unsafe</code> on untrusted input.
        </p>
    ),
};
