import type { ReactNode } from "react";
import {
    Avatar,
    Badge,
    Button,
    Card,
    Field,
    Heading,
    Icon,
    Input,
    Progress,
    Stat,
    Callout,
    FileBrowser,
    Table,
    Text,
} from "@particle-academy/react-fancy";
import { CommissionStatement, DownlineTree, RankProgress } from "@particle-academy/fancy-mlm-ui";
import "@particle-academy/fancy-mlm-ui/styles.css";
import {
    CertificateView,
    CoursePlayer,
    CurriculumOverview,
} from "@particle-academy/classroom";
import { FancyDiff } from "@particle-academy/fancy-diff";
// Without this the diff loses `[data-fancy-diff-body] { overflow-x: auto }` and
// long code lines WRAP mid-token instead of scrolling, which destroys the
// line-for-line correspondence a diff exists to show.
import "@particle-academy/fancy-diff/styles.css";
import { EditablePage } from "@particle-academy/fancy-cms-ui/editor";
// The canonical CMS document the package demos already render, so this screen
// cannot drift from a shape the editor is known to accept.
import { CMS_DEMO_DOC } from "../Packages/showcase-fixtures";
import { CommitHistory, WorkingTree } from "@particle-academy/fancy-git-ui";
import "@particle-academy/fancy-git-ui/styles.css";
import { PasskeyStatus } from "@particle-academy/fancy-passkeys-ui";
import "@particle-academy/fancy-passkeys-ui/styles.css";
import { AgentCursor, ShareControls } from "@particle-academy/agent-integrations";
import "@particle-academy/agent-integrations/styles.css";
import { LlmsTxtEditor, RobotsEditor } from "@particle-academy/fancy-x-files-ui";
import { FlowViewer } from "@particle-academy/fancy-flow";
// Verified fixtures, already used by the package demos -- so these screens
// cannot drift from the shapes the components are known to accept.
import { GIT_COMMITS, GIT_STATUS } from "../Packages/gitFixtures";
import { Board, StickyNote as BoardStickyNote } from "@particle-academy/fancy-whiteboard";
import "@particle-academy/fancy-whiteboard/styles.css";
import { PricingTable } from "../../components/fancy/catalog-fms";
// The classroom fixtures already exist and are already exported for the package
// preview tiles. Reusing them means these screens cannot drift from the shapes
// the real components are known to accept.
import { CR_ATTEMPT, CR_COURSE, CR_CURRICULUM, CR_ENROLLMENT } from "../Packages/ComponentPreviews";
import { Map as FancyMap } from "@particle-academy/fancy-map";
import { leafletProvider } from "@particle-academy/fancy-map/leaflet";
// Leaflet ships its own stylesheet and will not fetch it for you. Without this
// the tiles stack 256px apart instead of tiling -- see ListingMap below.
import "leaflet/dist/leaflet.css";
import { clientOnly } from "../../lib/clientOnly";

const listingMapProvider = leafletProvider();

/**
 * Composed mini-screens for `/use-cases/{slug}`.
 *
 * Not component tiles. A tile answers "what does `<Table>` look like"; these
 * answer "what does the SCREEN look like", which is the question someone
 * choosing a stack is actually asking. Each one is a realistic surface —
 * a listing grid, a downline, a commission statement — assembled from real
 * Fancy components with plausible data.
 *
 * Rules for anything added here:
 *
 *  - **Built from the kit.** Every screen composes real `react-fancy` /
 *    `fancy-*` components. If a screen needs something the kit lacks, that is a
 *    finding to file against the package, not a div to hand-roll — the whole
 *    point is that these double as proof the kit can build the thing.
 *  - **Plausible data.** "Product 1 / Product 2" reads as a component demo.
 *    Real-looking addresses, names and amounts read as an application.
 *  - **Compact.** These sit inline in a page, several to a screen. Target
 *    roughly 260–360px tall.
 *  - **No network, no persistence.** Fixtures only; a preview must render the
 *    same on the server and in a cold browser.
 *
 * Anything WebGL/canvas-heavy (the map) goes through `clientOnly` — SSR renders
 * this page, and those libraries do not survive a server pass.
 */

export type UseCaseScreen = {
    /** Shown above the screen. */
    label: string;
    /** One line on what the reader is looking at. */
    caption?: string;
    render: () => ReactNode;
};

/** Shared chrome so every screen reads as a surface rather than a stray card. */
function Frame({ title, action, children }: { title: string; action?: ReactNode; children: ReactNode }) {
    return (
        <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex items-center justify-between gap-3 border-b border-zinc-200 bg-zinc-50/80 px-3 py-2 dark:border-zinc-800 dark:bg-zinc-800/40">
                <span className="text-[11px] font-medium tracking-wide text-zinc-500 uppercase dark:text-zinc-400">
                    {title}
                </span>
                {action}
            </div>
            <div className="p-3">{children}</div>
        </div>
    );
}

const money = (cents: number) =>
    (cents / 100).toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

// ─────────────────────────────────────────────────────── real estate

const LISTINGS = [
    { id: "l1", address: "1420 Larkspur Lane", city: "Boulder, CO", price: 74500000, beds: 4, baths: 3, sqft: 2840, status: "New" },
    { id: "l2", address: "88 Halyard Court", city: "Annapolis, MD", price: 61200000, beds: 3, baths: 2, sqft: 2110, status: "Open Sat" },
    { id: "l3", address: "3007 Mesa Verde Dr", city: "Santa Fe, NM", price: 52900000, beds: 3, baths: 2, sqft: 1960, status: null },
];

function ListingGrid() {
    return (
        <Frame title="Listings" action={<Badge size="sm" variant="soft" color="zinc">128 results</Badge>}>
            <div className="grid gap-2.5 sm:grid-cols-3">
                {LISTINGS.map((l) => (
                    <Card key={l.id} style={{ padding: 0, overflow: "hidden" }}>
                        {/* A photo well. Deliberately a gradient rather than a stock
                            image: a fixture that ships a photo starts rotting the
                            day the photo's licence changes. */}
                        <div className="relative h-16 bg-gradient-to-br from-violet-200 to-sky-200 dark:from-violet-500/25 dark:to-sky-500/25">
                            {l.status && (
                                <span className="absolute top-1.5 left-1.5">
                                    <Badge size="sm" color="violet">{l.status}</Badge>
                                </span>
                            )}
                        </div>
                        <div className="p-2.5">
                            <Text className="!text-[13px] !font-semibold">{money(l.price)}</Text>
                            <Text className="!mt-0.5 !text-[11px] !text-zinc-500">{l.address}</Text>
                            <Text className="!text-[11px] !text-zinc-500">{l.city}</Text>
                            <div className="mt-1.5 flex gap-2 text-[11px] text-zinc-500">
                                <span>{l.beds} bd</span>
                                <span>{l.baths} ba</span>
                                <span>{l.sqft.toLocaleString()} sqft</span>
                            </div>
                        </div>
                    </Card>
                ))}
            </div>
        </Frame>
    );
}

