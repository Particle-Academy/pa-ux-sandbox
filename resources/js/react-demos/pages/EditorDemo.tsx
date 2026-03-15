import { useState, useEffect } from "react";
import {
  Editor,
  useEditor,
  Action,
  ContentRenderer,
  type RenderExtension,
  type RenderExtensionProps,
} from "@particle-academy/react-fancy";
import { DemoSection } from "../components/DemoSection";

// ---------------------------------------------------------------------------
// Custom toolbar (uses useEditor hook)
// ---------------------------------------------------------------------------

function CustomToolbarButtons() {
  const { exec } = useEditor();

  return (
    <>
      <Action size="xs" variant="ghost" onClick={() => exec("bold")} title="Bold">
        <span className="font-bold">B</span>
      </Action>
      <Action size="xs" variant="ghost" onClick={() => exec("italic")} title="Italic">
        <span className="italic">I</span>
      </Action>
      <Action size="xs" variant="ghost" onClick={() => exec("underline")} title="Underline">
        <span className="underline">U</span>
      </Action>
      <Editor.Toolbar.Separator />
      <Action size="xs" variant="ghost" onClick={() => exec("formatBlock", "h1")} title="Heading 1">
        H1
      </Action>
      <Action size="xs" variant="ghost" onClick={() => exec("formatBlock", "h2")} title="Heading 2">
        H2
      </Action>
      <Editor.Toolbar.Separator />
      <Action size="xs" variant="ghost" onClick={() => exec("insertUnorderedList")} title="Bullet List">
        &#8226;
      </Action>
      <Action size="xs" variant="ghost" onClick={() => exec("insertOrderedList")} title="Numbered List">
        1.
      </Action>
    </>
  );
}

// ---------------------------------------------------------------------------
// Example render extensions
// ---------------------------------------------------------------------------

function QuestionsRenderer({ content, attributes }: RenderExtensionProps) {
  let questions: { q: string; options?: string[] }[] = [];
  try {
    questions = JSON.parse(content);
  } catch {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-700 dark:bg-amber-900/30 dark:text-amber-200">
        Invalid questions JSON
      </div>
    );
  }

  return (
    <div className="space-y-3 rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">
        <span>&#9432;</span>
        {attributes.title || "Questions"}
      </div>
      {questions.map((item, i) => (
        <div key={i} className="text-sm">
          <p className="mb-1 font-medium text-zinc-900 dark:text-zinc-100">
            {i + 1}. {item.q}
          </p>
          {item.options && (
            <ul className="ml-4 space-y-0.5 text-zinc-600 dark:text-zinc-400">
              {item.options.map((opt, j) => (
                <li key={j} className="flex items-center gap-1.5">
                  <span className="inline-block h-3.5 w-3.5 rounded-full border border-zinc-300 dark:border-zinc-600" />
                  {opt}
                </li>
              ))}
            </ul>
          )}
        </div>
      ))}
    </div>
  );
}

function ThinkingRenderer({ content }: RenderExtensionProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-lg border border-purple-200 bg-purple-50 dark:border-purple-800 dark:bg-purple-900/20">
      <button
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center gap-2 px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-purple-600 transition-colors hover:bg-purple-100 dark:text-purple-400 dark:hover:bg-purple-900/40"
      >
        <span className={`inline-block transition-transform ${expanded ? "rotate-90" : ""}`}>&#9654;</span>
        Thinking
      </button>
      {expanded && (
        <div className="border-t border-purple-200 px-4 py-3 text-sm text-zinc-700 dark:border-purple-800 dark:text-zinc-300">
          {content}
        </div>
      )}
    </div>
  );
}

function AlertRenderer({ content, attributes }: RenderExtensionProps) {
  const variant = attributes.type || "info";
  const styles: Record<string, string> = {
    info: "border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-800 dark:bg-blue-900/20 dark:text-blue-200",
    warning: "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-200",
    error: "border-red-200 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-900/20 dark:text-red-200",
    success: "border-green-200 bg-green-50 text-green-800 dark:border-green-800 dark:bg-green-900/20 dark:text-green-200",
  };

  return (
    <div className={`rounded-lg border p-3 text-sm ${styles[variant] || styles.info}`}>
      {content}
    </div>
  );
}

