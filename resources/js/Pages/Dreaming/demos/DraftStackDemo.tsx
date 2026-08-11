import { useCallback, useMemo, useState } from "react";
import {
  Card,
  Button,
  Switch,
  Select,
  Badge,
  Textarea,
} from "@particle-academy/react-fancy";

/**
 * DraftStack — react-fancy primitive for navigating competing AI
 * drafts. The agent emits N candidate drafts for the same field; the
 * human flips through them, sees a word-level diff against the
 * neighbor, and either accepts one or merges hand-edits back into
 * the field. Compare mode shows two drafts side-by-side.
 *
 * Designed for the common pattern: "give me 3 ways to phrase this,"
 * "rewrite this in a friendlier tone," "suggest three subjects."
 * Without a primitive, every app reinvents radio-button-of-blobs UX.
 */
type Draft = {
  id: string;
  label: string;
  body: string;
  /** Free-text tag — author, tone, or strategy. */
  by?: string;
  /** 0..1 quality / vote score from the agent's self-eval. */
  score?: number;
};

const SAMPLES: Record<string, Draft[]> = {
  email: [
    {
      id: "e1",
      label: "Crisp",
      by: "Planner · concise",
      score: 0.82,
      body:
        "Following up on the renewal — happy to share the updated proposal whenever you're ready. Let me know what works.",
    },
    {
      id: "e2",
      label: "Warm",
      by: "Scribe · friendly",
      score: 0.74,
      body:
        "Hope you had a good weekend! Following up on the renewal — I've put together an updated proposal and would love to walk you through it whenever you have a few minutes.",
    },
    {
      id: "e3",
      label: "Direct",
      by: "Auditor · action-first",
      score: 0.69,
      body:
        "The updated renewal proposal is attached. Two changes from last week: pricing adjusted for the expanded seat count, and the SLA tier bumped to Gold. Can you confirm by Thursday?",
    },
  ],
  commit: [
    {
      id: "c1",
      label: "Conventional",
      by: "Planner",
      score: 0.88,
      body: "feat(react-fancy): add DraftStack with word-diff and compare mode",
    },
    {
      id: "c2",
      label: "Imperative",
      by: "Scribe",
      score: 0.71,
      body: "Add DraftStack primitive — swipe between drafts and see what changed",
    },
    {
      id: "c3",
      label: "Detailed",
      by: "Auditor",
      score: 0.66,
      body:
        "feat: DraftStack for competing AI variants — adds swipe nav, word-level diff between adjacent drafts, side-by-side compare, and one-click accept",
    },
  ],
  headline: [
    {
      id: "h1",
      label: "Promise-led",
      by: "Planner",
      score: 0.79,
      body: "Ship complete app surfaces where humans and agents trade control fluidly.",
    },
    {
      id: "h2",
      label: "Concrete",
      by: "Scribe",
      score: 0.84,
      body:
        "Bridges every fancy surface to MCP — agents drive the UI, humans ride shotgun.",
    },
    {
      id: "h3",
      label: "Provocative",
      by: "Auditor",
      score: 0.61,
      body: "Your AI shouldn't sit in a sidebar. It belongs in the canvas.",
    },
  ],
};