/**
 * This screen was held back for a while behind a "Leaflet measures stale
 * container geometry" bug that did not exist. The container was 588x240 and
 * Leaflet had computed the right tile count for it; the tiles' own transforms
 * were a correct 3x2 grid. Only 1 of 6 landed inside the box because
 * `leaflet/dist/leaflet.css` was never imported on this page, so
 * `.leaflet-tile { position: absolute }` never applied and each tile laid out
 * in normal flow, stacking 256px down the page.
 *
 * Tiles still load and paint without that stylesheet, which is what makes the
 * failure read as geometry rather than CSS. fancy-map 0.2.1 now logs an error
 * naming the import, so the next person does not lose the same afternoon.
 *
 * fancy-map is SSR-safe by design — it renders a sized placeholder on the
 * server and mounts the provider in an effect — so it is imported directly
 * rather than through `clientOnly`, and `leafletProvider()` sits at module
 * scope exactly as the package demo has it.
 */
function ListingMap() {
    return (
        <Frame title="Search area" action={<Badge size="sm" variant="soft" color="zinc">3 shown</Badge>}>
            <div style={{ height: 240 }} className="overflow-hidden rounded-lg">
                <FancyMap
                    provider={listingMapProvider}
                    view={{ center: { lat: 40.015, lng: -105.27 }, zoom: 12 }}
                    markers={[
                        { id: "l1", position: { lat: 40.03, lng: -105.28 }, label: "$745k", icon: "A" },
                        { id: "l2", position: { lat: 40.005, lng: -105.24 }, label: "$612k", icon: "B" },
                        { id: "l3", position: { lat: 39.995, lng: -105.31 }, label: "$529k", icon: "C" },
                    ]}
                />
            </div>
        </Frame>
    );
}

function EnquiryForm() {
    return (
        <Frame title="Request a viewing">
            <div className="grid gap-2.5 sm:grid-cols-2">
                <Field label="Name">
                    <Input defaultValue="Dana Whitfield" data-uc-handle="enquiry-name" />
                </Field>
                <Field label="Email">
                    <Input defaultValue="dana@example.com" data-uc-handle="enquiry-email" />
                </Field>
            </div>
            <Field label="Preferred date" style={{ marginTop: 10 }}>
                <Input defaultValue="Saturday, 22 Aug — 11:00" data-uc-handle="enquiry-slot" />
            </Field>
            <div className="mt-3 flex items-center justify-between">
                <Text className="!text-[11px] !text-zinc-500">Agent replies within 1 business hour</Text>
                <Button size="sm">Request viewing</Button>
            </div>
        </Frame>
    );
}

// ─────────────────────────────────────────────────────────────── MLM

const NETWORK = [
    { id: "m1", label: "Rosa Delgado", tier: "Director", active: true },
    { id: "m2", sponsorId: "m1", label: "Ken Mbeki", tier: "Manager", active: true },
    { id: "m3", sponsorId: "m1", label: "Priya Raman", tier: "Manager", active: true },
    { id: "m4", sponsorId: "m2", label: "Tom Alvarez", tier: "Associate", active: true },
    { id: "m5", sponsorId: "m2", label: "Jo Fenwick", tier: "Associate", active: false },
    { id: "m6", sponsorId: "m3", label: "Ada Okonjo", tier: "Associate", active: true },
];

function DownlineScreen() {
    return (
        <Frame title="Your network" action={<Badge size="sm" variant="soft" color="violet">6 members</Badge>}>
            <div className="max-h-[260px] overflow-auto">
                <DownlineTree value={NETWORK} rootId="m1" edge="sponsor" />
            </div>
        </Frame>
    );
}

function CommissionsScreen() {
    return (
        <Frame title="August statement" action={<Badge size="sm" color="green">Paid</Badge>}>
            <CommissionStatement
                rows={[
                    { id: "c1", level: 1, recipientLabel: "Ken Mbeki", metric: "Personal volume", amount: 240.5, status: "paid" },
                    { id: "c2", level: 1, recipientLabel: "Priya Raman", metric: "Personal volume", amount: 198, status: "paid" },
                    { id: "c3", level: 2, recipientLabel: "Tom Alvarez", metric: "Team volume", amount: 64.25, status: "pending" },
                    { id: "c4", level: 2, recipientLabel: "Jo Fenwick", metric: "Team volume", amount: 31, status: "reversed" },
                ]}
            />
        </Frame>
    );
}

function RankScreen() {
    return (
        <Frame title="Rank progress">
            <RankProgress tier="Manager" nextTier="Director" value={6400} target={10000} unit="TV" />
        </Frame>
    );
}

// ───────────────────────────────────────────────────────── ecommerce

const PRODUCTS = [
    { id: "p1", name: "Field Notebook — A5", price: 1800, tag: "Bestseller" },
    { id: "p2", name: "Machined Pen, Brass", price: 4200, tag: null },
    { id: "p3", name: "Canvas Roll Case", price: 6500, tag: "Low stock" },
    { id: "p4", name: "Refill Pack (×3)", price: 900, tag: null },
];

function Storefront() {
    return (
        <Frame title="Shop" action={<Button size="sm" variant="ghost" icon="shopping-cart">2</Button>}>
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                {PRODUCTS.map((p) => (
                    <Card key={p.id} style={{ padding: 0, overflow: "hidden" }}>
                        <div className="h-14 bg-gradient-to-br from-amber-100 to-rose-100 dark:from-amber-500/20 dark:to-rose-500/20" />
                        <div className="p-2">
                            <Text className="!text-[11px] !leading-tight !font-medium">{p.name}</Text>
                            <div className="mt-1 flex items-center justify-between">
                                <Text className="!text-[11px] !text-zinc-500">{money(p.price)}</Text>
                                {p.tag && <Badge size="sm" variant="soft" color={p.tag === "Low stock" ? "amber" : "green"}>{p.tag}</Badge>}
                            </div>
                        </div>
                    </Card>
                ))}
            </div>
        </Frame>
    );
}

