import { useEffect, useMemo, useState } from "react";
import { Badge, Button, Card, Icon, Input, Skeleton, Text } from "@particle-academy/react-fancy";
import {
    addNodeCommand,
    categoriesOf,
    filterNodes,
    runtimeLabel,
    type MarketplaceIndex,
    type MarketplaceNode,
} from "./marketplace";

/** The registry endpoint `fancy-cli add node` resolves through. */
const INDEX_URL = "/r/nodes/index.json";

type Load = { state: "loading" } | { state: "ready"; items: MarketplaceNode[] } | { state: "failed" };

/**
 * The node marketplace, read live from `/r/nodes/index.json` — the same index
 * the CLI installs from, so nothing here is a copy that can drift. A node is
 * vendored SOURCE: the command copies it into your project, there is no
 * package to install.
 */
export function NodeMarketplace() {
    const [load, setLoad] = useState<Load>({ state: "loading" });
    const [query, setQuery] = useState("");
    const [category, setCategory] = useState<string | null>(null);

    useEffect(() => {
        let active = true;
        fetch(INDEX_URL, { headers: { Accept: "application/json" } })
            .then((response) => (response.ok ? (response.json() as Promise<MarketplaceIndex>) : Promise.reject()))
            .then((index) => active && setLoad({ state: "ready", items: index.items ?? [] }))
            .catch(() => active && setLoad({ state: "failed" }));
        return () => {
            active = false;
        };
    }, []);

    const items = load.state === "ready" ? load.items : [];
    const categories = useMemo(() => categoriesOf(items), [items]);
    const matches = useMemo(() => filterNodes(items, query, category), [items, query, category]);

    if (load.state === "failed") {
        return (
            <Text as="p" size="sm" color="muted" data-marketplace-state="failed">
                The marketplace index could not be loaded just now. It is served at{" "}
                <a className="feature-link" href={INDEX_URL}>
                    {INDEX_URL}
                </a>
                .
            </Text>
        );
    }

    return (
        <div className="flow-market" data-marketplace-state={load.state}>
            <div className="flow-market__tools">
                <Input
                    type="search"
                    label="Search nodes"
                    labelHidden
                    placeholder="Search nodes: git, stripe, research…"
                    value={query}
                    onValueChange={setQuery}
                    leading={<Icon name="search" size="sm" />}
                    className="flow-market__search"
                />
                <div className="flow-market__filters" role="group" aria-label="Filter by category">
                    <Button variant={category === null ? "default" : "ghost"} color={category === null ? "sky" : undefined} aria-pressed={category === null} onClick={() => setCategory(null)}>
                        All {items.length > 0 && `(${items.length})`}
                    </Button>
                    {categories.map((name) => (
                        <Button
                            key={name}
                            variant={category === name ? "default" : "ghost"}
                            color={category === name ? "sky" : undefined}
                            aria-pressed={category === name}
                            onClick={() => setCategory(category === name ? null : name)}
                        >
                            {name}
                        </Button>
                    ))}
                </div>
            </div>

            {load.state === "loading" ? (
                <div className="flow-market__grid" aria-busy="true">
                    {[0, 1, 2].map((i) => (
                        <Skeleton key={i} height={148} className="flow-market__skeleton" />
                    ))}
                </div>
            ) : (
                <>
                    <Text as="p" size="sm" color="muted" aria-live="polite">
                        {matches.length} of {items.length} nodes
                    </Text>
                    <div className="flow-market__grid">
                        {matches.slice(0, 9).map((item) => (
                            <NodeCard key={item.kind} node={item} />
                        ))}
                    </div>
                    {matches.length > 9 && (
                        <Text as="p" size="sm" color="muted">
                            Showing 9. Narrow the search to see the rest.
                        </Text>
                    )}
                </>
            )}
        </div>
    );
}

function NodeCard({ node }: { node: MarketplaceNode }) {
    const [copied, setCopied] = useState(false);
    const command = addNodeCommand(node.kind);

    const copy = () => {
        void navigator.clipboard.writeText(command).then(() => {
            setCopied(true);
            window.setTimeout(() => setCopied(false), 1200);
        });
    };

    return (
        <Card variant="outlined" padding="sm" className="flow-market__card" data-node-kind={node.kind}>
            <div className="flow-market__head">
                <Text as="span" weight="semibold">
                    {node.title}
                </Text>
                <Badge size="md" variant="soft">
                    {node.category}
                </Badge>
                {node.verified && (
                    <Badge size="md" variant="soft" color="green">
                        verified
                    </Badge>
                )}
            </div>
            <Text as="p" size="sm" color="muted" className="flow-market__desc">
                {node.description}
            </Text>
            <div className="flow-market__runtimes">
                {node.runtimes.map((runtime) => (
                    <Badge key={runtime} size="md" variant="outline">
                        {runtimeLabel(runtime)}
                    </Badge>
                ))}
            </div>
            <div className="flow-market__cmd">
                <code className="feature-code">{command}</code>
                <Button variant="ghost" icon={copied ? "check" : "copy"} onClick={copy} aria-label={`Copy: ${command}`}>
                    {copied ? "Copied" : "Copy"}
                </Button>
            </div>
        </Card>
    );
}
