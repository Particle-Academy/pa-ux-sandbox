import { ReactNode, useState } from "react";
import { DREAMS } from "./manifest";
import { getSource } from "./sources";
import { useVote, VoteState } from "./votes";

export function DemoFrame({ slug, children }: { slug: string; children: ReactNode }) {
  const dream = DREAMS.find((d) => d.slug === slug);
  const source = getSource(slug);
  const [vote, setVote] = useVote(slug);
  const [showSource, setShowSource] = useState(false);
  const [copied, setCopied] = useState(false);

  return (
    <div className="space-y-4">
      <header className="flex flex-wrap items-start justify-between gap-3 border-b border-zinc-200 pb-4 dark:border-zinc-800">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold">{dream?.title ?? slug}</h1>
            {dream?.theme && (
              <span className="rounded-full bg-sky-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-sky-700 dark:bg-sky-500/15 dark:text-sky-300">
                {dream.theme}
              </span>
            )}
            {dream?.pkg && (
              <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                {dream.pkg}
              </span>
            )}
            {dream?.accepted && (
              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
                accepted
              </span>
            )}
          </div>
          {dream?.blurb && (
            <p className="mt-1.5 max-w-3xl text-sm text-zinc-500">{dream.blurb}</p>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <VoteButtons vote={vote} onChange={setVote} />
          {source && (
            <button
              onClick={() => setShowSource((s) => !s)}
              className="rounded-md border border-zinc-300 px-2.5 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
            >
              {showSource ? "Hide source" : "Show source"}
            </button>
          )}
        </div>
      </header>

      <div>{children}</div>

      {showSource && source && (
        <section className="rounded-lg border border-zinc-200 bg-zinc-950 text-zinc-100 dark:border-zinc-800">
          <div className="flex items-center justify-between border-b border-zinc-800 px-3 py-1.5 text-[11px]">
            <span className="font-mono text-zinc-400">
              dreaming/pages/{pascal(slug)}Demo.tsx
            </span>
            <button
              onClick={() => {
                navigator.clipboard.writeText(source).then(() => {
                  setCopied(true);
                  window.setTimeout(() => setCopied(false), 1200);
                });
              }}
              className="rounded border border-zinc-700 px-2 py-0.5 text-[10px] font-medium text-zinc-300 hover:bg-zinc-800"
            >
              {copied ? "copied" : "copy"}
            </button>
          </div>
          <pre className="overflow-x-auto p-3 text-[11px] leading-relaxed">
            <code>{source}</code>
          </pre>
        </section>
      )}
    </div>
  );
}

function VoteButtons({ vote, onChange }: { vote: VoteState; onChange: (v: VoteState) => void }) {
  return (
    <div className="inline-flex overflow-hidden rounded-md border border-zinc-300 dark:border-zinc-700">
      <button
        onClick={() => onChange(vote === "up" ? null : "up")}
        title="Keep this — looks promising"
        className={`px-2 py-1 text-xs transition ${
          vote === "up"
            ? "bg-emerald-500 text-white"
            : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-900"
        }`}
      >
        👍
      </button>
      <button
        onClick={() => onChange(vote === "down" ? null : "down")}
        title="Prune this — not interesting"
        className={`border-l border-zinc-300 px-2 py-1 text-xs transition dark:border-zinc-700 ${
          vote === "down"
            ? "bg-rose-500 text-white"
            : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-900"
        }`}
      >
        👎
      </button>
    </div>
  );
}

function pascal(slug: string): string {
  return slug
    .split("-")
    .map((p) => (p[0]?.toUpperCase() ?? "") + p.slice(1))
    .join("");
}
