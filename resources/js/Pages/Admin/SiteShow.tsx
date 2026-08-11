import { Head, Link, router, useForm } from "@inertiajs/react";
import { useState } from "react";
import { Badge, Button, Card, Heading, Icon, Input, Select, Text } from "@particle-academy/react-fancy";
import { adminLayout } from "./AdminLayout";
import { PageHeader } from "./ui";
import { PlayerAvatar, PlayerName, type PlayerIdentityData } from "../../components/PlayerIdentity";
import { KpiGrid, FocusHeatmap, EventsOverTime, TopPathsTable, RecentSessions, type Kpis, type Heatmap, type HeatmapShot, type TopPath, type RecentSession, type DayBucket } from "./AnalyticsBlocks";

type Site = {
    id: number; title: string; url: string; site_key: string; kind: string; description: string | null;
    status: string; category: string | null; category_label: string | null;
    nsfw_declared: boolean; nsfw_status: string; nsfw_flag_reason: string | null; made_for_children: boolean;
    suspended_at: string | null; suspension_reason: string | null; listable: boolean;
    featured: boolean; featured_until: string | null; thumbnail_url: string | null;
    scanned_at: string | null; created: string | null; pixel_status: string | null; last_verified: string | null;
};
type Owner = { id: number | null; name: string; github: string | null; identity: PlayerIdentityData; proSource: string | null; pro_override: boolean };
type Category = { slug: string; label: string };

type LatestShot = { url: string; path: string; capturedAt: string | null } | null;
type Props = {
    site: Site; owner: Owner; categories: Category[];
    kpis: Kpis; topPaths: TopPath[]; heatmap: Heatmap; heatmapShot: HeatmapShot; latestShot: LatestShot;
    recentSessions: RecentSession[]; eventsOverTime: DayBucket[];
};

