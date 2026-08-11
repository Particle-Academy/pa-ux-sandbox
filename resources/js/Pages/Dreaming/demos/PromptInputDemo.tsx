import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Badge, Button, Card, Kbd, Select, Switch, Tooltip } from "@particle-academy/react-fancy";

/**
 * PromptInput — react-fancy primitive for the AI-app chat composer.
 *
 * Every product reinvents this; let's bake the essentials once:
 *
 *   • Multi-line, auto-grows.
 *   • Submit on ⌘/Ctrl+Enter, plain Enter inserts a newline.
 *   • Type `/` to open a slash-command palette filtered by what you
 *     type next. ↑/↓ navigate, Enter inserts.
 *   • Type `@` to open a mention picker (agents, files, people).
 *   • Drop or paste files (or click the paperclip) to attach — each
 *     attachment renders as a chip with size + remove handle.
 *   • Footer shows a live token-budget meter colored by remaining
 *     headroom (green → amber → red) plus a send button.
 *
 * Demo includes mock catalogs for commands, mentions, and attachments.
 */
type Cmd = { name: string; hint: string };
type Mention = { id: string; name: string; kind: "agent" | "file" | "person" };
type Attachment = { id: string; name: string; bytes: number };

const COMMANDS: Cmd[] = [
  { name: "/explain", hint: "explain the selected text" },
  { name: "/rewrite", hint: "rewrite in a different tone" },
  { name: "/summarize", hint: "tl;dr the selection" },
  { name: "/translate", hint: "translate to another language" },
  { name: "/test", hint: "write tests for the function above" },
  { name: "/diff", hint: "produce a unified diff" },
  { name: "/cite", hint: "add citations for any claim" },
];

const MENTIONS: Mention[] = [
  { id: "planner", name: "Planner", kind: "agent" },
  { id: "scribe", name: "Scribe", kind: "agent" },
  { id: "auditor", name: "Auditor", kind: "agent" },
  { id: "readme", name: "README.md", kind: "file" },
  { id: "claude.md", name: "CLAUDE.md", kind: "file" },
  { id: "ada", name: "Ada", kind: "person" },
  { id: "linus", name: "Linus", kind: "person" },
];

const KIND_COLOR: Record<Mention["kind"], string> = {
  agent: "#a855f7",
  file: "#10b981",
  person: "#3b82f6",
};

export function PromptInputDemo() {
  const [budget, setBudget] = useState<8 | 32 | 128>(32);
  const [hideHint, setHideHint] = useState(false);
  const [sent, setSent] = useState<Array<{ text: string; at: number; attachments: number }>>([]);

  const onSubmit = useCallback(
    (text: string, attachments: Attachment[]) => {
      setSent((cur) =>
        [{ text, at: Date.now(), attachments: attachments.length }, ...cur].slice(0, 8),
      );
    },
    [],
  );

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">PromptInput</h1>
        <p className="mt-1 text-sm text-zinc-500">
          The chat composer every AI app rebuilds. Slash commands, @-mentions,
          drop-to-attach, ⌘/Ctrl+Enter to send, token budget meter.
        </p>
      </header>

      <Card>
        <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2">
          <Select
            label="Token budget (k)"
            list={[
              { value: "8", label: "8k (small)" },
              { value: "32", label: "32k (typical)" },
              { value: "128", label: "128k (large)" },
            ]}
            value={String(budget)}
            onValueChange={(v) => setBudget(parseInt(v, 10) as 8 | 32 | 128)}
          />
          <div className="flex items-center gap-3 pt-5">
            <Switch checked={hideHint} onCheckedChange={setHideHint} />
            <span className="text-sm text-zinc-700 dark:text-zinc-200">
              Hide the keyboard hint
            </span>
          </div>
        </div>
      </Card>

      <PromptInput
        budgetTokens={budget * 1000}
        commands={COMMANDS}
        mentions={MENTIONS}
        showHint={!hideHint}
        onSubmit={onSubmit}
      />

      <Card>
        <div className="p-4">
          <div className="mb-2 text-sm font-medium">Sent log</div>
          {sent.length === 0 ? (
            <div className="text-[11px] italic text-zinc-400">
              Nothing sent yet — type something and hit ⌘/Ctrl+Enter.
            </div>
          ) : (
            <ol className="space-y-2 text-[12px]">
              {sent.map((s, i) => (
                <li
                  key={i}
                  className="rounded border border-zinc-200 px-2 py-1.5 dark:border-zinc-800"
                >
                  <div className="flex items-center gap-2 text-[10px] text-zinc-400">
                    <span>
                      {new Date(s.at).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                      })}
                    </span>
                    {s.attachments > 0 && (
                      <Badge color="emerald">+{s.attachments} attached</Badge>
                    )}
                  </div>
                  <div className="mt-0.5 whitespace-pre-wrap font-mono text-[12px] text-zinc-700 dark:text-zinc-200">
                    {s.text}
                  </div>
                </li>
              ))}
            </ol>
          )}
        </div>
      </Card>
    </div>
  );
}

