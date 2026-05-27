import { Link } from "react-router";

interface Demo {
  name: string;
  slug: string;
  description: string;
}

interface Section {
  label: string;
  demos: Demo[];
}

const reactFancySections: Section[] = [
  {
    label: "Components",
    demos: [
      { name: "Action", slug: "action", description: "Buttons, links, and interactive action elements" },
      { name: "Carousel", slug: "carousel", description: "Compound carousel with slides, controls, and steps" },
      { name: "ColorPicker", slug: "color-picker", description: "HSL color picker with swatches and input" },
      { name: "Emoji", slug: "emoji", description: "Render emojis by name with size variants" },
      { name: "EmojiSelect", slug: "emoji-select", description: "Searchable emoji picker with categories" },
      { name: "Inputs", slug: "inputs", description: "Form inputs with dirty state, validation, and ranges" },
      { name: "Table", slug: "table", description: "Data table with sorting, pagination, and search" },
    ],
  },
  {
    label: "Display",
    demos: [
      { name: "Heading", slug: "heading", description: "Typographic heading scale" },
      { name: "Text", slug: "text", description: "Body text with variants and tones" },
      { name: "Separator", slug: "separator", description: "Horizontal and vertical dividers" },
      { name: "Badge", slug: "badge", description: "Status pills and counters" },
      { name: "Icon", slug: "icon", description: "Lucide-backed icon component" },
      { name: "Avatar", slug: "avatar", description: "Avatar with fallbacks and stacks" },
      { name: "Skeleton", slug: "skeleton", description: "Loading placeholder shapes" },
      { name: "Progress", slug: "progress", description: "Linear and circular progress" },
      { name: "Brand", slug: "brand", description: "Brand mark and wordmark layouts" },
      { name: "Profile", slug: "profile", description: "User profile cards and rows" },
      { name: "Card", slug: "card", description: "Composable card surfaces" },
      { name: "Callout", slug: "callout", description: "Inline notices and alerts" },
      { name: "Timeline", slug: "timeline", description: "Vertical activity timeline" },
    ],
  },
  {
    label: "Overlay",
    demos: [
      { name: "Tooltip", slug: "tooltip", description: "Hover/focus tooltips" },
      { name: "Popover", slug: "popover", description: "Anchored popover panels" },
      { name: "Dropdown", slug: "dropdown", description: "Dropdown menus with keyboard nav" },
      { name: "ContextMenu", slug: "context-menu", description: "Right-click context menus" },
      { name: "Modal", slug: "modal", description: "Dialogs with focus trap" },
      { name: "Toast", slug: "toast", description: "Stacking transient notifications" },
      { name: "Command", slug: "command", description: "Cmd+K command palette" },
    ],
  },
  {
    label: "Navigation",
    demos: [
      { name: "Tabs", slug: "tabs", description: "Horizontal and vertical tabs" },
      { name: "Accordion", slug: "accordion", description: "Collapsible content sections" },
      { name: "AccordionPanel", slug: "accordion-panel", description: "Slide-in accordion panels with custom triggers" },
      { name: "Breadcrumbs", slug: "breadcrumbs", description: "Hierarchical navigation trail" },
      { name: "Navbar", slug: "navbar", description: "Top app bar with sections" },
      { name: "Pagination", slug: "pagination", description: "Page selectors with ellipsis" },
      { name: "Menu", slug: "menu", description: "Sidebar and inline menus" },
      { name: "Sidebar", slug: "sidebar", description: "Collapsible app sidebar" },
      { name: "MobileMenu", slug: "mobile-menu", description: "Mobile drawer navigation" },
      { name: "TreeNav", slug: "tree-nav", description: "Nested tree navigation" },
    ],
  },
  {
    label: "Inputs",
    demos: [
      { name: "Input", slug: "input", description: "Text input with affixes" },
      { name: "Select", slug: "select", description: "Native and listbox selects with creatable mode" },
      { name: "Textarea", slug: "textarea", description: "Auto-growing textarea" },
      { name: "Checkbox", slug: "checkbox", description: "Checkboxes and groups" },
      { name: "RadioGroup", slug: "radio-group", description: "Radio button groups" },
      { name: "Switch", slug: "switch", description: "Toggle switch" },
      { name: "Slider", slug: "slider", description: "Single and range slider" },
      { name: "DatePicker", slug: "date-picker", description: "Date and range picker" },
      { name: "MultiSwitch", slug: "multi-switch", description: "Segmented multi-choice switch" },
    ],
  },
  {
    label: "Advanced Inputs",
    demos: [
      { name: "Autocomplete", slug: "autocomplete", description: "Async autocomplete with suggestions" },
      { name: "Pillbox", slug: "pillbox", description: "Tag input with pills" },
      { name: "OtpInput", slug: "otp-input", description: "One-time-passcode entry" },
      { name: "FileUpload", slug: "file-upload", description: "Drag-and-drop file upload" },
      { name: "TimePicker", slug: "time-picker", description: "Time entry with steppers" },
      { name: "Calendar", slug: "calendar", description: "Inline calendar surface" },
    ],
  },
  {
    label: "Rich Content",
    demos: [
      { name: "Composer", slug: "composer", description: "Rich text composer" },
      { name: "Chart", slug: "chart", description: "Lightweight chart primitives" },
      { name: "Editor", slug: "editor", description: "Block content editor" },
      { name: "Kanban", slug: "kanban", description: "Drag-and-drop board with WIP limits, filters, reorder" },
      { name: "Canvas", slug: "canvas", description: "Pannable/zoomable canvas surface" },
      { name: "Diagram", slug: "diagram", description: "Node-and-edge diagrams" },
    ],
  },
  {
    label: "Patterns",
    demos: [
      { name: "Wizard Form", slug: "wizard", description: "Multi-step form wizard built on Carousel" },
      { name: "Nested Carousel", slug: "nested-carousel", description: "Independent carousels nested inside each other" },
      { name: "Dynamic Carousel", slug: "dynamic-carousel", description: "Add and remove slides at runtime" },
      { name: "Kitchen Sink", slug: "kitchen-sink", description: "Dense dashboard combining many components" },
      { name: "IDE", slug: "ide", description: "VS Code-style IDE shell" },
      { name: "AppSheet", slug: "app-sheet", description: "Budget tracker built with Spreadsheet" },
      { name: "AI Canvas Chat", slug: "ai-canvas-chat", description: "Chat flyout with full canvas + AI Brain force-graph" },
      { name: "Canvas Studio", slug: "canvas-studio", description: "Interactive widgets on a pannable canvas with portable scene-data (DOM + Babylon adapter)" },
      { name: "Babylon City", slug: "babylon-city", description: "A city street built from fancy-3d primitives — demos as billboards on each building" },
      { name: "Stage + Screen", slug: "screen-stage", description: "fancy-3d Stage hosting interactive Screens — each surface is a live react-fancy tree" },
      { name: "Whiteboard", slug: "whiteboard", description: "fancy-whiteboard primitives — Board, sticky notes, drawing, connectors, shapes, cursors" },
      { name: "Whiteboard — Full Demo", slug: "whiteboard-full", description: "Design-sprint board: fancy-whiteboard + react-fancy toolbar, presence, JSON export" },
      { name: "Whiteboard — You & Claude", slug: "whiteboard-agent", description: "Live agent collab: Claude drives the whiteboard via in-process MCP + agent-integrations bridge" },
      { name: "Whiteboard — Shared (MCP relay)", slug: "whiteboard-shared", description: "Token-gated relay: any external MCP client can drive a live whiteboard via /whiteboard-share endpoints" },
      { name: "Workflow — Agent Editor", slug: "workflow-agent", description: "fancy-flow editor + topological runner; agents add nodes, connect ports, and trigger runs via flow_* MCP tools" },
      { name: "Human+ UX (full surface)", slug: "human-plus", description: "Whiteboard + form + sheet + chart on one screen — every surface bridged, presence indicators across all of them" },
    ],
  },
  {
    label: "Fancy Packages",
    demos: [
      { name: "CodeEditor", slug: "code-editor", description: "@particle-academy/fancy-code editor" },
      { name: "Spreadsheet", slug: "spreadsheet", description: "@particle-academy/fancy-sheets spreadsheet" },
    ],
  },
];

