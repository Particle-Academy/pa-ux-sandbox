import { Head, useForm } from "@inertiajs/react";
import { Badge, Button, Card, Icon, Switch, Text } from "@particle-academy/react-fancy";
import type { Color } from "@particle-academy/react-fancy";
import { DownlineTree, type DownlineEdge, type DownlineMember } from "@particle-academy/fancy-mlm-ui";
import { adminLayout } from "../AdminLayout";
import { PageHeader } from "../ui";

type Tree = "unilevel" | "binary" | "matrix";
type Plan = {
    tree: Tree;
    width: number;
    metric: string;
    levelFactors: number[];
    tiers: Record<string, number>;
    compression: boolean;
    defaultTier: string;
};
type TreeOption = { value: Tree; label: string; blurb: string };
type Props = { plan: Plan; edge: DownlineEdge; network: DownlineMember[]; trees: TreeOption[] };

const TIER_COLOR: Record<string, Color> = { bronze: "orange", silver: "zinc", gold: "amber", diamond: "violet" };
const tierColor = (tier?: string): Color => (tier && TIER_COLOR[tier]) || "slate";
const edgeFor = (tree: Tree): DownlineEdge => (tree === "unilevel" ? "sponsor" : "placement");

function AdminMlm({ plan, network, trees }: Props) {
    const f = useForm<{
        tree: Tree;
        width: number;
        levelFactors: number[];
        compression: boolean;
        tiers: Record<string, number>;
    }>({
        tree: plan.tree,
        width: plan.width || 3,
        levelFactors: plan.levelFactors.length ? plan.levelFactors : [1],
        compression: plan.compression,
        tiers: plan.tiers,
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        f.put("/admin/mlm", { preserveScroll: true });
    };

    const setFactor = (i: number, v: number) =>
        f.setData("levelFactors", f.data.levelFactors.map((x, idx) => (idx === i ? v : x)));
    const addLevel = () => f.setData("levelFactors", [...f.data.levelFactors, 0.1]);
    const removeLevel = (i: number) =>
        f.setData("levelFactors", f.data.levelFactors.filter((_, idx) => idx !== i));
    const setTier = (key: string, v: number) => f.setData("tiers", { ...f.data.tiers, [key]: v });

    const previewEdge = edgeFor(f.data.tree);

    return (
        <>
            <Head title="Referral Program · Admin" />
            <PageHeader
                title="Referral Program"
                sub="Configure the fancy-mlm compensation plan. Changes go live immediately across the engine, the /referrals surface, and the fun-lab referral loop."
            />

            <form onSubmit={submit} className="grid gap-6 xl:grid-cols-[1.1fr_1fr]">
                <div className="flex flex-col gap-6">
                    {/* ── Tree shape ─────────────────────────────────────── */}
                    <Card>
                        <Card.Header>
                            <span className="font-semibold">Downline shape</span>
                        </Card.Header>
                        <Card.Body>
                            <div className="grid gap-3">
                                {trees.map((t) => {
                                    const active = f.data.tree === t.value;
                                    return (
                                        <button
                                            type="button"
                                            key={t.value}
                                            onClick={() => f.setData("tree", t.value)}
                                            className={`rounded-xl border p-4 text-left transition ${
                                                active
                                                    ? "border-teal-500 bg-teal-500/5 ring-1 ring-teal-500/30"
                                                    : "border-[var(--border-1)] hover:border-[var(--border-2)]"
                                            }`}
                                        >
                                            <div className="flex items-center justify-between">
                                                <span className="font-medium">{t.label}</span>
                                                {active && <Icon name="check-circle" className="h-4 w-4 text-teal-500" />}
                                            </div>
                                            <Text className="mt-1 text-sm text-[var(--fg-3)]">{t.blurb}</Text>
                                        </button>
                                    );
                                })}
                            </div>

                            {f.data.tree === "matrix" && (
                                <label className="mt-4 block text-sm font-medium">
                                    Matrix width (legs per member)
                                    <input
                                        type="number"
                                        min={2}
                                        max={6}
                                        value={f.data.width}
                                        onChange={(e) => f.setData("width", Number(e.target.value))}
                                        className="mt-1 w-32 rounded-lg border border-[var(--border-1)] bg-[var(--bg-0)] px-3 py-2 text-sm"
                                    />
                                </label>
                            )}
                        </Card.Body>
                    </Card>

                    {/* ── Level factors ──────────────────────────────────── */}
                    <Card>
                        <Card.Header>
                            <div className="flex items-center justify-between">
                                <span className="font-semibold">Level decay</span>
                                <Button type="button" variant="ghost" size="sm" onClick={addLevel} disabled={f.data.levelFactors.length >= 8}>
                                    <Icon name="plus" className="mr-1 h-3.5 w-3.5" /> Add level
                                </Button>
                            </div>
                            <Text className="text-sm text-[var(--fg-3)]">
                                Share of the base bonus paid at each upline level (0–1).
                            </Text>
                        </Card.Header>
                        <Card.Body>
                            <div className="flex flex-wrap gap-3">
                                {f.data.levelFactors.map((factor, i) => (
                                    <div key={i} className="flex flex-col items-center gap-1">
                                        <span className="text-xs text-[var(--fg-3)]">L{i + 1}</span>
                                        <input
                                            type="number"
                                            step={0.05}
                                            min={0}
                                            max={1}
                                            value={factor}
                                            onChange={(e) => setFactor(i, Number(e.target.value))}
                                            className="w-20 rounded-lg border border-[var(--border-1)] bg-[var(--bg-0)] px-2 py-1.5 text-center text-sm"
                                        />
                                        {f.data.levelFactors.length > 1 && (
                                            <button type="button" onClick={() => removeLevel(i)} className="text-xs text-rose-500 hover:underline">
                                                remove
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </Card.Body>
                    </Card>

                    {/* ── Tiers ──────────────────────────────────────────── */}
                    <Card>
                        <Card.Header>
                            <span className="font-semibold">Tier multipliers</span>
                            <Text className="text-sm text-[var(--fg-3)]">Scales the bonus by each upline member's rank.</Text>
                        </Card.Header>
                        <Card.Body>
                            <div className="grid gap-3 sm:grid-cols-2">
                                {Object.entries(f.data.tiers).map(([key, mult]) => (
                                    <label key={key} className="flex items-center justify-between gap-3 rounded-lg border border-[var(--border-1)] px-3 py-2">
                                        <Badge color={tierColor(key)} variant="soft" className="capitalize">{key}</Badge>
                                        <input
                                            type="number"
                                            step={0.05}
                                            min={0.1}
                                            max={10}
                                            value={mult}
                                            onChange={(e) => setTier(key, Number(e.target.value))}
                                            className="w-24 rounded-lg border border-[var(--border-1)] bg-[var(--bg-0)] px-2 py-1.5 text-right text-sm"
                                        />
                                    </label>
                                ))}
                            </div>

                            <label className="mt-4 flex items-center gap-3">
                                <Switch checked={f.data.compression} onCheckedChange={(v) => f.setData("compression", Boolean(v))} />
                                <span className="text-sm">
                                    <span className="font-medium">Dynamic compression</span>
                                    <span className="text-[var(--fg-3)]"> — skip inactive uplines so the next active member earns the level.</span>
                                </span>
                            </label>
                        </Card.Body>
                    </Card>

                    <div className="flex items-center gap-3">
                        <Button type="submit" color="teal" disabled={f.processing}>
                            <Icon name="save" className="mr-1 h-4 w-4" /> Save plan
                        </Button>
                        {f.recentlySuccessful && (
                            <span className="text-sm text-teal-600">
                                <Icon name="check" className="mr-1 inline h-4 w-4" /> Saved — live now.
                            </span>
                        )}
                    </div>
                </div>

                {/* ── Live preview ───────────────────────────────────────── */}
                <Card className="h-fit xl:sticky xl:top-6">
                    <Card.Header>
                        <div className="flex items-center justify-between">
                            <span className="font-semibold">Live preview</span>
                            <Badge color="teal" variant="soft" className="capitalize">{f.data.tree}</Badge>
                        </div>
                        <Text className="text-sm text-[var(--fg-3)]">
                            The same demo network, re-shaped by the selected tree — drawn along the{" "}
                            <span className="font-medium">{previewEdge}</span> edge.
                        </Text>
                    </Card.Header>
                    <Card.Body>
                        {network.length > 0 ? (
                            <DownlineTree value={network} edge={previewEdge} tierColor={tierColor} />
                        ) : (
                            <Text className="text-sm text-[var(--fg-3)]">
                                No demo network seeded. Run <code>php artisan db:seed --class=MlmNetworkSeeder</code>.
                            </Text>
                        )}
                    </Card.Body>
                </Card>
            </form>
        </>
    );
}

AdminMlm.layout = adminLayout;

export default AdminMlm;
