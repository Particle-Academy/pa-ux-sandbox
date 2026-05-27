import { useCallback, useEffect, useMemo, useRef, useState } from "react";

/**
 * Time Scrubber — speculative replay primitive for fancy-screens.
 *
 * Every port write on a screen is appended to a frame ring. The
 * Scrubber lets the human drag a playhead across that ring and watch
 * the surface morph back to a prior state. Two affordances:
 *
 *   • Branch — accept the current scrubbed state as the live state,
 *     discarding frames after the playhead (think: git reset --hard
 *     but on the screen instead of the repo).
 *
 *   • Fork — spawn a new screen seeded from this frame so you can
 *     keep the live screen intact and experiment from the fork.
 *
 * Agents get the same handles, so they can "look back" to figure out
 * what changed without polluting the live state.
 */
type Frame = {
  /** Wall-clock ms. */
  at: number;
  /** Who caused the change. */
  by: { name: string; color: string; kind: "human" | "agent" };
  /** Short label for the timeline. */
  label: string;
  /** Frozen state snapshot for replay. */
  snapshot: SheetState;
};

type SheetState = {
  /** Loose 4×3 grid of cell strings. */
  cells: string[][];
  /** Highlight cell (row,col) — what the change touched. */
  focus?: [number, number] | null;
};

const PEOPLE = {
  you: { name: "You", color: "#0ea5e9", kind: "human" as const },
  planner: { name: "Planner", color: "#a855f7", kind: "agent" as const },
  scribe: { name: "Scribe", color: "#10b981", kind: "agent" as const },
};

const HEADERS = ["Account", "Status", "ARR"];

const initial: SheetState = {
  cells: [
    ["—", "—", "—"],
    ["—", "—", "—"],
    ["—", "—", "—"],
    ["—", "—", "—"],
  ],
  focus: null,
};

const seedFrames: Frame[] = [
  { at: Date.now() - 60_000, by: PEOPLE.you, label: "init empty", snapshot: initial },
];

const set = (s: SheetState, r: number, c: number, v: string): SheetState => ({
  cells: s.cells.map((row, ri) =>
    row.map((cell, ci) => (ri === r && ci === c ? v : cell)),
  ),
  focus: [r, c],
});