const DEMO_EXTENSIONS: RenderExtension[] = [
  { tag: "questions", component: QuestionsRenderer },
  { tag: "thinking", component: ThinkingRenderer },
  { tag: "alert", component: AlertRenderer },
];

// ---------------------------------------------------------------------------
// Sample content
// ---------------------------------------------------------------------------

const SAMPLE_MARKDOWN = `# Welcome to ContentRenderer

This component renders **Markdown** and *HTML* content with consistent typography.

## Features

- Automatic format detection
- Supports headings, lists, and inline formatting
- Code blocks with syntax highlighting styles
- Blockquotes and links

> This is a blockquote. It can contain **bold** and *italic* text.

Here's some \`inline code\` and a [link](https://example.com).

### Code Block

\`\`\`
const greeting = "Hello, world!";
console.log(greeting);
\`\`\`
`;

const SAMPLE_HTML = `<h1>HTML Content</h1>
<p>This is rendered from <strong>raw HTML</strong> with the same typography styles.</p>
<ul>
<li>Item one</li>
<li>Item two</li>
<li>Item three</li>
</ul>
<blockquote>A blockquote rendered from HTML.</blockquote>
<p>Inline <code>code</code> and <a href="https://example.com">links</a> work too.</p>`;

const CONTENT_WITH_EXTENSIONS = `<p>Here is some regular content with <strong>formatting</strong>.</p>

<thinking>The user is asking about React component architecture. Let me consider the best patterns for compound components with context...</thinking>

<p>Based on my analysis, here are some practice questions:</p>

<questions title="React Patterns Quiz">[{"q":"What hook provides context to child components?","options":["useState","useContext","useReducer","useRef"]},{"q":"Which pattern uses Object.assign to attach sub-components?","options":["Render props","Compound components","HOC","Custom hooks"]},{"q":"What is the purpose of a Provider component?"}]</questions>

<alert type="warning">Remember: these extensions are fully customizable. Any project can register its own tags and renderers.</alert>

<p>And the content continues normally after the custom blocks.</p>`;

const EDITOR_WITH_EXTENSIONS_DEFAULT = `<p>This editor has <strong>render extensions</strong> registered. Try typing custom tags!</p>
<p>The editor preserves custom tags in the HTML output:</p>
<alert type="info">Custom tags appear as dashed-border blocks while editing, and render fully in ContentRenderer.</alert>
<p>Here's a question block embedded in the editor:</p>
<questions>[{"q":"Does this work?","options":["Yes","Absolutely"]}]</questions>
<p>Content continues after the custom block.</p>`;

const STREAMING_CHUNKS = [
  "# AI Response\n\n",
  "Here's what I found:\n\n",
  "## Key Points\n\n",
  "1. **First** — the system uses ",
  "a context-based architecture\n",
  "2. **Second** — all toolbar actions ",
  "flow through `exec()`\n",
  "3. **Third** — output format can be ",
  "either HTML or Markdown\n\n",
  "> The ContentRenderer component ",
  "makes it easy to display ",
  "formatted content from any source.\n\n",
  "```\nconst { exec } = useEditor();\n",
  "exec('bold');\n```\n\n",
  "That's the summary!",
];

// ---------------------------------------------------------------------------
// Demo page
// ---------------------------------------------------------------------------

