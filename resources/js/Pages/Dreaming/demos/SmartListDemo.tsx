import { useCallback, useMemo, useState } from "react";
import {
  Card,
  Button,
  Switch,
  Select,
  Badge,
  Input,
} from "@particle-academy/react-fancy";

/**
 * SmartList — react-fancy primitive for AI-generated lists. The
 * common pattern: "give me 6 candidate subject lines" / "draft 5
 * tasks for tomorrow" / "suggest 4 query refinements". Without a
 * primitive, every app rebuilds the same row-level affordances.
 *
 * Each row exposes (on hover or focus):
 *
 *   • Regenerate — agent re-produces THIS row
 *   • Explain    — agent posts the rationale (opens an inline note)
 *   • Edit       — inline rename
 *   • Pin        — moves item to a pin board, stays through resets
 *   • Drop       — removes from the list
 *
 * List-level controls:
 *   • Sweep regenerate (refresh unpinned items)
 *   • Topic prompt input that drives the next regeneration
 *   • Counter for pinned vs unpinned
 *
 * The demo runs against a deterministic mock generator. Real
 * react-fancy export would expose `generate` and `regenerateOne`
 * callbacks for the host to wire up.
 */
type Row = {
  id: string;
  body: string;
  /** Optional rationale, revealed via the Explain action. */
  note?: string;
  /** Free-text tag, e.g. confidence tier. */
  tag?: string;
  pinned?: boolean;
  /** Editing state. */
  editing?: boolean;
};

const TOPIC_OPTIONS = [
  { value: "subject", label: "email subject lines" },
  { value: "tasks", label: "tomorrow's tasks" },
  { value: "queries", label: "search query refinements" },
];

const CORPORA: Record<string, { body: string; note: string; tag: string }[]> = {
  subject: [
    { body: "Quick check-in on the Q3 renewal", note: "low-pressure tone, opens conversation", tag: "warm" },
    { body: "Renewal proposal — updated terms inside", note: "factual, sets expectation", tag: "direct" },
    { body: "5 minutes Thursday?", note: "scarcity, conversational", tag: "punchy" },
    { body: "Following up on yesterday's call", note: "anchor to shared context", tag: "warm" },
    { body: "Pricing locked — ready to send", note: "milestone-first", tag: "direct" },
    { body: "One small change before we wrap", note: "creates curiosity", tag: "punchy" },
    { body: "Re: the seat-expansion question", note: "thread-style, low-stakes", tag: "warm" },
  ],
  tasks: [
    { body: "Draft renewal terms for Globex (price + SLA tier)", note: "blocking deal close", tag: "blocking" },
    { body: "Reply to Ada's pricing question", note: "open thread", tag: "quick win" },
    { body: "Audit risk register — Globex and Hooli", note: "stakeholder request", tag: "high stakes" },
    { body: "Push Q2 cohort numbers to the warehouse", note: "infra dependency", tag: "infra" },
    { body: "Review legal's compliance redlines", note: "deadline tomorrow", tag: "blocking" },
    { body: "Sync with Linus on the AE handoff", note: "30-min slot needed", tag: "people" },
    { body: "Update the forecast model with renewal weights", note: "model freshness", tag: "infra" },
  ],
  queries: [
    { body: "renewal AND status:committed AND quarter:2026Q3", note: "narrows to confirmed deals", tag: "narrow" },
    { body: "stripe_event.type:invoice.payment_succeeded last 7d", note: "live revenue signal", tag: "live" },
    { body: "owner:linus AND vertical:fintech", note: "ownership cohort", tag: "narrow" },
    { body: "risk_register.color:red OR risk_register.color:amber", note: "flagged accounts only", tag: "narrow" },
    { body: "FROM compliance@ SUBJECT:redline AFTER:2026-05-01", note: "legal flow", tag: "live" },
    { body: "arr_q2 - arr_q1 > 0 ORDER BY delta DESC", note: "biggest movers", tag: "ranked" },
    { body: "transcripts.tag:expansion AND speaker:customer", note: "customer voice only", tag: "narrow" },
  ],
};

