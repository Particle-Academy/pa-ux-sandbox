import { Head, Link } from "@inertiajs/react";
import { Badge, Button, Card, Heading, Icon, Text } from "@particle-academy/react-fancy";
import { useMemo, useState } from "react";
import { Layout } from "../Layout";

type Kit = { slug: string; name: string; pkg: string; blurb: string };

type ThumbKind = "chat" | "dash" | "flow" | "board" | "ide" | "sheet" | "chart" | "shop";

/**
 * Which designed thumbnail a kit gets. These replace the old
 * `/showcase-shots/<slug>.png` captures, which were stale package screenshots
 * reused as kit art — most rendered blank and the Workflow one had captured the
 * showcase's own footer. A small abstract of the kit's layout reads better at
 * card size than a shrunken screenshot ever did, and it cannot go stale.
 */
const THUMB: Record<string, ThumbKind> = {
    "fancy-query": "chat",
    "react-fancy": "dash",
    "fancy-flow": "flow",
    "fancy-whiteboard": "board",
    "fancy-code": "ide",
    "fancy-sheets": "sheet",
    "fancy-echarts": "chart",
    "shop-n-sub": "shop",
};

const ACCENT = "#8b5cf6";

/** Chrome shared by every thumbnail: a title bar, an optional rail, a body. */
function Shell({ rail, children }: { rail?: boolean; children: React.ReactNode }) {
    return (
        <div className="flex h-full w-full flex-col overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
            <div className="flex items-center gap-1 border-b border-zinc-200 px-2 py-1.5 dark:border-zinc-800">
                {["#ef4444", "#f59e0b", "#10b981"].map((c) => (
                    <span key={c} className="h-1.5 w-1.5 rounded-full" style={{ background: c, opacity: 0.65 }} />
                ))}
            </div>
            <div className="flex min-h-0 flex-1">
                {rail && (
                    <div className="flex w-1/4 flex-col gap-1.5 border-r border-zinc-200 p-2 dark:border-zinc-800">
                        {[100, 70, 85, 55].map((w, i) => (
                            <span
                                key={i}
                                className="h-1 rounded-full bg-zinc-300 dark:bg-zinc-700"
                                style={{ width: `${w}%`, opacity: i ? 0.55 : 0.9 }}
                            />
                        ))}
                    </div>
                )}
                <div className="flex min-w-0 flex-1 flex-col gap-1.5 p-2">{children}</div>
            </div>
        </div>
    );
}

const Box = ({
    className = "",
    style,
    children,
}: {
    className?: string;
    style?: React.CSSProperties;
    children?: React.ReactNode;
}) => (
    <span
        className={`rounded border border-zinc-200 bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 ${className}`}
        style={style}
    >
        {children}
    </span>
);

