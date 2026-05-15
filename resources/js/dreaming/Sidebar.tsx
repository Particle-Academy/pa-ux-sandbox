import { useEffect, useMemo, useState } from "react";
import { NavLink } from "react-router";
import { DREAMS } from "./manifest";
import { useAllVotes } from "./votes";

type VoteFilter = "all" | "up" | "down" | "undecided";

const FILTER_KEY = "dreaming.sidebar.filter.v1";

type Filter = { vote: VoteFilter; theme: string | "all" };

function readFilter(): Filter {
  if (typeof window === "undefined") return { vote: "all", theme: "all" };
  try {
    const raw = window.localStorage.getItem(FILTER_KEY);
    if (!raw) return { vote: "all", theme: "all" };
    const parsed = JSON.parse(raw);
    return {
      vote: (parsed.vote as VoteFilter) ?? "all",
      theme: (parsed.theme as string) ?? "all",
    };
  } catch {
    return { vote: "all", theme: "all" };
  }
}

function writeFilter(f: Filter): void {
  try {
    window.localStorage.setItem(FILTER_KEY, JSON.stringify(f));
  } catch {
    /* ignore */
  }
}

export function DreamingSidebar() {
  const votes = useAllVotes();
  const [filter, setFilter] = useState<Filter>(() => readFilter());
  useEffect(() => writeFilter(filter), [filter]);

  const themes = useMemo(() => {
    const set = new Set<string>();
    DREAMS.forEach((d) => d.theme && set.add(d.theme));
    return Array.from(set).sort();
  }, []);

  const filtered = useMemo(() => {
    return DREAMS.filter((d) => {
      if (filter.theme !== "all" && d.theme !== filter.theme) return false;
      const v = votes[d.slug];
      if (filter.vote === "up" && v !== "up") return false;
      if (filter.vote === "down" && v !== "down") return false;
      if (filter.vote === "undecided" && v) return false;
      return true;
    });
  }, [filter, votes]);

  const accepted = filtered.filter((d) => d.accepted);
  const pending = filtered.filter((d) => !d.accepted);

  const counts = useMemo(() => {
    const total = DREAMS.length;
    let up = 0;
    let down = 0;
    for (const d of DREAMS) {
      const v = votes[d.slug];
      if (v === "up") up++;
      else if (v === "down") down++;
    }
    return { total, up, down, undecided: total - up - down };
  }, [votes]);

  return (
    <aside className="fixed inset-y-0 left-0 z-10 w-60 overflow-y-auto border-r border-zinc-200 bg-white px-3 py-4 text-sm dark:border-zinc-800 dark:bg-zinc-950">
      <div className="mb-4 px-2">
        <div className="text-xs font-semibold uppercase tracking-wider text-violet-500">
          Dreaming
        </div>
        <div className="mt-0.5 text-[11px] text-zinc-500">
          Speculative UI for the Human+ suite.
        </div>
      </div>

      <nav className="space-y-0.5">
        <SidebarLink to="" label="Playground" />
        <SidebarLink to="lobby" label="Component Lobby" />
      </nav>

      <div className="mt-5 border-t border-zinc-200 pt-3 dark:border-zinc-800">
        <div className="px-2 text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
          Filter
        </div>
        <div className="mt-1.5 flex gap-1 px-1">
          <FilterPill
            label={`all ${counts.total}`}
            active={filter.vote === "all"}
            onClick={() => setFilter((f) => ({ ...f, vote: "all" }))}
          />
          <FilterPill
            label={`👍 ${counts.up}`}
            active={filter.vote === "up"}
            onClick={() => setFilter((f) => ({ ...f, vote: "up" }))}
          />
          <FilterPill
            label={`👎 ${counts.down}`}
            active={filter.vote === "down"}
            onClick={() => setFilter((f) => ({ ...f, vote: "down" }))}
          />
          <FilterPill
            label={`? ${counts.undecided}`}
            active={filter.vote === "undecided"}
            onClick={() => setFilter((f) => ({ ...f, vote: "undecided" }))}
          />
        </div>
        {themes.length > 0 && (
          <select
            value={filter.theme}
            onChange={(e) => setFilter((f) => ({ ...f, theme: e.target.value }))}
            className="mt-2 w-full rounded-md border border-zinc-300 bg-white px-2 py-1 text-[11px] text-zinc-700 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-300"
          >
            <option value="all">all themes</option>
            {themes.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        )}
      </div>

      {accepted.length > 0 && (
        <>
          <div className="mt-5 px-2 text-[10px] font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
            Accepted
          </div>
          <nav className="mt-1 space-y-0.5">
            {accepted.map((d) => (
              <SidebarLink
                key={d.slug}
                to={d.slug}
                label={d.title}
                pkg={d.pkg}
                accepted
                vote={votes[d.slug]}
              />
            ))}
          </nav>
        </>
      )}

      <div className="mt-5 px-2 text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
        Dreamt up
      </div>
      <nav className="mt-1 space-y-0.5">
        {pending.length === 0 && (
          <div className="px-2 py-1 text-xs italic text-zinc-400">
            Nothing matches this filter.
          </div>
        )}
        {pending.map((d) => (
          <SidebarLink
            key={d.slug}
            to={d.slug}
            label={d.title}
            pkg={d.pkg}
            vote={votes[d.slug]}
          />
        ))}
      </nav>

      <div className="mt-6 border-t border-zinc-200 pt-3 text-[11px] text-zinc-500 dark:border-zinc-800">
        <a href="/react-demos" className="hover:underline">
          ← back to react-demos
        </a>
      </div>
    </aside>
  );
}

function FilterPill({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 rounded px-1.5 py-0.5 text-[10px] font-medium transition ${
        active
          ? "bg-violet-600 text-white"
          : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800"
      }`}
    >
      {label}
    </button>
  );
}

function SidebarLink({
  to,
  label,
  pkg,
  accepted,
  vote,
}: {
  to: string;
  label: string;
  pkg?: string;
  accepted?: boolean;
  vote?: "up" | "down";
}) {
  return (
    <NavLink
      to={to}
      end={to === ""}
      className={({ isActive }) =>
        `block rounded-md px-2 py-1 transition ${
          isActive
            ? "bg-violet-100 text-violet-900 dark:bg-violet-500/15 dark:text-violet-200"
            : "text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-900"
        }`
      }
    >
      <span>{label}</span>
      {vote === "up" && <span className="ml-1 text-[10px]">👍</span>}
      {vote === "down" && <span className="ml-1 text-[10px]">👎</span>}
      {accepted && (
        <span className="ml-1 rounded-sm bg-emerald-100 px-1 text-[9px] font-semibold uppercase tracking-wider text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300">
          ✓
        </span>
      )}
      {pkg && (
        <span className="ml-1 text-[9px] uppercase tracking-wider text-zinc-400">
          {pkg}
        </span>
      )}
    </NavLink>
  );
}