const echartsSections: Section[] = [
  {
    label: "2D Charts",
    demos: [
      { name: "Line", slug: "echarts-line", description: "Line and area charts" },
      { name: "Bar", slug: "echarts-bar", description: "Bar and stacked bar" },
      { name: "Pie", slug: "echarts-pie", description: "Pie and doughnut" },
      { name: "Scatter", slug: "echarts-scatter", description: "Scatter plots" },
      { name: "Effect Scatter", slug: "echarts-effect-scatter", description: "Scatter with ripple effects" },
      { name: "Radar", slug: "echarts-radar", description: "Radar/spider charts" },
      { name: "Heatmap", slug: "echarts-heatmap", description: "Cartesian heatmaps" },
      { name: "Candlestick", slug: "echarts-candlestick", description: "OHLC candlestick" },
      { name: "Boxplot", slug: "echarts-boxplot", description: "Statistical boxplots" },
      { name: "Treemap", slug: "echarts-treemap", description: "Hierarchical treemap" },
      { name: "Sunburst", slug: "echarts-sunburst", description: "Radial hierarchy" },
      { name: "Funnel", slug: "echarts-funnel", description: "Funnel charts" },
      { name: "Gauge", slug: "echarts-gauge", description: "Dial gauges" },
      { name: "Sankey", slug: "echarts-sankey", description: "Flow diagrams" },
      { name: "Graph", slug: "echarts-graph", description: "Force-directed graphs" },
      { name: "Parallel", slug: "echarts-parallel", description: "Parallel coordinates" },
      { name: "Theme River", slug: "echarts-theme-river", description: "Streamgraph over time" },
      { name: "Calendar", slug: "echarts-calendar", description: "Calendar heatmap" },
      { name: "Pictorial Bar", slug: "echarts-pictorial-bar", description: "Symbol-based bars" },
      { name: "Map", slug: "echarts-map", description: "Geographic maps" },
      { name: "Custom", slug: "echarts-custom", description: "Custom series renderers" },
    ],
  },
  {
    label: "3D & Graphic",
    demos: [
      { name: "Bar 3D", slug: "echarts-bar-3d", description: "3D bar charts via echarts-gl" },
      { name: "Scatter 3D", slug: "echarts-scatter-3d", description: "3D scatter via echarts-gl" },
      { name: "Surface 3D", slug: "echarts-surface", description: "3D surface plots" },
      { name: "Globe 3D", slug: "echarts-globe", description: "Interactive 3D globe" },
      { name: "Graphic", slug: "echarts-graphic", description: "Free-form vector graphics" },
    ],
  },
];