function CartCheckout() {
    return (
        <Frame title="Checkout">
            <div className="space-y-1.5">
                {[
                    ["Field Notebook — A5", 1800],
                    ["Machined Pen, Brass", 4200],
                ].map(([name, cents]) => (
                    <div key={name as string} className="flex items-center justify-between text-[12px]">
                        <span className="text-zinc-600 dark:text-zinc-300">{name as string}</span>
                        <span className="text-zinc-500 tabular-nums">{money(cents as number)}</span>
                    </div>
                ))}
                <div className="flex items-center justify-between border-t border-zinc-200 pt-1.5 text-[12px] dark:border-zinc-800">
                    <span className="font-medium">Total</span>
                    <span className="font-semibold tabular-nums">{money(6000)}</span>
                </div>
            </div>
            <Button size="sm" style={{ marginTop: 12, width: "100%" }}>
                Pay with Stripe
            </Button>
            <Text className="!mt-2 !text-center !text-[10px] !text-zinc-500">
                Checkout session created from your own catalog
            </Text>
        </Frame>
    );
}

// ───────────────────────────────────────── coaching + online courses

/**
 * The REAL `CoursePlayer` from `classroom`, not a lookalike.
 *
 * This screen was first built by hand out of `Icon` and `Progress` — which is
 * precisely the mistake the Fancy Exclusive rule exists to catch. `classroom`
 * ships `CoursePlayer`, `CurriculumOverview`, `LessonView`, `TestRunner`,
 * `QuestionRenderer` and `CertificateView`; hand-rolling a course player next to
 * them makes the page a drawing of the kit rather than a demonstration of it,
 * and hides any gap in the real component instead of surfacing it.
 */
function CoursePlayerScreen() {
    return (
        <Frame title="Course" action={<Badge size="sm" variant="soft" color="violet">Enrolled</Badge>}>
            <div className="max-h-[300px] overflow-auto text-[13px]">
                <CoursePlayer
                    course={CR_COURSE}
                    enrollment={CR_ENROLLMENT}
                    completedLessonIds={new Set<number>()}
                    onMarkLessonComplete={() => {}}
                    onStartAttempt={async () => CR_ATTEMPT}
                    onSubmitAttempt={async () => CR_ATTEMPT}
                />
            </div>
        </Frame>
    );
}

function CurriculumScreen() {
    return (
        <Frame title="Curriculum" action={<Badge size="sm" variant="soft" color="zinc">4 courses</Badge>}>
            <div className="max-h-[300px] overflow-auto text-[13px]">
                <CurriculumOverview curriculum={CR_CURRICULUM} />
            </div>
        </Frame>
    );
}

function CertificateScreen() {
    return (
        <Frame title="Certificate" action={<Badge size="sm" color="green">Issued</Badge>}>
            <div className="max-h-[280px] overflow-auto text-[13px]">
                <CertificateView
                    certificate={{
                        id: 1,
                        enrollment_id: 1,
                        verification_code: "FANCY-2026-0001",
                        issued_at: "2026-08-01T00:00:00Z",
                        pdf_path: null,
                        metadata: null,
                    }}
                    pdfUrl="#"
                />
            </div>
        </Frame>
    );
}

function Gradebook() {
    const rows = [
        { name: "Dana Whitfield", progress: 100, score: "94%", status: "Certified" },
        { name: "Marcus Iyer", progress: 62, score: "—", status: "In progress" },
        { name: "Sofia Bergman", progress: 25, score: "—", status: "At risk" },
    ];
    return (
        <Frame title="Cohort" action={<Badge size="sm" variant="soft" color="zinc">12 learners</Badge>}>
            <Table>
                <Table.Head>
                    <Table.Row>
                        <Table.Column label="Learner" />
                        <Table.Column label="Progress" />
                        <Table.Column label="Score" />
                        <Table.Column label="Status" />
                    </Table.Row>
                </Table.Head>
                <Table.Body>
                    {rows.map((r) => (
                        <Table.Row key={r.name} data-uc-handle={`learner-${r.name.split(" ")[0].toLowerCase()}`}>
                            <Table.Cell>
                                <span className="flex items-center gap-1.5">
                                    <Avatar fallback={r.name.split(" ").map((w) => w[0]).join("")} size="xs" />
                                    <span className="text-[12px]">{r.name}</span>
                                </span>
                            </Table.Cell>
                            <Table.Cell>
                                <Progress value={r.progress} size="sm" />
                            </Table.Cell>
                            <Table.Cell>{r.score}</Table.Cell>
                            <Table.Cell>
                                <Badge
                                    size="sm"
                                    variant="soft"
                                    color={r.status === "Certified" ? "green" : r.status === "At risk" ? "amber" : "zinc"}
                                >
                                    {r.status}
                                </Badge>
                            </Table.Cell>
                        </Table.Row>
                    ))}
                </Table.Body>
            </Table>
        </Frame>
    );
}

// ────────────────────────────────────────────────────── SaaS / plans

function PlanPicker() {
    return (
        <Frame title="Plans">
            <PricingTable
                plans={[
                    {
                        id: "starter",
                        name: "Starter",
                        prices: [{ id: "s-m", amount: 1900, currency: "usd", interval: "month" }],
                        highlights: ["3 projects", "1 seat"],
                    },
                    {
                        id: "team",
                        name: "Team",
                        recommended: true,
                        badge: "Most popular",
                        prices: [{ id: "t-m", amount: 4900, currency: "usd", interval: "month" }],
                        highlights: ["Unlimited projects", "10 seats", "Audit log"],
                    },
                    {
                        id: "scale",
                        name: "Scale",
                        prices: [{ id: "x-m", amount: 14900, currency: "usd", interval: "month" }],
                        highlights: ["SSO", "Priority support"],
                    },
                ]}
                defaultInterval="month"
            />
        </Frame>
    );
}

function UsageAndLimits() {
    return (
        <Frame title="Usage this period" action={<Badge size="sm" variant="soft" color="violet">Team</Badge>}>
            <Stat.Band columns={3}>
                <Stat value="8,420" label="API calls" size="sm" />
                <Stat value="6 / 10" label="Seats" size="sm" />
                <Stat value="92%" label="Storage" size="sm" />
            </Stat.Band>
            <div className="mt-3 space-y-2">
                {[
                    ["API calls", 84],
                    ["Seats", 60],
                    ["Storage", 92],
                ].map(([label, pct]) => (
                    <div key={label as string}>
                        <div className="flex items-center justify-between text-[11px] text-zinc-500">
                            <span>{label as string}</span>
                            <span className="tabular-nums">{pct as number}%</span>
                        </div>
                        <Progress value={pct as number} size="sm" color={(pct as number) > 90 ? "amber" : "violet"} />
                    </div>
                ))}
            </div>
            <Text className="!mt-2.5 !text-[10px] !text-zinc-500">
                Storage is over 90% — the gate returns a soft-limit warning before it denies.
            </Text>
        </Frame>
    );
}

