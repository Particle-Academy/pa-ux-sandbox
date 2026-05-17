import { router } from "@inertiajs/react";
import { Command } from "@particle-academy/react-fancy";
import { useEffect, useMemo, useState } from "react";

type SearchItem = {
    label: string;
    href: string;
    group: "Docs" | "Components" | "Packages" | "Starter kits" | "Site";
    keywords?: string;
};

const STATIC_ITEMS: SearchItem[] = [
    { label: "Introduction", href: "/docs/introduction", group: "Docs", keywords: "overview start what" },
    { label: "Installation", href: "/docs/installation", group: "Docs", keywords: "npm install setup" },
    { label: "Theming", href: "/docs/theming", group: "Docs", keywords: "tailwind dark mode tokens" },
    { label: "CLI", href: "/docs/cli", group: "Docs", keywords: "fancy-ui add init list" },
    { label: "Registry", href: "/docs/registry", group: "Docs", keywords: "json schema endpoint" },
    { label: "MCP servers", href: "/docs/mcp", group: "Docs", keywords: "agent install runtime bridge" },
    { label: "Human+ UX", href: "/docs/human-plus-ux", group: "Docs", keywords: "architecture agent inhabit" },
    { label: "Changelog", href: "/docs/changelog", group: "Docs", keywords: "release notes versions" },

    { label: "Home", href: "/", group: "Site" },
    { label: "All packages", href: "/packages", group: "Site" },
    { label: "Starter kits", href: "/starter-kits", group: "Site" },
    { label: "Dreaming", href: "/dreaming", group: "Site", keywords: "speculative experimental" },
    { label: "Showcase", href: "/showcase", group: "Site", keywords: "designer submissions gallery" },
    { label: "Leaderboard", href: "/leaderboard", group: "Site" },
];

const STARTER_KITS = ["react-fancy", "fancy-flow", "fancy-whiteboard", "fancy-sheets", "fancy-code", "fancy-echarts"];

type RegistryComponent = {
    name: string;
    title: string;
    package: string;
    description: string;
    url: string;
};

let registryCache: SearchItem[] | null = null;

async function loadRegistry(): Promise<SearchItem[]> {
    if (registryCache) return registryCache;
    try {
        const res = await fetch("/r/index.json", { headers: { Accept: "application/json" } });
        if (!res.ok) return [];
        const data = (await res.json()) as { items: RegistryComponent[] };
        registryCache = data.items.map((c) => ({
            label: c.title,
            href: `/packages/${c.package}/${c.name}`,
            group: "Components" as const,
            keywords: `${c.name} ${c.description} ${c.package}`,
        }));
        return registryCache;
    } catch {
        return [];
    }
}

export function CommandPalette() {
    const [open, setOpen] = useState(false);
    const [extras, setExtras] = useState<SearchItem[]>([]);

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
                e.preventDefault();
                setOpen((cur) => !cur);
            }
            if (e.key === "Escape") setOpen(false);
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, []);

    useEffect(() => {
        if (!open) return;
        loadRegistry().then(setExtras);
    }, [open]);

    const items: SearchItem[] = useMemo(() => {
        const kitItems: SearchItem[] = STARTER_KITS.map((slug) => ({
            label: slug,
            href: `/starter-kits/${slug}`,
            group: "Starter kits" as const,
        }));
        const pkgItems: SearchItem[] = STARTER_KITS.map((slug) => ({
            label: slug,
            href: `/packages/${slug}`,
            group: "Packages" as const,
        }));
        return [...STATIC_ITEMS, ...kitItems, ...pkgItems, ...extras];
    }, [extras]);

    const grouped = useMemo(() => {
        const m = new Map<SearchItem["group"], SearchItem[]>();
        for (const item of items) {
            const list = m.get(item.group) ?? [];
            list.push(item);
            m.set(item.group, list);
        }
        // Preferred group order.
        const order: SearchItem["group"][] = ["Components", "Docs", "Packages", "Starter kits", "Site"];
        return order.filter((g) => m.has(g)).map((g) => [g, m.get(g)!] as const);
    }, [items]);

    const go = (href: string) => {
        setOpen(false);
        router.visit(href);
    };

    if (!open) return null;

    return (
        <Command open={open} onClose={() => setOpen(false)}>
            <Command.Input placeholder="Search components, docs, packages…" />
            <Command.List>
                {grouped.map(([group, list]) => (
                    <Command.Group key={group} heading={group}>
                        {list.map((item) => (
                            <Command.Item
                                key={`${group}-${item.href}`}
                                value={`${item.label} ${item.keywords ?? ""}`}
                                onSelect={() => go(item.href)}
                            >
                                <span className="flex w-full items-center justify-between gap-3">
                                    <span>{item.label}</span>
                                    <span className="font-mono text-[10px] text-zinc-400">{item.href}</span>
                                </span>
                            </Command.Item>
                        ))}
                    </Command.Group>
                ))}
                <Command.Empty>No matches. Try a different query.</Command.Empty>
            </Command.List>
        </Command>
    );
}
