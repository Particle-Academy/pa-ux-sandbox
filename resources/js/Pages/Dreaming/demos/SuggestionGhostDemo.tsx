import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Kbd, Select, Slider } from "@particle-academy/react-fancy";

/**
 * SuggestionGhost — react-fancy primitive for inline AI completion.
 *
 * A text input with grey "ghost text" rendered past the caret showing
 * what the predictor would type next. Keys:
 *
 *   Tab            accept the whole suggestion
 *   Cmd/Ctrl + →   accept one word
 *   Esc            dismiss the current suggestion
 *   any typing     restarts the predictor against the new prefix
 *
 * Ghosts are positioned with a hidden mirror element so they line up
 * exactly with the input's text — no caret-coordinate math needed.
 *
 * The `predict` prop is a (prefix) => Promise<string> async fn so the
 * real implementation can wire any AI backend. The demo ships with a
 * deterministic predictor over a small corpus so you can see how it
 * feels without a network call.
 */
type Predict = (prefix: string, signal: AbortSignal) => Promise<string>;

export function SuggestionGhostDemo() {
  const [debounceMs, setDebounceMs] = useState(150);
  const [predictorKey, setPredictorKey] = useState<keyof typeof PREDICTORS>("notes");
  const [log, setLog] = useState<string[]>([]);

  const note = useCallback((line: string) => {
    setLog((cur) => [line, ...cur].slice(0, 6));
  }, []);

  const predictor = useMemo(() => PREDICTORS[predictorKey], [predictorKey]);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">SuggestionGhost</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Inline grey ghost-text completion in any text input.{" "}
          <Kbd>Tab</Kbd> accepts. <Kbd>⌘→</Kbd> / <Kbd>Ctrl→</Kbd> accepts a
          single word. <Kbd>Esc</Kbd> dismisses. Wire your own
          {" "}
          <code>predict(prefix)</code> async fn — the demo ships with a
          deterministic predictor so there's no network jitter to debug.
        </p>
      </header>

      <section className="grid grid-cols-1 gap-4 rounded-lg border border-zinc-200 bg-white p-4 sm:grid-cols-2 dark:border-zinc-800 dark:bg-zinc-900">
        <Select
          label="Predictor"
          list={[
            { value: "notes", label: "meeting notes" },
            { value: "email", label: "email reply" },
            { value: "commit", label: "git commit" },
          ]}
          value={predictorKey}
          onValueChange={(v) => setPredictorKey(v as keyof typeof PREDICTORS)}
        />
        <Slider
          label="Debounce"
          min={0}
          max={500}
          step={25}
          value={debounceMs}
          onValueChange={(v) => setDebounceMs(typeof v === "number" ? v : v[0])}
          showValue
          suffix="ms"
        />
      </section>

      <section className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mb-2 text-sm font-medium">
          Try it —{" "}
          <span className="font-mono text-[11px] text-zinc-500">
            ({predictorKey})
          </span>
        </div>
        <SuggestionGhost
          predict={predictor}
          debounceMs={debounceMs}
          placeholder={"start typing — try \"The team\" or \"Fix \"…"}
          onAccept={(text) => note(`accepted: "${text}"`)}
          onDismiss={() => note("dismissed")}
        />
        <div className="mt-4 text-[11px] text-zinc-500">
          Try a few prefixes:
          {" "}
          {SEED_PROMPTS[predictorKey as keyof typeof SEED_PROMPTS].map((p: string, i: number) => (
            <code
              key={i}
              className="ml-1 rounded bg-zinc-100 px-1.5 py-0.5 dark:bg-zinc-800"
            >
              "{p}"
            </code>
          ))}
        </div>
      </section>

      <section className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mb-2 text-sm font-medium">Event log</div>
        {log.length === 0 ? (
          <div className="text-[11px] italic text-zinc-400">
            Nothing yet. Type and hit Tab.
          </div>
        ) : (
          <ol className="space-y-0.5 font-mono text-[11px] text-zinc-600 dark:text-zinc-400">
            {log.map((l, i) => (
              <li key={i}>{l}</li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}

/**
 * The actual primitive. Real react-fancy export would be its own file
 * with proper prop docs + controlled mode (value/onValueChange).
 */
function SuggestionGhost({
  predict,
  debounceMs,
  placeholder,
  onAccept,
  onDismiss,
}: {
  predict: Predict;
  debounceMs: number;
  placeholder?: string;
  onAccept?: (text: string) => void;
  onDismiss?: () => void;
}) {
  const [value, setValue] = useState("");
  const [ghost, setGhost] = useState("");
  const [pending, setPending] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const lastPrefixRef = useRef<string>("");

  const fetchGhost = useCallback(
    async (prefix: string) => {
      if (abortRef.current) abortRef.current.abort();
      const ctrl = new AbortController();
      abortRef.current = ctrl;
      try {
        setPending(true);
        const out = await predict(prefix, ctrl.signal);
        if (ctrl.signal.aborted) return;
        if (lastPrefixRef.current !== prefix) return;
        setGhost(out);
      } catch {
        // aborted or failed — leave ghost empty
      } finally {
        if (!ctrl.signal.aborted) setPending(false);
      }
    },
    [predict],
  );

  // Debounced predict on value change.
  useEffect(() => {
    lastPrefixRef.current = value;
    if (!value) {
      setGhost("");
      return;
    }
    const t = window.setTimeout(() => {
      if (lastPrefixRef.current === value) fetchGhost(value);
    }, debounceMs);
    return () => window.clearTimeout(t);
  }, [value, debounceMs, fetchGhost]);

  const acceptAll = () => {
    if (!ghost) return;
    const next = value + ghost;
    setValue(next);
    setGhost("");
    onAccept?.(ghost);
  };

  const acceptWord = () => {
    if (!ghost) return;
    const m = ghost.match(/^(\s*\S+)/);
    if (!m) return acceptAll();
    const piece = m[1];
    const next = value + piece;
    setValue(next);
    setGhost(ghost.slice(piece.length));
    onAccept?.(piece);
  };

  const dismiss = () => {
    if (!ghost) return;
    setGhost("");
    onDismiss?.();
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Tab" && ghost) {
      e.preventDefault();
      acceptAll();
      return;
    }
    if (e.key === "Escape" && ghost) {
      e.preventDefault();
      dismiss();
      return;
    }
    if (e.key === "ArrowRight" && (e.metaKey || e.ctrlKey) && ghost) {
      e.preventDefault();
      acceptWord();
      return;
    }
  };

  return (
    <div className="relative font-mono">
      <div className="pointer-events-none absolute inset-0 flex items-center overflow-hidden whitespace-pre rounded-md border border-transparent px-3 py-2 text-[14px] leading-[1.4]">
        <span className="invisible">{value}</span>
        <span className="text-zinc-400">{ghost}</span>
      </div>
      <input
        ref={inputRef}
        value={value}
        placeholder={placeholder}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={onKeyDown}
        autoComplete="off"
        spellCheck={false}
        className="relative w-full rounded-md border border-zinc-300 bg-transparent px-3 py-2 text-[14px] leading-[1.4] outline-none focus:border-violet-400 dark:border-zinc-700"
        style={{ fontFamily: "inherit" }}
      />
      <div className="mt-1.5 flex items-center gap-1.5 text-[11px] text-zinc-500">
        {pending && (
          <span className="inline-flex items-center gap-1">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-violet-500" />
            predicting…
          </span>
        )}
        {!pending && ghost && (
          <>
            <Kbd>Tab</Kbd>
            <span>accept</span>
            <span className="text-zinc-300">·</span>
            <Kbd>⌘→</Kbd>
            <span>word</span>
            <span className="text-zinc-300">·</span>
            <Kbd>Esc</Kbd>
            <span>dismiss</span>
          </>
        )}
        {!pending && !ghost && value && (
          <span className="italic text-zinc-400">no suggestion</span>
        )}
      </div>
    </div>
  );
}

/* --- Demo predictors (deterministic, no network) --- */

const CORPORA: Record<string, string[]> = {
  notes: [
    "The team agreed to ship the Q3 plan by Friday.",
    "The team is debating whether to roll back the change.",
    "Discussed renewals; two accounts confirmed for Q3.",
    "Action: Ada drafts the customer summary, Linus reviews the SQL.",
    "Next steps: sync with finance about expansion projections.",
    "Risks: payment-split compliance is still open with legal.",
    "Decision: hold the merge freeze through Thursday.",
    "Open question: do we backfill the new column or recompute on read?",
  ],
  email: [
    "Thanks for the quick turnaround — really appreciate it.",
    "Thanks for flagging — I'll dig in and get back to you by EOD.",
    "Confirming the renewal numbers attached are final.",
    "Following up on yesterday's note about the integration.",
    "Happy to jump on a quick call tomorrow if that helps.",
    "Could you share the access logs from the last 24 hours?",
  ],
  commit: [
    "feat: hoist useControlled into react-fancy",
    "fix: handle empty selection in code editor",
    "fix: race in functional state updater under strict mode",
    "chore: bump fancy-screens submodule to v0.3.1",
    "refactor: extract wrap-tool-with-activity from whiteboard",
    "test: cover form bridge round-trip via SSE relay",
    "docs: explain bridge-authoring pattern in CLAUDE.md",
  ],
};

const SEED_PROMPTS = {
  notes: ["The team", "Action:", "Decision:"],
  email: ["Thanks", "Following up", "Confirming"],
  commit: ["feat:", "fix:", "chore:"],
};

function makePredictor(corpus: string[]): Predict {
  return async (prefix, signal) => {
    // Simulate variable latency.
    await new Promise((res) => setTimeout(res, 60 + Math.random() * 140));
    if (signal.aborted) throw new Error("aborted");
    if (!prefix) return "";
    const lower = prefix.toLowerCase();
    const hit = corpus.find((c) => c.toLowerCase().startsWith(lower));
    if (!hit) return "";
    return hit.slice(prefix.length);
  };
}

const PREDICTORS: Record<string, Predict> = {
  notes: makePredictor(CORPORA.notes),
  email: makePredictor(CORPORA.email),
  commit: makePredictor(CORPORA.commit),
};