// ───────────────────────────────────────────────────────── dashboard

const AnalyticsChart = clientOnly(async () => {
    const { EChart, registerAll } = await import("@particle-academy/fancy-echarts");
    registerAll();
    function AnalyticsChartInner() {
        return (
            <Frame title="Revenue" action={<Badge size="sm" variant="soft" color="green">+12.4%</Badge>}>
                <Stat.Band columns={3}>
                    <Stat value="$48.2k" label="MRR" size="sm" />
                    <Stat value="1,284" label="Active" size="sm" />
                    <Stat value="2.1%" label="Churn" size="sm" />
                </Stat.Band>
                <div className="mt-2">
                    <EChart
                        style={{ height: 160 }}
                        option={{
                            grid: { left: 34, right: 8, top: 12, bottom: 22 },
                            xAxis: { type: "category", data: ["Mar", "Apr", "May", "Jun", "Jul", "Aug"] },
                            yAxis: { type: "value" },
                            series: [
                                { type: "bar", data: [28, 31, 34, 39, 43, 48], itemStyle: { color: "#8b5cf6", borderRadius: [3, 3, 0, 0] } },
                            ],
                        }}
                    />
                </div>
            </Frame>
        );
    }
    return { default: AnalyticsChartInner };
});


// ──────────────────────────────────────────── review, canvas, code

/**
 * A real unified diff rather than a mocked one: `FancyDiff` parses git's own
 * format, so the fixture is the thing a consumer would actually feed it. The
 * `review` variant is the default and carries the per-hunk accept/reject UX --
 * which is the entire point when an agent proposed the change.
 */
const PROPOSED_DIFF = `--- a/app/Support/Pricing.php
+++ b/app/Support/Pricing.php
@@ -12,9 +12,11 @@ class Pricing
     public function monthly(Plan $plan): int
     {
-        return $plan->amount;
+        // Annual plans quote a monthly-equivalent, so the page can compare
+        // like with like instead of showing a yearly figure beside a monthly one.
+        return $plan->interval === 'year'
+            ? intdiv($plan->amount, 12)
+            : $plan->amount;
     }
 }
`;

function DiffReview() {
    return (
        <Frame title="Proposed by agent" action={<Badge size="sm" variant="soft" color="amber">2 hunks</Badge>}>
            <div className="max-h-[280px] overflow-auto text-[12px]">
                <FancyDiff source={{ unified: PROPOSED_DIFF }} />
            </div>
        </Frame>
    );
}

function SharedCanvas() {
    return (
        <Frame title="Shared board" action={<Badge size="sm" variant="soft" color="violet">2 present</Badge>}>
            <div style={{ height: 240 }} className="overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-800">
                <Board className="h-full w-full" viewport={{ x: 0, y: 0, zoom: 0.72 }} onViewportChange={() => {}}>
                    <BoardStickyNote
                        item={{ id: "a", kind: "sticky", x: 20, y: 16, width: 150, height: 84, text: "Cut scope to one surface", color: "#fef3c7" }}
                        onChange={() => {}}
                    />
                    <BoardStickyNote
                        item={{ id: "b", kind: "sticky", x: 200, y: 52, width: 150, height: 84, text: "Agent drafts, human approves", color: "#ede9fe" }}
                        onChange={() => {}}
                    />
                    <BoardStickyNote
                        item={{ id: "c", kind: "sticky", x: 90, y: 140, width: 150, height: 84, text: "Ship Thursday", color: "#d1fae5" }}
                        onChange={() => {}}
                    />
                </Board>
            </div>
        </Frame>
    );
}

/**
 * `fancy-code`'s editor is CodeMirror-backed and touches the DOM at import, so
 * it loads client-only with a plain `<pre>` standing in during SSR — the same
 * shape `CodeSample` uses on this page's code blocks.
 */
const CodeSurface = clientOnly(async () => {
    const { CodeEditor } = await import("@particle-academy/fancy-code");
    function CodeSurfaceInner() {
        return (
            <Frame title="Editor" action={<Badge size="sm" variant="soft" color="zinc">TypeScript</Badge>}>
                <div className="max-h-[260px] overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-800">
                    <CodeEditor
                        value={`export function total(items: LineItem[]): number {\n  return items.reduce((sum, i) => sum + i.amount * i.qty, 0);\n}`}
                        language="typescript"
                        readOnly
                        lineNumbers
                        minHeight={0}
                        maxHeight={240}
                    >
                        <CodeEditor.Panel />
                    </CodeEditor>
                </div>
            </Frame>
        );
    }
    return { default: CodeSurfaceInner };
});


// ───────────────────────────────────────────── git, auth, spreadsheet

function GitHistory() {
    return (
        <Frame title="Repository" action={<Badge size="sm" variant="soft" color="zinc">main</Badge>}>
            <div className="grid gap-3 text-[12px] lg:grid-cols-2">
                <div className="max-h-[260px] overflow-auto">
                    <CommitHistory value={GIT_COMMITS} selectedId={GIT_COMMITS[0].id} />
                </div>
                <div className="max-h-[260px] overflow-auto">
                    <WorkingTree value={GIT_STATUS} selectedPaths={[]} />
                </div>
            </div>
        </Frame>
    );
}

function PasskeySurface() {
    return (
        <Frame title="Sign in" action={<Badge size="sm" color="green">Supported</Badge>}>
            <div className="text-[12px]">
                <PasskeyStatus supported platformAuthenticator conditionalUi />
            </div>
            <Text className="!mt-3 !text-[11px] !text-zinc-500">
                The management surface is bridgeable; the CEREMONY is not. No MCP tool completes a passkey
                ceremony, because a gesture plus a biometric is something only the human has.
            </Text>
        </Frame>
    );
}

/**
 * The REAL `SheetWorkbook`, formulas and all — this is the surface an agent
 * fills, so a picture of a grid would prove nothing.
 *
 * Two constraints, both learned from the package demo rather than guessed:
 * it is heavy and DOM-bound, so it loads client-only; and the seed is built by
 * CLONING `createEmptyWorkbook()`'s sheet rather than hand-writing `SheetData`,
 * because a hand-built sheet is missing required fields (column widths, row
 * heights) and crashes the renderer.
 */