function KitThumb({ kind }: { kind: ThumbKind }) {
    if (kind === "chat") {
        return (
            <Shell rail>
                <Box className="h-4 w-[62%] self-start" />
                <Box className="h-3.5 w-[48%] self-end !border-transparent" style={{ background: ACCENT }} />
                <Box className="h-5 w-[72%] self-start" />
                <span className="mt-auto flex items-center gap-1">
                    <Box className="h-3 flex-1" />
                    <span className="h-3 w-3 rounded" style={{ background: ACCENT }} />
                </span>
            </Shell>
        );
    }
    if (kind === "dash") {
        return (
            <Shell rail>
                <span className="flex gap-1">
                    {["#8b5cf6", "#10b981", "#0ea5e9"].map((c) => (
                        <Box key={c} className="h-5 flex-1" style={{ borderTop: `2px solid ${c}` }} />
                    ))}
                </span>
                {/* Explicit height: the bars size by percentage, which needs a
                    definite parent height — `flex-1` alone collapses them. */}
                <Box className="flex h-[42px] items-end gap-0.5 p-1">
                    {[45, 70, 40, 85, 60, 75].map((h, i) => (
                        <span
                            key={i}
                            className={`flex-1 rounded-sm ${i === 3 ? "" : "bg-zinc-300 dark:bg-zinc-600"}`}
                            style={{ height: `${h}%`, background: i === 3 ? ACCENT : undefined }}
                        />
                    ))}
                </Box>
            </Shell>
        );
    }
    if (kind === "flow") {
        return (
            <Shell>
                <span className="flex flex-1 items-center justify-center gap-1">
                    {["#10b981", "#d946ef", "#8b5cf6"].map((c, i) => (
                        <span key={c} className="flex items-center gap-1">
                            <Box className="h-4 w-6" style={{ borderTop: `2px solid ${c}` }} />
                            {i < 2 && <span className="h-px w-2 bg-zinc-300 dark:bg-zinc-600" />}
                        </span>
                    ))}
                </span>
            </Shell>
        );
    }
    if (kind === "board") {
        return (
            <Shell>
                <span className="relative flex-1">
                    {[
                        ["#fde68a", "4%", "8%", "-5deg"],
                        ["#bae6fd", "44%", "20%", "4deg"],
                        ["#bbf7d0", "18%", "48%", "-2deg"],
                    ].map(([c, x, y, r], i) => (
                        <span
                            key={i}
                            className="absolute h-6 w-9 rounded-sm shadow"
                            style={{ background: c, left: x, top: y, transform: `rotate(${r})` }}
                        />
                    ))}
                </span>
            </Shell>
        );
    }
    if (kind === "ide") {
        return (
            <Shell rail>
                <span className="flex flex-1 flex-col gap-1">
                    {[["#c4b5fd", "58%"], ["#fcd34d", "72%"], ["#86efac", "45%"], ["#c4b5fd", "66%"]].map(([c, w], i) => (
                        <span key={i} className="h-1 rounded-full" style={{ background: c, width: w, opacity: 0.8 }} />
                    ))}
                </span>
                <span className="h-4 rounded border border-zinc-200 bg-zinc-950 p-1 dark:border-zinc-700">
                    <span className="block h-0.5 w-[40%] rounded-full" style={{ background: "#86efac" }} />
                </span>
            </Shell>
        );
    }
    if (kind === "sheet") {
        return (
            <Shell>
                <span className="grid flex-1 grid-cols-5 gap-px overflow-hidden rounded-sm bg-zinc-200 dark:bg-zinc-700">
                    {Array.from({ length: 25 }, (_, i) => (
                        <span
                            key={i}
                            className={`grid place-items-center ${i < 5 ? "bg-zinc-100 dark:bg-zinc-800" : "bg-white dark:bg-zinc-900"}`}
                        >
                            {i === 18 && <span className="font-mono text-[5px] text-emerald-500">=Σ</span>}
                        </span>
                    ))}
                </span>
            </Shell>
        );
    }
    if (kind === "chart") {
        return (
            <Shell>
                <svg viewBox="0 0 100 40" className="h-full w-full flex-1" preserveAspectRatio="none">
                    {[
                        ["#8b5cf6", "M0,34 L20,28 L40,30 L60,18 L80,14 L100,8 L100,40 L0,40 Z"],
                        ["#10b981", "M0,38 L20,34 L40,35 L60,28 L80,25 L100,20 L100,40 L0,40 Z"],
                    ].map(([c, d]) => (
                        <path key={c} d={d} fill={c} opacity="0.55" />
                    ))}
                </svg>
            </Shell>
        );
    }
    // shop — pricing tiers, the middle one highlighted
    return (
        <Shell>
            <span className="flex flex-1 items-stretch gap-1">
                {[0, 1, 2].map((i) => (
                    <Box
                        key={i}
                        className="flex flex-1 flex-col justify-end gap-1 p-1"
                        style={i === 1 ? { borderColor: ACCENT } : undefined}
                    >
                        <span className="h-1 w-2/3 rounded-full bg-zinc-300 dark:bg-zinc-600" />
                        <span
                            className={`h-2 w-full rounded-sm ${i === 1 ? "" : "bg-zinc-300 dark:bg-zinc-600"}`}
                            style={i === 1 ? { background: ACCENT } : undefined}
                        />
                    </Box>
                ))}
            </span>
        </Shell>
    );
}

