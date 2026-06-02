import { Head, router } from "@inertiajs/react";
import { Badge, Button, Card, MultiSwitch, Table } from "@particle-academy/react-fancy";
import { adminLayout } from "./AdminLayout";
import { PageHeader, EmptyRow } from "./ui";

type Submission = {
    id: number;
    title: string;
    url: string;
    kind: string;
    status: "pending" | "verified" | "rejected";
    thumbnail_url: string | null;
    featured: boolean;
    created: string | null;
    user: { name: string | null; github_username: string | null };
};
type Counts = { pending: number; verified: number; rejected: number };
type Props = { submissions: Submission[]; status: string; counts: Counts };

const STATUS_COLOR: Record<string, "amber" | "emerald" | "red"> = {
    pending: "amber",
    verified: "emerald",
    rejected: "red",
};

function Submissions({ submissions, status, counts }: Props) {
    const go = (next: string) => {
        router.get("/admin/submissions", { status: next }, { preserveState: true, preserveScroll: true, replace: true });
    };

    return (
        <>
            <Head title="Submissions · Admin" />
            <PageHeader title="Submissions" sub="Moderate showcase submissions." />

            <div style={{ marginBottom: 14 }}>
                <MultiSwitchFilter status={status} counts={counts} onChange={go} />
            </div>

            <Card>
                {submissions.length === 0 ? (
                    <EmptyRow>No submissions in this view.</EmptyRow>
                ) : (
                    <div className="admin-table-wrap">
                        <Table>
                            <Table.Head>
                                <Table.Row>
                                    <Table.Cell header>Submission</Table.Cell>
                                    <Table.Cell header>User</Table.Cell>
                                    <Table.Cell header>Status</Table.Cell>
                                    <Table.Cell header>Date</Table.Cell>
                                    <Table.Cell header></Table.Cell>
                                </Table.Row>
                            </Table.Head>
                            <Table.Body>
                                {submissions.map((s) => (
                                    <Table.Row key={s.id}>
                                        <Table.Cell>
                                            <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
                                                {s.thumbnail_url && (
                                                    <img
                                                        src={s.thumbnail_url}
                                                        alt=""
                                                        style={{ width: 44, height: 30, objectFit: "cover", borderRadius: 6, border: "1px solid var(--border-1)", flexShrink: 0 }}
                                                    />
                                                )}
                                                <div style={{ minWidth: 0 }}>
                                                    <div style={{ fontSize: 13.5, fontWeight: 500, color: "var(--fg-1)" }}>{s.title}</div>
                                                    <div style={{ fontSize: 12, color: "var(--fg-3)", marginTop: 2, maxWidth: 320, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.url}</div>
                                                </div>
                                            </div>
                                        </Table.Cell>
                                        <Table.Cell>
                                            <div style={{ fontSize: 13, color: "var(--fg-2)" }}>{s.user.name ?? "—"}</div>
                                            {s.user.github_username && (
                                                <div style={{ fontSize: 12, color: "var(--fg-3)", marginTop: 2 }}>@{s.user.github_username}</div>
                                            )}
                                        </Table.Cell>
                                        <Table.Cell>
                                            <Badge color={STATUS_COLOR[s.status] ?? "zinc"}>{s.status}</Badge>
                                        </Table.Cell>
                                        <Table.Cell>
                                            <span style={{ fontSize: 13, color: "var(--fg-2)" }}>{s.created ?? "—"}</span>
                                        </Table.Cell>
                                        <Table.Cell>
                                            <div style={{ display: "flex", alignItems: "center", gap: 6, justifyContent: "flex-end" }}>
                                                {s.status === "pending" && (
                                                    <>
                                                        <Button
                                                            color="emerald"
                                                            size="sm"
                                                            icon="check"
                                                            onClick={() => router.post(`/admin/submissions/${s.id}/verify`, {}, { preserveScroll: true })}
                                                        >
                                                            Verify
                                                        </Button>
                                                        <Button
                                                            color="red"
                                                            variant="ghost"
                                                            size="sm"
                                                            icon="x"
                                                            onClick={() => router.post(`/admin/submissions/${s.id}/reject`, {}, { preserveScroll: true })}
                                                        >
                                                            Reject
                                                        </Button>
                                                    </>
                                                )}
                                                <Button variant="ghost" size="sm" href={`/admin/submissions/${s.id}`}>View</Button>
                                            </div>
                                        </Table.Cell>
                                    </Table.Row>
                                ))}
                            </Table.Body>
                        </Table>
                    </div>
                )}
            </Card>
        </>
    );
}

function MultiSwitchFilter({ status, counts, onChange }: { status: string; counts: Counts; onChange: (v: string) => void }) {
    return (
        <MultiSwitch
            value={status}
            onValueChange={onChange}
            list={[
                { value: "pending", label: counts.pending ? `Pending ${counts.pending}` : "Pending" },
                { value: "verified", label: counts.verified ? `Verified ${counts.verified}` : "Verified" },
                { value: "rejected", label: counts.rejected ? `Rejected ${counts.rejected}` : "Rejected" },
                { value: "all", label: "All" },
            ]}
        />
    );
}

Submissions.layout = adminLayout;
export default Submissions;