export function TimeScrubberDemo() {
  const [frames, setFrames] = useState<Frame[]>(seedFrames);
  const [playhead, setPlayhead] = useState<number>(0); // 0 = oldest, frames.length-1 = newest
  const [forks, setForks] = useState<Frame[]>([]);
  const [playing, setPlaying] = useState(false);
  const autoSeeded = useRef(false);

  // Seed some agent activity so there's something to scrub.
  useEffect(() => {
    if (autoSeeded.current) return;
    autoSeeded.current = true;
    const seq: Array<{ by: Frame["by"]; label: string; mut: (s: SheetState) => SheetState }> = [
      { by: PEOPLE.planner, label: "set A1 = Acme", mut: (s) => set(s, 0, 0, "Acme") },
      { by: PEOPLE.planner, label: "set A2 = Globex", mut: (s) => set(s, 1, 0, "Globex") },
      { by: PEOPLE.scribe, label: "set B1 = Active", mut: (s) => set(s, 0, 1, "Active") },
      { by: PEOPLE.scribe, label: "set B2 = Trial", mut: (s) => set(s, 1, 1, "Trial") },
      { by: PEOPLE.planner, label: "set C1 = $120k", mut: (s) => set(s, 0, 2, "$120k") },
      { by: PEOPLE.you, label: "fix A2 → Globex Corp", mut: (s) => set(s, 1, 0, "Globex Corp") },
      { by: PEOPLE.planner, label: "set C2 = $45k", mut: (s) => set(s, 1, 2, "$45k") },
      { by: PEOPLE.scribe, label: "set A3 = Initech", mut: (s) => set(s, 2, 0, "Initech") },
    ];
    let cur = initial;
    let t = Date.now() - 50_000;
    const out: Frame[] = [seedFrames[0]];
    for (const step of seq) {
      cur = step.mut(cur);
      t += 4500 + Math.random() * 1500;
      out.push({ at: t, by: step.by, label: step.label, snapshot: cur });
    }
    setFrames(out);
    setPlayhead(out.length - 1);
  }, []);

  // Auto-play stepping the playhead forward.
  useEffect(() => {
    if (!playing) return;
    const t = window.setInterval(() => {
      setPlayhead((p) => {
        if (p >= frames.length - 1) {
          setPlaying(false);
          return p;
        }
        return p + 1;
      });
    }, 700);
    return () => window.clearInterval(t);
  }, [playing, frames.length]);

  const current = frames[Math.min(playhead, frames.length - 1)];
  const atTail = playhead === frames.length - 1;

  const branch = useCallback(() => {
    setFrames((cur) => cur.slice(0, playhead + 1));
  }, [playhead]);

  const fork = useCallback(() => {
    setForks((cur) => [...cur, current]);
  }, [current]);

  const appendMutation = useCallback(() => {
    setFrames((cur) => {
      const base = cur[cur.length - 1].snapshot;
      const r = Math.floor(Math.random() * 4);
      const c = Math.floor(Math.random() * 3);
      const v = ["Hooli", "Pied Piper", "Renewed", "Churned", "$80k", "$200k"][
        Math.floor(Math.random() * 6)
      ];
      const next: Frame = {
        at: Date.now(),
        by: PEOPLE.planner,
        label: `set ${"ABCD"[r]}${c + 1} = ${v}`,
        snapshot: set(base, r, c, v),
      };
      return [...cur, next];
    });
    setPlayhead((_) => -1);
    // jump to tail after state update
    requestAnimationFrame(() =>
      setPlayhead((_) => {
        // we don't know the new length synchronously; use functional updater via stale closure trick
        return playheadTail();
      }),
    );
  }, []);

  function playheadTail() {
    // Read frames length from latest closure via setFrames? Simpler: defer.
    return Number.MAX_SAFE_INTEGER; // clamped at render
  }

  const span = useMemo(() => {
    const first = frames[0]?.at ?? 0;
    const last = frames[frames.length - 1]?.at ?? 0;
    return Math.max(1, last - first);
  }, [frames]);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Time Scrubber</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Drag the playhead to rewind the surface to any prior frame.
          {" "}
          <em>Branch</em> discards frames after the playhead.
          {" "}
          <em>Fork</em> spawns a snapshot screen at the current frame so you can
          experiment from there without disturbing the live state.
        </p>
      </header>

      <section className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mb-2 flex items-center justify-between">
          <div className="text-sm font-medium">Surface (sheet)</div>
          <FrameMeta frame={current} atTail={atTail} />
        </div>
        <Grid state={current.snapshot} />
        <div className="mt-3 space-y-2">
          <input
            type="range"
            min={0}
            max={Math.max(0, frames.length - 1)}
            value={Math.min(playhead, frames.length - 1)}
            onChange={(e) => {
              setPlaying(false);
              setPlayhead(parseInt(e.target.value, 10));
            }}
            className="w-full accent-violet-600"
          />
          <Track frames={frames} playhead={playhead} span={span} onPick={setPlayhead} />
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button
            onClick={() => setPlayhead(0)}
            className="rounded-md border border-zinc-300 px-2 py-1 text-xs hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
          >
            ⏮ start
          </button>
          <button
            onClick={() => setPlaying((p) => !p)}
            className="rounded-md bg-violet-600 px-2 py-1 text-xs font-medium text-white hover:bg-violet-700"
          >
            {playing ? "❚❚ pause" : "▶ play"}
          </button>
          <button
            onClick={() => setPlayhead(frames.length - 1)}
            className="rounded-md border border-zinc-300 px-2 py-1 text-xs hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
          >
            tail ⏭
          </button>
          <span className="mx-2 h-4 w-px bg-zinc-300 dark:bg-zinc-700" />
          <button
            onClick={branch}
            disabled={atTail}
            className="rounded-md border border-amber-400 px-2 py-1 text-xs font-medium text-amber-700 hover:bg-amber-50 disabled:opacity-40 dark:border-amber-700 dark:text-amber-300 dark:hover:bg-amber-950"
          >
            branch (reset to here)
          </button>
          <button
            onClick={fork}
            className="rounded-md border border-emerald-400 px-2 py-1 text-xs font-medium text-emerald-700 hover:bg-emerald-50 dark:border-emerald-700 dark:text-emerald-300 dark:hover:bg-emerald-950"
          >
            fork screen from frame
          </button>
          <button
            onClick={appendMutation}
            className="ml-auto rounded-md border border-zinc-300 px-2 py-1 text-xs hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
          >
            + simulate agent change
          </button>
        </div>
      </section>

      {forks.length > 0 && (
        <section className="rounded-lg border border-emerald-200 bg-emerald-50/40 p-4 dark:border-emerald-900 dark:bg-emerald-950/30">
          <div className="mb-3 text-sm font-medium text-emerald-700 dark:text-emerald-300">
            Forked snapshots ({forks.length})
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {forks.map((f, i) => (
              <div
                key={i}
                className="rounded-md border border-emerald-300 bg-white p-3 dark:border-emerald-800 dark:bg-zinc-900"
              >
                <FrameMeta frame={f} atTail={false} />
                <div className="mt-2">
                  <Grid state={f.snapshot} compact />
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function Grid({ state, compact = false }: { state: SheetState; compact?: boolean }) {
  return (
    <div
      className="grid overflow-hidden rounded-md border border-zinc-200 dark:border-zinc-800"
      style={{ gridTemplateColumns: `repeat(${HEADERS.length}, minmax(0, 1fr))` }}
    >
      {HEADERS.map((h) => (
        <div
          key={h}
          className={`border-b border-r border-zinc-200 bg-zinc-50 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-500 last:border-r-0 dark:border-zinc-800 dark:bg-zinc-900 ${
            compact ? "py-0.5 text-[9px]" : ""
          }`}
        >
          {h}
        </div>
      ))}
      {state.cells.map((row, r) =>
        row.map((v, c) => {
          const focused =
            state.focus && state.focus[0] === r && state.focus[1] === c;
          return (
            <div
              key={`${r}-${c}`}
              className={`border-b border-r border-zinc-200 px-2 py-1 font-mono text-[12px] last:border-r-0 dark:border-zinc-800 ${
                compact ? "py-0.5 text-[11px]" : ""
              } ${
                focused
                  ? "bg-violet-100 text-violet-900 dark:bg-violet-500/20 dark:text-violet-100"
                  : v === "—"
                    ? "text-zinc-400"
                    : ""
              }`}
            >
              {v}
            </div>
          );
        }),
      )}
    </div>
  );
}

function FrameMeta({ frame, atTail }: { frame: Frame; atTail: boolean }) {
  return (
    <div className="flex items-center gap-2 text-[11px]">
      <span
        className="inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 font-medium"
        style={{ backgroundColor: frame.by.color + "22", color: frame.by.color }}
      >
        <span
          className="h-1.5 w-1.5 rounded-full"
          style={{ backgroundColor: frame.by.color }}
        />
        {frame.by.name}
      </span>
      <span className="font-mono text-zinc-700 dark:text-zinc-300">
        {frame.label}
      </span>
      <span className="text-zinc-400">·</span>
      <span className="text-zinc-500">
        {new Date(frame.at).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })}
      </span>
      {!atTail && (
        <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-700 dark:bg-amber-500/15 dark:text-amber-300">
          rewound
        </span>
      )}
    </div>
  );
}

function Track({
  frames,
  playhead,
  span,
  onPick,
}: {
  frames: Frame[];
  playhead: number;
  span: number;
  onPick: (i: number) => void;
}) {
  const first = frames[0]?.at ?? 0;
  return (
    <div className="relative h-6 rounded bg-zinc-100 dark:bg-zinc-800">
      {frames.map((f, i) => {
        const x = ((f.at - first) / span) * 100;
        return (
          <button
            key={i}
            onClick={() => onPick(i)}
            title={`${f.by.name} · ${f.label}`}
            className="absolute top-0 h-full w-1 -translate-x-1/2 rounded-full transition hover:scale-y-110"
            style={{
              left: `${x}%`,
              backgroundColor: f.by.color,
              opacity: i <= playhead ? 1 : 0.35,
            }}
          />
        );
      })}
      {frames[playhead] && (
        <div
          className="absolute top-0 h-full w-0.5 -translate-x-1/2 bg-zinc-900 dark:bg-zinc-100"
          style={{
            left: `${((frames[playhead].at - first) / span) * 100}%`,
          }}
        />
      )}
    </div>
  );
}
