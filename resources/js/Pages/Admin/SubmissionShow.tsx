import { Head, router, useForm } from "@inertiajs/react";
import { Badge, Button, Card, Field, Input } from "@particle-academy/react-fancy";
import { adminLayout } from "./AdminLayout";
import { PageHeader } from "./ui";

type Submission = {
    id: number;
    title: string | null;
    description: string | null;
    url: string;
    site_key: string | null;
    kind: string;
    status: "pending" | "verified" | "rejected";
    scan_result: Record<string, unknown> | null;
    thumbnail_url: string | null;
    featured: boolean;
    featured_until: string | null;
    created: string | null;
    scanned_at: string | null;
    rewarded_at: string | null;
    user: { name: string | null; github_username: string | null };
};
type Props = { submission: Submission };

const STATUS_COLOR: Record<string, "amber" | "emerald" | "red"> = {
    pending: "amber",
    verified: "emerald",
    rejected: "red",
};

function Meta({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div>
            <div style={{ fontSize: 11.5, textTransform: "uppercase", letterSpacing: "0.04em", color: "var(--fg-3)", fontWeight: 600 }}>{label}</div>
            <div style={{ fontSize: 13.5, color: "var(--fg-1)", marginTop: 4 }}>{children}</div>
        </div>
    );
}

function SubmissionShow({ submission: s }: Props) {
    const base = `/admin/submissions/${s.id}`;
    const featureForm = useForm({ days: 7 });

    return (
        <>
            <Head title={`Submission #${s.id} · Admin`} />
            <PageHeader
                title={s.title ?? "(untitled)"}
                sub={s.url}
                actions={
                    <Button variant="ghost" size="sm" icon="arrow-left" href="/admin/submissions">
                        Submissions
                    </Button>
                }
            />

            <div className="admin-form-grid">
                <div className="admin-stack">
                    <Card>
                        {s.thumbnail_url && (
                            <img
                                src={s.thumbnail_url}
                                alt=""
                                style={{ width: "100%", maxHeight: 320, objectFit: "cover", borderTopLeftRadius: 10, borderTopRightRadius: 10, borderBottom: "1px solid var(--border-1)" }}
                            />
                        )}
                        <Card.Body>
                            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                                <Badge color={STATUS_COLOR[s.status] ?? "zinc"}>{s.status}</Badge>
                                {s.featured && <Badge color="violet">Featured{s.featured_until ? ` · until ${s.featured_until}` : ""}</Badge>}
                            </div>
                            <a
                                href={s.url}
                                target="_blank"
                                rel="noopener"
                                style={{ display: "inline-block", marginTop: 12, fontSize: 13.5, color: "var(--violet-600, #7c3aed)", wordBreak: "break-all" }}
                            >
                                {s.url}
                            </a>
                            {s.description && (
                                <p style={{ fontSize: 13.5, color: "var(--fg-2)", marginTop: 10 }}>{s.description}</p>
                            )}

                            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 14, marginTop: 16 }}>
                                <Meta label="Kind">{s.kind}</Meta>
                                <Meta label="Submitted by">
                                    {s.user.name ?? "—"}
                                    {s.user.github_username && (
                                        <span style={{ color: "var(--fg-3)" }}> · @{s.user.github_username}</span>
                                    )}
                                </Meta>
                                <Meta label="Created">{s.created ?? "—"}</Meta>
                                <Meta label="Rewarded">{s.rewarded_at ?? "no"}</Meta>
                                <Meta label="Site key">
                                    {s.site_key ? (
                                        <a
                                            href={`/admin/heuristics/${s.site_key}`}
                                            style={{ fontFamily: "var(--font-mono)", fontSize: 12.5, color: "var(--violet-600, #7c3aed)" }}
                                        >
                                            {s.site_key}
                                        </a>
                                    ) : (
                                        "—"
                                    )}
                                </Meta>
                            </div>
                        </Card.Body>
                    </Card>

                    <Card>
                        <Card.Header>
                            <div style={{ fontSize: 14, fontWeight: 600, color: "var(--fg-1)" }}>Scan result</div>
                        </Card.Header>
                        <Card.Body>
                            <div style={{ fontSize: 12, color: "var(--fg-3)", marginBottom: 8 }}>{s.scanned_at ?? "never scanned"}</div>
                            <pre
                                style={{
                                    margin: 0,
                                    overflowX: "auto",
                                    borderRadius: 8,
                                    background: "var(--bg-2)",
                                    padding: 12,
                                    fontSize: 12,
                                    fontFamily: "var(--font-mono)",
                                    color: "var(--fg-2)",
                                }}
                            >
                                {s.scan_result ? JSON.stringify(s.scan_result, null, 2) : "null"}
                            </pre>
                        </Card.Body>
                    </Card>
                </div>

                <div className="admin-stack">
                    <Card>
                        <Card.Header>
                            <div style={{ fontSize: 14, fontWeight: 600, color: "var(--fg-1)" }}>Moderation</div>
                        </Card.Header>
                        <Card.Body>
                            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                                {s.status === "pending" && (
                                    <>
                                        <Button
                                            color="emerald"
                                            icon="check"
                                            onClick={() => router.post(`${base}/verify`, {}, { preserveScroll: true })}
                                        >
                                            Verify
                                        </Button>
                                        <Button
                                            color="red"
                                            variant="ghost"
                                            icon="x"
                                            onClick={() => router.post(`${base}/reject`, {}, { preserveScroll: true })}
                                        >
                                            Reject
                                        </Button>
                                    </>
                                )}
                                <Button
                                    variant="ghost"
                                    icon="refresh-cw"
                                    onClick={() => router.post(`${base}/rescan`, {}, { preserveScroll: true })}
                                >
                                    Re-scan
                                </Button>
                            </div>
                        </Card.Body>
                    </Card>

                    <Card>
                        <Card.Header>
                            <div style={{ fontSize: 14, fontWeight: 600, color: "var(--fg-1)" }}>Featuring</div>
                        </Card.Header>
                        <Card.Body>
                            <div style={{ fontSize: 13, color: "var(--fg-3)", marginBottom: 12 }}>
                                {s.featured ? `Featured until ${s.featured_until}.` : "Not currently featured."}
                            </div>
                            <form
                                className="admin-field-stack"
                                onSubmit={(e) => {
                                    e.preventDefault();
                                    featureForm.post(`${base}/feature`, { preserveScroll: true });
                                }}
                            >
                                <Field label="Days" error={featureForm.errors.days}>
                                    <Input
                                        type="number"
                                        value={String(featureForm.data.days)}
                                        onValueChange={(v) => featureForm.setData("days", Number(v))}
                                    />
                                </Field>
                                <Button type="submit" color="amber" loading={featureForm.processing}>Feature (comp)</Button>
                            </form>
                            {s.featured && (
                                <div style={{ marginTop: 10 }}>
                                    <Button
                                        variant="ghost"
                                        onClick={() => router.post(`${base}/unfeature`, {}, { preserveScroll: true })}
                                    >
                                        Remove feature
                                    </Button>
                                </div>
                            )}
                        </Card.Body>
                    </Card>
                </div>
            </div>
        </>
    );
}

SubmissionShow.layout = adminLayout;
export default SubmissionShow;
