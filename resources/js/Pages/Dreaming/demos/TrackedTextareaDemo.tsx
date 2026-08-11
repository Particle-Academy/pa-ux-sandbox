import { useCallback, useMemo, useState } from "react";
import {
  Card,
  Button,
  Switch,
  Select,
  Badge,
  Tooltip,
} from "@particle-academy/react-fancy";

/**
 * TrackedTextarea — react-fancy primitive for collaborative editing
 * with visible track-changes.
 *
 * The underlying state isn't a string: it's a sequence of `Span`s.
 * Each span is either committed text (no author markers) or an edit
 * span with `op: "ins" | "del"` and an `author` id. The component
 * renders edits inline — insertions in the author's color, deletions
 * as strikethrough — and lets the human accept/reject any individual
 * change via a Tooltip-anchored popover. Acceptance collapses the
 * span into the committed text; rejection removes it.
 *
 * Agents (and other humans) feed edits in via `proposeInsertion` and
 * `proposeDeletion` helpers — the real component would expose these
 * via a context plus a `useTrackedTextarea(value)` hook.
 *
 * Demo seeds a paragraph with edits from three agents so the visual
 * texture is immediately legible.
 */
type Author = { id: string; name: string; color: string };

type Span =
  | { id: string; op: "text"; value: string }
  | { id: string; op: "ins" | "del"; value: string; author: string };

const AUTHORS: Record<string, Author> = {
  planner: { id: "planner", name: "Planner", color: "#a855f7" },
  scribe: { id: "scribe", name: "Scribe", color: "#10b981" },
  auditor: { id: "auditor", name: "Auditor", color: "#f59e0b" },
};

let nextSpanId = 0;
const sid = () => `s${nextSpanId++}`;

const SEED: Span[] = [
  { id: sid(), op: "text", value: "The Q3 forecast " },
  { id: sid(), op: "ins", value: "still ", author: "planner" },
  { id: sid(), op: "text", value: "holds: ARR climbs " },
  { id: sid(), op: "del", value: "around 12%", author: "auditor" },
  { id: sid(), op: "ins", value: "approximately 14%", author: "planner" },
  { id: sid(), op: "text", value: " on existing-customer expansion, with renewals " },
  { id: sid(), op: "ins", value: "capturing the bulk of growth", author: "scribe" },
  { id: sid(), op: "del", value: "carrying it", author: "scribe" },
  { id: sid(), op: "text", value: ". Risk is concentrated in two accounts — both " },
  { id: sid(), op: "ins", value: "with a clean mitigation path", author: "planner" },
  { id: sid(), op: "text", value: " I've drafted on the whiteboard." },
];

