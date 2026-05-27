import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Control Baton — speculative primitive for agent-integrations.
 *
 * One surface, many would-be drivers. Whoever holds the baton has
 * exclusive write-access. Others can request; the holder can grant or
 * deny. Anyone can yank (with a small cooldown). When the holder is
 * idle past `idleMs`, the baton auto-releases so an agent can step in.
 *
 * The demo runs entirely on local state — no bridge wiring yet — to
 * sketch the UX. The real implementation would broadcast holder
 * changes through the existing SSE relay as a `notifications/baton`
 * frame, paired with `agent_activity` so every surface can render the
 * pill in the same place.
 */
type Participant = {
  id: string;
  name: string;
  color: string;
  kind: "human" | "agent";
};

type Transfer = {
  at: number;
  from: string | null;
  to: string;
  reason: "grant" | "yank" | "auto-release" | "claim";
};

const SEED: Participant[] = [
  { id: "you", name: "You", color: "#0ea5e9", kind: "human" },
  { id: "planner", name: "Planner", color: "#a855f7", kind: "agent" },
  { id: "scribe", name: "Scribe", color: "#10b981", kind: "agent" },
  { id: "guest", name: "Guest", color: "#f59e0b", kind: "human" },
];

const IDLE_MS = 8000;
const YANK_COOLDOWN_MS = 4000;

