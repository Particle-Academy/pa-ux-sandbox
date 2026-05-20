import type { ComponentDoc } from "./types";
import { ContentRenderer } from "@particle-academy/react-fancy";

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
    ],
    props: [
        { name: "value", type: `string`, default: "—", description: "Raw markdown / HTML to render. Required." },
        { name: "format", type: `"html" | "markdown" | "auto"`, default: `"auto"`, description: "How to parse `value`. `auto` sniffs for markdown markers." },
        { name: "lineSpacing", type: `number`, default: `1.5`, description: "Multiplier on paragraph line height." },
        { name: "extensions", type: `RenderExtension[]`, default: "—", description: "Per-instance render extensions. Merged with globally-registered extensions via `registerExtension`." },
        { name: "unsafe", type: `boolean`, default: `false`, description: "Skip sanitization. Only set this for content you fully trust (your own server-rendered markdown)." },
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
