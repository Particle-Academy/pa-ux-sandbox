import { useMemo, useRef, useState } from "react";
import {
  InputTag,
  textareaAdapter,
  inputAdapter,
  contentEditableAdapter,
  Card,
  Badge,
} from "@particle-academy/react-fancy";
import { CodeEditor, CodeEditorInputTag } from "@particle-academy/fancy-code";
import "@particle-academy/fancy-code/styles.css";
import { DemoSection } from "../components/DemoSection";

const COMMANDS = [
  { name: "/explain", hint: "explain the selection" },
  { name: "/rewrite", hint: "rewrite in a different tone" },
  { name: "/summarize", hint: "tl;dr the selection" },
  { name: "/translate", hint: "translate to another language" },
  { name: "/test", hint: "write tests for the function above" },
  { name: "/diff", hint: "produce a unified diff" },
  { name: "/cite", hint: "add citations for any claim" },
];

const MENTIONS = [
  { id: "planner", name: "Planner", kind: "agent" },
  { id: "scribe", name: "Scribe", kind: "agent" },
  { id: "auditor", name: "Auditor", kind: "agent" },
  { id: "readme", name: "README.md", kind: "file" },
  { id: "claude.md", name: "CLAUDE.md", kind: "file" },
  { id: "ada", name: "Ada", kind: "person" },
  { id: "linus", name: "Linus", kind: "person" },
];

const KIND_COLOR: Record<string, string> = {
  agent: "violet",
  file: "emerald",
  person: "blue",
};

export function InputTagDemo() {
  return (
    <div className="mx-auto max-w-4xl px-6 py-8 space-y-6">
      <header>
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">InputTag</h1>
        <p className="mt-2 text-zinc-500">
          A trigger-driven autocomplete picker that attaches to <em>any</em> text surface via an adapter.
          Same `<code>/</code>` and `<code>@</code>` triggers, three surfaces (textarea, input, contenteditable).
          Type a trigger to open the menu; ↑↓ to move, Enter/Tab to insert, Esc to cancel.
        </p>
      </header>

      <DemoSection title="Textarea" description="Standard multi-line input — the typical chat composer surface.">
        <Card>
          <div className="p-4">
            <TextareaDemo />
          </div>
        </Card>
      </DemoSection>

      <DemoSection title="Single-line <input>" description="Same triggers, different surface — no code changes to InputTag, just a different adapter.">
        <Card>
          <div className="p-4">
            <InputDemo />
          </div>
        </Card>
      </DemoSection>

      <DemoSection title="contenteditable div" description="For rich-text-ish surfaces. Adapter uses textContent + DOM Range for caret tracking.">
        <Card>
          <div className="p-4">
            <ContentEditableDemo />
          </div>
        </Card>
      </DemoSection>

      <DemoSection title="Custom render + alternate triggers" description="Different items per trigger char, custom row renderer, and a third '#' trigger for tags.">
        <Card>
          <div className="p-4">
            <CustomRenderDemo />
          </div>
        </Card>
      </DemoSection>

      <DemoSection
        title="CodeEditor (non-DOM-input surface)"
        description="fancy-code's editor renders a real textarea under its syntax-highlighting overlay. CodeEditorInputTag wires <InputTag> to that underlying textarea via the editor context."
      >
        <Card>
          <div className="p-4">
            <CodeEditorDemo />
          </div>
        </Card>
      </DemoSection>
    </div>
  );
}

function CodeEditorDemo() {
  const [code, setCode] = useState("// Try typing / for commands or @ for mentions\n\n");
  const triggers = useMemo(() => commonTriggers(), []);
  return (
    <CodeEditor
      value={code}
      onChange={setCode}
      language="javascript"
      minHeight={140}
      maxHeight={260}
    >
      <CodeEditor.Toolbar />
      <CodeEditor.Panel />
      <CodeEditorInputTag triggers={triggers} />
    </CodeEditor>
  );
}

function commonTriggers() {
  return {
    "/": {
      items: COMMANDS,
      insert: (c: (typeof COMMANDS)[number]) => `${c.name} `,
      render: (c: (typeof COMMANDS)[number], active: boolean) => (
        <div className={active ? "" : ""}>
          <div className="font-mono font-medium text-violet-700 dark:text-violet-300">{c.name}</div>
          <div className="text-[11px] text-zinc-500">{c.hint}</div>
        </div>
      ),
      label: "Commands",
    },
    "@": {
      items: MENTIONS,
      insert: (m: (typeof MENTIONS)[number]) => `@${m.name} `,
      filter: (m: (typeof MENTIONS)[number], q: string) =>
        m.name.toLowerCase().includes(q.toLowerCase()) ||
        m.kind.toLowerCase().includes(q.toLowerCase()),
      render: (m: (typeof MENTIONS)[number], _active: boolean) => (
        <div className="flex items-center gap-2">
          <span
            className="h-2 w-2 rounded-full"
            style={{ background: KIND_COLOR[m.kind] === "violet" ? "#a855f7" : KIND_COLOR[m.kind] === "emerald" ? "#10b981" : "#3b82f6" }}
          />
          <span className="flex-1 font-medium">{m.name}</span>
          <span className="text-[10px] uppercase tracking-wider text-zinc-400">{m.kind}</span>
        </div>
      ),
      label: "Mentions",
    },
  };
}