export default function StarterKitsIndex({ kits }: { kits: Kit[] }) {
    const [query, setQuery] = useState("");

    const shown = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return kits;
        return kits.filter((k) => `${k.name} ${k.pkg} ${k.blurb}`.toLowerCase().includes(q));
    }, [kits, query]);

    return (
        <Layout>
            <Head title="Starter Kits · Fancy UI" />

            <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                    <Heading as="h1" size="xl" className="!text-zinc-900 dark:!text-zinc-100">Starter Kits</Heading>
                    <Text className="mt-2 max-w-2xl !text-zinc-600 dark:!text-zinc-300">
                        Full-app demos built from Fancy UI pieces. Each is a vertical example you can clone, study, and
                        adapt — every kit is downloadable as a runnable Vite + React 19 + Tailwind v4 project.
                    </Text>
                </div>
                <div className="flex items-center gap-2.5">
                    <label className="flex min-w-[12rem] items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-2 dark:border-zinc-800 dark:bg-zinc-900">
                        <Icon name="search" size="xs" className="text-zinc-400" />
                        <input
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Filter kits…"
                            aria-label="Filter kits"
                            className="min-w-0 flex-1 border-none bg-transparent text-sm text-zinc-900 outline-none placeholder:text-zinc-400 dark:text-zinc-100"
                        />
                    </label>
                    <Badge color="violet" variant="soft" size="sm">
                        {shown.length === kits.length ? `${kits.length} kits` : `${shown.length} of ${kits.length}`}
                    </Badge>
                </div>
            </div>

            {shown.length === 0 ? (
                <Card className="mt-6">
                    <div className="flex flex-col items-center gap-3 p-10 text-center">
                        <Icon name="search-x" size="md" className="text-zinc-400" />
                        <Text className="text-sm font-medium">No kits match “{query}”.</Text>
                        <Button variant="ghost" size="sm" onClick={() => setQuery("")}>Clear filter</Button>
                    </div>
                </Card>
            ) : (
                <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {shown.map((k) => (
                        <div key={k.slug} className="group relative block h-full">
                            {/* Stretched link — whole card opens the kit WITHOUT nesting
                                the download <a> inside a <Link> (invalid HTML the browser
                                un-nests → React #418 hydration mismatch). */}
                            <Link
                                href={`/starter-kits/${k.slug}`}
                                className="absolute inset-0 z-[1] rounded-xl"
                                aria-label={`Open ${k.name}`}
                            />
                            <Card className="h-full overflow-hidden transition group-hover:-translate-y-0.5 group-hover:border-violet-300 group-hover:shadow-lg dark:group-hover:border-violet-700">
                                <div className="aspect-[16/10] border-b border-zinc-100 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-950">
                                    <KitThumb kind={THUMB[k.slug] ?? "dash"} />
                                </div>

                                <Card.Body>
                                    <div className="flex items-start justify-between gap-2">
                                        <Heading as="h2" size="sm" className="!text-zinc-900 dark:!text-zinc-100">{k.name}</Heading>
                                        <Text size="xs" className="!font-mono !text-zinc-400 shrink-0 mt-0.5">{k.pkg}</Text>
                                    </div>
                                    <Text size="sm" className="mt-2 !text-zinc-600 dark:!text-zinc-300">{k.blurb}</Text>
                                    <div className="mt-4 flex items-center justify-between">
                                        <Text size="xs" className="!text-violet-600 opacity-0 transition group-hover:opacity-100 dark:!text-violet-300">
                                            Open kit →
                                        </Text>
                                        <Button
                                            as="a"
                                            href={`/starter-kits/${k.slug}/download.zip`}
                                            variant="ghost"
                                            size="sm"
                                            className="relative z-[2]"
                                        >
                                            ↓ zip
                                        </Button>
                                    </div>
                                </Card.Body>
                            </Card>
                        </div>
                    ))}
                </div>
            )}
        </Layout>
    );
}
