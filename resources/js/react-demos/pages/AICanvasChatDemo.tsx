import { useEffect, useMemo, useRef, useState } from "react";
import {
  AccordionPanel,
  Action,
  Avatar,
  Badge,
  Card,
  Input,
  useAccordionSection,
} from "@particle-academy/react-fancy";
import { EChart, registerAll } from "@particle-academy/fancy-echarts";

// EChart renderers/components/series only exist after registerAll() runs.
// The /echarts-* routes get this via the EChartsLayout wrapper; this demo
// lives outside that layout, so register here at module scope. registerAll
// is internally guarded against double-calls.
registerAll();

// ─────────────────────────────────────────────────────────────────────────
// Right-anchored flyout: a single horizontal AccordionPanel pinned to the
// right edge of the viewport with two sections — Canvas (wide) and Chat
// (medium). Both default closed, so only their chevron triggers sit on the
// edge until the user opens them.
//
// JSX order matters: each section renders <Content /> before <Trigger />,
// so the trigger ends up on the section's right edge — between the
// content and the next section to its right (or the viewport edge).
// Section openClassName sets the width when open; closed sections shrink
// to just the chevron button.
// ─────────────────────────────────────────────────────────────────────────

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}

// ── AI Brain memory model ────────────────────────────────────────────────

interface MemoryFile {
  id: string;
  /** Cluster this memory belongs to */
  cluster: string;
  /** Short label rendered on the node */
  label: string;
  /** Long-form memory body shown in the popover */
  body: string;
  /** When the memory was saved (ISO date string) */
  savedAt: string;
  /** Where the memory came from */
  source: "chat" | "code-edit" | "manual" | "auto";
  /** Importance / recency weight; drives node size */
  weight: number;
}

interface MemoryCluster {
  id: string;
  label: string;
  /** Tailwind-style hex shipped to ECharts as itemStyle.color */
  color: string;
  /** A short description shown in the popover when the cluster is the
   * subject (overview node click). */
  summary: string;
}

const SEED_MESSAGES: ChatMessage[] = [
  {
    id: "m1",
    role: "user",
    content: "Sketch an onboarding flow for the new analytics product.",
    timestamp: Date.now() - 1000 * 60 * 8,
  },
  {
    id: "m2",
    role: "assistant",
    content:
      "Drafted a four-step flow on the canvas — Welcome, Connect data source, Pick metrics, Invite team. Want me to merge step 3 into 2?",
    timestamp: Date.now() - 1000 * 60 * 7,
  },
  {
    id: "m3",
    role: "user",
    content: "Keep them separate, but make 'Invite team' optional.",
    timestamp: Date.now() - 1000 * 60 * 5,
  },
  {
    id: "m4",
    role: "assistant",
    content:
      "Marked step 4 as skippable. Open the canvas to inspect — the skip button is a soft outline so it doesn't compete with the primary CTA.",
    timestamp: Date.now() - 1000 * 60 * 4,
  },
];

const CLUSTERS: MemoryCluster[] = [
  {
    id: "preferences",
    label: "Preferences",
    color: "#3b82f6",
    summary:
      "Long-term user preferences — communication style, tooling defaults, formatting rules. Persists across sessions.",
  },
  {
    id: "project",
    label: "Project context",
    color: "#10b981",
    summary:
      "Active repository structure, package metadata, build pipeline, current submodule pointers.",
  },
  {
    id: "decisions",
    label: "Decisions",
    color: "#f59e0b",
    summary:
      "Architecture and product decisions made in chat — captured with date and rationale so future replies stay coherent.",
  },
  {
    id: "patterns",
    label: "Code patterns",
    color: "#8b5cf6",
    summary:
      "Recurring abstractions, naming conventions, idiomatic shape of components. Sourced from repo grep + chat.",
  },
  {
    id: "integrations",
    label: "Integrations",
    color: "#ec4899",
    summary:
      "External services: Stripe Catalog/Tax, npm trusted publishing, GitHub Actions OIDC, Herd local TLS.",
  },
  {
    id: "session",
    label: "Session",
    color: "#06b6d4",
    summary:
      "Short-term episodic memory of the current chat. Flushed when the conversation is archived.",
  },
  {
    id: "bugs",
    label: "Bugs & fixes",
    color: "#ef4444",
    summary:
      "Tracked issues, root-cause notes, fix references. Linked to commits and PRs where available.",
  },
];

