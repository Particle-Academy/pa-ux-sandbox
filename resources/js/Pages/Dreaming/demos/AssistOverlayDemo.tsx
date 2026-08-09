import { Kbd } from "@particle-academy/react-fancy";
import { useEffect, useRef, useState } from "react";

export const USAGE = `import { AssistOverlay } from "@particle-academy/agent-integrations";

<AssistOverlay
  targetRef={textareaRef}               // anchors to this input
  suggestions={agent.suggestions}       // [{ id, kind, label, detail, insertText? }]
  onApply={(s) => insertAtCaret(s.insertText)}
  keymap={{ next: "Alt+ArrowDown", prev: "Alt+ArrowUp", apply: "Alt+Enter" }}
/>`;

/**
 * AssistOverlay — floating sidekick that hovers near a focused input.
 * Surfaces the agent's top-3 next-actions (quote KB, insert link,
 * escalate). Arrow keys + Enter from the input drive selection; click-
 * outside dismisses without stealing the caret.
 */
type Suggestion = {
  id: string;
  kind: "quote-kb" | "insert-link" | "escalate" | "draft-reply";
  label: string;
  detail: string;
  insertText?: string;
};

const SUGGESTIONS: Suggestion[] = [
  {
    id: "s1",
    kind: "quote-kb",
    label: "Quote KB-128 (Exporting your workspace)",
    detail: "Top match for 'export'. 4 paragraphs.",
    insertText: "From our guide on exporting: …",
  },
  {
    id: "s2",
    kind: "insert-link",
    label: "Insert link to /settings/data",
    detail: "Self-serve page the user hasn't visited.",
    insertText: " → https://app.example.com/settings/data",
  },
  {
    id: "s3",
    kind: "escalate",
    label: "Escalate to billing-on-call",
    detail: "Ticket keyword 'invoice' matched policy 12.",
  },
];

const KIND_TONE: Record<Suggestion["kind"], string> = {
  "quote-kb": "text-sky-600 dark:text-sky-300",
  "insert-link": "text-violet-600 dark:text-violet-300",
  escalate: "text-rose-600 dark:text-rose-300",
  "draft-reply": "text-emerald-600 dark:text-emerald-300",
};

export function AssistOverlayDemo() {
  const [text, setText] = useState("Hi! You can export from Settings → Data. ");
  const [focused, setFocused] = useState(false);
  const [sel, setSel] = useState(0);
  const taRef = useRef<HTMLTextAreaElement>(null);

  const apply = (s: Suggestion) => {
    if (s.insertText) {
      setText((t) => (t.endsWith(" ") ? t + s.insertText : t + " " + s.insertText));
    }
    taRef.current?.focus();
  };

  useEffect(() => {
    if (!focused) return;
    const onKey = (e: KeyboardEvent) => {
      if (document.activeElement !== taRef.current) return;
      if (e.key === "ArrowDown" && e.altKey) {
        e.preventDefault();
        setSel((i) => (i + 1) % SUGGESTIONS.length);
      } else if (e.key === "ArrowUp" && e.altKey) {
        e.preventDefault();
        setSel((i) => (i - 1 + SUGGESTIONS.length) % SUGGESTIONS.length);
      } else if (e.key === "Enter" && e.altKey) {
        e.preventDefault();
        apply(SUGGESTIONS[sel]);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [focused, sel]);

  return (
    <div className="space-y-4">
      <div className="relative rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <label className="mb-1 block text-[11px] uppercase tracking-wider text-zinc-500">
          Reply to ticket #4826
        </label>
        <textarea
          ref={taRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => window.setTimeout(() => setFocused(false), 120)}
          rows={4}
          className="w-full rounded-md border border-zinc-200 bg-transparent p-2 font-mono text-[12px] outline-none focus:border-violet-400 dark:border-zinc-800"
        />

        {focused && (
          <div className="absolute right-3 top-12 w-72 rounded-lg border border-zinc-200 bg-white p-2 shadow-lg dark:border-zinc-700 dark:bg-zinc-950">
            <div className="mb-1.5 flex items-center justify-between px-1">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-violet-500">
                Next-action assist
              </span>
              <span className="font-mono text-[10px] text-zinc-400">⌥↑↓ ⌥↵</span>
            </div>
            {SUGGESTIONS.map((s, i) => (
              <button
                key={s.id}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => apply(s)}
                className={`block w-full rounded-md px-2 py-1.5 text-left transition ${
                  sel === i
                    ? "bg-violet-50 dark:bg-violet-900/30"
                    : "hover:bg-zinc-50 dark:hover:bg-zinc-900"
                }`}
              >
                <div className={`text-[11px] font-medium ${KIND_TONE[s.kind]}`}>
                  {s.label}
                </div>
                <div className="text-[10px] text-zinc-500">{s.detail}</div>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-lg border border-dashed border-zinc-300 px-4 py-3 text-[11px] text-zinc-500 dark:border-zinc-700">
        Focus the textarea to summon the overlay. Use{" "}
        <Kbd>⌥↑</Kbd> /{" "}
        <Kbd>⌥↓</Kbd> to
        navigate suggestions,{" "}
        <Kbd>⌥↵</Kbd> to
        apply. Caret stays in the input.
      </div>
    </div>
  );
}
