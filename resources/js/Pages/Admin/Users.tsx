import { Head, router } from "@inertiajs/react";
import { Avatar, Badge, Button, Card, Field, Icon, Input, MultiSwitch, Table } from "@particle-academy/react-fancy";
import { useState } from "react";
import { adminLayout } from "./AdminLayout";
import { PageHeader, EmptyRow } from "./ui";

type AdminUser = {
    id: number;
    name: string;
    email: string;
    github_username: string | null;
    avatar_url: string | null;
    is_admin: boolean;
    coins: number;
    joined: string | null;
    proSource: string | null;
    sites: number;
};
type Props = { users: AdminUser[]; search: string; sort: string; total: number };

const n = (v: number) => v.toLocaleString();

function initials(name: string): string {
    return name.split(/\s+/).slice(0, 2).map((p) => p[0]?.toUpperCase() ?? "").join("") || "?";
}

function Users({ users, search, sort, total }: Props) {
    const [q, setQ] = useState(search ?? "");

    const go = (next: { q?: string; sort?: string }) => {
        router.get(
            "/admin/users",
            { q: next.q ?? q, sort: next.sort ?? sort },
            { preserveState: true, preserveScroll: true, replace: true },
        );
    };

    return (
        <>
            <Head title="Users · Admin" />
            <PageHeader title="Users" sub={`${n(total)} members.`} />

            <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 12, marginBottom: 14, flexWrap: "wrap" }}>
                <div style={{ minWidth: 260, flex: 1, maxWidth: 360 }}>
                    <Field label="Search">
                        <Input
                            value={q}
                            onChange={(e) => setQ(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") go({ q });
                            }}
                            placeholder="Name, email, or @github"
                            leading={<Icon name="search" size={15} />}
                        />
                    </Field>
                </div>
                <MultiSwitch
                    value={sort}
                    onValueChange={(v) => go({ sort: v })}
                    list={[
                        { value: "recent", label: "Recent" },
                        { value: "coins", label: "Coins" },
                        { value: "name", label: "Name" },
                    ]}
                />
            </div>

            <Card>
                {users.length === 0 ? (
                    <EmptyRow>No users match your search.</EmptyRow>
                ) : (
                    <div className="admin-table-wrap">
                        <Table>
                            <Table.Head>
                                <Table.Row>
                                    <Table.Cell header>User</Table.Cell>
                                    <Table.Cell header>Tier</Table.Cell>
                                    <Table.Cell header>Sites</Table.Cell>
                                    <Table.Cell header>Coins</Table.Cell>
                                    <Table.Cell header>Joined</Table.Cell>
                                    <Table.Cell header>Role</Table.Cell>
                                    <Table.Cell header></Table.Cell>
                                </Table.Row>
                            </Table.Head>
                            <Table.Body>
                                {users.map((user) => (
                                    <Table.Row key={user.id}>
                                        <Table.Cell>
                                            <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
                                                <Avatar src={user.avatar_url ?? undefined} fallback={initials(user.name)} size="sm" />
                                                <div>
                                                    <div style={{ fontSize: 13.5, fontWeight: 500, color: "var(--fg-1)" }}>{user.name}</div>
                                                    {user.github_username && (
                                                        <div style={{ fontSize: 12, color: "var(--fg-3)", marginTop: 2 }}>@{user.github_username}</div>
                                                    )}
                                                </div>
                                            </div>
                                        </Table.Cell>
                                        <Table.Cell>
                                            {user.proSource
                                                ? <Badge color="emerald" size="sm">Pro · {user.proSource}</Badge>
                                                : <span style={{ fontSize: 12, color: "var(--fg-4)" }}>Free</span>}
                                        </Table.Cell>
                                        <Table.Cell>
                                            {user.sites > 0
                                                ? <span style={{ fontFamily: "var(--font-mono)", fontSize: 13, color: "var(--fg-2)" }}>{n(user.sites)}</span>
                                                : <span style={{ fontSize: 12, color: "var(--fg-4)" }}>—</span>}
                                        </Table.Cell>
                                        <Table.Cell>
                                            <span style={{ fontFamily: "var(--font-mono)", fontSize: 13, color: "var(--fg-2)" }}>{n(user.coins)} ◈</span>
                                        </Table.Cell>
                                        <Table.Cell>
                                            <span style={{ fontSize: 13, color: "var(--fg-2)" }}>{user.joined ?? "—"}</span>
                                        </Table.Cell>
                                        <Table.Cell>
                                            {user.is_admin ? <Badge color="violet">Admin</Badge> : <span style={{ color: "var(--fg-4)" }}>—</span>}
                                        </Table.Cell>
                                        <Table.Cell>
                                            <Button variant="ghost" size="sm" href={`/admin/users/${user.id}`}>View</Button>
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

Users.layout = adminLayout;
export default Users;
