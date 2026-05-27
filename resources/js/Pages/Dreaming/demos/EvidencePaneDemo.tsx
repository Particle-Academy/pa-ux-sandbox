import { useMemo, useState } from "react";
import {
  Card,
  Action,
  Switch,
  Select,
  Badge,
  Tabs,
} from "@particle-academy/react-fancy";

/**
 * EvidencePane — react-fancy primitive that docks beneath an AI
 * answer and exposes the sources behind it: retrieved snippets,
 * citations, tool calls, and search results. Two-way linking with
 * the answer:
 *
 *   • [n] tokens in the answer hover-highlight the matching evidence
 *     row in the pane.
 *   • clicking an evidence row pulses the referencing span in the
 *     answer.
 *
 * Three tabs cover the typical evidence shapes:
 *   • Citations — labeled snippets with optional href
 *   • Retrieval — chunk hits with score + source path
 *   • Tools — tool calls (name, args summary, success/fail, duration)
 *
 * Distinct from ReasonTag (per-value hover popover) — EvidencePane is
 * per-answer, persistent, and supports drilling in.
 */
type Citation = {
  id: string;
  label: string;
  excerpt: string;
  href?: string;
};

type Retrieval = {
  id: string;
  path: string;
  score: number;
  chunk: string;
};

type ToolCall = {
  id: string;
  name: string;
  args: string;
  ok: boolean;
  ms: number;
  result?: string;
};

type Answer = {
  body: string;
  citations: Citation[];
  retrievals: Retrieval[];
  tools: ToolCall[];
};

const ANSWER: Answer = {
  body:
    "The Q3 forecast holds. ARR climbs roughly 14% on existing-customer expansion [1], with renewals capturing the bulk [2]. Two accounts remain at risk [3]; both have a clean mitigation path I've already drafted on the whiteboard.",
  citations: [
    {
      id: "1",
      label: "Expansion model · v3",
      excerpt:
        "Historical expansion uplift across the existing-customer cohort holds at 13.6% ± 1.8% over the last 6 quarters.",
    },
    {
      id: "2",
      label: "Renewal cohort · Q2 actuals",
      excerpt:
        "Renewals contributed 78% of ARR growth in Q2, with expansion accounting for the remaining 22%.",
    },
    {
      id: "3",
      label: "Risk register · 2026-05-09",
      excerpt:
        "Two accounts flagged red on the risk register: Globex (compliance) and Hooli (executive sponsor change).",
    },
  ],
  retrievals: [
    {
      id: "r1",
      path: "warehouse/exports/arr-by-cohort-q2.csv",
      score: 0.92,
      chunk:
        "expansion_arr_q2,29400 ; renewal_arr_q2,104300 ; new_arr_q2,18900",
    },
    {
      id: "r2",
      path: "wiki/Forecasting/Expansion.md",
      score: 0.81,
      chunk: "## Methodology\nWe compute expansion uplift from rolling-6Q averages…",
    },
    {
      id: "r3",
      path: "tickets/RISK-422",
      score: 0.74,
      chunk:
        "Customer Globex flagged after exec sponsor change. Mitigation: re-engagement plan owned by Linus.",
    },
  ],
  tools: [
    {
      id: "t1",
      name: "warehouse_query",
      args: 'select expansion_arr,renewal_arr from cohort where q="2026Q2"',
      ok: true,
      ms: 312,
      result: "2 rows · {expansion: 29400, renewal: 104300}",
    },
    {
      id: "t2",
      name: "risk_register_search",
      args: 'red AND owner != "unassigned"',
      ok: true,
      ms: 87,
      result: "2 accounts",
    },
    {
      id: "t3",
      name: "whiteboard_describe",
      args: "board=q3-strategy",
      ok: false,
      ms: 1410,
      result: "timeout after 1400ms",
    },
  ],
};