const Spreadsheet = clientOnly(async () => {
    const { SheetWorkbook, createEmptyWorkbook } = await import("@particle-academy/fancy-sheets");
    // Loaded here rather than at module scope because the component is, and for
    // the same reason the terminal below imports xterm's CSS in its own loader:
    // the stylesheet has to travel with the chunk that renders the component,
    // not with whichever page happened to import it first.
    await import("@particle-academy/fancy-sheets/styles.css");

    const money = { displayFormat: "currency" as const };
    const wb = createEmptyWorkbook();
    const base = wb.sheets[0];
    const seed = {
        ...wb,
        sheets: [
            {
                ...base,
                name: "Q1 Sales",
                cells: {
                    A1: { value: "Region", format: { bold: true } },
                    B1: { value: "Jan", format: { bold: true, textAlign: "right" as const } },
                    C1: { value: "Feb", format: { bold: true, textAlign: "right" as const } },
                    D1: { value: "Total", format: { bold: true, textAlign: "right" as const } },
                    A2: { value: "North" },
                    B2: { value: 1200, format: money },
                    C2: { value: 1450, format: money },
                    D2: { value: 0, formula: "SUM(B2:C2)", format: money },
                    A3: { value: "South" },
                    B3: { value: 980, format: money },
                    C3: { value: 1100, format: money },
                    D3: { value: 0, formula: "SUM(B3:C3)", format: money },
                    A4: { value: "Total", format: { bold: true } },
                    B4: { value: 0, formula: "SUM(B2:B3)", format: { bold: true, ...money } },
                    C4: { value: 0, formula: "SUM(C2:C3)", format: { bold: true, ...money } },
                    D4: { value: 0, formula: "SUM(D2:D3)", format: { bold: true, ...money } },
                },
            },
        ],
    };

    function SpreadsheetInner() {
        return (
            <Frame title="Workbook" action={<Badge size="sm" variant="soft" color="violet">live formulas</Badge>}>
                <div style={{ height: 260 }} className="overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-800">
                    <SheetWorkbook data={seed} onChange={() => {}} rowCount={12} columnCount={6} />
                </div>
            </Frame>
        );
    }
    return { default: SpreadsheetInner };
});


// ──────────────────────────────────── co-browse, well-known, terminal

function CoBrowseSurface() {
    return (
        <Frame title="Your app, co-driven" action={<Badge size="sm" variant="soft" color="violet">2 agents</Badge>}>
            {/* A stand-in page body: the point of this screen is the PRESENCE
                layer over it, which is real. */}
            <div className="relative h-[190px] overflow-hidden rounded-lg border border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900/60">
                <div className="space-y-2 p-3">
                    <div className="h-2.5 w-1/3 rounded bg-zinc-200 dark:bg-zinc-800" />
                    <div className="h-2 w-2/3 rounded bg-zinc-200/70 dark:bg-zinc-800/70" />
                    <div className="h-2 w-1/2 rounded bg-zinc-200/70 dark:bg-zinc-800/70" />
                    <div className="mt-3 h-7 w-28 rounded-md bg-violet-200/70 dark:bg-violet-500/25" />
                </div>
                <AgentCursor x={132} y={54} name="Researcher" />
                <AgentCursor x={224} y={124} name="Reviewer" />
            </div>
            <Text className="!mt-2.5 !text-[11px] !text-zinc-500">
                Agents act through MCP tools on stable handles — never Playwright, never DOM scraping.
            </Text>
        </Frame>
    );
}

function ShareSurface() {
    return (
        <Frame title="Hand over the session">
            <div className="text-[12px]">
                <ShareControls
                    session={{ id: "SgzsLgbC", token: "tok_example", display: "tok_exam" }}
                    onStart={() => {}}
                    onStop={() => {}}
                    status="connected"
                    shareBaseUrl="https://fancy.gen/agent-relay"
                />
            </div>
        </Frame>
    );
}

/**
 * The well-known files, edited as STRUCTURE rather than as text. That is the
 * whole argument of the package: `robots.txt` hand-edited in a textarea is how a
 * site ends up disallowing the path it meant to protect.
 */
function WellKnownFiles() {
    return (
        <Frame title="Crawlability" action={<Badge size="sm" variant="soft" color="zinc">robots · llms</Badge>}>
            <div className="grid gap-3 text-[12px] lg:grid-cols-2">
                <div className="max-h-[250px] overflow-auto rounded-lg border border-zinc-200 p-2 dark:border-zinc-800">
                    <RobotsEditor
                        value={{
                            groups: [{ userAgents: ["*"], allow: ["/"], disallow: ["/admin", "/api"] }],
                            sitemaps: ["https://acme.dev/sitemap.xml"],
                            protectedPaths: ["/admin"],
                        }}
                        onChange={() => {}}
                        hideIssues
                    />
                </div>
                <div className="max-h-[250px] overflow-auto rounded-lg border border-zinc-200 p-2 dark:border-zinc-800">
                    <LlmsTxtEditor
                        value={{
                            title: "Acme Docs",
                            summary: "Everything an LLM needs to use Acme.",
                            sections: [
                                { name: "Guides", links: [{ title: "Quickstart", url: "https://acme.dev/quickstart" }] },
                            ],
                        }}
                        onChange={() => {}}
                        hideIssues
                    />
                </div>
            </div>
        </Frame>
    );
}

/**
 * The REAL `<Terminal>`, not the ASCII stand-in the package tile uses.
 *
 * `output` is a CONTROLLED buffer — the component diffs and writes only the
 * appended delta — which is exactly what lets an agent and a human write to the
 * same session. Client-only because xterm is CJS and does not survive the
 * server pass; the same reason the other terminal surfaces on this site load
 * that way.
 */
const TerminalSession = clientOnly(async () => {
    const { Terminal } = await import("@particle-academy/fancy-term");
    // NOT a fancy-term stylesheet -- it exports "." only. This is xterm's own
    // CSS, and it is REQUIRED: without it xterm's character-measurement helper
    // (a long run of "w") renders as visible text over the output.
    await import("@xterm/xterm/css/xterm.css");

    const OUTPUT = [
        "\u001b[35mFancy Term\u001b[0m — a Human+ terminal.",
        "",
        "$ npm run build",
        "\u001b[32m✓ built in 1.2s\u001b[0m",
        "",
        "\u001b[36m[agent]\u001b[0m running the suite…",
        "$ php artisan test --compact",
        "\u001b[32m880 passed\u001b[0m",
        "$ ",
    ].join("\r\n");

    function TerminalSessionInner() {
        return (
            <Frame title="Shared session" action={<Badge size="sm" variant="soft" color="violet">agent + human</Badge>}>
                <div style={{ height: 220 }} className="overflow-hidden rounded-lg">
                    <Terminal output={OUTPUT} readOnly style={{ height: "100%" }} />
                </div>
            </Frame>
        );
    }
    return { default: TerminalSessionInner };
});


// ─────────────────────────────────────────────── workflows, analytics

