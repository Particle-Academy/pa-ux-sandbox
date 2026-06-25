import { Badge, Button, Card, Field, Input, Switch, Text } from "@particle-academy/react-fancy";
import { useMemo, useState } from "react";

export type SitemapOverride = { priority?: string; changefreq?: string };
export type SitemapExtra = { loc: string; priority?: string; changefreq?: string };

/** The `sitemapControls` section of the well-known-files model — read server-side by App\Support\DynamicSitemap. */
export type SitemapControlsModel = {
    exclude?: string[];
    overrides?: Record<string, SitemapOverride>;
    extra?: SitemapExtra[];
};

/** One auto-discovered URL, passed live from the controller (FancySeo::sitemapUrls()). */
export type SitemapUrl = { loc: string; path: string; priority: string; changefreq: string };

const CHANGEFREQS = ["always", "hourly", "daily", "weekly", "monthly", "yearly", "never"];
const PRIORITIES = ["1.0", "0.9", "0.8", "0.7", "0.6", "0.5", "0.4", "0.3", "0.2", "0.1", "0.0"];

const selectCls =
    "rounded-md border border-zinc-300 bg-white px-2 py-1 text-xs text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 disabled:opacity-40";

type Props = {
    urls: SitemapUrl[];
    value: SitemapControlsModel;
    onChange: (next: SitemapControlsModel) => void;
};

/**
 * Admin controls for the dynamic sitemap. The sitemap is auto-generated from the
 * site's pages (fancy-seo's URL providers) and served by fancy-x-files; these
 * controls layer on top — drop pages, override their priority / change-frequency,
 * or add extra URLs — without freezing the live discovery.
 */