export function EvidencePaneDemo() {
  const [openByDefault, setOpenByDefault] = useState(true);
  const [variant, setVariant] = useState<"compact" | "full">("full");
  const [pulsing, setPulsing] = useState<string | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);

  const pulse = (citationId: string) => {
    setPulsing(citationId);
    window.setTimeout(() => {
      setPulsing((p) => (p === citationId ? null : p));
    }, 1200);
  };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">EvidencePane</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Persistent evidence drawer docked beneath an AI answer. Two-way links
          between citation tokens and source rows — hover a [n] to highlight
          its row, click a row to pulse its span.
        </p>
      </header>

      <Card>
        <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2">
          <Select
            label="Variant"
            list={[
              { value: "full", label: "full (excerpts + tools)" },
              { value: "compact", label: "compact (labels only)" },
            ]}
            value={variant}
            onValueChange={(v) => setVariant(v as "compact" | "full")}
          />
          <div className="flex items-center gap-3 pt-5">
            <Switch checked={openByDefault} onCheckedChange={setOpenByDefault} />
            <span className="text-sm text-zinc-700 dark:text-zinc-200">
              Open evidence drawer by default
            </span>
          </div>
        </div>
      </Card>

      <Card>
        <div className="p-4">
          <div className="mb-2 flex items-center gap-2 text-sm font-medium">
            <Badge color="violet">Planner</Badge>
            <span>answered</span>
            <span className="ml-auto font-mono text-[11px] text-zinc-500">
              just now · ~280 tokens
            </span>
          </div>
          <AnswerBody
            body={ANSWER.body}
            hoveredCitation={hovered}
            pulsingCitation={pulsing}
          />
          <EvidenceDrawer
            answer={ANSWER}
            defaultOpen={openByDefault}
            variant={variant}
            onCitationHover={setHovered}
            onCitationClick={pulse}
          />
        </div>
      </Card>
    </div>
  );
}

function AnswerBody({
  body,
  hoveredCitation,
  pulsingCitation,
}: {
  body: string;
  hoveredCitation: string | null;
  pulsingCitation: string | null;
}) {
  const parts = useMemo(() => parseCitations(body), [body]);
  return (
    <p className="rounded-md border border-zinc-200 bg-white px-3 py-2 text-[14px] leading-relaxed dark:border-zinc-800 dark:bg-zinc-950">
      {parts.map((p, i) =>
        typeof p === "string" ? (
          <span key={i}>{p}</span>
        ) : (
          <CitationToken
            key={i}
            id={p.id}
            highlighted={hoveredCitation === p.id}
            pulsing={pulsingCitation === p.id}
          />
        ),
      )}
    </p>
  );
}

function CitationToken({
  id,
  highlighted,
  pulsing,
}: {
  id: string;
  highlighted: boolean;
  pulsing: boolean;
}) {
  return (
    <span
      className={`mx-0.5 inline-flex h-4 cursor-help items-center justify-center rounded-sm px-1 align-middle text-[10px] font-medium transition ${
        highlighted
          ? "bg-violet-500 text-white"
          : "bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-200"
      } ${pulsing ? "animate-pulse" : ""}`}
    >
      {id}
    </span>
  );
}

