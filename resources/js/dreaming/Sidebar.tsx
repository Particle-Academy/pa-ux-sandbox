import { NavLink } from "react-router";
import { DREAMS } from "./manifest";

export function DreamingSidebar() {
  return (
    <aside className="fixed inset-y-0 left-0 z-10 w-56 overflow-y-auto border-r border-zinc-200 bg-white px-3 py-4 text-sm dark:border-zinc-800 dark:bg-zinc-950">
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

      <div className="mt-5 px-2 text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
        Dreamt up
      </div>
      <nav className="mt-1 space-y-0.5">
        {DREAMS.length === 0 && (
          <div className="px-2 py-1 text-xs italic text-zinc-400">
            Nothing dreamt yet — the loop will fill this in.
          </div>
        )}
        {DREAMS.map((d) => (
          <SidebarLink key={d.slug} to={d.slug} label={d.title} pkg={d.pkg} />
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

function SidebarLink({ to, label, pkg }: { to: string; label: string; pkg?: string }) {
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
      {pkg && (
        <span className="ml-1 text-[9px] uppercase tracking-wider text-zinc-400">
          {pkg}
        </span>
      )}
    </NavLink>
  );
}
