import { useMemo, useRef, useState } from "react";

export const USAGE = `import { CannedComposer } from "@particle-academy/react-fancy";

<CannedComposer
  value={draft}
  onChange={setDraft}
  variables={{ customer_name: ticket.customer, agent_name: me.name }}
  macros={[
    { name: "/refund-confirmed", body: "Hi {{customer_name}}, your refund of {{amount}} is on the way…" },
    { name: "/ack",              body: "Thanks {{customer_name}} — I've got your ticket and I'm digging in." },
    { name: "/ask-logs",         body: "Could you paste the UTC timestamp + error message?" },
  ]}
  onSend={(text) => sendReply(ticket.id, text)}
/>`;

/**
 * CannedComposer — reply textarea with macro shortcuts and {{variable}}
 * placeholders. Slash-prefix opens a canned-response palette; unresolved
 * variables in the rendered preview show as warning chips so reps never
 * accidentally send raw template text to a customer.
 */
type Macro = { name: string; body: string };

const MACROS: Macro[] = [
  {
    name: "/refund-confirmed",
    body: "Hi {{customer_name}}, your refund of {{amount}} is on the way and should hit your card within 5–10 business days. — {{agent_name}}",
  },
  {
    name: "/ack",
    body: "Thanks {{customer_name}} — I've got your ticket and I'm digging in now. I'll follow up by {{eta}}.",
  },
  {
    name: "/ask-logs",
    body: "Could you paste the timestamp (in UTC) and the error message you saw? That'll help me reproduce on our side.",
  },
];

function findVars(text: string): string[] {
  const out = new Set<string>();
  const rx = /\{\{\s*([\w_]+)\s*\}\}/g;
  let m: RegExpExecArray | null;
  while ((m = rx.exec(text))) out.add(m[1]);
  return Array.from(out);
}

function substitute(text: string, vars: Record<string, string>): { rendered: string; missing: string[] } {
  const missing: string[] = [];
  const rendered = text.replace(/\{\{\s*([\w_]+)\s*\}\}/g, (_, name) => {
    const v = vars[name];
    if (!v) {
      missing.push(name);
      return `{{${name}}}`;
    }
    return v;
  });
  return { rendered, missing };
}

export function CannedComposerDemo() {
  const [text, setText] = useState("");
  const [vars, setVars] = useState<Record<string, string>>({
    customer_name: "Priya",
    agent_name: "Sam",
  });
  const [palette, setPalette] = useState(false);
  const taRef = useRef<HTMLTextAreaElement>(null);

  const allVars = useMemo(() => findVars(text), [text]);
  const { rendered, missing } = useMemo(() => substitute(text, vars), [text, vars]);

  const insert = (m: Macro) => {
    setText((t) => (t.endsWith("\n") || t === "" ? t + m.body : t + "\n" + m.body));
    setPalette(false);
    window.setTimeout(() => taRef.current?.focus(), 0);
  };

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mb-2 flex items-center justify-between">
          <div className="text-sm font-medium">Reply composer</div>
          <button
            onClick={() => setPalette((p) => !p)}
            className="rounded-md border border-zinc-300 px-2 py-1 text-[11px] text-zinc-600 dark:border-zinc-700 dark:text-zinc-300"
          >
            {palette ? "close" : "/ macros"}
          </button>
        </div>

        {palette && (
          <div className="mb-2 rounded-md border border-zinc-200 bg-zinc-50 p-2 dark:border-zinc-800 dark:bg-zinc-950">
            {MACROS.map((m) => (
              <button
                key={m.name}
                onClick={() => insert(m)}
                className="block w-full rounded px-2 py-1 text-left text-xs hover:bg-violet-50 dark:hover:bg-violet-900/30"
              >
                <span className="font-mono text-violet-600 dark:text-violet-300">
                  {m.name}
                </span>
                <span className="ml-2 truncate text-zinc-500">
                  {m.body.slice(0, 60)}…
                </span>
              </button>
            ))}
          </div>
        )}

        <textarea
          ref={taRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={5}
          placeholder="Write a reply… or click /macros."
          className="w-full rounded-md border border-zinc-200 bg-transparent p-2 font-mono text-[12px] outline-none focus:border-violet-400 dark:border-zinc-800"
        />

        {allVars.length > 0 && (
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <span className="text-[10px] uppercase tracking-wider text-zinc-400">
              variables
            </span>
            {allVars.map((v) => {
              const filled = !!vars[v];
              return (
                <span
                  key={v}
                  className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-mono ${
                    filled
                      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300"
                      : "bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300"
                  }`}
                >
                  {v}
                  <input
                    value={vars[v] ?? ""}
                    placeholder="…"
                    onChange={(e) =>
                      setVars((p) => ({ ...p, [v]: e.target.value }))
                    }
                    className="w-20 bg-transparent text-[10px] outline-none"
                  />
                </span>
              );
            })}
          </div>
        )}
      </div>

      <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mb-1 text-[11px] uppercase tracking-wider text-zinc-500">
          Preview
        </div>
        <div className="whitespace-pre-wrap text-sm">
          {rendered || (
            <span className="italic text-zinc-400">Nothing to preview yet.</span>
          )}
        </div>
        <div className="mt-3 flex items-center justify-between">
          <div className="text-[11px] text-zinc-500">
            {missing.length === 0 ? (
              <span className="text-emerald-600">✓ All variables resolved.</span>
            ) : (
              <span className="text-amber-600">
                {missing.length} unresolved — fix before sending.
              </span>
            )}
          </div>
          <button
            disabled={missing.length > 0 || !text}
            className="rounded-md bg-violet-600 px-3 py-1 text-xs font-medium text-white disabled:cursor-not-allowed disabled:opacity-40"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