const TAG_COLOR: Record<string, "emerald" | "violet" | "amber" | "red" | "zinc"> = {
  warm: "violet",
  direct: "zinc",
  punchy: "amber",
  blocking: "red",
  "quick win": "emerald",
  "high stakes": "red",
  infra: "violet",
  people: "violet",
  narrow: "emerald",
  live: "violet",
  ranked: "amber",
};

let nextId = 0;
const rid = () => `r${nextId++}`;

export function SmartListDemo() {
  const [topic, setTopic] = useState<keyof typeof CORPORA>("subject");
  const [prompt, setPrompt] = useState("");
  const [showHints, setShowHints] = useState(true);
  const [rows, setRows] = useState<Row[]>(() => generate(topic, 5));

  const regenerateAll = useCallback(() => {
    setRows((cur) => {
      const pinned = cur.filter((r) => r.pinned);
      const fresh = generate(topic, 5);
      return [...pinned, ...fresh];
    });
  }, [topic]);

  const regenerateOne = useCallback(
    (id: string) => {
      setRows((cur) =>
        cur.map((r) => (r.id === id ? { ...r, ...sample(topic), id: r.id, pinned: r.pinned } : r)),
      );
    },
    [topic],
  );

  const toggleExplain = (id: string) =>
    setRows((cur) =>
      cur.map((r) =>
        r.id === id ? { ...r, note: r.note ? undefined : sample(topic).note } : r,
      ),
    );

  const togglePin = (id: string) =>
    setRows((cur) =>
      cur.map((r) => (r.id === id ? { ...r, pinned: !r.pinned } : r)),
    );

  const drop = (id: string) =>
    setRows((cur) => cur.filter((r) => r.id !== id));

  const startEdit = (id: string) =>
    setRows((cur) => cur.map((r) => (r.id === id ? { ...r, editing: true } : r)));

  const setBody = (id: string, body: string) =>
    setRows((cur) => cur.map((r) => (r.id === id ? { ...r, body } : r)));

  const commitEdit = (id: string) =>
    setRows((cur) => cur.map((r) => (r.id === id ? { ...r, editing: false } : r)));

  const pinned = useMemo(() => rows.filter((r) => r.pinned), [rows]);
  const unpinned = useMemo(() => rows.filter((r) => !r.pinned), [rows]);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">SmartList</h1>
        <p className="mt-1 text-sm text-zinc-500">
          A list of AI-generated items where every row exposes regenerate /
          explain / edit / pin / drop on hover. Sweep-regenerate keeps pinned
          rows. The prompt field steers the next generation.
        </p>
      </header>

      <Card>
        <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-3">
          <Select
            label="Generator"
            list={TOPIC_OPTIONS}
            value={topic}
            onValueChange={(v) => {
              setTopic(v as keyof typeof CORPORA);
              setRows(generate(v as keyof typeof CORPORA, 5));
            }}
          />
          <Input
            label="Prompt steer"
            value={prompt}
            onValueChange={setPrompt}
            placeholder="(optional) e.g. 'shorter, less salesy'"
          />
          <div className="flex items-center gap-3 pt-5">
            <Switch checked={showHints} onCheckedChange={setShowHints} />
            <span className="text-sm text-zinc-700 dark:text-zinc-200">
              Always show row affordances
            </span>
          </div>
        </div>
      </Card>

      {pinned.length > 0 && (
        <Card>
          <div className="p-4">
            <div className="mb-2 flex items-center gap-2 text-sm font-medium">
              <span>📌 Pinned</span>
              <Badge color="violet">{pinned.length}</Badge>
              <span className="text-[11px] text-zinc-500">survives regeneration</span>
            </div>
            <ul className="space-y-1.5">
              {pinned.map((r) => (
                <RowView
                  key={r.id}
                  row={r}
                  showHints={showHints}
                  onRegenerate={() => regenerateOne(r.id)}
                  onExplain={() => toggleExplain(r.id)}
                  onEdit={() => startEdit(r.id)}
                  onCommitEdit={() => commitEdit(r.id)}
                  onBodyChange={(v) => setBody(r.id, v)}
                  onPin={() => togglePin(r.id)}
                  onDrop={() => drop(r.id)}
                />
              ))}
            </ul>
          </div>
        </Card>
      )}

      <Card>
        <div className="p-4">
          <div className="mb-3 flex items-center gap-2">
            <span className="text-sm font-medium">Suggestions</span>
            <Badge color="zinc">{unpinned.length}</Badge>
            <Button
              size="sm"
              color="violet"
              onClick={regenerateAll}
              className="ml-auto"
            >
              ↻ regenerate unpinned
            </Button>
          </div>
          {unpinned.length === 0 ? (
            <div className="rounded-md border border-dashed border-zinc-300 p-4 text-center text-[12px] italic text-zinc-400 dark:border-zinc-700">
              Empty — hit regenerate to refill.
            </div>
          ) : (
            <ul className="space-y-1.5">
              {unpinned.map((r) => (
                <RowView
                  key={r.id}
                  row={r}
                  showHints={showHints}
                  onRegenerate={() => regenerateOne(r.id)}
                  onExplain={() => toggleExplain(r.id)}
                  onEdit={() => startEdit(r.id)}
                  onCommitEdit={() => commitEdit(r.id)}
                  onBodyChange={(v) => setBody(r.id, v)}
                  onPin={() => togglePin(r.id)}
                  onDrop={() => drop(r.id)}
                />
              ))}
            </ul>
          )}
        </div>
      </Card>
    </div>
  );
}