function EvidenceDrawer({
  answer,
  defaultOpen,
  variant,
  onCitationHover,
  onCitationClick,
}: {
  answer: Answer;
  defaultOpen: boolean;
  variant: "compact" | "full";
  onCitationHover: (id: string | null) => void;
  onCitationClick: (id: string) => void;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="mt-3 overflow-hidden rounded-md border border-zinc-200 dark:border-zinc-800">
      <div className="flex items-center gap-2 bg-zinc-50 px-3 py-1.5 text-[11px] dark:bg-zinc-900">
        <span className="font-medium uppercase tracking-wider text-zinc-500">
          Evidence
        </span>
        <Badge color="emerald">{answer.citations.length} cites</Badge>
        <Badge color="zinc">{answer.retrievals.length} retrievals</Badge>
        <Badge color="amber">
          {answer.tools.filter((t) => t.ok).length}/{answer.tools.length} tools
        </Badge>
        <Action
          size="sm"
          variant="ghost"
          onClick={() => setOpen((o) => !o)}
          className="ml-auto"
        >
          {open ? "hide ▴" : "show ▾"}
        </Action>
      </div>
      {open && (
        <div className="bg-white p-3 dark:bg-zinc-950">
          <Tabs defaultValue="citations">
            <Tabs.List>
              <Tabs.Tab value="citations">Citations</Tabs.Tab>
              <Tabs.Tab value="retrievals">Retrieval</Tabs.Tab>
              <Tabs.Tab value="tools">Tools</Tabs.Tab>
            </Tabs.List>
            <Tabs.Panel value="citations">
              <ul className="mt-2 space-y-2">
                {answer.citations.map((c) => (
                  <li
                    key={c.id}
                    onMouseEnter={() => onCitationHover(c.id)}
                    onMouseLeave={() => onCitationHover(null)}
                    onClick={() => onCitationClick(c.id)}
                    className="cursor-pointer rounded-md border border-zinc-200 p-2 transition hover:border-violet-400 dark:border-zinc-800 dark:hover:border-violet-600"
                  >
                    <div className="flex items-baseline gap-2 text-[12px]">
                      <span className="inline-flex h-4 items-center justify-center rounded-sm bg-violet-100 px-1 font-mono text-[10px] font-medium text-violet-700 dark:bg-violet-500/20 dark:text-violet-200">
                        {c.id}
                      </span>
                      <span className="font-medium">{c.label}</span>
                    </div>
                    {variant === "full" && (
                      <p className="mt-1 text-[12px] italic text-zinc-600 dark:text-zinc-300">
                        "{c.excerpt}"
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            </Tabs.Panel>
            <Tabs.Panel value="retrievals">
              <ul className="mt-2 space-y-2">
                {answer.retrievals.map((r) => (
                  <li
                    key={r.id}
                    className="rounded-md border border-zinc-200 p-2 dark:border-zinc-800"
                  >
                    <div className="flex items-baseline gap-2 text-[12px]">
                      <span className="font-mono text-[11px] text-violet-700 dark:text-violet-300">
                        {r.path}
                      </span>
                      <Badge
                        color={
                          r.score >= 0.85 ? "emerald" : r.score >= 0.7 ? "amber" : "red"
                        }
                      >
                        {(r.score * 100).toFixed(0)}
                      </Badge>
                    </div>
                    {variant === "full" && (
                      <pre className="mt-1 whitespace-pre-wrap rounded bg-zinc-50 px-2 py-1 font-mono text-[11px] text-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">
                        {r.chunk}
                      </pre>
                    )}
                  </li>
                ))}
              </ul>
            </Tabs.Panel>
            <Tabs.Panel value="tools">
              <ul className="mt-2 space-y-2">
                {answer.tools.map((t) => (
                  <li
                    key={t.id}
                    className="rounded-md border border-zinc-200 p-2 dark:border-zinc-800"
                  >
                    <div className="flex items-baseline gap-2 text-[12px]">
                      <span className="font-mono font-medium text-violet-700 dark:text-violet-300">
                        {t.name}
                      </span>
                      <Badge color={t.ok ? "emerald" : "red"}>
                        {t.ok ? "ok" : "failed"}
                      </Badge>
                      <span className="ml-auto font-mono text-[10px] text-zinc-500">
                        {t.ms} ms
                      </span>
                    </div>
                    {variant === "full" && (
                      <>
                        <div className="mt-1 font-mono text-[11px] text-zinc-600 dark:text-zinc-300">
                          → {t.args}
                        </div>
                        {t.result && (
                          <div
                            className={`mt-0.5 font-mono text-[11px] ${
                              t.ok
                                ? "text-emerald-700 dark:text-emerald-300"
                                : "text-rose-700 dark:text-rose-300"
                            }`}
                          >
                            ↳ {t.result}
                          </div>
                        )}
                      </>
                    )}
                  </li>
                ))}
              </ul>
            </Tabs.Panel>
          </Tabs>
        </div>
      )}
    </div>
  );
}

type Part = string | { kind: "cite"; id: string };

function parseCitations(body: string): Part[] {
  const re = /\[(\w+)\]/g;
  const out: Part[] = [];
  let last = 0;
  for (const m of body.matchAll(re)) {
    const start = m.index ?? 0;
    if (start > last) out.push(body.slice(last, start));
    out.push({ kind: "cite", id: m[1] });
    last = start + m[0].length;
  }
  if (last < body.length) out.push(body.slice(last));
  return out;
}