function PromptInput({
  budgetTokens,
  commands,
  mentions,
  showHint,
  onSubmit,
}: {
  budgetTokens: number;
  commands: Cmd[];
  mentions: Mention[];
  showHint: boolean;
  onSubmit: (text: string, attachments: Attachment[]) => void;
}) {
  const [text, setText] = useState("");
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [picker, setPicker] = useState<null | {
    kind: "cmd" | "mention";
    /** Index in text where the trigger started. */
    start: number;
    /** Current filter text (after the trigger). */
    query: string;
    /** Cursor in the picker. */
    cursor: number;
  }>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const tokens = useMemo(() => estimateTokens(text), [text]);
  const ratio = Math.min(1, tokens / budgetTokens);
  const meterColor =
    ratio < 0.6 ? "#10b981" : ratio < 0.85 ? "#f59e0b" : "#ef4444";

  const filteredCmds = useMemo(
    () =>
      picker?.kind === "cmd"
        ? commands.filter((c) =>
            c.name.slice(1).toLowerCase().startsWith(picker.query.toLowerCase()),
          )
        : [],
    [picker, commands],
  );
  const filteredMentions = useMemo(
    () =>
      picker?.kind === "mention"
        ? mentions.filter((m) =>
            m.name.toLowerCase().includes(picker.query.toLowerCase()),
          )
        : [],
    [picker, mentions],
  );
  const items =
    picker?.kind === "cmd" ? filteredCmds : picker?.kind === "mention" ? filteredMentions : [];

  // Auto-resize.
  useEffect(() => {
    const ta = taRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = Math.min(280, ta.scrollHeight) + "px";
  }, [text]);

  const updateText = (next: string, caret: number) => {
    setText(next);
    // Inspect chars to the left of caret for triggers.
    let triggerIdx = -1;
    let triggerKind: "cmd" | "mention" | null = null;
    for (let i = caret - 1; i >= 0; i--) {
      const ch = next[i];
      if (ch === "@") {
        triggerKind = "mention";
        triggerIdx = i;
        break;
      }
      if (ch === "/" && (i === 0 || /\s/.test(next[i - 1] ?? ""))) {
        triggerKind = "cmd";
        triggerIdx = i;
        break;
      }
      if (/\s/.test(ch)) break;
    }
    if (triggerKind !== null && triggerIdx >= 0) {
      const query = next.slice(triggerIdx + 1, caret);
      setPicker({ kind: triggerKind, start: triggerIdx, query, cursor: 0 });
    } else {
      setPicker(null);
    }
  };

  const onChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    updateText(e.target.value, e.target.selectionStart);
  };

  const insertChoice = (i: number) => {
    if (!picker || items.length === 0) return;
    const choice = items[i] ?? items[0];
    const insert =
      picker.kind === "cmd"
        ? (choice as Cmd).name + " "
        : `@${(choice as Mention).id} `;
    const before = text.slice(0, picker.start);
    const after = text.slice(picker.start + 1 + picker.query.length);
    const next = before + insert + after;
    setText(next);
    setPicker(null);
    // restore focus + caret
    requestAnimationFrame(() => {
      const ta = taRef.current;
      if (!ta) return;
      ta.focus();
      const pos = before.length + insert.length;
      ta.setSelectionRange(pos, pos);
    });
  };

  const submit = () => {
    if (!text.trim() && attachments.length === 0) return;
    onSubmit(text, attachments);
    setText("");
    setAttachments([]);
    setPicker(null);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (picker) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setPicker((p) =>
          p ? { ...p, cursor: Math.min(items.length - 1, p.cursor + 1) } : p,
        );
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setPicker((p) => (p ? { ...p, cursor: Math.max(0, p.cursor - 1) } : p));
        return;
      }
      if (e.key === "Enter" && !e.metaKey && !e.ctrlKey && items.length > 0) {
        e.preventDefault();
        insertChoice(picker.cursor);
        return;
      }
      if (e.key === "Escape") {
        e.preventDefault();
        setPicker(null);
        return;
      }
    }
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      submit();
    }
  };

  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    setAttachments((cur) => [
      ...cur,
      ...files.map((f) => ({
        id: `${f.name}-${Date.now()}-${Math.random()}`,
        name: f.name,
        bytes: f.size,
      })),
    ]);
  };

  const fakeAttach = () => {
    setAttachments((cur) => [
      ...cur,
      {
        id: `mock-${cur.length}-${Date.now()}`,
        name: ["report.pdf", "chart.png", "notes.md"][cur.length % 3],
        bytes: 1024 * (40 + Math.random() * 200),
      },
    ]);
  };

  return (
    <Card>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        className={`relative rounded-md border transition ${
          dragOver
            ? "border-violet-400 bg-violet-50/50 dark:border-violet-600 dark:bg-violet-950/30"
            : "border-transparent"
        }`}
      >
        {attachments.length > 0 && (
          <div className="flex flex-wrap gap-1.5 border-b border-zinc-200 px-3 py-2 dark:border-zinc-800">
            {attachments.map((a) => (
              <span
                key={a.id}
                className="inline-flex items-center gap-1.5 rounded-md bg-zinc-100 px-2 py-0.5 text-[11px] dark:bg-zinc-800"
              >
                <span>📎</span>
                <span className="font-mono">{a.name}</span>
                <span className="text-zinc-400">{fmtSize(a.bytes)}</span>
                <button
                  onClick={() =>
                    setAttachments((cur) => cur.filter((x) => x.id !== a.id))
                  }
                  className="opacity-50 hover:opacity-100"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}

        <div className="relative">
          <textarea
            ref={taRef}
            value={text}
            onChange={onChange}
            onKeyDown={onKeyDown}
            placeholder="Ask anything. Type / for commands, @ for mentions. ⌘/Ctrl+Enter to send."
            spellCheck={false}
            className="block w-full resize-none bg-transparent px-3 py-2.5 text-[14px] leading-relaxed outline-none placeholder:text-zinc-400"
            rows={3}
          />

          {picker && items.length > 0 && (
            <div className="absolute bottom-full left-2 z-10 mb-1 w-72 overflow-hidden rounded-md border border-zinc-200 bg-white shadow-lg dark:border-zinc-700 dark:bg-zinc-900">
              <div className="border-b border-zinc-100 bg-zinc-50 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950">
                {picker.kind === "cmd" ? "Commands" : "Mention"} ·{" "}
                {items.length}
              </div>
              <ul className="max-h-56 overflow-y-auto">
                {items.map((item, i) => {
                  const active = i === picker.cursor;
                  if (picker.kind === "cmd") {
                    const c = item as Cmd;
                    return (
                      <li
                        key={c.name}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          insertChoice(i);
                        }}
                        onMouseEnter={() =>
                          setPicker((p) => (p ? { ...p, cursor: i } : p))
                        }
                        className={`cursor-pointer px-2 py-1.5 text-[12px] ${
                          active
                            ? "bg-violet-100 dark:bg-violet-900/30"
                            : "hover:bg-zinc-50 dark:hover:bg-zinc-800"
                        }`}
                      >
                        <div className="font-mono font-medium text-violet-700 dark:text-violet-300">
                          {c.name}
                        </div>
                        <div className="text-[11px] text-zinc-500">{c.hint}</div>
                      </li>
                    );
                  }
                  const m = item as Mention;
                  return (
                    <li
                      key={m.id}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        insertChoice(i);
                      }}
                      onMouseEnter={() =>
                        setPicker((p) => (p ? { ...p, cursor: i } : p))
                      }
                      className={`flex cursor-pointer items-center gap-2 px-2 py-1.5 text-[12px] ${
                        active
                          ? "bg-violet-100 dark:bg-violet-900/30"
                          : "hover:bg-zinc-50 dark:hover:bg-zinc-800"
                      }`}
                    >
                      <span
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: KIND_COLOR[m.kind] }}
                      />
                      <span className="font-medium">{m.name}</span>
                      <span className="ml-auto text-[10px] uppercase tracking-wider text-zinc-400">
                        {m.kind}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 border-t border-zinc-200 bg-zinc-50/60 px-3 py-2 dark:border-zinc-800 dark:bg-zinc-900/40">
          <Tooltip content="Attach a file">
            <Button size="sm" onClick={fakeAttach}>
              📎 attach
            </Button>
          </Tooltip>
          <div className="ml-2 flex items-center gap-1.5">
            <div className="h-1.5 w-24 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-700">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${ratio * 100}%`,
                  backgroundColor: meterColor,
                }}
              />
            </div>
            <span
              className="font-mono text-[11px]"
              style={{ color: meterColor }}
            >
              {fmtTokens(tokens)} / {fmtTokens(budgetTokens)}
            </span>
          </div>
          <div className="ml-auto flex items-center gap-2">
            {showHint && (
              <span className="hidden text-[10px] text-zinc-500 sm:inline">
                <Kbd>
                  ⌘
                </Kbd>{" "}
                +{" "}
                <Kbd>
                  Enter
                </Kbd>{" "}
                to send
              </span>
            )}
            <Button color="violet" size="sm" onClick={submit}>
              send →
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}

/* very rough token estimator (≈ 4 chars / token) */
function estimateTokens(s: string): number {
  return Math.ceil(s.length / 4);
}

function fmtTokens(n: number): string {
  if (n < 1000) return `${n}`;
  return `${(n / 1000).toFixed(1)}k`;
}

function fmtSize(b: number): string {
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(0)} KB`;
  return `${(b / 1024 / 1024).toFixed(1)} MB`;
}
