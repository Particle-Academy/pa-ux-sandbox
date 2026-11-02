import type { ComponentDoc } from "./types";
import { CodeBlock, CodeView, Text } from "@particle-academy/react-fancy";

const HTML = `<form method="post" action="/subscribe">
  <label for="email">Email</label>
  <input id="email" name="email" type="email" required>
  <button type="submit">Subscribe</button>
</form>`;

const SHELL = `# install the kit, then build
composer require particle-academy/fancy-inertia
npm install @particle-academy/react-fancy --save
export APP_ENV="production"
php artisan migrate --force && npm run build`;

const ENV = `# Application
APP_URL=https://app.example.com
APP_DEBUG=false

# Mail
MAIL_FROM_ADDRESS="hello@example.com"
MAIL_FROM_NAME="\${APP_NAME}"
QUEUE_CONNECTION=database # jobs run in the database queue`;

const TYPESCRIPT = `import { CodeBlock } from "@particle-academy/react-fancy";

type Step = { title: string; command: string };

export function InstallSteps({ steps }: { steps: Step[] }) {
    return steps.map((step) => (
        <CodeBlock key={step.title} title={step.title} code={step.command} language="bash" />
    ));
}`;

const JSON_SNIPPET = `{
  "name": "acme/app",
  "private": true,
  "dependencies": {
    "@particle-academy/react-fancy": "^6.6.0"
  },
  "engines": { "node": ">=22" }
}`;

const PHP = `<?php

namespace App\\Http\\Controllers;

final class SubscribeController
{
    public function __invoke(Request $request): RedirectResponse
    {
        $email = $request->string('email');

        return back()->with('status', "Subscribed {$email}");
    }
}`;

const PHP_SNIPPET = `use Illuminate\\Support\\Facades\\Route;

Route::get('/status', function () {
    return ['ok' => true, 'checked_at' => now()->toIso8601String()];
});`;

const LONG =`<meta name="description" content="A long line that would normally scroll sideways, wrapped onto the next line instead so the whole of it can be read without a horizontal scrollbar.">`;