export function SitemapControls({ urls, value, onChange }: Props) {
    const exclude = value.exclude ?? [];
    const overrides = value.overrides ?? {};
    const extra = value.extra ?? [];
    const [filter, setFilter] = useState("");
    const [draft, setDraft] = useState<SitemapExtra>({ loc: "", priority: "0.5", changefreq: "weekly" });

    const excludeSet = useMemo(() => new Set(exclude), [exclude]);
    const filtered = useMemo(() => {
        const q = filter.trim().toLowerCase();
        return q ? urls.filter((u) => u.loc.toLowerCase().includes(q)) : urls;
    }, [urls, filter]);
    const liveCount = urls.filter((u) => !excludeSet.has(u.path)).length + extra.length;

    const patch = (next: Partial<SitemapControlsModel>) => onChange({ ...value, ...next });

    const toggleExclude = (path: string, dropped: boolean) =>
        patch({
            exclude: dropped ? [...exclude.filter((p) => p !== path), path] : exclude.filter((p) => p !== path),
        });

    const setOverride = (path: string, field: keyof SitemapOverride, v: string, auto: string) => {
        const cur: SitemapOverride = { ...(overrides[path] ?? {}) };
        if (v === "" || v === auto) {
            delete cur[field];
        } else {
            cur[field] = v;
        }
        const next = { ...overrides };
        if (Object.keys(cur).length === 0) {
            delete next[path];
        } else {
            next[path] = cur;
        }
        patch({ overrides: next });
    };

    const addExtra = () => {
        const loc = draft.loc.trim();
        if (!loc) return;
        patch({ extra: [...extra, { loc, priority: draft.priority, changefreq: draft.changefreq }] });
        setDraft({ loc: "", priority: "0.5", changefreq: "weekly" });
    };
    const removeExtra = (i: number) => patch({ extra: extra.filter((_, j) => j !== i) });

    return (
        <Card className="mt-5">
            <Card.Body>
                <div className="flex items-start justify-between gap-3">
                    <div>
                        <Text className="font-semibold">sitemap.xml</Text>
                        <Text size="sm" className="mt-0.5 text-zinc-500 dark:text-zinc-400">
                            Auto-generated from your pages and served by fancy-x-files with the{" "}
                            <code className="font-mono">protect()</code> guard — private paths can never appear. It
                            stays dynamic; the controls below layer on top.
                        </Text>
                    </div>
                    <Badge color="violet" size="sm">
                        {liveCount} URLs live
                    </Badge>
                </div>

                <div className="mt-4">
                    <Field label={`Auto-discovered pages (${urls.length})`}>
                        <Input
                            value={filter}
                            onChange={(e) => setFilter(e.target.value)}
                            placeholder="Filter URLs…"
                        />
                    </Field>
                    <div className="mt-2 max-h-80 divide-y divide-zinc-100 overflow-y-auto rounded-lg border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
                        {filtered.length === 0 && (
                            <div className="px-3 py-6 text-center">
                                <Text size="sm" className="text-zinc-500">
                                    No matching URLs.
                                </Text>
                            </div>
                        )}
                        {filtered.map((u) => {
                            const dropped = excludeSet.has(u.path);
                            const ov = overrides[u.path] ?? {};
                            return (
                                <div
                                    key={u.path}
                                    className={`flex items-center gap-2 px-3 py-2 ${dropped ? "opacity-50" : ""}`}
                                >
                                    <code className="flex-1 truncate font-mono text-xs">{u.path}</code>
                                    <select
                                        className={selectCls}
                                        value={ov.priority ?? u.priority}
                                        disabled={dropped}
                                        title="Priority"
                                        onChange={(e) => setOverride(u.path, "priority", e.target.value, u.priority)}
                                    >
                                        {PRIORITIES.map((p) => (
                                            <option key={p} value={p}>
                                                {p}
                                            </option>
                                        ))}
                                    </select>
                                    <select
                                        className={selectCls}
                                        value={ov.changefreq ?? u.changefreq}
                                        disabled={dropped}
                                        title="Change frequency"
                                        onChange={(e) => setOverride(u.path, "changefreq", e.target.value, u.changefreq)}
                                    >
                                        {CHANGEFREQS.map((c) => (
                                            <option key={c} value={c}>
                                                {c}
                                            </option>
                                        ))}
                                    </select>
                                    <Switch
                                        checked={!dropped}
                                        onCheckedChange={(on) => toggleExclude(u.path, !on)}
                                        color="violet"
                                    />
                                </div>
                            );
                        })}
                    </div>
                    <Text size="xs" className="mt-1 text-zinc-500 dark:text-zinc-400">
                        Toggle off to drop a page from the sitemap; change the dropdowns to override its priority /
                        change-frequency. {Object.keys(overrides).length} override(s), {exclude.length} excluded.
                    </Text>
                </div>

                <div className="mt-4">
                    <Text size="sm" className="font-medium">
                        Extra URLs
                    </Text>
                    {extra.length > 0 && (
                        <div className="mt-2 divide-y divide-zinc-100 rounded-lg border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
                            {extra.map((x, i) => (
                                <div key={`${x.loc}-${i}`} className="flex items-center gap-3 px-3 py-2">
                                    <code className="flex-1 truncate font-mono text-xs">{x.loc}</code>
                                    <Badge color="zinc" size="sm" variant="soft">
                                        {x.priority ?? "0.5"} · {x.changefreq ?? "weekly"}
                                    </Badge>
                                    <Button variant="ghost" size="sm" icon="trash-2" onClick={() => removeExtra(i)} />
                                </div>
                            ))}
                        </div>
                    )}
                    <div className="mt-2 flex items-end gap-2">
                        <div className="flex-1">
                            <Input
                                value={draft.loc}
                                onChange={(e) => setDraft({ ...draft, loc: e.target.value })}
                                placeholder="https://… or /path not auto-discovered"
                            />
                        </div>
                        <select
                            className={`${selectCls} py-2`}
                            value={draft.priority}
                            title="Priority"
                            onChange={(e) => setDraft({ ...draft, priority: e.target.value })}
                        >
                            {PRIORITIES.map((p) => (
                                <option key={p} value={p}>
                                    {p}
                                </option>
                            ))}
                        </select>
                        <select
                            className={`${selectCls} py-2`}
                            value={draft.changefreq}
                            title="Change frequency"
                            onChange={(e) => setDraft({ ...draft, changefreq: e.target.value })}
                        >
                            {CHANGEFREQS.map((c) => (
                                <option key={c} value={c}>
                                    {c}
                                </option>
                            ))}
                        </select>
                        <Button icon="plus" onClick={addExtra}>
                            Add
                        </Button>
                    </div>
                </div>
            </Card.Body>
        </Card>
    );
}