/**
 * `FlowViewer`, not `FlowEditor`.
 *
 * The editor was the obvious first reach and the wrong one: it is a full
 * authoring IDE — node palette, Run button, run feed, config inspector — and at
 * an embedded height it renders all of that chrome with no room left for the
 * graph. Measured: the canvas was invisible.
 *
 * The viewer is the read-only surface for exactly this, and `statuses` is what
 * makes the point of the page: the approval node sits `pending` while every step
 * before it is `ok`. It is SSR-safe (the docs embeds import it directly), so no
 * client-only wrapper is needed.
 */
const APPROVAL_GRAPH = {
    nodes: [
        { id: "t", type: "webhook_trigger", position: { x: 0, y: 80 }, data: { kind: "webhook_trigger", label: "Expense filed", config: {} } },
        { id: "d", type: "condition", position: { x: 220, y: 80 }, data: { kind: "condition", label: "Over £500?", config: {} } },
        { id: "a", type: "human_approval", position: { x: 440, y: 80 }, data: { kind: "human_approval", label: "Manager approves", config: {} } },
        { id: "o", type: "output", position: { x: 660, y: 80 }, data: { kind: "output", label: "Reimburse", config: {} } },
    ],
    edges: [
        { id: "e1", source: "t", target: "d" },
        { id: "e2", source: "d", target: "a" },
        { id: "e3", source: "a", target: "o" },
    ],
} as never;

function ApprovalFlow() {
    return (
        <Frame title="Workflow" action={<Badge size="sm" variant="soft" color="amber">paused at the gate</Badge>}>
            <div className="text-[12px]">
                <FlowViewer
                    graph={APPROVAL_GRAPH}
                    variant="list"
                    statuses={{ t: "ok", d: "ok", a: "pending", o: "pending" } as never}
                />
            </div>
            <Text className="!mt-2 !text-[11px] !text-zinc-500">
                The run stops at the approval node and persists — no worker is held open while it waits.
            </Text>
        </Frame>
    );
}

/**
 * Durable runs are a LIST, not a canvas. The interesting state is which runs are
 * paused, waiting on whom, and since when — a graph tells you none of that.
 */
function RunHistory() {
    const runs = [
        { id: "run_8f21", flow: "Expense approval", status: "Awaiting approval", who: "M. Iyer", age: "2h" },
        { id: "run_8f19", flow: "Expense approval", status: "Completed", who: "—", age: "5h" },
        { id: "run_8f04", flow: "Onboarding", status: "Resumed after restart", who: "—", age: "1d" },
        { id: "run_8ef7", flow: "Nightly digest", status: "Failed · retrying", who: "—", age: "1d" },
    ];
    const tone = (s: string) =>
        s.startsWith("Awaiting") ? "amber" : s.startsWith("Failed") ? "red" : s.startsWith("Resumed") ? "violet" : "green";

    return (
        <Frame title="Runs" action={<Badge size="sm" variant="soft" color="zinc">last 24h</Badge>}>
            <Table>
                <Table.Head>
                    <Table.Row>
                        <Table.Column label="Run" />
                        <Table.Column label="Workflow" />
                        <Table.Column label="State" />
                        <Table.Column label="Waiting on" />
                        <Table.Column label="Age" />
                    </Table.Row>
                </Table.Head>
                <Table.Body>
                    {runs.map((r) => (
                        <Table.Row key={r.id} data-uc-handle={`run-${r.id}`}>
                            <Table.Cell><span className="font-mono text-[11px]">{r.id}</span></Table.Cell>
                            <Table.Cell>{r.flow}</Table.Cell>
                            <Table.Cell>
                                {/* Status carries its own words, not just a colour. */}
                                <Badge size="sm" variant="soft" color={tone(r.status) as never}>{r.status}</Badge>
                            </Table.Cell>
                            <Table.Cell>{r.who}</Table.Cell>
                            <Table.Cell>{r.age}</Table.Cell>
                        </Table.Row>
                    ))}
                </Table.Body>
            </Table>
            <Text className="!mt-2 !text-[11px] !text-zinc-500">
                A paused run is a database row, not a held process — which is why it survives a deploy.
            </Text>
        </Frame>
    );
}

const UsageAnalytics = clientOnly(async () => {
    const { EChart, registerAll } = await import("@particle-academy/fancy-echarts");
    registerAll();
    function UsageAnalyticsInner() {
        return (
            <Frame title="Interaction" action={<Badge size="sm" variant="soft" color="zinc">first-party</Badge>}>
                <Stat.Band columns={3}>
                    <Stat value="6.2k" label="Sessions" size="sm" />
                    <Stat value="41%" label="Reached checkout" size="sm" />
                    <Stat value="12%" label="Rage clicks" size="sm" />
                </Stat.Band>
                <div className="mt-2">
                    <EChart
                        style={{ height: 150 }}
                        option={{
                            grid: { left: 90, right: 10, top: 6, bottom: 18 },
                            xAxis: { type: "value" },
                            yAxis: { type: "category", data: ["Checkout", "Cart", "Product", "Search", "Home"] },
                            series: [
                                { type: "bar", data: [820, 1490, 2600, 3100, 6200], itemStyle: { color: "#8b5cf6", borderRadius: [0, 3, 3, 0] } },
                            ],
                        }}
                    />
                </div>
                <Text className="!mt-1.5 !text-[11px] !text-zinc-500">
                    Collected by your own server — no third-party pixel on an authenticated surface.
                </Text>
            </Frame>
        );
    }
    return { default: UsageAnalyticsInner };
});


// ─────────────────────────────────────────── office documents, CMS

/**
 * The document writers are HEADLESS -- holy-sheet, dark-slide and last-word
 * render nothing, they emit xlsx/pptx/docx bytes. So the honest screen is not a
 * preview of a document; it is what the app has on disk after an agent has been
 * asked for a quarterly pack.
 *
 * `FileBrowser` in snapshot mode is the right surface for that: JSON-friendly
 * entries an agent can emit directly, no provider and no network.
 */
const GENERATED_DOCS = [
    {
        path: "/reports",
        name: "reports",
        kind: "dir" as const,
        children: [
            { path: "/reports/Q3-forecast.xlsx", name: "Q3-forecast.xlsx", kind: "file" as const, size: 48213, mtime: "2026-08-18T09:12:00Z" },
            { path: "/reports/Revenue-by-region.xlsx", name: "Revenue-by-region.xlsx", kind: "file" as const, size: 31980, mtime: "2026-08-18T09:12:04Z" },
            { path: "/reports/Board-review.pptx", name: "Board-review.pptx", kind: "file" as const, size: 184402, mtime: "2026-08-18T09:12:11Z" },
            { path: "/reports/Statement-of-work.docx", name: "Statement-of-work.docx", kind: "file" as const, size: 27644, mtime: "2026-08-18T09:12:15Z" },
        ],
    },
];

