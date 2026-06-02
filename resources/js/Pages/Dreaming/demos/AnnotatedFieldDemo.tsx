import { useCallback, useMemo, useState } from "react";
import {
  Card,
  Button,
  Switch,
  Select,
  Badge,
  Input,
  Textarea,
} from "@particle-academy/react-fancy";

/**
 * AnnotatedField — react-fancy primitive that wraps any form input
 * with a margin annotation slot. The slot holds a tiny threaded
 * conversation pinned to that specific field. Agents can drop
 * "set X because Y" notes; humans can reply, resolve, or convert
 * any note's suggested value straight into the field.
 *
 * Layout:
 *
 *   [ label ───────────── unread badge ]
 *   [ <input / textarea>             ]
 *   [ margin annotation thread       ]   ← collapsible
 *
 * Each Note has:
 *   • author (agent / human)
 *   • body (free text)
 *   • optional `suggestedValue` — clicking "use this" calls
 *     onValueChange(suggestedValue) and resolves the note
 *   • resolved flag (resolved notes dim out)
 *
 * Designed to stack: a whole form is a set of AnnotatedFields, and
 * the annotations cascade down the right margin like editorial
 * comments. Use Tabs to switch between "open" and "resolved" threads.
 */
type Author = {
  id: string;
  name: string;
  color: string;
  kind: "human" | "agent";
};

type Note = {
  id: string;
  fieldId: string;
  author: Author;
  body: string;
  suggestedValue?: string;
  resolved?: boolean;
  at: number;
};

const AUTHORS: Record<string, Author> = {
  you: { id: "you", name: "You", color: "#0ea5e9", kind: "human" },
  planner: { id: "planner", name: "Planner", color: "#a855f7", kind: "agent" },
  scribe: { id: "scribe", name: "Scribe", color: "#10b981", kind: "agent" },
  auditor: { id: "auditor", name: "Auditor", color: "#f59e0b", kind: "agent" },
};

const NOW = Date.now();

const SEED_NOTES: Note[] = [
  {
    id: "n1",
    fieldId: "company",
    author: AUTHORS.scribe,
    body: "Legal entity for the renewal is the full name, not the trade name.",
    suggestedValue: "Globex Corporation",
    at: NOW - 6 * 60_000,
  },
  {
    id: "n2",
    fieldId: "amount",
    author: AUTHORS.planner,
    body: "Expansion path puts the renewal at $60k, not $45k — see the model.",
    suggestedValue: "60000",
    at: NOW - 4 * 60_000,
  },
  {
    id: "n3",
    fieldId: "amount",
    author: AUTHORS.auditor,
    body: "Flagging because legal hasn't signed off on the expanded SLA tier yet.",
    at: NOW - 90_000,
  },
  {
    id: "n4",
    fieldId: "summary",
    author: AUTHORS.scribe,
    body: "Tighter draft: 'Renewal stacked at $60k with Gold SLA. Compliance review still open with legal.'",
    suggestedValue:
      "Renewal stacked at $60k with Gold SLA. Compliance review still open with legal.",
    at: NOW - 30_000,
  },
];

type FormState = {
  company: string;
  amount: string;
  summary: string;
};

