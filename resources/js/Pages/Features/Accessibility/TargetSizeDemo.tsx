import { useEffect, useRef, useState } from "react";
import { Badge, Button, Table } from "@particle-academy/react-fancy";
import { meetsTarget, TARGET_AA, TARGET_AAA } from "./targets";
import { useThemeTick } from "./useThemeTick";

const SIZES = ["xs", "sm", "md", "lg"] as const;
type Size = (typeof SIZES)[number];
type Measured = { size: Size; width: number; height: number };

/**
 * react-fancy Buttons at each size, measured from their rendered boxes in this
 * browser. Nothing in the table is typed: pick the size your target needs.
 */
export function TargetSizeDemo() {
    const root = useRef<HTMLDivElement>(null);
    const tick = useThemeTick();
    const [measured, setMeasured] = useState<Measured[]>([]);

    useEffect(() => {
        const el = root.current;
        if (!el) {
            return;
        }
        const read = () =>
            setMeasured(
                SIZES.map((size) => {
                    const box = el.querySelector(`[data-a11y-target="${size}"]`)?.getBoundingClientRect();
                    return { size, width: Math.round(box?.width ?? 0), height: Math.round(box?.height ?? 0) };
                }),
            );
        read();
        const observer = new ResizeObserver(read);
        el.querySelectorAll("[data-a11y-target]").forEach((node) => observer.observe(node));
        return () => observer.disconnect();
    }, [tick]);

    return (
        <div ref={root} className="a11y-targets" data-a11y-demo="targets">
            <div className="a11y-targets__row">
                {SIZES.map((size) => (
                    <Button key={size} size={size} icon="heart" data-a11y-target={size}>
                        {size}
                    </Button>
                ))}
            </div>
            <div className="a11y-table">
                <Table>
                    <Table.Head>
                        <Table.Row>
                            <Table.Column label="Button size" />
                            <Table.Column label="Rendered box" />
                            <Table.Column label={`AA, ${TARGET_AA}px`} />
                            <Table.Column label={`AAA, ${TARGET_AAA}px`} />
                        </Table.Row>
                    </Table.Head>
                    <Table.Body>
                        {measured.map((m) => (
                            <Table.Row key={m.size}>
                                <Table.Cell>{m.size}</Table.Cell>
                                <Table.Cell>
                                    <span data-a11y-box={m.size}>
                                        {m.width} x {m.height}
                                    </span>
                                </Table.Cell>
                                {[TARGET_AA, TARGET_AAA].map((min) => (
                                    <Table.Cell key={min}>
                                        <Badge color={meetsTarget(m.width, m.height, min) ? "green" : "zinc"} variant="soft">
                                            {meetsTarget(m.width, m.height, min) ? "meets" : "smaller"}
                                        </Badge>
                                    </Table.Cell>
                                ))}
                            </Table.Row>
                        ))}
                    </Table.Body>
                </Table>
            </div>
        </div>
    );
}
