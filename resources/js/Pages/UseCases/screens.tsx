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
    Table,
    Text,
} from "@particle-academy/react-fancy";
import { CommissionStatement, DownlineTree, RankProgress } from "@particle-academy/fancy-mlm-ui";
import "@particle-academy/fancy-mlm-ui/styles.css";
import { PricingTable } from "../../components/fancy/catalog-fms";
import { Map as FancyMap } from "@particle-academy/fancy-map";
import { leafletProvider } from "@particle-academy/fancy-map/leaflet";
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
 * fancy-map is ALREADY SSR-safe by design — it renders a sized placeholder on
 * the server and mounts the provider inside an effect. Wrapping it in
 * `clientOnly` on top of that was the bug: it delayed the mount until after the
 * surrounding layout had settled, so Leaflet measured a container that then
 * changed underneath it and painted its tiles against stale geometry.
 *
 * Imported directly, the placeholder reserves the box during SSR and the engine
 * measures the final size. `leafletProvider()` at module scope is the same shape
 * the package demo uses, and does not break the server pass.
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

function CoursePlayer() {
    const lessons = [
        { title: "Positioning your offer", done: true },
        { title: "Pricing without discounting", done: true },
        { title: "The discovery call", done: false, current: true },
        { title: "Handling objections", done: false },
    ];
    return (
        <Frame title="Course" action={<Badge size="sm" variant="soft" color="violet">2 / 4</Badge>}>
            <div className="grid gap-3 sm:grid-cols-[1fr_180px]">
                <div>
                    <div className="flex h-[132px] items-center justify-center rounded-lg bg-zinc-900 dark:bg-black">
                        <Icon name="play" className="text-white/70" />
                    </div>
                    <Heading as="h4" size="sm" style={{ marginTop: 8 }}>
                        The discovery call
                    </Heading>
                    <div className="mt-1.5"><Progress value={38} size="sm" /></div>
                </div>
                <div className="space-y-1">
                    {lessons.map((l) => (
                        <div
                            key={l.title}
                            className={`flex items-center gap-1.5 rounded-md px-2 py-1.5 text-[11px] ${
                                l.current ? "bg-violet-50 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300" : "text-zinc-600 dark:text-zinc-400"
                            }`}
                        >
                            <Icon name={l.done ? "circle-check" : "circle"} className={l.done ? "text-green-500" : "text-zinc-400"} />
                            <span className="truncate">{l.title}</span>
                        </div>
                    ))}
                </div>
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
        label: "Lesson player",
        caption: "Progress is per learner and per lesson, tracked by laravel-courses.",
        render: () => <CoursePlayer />,
    },
    "courses/gradebook": {
        label: "Cohort gradebook",
        caption: "A real <Table> with avatars, progress bars and status badges.",
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
