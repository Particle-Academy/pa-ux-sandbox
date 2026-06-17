import { useState } from "react";
import {
    Avatar,
    Badge,
    Card,
    Checkbox,
    DatePicker,
    Form,
    Heading,
    Input,
    MultiSwitch,
    Select,
    Slider,
    Switch,
    Text,
} from "@particle-academy/react-fancy";
import { FancyDataRoot, useFancyTable, type FancyTableSort } from "@particle-academy/fancy-query";
import { SimulateUsersButton } from "@particle-academy/agent-integrations";
import type { ActiveUserRow } from "../../components/ActiveUsersOverlay";
import { getEcho } from "../../lib/echo";

function upsertById(cache: ActiveUserRow[] | undefined, row: ActiveUserRow): ActiveUserRow[] {
    const arr = cache ?? [];
    const i = arr.findIndex((r) => r.id === row.id);
    if (i >= 0) {
        const next = [...arr];
        next[i] = row;
        return next;
    }
    return [...arr, row];
}

const sortByActivity: FancyTableSort<ActiveUserRow> = { by: (u) => u.activity_at ?? "", dir: "desc" };

/**
 * Live, cross-user "active users" demo.
 *
 * The ActiveUser table is bound LIVE via `useFancyTable` (filter + sort over a
 * collection streamed through Laravel Reverb) — open this in two browsers and
 * acting in one updates the other. The "Simulate" button injects fake users so
 * you can see it animate solo (their avatars also stream into the top-right
 * overlay). Below: the new form **display mode** — flip a whole form between
 * edit and read-only view with one `<Form mode>`.
 */
export function LiveActiveUsersDemo() {
    // The react-demos app is a standalone React entry without the showcase app's
    // FancyDataRoot, so this demo provides its own query client + Echo.
    return (
        <FancyDataRoot echo={getEcho()}>
            <LiveActiveUsersPanel />
        </FancyDataRoot>
    );
}

function LiveActiveUsersPanel() {
    const [hideFakes, setHideFakes] = useState(false);

    const { rows, total } = useFancyTable<ActiveUserRow>(["active-users-demo"], {
        channel: "active-users",
        fetchInitial: () =>
            fetch("/active-users")
                .then((r) => r.json())
                .then((d) => (Array.isArray(d) ? d : d.data ?? [])),
        on: { "active-user.updated": upsertById },
        filter: hideFakes ? (u) => !u.is_fake : undefined,
        sort: sortByActivity,
        streaming: false,
        poll: { while: "always", intervalMs: 15000 },
    });

    return (
        <div className="space-y-10">
            <div>
                <Heading as="h1" size="lg">
                    Live active users
                </Heading>
                <Text className="mt-1 !text-zinc-500">
                    Real cross-user data binding over Laravel Reverb. The table below is bound to the live{" "}
                    <code>ActiveUser</code> collection with <code>useFancyTable</code> (filter + sort). Open this in two
                    browsers — acting in one updates the other. Avatars also stream into the overlay top-right.
                </Text>
            </div>

            <Card>
                <Card.Body>
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                            <Heading as="h2" size="sm">
                                Active now
                            </Heading>
                            <Badge color="violet" size="sm">
                                {rows.length}/{total}
                            </Badge>
                        </div>
                        <div className="flex items-center gap-3">
                            <Switch checked={hideFakes} onCheckedChange={setHideFakes} label="Hide fakes" size="sm" />
                            <SimulateUsersButton count={10} onTriggered={() => undefined} />
                        </div>
                    </div>

                    <div className="mt-4 divide-y divide-zinc-100 dark:divide-zinc-800">
                        {rows.length === 0 && (
                            <Text className="py-6 !text-zinc-400">
                                No active users yet — click “Simulate 10 active users”, or browse the site in another tab.
                            </Text>
                        )}
                        {rows.map((u) => (
                            <div key={u.id} className="flex items-center gap-3 py-2">
                                <Avatar
                                    src={u.avatar_url ?? undefined}
                                    alt={u.name}
                                    fallback={u.name.slice(0, 2).toUpperCase()}
                                    size="sm"
                                    glow={u.is_xp ? "xp" : u.is_achievement ? "achievement" : false}
                                />
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2">
                                        <span className="truncate text-sm font-medium">{u.name}</span>
                                        {u.is_fake && (
                                            <Badge color="zinc" size="sm" variant="soft">
                                                fake
                                            </Badge>
                                        )}
                                        {u.is_xp && (
                                            <Badge color="emerald" size="sm">
                                                XP
                                            </Badge>
                                        )}
                                        {u.is_achievement && (
                                            <Badge color="amber" size="sm">
                                                Achievement
                                            </Badge>
                                        )}
                                    </div>
                                    <Text size="xs" className="truncate !text-zinc-500">
                                        {u.activity_label ?? u.activity_type ?? "active"}
                                    </Text>
                                </div>
                            </div>
                        ))}
                    </div>
                </Card.Body>
            </Card>

            <FormDisplayModeDemo />
        </div>
    );
}

function FormDisplayModeDemo() {
    const [mode, setMode] = useState<"edit" | "view">("edit");
    const [name, setName] = useState("Ada Lovelace");
    const [role, setRole] = useState("engineer");
    const [notify, setNotify] = useState(true);
    const [level, setLevel] = useState(7);
    const [joined, setJoined] = useState("2026-01-15");
    const [agree, setAgree] = useState(true);

    return (
        <div>
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <Heading as="h2" size="sm">
                        Form display mode
                    </Heading>
                    <Text className="mt-1 !text-zinc-500">
                        One <code>&lt;Form mode&gt;</code> flips every input between editable and read-only display — the
                        React/Inertia analog of Livewire public properties. (The “Internal id” field overrides the form
                        with an explicit <code>mode</code>.)
                    </Text>
                </div>
                <MultiSwitch
                    value={mode}
                    onValueChange={(v) => setMode(v as "edit" | "view")}
                    list={[
                        { value: "edit", label: "Edit" },
                        { value: "view", label: "View" },
                    ]}
                    size="sm"
                />
            </div>

            <Card className="mt-4">
                <Card.Body>
                    <Form mode={mode} className="grid gap-4 sm:grid-cols-2">
                        <Input label="Name" value={name} onValueChange={setName} />
                        <Select
                            label="Role"
                            value={role}
                            onChange={setRole}
                            list={[
                                { value: "engineer", label: "Engineer" },
                                { value: "designer", label: "Designer" },
                                { value: "pm", label: "Product Manager" },
                            ]}
                        />
                        <DatePicker label="Joined" value={joined} onChange={(v) => setJoined(v as string)} />
                        <Slider label="Level" value={level} onValueChange={(v) => setLevel(v as number)} min={1} max={20} showValue />
                        <Switch label="Email notifications" checked={notify} onCheckedChange={setNotify} />
                        <Checkbox label="Agreed to terms" checked={agree} onCheckedChange={setAgree} />
                        {/* Explicit per-input override: always editable regardless of the form mode. */}
                        <Input label="Internal id (always editable)" value="usr_8f12" onValueChange={() => undefined} mode="edit" />
                    </Form>
                </Card.Body>
            </Card>
        </div>
    );
}
