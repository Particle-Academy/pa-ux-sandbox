import { Head, Link, router } from "@inertiajs/react";
import { useState } from "react";
import { Badge, Button, Card, Input, MultiSwitch, Table, Text } from "@particle-academy/react-fancy";
import { adminLayout } from "./AdminLayout";
import { PageHeader, StatCard, EmptyRow } from "./ui";

type Owner = { name: string; github: string | null; proSource: string | null };
type Site = {
    id: number;
    label: string;
    url: string;
    host: string;
    kind: string;
    status: string;
    listable: boolean;
    suspended: boolean;
    nsfw_status: string;
    nsfw_declared: boolean;
    made_for_children: boolean;
    category_label: string | null;
    featured: boolean;
    pageviews: number;
    sessions: number;
    events: number;
    created: string | null;
    owner: Owner;
};
type Global = {
    sites: number; listed: number; pending: number; flagged: number; suspended: number;
    kids: number; events: number; sessions: number; users: number; proManual: number;
};
type Props = {
    sites: Site[];
    pagination: { current: number; last: number; total: number; prevUrl: string | null; nextUrl: string | null };
    filter: string;
    q: string;
    global: Global;
};

const FILTERS = ["all", "pending", "verified", "suspended", "flagged", "kids", "rejected"];

function ProBadge({ source }: { source: string | null }) {
    if (!source) return <Text size="xs" className="!text-zinc-400">free</Text>;
    return <Badge color="emerald" size="sm">Pro · {source}</Badge>;
}