export function DraftStackDemo() {
  const [sampleKey, setSampleKey] = useState<keyof typeof SAMPLES>("email");
  const [compare, setCompare] = useState(false);
  const [showDiff, setShowDiff] = useState(true);
  const [accepted, setAccepted] = useState<string>("");

  const drafts = SAMPLES[sampleKey];

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">DraftStack</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Flip through competing AI drafts for the same field. Word-level diff
          against the previous draft. Compare mode shows two side-by-side.
          Accept one to promote it to the live field — or edit and accept.
        </p>
      </header>

      <Card>
        <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-3">
          <Select
            label="Sample"
            list={[
              { value: "email", label: "email follow-up (3 tones)" },
              { value: "commit", label: "commit message (3 styles)" },
              { value: "headline", label: "headline (3 angles)" },
            ]}
            value={sampleKey}
            onValueChange={(v) => {
              setSampleKey(v as keyof typeof SAMPLES);
              setAccepted("");
            }}
          />
          <div className="flex items-center gap-3 pt-5">
            <Switch checked={showDiff} onCheckedChange={setShowDiff} />
            <span className="text-sm text-zinc-700 dark:text-zinc-200">
              Show word diff
            </span>
          </div>
          <div className="flex items-center gap-3 pt-5">
            <Switch checked={compare} onCheckedChange={setCompare} />
            <span className="text-sm text-zinc-700 dark:text-zinc-200">
              Compare mode
            </span>
          </div>
        </div>
      </Card>

      <DraftStack
        drafts={drafts}
        showDiff={showDiff}
        compare={compare}
        onAccept={(d) => setAccepted(d.body)}
      />

      <Card>
        <div className="p-4">
          <div className="mb-2 flex items-center gap-2 text-sm font-medium">
            <span>Accepted draft (live field)</span>
            {accepted && <Badge color="emerald">linked</Badge>}
          </div>
          <Textarea
            value={accepted}
            onValueChange={setAccepted}
            placeholder="Nothing accepted yet — pick a draft above and hit Accept."
            rows={4}
          />
        </div>
      </Card>
    </div>
  );
}