function SiteShow({ site, owner, categories, kpis, topPaths, heatmap, heatmapShot, latestShot, recentSessions, eventsOverTime }: Props) {
    const base = `/admin/sites/${site.id}`;
    const post = (action: string, data: Record<string, string | number | boolean | null> = {}) => router.post(`${base}/${action}`, data, { preserveScroll: true });
    const [suspendReason, setSuspendReason] = useState("");
    const classForm = useForm({ category: site.category ?? "", made_for_children: site.made_for_children });
    const hasData = kpis.totalEvents > 0;

    return (
        <>
            <Head title={`${site.title} · Sites · Admin`} />
            <PageHeader
                title={site.title}
                sub={site.url}
                actions={
                    <div style={{ display: "flex", gap: 8 }}>
                        <Button href={site.url} variant="ghost" size="sm" icon="external-link">Visit</Button>
                        <Button as={Link} variant="ghost" size="sm" icon="arrow-left" href="/admin/sites">All sites</Button>
                    </div>
                }
            />

            <div className="mb-4 flex flex-wrap items-center gap-2">
                <Badge color={site.status === "verified" ? "emerald" : site.status === "rejected" ? "red" : "zinc"}>{site.status}</Badge>
                {site.listable && <Badge color="violet" variant="soft">listed</Badge>}
                {site.suspended_at && <Badge color="red">suspended · {site.suspension_reason}</Badge>}
                {site.nsfw_status === "flagged" && <Badge color="amber">NSFW flagged</Badge>}
                {site.nsfw_status === "confirmed" && <Badge color="red">NSFW confirmed</Badge>}
                {site.nsfw_declared && <Badge color="zinc" variant="soft">nsfw (declared)</Badge>}
                {site.made_for_children && <Badge color="sky">made for children</Badge>}
                {site.category_label && <Badge color="zinc" variant="soft">{site.category_label}</Badge>}
                {site.featured && <Badge color="amber">featured{site.featured_until ? ` · ${site.featured_until}` : ""}</Badge>}
                {site.pixel_status && <Badge color={site.pixel_status === "passed" ? "emerald" : "red"}>pixel {site.pixel_status}</Badge>}
            </div>

            {site.nsfw_status === "flagged" && (
                <Card className="mb-4 !border-amber-300 dark:!border-amber-700">
                    <Card.Body>
                        <Heading as="h3" size="sm" className="!text-amber-700 dark:!text-amber-300">NSFW review needed</Heading>
                        <Text size="sm" className="mt-1 !text-zinc-600 dark:!text-zinc-300">
                            The scanner flagged this undeclared site: <code className="font-mono">{site.nsfw_flag_reason}</code>. It's held out of the public listing until you decide.
                        </Text>
                        <div className="mt-3 flex gap-2">
                            <Button color="red" size="sm" onClick={() => post("nsfw-confirm")}>Confirm NSFW + suspend</Button>
                            <Button color="emerald" variant="ghost" size="sm" onClick={() => post("nsfw-clear")}>Clear (false positive)</Button>
                        </div>
                    </Card.Body>
                </Card>
            )}

            <div className="grid gap-4 lg:grid-cols-3">
                {/* Moderation */}
                <Card>
                    <Card.Header>Moderation</Card.Header>
                    <Card.Body>
                        <div className="flex flex-col gap-2">
                            {site.status !== "verified" && <Button color="emerald" variant="ghost" size="sm" icon="check" onClick={() => post("verify")}>Verify</Button>}
                            {site.status !== "rejected" && <Button color="red" variant="ghost" size="sm" icon="x" onClick={() => post("reject")}>Reject</Button>}
                            {site.suspended_at
                                ? <Button color="emerald" variant="ghost" size="sm" icon="check" onClick={() => post("unsuspend")}>Lift suspension</Button>
                                : (
                                    <div className="flex gap-2">
                                        <Input value={suspendReason} onChange={(e) => setSuspendReason(e.target.value)} placeholder="Suspend reason…" className="flex-1" />
                                        <Button color="red" variant="ghost" size="sm" disabled={!suspendReason.trim()} onClick={() => post("suspend", { reason: suspendReason })}>Suspend</Button>
                                    </div>
                                )}
                            {site.featured
                                ? <Button variant="ghost" size="sm" icon="star" onClick={() => post("unfeature")}>Unfeature</Button>
                                : <Button variant="ghost" size="sm" icon="star" onClick={() => post("feature", { days: 7 })}>Feature (7d)</Button>}
                            <Button variant="ghost" size="sm" icon="refresh-cw" onClick={() => post("rescan")}>Re-scan</Button>
                            {site.kind === "website" && <Button variant="ghost" size="sm" icon="camera" onClick={() => post("recapture")}>Recapture screenshot</Button>}
                            <Button variant="ghost" size="sm" icon="radio" onClick={() => post("verify-pixel")}>Verify pixel now</Button>
                        </div>
                    </Card.Body>
                </Card>

                {/* Classification */}
                <Card>
                    <Card.Header>Classification</Card.Header>
                    <Card.Body>
                        <form onSubmit={(e) => { e.preventDefault(); post("category", { category: classForm.data.category || null, made_for_children: classForm.data.made_for_children }); }} className="flex flex-col gap-3">
                            <Select
                                value={classForm.data.category}
                                onValueChange={(v) => classForm.setData("category", v)}
                                list={[{ value: "", label: "— no category —" }, ...categories.map((c) => ({ value: c.slug, label: c.label }))]}
                            />
                            <label className="flex items-center gap-2 text-sm">
                                <input type="checkbox" checked={classForm.data.made_for_children} onChange={(e) => classForm.setData("made_for_children", e.target.checked)} />
                                Made for children (no behavioral tracking / screenshots)
                            </label>
                            <Button type="submit" color="violet" variant="ghost" size="sm">Save classification</Button>
                        </form>
                    </Card.Body>
                </Card>

                {/* Owner + Pro */}
                <Card>
                    <Card.Header>Owner</Card.Header>
                    <Card.Body>
                        <div className="flex items-center gap-3">
                            <PlayerAvatar player={owner.identity} size="md" />
                            <div className="min-w-0">
                                <PlayerName player={owner.identity} className="text-sm font-medium" />
                                {owner.github && <Text size="xs" className="!font-mono !text-zinc-400">@{owner.github}</Text>}
                            </div>
                        </div>
                        <div className="mt-3 flex items-center gap-2">
                            {owner.proSource
                                ? <Badge color="emerald">Pro · {owner.proSource}</Badge>
                                : <Text size="xs" className="!text-zinc-400">Free tier — basic stats only</Text>}
                        </div>
                        {owner.id && (
                            <Button
                                color={owner.pro_override ? "red" : "emerald"}
                                variant="ghost"
                                size="sm"
                                icon="sparkles"
                                className="mt-3"
                                onClick={() => post("toggle-pro")}
                            >
                                {owner.pro_override ? "Revoke manual Pro" : "Grant Pro"}
                            </Button>
                        )}
                    </Card.Body>
                </Card>
            </div>

            {site.kind === "website" && (
                <Card className="mt-6">
                    <Card.Header>
                        <div className="flex w-full items-center justify-between gap-3">
                            <span className="inline-flex items-center gap-2"><Icon name="camera" size="sm" /> Latest screenshot</span>
                            {latestShot?.capturedAt && <Badge color="zinc" variant="soft">{latestShot.capturedAt}</Badge>}
                        </div>
                    </Card.Header>
                    <Card.Body>
                        {latestShot ? (
                            <>
                                <Text size="xs" className="!text-zinc-400 mb-2">Captured path: <code className="font-mono">{latestShot.path}</code></Text>
                                <img src={latestShot.url} alt="" className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700" style={{ objectFit: "contain" }} />
                            </>
                        ) : (
                            <Text size="sm" className="!text-zinc-500">
                                No screenshot captured yet. Click <strong>Recapture screenshot</strong> above — it renders the page server-side via the configured driver and shows here.
                            </Text>
                        )}
                    </Card.Body>
                </Card>
            )}

            <Heading as="h2" size="md" className="mt-8 mb-3">Analytics</Heading>
            {!hasData ? (
                <Card><Card.Body className="!py-8 text-center"><Text className="!text-zinc-500">No Fancy Pixel events for this site yet — KPIs, heatmaps, and sessions appear here once visitors or agents interact.</Text></Card.Body></Card>
            ) : (
                <>
                    <KpiGrid kpis={kpis} />
                    <div className="admin-grid-2" style={{ marginTop: 16, gridTemplateColumns: "1.6fr 1fr" }}>
                        <FocusHeatmap heatmap={heatmap} shot={heatmapShot} />
                        <EventsOverTime data={eventsOverTime} />
                    </div>
                    <div className="admin-grid-2" style={{ marginTop: 16, gridTemplateColumns: "1.6fr 1fr" }}>
                        <TopPathsTable rows={topPaths} />
                        <RecentSessions rows={recentSessions} />
                    </div>
                </>
            )}
        </>
    );
}

SiteShow.layout = adminLayout;
export default SiteShow;