/** Which package wrote which extension — the point of the pairing. */
const WRITER_FOR: Record<string, string> = {
    xlsx: "holy-sheet",
    pptx: "dark-slide",
    docx: "last-word",
};

function GeneratedDocuments() {
    return (
        <Frame
            title="Generated this morning"
            action={<Badge size="sm" variant="soft" color="emerald">4 files</Badge>}
        >
            <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
                <div style={{ height: 210 }} className="overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-800">
                    <FileBrowser snapshot={GENERATED_DOCS} path="/reports" defaultValue="/reports/Q3-forecast.xlsx" />
                </div>
                <div className="flex flex-col gap-1.5 sm:w-40">
                    {Object.entries(WRITER_FOR).map(([ext, pkg]) => (
                        <div key={ext} className="flex items-center justify-between gap-2 rounded-md border border-zinc-200 px-2 py-1.5 dark:border-zinc-800">
                            <Badge size="sm" variant="soft" color="zinc">.{ext}</Badge>
                            <Text size="xs" color="muted">{pkg}</Text>
                        </div>
                    ))}
                    <Text size="xs" color="muted" className="!mt-1">
                        Each ships a PHP and a Node twin, same API.
                    </Text>
                </div>
            </div>
        </Frame>
    );
}

/**
 * `EditablePage`, NOT the full `Editor`.
 *
 * The three-pane editor (tree | canvas | inspector) is the authoring IDE, and it
 * needs roughly 900px before the canvas is usable. Dropped into this ~500px
 * column it renders the page one character per line -- which is how the first
 * version of this screen shipped, and the same mistake `FlowEditor` made here
 * before it became `FlowViewer`.
 *
 * `EditablePage` is also the better answer to the question the page is asking.
 * "Let non-developers edit pages" is not "give marketing an IDE" -- it is edit
 * the copy where it sits. That surface is single-pane and reads correctly small.
 *
 * `pinned={false}` because the default turns the page into a scroll canvas whose
 * playhead is the window scroll; inside a preview that hijacks the page.
 * No registry: this document uses built-in node types, and a registry is only
 * needed to map CUSTOM kinds onto your own components.
 */
const PageEditor = clientOnly(async () => {
    function PageEditorInner() {
        return (
            <Frame title="Marketing site" action={<Badge size="sm" variant="soft" color="violet">Edit in place</Badge>}>
                <div style={{ height: 280 }} className="overflow-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
                    <EditablePage doc={CMS_DEMO_DOC} pinned={false} />
                </div>
            </Frame>
        );
    }
    return { default: PageEditorInner };
});


// ─────────────────────────────────────────────────────────────── pwa

/**
 * The PWA surfaces are all CONDITION-GATED -- `AppUpdateAlert`, `InstallBanner`
 * and `OfflineBanner` each return null until the real thing happens (a waiting
 * service worker, a beforeinstallprompt, `navigator.onLine === false`). Dropping
 * them in here would render an empty box, and faking a service worker in a
 * preview would be a lie about what the reader is looking at.
 *
 * So this screen takes the packages' OWN documented custom-UX path instead:
 * `useAppUpdate` is the detector, `AppUpdateAlert` exposes `render({ refresh,
 * dismiss })` for hosts that want their own prompt, and this is what that prompt
 * looks like when built from `Callout` -- which is exactly what `OfflineBanner`
 * is built from too.
 *
 * The built-in drop-in is a FIXED-POSITION portal, which is right for an app and
 * wrong for a 300px preview. That the gated components cannot be previewed or
 * designed against without going offline for real is a genuine gap, logged
 * rather than papered over.
 */
function PwaStates() {
    return (
        <Frame title="Running app" action={<Badge size="sm" variant="soft" color="violet">v2026.8.18</Badge>}>
            <div className="flex flex-col gap-2.5">
                <Callout color="violet">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                            <Text size="sm" weight="semibold">Update available</Text>
                            <Text size="xs" color="muted">
                                A new version is available — refresh to get the latest.
                            </Text>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <Button size="sm" onClick={() => {}}>Refresh</Button>
                            <Button size="sm" variant="ghost" onClick={() => {}}>Later</Button>
                        </div>
                    </div>
                </Callout>

                <Callout color="amber">
                    <Text size="sm">
                        You&rsquo;re offline. Some features may be unavailable until you reconnect.
                    </Text>
                </Callout>

                <Text size="xs" color="muted">
                    The detector is <code>useAppUpdate()</code>; the offline notice is
                    {" "}<code>&lt;OfflineBanner /&gt;</code>. Both ship gated, so a real app shows
                    neither until it should.
                </Text>
            </div>
        </Frame>
    );
}


/**
 * Live tracking, which is the thing maps are usually FOR and the thing most
 * wrappers leave you to build. `follow` names a marker and the map recenters on
 * it whenever its position changes -- so the moving part is a prop, not a
 * subscription you wire yourself.
 *
 * Static here on purpose: these previews have to render the same on the server
 * and in a cold browser, so the trail is a fixed set of breadcrumbs rather than
 * a timer. In an app the positions come from `useGeolocationTrack` or your own
 * socket, and only the `markers` array changes.
 */
const TRACK = [
    { id: "t-3", position: { lat: 40.0182, lng: -105.2812 }, icon: "", color: "#a1a1aa" },
    { id: "t-2", position: { lat: 40.0169, lng: -105.2764 }, icon: "", color: "#a1a1aa" },
    { id: "t-1", position: { lat: 40.0157, lng: -105.2719 }, icon: "", color: "#a1a1aa" },
    { id: "van", position: { lat: 40.0146, lng: -105.2668 }, label: "Van 12", icon: "V", color: "#2563eb" },
];

function LiveTracking() {
    return (
        <Frame
            title="Van 12"
            action={<Badge size="sm" variant="soft" color="emerald">Following</Badge>}
        >
            <div style={{ height: 240 }} className="overflow-hidden rounded-lg">
                <FancyMap
                    provider={listingMapProvider}
                    view={{ center: { lat: 40.0164, lng: -105.274 }, zoom: 14 }}
                    markers={TRACK}
                    follow="van"
                />
            </div>
        </Frame>
    );
}

// ───────────────────────────────────────────────────────── the registry