export function ControlBatonDemo() {
  const [participants] = useState<Participant[]>(SEED);
  const [holder, setHolder] = useState<string | null>("you");
  const [requests, setRequests] = useState<string[]>([]);
  const [transfers, setTransfers] = useState<Transfer[]>([
    { at: Date.now() - 60_000, from: null, to: "you", reason: "claim" },
  ]);
  const [lastActivityAt, setLastActivityAt] = useState<number>(Date.now());
  const [lastYankAt, setLastYankAt] = useState<number>(0);
  const [text, setText] = useState<string>(
    "Whoever holds the baton can edit this text. Pause for 8s and the baton auto-releases.",
  );

  const log = useCallback((t: Transfer) => {
    setTransfers((cur) => [t, ...cur].slice(0, 12));
  }, []);

  const transfer = useCallback(
    (to: string, reason: Transfer["reason"]) => {
      setHolder((from) => {
        if (from === to) return from;
        log({ at: Date.now(), from, to, reason });
        return to;
      });
      setRequests((r) => r.filter((id) => id !== to));
      setLastActivityAt(Date.now());
    },
    [log],
  );

  const release = useCallback(() => {
    setHolder((from) => {
      if (!from) return null;
      log({ at: Date.now(), from, to: "(open)", reason: "auto-release" });
      return null;
    });
  }, [log]);

  // Auto-release on idle when held by a human; agents don't get idled out.
  const idleTimer = useRef<number | null>(null);
  useEffect(() => {
    const holderP = participants.find((p) => p.id === holder);
    if (!holderP || holderP.kind !== "human") return;
    if (idleTimer.current) window.clearTimeout(idleTimer.current);
    idleTimer.current = window.setTimeout(() => {
      release();
    }, IDLE_MS);
    return () => {
      if (idleTimer.current) window.clearTimeout(idleTimer.current);
    };
  }, [holder, lastActivityAt, participants, release]);

  const request = (id: string) => {
    if (id === holder) return;
    setRequests((r) => (r.includes(id) ? r : [...r, id]));
  };

  const grant = (id: string) => transfer(id, "grant");
  const yank = (id: string) => {
    if (Date.now() - lastYankAt < YANK_COOLDOWN_MS) return;
    setLastYankAt(Date.now());
    transfer(id, "yank");
  };

  const holderP = participants.find((p) => p.id === holder) ?? null;
  const youHold = holder === "you";

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Control Baton</h1>
        <p className="mt-1 text-sm text-zinc-500">
          A passable write-lock for any surface. Holder can grant; non-holders
          can request or yank (with cooldown). Human holders auto-release after
          {" "}
          {IDLE_MS / 1000}s of inactivity so agents can step in.
        </p>
      </header>

      <section className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mb-3 flex items-center justify-between">
          <div className="text-sm font-medium">Surface (text)</div>
          <BatonPill holder={holderP} />
        </div>
        <textarea
          value={text}
          onChange={(e) => {
            if (!youHold) return;
            setText(e.target.value);
            setLastActivityAt(Date.now());
          }}
          disabled={!youHold}
          rows={5}
          className={`w-full rounded-md border bg-transparent p-2 font-mono text-sm outline-none transition ${
            youHold
              ? "border-sky-400 ring-1 ring-sky-200 dark:border-sky-500 dark:ring-sky-900"
              : "border-zinc-200 text-zinc-500 dark:border-zinc-800"
          }`}
        />
        {!youHold && (
          <div className="mt-1 text-[11px] text-zinc-500">
            {holderP
              ? `${holderP.name} holds the baton.`
              : "Baton is open — claim it to edit."}{" "}
            {holder !== "you" && (
              <button
                onClick={() =>
                  holder ? request("you") : transfer("you", "claim")
                }
                className="underline hover:text-zinc-700 dark:hover:text-zinc-300"
              >
                {holder ? "request" : "claim baton"}
              </button>
            )}
          </div>
        )}
      </section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="mb-3 text-sm font-medium">Roster</div>
          <ul className="space-y-1.5">
            {participants.map((p) => {
              const isHolder = holder === p.id;
              const hasRequest = requests.includes(p.id);
              return (
                <li
                  key={p.id}
                  className="flex items-center justify-between gap-2 text-sm"
                >
                  <span className="inline-flex items-center gap-2">
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: p.color }}
                    />
                    <span className={isHolder ? "font-semibold" : ""}>
                      {p.name}
                    </span>
                    <span className="text-[9px] uppercase tracking-wider text-zinc-400">
                      {p.kind}
                    </span>
                    {isHolder && (
                      <span className="rounded-full bg-amber-100 px-1.5 text-[10px] font-medium text-amber-700 dark:bg-amber-500/15 dark:text-amber-300">
                        baton
                      </span>
                    )}
                    {hasRequest && !isHolder && (
                      <span className="rounded-full bg-sky-100 px-1.5 text-[10px] font-medium text-sky-700 dark:bg-sky-500/15 dark:text-sky-300">
                        requesting
                      </span>
                    )}
                  </span>
                  <span className="flex gap-1">
                    {youHold && hasRequest && (
                      <button
                        onClick={() => grant(p.id)}
                        className="rounded bg-emerald-600 px-2 py-0.5 text-[11px] font-medium text-white hover:bg-emerald-700"
                      >
                        grant
                      </button>
                    )}
                    {!isHolder && p.id !== "you" && (
                      <button
                        onClick={() => yank(p.id)}
                        className="rounded border border-zinc-300 px-2 py-0.5 text-[11px] hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
                        title="Force-transfer the baton"
                      >
                        yank →
                      </button>
                    )}
                    {!isHolder && p.id === "you" && holder && (
                      <button
                        onClick={() => request("you")}
                        className="rounded border border-zinc-300 px-2 py-0.5 text-[11px] hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
                      >
                        request
                      </button>
                    )}
                  </span>
                </li>
              );
            })}
          </ul>
          <div className="mt-3 flex gap-2">
            <button
              onClick={release}
              disabled={!holder}
              className="rounded-md border border-zinc-300 px-2 py-1 text-xs font-medium hover:bg-zinc-50 disabled:opacity-40 dark:border-zinc-700 dark:hover:bg-zinc-800"
            >
              release baton
            </button>
            {!holder && (
              <button
                onClick={() => transfer("you", "claim")}
                className="rounded-md bg-violet-600 px-2 py-1 text-xs font-medium text-white hover:bg-violet-700"
              >
                claim
              </button>
            )}
          </div>
        </div>

        <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="mb-3 text-sm font-medium">Transfer log</div>
          <ol className="space-y-1 text-[11px] font-mono text-zinc-600 dark:text-zinc-400">
            {transfers.map((t, i) => (
              <li key={i} className="flex gap-2">
                <span className="text-zinc-400">
                  {new Date(t.at).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                  })}
                </span>
                <span>
                  <span className="opacity-70">{t.from ?? "(open)"}</span>
                  <span className="mx-1">→</span>
                  <span>{t.to}</span>
                  <span className="ml-1 text-zinc-400">[{t.reason}]</span>
                </span>
              </li>
            ))}
          </ol>
        </div>
      </section>
    </div>
  );
}

function BatonPill({ holder }: { holder: { name: string; color: string; kind: string } | null }) {
  if (!holder) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] font-medium text-zinc-500 dark:bg-zinc-800">
        <span className="h-1.5 w-1.5 rounded-full bg-zinc-400" />
        baton open
      </span>
    );
  }
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium"
      style={{ backgroundColor: holder.color + "22", color: holder.color }}
    >
      <span
        className="h-1.5 w-1.5 animate-pulse rounded-full"
        style={{ backgroundColor: holder.color }}
      />
      {holder.name} holds the baton
      <span className="text-[9px] uppercase tracking-wider opacity-60">
        {holder.kind}
      </span>
    </span>
  );
}
