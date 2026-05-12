import { Link } from "react-router";
import { DREAMS } from "../manifest";

/**
 * Component Lobby — overview of every dreamt-up component. Cards link
 * into the individual demos. Empty state shown until the dreaming loop
 * fills the manifest.
 */
export function Lobby() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Component Lobby</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Every speculative component dreamt up by the loop, with a one-line
          blurb and a link to the demo. Real implementations live under
          <code className="mx-1 rounded bg-zinc-100 px-1 py-0.5 text-[11px] dark:bg-zinc-800">
            resources/js/dreaming/pages/
          </code>
          and get promoted into real packages once they prove out.
        </p>
      </header>

      {DREAMS.length === 0 ? (
        <div className="rounded-lg border border-dashed border-zinc-300 bg-white p-8 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:bg-zinc-900">
          The loop hasn't dreamt anything yet. Check back after the next
          30-minute tick — new components land here automatically.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[...DREAMS]
            .sort((a, b) => Number(!!b.accepted) - Number(!!a.accepted))
            .map((d) => (
              <Link
                key={d.slug}
                to={d.slug}
                className={`block rounded-lg border bg-white p-4 transition hover:shadow-sm dark:bg-zinc-900 ${
                  d.accepted
                    ? "border-emerald-300 hover:border-emerald-500 dark:border-emerald-800 dark:hover:border-emerald-600"
                    : "border-zinc-200 hover:border-violet-400 dark:border-zinc-800 dark:hover:border-violet-600"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="font-medium">{d.title}</div>
                  <div className="flex shrink-0 items-center gap-1">
                    {d.accepted && (
                      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
                        ✓ accepted
                      </span>
                    )}
                    {d.pkg && (
                      <span className="rounded-full bg-violet-100 px-2 py-0.5 text-[10px] uppercase tracking-wider text-violet-700 dark:bg-violet-500/15 dark:text-violet-300">
                        {d.pkg}
                      </span>
                    )}
                  </div>
                </div>
                <p className="mt-1.5 text-xs text-zinc-500">{d.blurb}</p>
                {(d.dreamedAt || d.acceptedAt) && (
                  <div className="mt-2 text-[10px] uppercase tracking-wider text-zinc-400">
                    {d.acceptedAt
                      ? `dreamt ${d.dreamedAt} · accepted ${d.acceptedAt}`
                      : `dreamt ${d.dreamedAt}`}
                  </div>
                )}
              </Link>
            ))}
        </div>
      )}
    </div>
  );
}