function Sites({ sites, pagination, filter, q, global }: Props) {
    const [search, setSearch] = useState(q);
    const [selected, setSelected] = useState<number[]>([]);

    const go = (params: Record<string, string>) =>
        router.get("/admin/sites", { filter, q: search, ...params }, { preserveState: true, preserveScroll: true, replace: true });

    const toggle = (id: number) => setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
    const bulk = (action: string) => {
        if (selected.length === 0) return;
        router.post("/admin/sites/bulk", { action, ids: selected }, { preserveScroll: true, onSuccess: () => setSelected([]) });
    };

    return (
        <>
            <Head title="Sites · Admin" />
            <PageHeader title="Sites" sub="Every submitted site — one place for moderation, analytics, and the owner's Pro tier." />

            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
                <StatCard label="Sites" value={global.sites} icon="globe" sub={`${global.listed} listed`} />
                <StatCard label="Pending" value={global.pending} icon="clock" />
                <StatCard label="Flagged" value={global.flagged} icon="flag" sub="NSFW review" />
                <StatCard label="Suspended" value={global.suspended} icon="ban" />
                <StatCard label="Events" value={global.events.toLocaleString()} icon="activity" sub={`${global.sessions.toLocaleString()} sessions`} />
                <StatCard label="Users" value={global.users} icon="users" sub={`${global.proManual} manual Pro`} />
            </div>

            <Card className="mt-6">
                <Card.Body className="!py-3">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <MultiSwitch
                            value={filter}
                            onValueChange={(v: string) => go({ filter: v })}
                            list={FILTERS.map((f) => ({ value: f, label: f[0].toUpperCase() + f.slice(1) }))}
                        />
                        <form
                            onSubmit={(e) => { e.preventDefault(); go({ q: search }); }}
                            className="flex items-center gap-2"
                        >
                            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search url, title, owner…" className="w-64" />
                            <Button type="submit" variant="ghost" size="sm" icon="search">Search</Button>
                        </form>
                    </div>
                    {selected.length > 0 && (
                        <div className="mt-3 flex flex-wrap items-center gap-2 rounded-md bg-violet-50 px-3 py-2 dark:bg-violet-950/40">
                            <Text size="xs" className="!font-medium">{selected.length} selected</Text>
                            {["verify", "suspend", "unsuspend", "feature", "reject"].map((a) => (
                                <Button key={a} size="sm" variant="ghost" onClick={() => bulk(a)}>{a[0].toUpperCase() + a.slice(1)}</Button>
                            ))}
                        </div>
                    )}
                </Card.Body>
            </Card>

            <Card className="mt-4 overflow-hidden">
                <Table>
                    <Table.Head>
                        <Table.Row>
                            <Table.Cell header></Table.Cell>
                            <Table.Cell header>Site</Table.Cell>
                            <Table.Cell header>Owner</Table.Cell>
                            <Table.Cell header>Status</Table.Cell>
                            <Table.Cell header className="!text-right">Stats</Table.Cell>
                            <Table.Cell header className="!text-right"></Table.Cell>
                        </Table.Row>
                    </Table.Head>
                    <Table.Body>
                        {sites.length === 0 ? (
                            <Table.Row><Table.Cell colSpan={6}><EmptyRow>No sites match this filter.</EmptyRow></Table.Cell></Table.Row>
                        ) : (
                            sites.map((s) => (
                                <Table.Row key={s.id}>
                                    <Table.Cell>
                                        <input type="checkbox" checked={selected.includes(s.id)} onChange={() => toggle(s.id)} />
                                    </Table.Cell>
                                    <Table.Cell>
                                        <Link href={`/admin/sites/${s.id}`} className="block">
                                            <span className="font-medium text-zinc-900 hover:text-violet-600 dark:text-zinc-100">{s.label}</span>
                                            <span className="block font-mono text-[11px] text-zinc-400">{s.host}</span>
                                        </Link>
                                        <div className="mt-1 flex flex-wrap gap-1">
                                            {s.category_label && <Badge color="zinc" size="sm" variant="soft">{s.category_label}</Badge>}
                                            {s.made_for_children && <Badge color="sky" size="sm">kids</Badge>}
                                            {s.featured && <Badge color="amber" size="sm">featured</Badge>}
                                        </div>
                                    </Table.Cell>
                                    <Table.Cell>
                                        <span className="text-sm text-zinc-700 dark:text-zinc-200">{s.owner.name}</span>
                                        {s.owner.github && <span className="block font-mono text-[11px] text-zinc-400">@{s.owner.github}</span>}
                                        <div className="mt-0.5"><ProBadge source={s.owner.proSource} /></div>
                                    </Table.Cell>
                                    <Table.Cell>
                                        <div className="flex flex-wrap gap-1">
                                            <Badge color={s.status === "verified" ? "emerald" : s.status === "rejected" ? "red" : "zinc"} size="sm">{s.status}</Badge>
                                            {s.suspended && <Badge color="red" size="sm">suspended</Badge>}
                                            {s.nsfw_status === "flagged" && <Badge color="amber" size="sm">NSFW?</Badge>}
                                            {s.nsfw_status === "confirmed" && <Badge color="red" size="sm">NSFW</Badge>}
                                            {s.nsfw_declared && <Badge color="zinc" size="sm" variant="soft">nsfw (declared)</Badge>}
                                            {s.listable && <Badge color="violet" size="sm" variant="soft">listed</Badge>}
                                        </div>
                                    </Table.Cell>
                                    <Table.Cell className="text-right font-mono text-xs">
                                        <div>{s.pageviews.toLocaleString()} views</div>
                                        <div className="text-zinc-400">{s.sessions.toLocaleString()} sessions</div>
                                    </Table.Cell>
                                    <Table.Cell className="text-right">
                                        <Button href={`/admin/sites/${s.id}`} variant="ghost" size="sm">Open →</Button>
                                    </Table.Cell>
                                </Table.Row>
                            ))
                        )}
                    </Table.Body>
                </Table>
            </Card>

            {pagination.last > 1 && (
                <div className="mt-4 flex items-center justify-between">
                    <Text size="xs" className="!text-zinc-500">Page {pagination.current} of {pagination.last} · {pagination.total} sites</Text>
                    <div className="flex gap-2">
                        <Button href={pagination.prevUrl ?? "#"} variant="ghost" size="sm" disabled={!pagination.prevUrl}>← Prev</Button>
                        <Button href={pagination.nextUrl ?? "#"} variant="ghost" size="sm" disabled={!pagination.nextUrl}>Next →</Button>
                    </div>
                </div>
            )}
        </>
    );
}

Sites.layout = adminLayout;
export default Sites;
