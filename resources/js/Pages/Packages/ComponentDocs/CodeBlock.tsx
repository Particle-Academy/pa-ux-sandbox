import type { ComponentDoc } from "./types";
import { CodeBlock, CodeView, Text } from "@particle-academy/react-fancy";

const HTML = `<form method="post" action="/subscribe">
  <label for="email">Email</label>
  <input id="email" name="email" type="email" required>
  <button type="submit">Subscribe</button>
</form>`;

const SHELL = `composer require particle-academy/fancy-inertia
npm install @particle-academy/react-fancy
php artisan migrate
npm run build`;

const ENV = `APP_URL=https://app.example.com
OPENAI_API_KEY=your-key-here
OPENAI_ORG=org-id
QUEUE_CONNECTION=database`;

const LONG = `<meta name="description" content="A long line that would normally scroll sideways, wrapped onto the next line instead so the whole of it can be read without a horizontal scrollbar.">`;

export const codeBlockDoc: ComponentDoc = {
    intro: (
        <Text>
            A display-only code block: <code>&lt;pre&gt;&lt;code&gt;</code> with a copy button, for install
            commands, config snippets and setup steps. It contains <strong>no textarea, input, select or
            contenteditable</strong>, so it is safe on a page that must never accept input. Only HTML is
            highlighted (the one grammar <code>fancy-file-commons</code> ships); every other language renders as
            plain text in the same palette. For an editable surface use <code>CodeView</code>.
        </Text>
    ),
    examples: [
        {
            name: "HTML, highlighted",
            description: "`language=\"html\"` (or `xml`) is the one grammar that highlights. The copy button floats in the corner and copies exactly the `code` prop.",
            render: () => (
                <div className="w-full" data-demo="code-block-html">
                    <CodeBlock code={HTML} language="html" />
                </div>
            ),
            code: `<CodeBlock code={markup} language="html" />`,
        },
        {
            name: "Shell, plain",
            description: "Any other language renders as plain, un-highlighted text, and nothing throws. `language` is still reflected as `data-language`.",
            render: () => (
                <div className="w-full" data-demo="code-block-shell">
                    <CodeBlock code={SHELL} language="bash" title="Terminal" />
                </div>
            ),
            code: `<CodeBlock
    title="Terminal"
    language="bash"
    code={"composer require particle-academy/fancy-inertia\\nnpm install @particle-academy/react-fancy"}
/>`,
        },
        {
            name: "Titled .env with line numbers",
            description: "With `title`, the copy button sits in the header with a visible label. `showLineNumbers` adds a gutter that is not part of the copied text.",
            render: () => (
                <div className="w-full" data-demo="code-block-env">
                    <CodeBlock code={ENV} language="env" title=".env" showLineNumbers />
                </div>
            ),
            code: `<CodeBlock
    title=".env"
    language="env"
    showLineNumbers
    code={"APP_URL=https://app.example.com\\nOPENAI_API_KEY=your-key-here"}
/>`,
        },
        {
            name: "Wrap",
            description: "Long lines scroll horizontally by default. `wrap` breaks them onto the next line instead.",
            render: () => (
                <div className="w-full max-w-md space-y-3" data-demo="code-block-wrap">
                    <CodeBlock code={LONG} language="html" wrap />
                    <CodeBlock code={LONG} language="html" />
                </div>
            ),
            code: `<CodeBlock code={longLine} language="html" wrap />`,
        },
        {
            name: "Beside CodeView",
            description: "The same palette as CodeView, so the two sit together in light and dark. CodeView overlays a textarea, even read-only; CodeBlock never does.",
            render: () => (
                <div className="grid w-full gap-3 md:grid-cols-2" data-demo="code-block-vs-code-view">
                    <div>
                        <Text size="xs" className="mb-1">CodeBlock</Text>
                        <CodeBlock code={HTML} language="html" />
                    </div>
                    <div>
                        <Text size="xs" className="mb-1">CodeView (readOnly)</Text>
                        <div className="overflow-hidden rounded-md border border-zinc-200 dark:border-zinc-800">
                            <CodeView value={HTML} language="html" readOnly />
                        </div>
                    </div>
                </div>
            ),
            code: `<CodeBlock code={markup} language="html" />
<CodeView value={markup} language="html" readOnly />`,
        },
    ],
    props: [
        { name: "code", type: `string`, default: "—", description: "The source to show. Rendered as text, never parsed as HTML.", required: true },
        { name: "language", type: `string`, default: `"plaintext"`, description: "Only `html` / `htm` / `xml` / `xhtml` highlight; everything else is plain text." },
        { name: "copyable", type: `boolean`, default: `true`, description: "Show the copy button. `false` leaves no interactive element at all." },
        { name: "title", type: `ReactNode`, default: "—", description: "Header above the code, such as a filename or \"Terminal\"." },
        { name: "showLineNumbers", type: `boolean`, default: `false`, description: "Number each line in a gutter that is not part of the code text." },
        { name: "wrap", type: `boolean`, default: `false`, description: "Wrap long lines instead of scrolling horizontally." },
        { name: "copyLabels", type: `{ copy?, copied?, failed? }`, default: "English", description: "Words on the copy button, for translation." },
        { name: "onCopyCode", type: `(e: { text: string; ok: boolean }) => void`, default: "—", description: "Called after every copy attempt." },
    ],
    notes: (
        <Text size="xs">
            Copies with <code>navigator.clipboard.writeText</code>; where that is missing (an insecure context, the
            server) the button shows "Copy failed" instead of throwing. Handles: <code>data-react-fancy-code-block</code>{" "}
            with <code>data-language</code> and <code>data-wrap</code>, <code>data-react-fancy-code-block-copy</code>{" "}
            with <code>data-copy-state</code> (<code>idle</code> / <code>copied</code> / <code>failed</code>), and{" "}
            <code>data-react-fancy-code-block-line</code> per line with line numbers on.
        </Text>
    ),
};
