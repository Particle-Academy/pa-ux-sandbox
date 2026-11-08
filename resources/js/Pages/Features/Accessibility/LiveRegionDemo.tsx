import { useEffect, useRef, useState } from "react";
import { ReorderableGrid, Text } from "@particle-academy/react-fancy";

const STEPS = [
    { id: "plan", label: "Plan" },
    { id: "build", label: "Build" },
    { id: "test", label: "Test" },
    { id: "ship", label: "Ship" },
];

/**
 * The real ReorderableGrid, keyboard-operable, with its own live region. A
 * screen reader hears each step of a move; this demo mirrors the same text on
 * screen by reading the component's region (`[data-react-fancy-reorderable-grid-live]`)
 * whenever it changes, so a sighted reader sees exactly what is announced.
 */
export function LiveRegionDemo() {
    const root = useRef<HTMLDivElement>(null);
    const [order, setOrder] = useState(STEPS.map((s) => s.id));
    const [heard, setHeard] = useState<string[]>([]);

    useEffect(() => {
        const region = root.current?.querySelector("[data-react-fancy-reorderable-grid-live]");
        if (!region) {
            return;
        }
        const observer = new MutationObserver(() => {
            const text = (region.textContent ?? "").trim();
            if (text) {
                setHeard((list) => (list[0] === text ? list : [text, ...list].slice(0, 4)));
            }
        });
        observer.observe(region, { childList: true, characterData: true, subtree: true });
        return () => observer.disconnect();
    }, []);

    return (
        <div ref={root} className="a11y-live" data-a11y-demo="live">
            <ReorderableGrid items={STEPS} value={order} onReorder={setOrder} columns={4} label="Release steps" />
            <div className="a11y-live__heard">
                <Text as="span" size="sm" weight="semibold">
                    What a screen reader hears
                </Text>
                {heard.length === 0 ? (
                    <Text as="p" size="sm" color="muted" data-a11y-heard="0">
                        Nothing yet. Tab to a step, press Space, move it with the arrow keys, press Space again.
                    </Text>
                ) : (
                    <ol className="a11y-live__list" data-a11y-heard={heard.length}>
                        {heard.map((line, i) => (
                            <li key={`${i}-${line}`}>
                                <Text as="span" size="sm">
                                    {line}
                                </Text>
                            </li>
                        ))}
                    </ol>
                )}
            </div>
        </div>
    );
}