export function AnnotatedFieldDemo() {
  const [state, setState] = useState<FormState>({
    company: "Globex",
    amount: "45000",
    summary: "Q3 renewal — proposal sent.",
  });
  const [notes, setNotes] = useState<Note[]>(SEED_NOTES);
  const [alwaysOpen, setAlwaysOpen] = useState(true);
  const [filter, setFilter] = useState<string>("");

  const visibleNotes = useCallback(
    (fieldId: string) => {
      const all = notes.filter((n) => n.fieldId === fieldId);
      return filter ? all.filter((n) => n.author.id === filter) : all;
    },
    [notes, filter],
  );

  const setField = <K extends keyof FormState>(key: K, v: FormState[K]) =>
    setState((cur) => ({ ...cur, [key]: v }));

  const addReply = (fieldId: string, body: string) => {
    if (!body.trim()) return;
    setNotes((cur) => [
      ...cur,
      {
        id: `n-${Date.now().toString(36)}`,
        fieldId,
        author: AUTHORS.you,
        body: body.trim(),
        at: Date.now(),
      },
    ]);
  };

  const resolve = (id: string) =>
    setNotes((cur) =>
      cur.map((n) => (n.id === id ? { ...n, resolved: !n.resolved } : n)),
    );

  const useSuggestion = (fieldId: keyof FormState, value: string, noteId: string) => {
    setField(fieldId, value as FormState[typeof fieldId]);
    setNotes((cur) =>
      cur.map((n) => (n.id === noteId ? { ...n, resolved: true } : n)),
    );
  };

  const counts = useMemo(() => {
    const c: Record<string, { open: number; resolved: number }> = {};
    for (const n of notes) {
      c[n.fieldId] = c[n.fieldId] ?? { open: 0, resolved: 0 };
      if (n.resolved) c[n.fieldId].resolved++;
      else c[n.fieldId].open++;
    }
    return c;
  }, [notes]);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">AnnotatedField</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Form inputs that carry threaded annotations in their margin. Agents
          drop "set X because Y" notes with a suggested value; humans reply,
          resolve, or one-click apply a suggestion into the field.
        </p>
      </header>

      <Card>
        <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-3">
          <Select
            label="Filter by author"
            list={[
              { value: "", label: "all authors" },
              ...Object.values(AUTHORS).map((a) => ({
                value: a.id,
                label: a.name,
              })),
            ]}
            value={filter}
            onValueChange={setFilter}
          />
          <div className="flex items-center gap-3 pt-5">
            <Switch checked={alwaysOpen} onCheckedChange={setAlwaysOpen} />
            <span className="text-sm text-zinc-700 dark:text-zinc-200">
              Always show threads
            </span>
          </div>
          <div className="pt-5 text-[11px] text-zinc-500">
            {notes.filter((n) => !n.resolved).length} open ·{" "}
            {notes.filter((n) => n.resolved).length} resolved
          </div>
        </div>
      </Card>

      <Card>
        <div className="space-y-4 p-4">
          <FieldRow
            label="Company"
            fieldId="company"
            kind="input"
            value={state.company}
            onValueChange={(v) => setField("company", v)}
            notes={visibleNotes("company")}
            counts={counts["company"]}
            alwaysOpen={alwaysOpen}
            onReply={(b) => addReply("company", b)}
            onResolve={resolve}
            onUseSuggestion={(v, id) => useSuggestion("company", v, id)}
          />
          <FieldRow
            label="Renewal amount (cents)"
            fieldId="amount"
            kind="input"
            value={state.amount}
            onValueChange={(v) => setField("amount", v)}
            notes={visibleNotes("amount")}
            counts={counts["amount"]}
            alwaysOpen={alwaysOpen}
            onReply={(b) => addReply("amount", b)}
            onResolve={resolve}
            onUseSuggestion={(v, id) => useSuggestion("amount", v, id)}
          />
          <FieldRow
            label="Summary"
            fieldId="summary"
            kind="textarea"
            value={state.summary}
            onValueChange={(v) => setField("summary", v)}
            notes={visibleNotes("summary")}
            counts={counts["summary"]}
            alwaysOpen={alwaysOpen}
            onReply={(b) => addReply("summary", b)}
            onResolve={resolve}
            onUseSuggestion={(v, id) => useSuggestion("summary", v, id)}
          />
        </div>
      </Card>
    </div>
  );
}

