import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Select, Slider } from "@particle-academy/react-fancy";

/**
 * StreamingText — react-fancy primitive for rendering text that
 * arrives incrementally. Most AI apps reach for ad-hoc setInterval
 * scripts; this packages the common variants:
 *
 *   • typewriter   — char-by-char with a blinking caret
 *   • chunked      — word/sentence boundaries
 *   • word-fade    — words ease-in opacity 0→1 as they appear
 *   • instant      — append as received (baseline, for comparison)
 *
 * Plus the affordances you always end up wanting:
 *
 *   • pause / resume
 *   • skip-to-end (catches up immediately, useful when the user has
 *     already read the source elsewhere)
 *   • inline citations: `[1]` tokens become hoverable chips that
 *     map to a `citations` prop
 *   • `onDone` fires when the buffer drains
 *
 * Reference shape (the real export would type this strictly):
 *   <StreamingText value={text} mode="typewriter" cps={45} citations={…}/>
 */
type Mode = "typewriter" | "chunked" | "word-fade" | "instant";

type Citation = { id: string; label: string; href?: string };

const SAMPLES: Record<string, { text: string; citations?: Record<string, Citation> }> = {
  brief: {
    text:
      "The Q3 forecast holds: ARR climbs ~14% on existing-customer expansion [1], with renewals capturing the bulk [2]. Risk is concentrated in two accounts [3] — both have a clean path to mitigation that I've drafted on the whiteboard.",
    citations: {
      "1": { id: "1", label: "expansion model · v3" },
      "2": { id: "2", label: "renewal cohort · Q2 actuals" },
      "3": { id: "3", label: "risk register · 2026-05-09" },
    },
  },
  code: {
    text:
      "Here's the patch. We hoist `useControlled` into react-fancy, then the bridge becomes a one-liner. No new deps, no breaking changes — Sheets and Code editors already match the shape.",
  },
  long: {
    text:
      "Drafting a longer reply so you can watch each rendering mode breathe. The point isn't speed — it's legibility. Typewriter keeps every character visible from the start and is friendliest for human eyes. Chunked reveals at word boundaries so the eye doesn't track mid-word. Word-fade preserves layout instantly and softens the entrance — best when downstream layout matters [1].",
    citations: { "1": { id: "1", label: "Nielsen · Reading on screens" } },
  },
};

export function StreamingTextDemo() {
  const [mode, setMode] = useState<Mode>("typewriter");
  const [cps, setCps] = useState(40); // chars per second
  const [sampleKey, setSampleKey] = useState<keyof typeof SAMPLES>("brief");
  const [token, setToken] = useState(0); // bump to restart

  const sample = SAMPLES[sampleKey];

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">StreamingText</h1>
        <p className="mt-1 text-sm text-zinc-500">
          A react-fancy primitive for rendering text that arrives over time.
          Four rendering modes, pause/skip controls, hoverable citations, and
          an <code>onDone</code> signal — package this once instead of
          rewriting it in every AI surface.
        </p>
      </header>

      <section className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Select
            label="Mode"
            list={[
              { value: "typewriter", label: "typewriter" },
              { value: "chunked", label: "chunked" },
              { value: "word-fade", label: "word-fade" },
              { value: "instant", label: "instant" },
            ]}
            value={mode}
            onValueChange={(v) => {
              setMode(v as Mode);
              setToken((t) => t + 1);
            }}
          />
          <Slider
            label="Speed"
            min={10}
            max={200}
            step={5}
            value={cps}
            onValueChange={(v) => setCps(typeof v === "number" ? v : v[0])}
            showValue
            suffix=" cps"
          />
          <Select
            label="Sample"
            list={[
              { value: "brief", label: "brief (citations)" },
              { value: "code", label: "code (no citations)" },
              { value: "long", label: "long (one citation)" },
            ]}
            value={sampleKey}
            onValueChange={(v) => {
              setSampleKey(v as keyof typeof SAMPLES);
              setToken((t) => t + 1);
            }}
          />
        </div>
        <div className="mt-3 flex justify-end">
          <button
            onClick={() => setToken((t) => t + 1)}
            className="rounded-md bg-violet-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-violet-700"
          >
            replay
          </button>
        </div>
      </section>

      <section className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mb-3 text-sm font-medium">
          Output —{" "}
          <span className="font-mono text-[11px] text-zinc-500">
            mode: {mode}
          </span>
        </div>
        <StreamingText
          key={token}
          value={sample.text}
          mode={mode}
          cps={cps}
          citations={sample.citations}
        />
      </section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ModePreview title="typewriter" desc="character-by-character with caret">
          <StreamingText value={SAMPLES.brief.text} mode="typewriter" cps={80} citations={SAMPLES.brief.citations} />
        </ModePreview>
        <ModePreview title="chunked" desc="word-boundary reveal">
          <StreamingText value={SAMPLES.brief.text} mode="chunked" cps={80} citations={SAMPLES.brief.citations} />
        </ModePreview>
        <ModePreview title="word-fade" desc="layout-stable opacity ease">
          <StreamingText value={SAMPLES.brief.text} mode="word-fade" cps={80} citations={SAMPLES.brief.citations} />
        </ModePreview>
        <ModePreview title="instant" desc="baseline, no animation">
          <StreamingText value={SAMPLES.brief.text} mode="instant" cps={80} citations={SAMPLES.brief.citations} />
        </ModePreview>
      </section>
    </div>
  );
}

