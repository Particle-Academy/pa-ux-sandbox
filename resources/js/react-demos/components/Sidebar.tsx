import { NavLink, useLocation } from "react-router";

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
  { to: "/accordion-panel", label: "AccordionPanel" },
  { to: "/breadcrumbs", label: "Breadcrumbs" },
  { to: "/navbar", label: "Navbar" },
  { to: "/pagination", label: "Pagination" },
  { to: "/menu", label: "Menu" },
  { to: "/sidebar", label: "Sidebar" },
  { to: "/mobile-menu", label: "MobileMenu" },
  { to: "/tree-nav", label: "TreeNav" },
];

const basicInputLinks = [
  { to: "/input", label: "Input" },
  { to: "/select", label: "Select" },
  { to: "/textarea", label: "Textarea" },
  { to: "/checkbox", label: "Checkbox" },
  { to: "/radio-group", label: "RadioGroup" },
  { to: "/switch", label: "Switch" },
  { to: "/slider", label: "Slider" },
  { to: "/date-picker", label: "DatePicker" },
  { to: "/multi-switch", label: "MultiSwitch" },
];

const advancedInputLinks = [
  { to: "/autocomplete", label: "Autocomplete" },
  { to: "/pillbox", label: "Pillbox" },
  { to: "/otp-input", label: "OtpInput" },
  { to: "/file-upload", label: "FileUpload" },
  { to: "/time-picker", label: "TimePicker" },
  { to: "/calendar", label: "Calendar" },
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
  { to: "/ide", label: "IDE" },
  { to: "/app-sheet", label: "AppSheet" },
  { to: "/ai-canvas-chat", label: "AI Canvas Chat" },
];

const fancyPackageLinks = [
  { to: "/code-editor", label: "CodeEditor" },
  { to: "/spreadsheet", label: "Spreadsheet" },
];

const echartsLinks = [
  { to: "/echarts-line", label: "Line" },
  { to: "/echarts-bar", label: "Bar" },
  { to: "/echarts-pie", label: "Pie" },
  { to: "/echarts-scatter", label: "Scatter" },
  { to: "/echarts-effect-scatter", label: "Effect Scatter" },
  { to: "/echarts-radar", label: "Radar" },
  { to: "/echarts-heatmap", label: "Heatmap" },
  { to: "/echarts-candlestick", label: "Candlestick" },
  { to: "/echarts-boxplot", label: "Boxplot" },
  { to: "/echarts-treemap", label: "Treemap" },
  { to: "/echarts-sunburst", label: "Sunburst" },
  { to: "/echarts-funnel", label: "Funnel" },
  { to: "/echarts-gauge", label: "Gauge" },
  { to: "/echarts-sankey", label: "Sankey" },
  { to: "/echarts-graph", label: "Graph" },
  { to: "/echarts-parallel", label: "Parallel" },
  { to: "/echarts-theme-river", label: "Theme River" },
  { to: "/echarts-calendar", label: "Calendar" },
  { to: "/echarts-pictorial-bar", label: "Pictorial Bar" },
  { to: "/echarts-map", label: "Map" },
  { to: "/echarts-custom", label: "Custom" },
];

const echarts3DLinks = [
  { to: "/echarts-bar-3d", label: "Bar 3D" },
  { to: "/echarts-scatter-3d", label: "Scatter 3D" },
  { to: "/echarts-surface", label: "Surface 3D" },
  { to: "/echarts-globe", label: "Globe 3D" },
  { to: "/echarts-graphic", label: "Graphic" },
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

function ReactFancyNav() {
  return (
    <>
      <SectionHeader label="Components" />
      <LinkGroup links={componentLinks} />

      <SectionHeader label="Display" />
      <LinkGroup links={displayLinks} />

      <SectionHeader label="Overlay" />
      <LinkGroup links={overlayLinks} />

      <SectionHeader label="Navigation" />
      <LinkGroup links={navigationLinks} />

      <SectionHeader label="Inputs" />
      <LinkGroup links={basicInputLinks} />

      <SectionHeader label="Advanced Inputs" />
      <LinkGroup links={advancedInputLinks} />

      <SectionHeader label="Rich Content" />
      <LinkGroup links={richContentLinks} />

      <SectionHeader label="Patterns" />
      <LinkGroup links={patternLinks} />

      <SectionHeader label="Fancy Packages" />
      <LinkGroup links={fancyPackageLinks} />
    </>
  );
}

function EChartsNav() {
  return (
    <>
      <SectionHeader label="2D Charts" />
      <LinkGroup links={echartsLinks} />

      <SectionHeader label="3D & Graphic" />
      <LinkGroup links={echarts3DLinks} />
    </>
  );
}

type Package = "react-fancy" | "fancy-echarts";

function useCurrentPackage(): Package {
  const { pathname } = useLocation();
  if (pathname.startsWith("/echarts-")) return "fancy-echarts";
  return "react-fancy";
}



function PackageSwitcher({ current }: { current: Package }) {
  return (
    <div className="flex gap-1 rounded-lg bg-zinc-100 p-0.5 dark:bg-zinc-800">
      <NavLink
        to="/"
        className={`flex-1 rounded-md px-2 py-1 text-center text-[11px] font-medium transition-colors ${
          current === "react-fancy"
            ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-700 dark:text-zinc-100"
            : "text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
        }`}
      >
        react-fancy
      </NavLink>
      <NavLink
        to="/echarts-line"
        className={`flex-1 rounded-md px-2 py-1 text-center text-[11px] font-medium transition-colors ${
          current === "fancy-echarts"
            ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-700 dark:text-zinc-100"
            : "text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
        }`}
      >
        fancy-echarts
      </NavLink>
    </div>
  );
}

export function Sidebar() {
  const currentPackage = useCurrentPackage();

  return (
    <aside className="fixed top-0 left-0 h-screen w-56 overflow-y-auto border-r border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="mb-3">
        <a href="/ux-demos" className="text-xs text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300">
          &larr; UX Demo Hub
        </a>
      </div>

      <PackageSwitcher current={currentPackage} />

      <nav className="mt-2 flex flex-col gap-0.5 pb-6">
        <NavItem to="/" label="Home" end />
        {currentPackage === "react-fancy" ? <ReactFancyNav /> : <EChartsNav />}
      </nav>
    </aside>
  );
}
