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

const displayLinks = [
  { to: "/heading", label: "Heading" },
  { to: "/text", label: "Text" },
  { to: "/separator", label: "Separator" },
  { to: "/badge", label: "Badge" },
  { to: "/icon", label: "Icon" },
  { to: "/avatar", label: "Avatar" },
  { to: "/skeleton", label: "Skeleton" },
  { to: "/progress", label: "Progress" },
  { to: "/brand", label: "Brand" },
  { to: "/profile", label: "Profile" },
  { to: "/card", label: "Card" },
  { to: "/callout", label: "Callout" },
  { to: "/timeline", label: "Timeline" },
];

const overlayLinks = [
  { to: "/tooltip", label: "Tooltip" },
  { to: "/popover", label: "Popover" },
  { to: "/dropdown", label: "Dropdown" },
  { to: "/context-menu", label: "ContextMenu" },
  { to: "/modal", label: "Modal" },
  { to: "/toast", label: "Toast" },
  { to: "/command", label: "Command" },
];

const navigationLinks = [
  { to: "/tabs", label: "Tabs" },
  { to: "/accordion", label: "Accordion" },
  { to: "/breadcrumbs", label: "Breadcrumbs" },
  { to: "/navbar", label: "Navbar" },
  { to: "/pagination", label: "Pagination" },
  { to: "/menu", label: "Menu" },
  { to: "/sidebar", label: "Sidebar" },
  { to: "/mobile-menu", label: "MobileMenu" },
];

const inputLinks = [
  { to: "/autocomplete", label: "Autocomplete" },
  { to: "/pillbox", label: "Pillbox" },
  { to: "/otp-input", label: "OtpInput" },
  { to: "/file-upload", label: "FileUpload" },
  { to: "/time-picker", label: "TimePicker" },
  { to: "/calendar", label: "Calendar" },
  { to: "/multi-switch", label: "MultiSwitch" },
];

const richContentLinks = [
  { to: "/composer", label: "Composer" },
  { to: "/chart", label: "Chart" },
  { to: "/editor", label: "Editor" },
  { to: "/kanban", label: "Kanban" },
  { to: "/canvas", label: "Canvas" },
  { to: "/diagram", label: "Diagram" },
];

const patternLinks = [
  { to: "/wizard", label: "Wizard Form" },
  { to: "/nested-carousel", label: "Nested Carousel" },
  { to: "/dynamic-carousel", label: "Dynamic Carousel" },
  { to: "/kitchen-sink", label: "Kitchen Sink" },
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
        `rounded-lg px-3 py-1.5 text-sm transition-colors ${
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

function LinkGroup({ links }: { links: { to: string; label: string }[] }) {
  return (
    <>
      {links.map((link) => (
        <NavItem key={link.to} to={link.to} label={link.label} />
      ))}
    </>
  );
}

export function Sidebar() {
  return (
    <aside className="fixed top-0 left-0 h-screen w-56 overflow-y-auto border-r border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="mb-4">
        <h1 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">@particle-academy/react-fancy</h1>
        <a href="/ux-demos" className="text-xs text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300">
          &larr; Back to UX Demo Hub
        </a>
      </div>
      <nav className="flex flex-col gap-0.5 pb-6">
        <NavItem to="/" label="Home" end />

        <SectionHeader label="Components" />
        <LinkGroup links={componentLinks} />

        <SectionHeader label="Display" />
        <LinkGroup links={displayLinks} />

        <SectionHeader label="Overlay" />
        <LinkGroup links={overlayLinks} />

        <SectionHeader label="Navigation" />
        <LinkGroup links={navigationLinks} />

        <SectionHeader label="Inputs" />
        <LinkGroup links={inputLinks} />

        <SectionHeader label="Rich Content" />
        <LinkGroup links={richContentLinks} />

        <SectionHeader label="Patterns" />
        <LinkGroup links={patternLinks} />
      </nav>
    </aside>
  );
}
