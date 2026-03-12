import { NavLink } from "react-router";

const componentLinks = [
  { to: "/action", label: "Action" },
  { to: "/carousel", label: "Carousel" },
  { to: "/color-picker", label: "ColorPicker" },
  { to: "/emoji", label: "Emoji" },
  { to: "/emoji-select", label: "EmojiSelect" },
  { to: "/inputs", label: "Inputs" },
  { to: "/table", label: "Table" },
];

const patternLinks = [
  { to: "/wizard", label: "Wizard Form" },
  { to: "/nested-carousel", label: "Nested Carousel" },
  { to: "/dynamic-carousel", label: "Dynamic Carousel" },
];

function SectionHeader({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2 px-3 pt-4 pb-1">
      <div className="h-px flex-1 bg-zinc-200 dark:bg-zinc-700" />
      <span className="text-[10px] font-semibold tracking-wider text-zinc-400 uppercase">
        {label}
      </span>
      <div className="h-px flex-1 bg-zinc-200 dark:bg-zinc-700" />
    </div>
  );
}

function NavItem({ to, label, end }: { to: string; label: string; end?: boolean }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        `rounded-lg px-3 py-2 text-sm transition-colors ${
          isActive
            ? "bg-zinc-100 font-medium text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100"
            : "text-zinc-600 hover:bg-zinc-50 dark:text-zinc-400 dark:hover:bg-zinc-800/50"
        }`
      }
    >
      {label}
    </NavLink>
  );
}

export function Sidebar() {
  return (
    <aside className="fixed top-0 left-0 h-screen w-56 border-r border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="mb-6">
        <h1 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">@fancy/react</h1>
        <a href="/ux-demos" className="text-xs text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300">
          &larr; Back to UX Demo Hub
        </a>
      </div>
      <nav className="flex flex-col gap-1">
        <NavItem to="/" label="Home" end />

        <SectionHeader label="Components" />
        {componentLinks.map((link) => (
          <NavItem key={link.to} to={link.to} label={link.label} />
        ))}

        <SectionHeader label="Carousel Patterns" />
        {patternLinks.map((link) => (
          <NavItem key={link.to} to={link.to} label={link.label} />
        ))}
      </nav>
    </aside>
  );
}
