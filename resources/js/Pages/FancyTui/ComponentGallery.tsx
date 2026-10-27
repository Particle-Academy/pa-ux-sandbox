import { Badge, Button, Icon, Input } from "@particle-academy/react-fancy";
import previews from "@particle-academy/fancy-tui/showcase/previews.json";
import { useMemo, useState } from "react";
import { clientOnly } from "../../lib/clientOnly";

const ConsoleSurface = clientOnly(
    () => import("./ConsoleSurface"),
    ({ label }: { output: string; label: string }) => (
        <div className="ftui-terminal ftui-terminal--loading">Loading {label} console…</div>
    ),
);

export type CapturedComponent = {
    slug: string;
    name: string;
    group: string;
    source: string;
    /** Real ANSI, captured by rendering the component with Ink. */
    frame: string;
};

const components = (previews as { components: CapturedComponent[] }).components;

/**
 * Every frame below is the component's ACTUAL Ink output, captured by
 * fancy-tui's `npm run showcase` and shipped inside the package. Nothing here
 * is hand-drawn terminal art, so a preview can never drift from the component
 * or land with mismatched box borders.
 */
export function ComponentGallery() {
    const [query, setQuery] = useState("");
    const [activeGroup, setActiveGroup] = useState<string | null>(null);

    const groups = useMemo(() => [...new Set(components.map((c) => c.group))], []);

    const matches = useMemo(() => {
        const q = query.trim().toLowerCase();
        return components.filter((c) => {
            if (activeGroup && c.group !== activeGroup) return false;
            if (!q) return true;
            return c.name.toLowerCase().includes(q) || c.group.toLowerCase().includes(q);
        });
    }, [query, activeGroup]);

    const byGroup = useMemo(() => {
        const map = new Map<string, CapturedComponent[]>();
        for (const c of matches) {
            const list = map.get(c.group) ?? [];
            list.push(c);
            map.set(c.group, list);
        }
        return [...map.entries()];
    }, [matches]);

    return (
        <section className="ftui-gallery" aria-label="Fancy TUI components">
            <header className="ftui-gallery__head">
                <div>
                    <h2>Every component</h2>
                    <p>
                        {components.length} components, each rendered with real Ink and captured to ANSI —
                        so what you see is exactly what your terminal draws.
                    </p>
                </div>
                <Input
                    className="ftui-gallery__search"
                    type="search"
                    value={query}
                    placeholder="Filter components…"
                    label="Filter components"
                    labelHidden
                    leading={<Icon name="search" size="sm" />}
                    onValueChange={setQuery}
                />
            </header>

            <div className="ftui-gallery__filters" role="group" aria-label="Filter by group">
                <Button
                    variant={activeGroup === null ? "default" : "ghost"}
                    color={activeGroup === null ? "green" : undefined}
                    aria-pressed={activeGroup === null}
                    onClick={() => setActiveGroup(null)}
                >
                    All ({components.length})
                </Button>
                {groups.map((group) => (
                    <Button
                        key={group}
                        variant={activeGroup === group ? "default" : "ghost"}
                        color={activeGroup === group ? "green" : undefined}
                        aria-pressed={activeGroup === group}
                        onClick={() => setActiveGroup(group === activeGroup ? null : group)}
                    >
                        {group} ({components.filter((c) => c.group === group).length})
                    </Button>
                ))}
            </div>

            {matches.length === 0 && <p className="ftui-gallery__empty">No component matches “{query}”.</p>}

            {byGroup.map(([group, items]) => (
                <div className="ftui-gallery__group" key={group}>
                    <h3 id={`group-${group.replace(/\W+/g, "-").toLowerCase()}`}>{group}</h3>
                    <div className="ftui-gallery__grid">
                        {items.map((component) => (
                            <ComponentCard key={component.slug} component={component} />
                        ))}
                    </div>
                </div>
            ))}
        </section>
    );
}

function ComponentCard({ component }: { component: CapturedComponent }) {
    const [showSource, setShowSource] = useState(false);
    // A captured frame is fixed-height text; size the terminal to it so short
    // components don't sit in a tall empty box.
    const lines = component.frame.split("\n").length;

    return (
        <article className="ftui-card" id={component.slug} data-component={component.name}>
            <header className="ftui-card__head">
                <h4>{component.name}</h4>
                <div>
                    <Badge color="green" variant="soft" size="md">{component.group}</Badge>
                    <Button
                        variant="ghost"
                        className="ftui-card__toggle"
                        onClick={() => setShowSource((v) => !v)}
                        aria-pressed={showSource}
                        aria-label={`${showSource ? "Show preview of" : "Show code for"} ${component.name}`}
                    >
                        {showSource ? "Preview" : "Code"}
                    </Button>
                </div>
            </header>

            {showSource ? (
                <pre className="ftui-card__source">
                    <code>{component.source}</code>
                </pre>
            ) : (
                <div className="ftui-card__preview" style={{ ["--ftui-rows" as string]: String(lines) }}>
                    <ConsoleSurface output={component.frame.replace(/\n/g, "\r\n")} label={component.name} />
                </div>
            )}
        </article>
    );
}