function RowView({
  row,
  showHints,
  onRegenerate,
  onExplain,
  onEdit,
  onCommitEdit,
  onBodyChange,
  onPin,
  onDrop,
}: {
  row: Row;
  showHints: boolean;
  onRegenerate: () => void;
  onExplain: () => void;
  onEdit: () => void;
  onCommitEdit: () => void;
  onBodyChange: (v: string) => void;
  onPin: () => void;
  onDrop: () => void;
}) {
  return (
    <li
      className={`group relative rounded-md border px-2.5 py-1.5 transition ${
        row.pinned
          ? "border-violet-300 bg-violet-50/40 dark:border-violet-700 dark:bg-violet-950/30"
          : "border-zinc-200 hover:border-zinc-300 dark:border-zinc-800 dark:hover:border-zinc-700"
      }`}
    >
      <div className="flex items-baseline gap-2">
        {row.tag && <Badge color={TAG_COLOR[row.tag] ?? "zinc"}>{row.tag}</Badge>}
        {row.editing ? (
          <Input
            value={row.body}
            onValueChange={onBodyChange}
            onBlur={onCommitEdit}
            autoFocus
            className="flex-1"
          />
        ) : (
          <span className="flex-1 text-[13px]">{row.body}</span>
        )}
        <div
          className={`flex shrink-0 items-center gap-0.5 ${
            showHints
              ? "opacity-100"
              : "opacity-0 transition group-hover:opacity-100 group-focus-within:opacity-100"
          }`}
        >
          <Button size="sm" variant="ghost" onClick={onRegenerate} title="regenerate this row">
            ↻
          </Button>
          <Button size="sm" variant="ghost" onClick={onExplain} title="explain">
            ?
          </Button>
          <Button size="sm" variant="ghost" onClick={onEdit} title="edit">
            ✎
          </Button>
          <Button size="sm" variant="ghost" onClick={onPin} title={row.pinned ? "unpin" : "pin"}>
            {row.pinned ? "📌" : "📍"}
          </Button>
          <Button size="sm" variant="ghost" onClick={onDrop} title="drop">
            ×
          </Button>
        </div>
      </div>
      {row.note && (
        <div className="mt-1 rounded border-l-2 border-violet-400 bg-violet-50/40 pl-2 text-[11px] text-violet-700 dark:border-violet-600 dark:bg-violet-950/30 dark:text-violet-300">
          {row.note}
        </div>
      )}
    </li>
  );
}

function generate(topic: keyof typeof CORPORA, n: number): Row[] {
  const out: Row[] = [];
  const seen = new Set<string>();
  while (out.length < n) {
    const candidate = sample(topic);
    if (seen.has(candidate.body)) continue;
    seen.add(candidate.body);
    out.push({ id: rid(), body: candidate.body, tag: candidate.tag });
  }
  return out;
}

function sample(topic: keyof typeof CORPORA) {
  const corpus = CORPORA[topic];
  return corpus[Math.floor(Math.random() * corpus.length)];
}