function ModePreview({
  title,
  desc,
  children,
}: {
  title: string;
  desc: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="mb-1.5 flex items-baseline gap-2">
        <span className="font-mono text-xs text-violet-700 dark:text-violet-300">
          {title}
        </span>
        <span className="text-[10px] text-zinc-500">{desc}</span>
      </div>
      <div className="text-[13px] leading-relaxed">{children}</div>
    </div>
  );
}

/**
 * The actual primitive. In a real react-fancy build this would be its
 * own file with proper prop docs.
 */
function StreamingText({
  value,
  mode,
  cps,
  citations,
  onDone,
}: {
  value: string;
  mode: Mode;
  cps: number;
  citations?: Record<string, Citation>;
  onDone?: () => void;
}) {
  const total = value.length;
  const [n, setN] = useState(mode === "instant" ? total : 0);
  const [paused, setPaused] = useState(false);
  const [done, setDone] = useState(mode === "instant");
  const stepMs = useMemo(() => Math.max(8, 1000 / cps), [cps]);
  const tickRef = useRef<number | null>(null);
  const lastTickRef = useRef<number>(0);

  // Reset on value/mode change.
  useEffect(() => {
    setN(mode === "instant" ? total : 0);
    setDone(mode === "instant");
    setPaused(false);
    if (mode === "instant") onDone?.();
  }, [value, mode, total, onDone]);

  useEffect(() => {
    if (mode === "instant" || done || paused) return;
    const step = mode === "chunked" || mode === "word-fade" ? wordStep : 1;
    lastTickRef.current = performance.now();
    const loop = () => {
      const now = performance.now();
      const elapsed = now - lastTickRef.current;
      if (elapsed >= stepMs) {
        lastTickRef.current = now;
        setN((cur) => {
          const next = nextCursor(value, cur, step);
          if (next >= total) {
            setDone(true);
            onDone?.();
            return total;
          }
          return next;
        });
      }
      tickRef.current = requestAnimationFrame(loop);
    };
    tickRef.current = requestAnimationFrame(loop);
    return () => {
      if (tickRef.current) cancelAnimationFrame(tickRef.current);
    };
  }, [mode, done, paused, stepMs, total, value, onDone]);

  const revealed = value.slice(0, n);
  const isDone = done;

  return (
    <div>
      <div className="font-sans text-zinc-700 dark:text-zinc-200">
        {mode === "word-fade" ? (
          <WordFade text={value} reveal={n} citations={citations} />
        ) : (
          <>
            <RichInline text={revealed} citations={citations} />
            {!isDone && mode === "typewriter" && (
              <span className="ml-0.5 inline-block h-[1em] w-[2px] -translate-y-[2px] animate-pulse bg-zinc-500 align-middle" />
            )}
          </>
        )}
      </div>
      {mode !== "instant" && (
        <div className="mt-2 flex items-center gap-2 text-[11px] text-zinc-500">
          <button
            onClick={() => setPaused((p) => !p)}
            disabled={isDone}
            className="rounded border border-zinc-300 px-1.5 py-0.5 hover:bg-zinc-50 disabled:opacity-40 dark:border-zinc-700 dark:hover:bg-zinc-800"
          >
            {paused ? "▶ resume" : "❚❚ pause"}
          </button>
          <button
            onClick={() => {
              setN(total);
              setDone(true);
              onDone?.();
            }}
            disabled={isDone}
            className="rounded border border-zinc-300 px-1.5 py-0.5 hover:bg-zinc-50 disabled:opacity-40 dark:border-zinc-700 dark:hover:bg-zinc-800"
          >
            skip ⏭
          </button>
          <span className="ml-auto font-mono">
            {n}/{total}
            {isDone ? " · done" : ""}
          </span>
        </div>
      )}
    </div>
  );
}