export function EditorDemo() {
  const [basicValue, setBasicValue] = useState("");
  const [mdValue, setMdValue] = useState("");
  const [extEditorValue, setExtEditorValue] = useState("");
  const [streamContent, setStreamContent] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);

  const startStream = () => {
    setStreamContent("");
    setIsStreaming(true);
    let i = 0;
    const interval = setInterval(() => {
      if (i < STREAMING_CHUNKS.length) {
        setStreamContent((prev) => prev + STREAMING_CHUNKS[i]);
        i++;
      } else {
        clearInterval(interval);
        setIsStreaming(false);
      }
    }, 200);
  };

  useEffect(() => {
    startStream();
  }, []);

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Editor</h1>

      <DemoSection
        title="Basic Editor"
        description="Rich text editor with managed state. The HTML output is shown below."
        code={`<Editor
  defaultValue="<p>Start typing here...</p>"
  onChange={(value) => setValue(value)}
  placeholder="Start typing..."
>
  <Editor.Toolbar />
  <Editor.Content />
</Editor>`}
      >
        <div className="max-w-lg">
          <Editor
            defaultValue="<p>Start typing here. Use the toolbar above to <strong>format</strong> your text.</p>"
            onChange={setBasicValue}
            placeholder="Start typing..."
          >
            <Editor.Toolbar />
            <Editor.Content />
          </Editor>
          {basicValue && (
            <pre className="mt-3 max-h-40 overflow-auto rounded-lg bg-zinc-100 p-3 text-xs text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
              {basicValue}
            </pre>
          )}
        </div>
      </DemoSection>

      <DemoSection
        title="Line Spacing"
        description="Editors with different lineSpacing values: 1.2, 1.6 (default), and 2.0."
        code={`<Editor lineSpacing={1.2}>...</Editor>
<Editor lineSpacing={1.6}>...</Editor>
<Editor lineSpacing={2.0}>...</Editor>`}
      >
        <div className="grid max-w-3xl grid-cols-3 gap-4">
          {[1.2, 1.6, 2.0].map((spacing) => (
            <div key={spacing}>
              <p className="mb-2 text-xs font-medium text-zinc-500">lineSpacing={spacing}</p>
              <Editor lineSpacing={spacing} defaultValue="<p>The quick brown fox jumps over the lazy dog. This text demonstrates different line spacing values.</p>">
                <Editor.Toolbar
                  actions={[
                    { icon: "B", label: "Bold", command: "bold" },
                    { icon: "I", label: "Italic", command: "italic" },
                  ]}
                />
                <Editor.Content />
              </Editor>
            </div>
          ))}
        </div>
      </DemoSection>

      <DemoSection
        title="Markdown Output"
        description="Editor with outputFormat='markdown'. The raw markdown output is shown below."
        code={`<Editor
  outputFormat="markdown"
  onChange={(md) => setMdValue(md)}
>
  <Editor.Toolbar actions={[
    { icon: "B", label: "Bold", command: "bold" },
    { icon: "H1", label: "Heading", command: "formatBlock", commandArg: "h1" },
  ]} />
  <Editor.Content />
</Editor>`}
      >
        <div className="max-w-lg">
          <Editor
            outputFormat="markdown"
            onChange={setMdValue}
            placeholder="Type here to see markdown output..."
            defaultValue="<p>Try making text <strong>bold</strong> or <em>italic</em>, then check the markdown below.</p>"
          >
            <Editor.Toolbar
              actions={[
                { icon: "B", label: "Bold", command: "bold" },
                { icon: "I", label: "Italic", command: "italic" },
                { icon: "U", label: "Underline", command: "underline" },
                { icon: "H1", label: "Heading 1", command: "formatBlock", commandArg: "h1" },
                { icon: "H2", label: "Heading 2", command: "formatBlock", commandArg: "h2" },
              ]}
            />
            <Editor.Content />
          </Editor>
          {mdValue && (
            <pre className="mt-3 max-h-40 overflow-auto rounded-lg bg-zinc-100 p-3 text-xs text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
              {mdValue}
            </pre>
          )}
        </div>
      </DemoSection>

      <DemoSection
        title="Custom Toolbar with Actions"
        description="Uses useEditor() hook and Action buttons for a fully custom toolbar with separators."
        code={`function CustomToolbarButtons() {
  const { exec } = useEditor();
  return (
    <>
      <Action size="xs" variant="ghost" onClick={() => exec("bold")}>B</Action>
      <Editor.Toolbar.Separator />
      <Action size="xs" variant="ghost" onClick={() => exec("formatBlock", "h1")}>H1</Action>
    </>
  );
}

<Editor>
  <Editor.Toolbar>
    <CustomToolbarButtons />
  </Editor.Toolbar>
  <Editor.Content />
</Editor>`}
      >
        <div className="max-w-lg">
          <Editor placeholder="Custom toolbar editor...">
            <Editor.Toolbar>
              <CustomToolbarButtons />
            </Editor.Toolbar>
            <Editor.Content />
          </Editor>
        </div>
      </DemoSection>

      <DemoSection
        title="Render Extensions"
        description="Custom tags like <questions>, <thinking>, and <alert> are rendered as rich React components. The same extensions work in both ContentRenderer and Editor."
        code={`// Define extension components
function QuestionsRenderer({ content, attributes }: RenderExtensionProps) {
  const questions = JSON.parse(content);
  return <div>...</div>;
}

// Register extensions
const extensions: RenderExtension[] = [
  { tag: "questions", component: QuestionsRenderer },
  { tag: "thinking", component: ThinkingRenderer },
  { tag: "alert",    component: AlertRenderer },
];

// Use in ContentRenderer
<ContentRenderer
  value={'<p>Text</p><questions>[...]</questions>'}
  extensions={extensions}
/>

// Use in Editor
<Editor extensions={extensions}>
  <Editor.Toolbar />
  <Editor.Content />
</Editor>

// Or register globally (applies to all instances)
registerExtension({ tag: "questions", component: QuestionsRenderer });`}
      >
        <div className="max-w-2xl">
          <ContentRenderer
            value={CONTENT_WITH_EXTENSIONS}
            format="html"
            extensions={DEMO_EXTENSIONS}
          />
        </div>
      </DemoSection>

      <DemoSection
        title="Editor with Extensions"
        description="Custom tags are styled with dashed borders while editing. The rendered output (via ContentRenderer) is shown below."
        code={`<Editor
  extensions={extensions}
  onChange={setExtEditorValue}
  defaultValue={'<alert type="info">Edit me!</alert>'}
>
  <Editor.Toolbar />
  <Editor.Content />
</Editor>

{/* Preview the output */}
<ContentRenderer
  value={extEditorValue}
  extensions={extensions}
/>`}
      >
        <div className="max-w-2xl space-y-4">
          <Editor
            extensions={DEMO_EXTENSIONS}
            onChange={setExtEditorValue}
            defaultValue={EDITOR_WITH_EXTENSIONS_DEFAULT}
          >
            <Editor.Toolbar />
            <Editor.Content />
          </Editor>
          {extEditorValue && (
            <>
              <p className="text-xs font-medium text-zinc-500">Rendered preview:</p>
              <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-700">
                <ContentRenderer
                  value={extEditorValue}
                  format="html"
                  extensions={DEMO_EXTENSIONS}
                />
              </div>
            </>
          )}
        </div>
      </DemoSection>

      <DemoSection
        title="ContentRenderer"
        description="Standalone component for rendering HTML or Markdown content with consistent typography."
        code={`<ContentRenderer value={markdownString} format="markdown" />
<ContentRenderer value={htmlString} format="html" />
<ContentRenderer value={content} format="auto" />`}
      >
        <div className="grid max-w-4xl grid-cols-2 gap-6">
          <div>
            <p className="mb-2 text-xs font-medium text-zinc-500">format=&quot;markdown&quot;</p>
            <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-700">
              <ContentRenderer value={SAMPLE_MARKDOWN} format="markdown" />
            </div>
          </div>
          <div>
            <p className="mb-2 text-xs font-medium text-zinc-500">format=&quot;html&quot;</p>
            <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-700">
              <ContentRenderer value={SAMPLE_HTML} format="html" />
            </div>
          </div>
        </div>
      </DemoSection>

      <DemoSection
        title="AI Chat Stream"
        description="Simulated streaming content rendered with ContentRenderer. Click to restart."
        code={`<ContentRenderer
  value={streamContent}
  format="markdown"
/>`}
      >
        <div className="max-w-lg">
          <div className="mb-3 flex items-center gap-3">
            <button
              onClick={startStream}
              disabled={isStreaming}
              className="rounded-md bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              {isStreaming ? "Streaming..." : "Restart Stream"}
            </button>
            {isStreaming && (
              <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-green-500" />
            )}
          </div>
          <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-700">
            <ContentRenderer value={streamContent} format="markdown" />
            {isStreaming && (
              <span className="inline-block h-4 w-0.5 animate-pulse bg-zinc-400" />
            )}
          </div>
        </div>
      </DemoSection>
    </div>
  );
}