export function TrackedTextareaDemo() {
  const [spans, setSpans] = useState<Span[]>(SEED);
  const [showLegend, setShowLegend] = useState(true);
  const [authorFilter, setAuthorFilter] = useState<string>("");

  const resolvedText = useMemo(() => {
    return spans
      .map((s) => {
        if (s.op === "text") return s.value;
        if (s.op === "ins") return s.value;
        return "";
      })
      .join("");
  }, [spans]);

  const counts = useMemo(() => {
    const out: Record<string, { ins: number; del: number }> = {};
    for (const s of spans) {
      if (s.op !== "ins" && s.op !== "del") continue;
      out[s.author] = out[s.author] ?? { ins: 0, del: 0 };
      if (s.op === "ins") out[s.author].ins++;
      else out[s.author].del++;
    }
    return out;
  }, [spans]);

  const accept = useCallback((id: string) => {
    setSpans((cur) =>
      cur.flatMap((s) => {
        if (s.id !== id) return [s];
        if (s.op === "ins") return [{ id: s.id, op: "text" as const, value: s.value }];
        if (s.op === "del") return []; // delete commits to removal
        return [s];
      }),
    );
  }, []);

  const reject = useCallback((id: string) => {
    setSpans((cur) =>
      cur.flatMap((s) => {
        if (s.id !== id) return [s];
        if (s.op === "ins") return []; // insertion rejected — discard
        if (s.op === "del") return [{ id: s.id, op: "text" as const, value: s.value }]; // delete rejected — restore
        return [s];
      }),
    );
  }, []);

  const acceptAllBy = (author: string) => {
    setSpans((cur) =>
      cur.flatMap((s) => {
        if (s.op === "text") return [s];
        if (s.author !== author) return [s];
        if (s.op === "ins") return [{ id: s.id, op: "text" as const, value: s.value }];
        return [];
      }),
    );
  };

  const rejectAllBy = (author: string) => {
    setSpans((cur) =>
      cur.flatMap((s) => {
        if (s.op === "text") return [s];
        if (s.author !== author) return [s];
        if (s.op === "ins") return [];
        return [{ id: s.id, op: "text" as const, value: s.value }];
      }),
    );
  };

  const reset = () => setSpans(SEED);

  const visibleSpans = useMemo(
    () =>
      authorFilter
        ? spans.map((s) =>
            s.op === "text" || s.author === authorFilter ? s : { ...s, dim: true as const },
          )
        : spans.map((s) => ({ ...s, dim: false as const })),
    [spans, authorFilter],
  );

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">TrackedTextarea</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Inline track-changes for collaborative text. Insertions appear in the
          author's color; deletions strike through. Click any edit for a
          per-change accept/reject. Filter by author or sweep-accept an entire
          author's edits.
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
            value={authorFilter}
            onValueChange={setAuthorFilter}
          />
          <div className="flex items-center gap-3 pt-5">
            <Switch checked={showLegend} onCheckedChange={setShowLegend} />
            <span className="text-sm text-zinc-700 dark:text-zinc-200">
              Show legend
            </span>
          </div>
          <div className="flex items-center justify-end gap-2 pt-4">
            <Button size="sm" onClick={reset}>
              reset seed
            </Button>
          </div>
        </div>
      </Card>

      {showLegend && (
        <Card>
          <div className="p-4">
            <div className="mb-2 text-sm font-medium">Authors</div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {Object.values(AUTHORS).map((a) => {
                const c = counts[a.id] ?? { ins: 0, del: 0 };
                return (
                  <div
                    key={a.id}
                    className="flex items-center gap-2 rounded-md border border-zinc-200 p-2 dark:border-zinc-800"
                  >
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: a.color }}
                    />
                    <span className="text-sm font-medium">{a.name}</span>
                    <Badge color="emerald">+{c.ins}</Badge>
                    <Badge color="red">−{c.del}</Badge>
                    <div className="ml-auto flex gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => acceptAllBy(a.id)}
                        disabled={c.ins + c.del === 0}
                      >
                        ✓ all
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => rejectAllBy(a.id)}
                        disabled={c.ins + c.del === 0}
                      >
                        ✕ all
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </Card>
      )}

      <Card>
        <div className="p-4">
          <div className="mb-2 text-sm font-medium">Live document</div>
          <div className="min-h-[140px] rounded-md border border-zinc-200 bg-white px-3 py-2 text-[14px] leading-relaxed dark:border-zinc-800 dark:bg-zinc-950">
            {visibleSpans.map((s) => (
              <SpanView
                key={s.id}
                span={s}
                onAccept={() => accept(s.id)}
                onReject={() => reject(s.id)}
              />
            ))}
          </div>
        </div>
      </Card>

      <Card>
        <div className="p-4">
          <div className="mb-2 flex items-center gap-2 text-sm font-medium">
            <span>Resolved (after current decisions)</span>
            <Badge color="zinc">read-only preview</Badge>
          </div>
          <div className="whitespace-pre-wrap rounded-md border border-dashed border-zinc-200 bg-zinc-50 px-3 py-2 text-[13px] leading-relaxed text-zinc-700 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200">
            {resolvedText}
          </div>
        </div>
      </Card>
    </div>
  );
}

type ViewSpan = Span & { dim?: boolean };

function SpanView({
  span,
  onAccept,
  onReject,
}: {
  span: ViewSpan;
  onAccept: () => void;
  onReject: () => void;
}) {
  if (span.op === "text") {
    return <span>{span.value}</span>;
  }
  const author = AUTHORS[span.author];
  const dim = span.dim;
  const style: React.CSSProperties = {
    color: span.op === "del" ? author?.color : author?.color,
    backgroundColor: (author?.color ?? "#999") + (dim ? "08" : "22"),
    textDecoration: span.op === "del" ? "line-through" : undefined,
    textDecorationColor: author?.color,
    opacity: dim ? 0.35 : 1,
  };
  return (
    <Tooltip
      content={
        <div className="space-y-1 text-[12px]">
          <div className="flex items-center gap-2">
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={{ backgroundColor: author?.color }}
            />
            <span className="font-medium" style={{ color: author?.color }}>
              {author?.name}
            </span>
            <Badge color={span.op === "ins" ? "emerald" : "red"}>
              {span.op === "ins" ? "insert" : "delete"}
            </Badge>
          </div>
          <div className="font-mono text-zinc-700 dark:text-zinc-200">
            "{span.value}"
          </div>
          <div className="flex gap-1 pt-1">
            <Button size="sm" color="emerald" onClick={onAccept}>
              ✓ accept
            </Button>
            <Button size="sm" onClick={onReject}>
              ✕ reject
            </Button>
          </div>
        </div>
      }
    >
      <span
        className="cursor-pointer rounded-sm px-0.5"
        style={style}
        onClick={(e) => {
          // simple click → accept; cmd/shift+click → reject
          if (e.shiftKey || e.metaKey) onReject();
          else onAccept();
        }}
        title="click accept · shift-click reject"
      >
        {span.value}
      </span>
    </Tooltip>
  );
}