function DraftStack({
  drafts,
  showDiff,
  compare,
  onAccept,
}: {
  drafts: Draft[];
  showDiff: boolean;
  compare: boolean;
  onAccept: (d: Draft) => void;
}) {
  const [idx, setIdx] = useState(0);

  // Reset cursor when the draft set changes.
  const safeIdx = Math.min(idx, drafts.length - 1);

  const prev = () => setIdx((i) => Math.max(0, i - 1));
  const next = () => setIdx((i) => Math.min(drafts.length - 1, i + 1));

  if (compare) {
    const left = drafts[safeIdx];
    const right = drafts[Math.min(safeIdx + 1, drafts.length - 1)];
    return (
      <Card>
        <div className="p-4">
          <div className="mb-3 flex items-center gap-2 text-sm">
            <span className="font-medium">Compare</span>
            <Badge color="zinc">left</Badge>
            <span className="text-zinc-500">vs</span>
            <Badge color="violet">right</Badge>
            <span className="ml-auto font-mono text-[11px] text-zinc-500">
              {safeIdx + 1} ↔ {Math.min(safeIdx + 2, drafts.length)} of {drafts.length}
            </span>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <DraftPane
              draft={left}
              against={right}
              showDiff={showDiff}
              tone="zinc"
              onAccept={() => onAccept(left)}
            />
            <DraftPane
              draft={right}
              against={left}
              showDiff={showDiff}
              tone="violet"
              onAccept={() => onAccept(right)}
            />
          </div>
          <div className="mt-3 flex justify-between">
            <Button size="sm" onClick={prev} disabled={safeIdx === 0}>
              ← shift
            </Button>
            <Button
              size="sm"
              onClick={next}
              disabled={safeIdx >= drafts.length - 2}
            >
              shift →
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  const current = drafts[safeIdx];
  const previous = safeIdx > 0 ? drafts[safeIdx - 1] : null;

  return (
    <Card>
      <div className="p-4">
        <div className="mb-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-sm">
            <span className="font-medium">{current.label}</span>
            {current.by && (
              <span className="text-[11px] text-zinc-500">· {current.by}</span>
            )}
            {typeof current.score === "number" && (
              <Badge
                color={
                  current.score >= 0.8
                    ? "emerald"
                    : current.score >= 0.65
                      ? "amber"
                      : "red"
                }
              >
                {(current.score * 100).toFixed(0)}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-1">
            {drafts.map((_, i) => (
              <button
                key={i}
                onClick={() => setIdx(i)}
                className={`h-1.5 w-6 rounded-full transition ${
                  i === safeIdx
                    ? "bg-violet-600"
                    : "bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-700 dark:hover:bg-zinc-600"
                }`}
                title={`Draft ${i + 1}`}
              />
            ))}
            <span className="ml-2 font-mono text-[11px] text-zinc-500">
              {safeIdx + 1}/{drafts.length}
            </span>
          </div>
        </div>

        <div className="rounded-md border border-zinc-200 bg-zinc-50 p-3 text-[14px] leading-relaxed dark:border-zinc-800 dark:bg-zinc-950">
          {showDiff && previous ? (
            <Diff prev={previous.body} next={current.body} />
          ) : (
            <span>{current.body}</span>
          )}
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Button size="sm" onClick={prev} disabled={safeIdx === 0}>
            ← prev
          </Button>
          <Button
            size="sm"
            onClick={next}
            disabled={safeIdx >= drafts.length - 1}
          >
            next →
          </Button>
          <Button color="emerald" size="sm" onClick={() => onAccept(current)}>
            accept this draft
          </Button>
          {previous && showDiff && (
            <span className="ml-auto text-[11px] text-zinc-500">
              diff vs <span className="font-medium">{previous.label}</span>
            </span>
          )}
        </div>
      </div>
    </Card>
  );
}

function DraftPane({
  draft,
  against,
  showDiff,
  tone,
  onAccept,
}: {
  draft: Draft;
  against: Draft;
  showDiff: boolean;
  tone: "zinc" | "violet";
  onAccept: () => void;
}) {
  return (
    <div
      className={`rounded-md border p-3 ${
        tone === "violet"
          ? "border-violet-200 bg-violet-50/40 dark:border-violet-900 dark:bg-violet-950/30"
          : "border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950"
      }`}
    >
      <div className="mb-2 flex items-center gap-2 text-[12px]">
        <span className="font-medium">{draft.label}</span>
        {draft.by && <span className="text-zinc-500">· {draft.by}</span>}
        {typeof draft.score === "number" && (
          <Badge
            color={
              draft.score >= 0.8 ? "emerald" : draft.score >= 0.65 ? "amber" : "red"
            }
          >
            {(draft.score * 100).toFixed(0)}
          </Badge>
        )}
      </div>
      <div className="text-[13px] leading-relaxed">
        {showDiff ? <Diff prev={against.body} next={draft.body} /> : <span>{draft.body}</span>}
      </div>
      <div className="mt-2 flex justify-end">
        <Button size="sm" color="emerald" onClick={onAccept}>
          accept
        </Button>
      </div>
    </div>
  );
}

/* --- Tiny word-level diff (LCS) for the demo. Real component would
       expose a `diffFn` prop so hosts can plug their own algorithm. --- */

function Diff({ prev, next }: { prev: string; next: string }) {
  const tokens = useMemo(() => diffWords(prev, next), [prev, next]);
  return (
    <>
      {tokens.map((t, i) => {
        if (t.op === "eq") return <span key={i}>{t.value}</span>;
        if (t.op === "add")
          return (
            <span
              key={i}
              className="rounded bg-emerald-100 px-0.5 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-200"
            >
              {t.value}
            </span>
          );
        return (
          <span
            key={i}
            className="rounded bg-rose-100 px-0.5 text-rose-700 line-through decoration-rose-400 dark:bg-rose-500/20 dark:text-rose-200"
          >
            {t.value}
          </span>
        );
      })}
    </>
  );
}

type Op = { op: "eq" | "add" | "del"; value: string };

function diffWords(a: string, b: string): Op[] {
  const at = tokenize(a);
  const bt = tokenize(b);
  const n = at.length;
  const m = bt.length;
  // LCS table
  const dp: number[][] = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      if (at[i - 1] === bt[j - 1]) dp[i][j] = dp[i - 1][j - 1] + 1;
      else dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
    }
  }
  const out: Op[] = [];
  let i = n;
  let j = m;
  while (i > 0 && j > 0) {
    if (at[i - 1] === bt[j - 1]) {
      out.push({ op: "eq", value: at[i - 1] });
      i--;
      j--;
    } else if (dp[i - 1][j] >= dp[i][j - 1]) {
      out.push({ op: "del", value: at[i - 1] });
      i--;
    } else {
      out.push({ op: "add", value: bt[j - 1] });
      j--;
    }
  }
  while (i > 0) {
    out.push({ op: "del", value: at[i - 1] });
    i--;
  }
  while (j > 0) {
    out.push({ op: "add", value: bt[j - 1] });
    j--;
  }
  return out.reverse();
}

function tokenize(s: string): string[] {
  const out: string[] = [];
  const re = /(\s+)|(\S+)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(s))) out.push(m[0]);
  return out;
}