const CIT_RE = /\[(\w+)\]/g;

function RichInline({
  text,
  citations,
}: {
  text: string;
  citations?: Record<string, Citation>;
}) {
  if (!citations) return <>{text}</>;
  const parts: Array<string | Citation> = [];
  let last = 0;
  for (const m of text.matchAll(CIT_RE)) {
    const start = m.index ?? 0;
    if (start > last) parts.push(text.slice(last, start));
    const c = citations[m[1]];
    if (c) parts.push(c);
    else parts.push(m[0]);
    last = start + m[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return (
    <>
      {parts.map((p, i) =>
        typeof p === "string" ? (
          <span key={i}>{p}</span>
        ) : (
          <CitationChip key={i} c={p} />
        ),
      )}
    </>
  );
}

function CitationChip({ c }: { c: Citation }) {
  return (
    <span
      title={c.label}
      className="mx-0.5 inline-flex h-4 cursor-help items-center justify-center rounded-sm bg-violet-100 px-1 align-middle text-[10px] font-medium text-violet-700 dark:bg-violet-500/20 dark:text-violet-200"
    >
      {c.id}
    </span>
  );
}

function WordFade({
  text,
  reveal,
  citations,
}: {
  text: string;
  reveal: number;
  citations?: Record<string, Citation>;
}) {
  // Tokenize into [word, space] pairs while preserving citations as their own tokens.
  const tokens = useMemo(() => tokenize(text), [text]);
  let charCount = 0;
  return (
    <>
      {tokens.map((tok, i) => {
        const start = charCount;
        charCount += tok.length;
        const visible = reveal >= start + tok.length;
        const partial = reveal > start && reveal < start + tok.length;
        const opacity = visible ? 1 : partial ? (reveal - start) / tok.length : 0;
        const m = tok.match(/^\[(\w+)\]$/);
        if (m && citations?.[m[1]]) {
          return (
            <span
              key={i}
              style={{ opacity, transition: "opacity 220ms ease-out" }}
            >
              <CitationChip c={citations[m[1]]} />
            </span>
          );
        }
        return (
          <span
            key={i}
            style={{ opacity, transition: "opacity 220ms ease-out" }}
          >
            {tok}
          </span>
        );
      })}
    </>
  );
}

function tokenize(text: string): string[] {
  const out: string[] = [];
  const re = /(\[\w+\])|(\s+)|([^\s[\]]+)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) out.push(m[0]);
  return out;
}

function wordStep(value: string, cur: number): number {
  // advance to the end of the next word/whitespace token
  const re = /(\[\w+\])|(\s+)|([^\s[\]]+)/g;
  re.lastIndex = cur;
  const m = re.exec(value);
  if (!m) return value.length;
  return m.index + m[0].length;
}

function nextCursor(value: string, cur: number, step: number | typeof wordStep): number {
  if (typeof step === "number") return Math.min(value.length, cur + step);
  return step(value, cur);
}