export const USE_CASE_SCREENS: Record<string, UseCaseScreen> = {
    "real-estate/listings": {
        label: "Listing grid",
        caption: "Cards, badges and typography straight from react-fancy — no bespoke CSS.",
        render: () => <ListingGrid />,
    },
    "real-estate/map": {
        label: "Map search",
        caption: "fancy-map over OpenStreetMap; the same component swaps to Google without touching your code.",
        render: () => <ListingMap />,
    },
    "map/tracking": {
        label: "Live tracking",
        caption: "Name a marker with the follow prop and the map recenters as it moves — the moving part is a prop, not a subscription you write.",
        render: () => <LiveTracking />,
    },
    "real-estate/enquiry": {
        label: "Viewing request",
        caption: "Controlled fields with stable handles, so an agent can fill this without scraping the DOM.",
        render: () => <EnquiryForm />,
    },
    "mlm/downline": {
        label: "Downline tree",
        caption: "fancy-mlm-ui renders unilevel, binary and matrix trees from the same JSON.",
        render: () => <DownlineScreen />,
    },
    "mlm/commissions": {
        label: "Commission statement",
        caption: "Reversed rows are struck through and excluded from the paid total.",
        render: () => <CommissionsScreen />,
    },
    "mlm/rank": {
        label: "Rank progress",
        caption: "Thresholds come from your compensation plan, not the component.",
        render: () => <RankScreen />,
    },
    "ecommerce/storefront": {
        label: "Storefront",
        caption: "A product grid over your own catalog — prices live in your database, synced to Stripe.",
        render: () => <Storefront />,
    },
    "ecommerce/checkout": {
        label: "Cart and checkout",
        caption: "The checkout session comes from the catalog facade, so no Stripe-specific code reaches your controllers.",
        render: () => <CartCheckout />,
    },
    "courses/player": {
        label: "Course player",
        caption: "The real <CoursePlayer> from classroom — modules, lessons, progress and the graded test.",
        render: () => <CoursePlayerScreen />,
    },
    "courses/curriculum": {
        label: "Curriculum overview",
        caption: "A curriculum and its courses, with enrollment state — classroom's <CurriculumOverview>.",
        render: () => <CurriculumScreen />,
    },
    "courses/certificate": {
        label: "Certificate",
        caption: "An issued certificate and its verification code. Literal-coloured on purpose, so it looks the same on every theme.",
        render: () => <CertificateScreen />,
    },
    "courses/gradebook": {
        label: "Cohort gradebook",
        // Composed rather than a package component ON PURPOSE: classroom ships
        // the learner-facing surfaces, and a coach-facing gradebook is not one
        // of them. If that keeps coming up it is a gap to file against
        // classroom, not a reason to keep hand-rolling it in more places.
        caption: "Composed from <Table>, <Avatar> and <Progress> — the coach-facing view classroom does not ship.",
        render: () => <Gradebook />,
    },
    "saas/plans": {
        label: "Plan picker",
        caption: "The vendorable catalog-fms block — copied into your project, then yours to restyle.",
        render: () => <PlanPicker />,
    },
    "saas/usage": {
        label: "Usage and limits",
        caption: "Metered features from laravel-fms, showing remaining allowance before the gate denies.",
        render: () => <UsageAndLimits />,
    },
    "flow/approval": {
        label: "Workflow with a human gate",
        caption: "The real <FlowViewer> with live run statuses — every step OK until the approval node, which sits pending until a person decides.",
        render: () => <ApprovalFlow />,
    },
    "flow/runs": {
        label: "Durable runs",
        caption: "A paused run is a database row, not a held process, so it survives a deploy.",
        render: () => <RunHistory />,
    },
    "analytics/usage": {
        label: "How the app is used",
        caption: "First-party interaction analytics — collected by your own server, not a third-party pixel.",
        render: () => <UsageAnalytics />,
    },
    "agent/cobrowse": {
        label: "Agents in your app",
        caption: "Live presence over a real page — agents act through MCP tools on stable handles, not DOM scraping.",
        render: () => <CoBrowseSurface />,
    },
    "agent/share": {
        label: "Hand over a session",
        caption: "The share surface an operator uses to bring an external agent into the running app.",
        render: () => <ShareSurface />,
    },
    "seo/well-known": {
        label: "robots.txt and llms.txt",
        caption: "Edited as STRUCTURE, not text — which is what stops a site disallowing the path it meant to protect.",
        render: () => <WellKnownFiles />,
    },
    "terminal/session": {
        label: "Shared terminal",
        caption: "The real xterm-backed <Terminal> with a controlled output buffer, so a human and an agent write to one session.",
        render: () => <TerminalSession />,
    },
    "git/history": {
        label: "Repository surfaces",
        caption: "Commit history and working tree from fancy-git-ui — provider-neutral, so the same UI fronts GitHub, GitLab or Bitbucket.",
        render: () => <GitHistory />,
    },
    "auth/passkeys": {
        label: "Passkey sign-in",
        caption: "Capability detection before the prompt, so the UI never offers a passkey the device cannot produce.",
        render: () => <PasskeySurface />,
    },
    "sheets/workbook": {
        label: "Live workbook",
        caption: "The real SheetWorkbook with working SUM formulas — the surface an agent fills, not a picture of one.",
        render: () => <Spreadsheet />,
    },
    "review/diff": {
        label: "Per-hunk review",
        caption: "A real git unified diff, with accept/reject per hunk — an agent proposes, a human decides.",
        render: () => <DiffReview />,
    },
    "canvas/whiteboard": {
        label: "Shared canvas",
        caption: "fancy-whiteboard with controlled viewport and items, so a human and an agent move the same board.",
        render: () => <SharedCanvas />,
    },
    "code/editor": {
        label: "Code surface",
        caption: "fancy-code's editor, driveable by an agent through the code bridge as well as by a keyboard.",
        render: () => <CodeSurface />,
    },
    "docs/artifacts": {
        label: "Generated documents",
        caption: "The writers are headless — this is what the app has on disk after an agent builds the quarterly pack.",
        render: () => <GeneratedDocuments />,
    },
    "cms/editor": {
        label: "Page editor",
        caption: "fancy-cms-ui over a real page document, so marketing edits copy without a deploy.",
        render: () => <PageEditor />,
    },
    "pwa/states": {
        label: "Update + offline",
        caption: "What the update prompt and offline notice look like — both gated, so a real app shows neither until it should.",
        render: () => <PwaStates />,
    },
    "dashboard/analytics": {
        label: "Analytics dashboard",
        caption: "fancy-echarts with a stat band above it; the chart is the real ECharts, not an image.",
        render: () => <AnalyticsChart />,
    },
};

/** Resolve a key, tolerating content that names a screen which no longer exists. */
export function useCaseScreen(key: string): UseCaseScreen | null {
    return USE_CASE_SCREENS[key] ?? null;
}