function TextareaDemo() {
  const [text, setText] = useState("Try typing / or @ here…");
  const ref = useRef<HTMLTextAreaElement>(null);
  const adapter = useMemo(() => textareaAdapter(ref), []);
  const triggers = useMemo(() => commonTriggers(), []);
  return (
    <>
      <textarea
        ref={ref}
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={4}
        className="w-full resize-none rounded-md border border-zinc-200 bg-white px-3 py-2.5 text-[14px] outline-none focus:border-violet-400 dark:border-zinc-700 dark:bg-zinc-900"
      />
      <InputTag adapter={adapter} triggers={triggers} />
    </>
  );
}

function InputDemo() {
  const [text, setText] = useState("");
  const ref = useRef<HTMLInputElement>(null);
  const adapter = useMemo(() => inputAdapter(ref), []);
  const triggers = useMemo(() => commonTriggers(), []);
  return (
    <>
      <input
        ref={ref}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Single-line input — try / or @"
        className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-[14px] outline-none focus:border-violet-400 dark:border-zinc-700 dark:bg-zinc-900"
      />
      <InputTag adapter={adapter} triggers={triggers} />
    </>
  );
}

function ContentEditableDemo() {
  const ref = useRef<HTMLDivElement>(null);
  const adapter = useMemo(() => contentEditableAdapter(ref), []);
  const triggers = useMemo(() => commonTriggers(), []);
  return (
    <>
      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        className="min-h-[80px] w-full rounded-md border border-zinc-200 bg-white px-3 py-2.5 text-[14px] outline-none focus:border-violet-400 dark:border-zinc-700 dark:bg-zinc-900"
      >
        Try / or @ here too — same picker, totally different DOM surface.
      </div>
      <InputTag adapter={adapter} triggers={triggers} />
    </>
  );
}

function CustomRenderDemo() {
  const [text, setText] = useState("");
  const ref = useRef<HTMLTextAreaElement>(null);
  const adapter = useMemo(() => textareaAdapter(ref), []);
  const tags = useMemo(
    () => [
      { id: "urgent", name: "urgent", color: "red" },
      { id: "wontfix", name: "wontfix", color: "zinc" },
      { id: "epic", name: "epic", color: "violet" },
      { id: "good-first", name: "good-first-issue", color: "emerald" },
      { id: "ux", name: "ux", color: "blue" },
    ],
    [],
  );
  const emojis = useMemo(
    () => [
      { code: "fire", glyph: "🔥" },
      { code: "rocket", glyph: "🚀" },
      { code: "heart", glyph: "❤️" },
      { code: "warning", glyph: "⚠️" },
      { code: "sparkles", glyph: "✨" },
      { code: "check", glyph: "✅" },
    ],
    [],
  );
  const triggers = useMemo(
    () => ({
      "#": {
        items: tags,
        insert: (t: (typeof tags)[number]) => `#${t.name} `,
        render: (t: (typeof tags)[number]) => (
          <div className="flex items-center gap-2">
            <Badge color={t.color as any}>#{t.name}</Badge>
          </div>
        ),
        label: "Tags",
      },
      ":": {
        items: emojis,
        insert: (e: (typeof emojis)[number]) => `${e.glyph} `,
        filter: (e: (typeof emojis)[number], q: string) =>
          e.code.toLowerCase().startsWith(q.toLowerCase()),
        keyOf: (e: (typeof emojis)[number]) => e.code,
        render: (e: (typeof emojis)[number]) => (
          <div className="flex items-center gap-2">
            <span className="text-[16px]">{e.glyph}</span>
            <span className="font-mono text-[11px] text-zinc-500">:{e.code}:</span>
          </div>
        ),
        label: "Emoji",
      },
    }),
    [tags, emojis],
  );
  return (
    <>
      <textarea
        ref={ref}
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={3}
        placeholder="Try # for tags, : for emoji"
        className="w-full resize-none rounded-md border border-zinc-200 bg-white px-3 py-2.5 text-[14px] outline-none focus:border-violet-400 dark:border-zinc-700 dark:bg-zinc-900"
      />
      <InputTag adapter={adapter} triggers={triggers} />
    </>
  );
}
