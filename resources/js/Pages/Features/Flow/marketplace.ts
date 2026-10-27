/**
 * The node marketplace index, as `GET /r/nodes/index.json` serves it
 * (NodeRegistryController::index). The same index `fancy-cli add node`
 * resolves through, so what the page lists is exactly what the CLI installs.
 */
export type MarketplaceNode = {
    kind: string;
    title: string;
    description: string;
    category: string;
    runtimes: string[];
    verified?: boolean;
    connector?: boolean;
    service?: string;
    url: string;
};

export type MarketplaceIndex = { items: MarketplaceNode[] };

/** The command the CLI documents for vendoring one node (fancy-ui-cli `nodes.ts`). */
export function addNodeCommand(kind: string): string {
    return `npx fancy-cli@latest add node ${kind}`;
}

/** Categories in first-seen order, so the filter follows the index's own sort. */
export function categoriesOf(items: MarketplaceNode[]): string[] {
    return [...new Set(items.map((item) => item.category))];
}

/**
 * Narrow the index by category and a free-text query over the kind, title,
 * description and service. Case-insensitive; a blank query matches everything.
 */
export function filterNodes(items: MarketplaceNode[], query: string, category: string | null): MarketplaceNode[] {
    const q = query.trim().toLowerCase();

    return items.filter((item) => {
        if (category !== null && item.category !== category) return false;
        if (q === "") return true;

        return [item.kind, item.title, item.description, item.service ?? ""].some((field) =>
            field.toLowerCase().includes(q),
        );
    });
}

/** Display label for a runtime id in the index (`ts`, `php`, `py`). */
export function runtimeLabel(runtime: string): string {
    return ({ ts: "TypeScript", php: "PHP", py: "Python" } as Record<string, string>)[runtime] ?? runtime;
}