const MEMORY_FILES: MemoryFile[] = [
  // Preferences
  {
    id: "pref.types",
    cluster: "preferences",
    label: "TypeScript over JavaScript",
    body: "User opts for TS in every greenfield project. Never propose JS unless the existing repo is JS-only and tests would have to be rewritten.",
    savedAt: "2026-02-04",
    source: "chat",
    weight: 18,
  },
  {
    id: "pref.tone",
    cluster: "preferences",
    label: "Terse responses",
    body: "Lead with the answer, no preamble. No 'Great question!' Drop the trailing 'Let me know if you want…'.",
    savedAt: "2026-02-11",
    source: "chat",
    weight: 22,
  },
  {
    id: "pref.docs",
    cluster: "preferences",
    label: "Update docs with code",
    body: "Always update docs/*.md when shipping component changes; don't wait to be asked.",
    savedAt: "2026-04-21",
    source: "chat",
    weight: 16,
  },
  {
    id: "pref.git",
    cluster: "preferences",
    label: "No `git add -A`",
    body: "Stage specific files by name. Monorepo has submodules and untracked experiments that must not be blindly committed.",
    savedAt: "2026-03-02",
    source: "chat",
    weight: 14,
  },
  {
    id: "pref.theme",
    cluster: "preferences",
    label: "Dark UI default",
    body: "Demos and screenshots default to dark mode unless the topic is light-mode-specific.",
    savedAt: "2026-02-04",
    source: "manual",
    weight: 10,
  },

  // Project context
  {
    id: "proj.repo",
    cluster: "project",
    label: "pa-ux-sandbox",
    body: "Folder name is laravel-catalog but the repo / project is pa-ux-sandbox. It's a sandbox for the Particle Academy UI packages, not a production target.",
    savedAt: "2026-04-24",
    source: "chat",
    weight: 24,
  },
  {
    id: "proj.alias",
    cluster: "project",
    label: "vite path alias",
    body: "vite.config.js aliases @particle-academy/* to each package's src/. Edits to package source hot-reload through the sandbox dev server.",
    savedAt: "2026-04-22",
    source: "code-edit",
    weight: 18,
  },
  {
    id: "proj.publish",
    cluster: "project",
    label: "Trusted publishing flow",
    body: "Each React package publishes to npm via GitHub Actions OIDC on tag push v*.*.*. fancy-echarts publishes from the react-echarts repo (only the npm name was renamed).",
    savedAt: "2026-04-27",
    source: "manual",
    weight: 20,
  },
  {
    id: "proj.workspace",
    cluster: "project",
    label: "workspace:* rewrite",
    body: "fancy-code and fancy-sheets declare react-fancy as workspace:*. Standalone CI rewrites that to a plain version range before npm install.",
    savedAt: "2026-04-22",
    source: "code-edit",
    weight: 12,
  },
  {
    id: "proj.reload",
    cluster: "project",
    label: "`reload` shortcut",
    body: "`reload` = `php artisan optimize && npm run build`. Used to refresh prebuilt sandbox assets without bringing up the vite dev server.",
    savedAt: "2026-04-28",
    source: "chat",
    weight: 14,
  },

  // Decisions
  {
    id: "dec.flyout",
    cluster: "decisions",
    label: "Right-anchored flyout",
    body: "AICanvasChatDemo uses a horizontal AccordionPanel pinned to the right edge with two sections (Canvas, Chat) that expand leftward. Subtle full-height trigger bars; no rounded boxes.",
    savedAt: "2026-04-27",
    source: "chat",
    weight: 22,
  },
  {
    id: "dec.unstyled",
    cluster: "decisions",
    label: "`unstyled` opt-out",
    body: "Components ship with sensible default visuals. Consumers wanting full-bleed layouts pass `unstyled` to skip the layout opinions but keep behavior wiring (drag handlers, drop targets, context).",
    savedAt: "2026-04-26",
    source: "chat",
    weight: 18,
  },
  {
    id: "dec.kanban-toindex",
    cluster: "decisions",
    label: "onCardMove(toIndex)",
    body: "Within-column reorder is supported by adding a 4th `toIndex` argument to the move callback. Backwards-compatible because TS covariant fn types let 3-arg callers stay valid.",
    savedAt: "2026-04-28",
    source: "chat",
    weight: 16,
  },
  {
    id: "dec.sandbox-only",
    cluster: "decisions",
    label: "Sandbox vs production",
    body: "Sandbox security findings re-rated; the sandbox isn't a deploy target. Findings inside packages stay at full severity since those ship.",
    savedAt: "2026-04-26",
    source: "chat",
    weight: 14,
  },

  // Code patterns
  {
    id: "pat.compound",
    cluster: "patterns",
    label: "Compound components",
    body: "Use Object.assign(Root, { Child1, Child2 }) so consumers can write <Foo.Trigger> alongside <Foo>. Matches Carousel, Editor, Kanban, AccordionPanel.",
    savedAt: "2026-04-25",
    source: "code-edit",
    weight: 18,
  },
  {
    id: "pat.sanitize",
    cluster: "patterns",
    label: "DOMParser sanitization",
    body: "When sanitizing HTML, use the browser-native DOMParser (no third-party deps) — strip script/iframe/etc., remove on* attrs, filter href/src to a safe-protocol allow-list.",
    savedAt: "2026-04-24",
    source: "code-edit",
    weight: 14,
  },
  {
    id: "pat.cn",
    cluster: "patterns",
    label: "cn() class merging",
    body: "All components route className through cn() so consumer overrides win deterministically. Tailwind-merge handles conflict resolution.",
    savedAt: "2026-02-19",
    source: "code-edit",
    weight: 12,
  },
  {
    id: "pat.cb-types",
    cluster: "patterns",
    label: "Covariant callbacks",
    body: "When adding parameters to existing callbacks, append at the end. TS lets shorter callable types satisfy a wider one, so existing consumers stay valid.",
    savedAt: "2026-04-28",
    source: "chat",
    weight: 10,
  },

  // Integrations
  {
    id: "int.npm-oidc",
    cluster: "integrations",
    label: "npm OIDC publishing",
    body: "publish.yml uses `npx -y npm@latest publish --provenance --access public` because the runner's bundled npm 10 doesn't support OIDC trusted publishing (needs 11.5+).",
    savedAt: "2026-04-22",
    source: "code-edit",
    weight: 16,
  },
  {
    id: "int.stripe",
    cluster: "integrations",
    label: "Stripe Catalog",
    body: "Plans are Products with recurring Prices. Every Product must have a Price before sync. Tax handled via Stripe Tax for EU customers (in flight).",
    savedAt: "2026-04-15",
    source: "manual",
    weight: 14,
  },
  {
    id: "int.herd",
    cluster: "integrations",
    label: "Herd local TLS",
    body: "Sandbox runs at https://laravel-catalog.test with Herd-managed self-signed cert. Vite dev shares the cert via @vite-plugin's HTTPS support.",
    savedAt: "2026-04-22",
    source: "manual",
    weight: 10,
  },
  {
    id: "int.gh",
    cluster: "integrations",
    label: "GitHub repo per submodule",
    body: "Every packages/* submodule has its own remote on Particle-Academy/<name>. CI lives at .github/workflows/{ci,publish}.yml inside the submodule.",
    savedAt: "2026-04-28",
    source: "code-edit",
    weight: 14,
  },

  // Session
  {
    id: "sess.kanban",
    cluster: "session",
    label: "Shipping Kanban v2.8.0",
    body: "Just shipped within-column reorder, drop indicator, column reorder, WIP limits, hideWhenEmpty. Patched the indicator placement bug in v2.8.1.",
    savedAt: "2026-04-28",
    source: "chat",
    weight: 22,
  },
  {
    id: "sess.brain",
    cluster: "session",
    label: "Building AI Brain",
    body: "Replacing the AICanvas mock onboarding flow with a force-graph view of memory clusters. Click a cluster → drill in to file-level nodes. Click a file → popover with the saved memory.",
    savedAt: "2026-04-28",
    source: "chat",
    weight: 18,
  },

  // Bugs & fixes
  {
    id: "bug.indicator",
    cluster: "bugs",
    label: "Drop indicator stuck at bottom",
    body: "Caused by walking React tree for child.type === KanbanCard, which fails when cards are wrapped in ContextMenu. Fixed in v2.8.1 by switching to absolute-positioned overlay driven by DOM querySelector.",
    savedAt: "2026-04-28",
    source: "chat",
    weight: 18,
  },
  {
    id: "bug.singleaxis",
    cluster: "bugs",
    label: "ThemeRiver crash",
    body: "react-echarts registerAll() didn't include SingleAxisComponent → ThemeRiver charts crashed with `Cannot read properties of undefined (reading 'get')`. Fixed in fancy-echarts v1.1.3 (then renamed).",
    savedAt: "2026-04-26",
    source: "code-edit",
    weight: 12,
  },
  {
    id: "bug.timeline-xss",
    cluster: "bugs",
    label: "Timeline {!! !!} XSS",
    body: "fancy-flux/Timeline rendered event['description'] with raw output. Stored XSS for any consumer feeding user input. Patched in v1.2.1 (escaped-by-default).",
    savedAt: "2026-04-26",
    source: "code-edit",
    weight: 14,
  },
];