function FieldRow({
  label,
  fieldId,
  kind,
  value,
  onValueChange,
  notes,
  counts,
  alwaysOpen,
  onReply,
  onResolve,
  onUseSuggestion,
}: {
  label: string;
  fieldId: string;
  kind: "input" | "textarea";
  value: string;
  onValueChange: (v: string) => void;
  notes: Note[];
  counts?: { open: number; resolved: number };
  alwaysOpen: boolean;
  onReply: (body: string) => void;
  onResolve: (id: string) => void;
  onUseSuggestion: (value: string, noteId: string) => void;
}) {
  const [open, setOpen] = useState(alwaysOpen);
  const [draft, setDraft] = useState("");
  const effOpen = alwaysOpen || open;
  return (
    <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1fr_320px]">
      <div>
        <div className="mb-1 flex items-center gap-2">
          <span className="text-sm font-medium">{label}</span>
          {counts && counts.open > 0 && (
            <Badge color="violet">{counts.open} note{counts.open === 1 ? "" : "s"}</Badge>
          )}
          {counts && counts.resolved > 0 && (
            <Badge color="emerald">{counts.resolved} resolved</Badge>
          )}
          {!alwaysOpen && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setOpen((o) => !o)}
              className="ml-auto"
            >
              {open ? "hide thread" : "show thread"}
            </Button>
          )}
        </div>
        {kind === "input" ? (
          <Input value={value} onValueChange={onValueChange} />
        ) : (
          <Textarea value={value} onValueChange={onValueChange} rows={3} />
        )}
      </div>
      <aside
        className={`rounded-md border border-zinc-200 p-2 transition dark:border-zinc-800 ${
          effOpen ? "" : "pointer-events-none opacity-0"
        }`}
        style={{ display: effOpen ? undefined : "none" }}
      >
        <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
          Margin
        </div>
        {notes.length === 0 ? (
          <div className="text-[11px] italic text-zinc-400">
            No annotations yet.
          </div>
        ) : (
          <ul className="space-y-1.5">
            {notes.map((n) => (
              <NoteRow
                key={n.id}
                note={n}
                onResolve={() => onResolve(n.id)}
                onUseSuggestion={
                  n.suggestedValue !== undefined
                    ? () => onUseSuggestion(n.suggestedValue!, n.id)
                    : undefined
                }
              />
            ))}
          </ul>
        )}
        <div className="mt-2 space-y-1">
          <Textarea
            value={draft}
            onValueChange={setDraft}
            placeholder="reply…"
            rows={2}
          />
          <div className="flex justify-end">
            <Button
              size="sm"
              color="violet"
              onClick={() => {
                onReply(draft);
                setDraft("");
              }}
              disabled={!draft.trim()}
            >
              send reply
            </Button>
          </div>
        </div>
      </aside>
    </div>
  );
}

function NoteRow({
  note,
  onResolve,
  onUseSuggestion,
}: {
  note: Note;
  onResolve: () => void;
  onUseSuggestion?: () => void;
}) {
  return (
    <li
      className={`rounded-md border px-2 py-1.5 text-[12px] transition ${
        note.resolved
          ? "border-zinc-200 bg-zinc-50 opacity-60 dark:border-zinc-800 dark:bg-zinc-950"
          : "border-zinc-200 dark:border-zinc-800"
      }`}
    >
      <div className="flex items-center gap-1.5">
        <span
          className="h-1.5 w-1.5 rounded-full"
          style={{ backgroundColor: note.author.color }}
        />
        <span className="font-medium" style={{ color: note.author.color }}>
          {note.author.name}
        </span>
        <span className="text-[9px] uppercase tracking-wider text-zinc-400">
          {note.author.kind}
        </span>
        <span className="ml-auto text-[10px] text-zinc-400">{ago(note.at)}</span>
      </div>
      <div className="mt-0.5 text-zinc-700 dark:text-zinc-200">
        {note.resolved ? <s>{note.body}</s> : note.body}
      </div>
      {note.suggestedValue !== undefined && !note.resolved && (
        <div className="mt-1 rounded border border-violet-200 bg-violet-50/50 p-1.5 dark:border-violet-900 dark:bg-violet-950/30">
          <div className="text-[10px] uppercase tracking-wider text-violet-700 dark:text-violet-300">
            suggested
          </div>
          <div className="mt-0.5 font-mono text-[11px] text-zinc-700 dark:text-zinc-200">
            {note.suggestedValue}
          </div>
        </div>
      )}
      <div className="mt-1 flex gap-1">
        {onUseSuggestion && !note.resolved && (
          <Button size="sm" color="emerald" onClick={onUseSuggestion}>
            use this
          </Button>
        )}
        <Button size="sm" variant="ghost" onClick={onResolve}>
          {note.resolved ? "reopen" : "✓ resolve"}
        </Button>
      </div>
    </li>
  );
}

function ago(ms: number) {
  const d = Date.now() - ms;
  if (d < 60_000) return `${Math.floor(d / 1_000)}s`;
  if (d < 3_600_000) return `${Math.floor(d / 60_000)}m`;
  return `${Math.floor(d / 3_600_000)}h`;
}
