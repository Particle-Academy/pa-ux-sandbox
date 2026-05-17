import { useState } from "react";
import {
    Action,
    Avatar,
    Badge,
    Card,
    Heading,
    Sidebar,
    Tabs,
    Text,
    Toast,
    useToast,
} from "@particle-academy/react-fancy";

type Row = {
    name: string;
    status: "Active" | "Trial" | "Churned";
    mrr: number;
    seats: number;
    last_seen: string;
};

const ROWS: Row[] = [
    { name: "Acme Robotics", status: "Active", mrr: 4990, seats: 42, last_seen: "12 min ago" },
    { name: "Vector Foods", status: "Active", mrr: 2900, seats: 18, last_seen: "1 hr ago" },
    { name: "Lumen Cycles", status: "Trial", mrr: 0, seats: 5, last_seen: "3 hr ago" },
    { name: "Maple & Tile", status: "Churned", mrr: 0, seats: 0, last_seen: "12 d ago" },
    { name: "Boreal Press", status: "Active", mrr: 1490, seats: 9, last_seen: "5 min ago" },
    { name: "Solstice Labs", status: "Active", mrr: 9900, seats: 87, last_seen: "23 min ago" },
];

const STATUS_COLORS: Record<Row["status"], "emerald" | "amber" | "zinc"> = {
    Active: "emerald",
    Trial: "amber",
    Churned: "zinc",
};

export function ReactDashboardKit() {
    const [active, setActive] = useState("customers");
    const { toast } = useToast();

    const mrr = ROWS.reduce((sum, r) => sum + r.mrr, 0);
    const activeCount = ROWS.filter((r) => r.status === "Active").length;

    return (
        <div className="grid grid-cols-[200px_1fr] gap-6">
            <Sidebar className="rounded-lg border border-zinc-200 bg-white p-2 dark:border-zinc-800 dark:bg-zinc-900">
                <Sidebar.Group>
                    <Sidebar.Item href="#" active={active === "customers"} onClick={() => setActive("customers")}>
                        Customers
                    </Sidebar.Item>
                    <Sidebar.Item href="#" active={active === "billing"} onClick={() => setActive("billing")}>
                        Billing
                    </Sidebar.Item>
                    <Sidebar.Item href="#" active={active === "team"} onClick={() => setActive("team")}>
                        Team
                    </Sidebar.Item>
                    <Sidebar.Item href="#" active={active === "settings"} onClick={() => setActive("settings")}>
                        Settings
                    </Sidebar.Item>
                </Sidebar.Group>
            </Sidebar>

            <div className="space-y-6">
                <div className="grid gap-3 sm:grid-cols-3">
                    <Stat label="MRR" value={`$${mrr.toLocaleString()}`} trend="+12% MoM" tone="emerald" />
                    <Stat label="Active customers" value={String(activeCount)} trend={`of ${ROWS.length}`} tone="sky" />
                    <Stat label="Trials this week" value="3" trend="2 converted" tone="violet" />
                </div>

                <Card>
                    <Card.Body className="p-0">
                        <Tabs defaultTab="all">
                            <Tabs.List className="border-b border-zinc-200 px-4 dark:border-zinc-800">
                                <Tabs.Tab value="all">All ({ROWS.length})</Tabs.Tab>
                                <Tabs.Tab value="active">Active ({activeCount})</Tabs.Tab>
                                <Tabs.Tab value="trial">Trial</Tabs.Tab>
                                <Tabs.Tab value="churned">Churned</Tabs.Tab>
                            </Tabs.List>
                            <Tabs.Panels>
                                <Tabs.Panel value="all">
                                    <CustomerTable rows={ROWS} onAction={(r, a) => toast({ title: `${a}: ${r.name}` })} />
                                </Tabs.Panel>
                                <Tabs.Panel value="active">
                                    <CustomerTable rows={ROWS.filter((r) => r.status === "Active")} onAction={(r, a) => toast({ title: `${a}: ${r.name}` })} />
                                </Tabs.Panel>
                                <Tabs.Panel value="trial">
                                    <CustomerTable rows={ROWS.filter((r) => r.status === "Trial")} onAction={(r, a) => toast({ title: `${a}: ${r.name}` })} />
                                </Tabs.Panel>
                                <Tabs.Panel value="churned">
                                    <CustomerTable rows={ROWS.filter((r) => r.status === "Churned")} onAction={(r, a) => toast({ title: `${a}: ${r.name}` })} />
                                </Tabs.Panel>
                            </Tabs.Panels>
                        </Tabs>
                    </Card.Body>
                </Card>

                <Text size="xs" className="!text-zinc-500">
                    Built from <code className="font-mono">Sidebar</code> · <code className="font-mono">Tabs</code> ·{" "}
                    <code className="font-mono">Card</code> · <code className="font-mono">Action</code> ·{" "}
                    <code className="font-mono">Badge</code> · <code className="font-mono">Avatar</code> ·{" "}
                    <code className="font-mono">Toast</code>
                </Text>
            </div>
        </div>
    );
}

function Stat({ label, value, trend, tone }: { label: string; value: string; trend: string; tone: "emerald" | "sky" | "violet" }) {
    const tones = {
        emerald: "from-emerald-400/20 to-emerald-400/0",
        sky: "from-sky-400/20 to-sky-400/0",
        violet: "from-violet-400/20 to-violet-400/0",
    };
    return (
        <Card className="relative overflow-hidden">
            <div className={`pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r ${tones[tone]}`} />
            <Card.Body>
                <Text size="xs" className="uppercase tracking-wider !text-zinc-500">{label}</Text>
                <Heading level={3} size="lg" className="mt-1 !text-3xl">{value}</Heading>
                <Text size="xs" className="mt-1 !text-zinc-500">{trend}</Text>
            </Card.Body>
        </Card>
    );
}

function CustomerTable({ rows, onAction }: { rows: Row[]; onAction: (r: Row, action: string) => void }) {
    return (
        <div className="overflow-x-auto">
            <table className="w-full text-sm">
                <thead className="text-left text-[10px] uppercase tracking-wider text-zinc-500">
                    <tr className="border-b border-zinc-100 dark:border-zinc-800">
                        <th className="px-4 py-2">Customer</th>
                        <th className="px-4 py-2">Status</th>
                        <th className="px-4 py-2 text-right">MRR</th>
                        <th className="px-4 py-2 text-right">Seats</th>
                        <th className="px-4 py-2">Last seen</th>
                        <th className="px-4 py-2" />
                    </tr>
                </thead>
                <tbody>
                    {rows.map((r) => (
                        <tr key={r.name} className="border-b border-zinc-50 last:border-b-0 dark:border-zinc-900">
                            <td className="px-4 py-2.5">
                                <div className="flex items-center gap-2">
                                    <Avatar name={r.name} size="sm" />
                                    <span className="font-medium">{r.name}</span>
                                </div>
                            </td>
                            <td className="px-4 py-2.5">
                                <Badge color={STATUS_COLORS[r.status]} size="sm">{r.status}</Badge>
                            </td>
                            <td className="px-4 py-2.5 text-right font-mono">${r.mrr.toLocaleString()}</td>
                            <td className="px-4 py-2.5 text-right font-mono">{r.seats}</td>
                            <td className="px-4 py-2.5 !text-zinc-500">{r.last_seen}</td>
                            <td className="px-4 py-2.5 text-right">
                                <Action variant="ghost" size="sm" onClick={() => onAction(r, "Opened")}>Open</Action>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