function DemoCard({ demo }: { demo: Demo }) {
  return (
    <Link
      to={`/${demo.slug}`}
      className="rounded-xl border border-zinc-200 p-4 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800/50"
    >
      <h3 className="font-medium text-zinc-900 dark:text-zinc-100">{demo.name}</h3>
      <p className="mt-1 text-sm text-zinc-500">{demo.description}</p>
    </Link>
  );
}

function PackageBlock({ title, npm, blurb, sections }: { title: string; npm: string; blurb: string; sections: Section[] }) {
  return (
    <section className="mb-10">
      <div className="mb-4 border-b border-zinc-200 pb-3 dark:border-zinc-800">
        <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{title}</h2>
        <p className="mt-1 font-mono text-xs text-zinc-500">{npm}</p>
        <p className="mt-2 text-sm text-zinc-500">{blurb}</p>
      </div>
      {sections.map((section) => (
        <div key={section.label} className="mb-6">
          <h3 className="mb-3 text-xs font-semibold tracking-wider text-zinc-400 uppercase">
            {section.label}
          </h3>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
            {section.demos.map((demo) => (
              <DemoCard key={demo.slug} demo={demo} />
            ))}
          </div>
        </div>
      ))}
    </section>
  );
}

export function Home() {
  return (
    <div>
      <h1 className="mb-2 text-3xl font-bold text-zinc-900 dark:text-zinc-100">Particle Academy React Demos</h1>
      <p className="mb-8 text-zinc-500">
        Live demos for every component across the Particle Academy React packages. Use the
        sidebar to switch between packages, or jump straight into a demo below.
      </p>

      <PackageBlock
        title="react-fancy"
        npm="@particle-academy/react-fancy"
        blurb="Tailwind-first React component library — buttons, overlays, navigation, inputs, and rich-content patterns."
        sections={reactFancySections}
      />

      <PackageBlock
        title="fancy-echarts"
        npm="@particle-academy/fancy-echarts"
        blurb="Typed React wrappers around Apache ECharts, covering every 2D chart type plus 3D and free-form graphics via echarts-gl."
        sections={echartsSections}
      />
    </div>
  );
}