function formatTime(ts: number): string {
  const date = new Date(ts);
  return date.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
}

// ─────────────────────────────────────────────────────────────────────────
// Workspace (the page behind the flyout)
// ─────────────────────────────────────────────────────────────────────────

function ProjectWorkspace({
  onAskAI,
}: {
  onAskAI: () => void;
}) {
  const projects = [
    {
      id: "p1",
      name: "Analytics onboarding",
      updated: "2m ago",
      thumb: "linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)",
    },
    {
      id: "p2",
      name: "Pricing redesign",
      updated: "yesterday",
      thumb: "linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)",
    },
    {
      id: "p3",
      name: "Mobile checkout",
      updated: "Tue",
      thumb: "linear-gradient(135deg, #10b981 0%, #06b6d4 100%)",
    },
    {
      id: "p4",
      name: "Empty-state copy",
      updated: "last week",
      thumb: "linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)",
    },
    {
      id: "p5",
      name: "Help center IA",
      updated: "Apr 18",
      thumb: "linear-gradient(135deg, #64748b 0%, #1e293b 100%)",
    },
  ];

  return (
    <div className="flex h-full flex-col">
      {/* Top app bar */}
      <header className="flex items-center gap-3 border-b border-zinc-800 px-6 py-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-100 text-sm font-bold text-zinc-900">
          AI
        </div>
        <h1 className="text-sm font-semibold text-zinc-100">Studio</h1>
        <Badge color="green" size="sm">
          connected
        </Badge>
        <div className="ml-auto flex items-center gap-2">
          <Action variant="ghost" size="sm" icon="search">
            Search
          </Action>
          <Action onClick={onAskAI} size="sm" color="violet" icon="sparkles">
            Ask AI
          </Action>
        </div>
      </header>

      {/* Project grid */}
      <main className="flex-1 overflow-auto px-6 py-8">
        <div className="mb-4 flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-bold text-zinc-100">
              Recent projects
            </h2>
            <p className="text-sm text-zinc-500">
              Open the AI panel to render mockups directly into a project's
              canvas.
            </p>
          </div>
          <Action size="sm" icon="plus" color="blue">
            New project
          </Action>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((p) => (
            <Card
              key={p.id}
              variant="elevated"
              padding="none"
              className="overflow-hidden border-zinc-800 bg-zinc-900 hover:ring-1 hover:ring-zinc-700"
            >
              <div
                style={{ background: p.thumb }}
                className="aspect-video w-full"
              />
              <div className="space-y-1 p-4">
                <p className="text-sm font-medium text-zinc-100">{p.name}</p>
                <p className="text-xs text-zinc-500">updated {p.updated}</p>
              </div>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Canvas — AI Brain (force-graph view of memory clusters and files)
// ─────────────────────────────────────────────────────────────────────────

interface BrainSelection {
  /** What was clicked — a cluster overview node or a file memory node */
  kind: "cluster" | "file";
  cluster: MemoryCluster;
  file?: MemoryFile;
  /** Click pixel position in the chart container's coord space */
  x: number;
  y: number;
}

function AIBrain() {
  // Drill-state: when null, show all clusters; when set, show that
  // cluster's individual file memories. Mouse-wheel zoom still works
  // freely inside either view (ECharts roam: true).
  const [activeCluster, setActiveCluster] = useState<string | null>(null);
  const [selection, setSelection] = useState<BrainSelection | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const filesByCluster = useMemo(() => {
    const m = new Map<string, MemoryFile[]>();
    for (const f of MEMORY_FILES) {
      if (!m.has(f.cluster)) m.set(f.cluster, []);
      m.get(f.cluster)!.push(f);
    }
    return m;
  }, []);

  // Build the ECharts option for the current view.
  const option = useMemo(() => {
    if (activeCluster === null) {
      // Overview: each cluster is one fat node, sized by # of files.
      // Loosely connect adjacent clusters so the force layout spreads
      // them in a brain-like blob.
      const nodes = CLUSTERS.map((c) => {
        const count = filesByCluster.get(c.id)?.length ?? 0;
        return {
          id: c.id,
          name: c.label,
          symbolSize: 36 + count * 6,
          itemStyle: { color: c.color, borderColor: "#fff", borderWidth: 1 },
          label: {
            show: true,
            position: "right",
            color: "#e4e4e7",
            fontSize: 12,
            fontWeight: 600,
          },
          // payload for click handler
          _kind: "cluster",
          _clusterId: c.id,
        } as const;
      });

      // Soft ring connectivity so layout doesn't shoot clusters apart.
      const links = CLUSTERS.map((c, i) => ({
        source: c.id,
        target: CLUSTERS[(i + 1) % CLUSTERS.length]!.id,
        lineStyle: { opacity: 0.15, width: 1 },
      }));

      return {
        backgroundColor: "transparent",
        animation: true,
        animationDuration: 600,
        tooltip: { show: false },
        series: [
          {
            type: "graph",
            layout: "force",
            roam: true,
            draggable: true,
            zoom: 1,
            force: {
              repulsion: 320,
              edgeLength: 140,
              gravity: 0.05,
              friction: 0.5,
            },
            data: nodes,
            links,
            lineStyle: { color: "source", curveness: 0.15 },
            emphasis: {
              focus: "adjacency",
              scale: 1.05,
              lineStyle: { width: 3 },
            },
          },
        ],
      };
    }

    // Drill-in view: chosen cluster at center, its files as satellites.
    const cluster = CLUSTERS.find((c) => c.id === activeCluster)!;
    const files = filesByCluster.get(cluster.id) ?? [];

    const center = {
      id: cluster.id,
      name: cluster.label,
      symbolSize: 70,
      x: 0,
      y: 0,
      fixed: true,
      itemStyle: { color: cluster.color, borderColor: "#fff", borderWidth: 2 },
      label: {
        show: true,
        color: "#fff",
        fontSize: 13,
        fontWeight: 700,
      },
      _kind: "cluster" as const,
      _clusterId: cluster.id,
    };

    const fileNodes = files.map((f) => ({
      id: f.id,
      name: f.label,
      symbolSize: 18 + f.weight,
      itemStyle: {
        color: cluster.color + "cc",
        borderColor: cluster.color,
        borderWidth: 1,
      },
      label: {
        show: true,
        position: "right",
        color: "#d4d4d8",
        fontSize: 11,
        formatter: (p: { name: string }) =>
          p.name.length > 22 ? p.name.slice(0, 21) + "…" : p.name,
      },
      _kind: "file" as const,
      _fileId: f.id,
      _clusterId: cluster.id,
    }));

    const links = files.map((f) => ({
      source: cluster.id,
      target: f.id,
      lineStyle: { color: cluster.color, opacity: 0.45, width: 1 },
    }));

    return {
      backgroundColor: "transparent",
      animation: true,
      animationDuration: 600,
      animationDurationUpdate: 600,
      tooltip: { show: false },
      series: [
        {
          type: "graph",
          layout: "force",
          roam: true,
          draggable: true,
          zoom: 1,
          force: {
            repulsion: 220,
            edgeLength: 110,
            gravity: 0.1,
            friction: 0.5,
          },
          data: [center, ...fileNodes],
          links,
          lineStyle: { curveness: 0.1 },
          emphasis: {
            focus: "adjacency",
            scale: 1.1,
            lineStyle: { width: 3 },
          },
        },
      ],
    };
  }, [activeCluster, filesByCluster]);

  // ECharts click handler — dispatches based on whether the clicked node
  // is a cluster (drill in) or a file (show memory popover).
  const handleEvents = useMemo(
    () => ({
      click: (params: {
        dataType?: string;
        data?: {
          _kind?: "cluster" | "file";
          _clusterId?: string;
          _fileId?: string;
        };
        event?: { event?: { clientX: number; clientY: number } };
      }) => {
        if (params.dataType !== "node" || !params.data?._kind) return;
        const rect = containerRef.current?.getBoundingClientRect();
        const px = (params.event?.event?.clientX ?? 0) - (rect?.left ?? 0);
        const py = (params.event?.event?.clientY ?? 0) - (rect?.top ?? 0);

        const cluster = CLUSTERS.find(
          (c) => c.id === params.data!._clusterId,
        )!;

        if (params.data._kind === "cluster") {
          // Overview cluster click → drill in. Don't open popover yet —
          // user can re-click the center cluster to see its summary.
          if (activeCluster === null) {
            setActiveCluster(cluster.id);
            setSelection(null);
            return;
          }
          // Already drilled-in; clicking the center → cluster summary popover.
          setSelection({ kind: "cluster", cluster, x: px, y: py });
          return;
        }

        const file = MEMORY_FILES.find((f) => f.id === params.data!._fileId);
        if (!file) return;
        setSelection({ kind: "file", cluster, file, x: px, y: py });
      },
    }),
    [activeCluster],
  );

  const closePopover = () => setSelection(null);

  const goBack = () => {
    setActiveCluster(null);
    setSelection(null);
  };

  return (
    <div className="flex h-full flex-col bg-zinc-950" ref={containerRef}>
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-zinc-800 px-4 py-2">
        {activeCluster !== null && (
          <Action
            variant="ghost"
            size="xs"
            icon="arrow-left"
            onClick={goBack}
          />
        )}
        <h3 className="text-sm font-medium text-zinc-200">
          AI Brain
          {activeCluster !== null && (
            <span className="text-zinc-500">
              {" "}
              ·{" "}
              {CLUSTERS.find((c) => c.id === activeCluster)?.label ?? ""}
            </span>
          )}
        </h3>
        <Badge color="zinc" size="sm">
          {activeCluster === null
            ? `${CLUSTERS.length} clusters`
            : `${filesByCluster.get(activeCluster)?.length ?? 0} memories`}
        </Badge>
        <div className="ml-auto flex items-center gap-1 text-[10px] text-zinc-500">
          <span>scroll to zoom · drag to pan</span>
        </div>
      </div>

      {/* Graph — cast to ECharts' broad option type; the typed option
          builder isn't worth the ceremony for a demo. We rely on the
          option's `backgroundColor: "transparent"` (let the parent's
          bg-zinc-950 show through) instead of a named theme — the dark
          theme isn't registered in registerAll, only via the optional
          registerBuiltinThemes() call. */}
      <div className="relative flex-1">
        <EChart
          option={option as Parameters<typeof EChart>[0]["option"]}
          style={{ height: "100%", width: "100%" }}
          onEvents={handleEvents as Parameters<typeof EChart>[0]["onEvents"]}
        />

        {/* Click-anywhere-else overlay to dismiss popover */}
        {selection && (
          <div
            className="absolute inset-0"
            onClick={closePopover}
            aria-hidden
          />
        )}

        {/* Memory popover */}
        {selection && (
          <MemoryPopover selection={selection} onClose={closePopover} />
        )}
      </div>
    </div>
  );
}

function MemoryPopover({
  selection,
  onClose,
}: {
  selection: BrainSelection;
  onClose: () => void;
}) {
  // Position the popover near the click; clamp inside the container.
  const style: React.CSSProperties = {
    left: Math.max(12, Math.min(selection.x + 16, 9999)),
    top: Math.max(12, selection.y - 12),
    maxWidth: 320,
  };

  if (selection.kind === "cluster") {
    const c = selection.cluster;
    return (
      <div
        className="pointer-events-auto absolute z-10"
        style={style}
        onClick={(e) => e.stopPropagation()}
      >
        <Card
          variant="elevated"
          padding="md"
          className="border border-zinc-700 bg-zinc-900 shadow-2xl"
        >
          <div className="flex items-start gap-2">
            <span
              className="mt-1 inline-block h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ background: c.color }}
            />
            <div className="flex-1">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                Cluster
              </p>
              <p className="text-sm font-semibold text-zinc-100">{c.label}</p>
              <p className="mt-2 text-xs leading-relaxed text-zinc-300">
                {c.summary}
              </p>
            </div>
            <Action
              variant="ghost"
              size="xs"
              icon="x"
              onClick={onClose}
              aria-label="Close"
            />
          </div>
        </Card>
      </div>
    );
  }

  const f = selection.file!;
  const c = selection.cluster;
  return (
    <div
      className="pointer-events-auto absolute z-10"
      style={style}
      onClick={(e) => e.stopPropagation()}
    >
      <Card
        variant="elevated"
        padding="md"
        className="border border-zinc-700 bg-zinc-900 shadow-2xl"
      >
        <div className="flex items-start gap-2">
          <span
            className="mt-1 inline-block h-2.5 w-2.5 shrink-0 rounded-full"
            style={{ background: c.color }}
          />
          <div className="flex-1">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
              {c.label} · memory
            </p>
            <p className="text-sm font-semibold text-zinc-100">{f.label}</p>
            <p className="mt-2 text-xs leading-relaxed text-zinc-300">
              {f.body}
            </p>
            <div className="mt-3 flex items-center gap-2 text-[10px] text-zinc-500">
              <Badge color="zinc" size="sm">
                {f.source}
              </Badge>
              <span>saved {f.savedAt}</span>
              <span>· weight {f.weight}</span>
            </div>
          </div>
          <Action
            variant="ghost"
            size="xs"
            icon="x"
            onClick={onClose}
            aria-label="Close"
          />
        </div>
      </Card>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Chat panel
// ─────────────────────────────────────────────────────────────────────────

function ChatPanel({
  messages,
  onSend,
  onShowCanvas,
}: {
  messages: ChatMessage[];
  onSend: (text: string) => void;
  onShowCanvas: () => void;
}) {
  const [draft, setDraft] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages.length]);

  const submit = () => {
    const text = draft.trim();
    if (!text) return;
    onSend(text);
    setDraft("");
  };

  return (
    <div className="flex h-full flex-col bg-zinc-950">
      <div className="flex items-center gap-2 border-b border-zinc-800 px-4 py-3">
        <Avatar fallback="AI" size="sm" />
        <div className="flex-1">
          <p className="text-sm font-medium text-zinc-100">AI assistant</p>
          <p className="text-[10px] text-zinc-500">
            generates renders into the canvas
          </p>
        </div>
        <Action
          variant="ghost"
          size="xs"
          icon="layout-grid"
          onClick={onShowCanvas}
          aria-label="Open canvas"
        />
      </div>

      <div ref={scrollRef} className="flex-1 space-y-3 overflow-auto p-4">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex gap-2 ${m.role === "user" ? "flex-row-reverse" : ""}`}
          >
            <Avatar fallback={m.role === "user" ? "You" : "AI"} size="sm" />
            <div
              className={`max-w-[260px] rounded-2xl px-3 py-2 text-sm ${
                m.role === "user"
                  ? "bg-blue-600 text-white"
                  : "bg-zinc-800 text-zinc-100"
              }`}
            >
              <div className="leading-relaxed">{m.content}</div>
              <div
                className={`mt-1 text-[10px] ${
                  m.role === "user" ? "text-blue-200" : "text-zinc-500"
                }`}
              >
                {formatTime(m.timestamp)}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick actions strip — also push the canvas open */}
      <div className="flex flex-wrap gap-1 border-t border-zinc-800 px-3 py-2">
        <Action variant="ghost" size="xs" onClick={onShowCanvas}>
          Render mockup
        </Action>
        <Action variant="ghost" size="xs" onClick={onShowCanvas}>
          Suggest layout
        </Action>
        <Action variant="ghost" size="xs">
          Refine copy
        </Action>
      </div>

      <div className="flex items-center gap-2 border-t border-zinc-800 p-3">
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              submit();
            }
          }}
          placeholder="Ask the AI to update the canvas…"
          className="flex-1"
        />
        <Action onClick={submit} icon="send" size="sm" color="blue" />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Custom triggers — chunky vertical bars instead of the default chevron
// ─────────────────────────────────────────────────────────────────────────

function FlyoutTriggerBar({ label }: { label: string }) {
  const { toggle, orientation } = useAccordionSection();
  if (orientation !== "horizontal") return null;

  // Subtle full-height bar: hairline divider on the left edge, rotated
  // label centered along the strip. Background, border, and text all
  // brighten gently on hover so the bar reads as interactive without
  // shouting at idle.
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={label}
      title={label}
      className="group relative flex h-full w-6 shrink-0 cursor-pointer items-center justify-center border-l border-zinc-800/60 bg-transparent text-zinc-600 transition-colors hover:border-zinc-700 hover:bg-zinc-900/60 hover:text-zinc-200"
    >
      <span className="rotate-180 text-[10px] font-medium uppercase tracking-[0.25em] opacity-70 transition-opacity group-hover:opacity-100 [writing-mode:vertical-rl]">
        {label}
      </span>
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Right-anchored flyout
// ─────────────────────────────────────────────────────────────────────────

function RightFlyout({
  open,
  setOpen,
  messages,
  onSendMessage,
}: {
  open: string[];
  setOpen: (next: string[]) => void;
  messages: ChatMessage[];
  onSendMessage: (text: string) => void;
}) {
  const showCanvas = () => {
    if (!open.includes("canvas")) setOpen([...open, "canvas"]);
  };

  return (
    <div
      data-react-fancy-ai-flyout=""
      className="pointer-events-auto fixed right-0 top-0 z-40 flex h-full"
      style={{
        boxShadow: open.length > 0 ? "-8px 0 24px rgba(0,0,0,.35)" : undefined,
      }}
    >
      <AccordionPanel
        orientation="horizontal"
        value={open}
        onValueChange={setOpen}
        className="h-full"
      >
        {/* Canvas section — opens to the LEFT of chat */}
        <AccordionPanel.Section
          id="canvas"
          unstyled
          className="items-stretch"
          openClassName="w-[min(720px,60vw)]"
        >
          <AccordionPanel.Content unstyled className="h-full w-full">
            <AIBrain />
          </AccordionPanel.Content>
          <AccordionPanel.Trigger>
            <FlyoutTriggerBar label="Canvas" />
          </AccordionPanel.Trigger>
        </AccordionPanel.Section>

        {/* Chat section — sits on the right edge */}
        <AccordionPanel.Section
          id="chat"
          unstyled
          className="items-stretch"
          openClassName="w-[380px]"
        >
          <AccordionPanel.Content unstyled className="h-full w-full">
            <ChatPanel
              messages={messages}
              onSend={onSendMessage}
              onShowCanvas={showCanvas}
            />
          </AccordionPanel.Content>
          <AccordionPanel.Trigger>
            <FlyoutTriggerBar label="Chat" />
          </AccordionPanel.Trigger>
        </AccordionPanel.Section>
      </AccordionPanel>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────────────

export function AICanvasChatDemo() {
  const [openSections, setOpenSections] = useState<string[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>(SEED_MESSAGES);

  const handleSend = (text: string) => {
    const userMsg: ChatMessage = {
      id: `m-${Date.now()}`,
      role: "user",
      content: text,
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, userMsg]);

    // Mock AI reply.
    window.setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          id: `m-${Date.now() + 1}`,
          role: "assistant",
          content:
            "Pushed an updated render to the canvas — open it on the left when you're ready.",
          timestamp: Date.now() + 1,
        },
      ]);
      // Auto-pop the canvas section so the user can see what was generated.
      setOpenSections((prev) =>
        prev.includes("canvas") ? prev : [...prev, "canvas"],
      );
    }, 700);
  };

  const askAI = () => {
    setOpenSections((prev) =>
      prev.includes("chat") ? prev : [...prev, "chat"],
    );
  };

  return (
    <div className="-m-6 relative flex h-[calc(100vh-3rem)] overflow-hidden bg-zinc-950 text-zinc-100">
      <ProjectWorkspace onAskAI={askAI} />
      <RightFlyout
        open={openSections}
        setOpen={setOpenSections}
        messages={messages}
        onSendMessage={handleSend}
      />
    </div>
  );
}
