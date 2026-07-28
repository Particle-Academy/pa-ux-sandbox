/**
 * Per-component live mini-previews used in the package detail grid.
 * Keyed by `${packageSlug}/${componentSlug}`. Each entry returns a
 * small React node sized to fit a 160-ish-pixel card body.
 *
 * Goal: every component card on /packages/{slug} shows the actual
 * component (or a faithful visual stub when stateful/complex) — never
 * just text-only pills.
 */
import { useState, type ComponentType, type ReactNode } from "react";
// The listing page renders these tiles directly, while the full demos live in
// a client-only chunk — so the stylesheet has to be imported here too or the
// grid shows unstyled git surfaces. Bundlers dedupe the second import.
import "@particle-academy/fancy-git-ui/styles.css";
// react-fancy exports a StickyNote too — a decorative note primitive, unrelated
// to the whiteboard's board item. Aliased rather than renamed so each tile
// still shows the component its own package ships.
import { FancyDiff } from "@particle-academy/fancy-diff";
import { AgentCursor, ShareControls } from "@particle-academy/agent-integrations";
import { MotionStage, TimelineDock } from "@particle-academy/fancy-motion/react";
import { Screen, ScreenSystem } from "@particle-academy/fancy-screens";
// A VENDORED block, not an npm package — its source lives in this app, which is
// exactly why these tiles can render the real thing.
import { FeatureGate, PlanFeaturesEditor, PricingTable } from "../../components/fancy/catalog-fms";
import { clientOnly } from "../../lib/clientOnly";
import {
    Board,
    Connector,
    CursorLayer,
    Drawing,
    Shape as BoardShape,
    StickyNote as BoardStickyNote,
} from "@particle-academy/fancy-whiteboard";
import {
    BranchPicker,
    CommitComposer,
    CommitHistory,
    CreateReviewForm,
    DiffViewer,
    RepositoryBrowser,
    ReviewList,
    WorkingTree,
} from "@particle-academy/fancy-git-ui";

/**
 * Tiles whose component needs a browser.
 *
 * The packages page is server-rendered through Inertia's synchronous
 * `renderToString`, and xterm / CodeMirror / React Flow all touch `window` at
 * import time — so importing them here would crash the SSR render of the whole
 * page. That, not "a tile has no data", is why these were drawings.
 *
 * `clientOnly` defers the import into one browser-only chunk; each drawing
 * below survives as the SSR fallback, so the server and the first client paint
 * agree and the real component swaps in after hydration.
 */
type HeavyTile = keyof typeof import("./HeavyPreviews");

const heavy = (name: HeavyTile, Fallback: PreviewFn): PreviewFn => {
    const Deferred = clientOnly<Record<string, never>>(
        () => import("./HeavyPreviews").then((m) => ({ default: m[name] })),
        () => <>{Fallback()}</>,
    );

    return () => <Deferred />;
};

/** A two-keyframe timeline — the shape TimelineDoc actually declares. */
const PREVIEW_TIMELINE = {
    id: "preview",
    axis: "y" as const,
    frames: 3,
    keyframes: [
        { id: "k1", at: 0, mode: "snap" as const, snapshot: {} },
        { id: "k2", at: 0.6, mode: "scroll" as const, snapshot: {} },
    ],
};

/** A small real patch, so the diff tile parses one instead of drawing one. */
const PREVIEW_UNIFIED_DIFF = `--- a/src/auth.ts
+++ b/src/auth.ts
@@ -12,3 +12,4 @@
 export function verify(token: string) {
-  return decode(token);
+  if (!token) return null;
+  return decode(token);
 }
`;

/** A hand-drawn stroke, as the shape <Drawing> actually stores. */
const PREVIEW_STROKES = [
    {
        id: "s1",
        color: "#8b5cf6",
        size: 3,
        points: Array.from({ length: 40 }, (_, i) => ({
            x: 20 + i * 7,
            y: 64 + Math.sin(i / 3.2) * 26,
        })),
    },
];

import {
    GIT_BRANCHES,
    GIT_COMMITS,
    GIT_DIFF,
    GIT_REVIEWS,
    GIT_STATUS,
    GIT_TREE,
} from "./gitFixtures";
import {
    Button,
    Avatar,
    Badge,
    Breadcrumbs,
    Calendar,
    Callout,
    Card,
    Heading,
    Marquee,
    Pillbox,
    StickyNote,
    Switch,
    Tabs,
    Text,
    TimeGrid,
    Timeline,
    Tooltip,
    MediaViewer,
    ImageViewer,
    VideoViewer,
    AudioViewer,
    PdfViewer,
    ColorPicker,
    ContextMenu,
    ContentRenderer,
    Drawer,
    Emoji,
    FauxClient,
    Kanban,
    MoodMeter,
    OtpInput,
    Pagination,
    Profile,
    Progress,
    Skeleton,
    TimePicker,
} from "@particle-academy/react-fancy";
import { FileViewer } from "@particle-academy/fancy-code";
import { EChart } from "@particle-academy/fancy-echarts";
import { ArtBoard, ArtPiece } from "@particle-academy/fancy-artboard";
import "@particle-academy/fancy-artboard/styles.css";
import { Slide as FsSlide, defaultTheme as fsDefaultTheme } from "@particle-academy/fancy-slides";
import "@particle-academy/fancy-slides/styles.css";
import { DownlineTree, CommissionStatement, RankProgress } from "@particle-academy/fancy-mlm-ui";
import "@particle-academy/fancy-mlm-ui/styles.css";
import {
    RobotsEditor,
    SecurityTxtEditor,
    LlmsTxtEditor,
    HumansTxtEditor,
    SitemapEditor,
    AgentsEditor,
    XFilePreview,
    XFilesManager,
} from "@particle-academy/fancy-x-files-ui";
import { CmsPage, CmsRegion } from "@particle-academy/fancy-cms-ui";
import {
    CANONICAL_SLIDE,
    CANONICAL_DECK,
    CANONICAL_TEXT_SLIDE,
    CANONICAL_IMAGE_SLIDE,
    CANONICAL_SHAPES_SLIDE,
    CANONICAL_HIGHLIGHTED_TOKENS,
    HIGHLIGHT_KIND_COLOR,
    PPTX_WRITER_COVERAGE,
    PPTX_READER_ROUNDTRIP,
    CMS_DEMO_DOC,
    CMS_HERO_ID,
} from "./showcase-fixtures";
import {
    Bell,
    Check,
    ChevronRight,
    ChevronDown,
    Cloud,
    Code,
    File as FileIcon,
    Folder,
    Heart,
    Home,
    Image as ImageIcon,
    Layers,
    LayoutGrid,
    Menu as MenuIcon,
    Moon,
    Music,
    Search,
    MapPin,
    Settings,
    Sparkles,
    Star,
    Sun,
    User,
    X,
    Zap,
} from "lucide-react";

type PreviewFn = () => ReactNode;

// Sample media for the viewer previews — local assets + a tiny data-URI so the
// cards render self-contained (no external network).
const SAMPLE_IMG = "/showcase-shots/fancy-echarts.png";
const SAMPLE_POSTER = "/showcase-shots/fancy-slides.png";
const SAMPLE_PDF = "/showcase-assets/file-viewer/sample.pdf";
const SILENT_WAV =
    "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=";
const SAMPLE_TSX = `export function Button({ label }: { label: string }) {
  return <button className="btn">{label}</button>;
}
`;

export function getComponentPreview(pkg: string, slug: string): PreviewFn | null {
    return PREVIEWS[`${pkg}/${slug}`] ?? null;
}


// ─── react-fancy ──────────────────────────────────────────────────────────

const Pill = ({ children, className = "" }: { children: ReactNode; className?: string }) => (
    <span className={`inline-flex items-center rounded-md border border-zinc-200 bg-white px-2 py-0.5 text-xs text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 ${className}`}>
        {children}
    </span>
);

const MLM_TIER_COLOR: Record<string, "orange" | "zinc" | "amber" | "violet" | "slate"> = {
    bronze: "orange", silver: "zinc", gold: "amber", diamond: "violet",
};
const mlmTierColor = (t?: string) => (t && MLM_TIER_COLOR[t]) || "slate";

// ─── fancy-x-files-ui seed models (small but real; the editors are controlled) ──
const XF_ROBOTS = {
    groups: [{ userAgents: ["*"], allow: ["/"], disallow: ["/admin", "/api"] }],
    sitemaps: ["https://acme.dev/sitemap.xml"],
    protectedPaths: ["/admin"],
};
const XF_SECURITY = {
    contact: ["mailto:security@acme.dev"],
    expires: "2027-01-01T00:00:00Z",
    policy: "https://acme.dev/security-policy",
};
const XF_LLMS = {
    title: "Acme Docs",
    summary: "Everything an LLM needs to use Acme.",
    sections: [{ name: "Guides", links: [{ title: "Quickstart", url: "https://acme.dev/quickstart" }] }],
};
const XF_HUMANS = {
    team: [{ role: "Developer", name: "Ada Lovelace", contact: "@ada" }],
    thanks: ["react-fancy"],
};
const XF_SITEMAP = {
    urls: [
        { loc: "https://acme.dev/", changefreq: "daily" as const, priority: 1.0 },
        { loc: "https://acme.dev/about", changefreq: "monthly" as const },
    ],
};
const XF_AGENTS = {
    agents: [
        { id: "claude", name: "Claude", policy: "allow" as const, scope: "read + summarize" },
        { id: "scraper", policy: "deny" as const },
    ],
    contact: "mailto:ops@acme.dev",
};

// The editors are taller than a card; scale + top-align so the head shows.
const XFBox = ({ children }: { children: ReactNode }) => (
    <div className="w-full self-start overflow-hidden text-[11px]">
        <div className="origin-top-left scale-[0.72]" style={{ width: "139%" }}>
            {children}
        </div>
    </div>
);

// A rendered CMS page is bigger than a card; scale + top-align like XFBox.
const CmsBox = ({ children }: { children: ReactNode }) => (
    <div className="h-32 w-full max-w-[20rem] self-start overflow-hidden rounded-md border border-zinc-200 dark:border-zinc-700">
        <div className="origin-top-left scale-[0.55]" style={{ width: "182%" }}>
            {children}
        </div>
    </div>
);