export const codeBlockDoc: ComponentDoc = {
    intro: (
        <Text>
            A display-only code block: <code>&lt;pre&gt;&lt;code&gt;</code> with a copy button, for install
            commands, config snippets and setup steps. It contains <strong>no textarea, input, select or
            contenteditable</strong>, so it is safe on a page that must never accept input. It highlights
            TypeScript, JavaScript, JSON, PHP, Python, Go, Markdown, shell, dotenv and HTML with the grammars
            shared from <code>fancy-file-commons</code> (the same ones <code>fancy-code</code>&rsquo;s editor
            uses); an unknown language renders as text in the same palette. For an editable surface use{" "}
            <code>CodeView</code>.
        </Text>
    ),
    examples: [
        {
            name: "Shell",
            description: "`language=\"bash\"` (or `sh`, `zsh`, `shell`) colours comments, the command word, `--flags`, strings, `$VARS` and operators. The copy button copies exactly the `code` prop.",
            render: () => (
                <div className="w-full" data-demo="code-block-shell">
                    <CodeBlock code={SHELL} language="bash" title="Terminal" />
                </div>
            ),
            code: `<CodeBlock
    title="Terminal"
    language="bash"
    code={"composer require particle-academy/fancy-inertia\\nnpm install @particle-academy/react-fancy --save"}
/>`,
        },
        {
            name: "Titled .env with line numbers",
            description: "`language=\"env\"` (or `dotenv`) colours keys, values, quoted strings, `${VAR}` interpolation and comments. With `title`, the copy button sits in the header with a visible label; `showLineNumbers` adds a gutter that is not part of the copied text.",
            render: () => (
                <div className="w-full" data-demo="code-block-env">
                    <CodeBlock code={ENV} language="env" title=".env" showLineNumbers />
                </div>
            ),
            code: `<CodeBlock
    title=".env"
    language="env"
    showLineNumbers
    code={"APP_URL=https://app.example.com\\nAPP_DEBUG=false"}
/>`,
        },
        {
            name: "TypeScript",
            description: "`ts`, `tsx`, `typescript`, `js`, `jsx` and `javascript` share one grammar.",
            render: () => (
                <div className="w-full" data-demo="code-block-typescript">
                    <CodeBlock code={TYPESCRIPT} language="tsx" title="InstallSteps.tsx" />
                </div>
            ),
            code: `<CodeBlock code={source} language="tsx" title="InstallSteps.tsx" />`,
        },
        {
            name: "JSON",
            description: "`language=\"json\"`: keys, strings, numbers and literals.",
            render: () => (
                <div className="w-full" data-demo="code-block-json">
                    <CodeBlock code={JSON_SNIPPET} language="json" title="package.json" />
                </div>
            ),
            code: `<CodeBlock code={manifest} language="json" title="package.json" />`,
        },
        {
            name: "PHP",
            description: "`language=\"php\"`: keywords, variables, strings and the `<?php` tag.",
            render: () => (
                <div className="w-full" data-demo="code-block-php">
                    <CodeBlock code={PHP} language="php" title="SubscribeController.php" />
                </div>
            ),
            code: `<CodeBlock code={source} language="php" title="SubscribeController.php" />`,
        },
        {
            name: "PHP snippet without <?php",
            description: "A fragment with no open tag is still PHP: it highlights as PHP until a `?>` switches to HTML. Code that starts with `<?php` highlights exactly as above.",
            render: () => (
                <div className="w-full" data-demo="code-block-php-snippet">
                    <CodeBlock code={PHP_SNIPPET} language="php" title="routes/web.php" />
                </div>
            ),
            code: `<CodeBlock
    language="php"
    title="routes/web.php"
    code={"use Illuminate\\\\Support\\\\Facades\\\\Route;\\n\\nRoute::get('/status', fn () => ['ok' => true]);"}
/>`,
        },
        {
            name: "HTML",
            description: "`language=\"html\"` (or `htm`, `xml`, `xhtml`).",
            render: () => (
                <div className="w-full" data-demo="code-block-html">
                    <CodeBlock code={HTML} language="html" />
                </div>
            ),
            code: `<CodeBlock code={markup} language="html" />`,
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
            description: "The same grammars and palette as CodeView, so the two sit together in light and dark. CodeView overlays a textarea, even read-only; CodeBlock never does.",
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
        { name: "language", type: `CodeLanguage | string`, default: `"plaintext"`, description: "Case-insensitive grammar id: `ts` / `tsx` / `js` / `jsx`, `json`, `php`, `py`, `go`, `md`, `sh` / `bash` / `zsh` / `shell`, `env` / `dotenv`, `html` / `htm` / `xml` / `xhtml`. Anything else renders as plain text." },
        { name: "copyable", type: `boolean`, default: `true`, description: "Show the copy button. `false` leaves no interactive element at all." },
        { name: "title", type: `ReactNode`, default: "—", description: "Header above the code, such as a filename or \"Terminal\"." },
        { name: "showLineNumbers", type: `boolean`, default: `false`, description: "Number each line in a gutter that is not part of the code text." },
        { name: "wrap", type: `boolean`, default: `false`, description: "Wrap long lines instead of scrolling horizontally." },
        { name: "copyLabels", type: `{ copy?, copied?, failed? }`, default: "English", description: "Words on the copy button, for translation." },
        { name: "onCopyCode", type: `(e: { text: string; ok: boolean }) => void`, default: "—", description: "Called after every copy attempt." },
    ],
    notes: (
        <Text size="xs">
            Highlighting only adds colour spans: the text, its escaping and what the copy button copies are the same
            as plain text. Copies with <code>navigator.clipboard.writeText</code>; where that is missing (an insecure
            context, the server) the button shows "Copy failed" instead of throwing. Handles:{" "}
            <code>data-react-fancy-code-block</code> with <code>data-language</code> and <code>data-wrap</code>,{" "}
            <code>data-react-fancy-code-block-copy</code> with <code>data-copy-state</code> (<code>idle</code> /{" "}
            <code>copied</code> / <code>failed</code>), and <code>data-react-fancy-code-block-line</code> per line
            with line numbers on. Colours are CSS variables declared on the root (<code>--fc-&lt;slot&gt;-l</code> /{" "}
            <code>--fc-&lt;slot&gt;-d</code>) and switch to the dark palette under <code>.dark</code> or{" "}
            <code>[data-theme="dark"]</code>, so server-rendered HTML is already in the right theme and there is no
            light flash before hydration. Recolour a slot by setting its variables in <code>style</code>.
        </Text>
    ),
};