const PREVIEWS: Record<string, PreviewFn> = {
    // ─── fancy-x-files-ui ────────────────────────────────────────────────────
    "fancy-x-files-ui/robots-editor": () => (
        <XFBox><RobotsEditor value={XF_ROBOTS} onChange={() => {}} hideIssues /></XFBox>
    ),
    "fancy-x-files-ui/security-txt-editor": () => (
        <XFBox><SecurityTxtEditor value={XF_SECURITY} onChange={() => {}} hideIssues /></XFBox>
    ),
    "fancy-x-files-ui/llms-txt-editor": () => (
        <XFBox><LlmsTxtEditor value={XF_LLMS} onChange={() => {}} hideIssues /></XFBox>
    ),
    "fancy-x-files-ui/humans-txt-editor": () => (
        <XFBox><HumansTxtEditor value={XF_HUMANS} onChange={() => {}} hideIssues /></XFBox>
    ),
    "fancy-x-files-ui/sitemap-editor": () => (
        <XFBox><SitemapEditor value={XF_SITEMAP} onChange={() => {}} hideIssues /></XFBox>
    ),
    "fancy-x-files-ui/agents-editor": () => (
        <XFBox><AgentsEditor value={XF_AGENTS} onChange={() => {}} hideIssues /></XFBox>
    ),
    "fancy-x-files-ui/x-file-preview": () => (
        <XFBox><XFilePreview kind="robots" model={XF_ROBOTS} /></XFBox>
    ),
    "fancy-x-files-ui/x-files-manager": () => (
        <XFBox>
            <XFilesManager
                value={{ robots: XF_ROBOTS, sitemap: XF_SITEMAP, agents: XF_AGENTS }}
                onChange={() => {}}
                defaultKind="robots"
            />
        </XFBox>
    ),

    // ─── fancy-mlm-ui ────────────────────────────────────────────────────────
    "fancy-mlm-ui/downline-tree": () => (
        <div className="w-full max-w-[19rem] scale-90 text-left">
            <DownlineTree
                value={[
                    { id: "you", label: "You", tier: "gold" },
                    { id: "a", sponsorId: "you", label: "Ada", tier: "silver" },
                    { id: "b", sponsorId: "you", label: "Bo", tier: "bronze" },
                    { id: "a1", sponsorId: "a", label: "Cy", tier: "bronze" },
                    { id: "a2", sponsorId: "a", label: "Di", tier: "bronze", active: false },
                ]}
                tierColor={mlmTierColor}
            />
        </div>
    ),
    "fancy-mlm-ui/commission-statement": () => (
        <div className="w-full max-w-[19rem] scale-90">
            <CommissionStatement
                rows={[
                    { id: "1", level: 1, tier: "gold", amount: 150, status: "paid", recipientLabel: "L1 · gold" },
                    { id: "2", level: 2, tier: "silver", amount: 62.5, status: "paid", recipientLabel: "L2 · silver" },
                    { id: "3", level: 3, tier: "bronze", amount: 25, status: "pending", recipientLabel: "L3 · bronze" },
                ]}
                formatAmount={(n) => `${Math.round(n)} pts`}
            />
        </div>
    ),
    "fancy-mlm-ui/rank-progress": () => (
        <div className="w-full max-w-[16rem]">
            <RankProgress tier="gold" nextTier="diamond" value={7} target={12} unit="team members" />
        </div>
    ),

    // ─── catalog-fms (block) ─────────────────────────────────────────────────
    "catalog-fms/pricing-table": () => (
        <div className="w-full max-w-[20rem] text-[10px]">
            <PricingTable
                plans={[
                    { id: "starter", name: "Starter", prices: [{ id: "p1", amount: 900, currency: "usd", interval: "month" }], highlights: ["1 seat"] },
                    { id: "pro", name: "Pro", recommended: true, badge: "Most popular", prices: [{ id: "p2", amount: 2900, currency: "usd", interval: "month" }], highlights: ["5 seats"] },
                ]}
                defaultInterval="month"
            />
        </div>
    ),
    "catalog-fms/feature-matrix": () => (
        <div className="w-full max-w-[18rem] overflow-hidden rounded-md border border-zinc-200 text-[10px] dark:border-zinc-700">
            <div className="grid grid-cols-4 border-b border-zinc-200 bg-zinc-50 px-2 py-1 font-medium text-zinc-500 dark:border-zinc-700 dark:bg-zinc-800/50">
                <span>Feature</span><span className="text-center">Free</span><span className="text-center">Pro</span><span className="text-center">Team</span>
            </div>
            {[
                ["Projects", "1", "10", "∞"],
                ["SSO", "—", "—", "✓"],
                ["Audit log", "—", "✓", "✓"],
            ].map((r) => (
                <div key={r[0]} className="grid grid-cols-4 border-b border-zinc-100 px-2 py-1 last:border-0 dark:border-zinc-800">
                    <span className="text-zinc-600 dark:text-zinc-300">{r[0]}</span>
                    {r.slice(1).map((c, i) => (
                        <span key={i} className="text-center text-zinc-500">
                            {c === "✓" ? <Check size={11} className="mx-auto text-green-500" /> : c}
                        </span>
                    ))}
                </div>
            ))}
        </div>
    ),
    "catalog-fms/feature-gate": () => (
        <div className="w-full max-w-[20rem] text-[11px]">
            <FeatureGate
                feature="exports"
                featureName="Exports"
                entitlements={{ planId: "starter", features: { exports: { allowed: false } } }}
            >
                <div className="rounded border border-zinc-200 p-2 dark:border-zinc-700">Gated content</div>
            </FeatureGate>
        </div>
    ),
    "catalog-fms/plan-features-editor": () => (
        <div className="w-full max-w-[20rem] text-[10px]">
            <PlanFeaturesEditor
                features={[
                    { key: "seats", name: "Seats", type: "resource", unit: "seats" },
                    { key: "exports", name: "Exports", type: "boolean" },
                ]}
                value={{ seats: { limit: 5 }, exports: { enabled: true } }}
                onChange={() => {}}
            />
        </div>
    ),

    // Stays a drawing, on evidence: xterm leaks its char-measure row at this
    // size and letter-spaces every glyph once that is hidden. See HeavyPreviews.
    "fancy-term/terminal": () => (
        <div className="h-32 w-full max-w-[20rem] overflow-hidden rounded-md border border-zinc-800 bg-zinc-950 font-mono text-[9px] leading-relaxed text-zinc-300">
            <div className="flex items-center gap-1.5 border-b border-zinc-800 bg-zinc-900 px-2 py-1 text-[8px]">
                <span className="rounded bg-zinc-800 px-1.5 py-0.5 text-violet-300">⚡ PowerShell ▾</span>
            </div>
            <div className="space-y-0.5 p-2">
                <div className="text-violet-300">Fancy Term <span className="text-zinc-500">— a Human+ terminal.</span></div>
                <div className="text-zinc-400">PS C:\fancy&gt; <span className="text-emerald-400">npm run build</span></div>
                <div className="text-emerald-400">✓ built in 1.2s</div>
                <div className="text-zinc-400">PS C:\fancy&gt; <span className="animate-pulse text-zinc-200">▌</span></div>
            </div>
        </div>
    ),
    // fancy-tui has NO entries here on purpose. Its components render to a
    // terminal, so `PackagesController` attaches a captured ANSI frame to every
    // one of them and `Show.tsx` prefers `frame` over a preview — making any
    // entry here unreachable. A drawn `fancy-tui-provider` tile used to sit at
    // this spot; it had been dead since the frames landed.


    // ─── react-fancy: media viewers + fancy-code file viewer ──────────────────
    "react-fancy/media-viewer": () => (
        <div className="h-36 w-full max-w-[20rem] overflow-hidden rounded-md border border-zinc-200 dark:border-zinc-800">
            <MediaViewer src={SAMPLE_IMG} alt="Auto-detected from src/mime" style={{ height: "100%" }} />
        </div>
    ),
    "react-fancy/image-viewer": () => (
        <div className="h-36 w-full max-w-[20rem] overflow-hidden rounded-md border border-zinc-200 dark:border-zinc-800">
            <ImageViewer src={SAMPLE_IMG} alt="Zoom + pan" fit="cover" style={{ height: "100%" }} />
        </div>
    ),
    "react-fancy/video-viewer": () => (
        <div className="h-36 w-full max-w-[20rem] overflow-hidden rounded-md border border-zinc-200 dark:border-zinc-800">
            <VideoViewer src="" poster={SAMPLE_POSTER} muted controls fit="cover" />
        </div>
    ),
    "react-fancy/audio-viewer": () => (
        <div className="w-full max-w-[20rem]">
            <AudioViewer src={SILENT_WAV} title="podcast-ep-12.mp3" />
        </div>
    ),
    "react-fancy/pdf-viewer": () => (
        <div className="h-36 w-full max-w-[20rem] overflow-hidden rounded-md border border-zinc-200 dark:border-zinc-800">
            <PdfViewer src={SAMPLE_PDF} title="sample.pdf" />
        </div>
    ),
    "fancy-code/file-viewer": () => (
        <div className="h-36 w-full max-w-[20rem] overflow-hidden rounded-md border border-zinc-200 dark:border-zinc-800">
            <FileViewer filename="Button.tsx" value={SAMPLE_TSX} readOnly lineNumbers />
        </div>
    ),

    "react-fancy/accordion": () => (
        <div className="w-full max-w-[18rem] space-y-1.5 text-xs">
            <div className="rounded-md border border-zinc-200 dark:border-zinc-800">
                <div className="flex items-center justify-between px-3 py-2 text-zinc-700 dark:text-zinc-200">
                    <span className="font-medium">What is Fancy UI?</span>
                    <ChevronDown size={14} className="text-zinc-400" />
                </div>
                <div className="border-t border-zinc-100 px-3 py-2 text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
                    A constellation of React + PHP primitives.
                </div>
            </div>
            <div className="flex items-center justify-between rounded-md border border-zinc-200 px-3 py-2 text-zinc-700 dark:border-zinc-800 dark:text-zinc-200">
                <span className="font-medium">How do I install?</span>
                <ChevronRight size={14} className="text-zinc-400" />
            </div>
        </div>
    ),

    "react-fancy/accordion-panel": () => (
        <div className="w-full max-w-[18rem] overflow-hidden rounded-md border border-zinc-200 text-xs dark:border-zinc-800">
            <div className="flex items-center justify-between bg-zinc-50 px-3 py-2 font-medium text-zinc-700 dark:bg-zinc-900 dark:text-zinc-200">
                <span>Shipping &amp; returns</span>
                <ChevronDown size={14} className="text-zinc-400" />
            </div>
            <div className="border-t border-zinc-100 px-3 py-2 text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
                Free returns within 30 days. One panel, fully controlled via <code className="rounded bg-zinc-100 px-1 font-mono text-[10px] dark:bg-zinc-800">open</code>.
            </div>
        </div>
    ),

    "react-fancy/sticky-note": () => (
        <div className="flex items-center justify-center gap-3">
            <StickyNote value="Ship the dream ✨" color="yellow" rotate={-4} width={104} editable={false} className="!text-xs" />
            <StickyNote value="Review PR #42" color="violet" rotate={3} width={104} editable={false} className="!text-xs" />
        </div>
    ),

    "react-fancy/faux-client": () => (
        <div className="w-full max-w-[20rem] text-[11px]">
            <FauxClient variant="browser" url="ui.particle.academy/packages" dots>
                <div className="p-3 text-zinc-600 dark:text-zinc-300">The page inside the chrome.</div>
            </FauxClient>
        </div>
    ),

    "react-fancy/time-grid": () => (
        <TimeGrid
            rows={["9a", "11a", "1p", "3p", "5p"]}
            cols={["M", "T", "W", "T", "F"]}
            toneOn="violet"
            cellWidth={20}
            cellHeight={14}
            value={[
                [false, true, false, true, false],
                [true, true, false, false, true],
                [false, false, true, true, false],
                [true, false, true, false, true],
                [false, true, false, true, true],
            ]}
            onChange={() => {}}
        />
    ),

    "react-fancy/button": () => (
        <div className="flex flex-wrap items-center justify-center gap-2">
            <Button color="violet" size="sm">Primary</Button>
            <Button variant="ghost" size="sm">Ghost</Button>
            <Button color="emerald" size="sm" icon="check">Save</Button>
            <Button color="red" variant="ghost" size="sm" icon="trash">Delete</Button>
        </div>
    ),

    "react-fancy/autocomplete": () => (
        <div className="w-full max-w-[18rem]">
            <div className="flex items-center gap-2 rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-xs dark:border-zinc-700 dark:bg-zinc-900">
                <Search size={14} className="text-zinc-400" />
                <span className="text-zinc-700 dark:text-zinc-200">cal</span>
                <span className="ml-0.5 h-3.5 w-px animate-pulse bg-violet-500" />
            </div>
            <ul className="mt-1.5 overflow-hidden rounded-md border border-zinc-200 bg-white text-xs dark:border-zinc-700 dark:bg-zinc-900">
                <li className="bg-violet-50 px-3 py-1.5 text-violet-900 dark:bg-violet-500/15 dark:text-violet-100">Calendar</li>
                <li className="px-3 py-1.5 text-zinc-600 dark:text-zinc-300">Callout</li>
                <li className="px-3 py-1.5 text-zinc-600 dark:text-zinc-300">Card</li>
            </ul>
        </div>
    ),

    "react-fancy/avatar": () => (
        <div className="flex items-center -space-x-2">
            {["RK", "SL", "MC", "AY"].map((f) => (
                <Avatar key={f} fallback={f} size="lg" />
            ))}
            <Avatar fallback="+3" size="lg" />
        </div>
    ),

    "react-fancy/badge": () => (
        <div className="flex flex-wrap items-center justify-center gap-1.5">
            <Badge color="violet">new</Badge>
            <Badge color="emerald">live</Badge>
            <Badge color="amber">beta</Badge>
            <Badge color="red">urgent</Badge>
            <Badge color="zinc">draft</Badge>
            <Badge color="indigo">v0.4</Badge>
        </div>
    ),

    "react-fancy/brand": () => (
        <div className="flex items-center gap-2.5">
            <div className="grid size-9 place-items-center rounded-lg bg-gradient-to-br from-violet-500 to-sky-500 text-white shadow-sm">
                <Sparkles size={18} />
            </div>
            <div className="text-left">
                <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Particle Academy</div>
                <div className="text-xs text-zinc-500">fancy ui kit</div>
            </div>
        </div>
    ),

    "react-fancy/breadcrumbs": () => (
        <div className="text-xs">
            <Breadcrumbs>
                <Breadcrumbs.Item href="#">Settings</Breadcrumbs.Item>
                <Breadcrumbs.Item href="#">Team</Breadcrumbs.Item>
                <Breadcrumbs.Item>Members</Breadcrumbs.Item>
            </Breadcrumbs>
        </div>
    ),

    "react-fancy/calendar": () => {
        const [value, setValue] = useState<Date | null>(new Date());
        return (
            <div className="scale-[0.85]">
                <Calendar value={value} onChange={setValue} />
            </div>
        );
    },

    "react-fancy/callout": () => (
        <div className="w-full max-w-[18rem] space-y-2">
            <Callout color="green">
                <Check size={14} className="mr-1 inline" /> Deploy succeeded
            </Callout>
            <Callout color="amber">
                <Bell size={14} className="mr-1 inline" /> Rate limit at 80%
            </Callout>
        </div>
    ),

    "react-fancy/card": () => (
        <div className="w-full max-w-[18rem]">
            <Card variant="elevated">
                <Card.Header>
                    <Text size="xs" className="!font-semibold !uppercase !tracking-wider !text-zinc-500">Plan</Text>
                </Card.Header>
                <Card.Body>
                    <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Pro</div>
                    <div className="text-xs text-zinc-500">$29/mo</div>
                </Card.Body>
            </Card>
        </div>
    ),

    "react-fancy/carousel": () => (
        <div className="w-full max-w-[18rem]">
            <div className="aspect-[16/9] rounded-md bg-gradient-to-br from-violet-400/40 via-sky-400/30 to-emerald-400/40">
                <div className="grid h-full place-items-center text-white">
                    <div className="text-center">
                        <Layers size={20} className="mx-auto" />
                        <div className="mt-1 text-xs font-medium">Slide 2 of 4</div>
                    </div>
                </div>
            </div>
            <div className="mt-2 flex justify-center gap-1.5">
                {[0, 1, 2, 3].map((i) => (
                    <span key={i} className={`h-1.5 w-4 rounded-full ${i === 1 ? "bg-violet-500" : "bg-zinc-300 dark:bg-zinc-700"}`} />
                ))}
            </div>
        </div>
    ),

    "react-fancy/chart": () => (
        <div className="size-full min-h-[7rem] max-w-[18rem]">
            <EChart
                style={{ width: "100%", height: 120 }}
                option={{
                    grid: { left: 4, right: 4, top: 4, bottom: 4 },
                    xAxis: { type: "category", show: false, data: ["M", "T", "W", "T", "F"] },
                    yAxis: { type: "value", show: false },
                    series: [{
                        type: "line",
                        data: [12, 19, 15, 22, 18],
                        smooth: true,
                        itemStyle: { color: "#8b5cf6" },
                        lineStyle: { color: "#8b5cf6", width: 2 },
                        areaStyle: { color: "rgba(139, 92, 246, 0.15)" },
                        symbol: "circle",
                    }],
                    tooltip: { trigger: "axis", confine: true },
                }}
            />
        </div>
    ),

    "react-fancy/chat-drawer": () => (
        <div className="w-full max-w-[18rem] space-y-1.5">
            <div className="flex justify-start">
                <div className="max-w-[80%] rounded-2xl rounded-bl-sm bg-zinc-100 px-3 py-1.5 text-xs text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
                    Hey — quick question on the new bridge API.
                </div>
            </div>
            <div className="flex justify-end">
                <div className="max-w-[80%] rounded-2xl rounded-br-sm bg-violet-500 px-3 py-1.5 text-xs text-white">
                    Sure. What's the question?
                </div>
            </div>
            <div className="flex justify-start">
                <div className="rounded-2xl bg-zinc-100 px-3 py-1.5 text-xs text-zinc-500 dark:bg-zinc-800">
                    <span className="inline-block size-1.5 animate-pulse rounded-full bg-zinc-400" />
                    <span className="ml-1 inline-block size-1.5 animate-pulse rounded-full bg-zinc-400" style={{ animationDelay: "150ms" }} />
                    <span className="ml-1 inline-block size-1.5 animate-pulse rounded-full bg-zinc-400" style={{ animationDelay: "300ms" }} />
                </div>
            </div>
        </div>
    ),

    "react-fancy/color-picker": () => (
        <ColorPicker defaultValue="#8b5cf6" presets={["#8b5cf6", "#10b981", "#f59e0b", "#ef4444", "#0ea5e9"]} />
    ),

    "react-fancy/command": () => (
        <div className="w-full max-w-[20rem] overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
            <div className="flex items-center gap-2 border-b border-zinc-100 px-3 py-2 dark:border-zinc-800">
                <Search size={14} className="text-zinc-400" />
                <span className="text-xs text-zinc-500">Search…</span>
                <kbd className="ml-auto rounded border border-zinc-300 px-1 font-mono text-[10px] text-zinc-500 dark:border-zinc-700">⌘K</kbd>
            </div>
            <ul className="text-xs">
                <li className="flex items-center gap-2 bg-violet-50 px-3 py-1.5 text-violet-900 dark:bg-violet-500/15 dark:text-violet-100">
                    <FileIcon size={12} /> New file
                </li>
                <li className="flex items-center gap-2 px-3 py-1.5 text-zinc-600 dark:text-zinc-300">
                    <Settings size={12} /> Open settings
                </li>
            </ul>
        </div>
    ),

    "react-fancy/composer": () => (
        <div className="w-full max-w-[18rem] rounded-md border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900">
            <div className="px-3 py-2 text-xs text-zinc-700 dark:text-zinc-200">
                Let&apos;s ship it.<span className="ml-0.5 inline-block h-3 w-px animate-pulse bg-violet-500" />
            </div>
            <div className="flex items-center justify-between border-t border-zinc-100 px-2 py-1 dark:border-zinc-800">
                <div className="flex gap-1 text-zinc-400">
                    <Sparkles size={12} />
                    <ImageIcon size={12} />
                </div>
                <Button color="violet" size="sm">Send</Button>
            </div>
        </div>
    ),

    "react-fancy/content-renderer": () => (
        <div className="w-full max-w-[20rem] text-[11px]">
            <ContentRenderer
                format="markdown"
                value={"### Release notes\n\nReal components, **not** drawings.\n\n- one\n- two"}
            />
        </div>
    ),

    "react-fancy/context-menu": () => (
        <div className="w-full max-w-[20rem] text-[11px]">
            <ContextMenu>
                <ContextMenu.Trigger>
                    <div className="grid h-24 place-items-center rounded-md border border-dashed border-zinc-300 text-zinc-500 dark:border-zinc-700">
                        Right-click me
                    </div>
                </ContextMenu.Trigger>
                <ContextMenu.Item onClick={() => {}}>Copy</ContextMenu.Item>
                <ContextMenu.Item onClick={() => {}}>Paste</ContextMenu.Item>
            </ContextMenu>
        </div>
    ),

    "react-fancy/drawer": () => (
        <div className="relative h-32 w-full max-w-[20rem] overflow-hidden rounded-md border border-zinc-200 bg-zinc-50 text-[11px] dark:border-zinc-800 dark:bg-zinc-900">
            <Drawer open attach="container" onClose={() => {}} side="right" size="sm" backdrop={false}>
                <div className="p-3">
                    <div className="font-semibold">Filters</div>
                    <div className="mt-1 text-zinc-500">Anchored to its container.</div>
                </div>
            </Drawer>
        </div>
    ),
    "react-fancy/dropdown": () => (
        <div className="w-44 overflow-hidden rounded-md border border-zinc-200 bg-white shadow-md dark:border-zinc-700 dark:bg-zinc-900">
            <button className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs text-zinc-700 hover:bg-zinc-50 dark:text-zinc-300 dark:hover:bg-zinc-800">
                <User size={12} /> Profile
            </button>
            <button className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs text-zinc-700 hover:bg-zinc-50 dark:text-zinc-300 dark:hover:bg-zinc-800">
                <Settings size={12} /> Settings
            </button>
            <button className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs text-zinc-700 hover:bg-zinc-50 dark:text-zinc-300 dark:hover:bg-zinc-800">
                <Moon size={12} /> Dark mode
            </button>
        </div>
    ),

    "react-fancy/editor": () => (
        <div className="w-full max-w-[18rem] rounded-md border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900">
            <div className="flex gap-1 border-b border-zinc-100 px-2 py-1 dark:border-zinc-800">
                <button className="rounded px-1.5 py-0.5 text-xs font-bold text-zinc-700 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-800">B</button>
                <button className="rounded px-1.5 py-0.5 text-xs italic text-zinc-700 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-800">I</button>
                <button className="rounded px-1.5 py-0.5 text-xs underline text-zinc-700 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-800">U</button>
            </div>
            <div className="px-3 py-2 text-xs text-zinc-700 dark:text-zinc-200">
                <strong>Bold</strong> and <em>italic</em> text — round-trip safe JSON.
            </div>
        </div>
    ),

    "react-fancy/emoji": () => (
        <div className="flex gap-2">
            {["rocket", "sparkles", "fire", "dart", "purple-heart"].map((name) => (
                <Emoji key={name} name={name} size="xl" />
            ))}
        </div>
    ),

    "react-fancy/emoji-select": () => (
        <div className="w-44 rounded-md border border-zinc-200 bg-white p-2 dark:border-zinc-700 dark:bg-zinc-900">
            <div className="mb-1.5 flex items-center gap-1.5 rounded border border-zinc-200 px-2 py-1 dark:border-zinc-700">
                <Search size={10} className="text-zinc-400" />
                <span className="text-[10px] text-zinc-500">Search emoji…</span>
            </div>
            <div className="grid grid-cols-6 gap-0.5 text-lg">
                {["😀", "😁", "😂", "🤣", "😅", "🥹", "🙂", "🥰", "😎", "🤔", "🙌", "👏"].map((e, i) => (
                    <button key={i} className="rounded p-0.5 hover:bg-zinc-100 dark:hover:bg-zinc-800">{e}</button>
                ))}
            </div>
        </div>
    ),

    "react-fancy/file-upload": () => (
        <div className="grid w-full max-w-[18rem] place-items-center rounded-lg border-2 border-dashed border-zinc-300 bg-zinc-50/50 px-4 py-6 dark:border-zinc-700 dark:bg-zinc-900/40">
            <Cloud size={28} className="text-violet-500" />
            <div className="mt-2 text-xs font-medium text-zinc-700 dark:text-zinc-200">Drop files here</div>
            <div className="text-[10px] text-zinc-500">or click to browse</div>
        </div>
    ),

    "react-fancy/heading": () => (
        <div className="w-full max-w-[18rem] space-y-1 text-left">
            <Heading level={1} size="lg">Display</Heading>
            <Heading level={2} size="md">Section title</Heading>
            <Heading level={3} size="sm">Subsection</Heading>
        </div>
    ),

    "react-fancy/icon": () => (
        <div className="grid grid-cols-6 gap-3 text-zinc-600 dark:text-zinc-300">
            <Home size={18} /><Settings size={18} /><Star size={18} /><Heart size={18} /><Music size={18} /><Zap size={18} />
        </div>
    ),

    "react-fancy/input-tag": () => (
        <div className="w-full max-w-[18rem] rounded-md border border-zinc-200 bg-white px-2 py-1.5 dark:border-zinc-700 dark:bg-zinc-900">
            <div className="flex flex-wrap items-center gap-1">
                <Pill className="!bg-violet-50 !text-violet-700 dark:!bg-violet-500/15 dark:!text-violet-200">agent <X size={10} className="ml-1" /></Pill>
                <Pill className="!bg-violet-50 !text-violet-700 dark:!bg-violet-500/15 dark:!text-violet-200">human+ux <X size={10} className="ml-1" /></Pill>
                <span className="text-xs text-zinc-400">Add…<span className="ml-0.5 inline-block h-3 w-px animate-pulse bg-violet-500" /></span>
            </div>
        </div>
    ),

    "react-fancy/inputs": () => (
        <div className="w-full max-w-[18rem] space-y-2 text-left">
            <div>
                <div className="mb-0.5 text-[10px] font-medium text-zinc-500">Email</div>
                <div className="rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-xs text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200">user@example.com</div>
            </div>
            <div>
                <div className="mb-0.5 text-[10px] font-medium text-zinc-500">Role</div>
                <div className="flex items-center justify-between rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-xs text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200">
                    Admin <ChevronDown size={12} className="text-zinc-400" />
                </div>
            </div>
        </div>
    ),

    "react-fancy/kanban": () => (
        <div className="w-full max-w-[20rem] text-[10px]">
            <Kanban>
                {[
                    { id: "todo", title: "Todo", cards: ["Audit tiles"] },
                    { id: "doing", title: "Doing", cards: ["Ship 0.4"] },
                ].map((col) => (
                    <Kanban.Column key={col.id} id={col.id}>
                        <Kanban.ColumnHandle>
                            <div className="px-2 py-1 text-[9px] font-semibold uppercase tracking-wider text-zinc-500">
                                {col.title}
                            </div>
                        </Kanban.ColumnHandle>
                        {col.cards.map((c) => (
                            <Kanban.Card key={c} id={c}>
                                <div className="rounded border border-zinc-200 bg-white p-1.5 dark:border-zinc-700 dark:bg-zinc-900">
                                    {c}
                                </div>
                            </Kanban.Card>
                        ))}
                    </Kanban.Column>
                ))}
            </Kanban>
        </div>
    ),

    "react-fancy/magic-wand": () => (
        <div className="w-full max-w-[18rem] rounded-md border border-zinc-200 bg-white p-2 dark:border-zinc-700 dark:bg-zinc-900">
            <div className="text-xs text-zinc-700 dark:text-zinc-200">
                <mark className="rounded bg-violet-100 px-0.5 dark:bg-violet-500/30">Selected text</mark> ready to transform.
            </div>
            <div className="mt-2 flex flex-wrap gap-1">
                <Pill className="!bg-violet-50 !text-violet-700 dark:!bg-violet-500/15 dark:!text-violet-200"><Sparkles size={10} className="mr-1" /> Shorten</Pill>
                <Pill className="!bg-violet-50 !text-violet-700 dark:!bg-violet-500/15 dark:!text-violet-200"><Sparkles size={10} className="mr-1" /> Translate</Pill>
            </div>
        </div>
    ),

    "react-fancy/marquee": () => (
        <div className="w-full max-w-[18rem] space-y-2">
            <Marquee
                speed={30}
                gap={20}
                fade={24}
                items={["MOTION", "FILM", "SCROLL", "BRAND"]}
                separator={<span className="text-[0.7em] text-fuchsia-500">✸</span>}
                className="border-y border-zinc-200 py-1.5 text-sm font-bold tracking-tight text-zinc-700 dark:border-zinc-700 dark:text-zinc-200"
            />
            <Marquee
                speed={30}
                gap={20}
                fade={24}
                direction="right"
                items={["Velocity", "Slipstream", "Afterburn", "Parallax"]}
                separator={<span className="text-[0.7em] text-cyan-500">✦</span>}
                className="py-1 text-xs font-semibold text-zinc-400 dark:text-zinc-500"
            />
        </div>
    ),

    "react-fancy/menu": () => (
        <div className="w-44 overflow-hidden rounded-md border border-zinc-200 bg-white shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
            <div className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-400">Workspace</div>
            <button className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs text-zinc-700 hover:bg-zinc-50 dark:text-zinc-300 dark:hover:bg-zinc-800">
                <LayoutGrid size={12} /> Dashboard
            </button>
            <button className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs text-zinc-700 hover:bg-zinc-50 dark:text-zinc-300 dark:hover:bg-zinc-800">
                <Folder size={12} /> Projects
            </button>
            <div className="my-0.5 h-px bg-zinc-100 dark:bg-zinc-800" />
            <button className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs text-zinc-700 hover:bg-zinc-50 dark:text-zinc-300 dark:hover:bg-zinc-800">
                <Settings size={12} /> Settings
            </button>
        </div>
    ),

    "react-fancy/mobile-menu": () => (
        <div className="relative h-32 w-44 overflow-hidden rounded-lg border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900">
            <div className="flex items-center justify-between border-b border-zinc-100 px-2 py-1.5 dark:border-zinc-800">
                <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-200">App</span>
                <MenuIcon size={14} className="text-zinc-500" />
            </div>
            <div className="absolute inset-y-0 right-0 w-28 border-l border-zinc-200 bg-zinc-50 px-2 py-2 text-[10px] dark:border-zinc-800 dark:bg-zinc-950">
                <div className="rounded bg-violet-50 px-1.5 py-1 font-medium text-violet-900 dark:bg-violet-500/15 dark:text-violet-100">Home</div>
                <div className="px-1.5 py-1 text-zinc-600 dark:text-zinc-300">Inbox</div>
                <div className="px-1.5 py-1 text-zinc-600 dark:text-zinc-300">Settings</div>
            </div>
        </div>
    ),

    "react-fancy/modal": () => (
        <div className="relative h-32 w-full max-w-[18rem] overflow-hidden rounded-md bg-zinc-200/60 dark:bg-zinc-800/60">
            <div className="absolute inset-2 rounded-md border border-zinc-200 bg-white shadow-lg dark:border-zinc-700 dark:bg-zinc-900">
                <div className="border-b border-zinc-100 px-3 py-1.5 text-xs font-semibold text-zinc-700 dark:border-zinc-800 dark:text-zinc-200">
                    Confirm
                </div>
                <div className="px-3 py-2 text-xs text-zinc-600 dark:text-zinc-300">Delete this project?</div>
                <div className="flex justify-end gap-1.5 px-3 pb-2">
                    <Button variant="ghost" size="sm">Cancel</Button>
                    <Button color="red" size="sm">Delete</Button>
                </div>
            </div>
        </div>
    ),

    "react-fancy/mood-meter": () => (
        <div className="w-full max-w-[16rem]">
            <MoodMeter min={1} max={5} value={4} confidence={0.7} onChange={() => {}} />
        </div>
    ),

    "react-fancy/navbar": () => (
        <div className="w-full max-w-[20rem] overflow-hidden rounded-md border border-zinc-200 dark:border-zinc-700">
            <div className="flex items-center justify-between bg-white px-3 py-2 dark:bg-zinc-900">
                <div className="flex items-center gap-3">
                    <div className="size-5 rounded bg-gradient-to-br from-violet-500 to-sky-500" />
                    <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-200">Fancy</span>
                    <span className="text-xs text-violet-600 dark:text-violet-300">Docs</span>
                    <span className="text-xs text-zinc-500">Pricing</span>
                </div>
                <Sun size={14} className="text-zinc-500" />
            </div>
        </div>
    ),

    "react-fancy/otp-input": () => <OtpInput length={6} value="491" onChange={() => {}} />,

    "react-fancy/pagination": () => (
        <Pagination page={3} totalPages={12} onPageChange={() => {}} />
    ),

    "react-fancy/pillbox": () => {
        const [tags, setTags] = useState(["agent", "human+ux", "fancy-ui"]);
        return (
            <div className="w-full max-w-[18rem]">
                <Pillbox value={tags} onChange={setTags} color="violet" size="sm" />
            </div>
        );
    },

    "react-fancy/popover": () => (
        <div className="relative">
            <Button color="violet" size="sm">Click me</Button>
            <div className="absolute left-1/2 top-full mt-2 w-48 -translate-x-1/2 rounded-md border border-zinc-200 bg-white p-2.5 text-xs text-zinc-700 shadow-lg dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200">
                <div className="absolute -top-1.5 left-1/2 size-3 -translate-x-1/2 rotate-45 border-l border-t border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900" />
                A floating panel anchored to a trigger.
            </div>
        </div>
    ),

    "react-fancy/portal": () => (
        <div className="text-center">
            <div className="mx-auto grid size-14 place-items-center rounded-full bg-gradient-to-br from-violet-500 to-sky-500 text-white shadow-lg">
                <Layers size={24} />
            </div>
            <div className="mt-2 text-xs text-zinc-600 dark:text-zinc-300">
                <code className="rounded bg-zinc-100 px-1 font-mono text-[10px] dark:bg-zinc-800">document.body</code>
            </div>
            <div className="mt-0.5 text-[10px] text-zinc-500">Renders outside the tree</div>
        </div>
    ),

    "react-fancy/profile": () => (
        <Profile name="Rita Kumar" subtitle="Senior engineer · NYC" fallback="RK" status="online" size="lg" />
    ),

    "react-fancy/progress": () => (
        <div className="w-full max-w-[18rem] space-y-3">
            <Progress value={68} color="violet" />
            <Progress indeterminate color="sky" />
            <Progress value={42} variant="circular" size="lg" color="emerald" />
        </div>
    ),

    "react-fancy/prompt-input": () => (
        <div className="w-full max-w-[18rem] rounded-2xl border border-zinc-200 bg-white p-2 shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
            <div className="px-2 pb-1 text-xs text-zinc-700 dark:text-zinc-200">
                Build me a calendar with team availability<span className="ml-0.5 inline-block h-3 w-px animate-pulse bg-violet-500" />
            </div>
            <div className="flex items-center justify-between border-t border-zinc-100 pt-1.5 dark:border-zinc-800">
                <div className="flex gap-1 text-zinc-400">
                    <Code size={12} />
                    <ImageIcon size={12} />
                </div>
                <Button color="violet" size="sm" icon="arrow-up" />
            </div>
        </div>
    ),

    "react-fancy/reason-tag": () => (
        <Tooltip content="Renewed user; 92% upgrade probability">
            <Pill className="!bg-amber-50 !text-amber-800 dark:!bg-amber-500/15 dark:!text-amber-200">
                <Sparkles size={10} className="mr-1" /> High intent
            </Pill>
        </Tooltip>
    ),

    "react-fancy/separator": () => (
        <div className="w-full max-w-[18rem] space-y-2 text-center">
            <Text size="xs" className="!text-zinc-500">Above</Text>
            <div className="h-px bg-zinc-200 dark:bg-zinc-700" />
            <Text size="xs" className="!text-zinc-500">Below</Text>
            <div className="my-3 flex items-center gap-2 text-[10px] uppercase tracking-wider text-zinc-400">
                <div className="h-px flex-1 bg-zinc-200 dark:bg-zinc-700" />
                or
                <div className="h-px flex-1 bg-zinc-200 dark:bg-zinc-700" />
            </div>
        </div>
    ),

    "react-fancy/sidebar": () => (
        <div className="w-44 overflow-hidden rounded-md border border-zinc-200 bg-zinc-50 py-1 dark:border-zinc-700 dark:bg-zinc-950">
            <div className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-400">Workspace</div>
            <button className="flex w-full items-center gap-2 bg-violet-100 px-3 py-1.5 text-left text-xs font-medium text-violet-900 dark:bg-violet-500/15 dark:text-violet-100">
                <Home size={12} /> Home
            </button>
            <button className="flex w-full items-center justify-between px-3 py-1.5 text-left text-xs text-zinc-700 dark:text-zinc-300">
                <span className="flex items-center gap-2"><FileIcon size={12} /> Docs</span>
                <Badge color="violet">3</Badge>
            </button>
            <button className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs text-zinc-700 dark:text-zinc-300">
                <Settings size={12} /> Settings
            </button>
        </div>
    ),

    "react-fancy/skeleton": () => (
        <div className="w-full max-w-[18rem] space-y-2">
            <Skeleton shape="text" width="33%" />
            <Skeleton shape="text" />
            <Skeleton shape="text" width="83%" />
            <div className="flex items-center gap-2 pt-1">
                <Skeleton shape="circle" width={32} height={32} />
                <Skeleton shape="text" width="50%" />
            </div>
        </div>
    ),

    "react-fancy/table": () => (
        <div className="w-full max-w-[18rem] overflow-hidden rounded-md border border-zinc-200 text-xs dark:border-zinc-700">
            <table className="w-full">
                <thead className="bg-zinc-50 dark:bg-zinc-900">
                    <tr>
                        <th className="px-2 py-1.5 text-left font-semibold text-zinc-500">Name</th>
                        <th className="px-2 py-1.5 text-right font-semibold text-zinc-500">Status</th>
                    </tr>
                </thead>
                <tbody className="text-zinc-700 dark:text-zinc-200">
                    <tr className="border-t border-zinc-100 dark:border-zinc-800">
                        <td className="px-2 py-1.5">api.prod</td>
                        <td className="px-2 py-1.5 text-right"><Badge color="emerald">live</Badge></td>
                    </tr>
                    <tr className="border-t border-zinc-100 dark:border-zinc-800">
                        <td className="px-2 py-1.5">api.stage</td>
                        <td className="px-2 py-1.5 text-right"><Badge color="amber">slow</Badge></td>
                    </tr>
                </tbody>
            </table>
        </div>
    ),

    "react-fancy/tabs": () => (
        <div className="w-full max-w-[20rem]">
            <Tabs defaultTab="overview">
                <Tabs.List>
                    <Tabs.Tab value="overview">Overview</Tabs.Tab>
                    <Tabs.Tab value="logs">Logs</Tabs.Tab>
                    <Tabs.Tab value="settings">Settings</Tabs.Tab>
                </Tabs.List>
                <Tabs.Panels>
                    <Tabs.Panel value="overview">
                        <Text size="xs" className="mt-2 !text-zinc-500">3 active services · 0 alerts</Text>
                    </Tabs.Panel>
                    <Tabs.Panel value="logs"><Text size="xs" className="mt-2 !text-zinc-500">No recent events</Text></Tabs.Panel>
                    <Tabs.Panel value="settings"><Text size="xs" className="mt-2 !text-zinc-500">Configure your workspace</Text></Tabs.Panel>
                </Tabs.Panels>
            </Tabs>
        </div>
    ),

    "react-fancy/text": () => (
        <div className="w-full max-w-[18rem] space-y-1 text-left">
            <Text size="lg">Large paragraph.</Text>
            <Text size="md" className="!text-zinc-600 dark:!text-zinc-300">Medium for body copy.</Text>
            <Text size="sm" className="!text-zinc-500">Smaller for hints.</Text>
            <Text size="xs" className="!text-zinc-400">Extra small for metadata.</Text>
        </div>
    ),

    "react-fancy/timeline": () => (
        <div className="w-full max-w-[18rem]">
            <Timeline
                events={[
                    { date: "Jun 14", title: "Released v0.4", color: "violet" },
                    { date: "Jun 12", title: "Ports → Zustand", color: "sky" },
                    { date: "Jun 10", title: "Audit complete", color: "emerald" },
                ]}
                variant="stacked"
                animated={false}
            />
        </div>
    ),

    "react-fancy/time-picker": () => <TimePicker defaultValue="09:30" format="12h" />,

    "react-fancy/toast": () => (
        <div className="w-full max-w-[18rem] space-y-2">
            <div className="flex items-start gap-3 rounded-lg border border-emerald-200 bg-white px-3 py-2 shadow-sm dark:border-emerald-700/50 dark:bg-zinc-900">
                <div className="mt-0.5 grid size-5 place-items-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300">
                    <Check size={12} />
                </div>
                <div className="flex-1">
                    <div className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">Saved</div>
                    <div className="text-[11px] text-zinc-500">Your settings are up to date.</div>
                </div>
                <X size={12} className="text-zinc-400" />
            </div>
        </div>
    ),

    "react-fancy/tooltip": () => (
        <div className="relative">
            <Button variant="ghost" size="sm" icon="info">Hover me</Button>
            <div className="absolute left-1/2 top-full mt-2 -translate-x-1/2 whitespace-nowrap rounded bg-zinc-900 px-2 py-1 text-[10px] text-white shadow-md dark:bg-zinc-100 dark:text-zinc-900">
                <div className="absolute -top-1 left-1/2 size-2 -translate-x-1/2 rotate-45 bg-zinc-900 dark:bg-zinc-100" />
                Helpful detail
            </div>
        </div>
    ),

    "react-fancy/tree-nav": () => (
        <div className="w-44 text-xs">
            <div className="flex items-center gap-1 py-0.5 text-zinc-700 dark:text-zinc-200">
                <ChevronDown size={12} className="text-zinc-400" />
                <Folder size={12} className="text-amber-500" /> src
            </div>
            <div className="ml-4 space-y-0.5">
                <div className="flex items-center gap-1 py-0.5 text-zinc-700 dark:text-zinc-200">
                    <ChevronDown size={12} className="text-zinc-400" />
                    <Folder size={12} className="text-amber-500" /> components
                </div>
                <div className="ml-4 flex items-center gap-1 py-0.5 text-zinc-700 dark:text-zinc-200">
                    <FileIcon size={12} className="text-violet-500" /> Card.tsx
                </div>
                <div className="ml-4 flex items-center gap-1 py-0.5 text-zinc-700 dark:text-zinc-200">
                    <FileIcon size={12} className="text-violet-500" /> Button.tsx
                </div>
                <div className="flex items-center gap-1 py-0.5 text-zinc-700 dark:text-zinc-200">
                    <FileIcon size={12} className="text-violet-500" /> index.ts
                </div>
            </div>
        </div>
    ),

    // ─── fancy-echarts ────────────────────────────────────────────────────

    // ── fancy-git-ui ────────────────────────────────────────────────────────
    // The REAL components, against the same fixture repository the full demos
    // use (`./gitFixtures`).
    //
    // These were hand-drawn HTML mock-ups — a div pretending to be a diff, a
    // span pretending to be a badge — justified by "a listing tile has no
    // repository to read". That was never true: every one of these components
    // is CONTROLLED, so it renders exactly what you hand it, and a tile can
    // hand it a fixture as easily as a demo can. The mock-ups drifted from the
    // components with nothing to catch it, and in this package they were
    // mock-ups OF surfaces whose whole selling point is being real.
    //
    // Read-only here on purpose: a tile is a preview, not a workspace, and the
    // full demos one click away are where the intents are wired.
    "fancy-git-ui/working-tree": () => (
        <div className="w-full max-w-[20rem] text-[11px]">
            <WorkingTree value={GIT_STATUS} selectedPaths={["src/runtime/run-cohort.ts"]} />
        </div>
    ),

    "fancy-git-ui/commit-history": () => (
        <div className="w-full max-w-[20rem] text-[11px]">
            <CommitHistory value={GIT_COMMITS} selectedId={GIT_COMMITS[0].id} />
        </div>
    ),

    "fancy-git-ui/review-list": () => (
        <div className="w-full max-w-[20rem] text-[11px]">
            <ReviewList value={GIT_REVIEWS} selectedNumber={41} />
        </div>
    ),

    "fancy-git-ui/repository-browser": () => (
        <div className="w-full max-w-[20rem] text-[11px]">
            <RepositoryBrowser value={GIT_TREE} path="src" selectedPath="src/types.ts" />
        </div>
    ),

    "fancy-git-ui/diff-viewer": () => (
        <div className="w-full max-w-[20rem] text-[10px]">
            <DiffViewer value={GIT_DIFF} hideContext />
        </div>
    ),

    "fancy-git-ui/branch-picker": () => (
        <div className="w-full max-w-[18rem] text-[11px]">
            <BranchPicker value={GIT_BRANCHES} selectedName="feature/trigger-cohorts" />
        </div>
    ),

    "fancy-git-ui/commit-composer": () => (
        <div className="w-full max-w-[18rem] text-[11px]">
            {/* `view` mode, which is the component's own read-only rendering
                rather than a tile-specific fake. */}
            <CommitComposer
                value={{ message: "feat(runtime): runCohort", description: "The runs one trigger fires." }}
                onChange={() => {}}
                mode="view"
            />
        </div>
    ),

    "fancy-git-ui/create-review-form": () => (
        <div className="w-full max-w-[18rem] text-[11px]">
            <CreateReviewForm
                value={{ title: "Add trigger cohorts", sourceBranch: "feature/trigger-cohorts", targetBranch: "main" }}
                onChange={() => {}}
                branches={["main", "feature/trigger-cohorts"]}
                mode="view"
            />
        </div>
    ),

    // ── fancy-map ───────────────────────────────────────────────────────────
    // A still of the shape the real <Map> draws — tiles, pins, a follow dot.
    // Mounting Leaflet in a listing tile would pull a tile server per card.
    "fancy-map/map": () => (
        <div className="relative h-32 w-full max-w-[18rem] overflow-hidden rounded-md border border-zinc-200 bg-[#e8eef2] dark:border-zinc-800 dark:bg-[#1b2733]">
            {/* Street grid */}
            <div
                className="absolute inset-0 opacity-70"
                style={{
                    backgroundImage:
                        "linear-gradient(#cbd5e1 1px, transparent 1px), linear-gradient(90deg, #cbd5e1 1px, transparent 1px)",
                    backgroundSize: "34px 26px",
                }}
            />
            {/* A road and a river, so it reads as a map rather than graph paper */}
            <div className="absolute inset-x-0 top-[58%] h-[6px] -rotate-6 bg-amber-200/80 dark:bg-amber-400/30" />
            <div className="absolute inset-y-0 left-[22%] w-[7px] rotate-3 bg-sky-300/70 dark:bg-sky-500/25" />

            <span className="absolute left-[30%] top-[30%] text-rose-500 dark:text-rose-400">
                <MapPin size={16} strokeWidth={2.5} />
            </span>
            <span className="absolute left-[62%] top-[46%] text-rose-500 dark:text-rose-400">
                <MapPin size={16} strokeWidth={2.5} />
            </span>

            {/* Live position — the tracking half of the package. */}
            <span className="absolute left-[46%] top-[66%] flex size-3 items-center justify-center">
                <span className="absolute size-3 animate-ping rounded-full bg-sky-400/60" />
                <span className="size-2 rounded-full border border-white bg-sky-500" />
            </span>

            <span className="absolute bottom-1 right-1 rounded bg-white/80 px-1 text-[7px] font-medium text-zinc-500 dark:bg-zinc-900/80 dark:text-zinc-400">
                OSM · Leaflet
            </span>
        </div>
    ),

    "fancy-echarts/echart": () => (
        <div className="size-full min-h-[8rem] max-w-[18rem]">
            <EChart
                style={{ width: "100%", height: 120 }}
                option={{
                    grid: { left: 4, right: 4, top: 4, bottom: 4 },
                    xAxis: { type: "category", show: false, data: ["M", "T", "W", "T", "F", "S", "S"] },
                    yAxis: { type: "value", show: false },
                    series: [{ type: "bar", data: [12, 19, 15, 22, 18, 9, 14], itemStyle: { color: "#8b5cf6", borderRadius: [3, 3, 0, 0] }, barWidth: "55%" }],
                    tooltip: { trigger: "axis", confine: true },
                }}
            />
        </div>
    ),

    // (data-diagram / flowchart / mindmap / org-chart previews removed
    //  alongside the fancy-echarts 4.0.0 deletion of the hand-rolled
    //  diagram subsystem. Node-edge graphs live in fancy-flow now.)

    // ─── fancy-screens ────────────────────────────────────────────────────

    "fancy-screens/screen": () => (
        <div className="w-full max-w-[18rem] overflow-hidden rounded-md border border-zinc-200 dark:border-zinc-700">
            <div className="border-b border-zinc-100 bg-zinc-50 px-2 py-1 text-[10px] font-mono text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950">
                screen.id = &quot;profile&quot;
            </div>
            <div className="space-y-1 p-2 text-xs">
                <div className="flex items-center justify-between text-zinc-700 dark:text-zinc-200">
                    <span>Notifications</span><Switch checked={true} onChange={() => {}} />
                </div>
                <div className="text-[10px] text-zinc-500 font-mono">storeKeys: [user, prefs]</div>
            </div>
        </div>
    ),

    "fancy-screens/screen-system": () => (
        <div className="w-full max-w-[20rem] text-[10px]">
            <ScreenSystem>
                <div className="grid grid-cols-2 gap-2">
                    {["inbox", "compose"].map((id) => (
                        <Screen key={id} id={id} title={id}>
                            <div className="rounded border border-zinc-200 p-2 dark:border-zinc-700">{id}</div>
                        </Screen>
                    ))}
                </div>
            </ScreenSystem>
        </div>
    ),

    // ─── fancy-flow ───────────────────────────────────────────────────────

    "fancy-flow/flow-editor": heavy("FlowEditorTile", () => (
        <div className="flex items-center gap-2 text-[10px]">
            <div className="rounded border-2 border-violet-500 bg-violet-50 px-2 py-1.5 text-violet-900 dark:bg-violet-500/15 dark:text-violet-100">
                <div className="font-semibold">Input</div>
                <div className="text-zinc-500">trigger</div>
            </div>
            <div className="h-px w-3 bg-zinc-300" />
            <div className="rounded border border-zinc-200 bg-white px-2 py-1.5 text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200">
                <div className="font-semibold">Filter</div>
                <div className="text-zinc-500">where</div>
            </div>
            <div className="h-px w-3 bg-zinc-300" />
            <div className="rounded border-2 border-emerald-500 bg-emerald-50 px-2 py-1.5 text-emerald-900 dark:bg-emerald-500/15 dark:text-emerald-100">
                <div className="font-semibold">Output</div>
                <div className="text-zinc-500">sink</div>
            </div>
        </div>
    )),

    "fancy-flow/run-flow": () => (
        <div className="w-full max-w-[18rem] overflow-hidden rounded-md border border-zinc-800 bg-zinc-950 font-mono text-[10px] text-zinc-100">
            <div className="border-b border-zinc-800 px-2 py-1 text-[9px] text-zinc-500">/engine · zero React</div>
            <div className="space-y-0.5 p-2.5">
                <div><span className="text-violet-300">await</span> runFlow(graph, executors)</div>
                <div className="text-emerald-300">{"{ ok: true,"}</div>
                <div className="pl-3 text-zinc-300">{'outputs: { … } }'}</div>
            </div>
        </div>
    ),

    // A BRIDGE, not a component — the runtime exports are createFlowRunnerUx /
    // useFlowRunnerUx and `FlowRunnerUx` is the type. Nothing renders, so this
    // stays a diagram of what it wires together.
    "fancy-flow/flow-runner-ux": () => (
        <div className="flex items-center gap-2 text-[10px]">
            <div className="rounded-md border border-zinc-200 bg-white px-2 py-1.5 text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200">
                <div className="font-semibold">effect</div>
                <div className="text-zinc-500">toast()</div>
            </div>
            <div className="text-zinc-400">→</div>
            <div className="rounded-md border-2 border-violet-500 bg-violet-50 px-2 py-1.5 text-violet-900 dark:bg-violet-500/15 dark:text-violet-100">
                <div className="flex items-center gap-1 font-semibold"><span>🔔</span> ux_toast</div>
                <div className="text-violet-500/80 dark:text-violet-200/70">flow node</div>
            </div>
        </div>
    ),

    // ─── fancy-whiteboard ─────────────────────────────────────────────────

    "fancy-whiteboard/board": () => (
        <div className="h-32 w-full max-w-[20rem] overflow-hidden rounded-md border border-zinc-200 dark:border-zinc-800">
            <Board className="h-full w-full" viewport={{ x: 0, y: 0, zoom: 0.62 }} onViewportChange={() => {}}>
                <BoardStickyNote item={{ id: "a", kind: "sticky", x: 16, y: 14, width: 130, height: 78, text: "Q3 OKRs", color: "#fef3c7" }} onChange={() => {}} />
                <BoardStickyNote item={{ id: "b", kind: "sticky", x: 190, y: 40, width: 130, height: 78, text: "Ship v0.4", color: "#ede9fe" }} onChange={() => {}} />
                <BoardStickyNote item={{ id: "c", kind: "sticky", x: 70, y: 120, width: 130, height: 78, text: "Audit", color: "#d1fae5" }} onChange={() => {}} />
            </Board>
        </div>
    ),
    // ─── fancy-artboard ───────────────────────────────────────────────────

    "fancy-artboard/artboard": () => (
        <div className="h-32 w-full max-w-[20rem] overflow-hidden rounded-md border border-zinc-200 dark:border-zinc-700">
            <ArtBoard
                style={{ height: "100%", width: "100%" }}
                defaultViewport={{ x: 16, y: 12, zoom: 0.42 }}
            >
                <ArtBoard.Section id="onboarding" title="Onboarding" subtitle="First-run variants">
                    <ArtPiece
                        id="a"
                        label="A · Dusk"
                        width={180}
                        height={300}
                        content={{ kind: "html", html: '<div style="height:100%;background:linear-gradient(135deg,#a78bfa,#38bdf8)"></div>' }}
                    />
                    <ArtPiece
                        id="b"
                        label="B · Minimal"
                        width={180}
                        height={300}
                        content={{ kind: "html", html: '<div style="height:100%;padding:16px;font-family:sans-serif"><div style="height:14px;width:60%;background:#e4e4e7;border-radius:4px"></div><div style="margin-top:10px;height:10px;width:80%;background:#f4f4f5;border-radius:4px"></div></div>' }}
                    />
                    <ArtPiece
                        id="c"
                        label="C · Proposed"
                        width={180}
                        height={300}
                        pending
                        content={{ kind: "html", html: '<div style="height:100%;background:linear-gradient(135deg,#34d399,#2dd4bf)"></div>' }}
                    />
                </ArtBoard.Section>
                <ArtBoard.Note top={20} left={600} rotate={-4}>
                    Try the dusk gradient?
                </ArtBoard.Note>
            </ArtBoard>
        </div>
    ),

    "fancy-artboard/art-piece": () => (
        <div className="h-32 w-full max-w-[20rem] overflow-hidden rounded-md border border-zinc-200 dark:border-zinc-800">
            <ArtBoard defaultViewport={{ x: 0, y: 0, zoom: 0.55 }} style={{ height: "100%", width: "100%" }}>
                <ArtPiece id="hero">
                    <div className="grid h-full place-items-center bg-gradient-to-br from-emerald-400 to-teal-500 p-4 text-center text-white">
                        <div className="text-lg font-bold">Live JSX</div>
                    </div>
                </ArtPiece>
            </ArtBoard>
        </div>
    ),

    "fancy-artboard/artboard-section": () => (
        <div className="w-full max-w-[20rem]">
            <div className="mb-1 text-xs font-semibold text-zinc-700 dark:text-zinc-200">Hero variants</div>
            <div className="text-[10px] text-zinc-500">A/B/C copy directions</div>
            <div className="mt-1.5 flex gap-2">
                {["from-violet-300 to-sky-300", "from-emerald-300 to-teal-300", "from-amber-300 to-rose-300"].map((g, i) => (
                    <div key={i} className={`h-16 w-12 rounded border border-zinc-300 bg-gradient-to-br shadow-sm dark:border-zinc-600 ${g}`} />
                ))}
            </div>
        </div>
    ),

    "fancy-artboard/artboard-note": () => (
        <div className="h-28 w-full max-w-[18rem] overflow-hidden rounded-md border border-zinc-200 dark:border-zinc-800">
            <ArtBoard defaultViewport={{ x: 0, y: 0, zoom: 0.85 }} style={{ height: "100%", width: "100%" }}>
                <ArtBoard.Note top={14} left={16} rotate={-3}>
                    Try the dusk gradient on the hero?
                </ArtBoard.Note>
            </ArtBoard>
        </div>
    ),

    // ─── holy-sheet ───────────────────────────────────────────────────────

    "holy-sheet/agent": () => (
        <div className="w-full max-w-[18rem] overflow-hidden rounded-md border border-zinc-200 dark:border-zinc-700">
            <div className="flex items-center justify-between border-b border-zinc-100 bg-emerald-50 px-2 py-1 text-[10px] dark:border-zinc-800 dark:bg-emerald-500/10">
                <span className="font-mono text-emerald-700 dark:text-emerald-200">q1-report.xlsx</span>
                <span className="text-emerald-700 dark:text-emerald-200">✓ written</span>
            </div>
            <div className="px-2 py-1.5 text-[10px] font-mono">
                <div className="text-zinc-500">Agent::write($schema)</div>
                <div className="text-zinc-700 dark:text-zinc-300">  ↳ 3 sheets, 142 rows</div>
            </div>
        </div>
    ),

    // ─── fancy-slides ─────────────────────────────────────────────────────
    //
    // Every fancy-slides tile renders the same canonical slide / deck (see
    // showcase-fixtures.tsx) so the user sees the exact same content when
    // they click through to the detail page — the tile is just a miniature.

    "fancy-slides/slide": () => (
        <div className="w-full max-w-[20rem] overflow-hidden rounded-md border border-zinc-200 dark:border-zinc-700">
            <FsSlide slide={CANONICAL_SLIDE} theme={fsDefaultTheme} width={280} />
        </div>
    ),

    "fancy-slides/slide-viewer": () => (
        <div className="relative w-full max-w-[20rem] overflow-hidden rounded-md border border-zinc-200 bg-black dark:border-zinc-700">
            <FsSlide slide={CANONICAL_DECK.slides[0]} theme={fsDefaultTheme} width={320} />
            <div className="absolute right-2 top-2">
                <span className="rounded bg-black/40 px-1.5 py-0.5 font-mono text-[9px] text-white">1 / {CANONICAL_DECK.slides.length}</span>
            </div>
            <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-1">
                {CANONICAL_DECK.slides.map((_, i) => (
                    <span key={i} className={`h-1 w-3 rounded-full ${i === 0 ? "bg-violet-500" : "bg-white/40"}`} />
                ))}
            </div>
        </div>
    ),

    "fancy-slides/presenter-view": () => (
        <div className="w-full max-w-[20rem] space-y-1.5 rounded-md border border-zinc-200 bg-zinc-50 p-2 text-[10px] dark:border-zinc-700 dark:bg-zinc-900">
            <div className="flex items-center justify-between text-zinc-500">
                <span className="font-mono">03:42 elapsed</span>
                <span className="font-mono">14:21:09</span>
            </div>
            <div className="grid grid-cols-[3fr_2fr] gap-1.5">
                <div className="overflow-hidden rounded border border-zinc-300 dark:border-zinc-700">
                    <FsSlide slide={CANONICAL_DECK.slides[0]} theme={fsDefaultTheme} />
                </div>
                <div className="overflow-hidden rounded border border-dashed border-zinc-300 dark:border-zinc-700">
                    <FsSlide slide={CANONICAL_DECK.slides[1]} theme={fsDefaultTheme} />
                </div>
            </div>
            <div className="rounded border border-zinc-200 bg-white p-1.5 text-[9px] text-zinc-600 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-300">
                <span className="font-semibold">Notes:</span> {String(CANONICAL_DECK.slides[0].notes ?? "").slice(0, 70)}…
            </div>
        </div>
    ),

    "fancy-slides/deck-editor": () => (
        <div className="w-full max-w-[20rem] overflow-hidden rounded-md border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900">
            <div className="flex items-center gap-1 border-b border-zinc-200 px-2 py-1 dark:border-zinc-800">
                <span className="font-mono text-[9px] text-zinc-500">deck.json</span>
                <span className="ml-auto flex gap-1 text-[10px] text-zinc-400">
                    <span>↶</span><span>↷</span><span>▶</span>
                </span>
            </div>
            <div className="grid grid-cols-[36px_1fr_60px] gap-1 p-1.5">
                <div className="space-y-1">
                    {CANONICAL_DECK.slides.map((_, i) => (
                        <div
                            key={i}
                            className={`grid h-6 place-items-center rounded text-[8px] ${
                                i === 0
                                    ? "bg-violet-100 text-violet-700 ring-1 ring-violet-300 dark:bg-violet-500/15 dark:text-violet-100 dark:ring-violet-700"
                                    : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400"
                            }`}
                        >
                            {i + 1}
                        </div>
                    ))}
                </div>
                <div className="overflow-hidden rounded border border-zinc-200 dark:border-zinc-700">
                    <FsSlide slide={CANONICAL_DECK.slides[0]} theme={fsDefaultTheme} />
                </div>
                <div className="space-y-1 text-[8px]">
                    <div className="rounded bg-zinc-100 px-1 py-0.5 font-semibold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                        Inspector
                    </div>
                    <div className="rounded bg-zinc-50 px-1 py-0.5 text-zinc-500 dark:bg-zinc-950">x: 0.08</div>
                    <div className="rounded bg-zinc-50 px-1 py-0.5 text-zinc-500 dark:bg-zinc-950">y: 0.30</div>
                    <div className="rounded bg-zinc-50 px-1 py-0.5 text-zinc-500 dark:bg-zinc-950">font: 22</div>
                </div>
            </div>
        </div>
    ),

    "fancy-slides/text-element": () => (
        <div className="w-full max-w-[18rem] overflow-hidden rounded-md border border-zinc-200 dark:border-zinc-700">
            <FsSlide slide={CANONICAL_TEXT_SLIDE} theme={fsDefaultTheme} />
        </div>
    ),

    "fancy-slides/image-element": () => (
        <div className="w-full max-w-[18rem] overflow-hidden rounded-md border border-zinc-200 dark:border-zinc-700">
            <FsSlide slide={CANONICAL_IMAGE_SLIDE} theme={fsDefaultTheme} />
        </div>
    ),

    "fancy-slides/shape-element": () => (
        <div className="w-full max-w-[18rem] overflow-hidden rounded-md border border-zinc-200 dark:border-zinc-700">
            <FsSlide slide={CANONICAL_SHAPES_SLIDE} theme={fsDefaultTheme} />
        </div>
    ),

    // ─── dark-slide (PHP) ─────────────────────────────────────────────────

    "dark-slide/agent": () => (
        <div className="w-full max-w-[20rem] overflow-hidden rounded-md border border-zinc-200 dark:border-zinc-700">
            <div className="flex items-center justify-between border-b border-zinc-100 bg-indigo-50 px-2 py-1 text-[10px] dark:border-zinc-800 dark:bg-indigo-500/10">
                <span className="font-mono text-indigo-700 dark:text-indigo-200">{CANONICAL_DECK.id}.pptx</span>
                <span className="text-indigo-700 dark:text-indigo-200">✓ written</span>
            </div>
            <div className="px-2 py-1.5 font-mono text-[10px]">
                <div className="text-zinc-500">Agent::write($deck)</div>
                <div className="text-zinc-700 dark:text-zinc-300">  ↳ {CANONICAL_DECK.slides.length} slides, 6.3 KB</div>
                <div className="mt-1 text-zinc-500">Agent::describe($deck)</div>
                <div className="text-zinc-700 dark:text-zinc-300">  ↳ &quot;{CANONICAL_DECK.title} · {CANONICAL_DECK.slides.length} slides…&quot;</div>
            </div>
        </div>
    ),

    "dark-slide/pptx-writer": () => (
        <div className="w-full max-w-[20rem] space-y-1.5 text-[10px]">
            <div className="grid grid-cols-3 gap-1 text-center">
                {PPTX_WRITER_COVERAGE.map((c) => (
                    <div
                        key={c.label}
                        className={`rounded border px-1.5 py-1 ${
                            c.check
                                ? "border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-200"
                                : "border-zinc-200 bg-zinc-50 text-zinc-400 dark:border-zinc-700 dark:bg-zinc-900"
                        }`}
                    >
                        <div className="font-mono">{c.label}</div>
                        <div>{c.check ? "✓" : c.note ?? "—"}</div>
                    </div>
                ))}
            </div>
            <div className="rounded border border-zinc-200 bg-zinc-950 px-1.5 py-1 font-mono text-[9px] text-zinc-300">
                ppt/slides/slide1.xml · 1.8 KB
            </div>
        </div>
    ),

    "dark-slide/pptx-reader": () => (
        <div className="w-full max-w-[20rem] text-[10px]">
            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-1.5">
                <div className="rounded border border-zinc-200 bg-zinc-50 p-1.5 text-center font-mono dark:border-zinc-700 dark:bg-zinc-900">
                    deck.pptx
                </div>
                <span className="text-zinc-400">→</span>
                <div className="rounded border border-violet-300 bg-violet-50 p-1.5 text-center font-mono text-violet-700 dark:border-violet-700 dark:bg-violet-500/15 dark:text-violet-200">
                    Deck JSON
                </div>
            </div>
            <ul className="mt-2 space-y-0.5 text-zinc-500">
                {PPTX_READER_ROUNDTRIP.map((line) => <li key={line}>✓ {line}</li>)}
            </ul>
        </div>
    ),

    "dark-slide/syntax-highlighter": () => (
        <div className="w-full max-w-[20rem] overflow-hidden rounded-md bg-zinc-950 p-2 font-mono text-[10px] leading-tight">
            <div className="text-slate-500">// dark-slide/SyntaxHighlighter</div>
            <div className="whitespace-pre-wrap">
                {CANONICAL_HIGHLIGHTED_TOKENS.map((tok, i) => (
                    <span key={i} className={HIGHLIGHT_KIND_COLOR[tok.kind] ?? "text-slate-100"}>{tok.text}</span>
                ))}
            </div>
            <div className="mt-1 flex flex-wrap gap-1 text-[8px]">
                <span className="rounded bg-violet-500/20 px-1 text-violet-200">keyword</span>
                <span className="rounded bg-emerald-500/20 px-1 text-emerald-200">string</span>
                <span className="rounded bg-amber-500/20 px-1 text-amber-200">number</span>
                <span className="rounded bg-slate-500/20 px-1 text-slate-300">comment</span>
            </div>
        </div>
    ),

    // ─── fancy-inertia ────────────────────────────────────────────────────

    "fancy-inertia/fancy-app-root": () => (
        <div className="w-full max-w-[18rem] space-y-1.5 text-[10px] font-mono">
            <div className="flex items-center gap-2 rounded border border-violet-300 bg-violet-50 px-2 py-1 text-violet-900 dark:border-violet-700 dark:bg-violet-500/15 dark:text-violet-100">
                <Check size={10} /> Toast.Provider
            </div>
            <div className="flex items-center gap-2 rounded border border-violet-300 bg-violet-50 px-2 py-1 text-violet-900 dark:border-violet-700 dark:bg-violet-500/15 dark:text-violet-100">
                <Check size={10} /> ScreenSystem
            </div>
            <div className="flex items-center gap-2 rounded border border-violet-300 bg-violet-50 px-2 py-1 text-violet-900 dark:border-violet-700 dark:bg-violet-500/15 dark:text-violet-100">
                <Check size={10} /> ECharts modules
            </div>
        </div>
    ),

    "fancy-inertia/use-fancy-form": () => (
        <div className="w-full max-w-[18rem] space-y-1.5">
            <div>
                <div className="mb-0.5 text-[10px] text-zinc-500">Email</div>
                <div className="rounded border border-zinc-200 bg-white px-2 py-1 text-xs text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200">user@example.com</div>
            </div>
            <div>
                <div className="mb-0.5 text-[10px] text-zinc-500">Password</div>
                <div className="rounded border border-rose-300 bg-rose-50 px-2 py-1 text-xs text-rose-700 dark:border-rose-700 dark:bg-rose-500/10 dark:text-rose-200">••••</div>
                <div className="mt-0.5 text-[10px] text-rose-600">Required</div>
            </div>
        </div>
    ),

    // ─── fancy-code ───────────────────────────────────────────────────────

    "fancy-code/code-editor": () => (
        <div className="h-32 w-full max-w-[20rem] overflow-hidden rounded-md border border-zinc-800 bg-zinc-950 font-mono text-[9px] leading-relaxed">
            <div className="flex items-center gap-1.5 border-b border-zinc-800 bg-zinc-900 px-2 py-1 text-[8px] text-zinc-400">
                <Code size={10} className="text-violet-300" /> app.ts
            </div>
            <div className="flex p-2">
                {/* Line numbers with the 0.8.0 diff-gutter marks (diffBase):
                    green bar = added, blue = modified, red wedge = deleted. */}
                <div className="select-none pr-2 text-right text-zinc-600">
                    <div>1</div>
                    <div className="relative"><span className="absolute -left-1 top-0 bottom-0 w-[2px] rounded bg-sky-500" />2</div>
                    <div className="relative"><span className="absolute -left-1 top-0 bottom-0 w-[2px] rounded bg-emerald-500" />3</div>
                    <div>4</div>
                    <div className="relative"><span className="absolute -left-1.5 top-0 h-0 w-0 border-y-4 border-y-transparent border-l-8 border-l-rose-500" />5</div>
                </div>
                <div className="space-y-0.5">
                    <div><span className="text-violet-300">import</span> <span className="text-zinc-300">{"{ run }"}</span> <span className="text-violet-300">from</span> <span className="text-emerald-300">&quot;./engine&quot;</span></div>
                    <div><span className="text-sky-300">const</span> <span className="text-amber-200">cfg</span> <span className="text-zinc-400">=</span> <span className="text-zinc-300">{"{"}</span></div>
                    <div className="pl-3"><span className="text-rose-300">retries</span><span className="text-zinc-400">:</span> <span className="text-amber-300">3</span><span className="text-zinc-400">,</span></div>
                    <div><span className="text-zinc-300">{"}"}</span></div>
                    <div><span className="text-zinc-500">await</span> <span className="text-amber-200">run</span><span className="text-zinc-300">(cfg)</span><span className="animate-pulse text-zinc-200">▌</span></div>
                </div>
            </div>
        </div>
    ),

    "fancy-code/markdown-editor": heavy("MarkdownEditorTile", () => (
        <div className="grid h-32 w-full max-w-[20rem] grid-cols-2 overflow-hidden rounded-md border border-zinc-200 text-[9px] dark:border-zinc-700">
            <div className="border-r border-zinc-200 bg-zinc-50 p-2 font-mono leading-relaxed text-zinc-600 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-400">
                <div><span className="text-violet-500"># </span>Fancy UI</div>
                <div className="text-zinc-400">&nbsp;</div>
                <div><span className="text-violet-500">**</span>Human+<span className="text-violet-500">**</span> UI.</div>
                <div><span className="text-violet-500">- </span>terse</div>
                <div><span className="text-violet-500">- </span>bridgeable</div>
            </div>
            <div className="bg-white p-2 leading-relaxed text-zinc-700 dark:bg-zinc-900 dark:text-zinc-200">
                <div className="text-[11px] font-bold">Fancy UI</div>
                <div className="mt-1"><span className="font-bold">Human+</span> UI.</div>
                <ul className="mt-0.5 list-disc pl-3 text-zinc-500">
                    <li>terse</li>
                    <li>bridgeable</li>
                </ul>
            </div>
        </div>
    )),

    // ─── fancy-sheets ─────────────────────────────────────────────────────

    "fancy-sheets/sheet-workbook": heavy("SheetWorkbookTile", () => (
        <div className="w-full max-w-[20rem] overflow-hidden rounded-md border border-zinc-200 text-[9px] dark:border-zinc-700">
            <table className="w-full border-collapse text-zinc-700 dark:text-zinc-200">
                <tbody>
                    <tr className="bg-zinc-100 font-semibold text-zinc-500 dark:bg-zinc-800">
                        <td className="w-5 border border-zinc-200 px-1 py-0.5 text-center dark:border-zinc-700"></td>
                        <td className="border border-zinc-200 px-1.5 py-0.5 dark:border-zinc-700">A</td>
                        <td className="border border-zinc-200 px-1.5 py-0.5 dark:border-zinc-700">B</td>
                        <td className="border border-zinc-200 px-1.5 py-0.5 dark:border-zinc-700">C</td>
                    </tr>
                    {[
                        ["1", "Region", "Q1", "Q2"],
                        ["2", "North", "1,200", "1,540"],
                        ["3", "South", "980", "1,110"],
                    ].map(([r, a, b, c]) => (
                        <tr key={r}>
                            <td className="border border-zinc-200 bg-zinc-50 px-1 py-0.5 text-center text-zinc-400 dark:border-zinc-700 dark:bg-zinc-950">{r}</td>
                            <td className="border border-zinc-200 px-1.5 py-0.5 dark:border-zinc-700">{a}</td>
                            <td className="border border-zinc-200 px-1.5 py-0.5 dark:border-zinc-700">{b}</td>
                            <td className="border border-zinc-200 px-1.5 py-0.5 dark:border-zinc-700">{c}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
            <div className="flex gap-1 border-t border-zinc-200 bg-zinc-50 px-1.5 py-1 dark:border-zinc-700 dark:bg-zinc-950">
                <span className="rounded-t border border-b-0 border-zinc-200 bg-white px-2 py-0.5 font-medium text-violet-600 dark:border-zinc-700 dark:bg-zinc-900">Sales</span>
                <span className="px-2 py-0.5 text-zinc-400">Costs</span>
            </div>
        </div>
    )),

    "fancy-sheets/create-empty-workbook": () => (
        <div className="w-full max-w-[18rem] overflow-hidden rounded-md border border-zinc-800 bg-zinc-950 font-mono text-[10px] leading-relaxed text-zinc-100">
            <div className="border-b border-zinc-800 px-2 py-1 text-[9px] text-zinc-500">factory · headless</div>
            <div className="space-y-0.5 p-2.5">
                <div><span className="text-sky-300">const</span> <span className="text-amber-200">wb</span> <span className="text-zinc-400">=</span> <span className="text-violet-300">createEmptyWorkbook</span>(<span className="text-zinc-300">{"{"}</span></div>
                <div className="pl-3"><span className="text-rose-300">sheets</span><span className="text-zinc-400">:</span> [<span className="text-emerald-300">&quot;Sales&quot;</span>],</div>
                <div className="text-zinc-300">{"})"}</div>
            </div>
        </div>
    ),

    // ─── fancy-diff ───────────────────────────────────────────────────────

    "fancy-diff/fancy-diff": () => (
        <div className="w-full max-w-[20rem] overflow-hidden text-[9px]">
            <FancyDiff source={{ unified: PREVIEW_UNIFIED_DIFF }} />
        </div>
    ),

    // ─── fancy-pixel ──────────────────────────────────────────────────────

    "fancy-pixel/pixel": () => (
        <div className="grid h-32 w-full max-w-[20rem] place-items-center">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-violet-300 bg-violet-50 px-3 py-1.5 text-[11px] font-medium text-violet-700 shadow-sm dark:border-violet-700 dark:bg-violet-500/15 dark:text-violet-200">
                <span className="relative flex size-2">
                    <span className="absolute inline-flex size-full animate-ping rounded-full bg-violet-400 opacity-75" />
                    <span className="relative inline-flex size-2 rounded-full bg-violet-500" />
                </span>
                <Sparkles size={12} /> Powered by Fancy UI
            </div>
        </div>
    ),

    // ─── fancy-echarts (3D + graphic) ─────────────────────────────────────

    "fancy-echarts/echart-3d": () => (
        <div className="grid h-32 w-full max-w-[20rem] place-items-center overflow-hidden rounded-md border border-zinc-200 bg-gradient-to-b from-zinc-50 to-white dark:border-zinc-700 dark:from-zinc-900 dark:to-zinc-950">
            <div className="flex items-end gap-1.5" style={{ transform: "perspective(240px) rotateX(48deg) rotateZ(-22deg)" }}>
                {[
                    ["h-6", "from-violet-400 to-violet-600"],
                    ["h-10", "from-sky-400 to-sky-600"],
                    ["h-8", "from-fuchsia-400 to-fuchsia-600"],
                    ["h-14", "from-emerald-400 to-emerald-600"],
                    ["h-9", "from-amber-400 to-amber-600"],
                ].map(([h, c], i) => (
                    <div key={i} className={`w-5 rounded-sm bg-gradient-to-t ${c} ${h} shadow-md`} />
                ))}
            </div>
        </div>
    ),

    "fancy-echarts/echart-graphic": () => (
        <div className="relative h-32 w-full max-w-[20rem] overflow-hidden rounded-md border border-zinc-200 bg-white p-2 dark:border-zinc-700 dark:bg-zinc-900">
            <div className="flex h-full items-end gap-1.5">
                {[40, 65, 50, 80, 60, 90, 70].map((h, i) => (
                    <div key={i} className={`flex-1 rounded-t ${i === 5 ? "bg-violet-500" : "bg-zinc-200 dark:bg-zinc-700"}`} style={{ height: `${h}%` }} />
                ))}
            </div>
            <div className="absolute right-3 top-3 rounded-md border border-violet-300 bg-violet-50 px-1.5 py-0.5 text-[9px] font-medium text-violet-700 shadow-sm dark:border-violet-700 dark:bg-violet-500/15 dark:text-violet-200">
                ▲ Peak · 90
            </div>
            <div className="absolute right-7 top-7 h-6 w-px bg-violet-400/60" />
        </div>
    ),

    // ─── fancy-3d (core) ──────────────────────────────────────────────────

    "fancy-3d/canvas": () => (
        <div className="grid h-32 w-full max-w-[20rem] place-items-center overflow-hidden rounded-md border border-zinc-200 bg-gradient-to-br from-zinc-50 to-zinc-100 dark:border-zinc-700 dark:from-zinc-900 dark:to-zinc-950">
            <div className="relative" style={{ perspective: "320px" }}>
                <div className="absolute -left-8 -top-2 h-16 w-12 rounded-lg bg-gradient-to-br from-violet-400 to-fuchsia-500 shadow-lg" style={{ transform: "rotateY(28deg) rotateX(-8deg)" }} />
                <div className="h-16 w-12 rounded-lg bg-gradient-to-br from-sky-400 to-cyan-500 shadow-lg" style={{ transform: "rotateY(-24deg) rotateX(-8deg)" }} />
                <div className="absolute -right-8 top-2 h-16 w-12 rounded-lg bg-gradient-to-br from-emerald-400 to-teal-500 shadow-lg" style={{ transform: "rotateY(-30deg) rotateX(-8deg)" }} />
            </div>
        </div>
    ),

    "fancy-3d/scene": () => (
        <div className="w-full max-w-[18rem] overflow-hidden rounded-md border border-zinc-800 bg-zinc-950 font-mono text-[10px] leading-relaxed text-zinc-100">
            <div className="border-b border-zinc-800 px-2 py-1 text-[9px] text-zinc-500">JSON Scene · engine-agnostic</div>
            <div className="space-y-0.5 p-2.5">
                <div><span className="text-sky-300">const</span> <span className="text-amber-200">scene</span><span className="text-zinc-400">:</span> <span className="text-violet-300">Scene</span> <span className="text-zinc-400">=</span> <span className="text-zinc-300">{"{"}</span></div>
                <div className="pl-3"><span className="text-rose-300">nodes</span><span className="text-zinc-400">:</span> [{"{ "}<span className="text-rose-300">box</span>: [<span className="text-amber-300">1</span>,<span className="text-amber-300">1</span>,<span className="text-amber-300">1</span>]{" }"}],</div>
                <div className="text-zinc-300">{"}"}</div>
            </div>
        </div>
    ),

    // ─── fancy-3d-babylon ─────────────────────────────────────────────────

    "fancy-3d-babylon/stage": () => (
        <div className="relative grid h-32 w-full max-w-[20rem] place-items-center overflow-hidden rounded-md border border-zinc-200 bg-gradient-to-b from-indigo-50 to-white dark:border-zinc-700 dark:from-indigo-950/40 dark:to-zinc-950">
            <div className="relative" style={{ perspective: "360px" }}>
                <div className="h-12 w-28 rounded-md bg-gradient-to-br from-orange-400 to-rose-500 shadow-xl" style={{ transform: "rotateX(52deg) rotateZ(-6deg)" }} />
                <div className="absolute left-1/2 top-1 size-7 -translate-x-1/2 rounded-full bg-gradient-to-br from-amber-300 to-orange-500 shadow-lg" />
            </div>
            <span className="absolute bottom-1.5 right-2 rounded bg-zinc-900/70 px-1.5 py-0.5 text-[8px] font-medium text-orange-300">Babylon</span>
        </div>
    ),

    "fancy-3d-babylon/monitor": () => (
        <div className="relative grid h-32 w-full max-w-[20rem] place-items-center overflow-hidden rounded-md border border-zinc-200 bg-gradient-to-b from-indigo-50 to-white dark:border-zinc-700 dark:from-indigo-950/40 dark:to-zinc-950">
            <div style={{ perspective: "420px" }}>
                <div className="rounded-md border-2 border-zinc-700 bg-zinc-900 p-1 shadow-xl" style={{ transform: "rotateY(-24deg) rotateX(6deg)" }}>
                    <div className="h-12 w-20 rounded-sm bg-gradient-to-br from-sky-500 via-violet-500 to-fuchsia-500" />
                </div>
                <div className="mx-auto mt-0.5 h-1.5 w-6 bg-zinc-700" style={{ transform: "rotateY(-24deg)" }} />
            </div>
            <span className="absolute bottom-1.5 right-2 rounded bg-zinc-900/70 px-1.5 py-0.5 text-[8px] font-medium text-orange-300">Babylon</span>
        </div>
    ),

    "fancy-3d-babylon/card-3d": () => (
        <div className="relative grid h-32 w-full max-w-[20rem] place-items-center overflow-hidden rounded-md border border-zinc-200 bg-gradient-to-b from-indigo-50 to-white dark:border-zinc-700 dark:from-indigo-950/40 dark:to-zinc-950">
            <div style={{ perspective: "420px" }}>
                <div className="h-20 w-16 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-600 p-2 shadow-2xl" style={{ transform: "rotateY(-30deg) rotateX(8deg)" }}>
                    <div className="h-2 w-8 rounded bg-white/40" />
                    <div className="mt-1 h-1.5 w-10 rounded bg-white/25" />
                    <Sparkles size={14} className="mt-3 text-white/80" />
                </div>
            </div>
            <span className="absolute bottom-1.5 right-2 rounded bg-zinc-900/70 px-1.5 py-0.5 text-[8px] font-medium text-orange-300">Babylon</span>
        </div>
    ),

    "fancy-3d-babylon/engine": () => (
        <div className="w-full max-w-[18rem] overflow-hidden rounded-md border border-zinc-800 bg-zinc-950 font-mono text-[10px] leading-relaxed text-zinc-100">
            <div className="border-b border-zinc-800 px-2 py-1 text-[9px] text-zinc-500">engine adapter · Babylon.js</div>
            <div className="space-y-0.5 p-2.5">
                <div><span className="text-violet-300">import</span> <span className="text-zinc-300">{"{ babylonEngine }"}</span></div>
                <div className="pl-3 text-violet-300">from <span className="text-emerald-300">&quot;…/fancy-3d-babylon/engine&quot;</span></div>
                <div><span className="text-amber-200">&lt;Canvas</span> <span className="text-rose-300">engine</span><span className="text-zinc-400">=</span><span className="text-zinc-300">{"{babylonEngine}"}</span> <span className="text-amber-200">/&gt;</span></div>
            </div>
        </div>
    ),

    // ─── fancy-3d-three ───────────────────────────────────────────────────

    "fancy-3d-three/stage": () => (
        <div className="relative grid h-32 w-full max-w-[20rem] place-items-center overflow-hidden rounded-md border border-zinc-200 bg-gradient-to-b from-emerald-50 to-white dark:border-zinc-700 dark:from-emerald-950/40 dark:to-zinc-950">
            <div className="relative" style={{ perspective: "360px" }}>
                <div className="h-12 w-28 rounded-md bg-gradient-to-br from-cyan-400 to-emerald-500 shadow-xl" style={{ transform: "rotateX(52deg) rotateZ(-6deg)" }} />
                <div className="absolute left-1/2 top-1 size-7 -translate-x-1/2 rounded-full bg-gradient-to-br from-teal-300 to-cyan-500 shadow-lg" />
            </div>
            <span className="absolute bottom-1.5 right-2 rounded bg-zinc-900/70 px-1.5 py-0.5 text-[8px] font-medium text-emerald-300">three.js</span>
        </div>
    ),

    "fancy-3d-three/monitor": () => (
        <div className="relative grid h-32 w-full max-w-[20rem] place-items-center overflow-hidden rounded-md border border-zinc-200 bg-gradient-to-b from-emerald-50 to-white dark:border-zinc-700 dark:from-emerald-950/40 dark:to-zinc-950">
            <div style={{ perspective: "420px" }}>
                <div className="rounded-md border-2 border-zinc-700 bg-zinc-900 p-1 shadow-xl" style={{ transform: "rotateY(-24deg) rotateX(6deg)" }}>
                    <div className="h-12 w-20 rounded-sm bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500" />
                </div>
                <div className="mx-auto mt-0.5 h-1.5 w-6 bg-zinc-700" style={{ transform: "rotateY(-24deg)" }} />
            </div>
            <span className="absolute bottom-1.5 right-2 rounded bg-zinc-900/70 px-1.5 py-0.5 text-[8px] font-medium text-emerald-300">three.js</span>
        </div>
    ),

    "fancy-3d-three/card-3d": () => (
        <div className="relative grid h-32 w-full max-w-[20rem] place-items-center overflow-hidden rounded-md border border-zinc-200 bg-gradient-to-b from-emerald-50 to-white dark:border-zinc-700 dark:from-emerald-950/40 dark:to-zinc-950">
            <div style={{ perspective: "420px" }}>
                <div className="h-20 w-16 rounded-xl bg-gradient-to-br from-emerald-500 to-cyan-600 p-2 shadow-2xl" style={{ transform: "rotateY(-30deg) rotateX(8deg)" }}>
                    <div className="h-2 w-8 rounded bg-white/40" />
                    <div className="mt-1 h-1.5 w-10 rounded bg-white/25" />
                    <Zap size={14} className="mt-3 text-white/80" />
                </div>
            </div>
            <span className="absolute bottom-1.5 right-2 rounded bg-zinc-900/70 px-1.5 py-0.5 text-[8px] font-medium text-emerald-300">three.js</span>
        </div>
    ),

    "fancy-3d-three/engine": () => (
        <div className="w-full max-w-[18rem] overflow-hidden rounded-md border border-zinc-800 bg-zinc-950 font-mono text-[10px] leading-relaxed text-zinc-100">
            <div className="border-b border-zinc-800 px-2 py-1 text-[9px] text-zinc-500">engine adapter · three.js</div>
            <div className="space-y-0.5 p-2.5">
                <div><span className="text-violet-300">import</span> <span className="text-zinc-300">{"{ threeEngine }"}</span></div>
                <div className="pl-3 text-violet-300">from <span className="text-emerald-300">&quot;…/fancy-3d-three/engine&quot;</span></div>
                <div><span className="text-amber-200">&lt;Canvas</span> <span className="text-rose-300">engine</span><span className="text-zinc-400">=</span><span className="text-zinc-300">{"{threeEngine}"}</span> <span className="text-amber-200">/&gt;</span></div>
            </div>
        </div>
    ),

    // ─── fancy-whiteboard (items) ─────────────────────────────────────────

    // fancy-whiteboard — the REAL components. They render in plain DOM and SVG,
    // so nothing here needed deferring; the drawings they replace were SVG
    // re-implementations of components that draw the same SVG themselves.
    "fancy-whiteboard/sticky-note": () => (
        <div className="relative h-32 w-full max-w-[20rem] overflow-hidden rounded-md bg-zinc-50 dark:bg-zinc-900">
            <BoardStickyNote
                item={{ id: "n1", kind: "sticky", x: 14, y: 14, width: 140, height: 90, text: "Ship the preview grid ✨", color: "#fef3c7" }}
                onChange={() => {}}
            />
        </div>
    ),

    "fancy-whiteboard/shape": () => (
        <div className="relative h-32 w-full max-w-[20rem] overflow-hidden rounded-md bg-zinc-50 dark:bg-zinc-900">
            <BoardShape
                item={{ id: "s1", kind: "shape", shape: "rounded-rect", x: 16, y: 16, width: 90, height: 52, fill: "rgba(139,92,246,0.15)", stroke: "#8b5cf6" }}
                onChange={() => {}}
            />
            <BoardShape
                item={{ id: "s2", kind: "shape", shape: "ellipse", x: 170, y: 56, width: 70, height: 52, fill: "rgba(16,185,129,0.15)", stroke: "#10b981" }}
                onChange={() => {}}
            />
        </div>
    ),

    "fancy-whiteboard/connector": () => (
        <div className="relative h-32 w-full max-w-[20rem] overflow-hidden rounded-md bg-zinc-50 dark:bg-zinc-900">
            <svg className="absolute inset-0 size-full">
                <Connector from={{ x: 50, y: 40 }} to={{ x: 240, y: 90 }} />
                <circle cx={50} cy={40} r={5} fill="#64748b" />
                <circle cx={240} cy={90} r={5} fill="#64748b" />
            </svg>
        </div>
    ),

    "fancy-whiteboard/drawing": () => (
        <div className="relative h-32 w-full max-w-[20rem] overflow-hidden rounded-md bg-zinc-50 dark:bg-zinc-900">
            <Drawing strokes={PREVIEW_STROKES} color="#8b5cf6" size={3} />
        </div>
    ),

    "fancy-whiteboard/cursor-layer": () => (
        <div className="relative h-32 w-full max-w-[20rem] overflow-hidden rounded-md bg-zinc-50 dark:bg-zinc-900">
            <BoardStickyNote
                item={{ id: "p", kind: "sticky", x: 12, y: 12, width: 74, height: 48, text: "Plan", color: "#fef3c7" }}
                onChange={() => {}}
            />
            <CursorLayer
                cursors={[
                    { userId: "u1", name: "Ava", color: "#8b5cf6", x: 120, y: 40 },
                    { userId: "u2", name: "Sky", color: "#10b981", x: 200, y: 92 },
                ]}
            />
        </div>
    ),

    // ─── agent-integrations ───────────────────────────────────────────────

    "agent-integrations/agent-cursor": () => (
        <div className="relative h-32 w-full max-w-[20rem] overflow-hidden rounded-md border border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900">
            <AgentCursor x={70} y={38} name="Researcher" />
            <AgentCursor x={190} y={86} name="Reviewer" />
        </div>
    ),

    "agent-integrations/agent-panel": () => (
        <div className="w-full max-w-[20rem] overflow-hidden rounded-md border border-zinc-200 bg-white text-[10px] dark:border-zinc-700 dark:bg-zinc-900">
            <div className="flex items-center justify-between border-b border-zinc-100 bg-zinc-50 px-2 py-1 font-semibold text-zinc-600 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300">
                <span className="flex items-center gap-1"><Sparkles size={11} className="text-violet-500" /> Agents</span>
                <span className="text-zinc-400">2 online</span>
            </div>
            <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                <div className="flex items-center gap-2 px-2 py-1.5">
                    <span className="size-2 rounded-full bg-violet-500" />
                    <span className="font-medium text-zinc-700 dark:text-zinc-200">claude</span>
                    <span className="text-zinc-400">editing sheet · B4</span>
                </div>
                <div className="flex items-center gap-2 px-2 py-1.5">
                    <span className="size-2 rounded-full bg-emerald-500" />
                    <span className="font-medium text-zinc-700 dark:text-zinc-200">scout</span>
                    <span className="text-zinc-400">idle</span>
                </div>
            </div>
        </div>
    ),

    "agent-integrations/share-controls": () => (
        <div className="w-full max-w-[20rem] text-[11px]">
            <ShareControls
                session={{ id: "demo-session-abc", token: "tok_xyz" }}
                onStart={() => {}}
                onStop={() => {}}
                status="connected"
                shareBaseUrl="https://fancy.app/agent-relay"
            />
        </div>
    ),

    "agent-integrations/shared-whiteboard": () => (
        <div className="relative h-32 w-full max-w-[20rem] overflow-hidden rounded-md bg-amber-50/40 dark:bg-amber-900/10">
            <div className="absolute left-3 top-3 size-10 rotate-[-4deg] bg-yellow-200 p-1.5 text-[9px] shadow-sm">Roadmap</div>
            <div className="absolute right-4 bottom-4 size-10 rotate-[3deg] bg-violet-200 p-1.5 text-[9px] text-violet-900 shadow-sm">Ship</div>
            <div className="absolute left-24 top-10">
                <svg width="14" height="14" viewBox="0 0 16 16" className="text-violet-600"><path d="M1 1 L1 13 L4.5 9.5 L7 14 L9 13 L6.5 8.5 L11 8 Z" fill="currentColor" /></svg>
                <span className="ml-1 rounded bg-violet-600 px-1 py-0.5 text-[8px] font-medium text-white">claude</span>
            </div>
            <div className="absolute right-3 top-2 flex items-center gap-1 rounded-full bg-white/80 px-1.5 py-0.5 text-[8px] text-zinc-500 shadow-sm dark:bg-zinc-800/80 dark:text-zinc-300">
                <span className="size-1.5 rounded-full bg-emerald-500" /> 2 present
            </div>
        </div>
    ),

    // An in-page MCP SERVER, not a component — `MicroMcpServer` is a type, and
    // the runtime export is a factory. Nothing to render, so this illustrates
    // the wiring instead.
    "agent-integrations/micro-mcp-server": () => (
        <div className="w-full max-w-[20rem] overflow-hidden rounded-md bg-zinc-950 p-2.5 font-mono text-[9px] leading-relaxed text-zinc-300">
            <div className="mb-1.5 text-[8px] uppercase tracking-wider text-zinc-500">in-browser MCP server</div>
            <div><span className="text-violet-300">const</span> server = microMcpServer()</div>
            <div><span className="text-sky-300">registerWhiteboardBridge</span>(server, {"{…}"})</div>
            <div className="text-emerald-400">✓ whiteboard_* tools live</div>
        </div>
    ),

    // ─── fancy-motion ─────────────────────────────────────────────────────

    "fancy-motion/motion-stage": () => (
        <div className="relative h-32 w-full max-w-[20rem] overflow-hidden rounded-md border border-zinc-200 dark:border-zinc-800">
            <MotionStage timeline={PREVIEW_TIMELINE}>
                <div data-motion="card" className="absolute left-6 top-8 rounded-md bg-violet-500 px-3 py-2 text-[10px] text-white">
                    Tweened
                </div>
            </MotionStage>
        </div>
    ),

    "fancy-motion/timeline-dock": () => (
        <div className="w-full max-w-[20rem] overflow-hidden rounded-md text-[10px]">
            <TimelineDock value={PREVIEW_TIMELINE} onChange={() => {}} progress={0.45} />
        </div>
    ),

    // ─── fancy-cms-ui ─────────────────────────────────────────────────────

    // The real Editor is a 220px | 1fr | 300px interactive three-pane grid —
    // unreadable at card scale — so this tile stays a faithful visual stub of
    // its actual chrome: layers + undo/redo | canvas + selection | inspector.
    "fancy-cms-ui/cms-editor": () => (
        <div className="flex h-32 w-full max-w-[20rem] overflow-hidden rounded-md border border-zinc-200 text-[8px] dark:border-zinc-700">
            <div className="flex w-[4.5rem] shrink-0 flex-col border-r border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900">
                <div className="flex gap-1 border-b border-zinc-100 p-1 dark:border-zinc-800">
                    <span className="rounded border border-zinc-200 px-1 py-0.5 text-zinc-500 dark:border-zinc-700">Undo</span>
                    <span className="rounded border border-zinc-200 px-1 py-0.5 text-zinc-400 opacity-50 dark:border-zinc-700">Redo</span>
                </div>
                <div className="space-y-0.5 p-1">
                    <div className="flex items-center gap-1 rounded bg-sky-50 px-1 py-0.5 font-medium text-sky-700 dark:bg-sky-500/15 dark:text-sky-200"><Layers size={8} /> hero</div>
                    <div className="px-1 py-0.5 pl-2.5 text-zinc-500">heading</div>
                    <div className="px-1 py-0.5 pl-2.5 text-zinc-500">text</div>
                    <div className="px-1 py-0.5 pl-2.5 text-zinc-500">button</div>
                </div>
            </div>
            <div className="min-w-0 flex-1 bg-zinc-50 p-2 dark:bg-zinc-950">
                <div className="relative rounded border-2 border-sky-400 bg-white p-2 dark:bg-zinc-900">
                    <div className="mx-auto h-2 w-2/3 rounded bg-zinc-300 dark:bg-zinc-600" />
                    <div className="mx-auto mt-1 h-1.5 w-1/2 rounded bg-zinc-200 dark:bg-zinc-700" />
                    <div className="mx-auto mt-1.5 h-3 w-12 rounded bg-violet-500" />
                    <span className="absolute -left-1 -top-1 size-2 rounded-full border border-white bg-sky-500" />
                    <span className="absolute -right-1 -top-1 size-2 rounded-full border border-white bg-sky-500" />
                    <span className="absolute -bottom-1 -left-1 size-2 rounded-full border border-white bg-sky-500" />
                    <span className="absolute -bottom-1 -right-1 size-2 rounded-full border border-white bg-sky-500" />
                </div>
                <div className="mt-2 h-5 rounded bg-zinc-100 dark:bg-zinc-800" />
            </div>
            <div className="w-[4.5rem] shrink-0 border-l border-zinc-200 bg-white p-1.5 dark:border-zinc-700 dark:bg-zinc-900">
                <div className="mb-1 font-semibold text-zinc-500">Inspector</div>
                {["padding", "gap", "color"].map((label) => (
                    <div key={label} className="mb-1">
                        <div className="text-zinc-400">{label}</div>
                        <div className="mt-0.5 h-2 rounded border border-zinc-200 dark:border-zinc-700" />
                    </div>
                ))}
            </div>
        </div>
    ),

    // The REAL CmsPage over the canonical demo doc, scale-wrapped to card size.
    "fancy-cms-ui/cms-page": () => (
        <CmsBox><CmsPage doc={CMS_DEMO_DOC} /></CmsBox>
    ),

    // The REAL CmsRegion extracting one subtree (the hero) of the same doc.
    "fancy-cms-ui/cms-region": () => (
        <div className="w-full max-w-[20rem] space-y-1 self-start">
            <div className="font-mono text-[9px] text-zinc-400">root=&quot;{CMS_HERO_ID}&quot; · one subtree of the doc</div>
            <CmsBox><CmsRegion doc={CMS_DEMO_DOC} root={CMS_HERO_ID} /></CmsBox>
        </div>
    ),

    // ─── fancy-flow (headless hooks) ──────────────────────────────────────

    "fancy-flow/use-flow-run": () => (
        <div className="w-full max-w-[18rem] overflow-hidden rounded-md border border-zinc-800 bg-zinc-950 font-mono text-[10px] leading-relaxed text-zinc-100">
            <div className="border-b border-zinc-800 px-2 py-1 text-[9px] text-zinc-500">hook · React runtime</div>
            <div className="space-y-0.5 p-2.5">
                <div><span className="text-sky-300">const</span> <span className="text-amber-200">run</span> <span className="text-zinc-400">=</span> <span className="text-violet-300">useFlowRun</span>(graph)</div>
                <div><span className="text-amber-200">run</span>.<span className="text-violet-300">start</span>()</div>
                <div className="text-emerald-300">run.status → &quot;running&quot;</div>
            </div>
        </div>
    ),

    "fancy-flow/use-flow-state": () => (
        <div className="w-full max-w-[18rem] overflow-hidden rounded-md border border-zinc-800 bg-zinc-950 font-mono text-[10px] leading-relaxed text-zinc-100">
            <div className="border-b border-zinc-800 px-2 py-1 text-[9px] text-zinc-500">hook · controlled graph</div>
            <div className="space-y-0.5 p-2.5">
                <div><span className="text-sky-300">const</span> <span className="text-zinc-300">[graph, setGraph]</span> <span className="text-zinc-400">=</span></div>
                <div className="pl-3"><span className="text-violet-300">useFlowState</span>(initial)</div>
                <div><span className="text-amber-200">setGraph</span>.<span className="text-violet-300">addNode</span>({"{…}"})</div>
            </div>
        </div>
    ),
};

// Generic fallback for components without a custom preview (rare).
export function GenericPlaceholder({ name }: { name: string }) {
    return (
        <div className="grid place-items-center text-center">
            <div className="rounded-lg bg-gradient-to-br from-violet-100 to-sky-100 px-3 py-1.5 font-mono text-xs text-violet-900 ring-1 ring-violet-200 dark:from-violet-500/15 dark:to-sky-500/15 dark:text-violet-100 dark:ring-violet-700">
                {name}
            </div>
            <div className="mt-2 text-[10px] text-zinc-500">Live preview coming soon</div>
        </div>
    );
}
