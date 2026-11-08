import { useEffect, useRef, useState } from "react";
import { Badge, Input, Select, Table, Text } from "@particle-academy/react-fancy";
import { formatRatio, measureAgainst } from "./contrast";
import { useThemeTick } from "./useThemeTick";

type Row = { key: string; what: string; needs: number; criterion: string; ratio: number | null };

/**
 * Real react-fancy controls, then their contrast MEASURED in this browser from
 * what it rendered: the computed colours, painted to sRGB and run through the
 * WCAG formula. Nothing in the table is typed; switch the site theme and it
 * re-measures.
 */
export function ContrastDemo() {
    const root = useRef<HTMLDivElement>(null);
    const tick = useThemeTick();
    const [rows, setRows] = useState<Row[]>([]);

    useEffect(() => {
        const el = root.current;
        if (!el) {
            return;
        }
        const input = el.querySelector<HTMLInputElement>("[data-a11y-sample=input] input");
        const select = el.querySelector<HTMLSelectElement>("[data-a11y-sample=select] select");
        const muted = el.querySelector<HTMLElement>("[data-a11y-sample=muted]");
        const stage = el.querySelector<HTMLElement>("[data-a11y-samples]");

        const border = (node: Element | null) => (node ? getComputedStyle(node).borderTopColor : "");
        setRows([
            {
                key: "input-fill",
                what: "Input outline against its own fill",
                needs: 3,
                criterion: "1.4.11",
                ratio: input ? measureAgainst(border(input), input) : null,
            },
            {
                key: "input-surface",
                what: "Input outline against the surface around it",
                needs: 3,
                criterion: "1.4.11",
                ratio: input && stage ? measureAgainst(border(input), stage) : null,
            },
            {
                key: "select",
                what: "Select outline against its own fill",
                needs: 3,
                criterion: "1.4.11",
                ratio: select ? measureAgainst(border(select), select) : null,
            },
            {
                key: "muted",
                what: "Muted secondary text against its surface",
                needs: 4.5,
                criterion: "1.4.3",
                ratio: muted ? measureAgainst(getComputedStyle(muted).color, muted) : null,
            },
        ]);
    }, [tick]);

    return (
        <div ref={root} className="a11y-contrast" data-a11y-demo="contrast">
            <div className="a11y-samples" data-a11y-samples="">
                <div data-a11y-sample="input">
                    <Input label="Email" type="email" placeholder="you@example.com" />
                </div>
                <div data-a11y-sample="select">
                    <Select label="Plan" list={["Starter", "Team", "Enterprise"]} />
                </div>
                <Text as="p" color="muted" data-a11y-sample="muted">
                    Muted text, for hints and secondary labels.
                </Text>
            </div>

            <div className="a11y-table">
                <Table>
                    <Table.Head>
                        <Table.Row>
                            <Table.Column label="Measured in your browser" />
                            <Table.Column label="Ratio" />
                            <Table.Column label="Needs" />
                            <Table.Column label="Result" />
                        </Table.Row>
                    </Table.Head>
                    <Table.Body>
                        {rows.map((row) => {
                            const pass = row.ratio !== null && row.ratio >= row.needs;
                            return (
                                <Table.Row key={row.key}>
                                    <Table.Cell>{row.what}</Table.Cell>
                                    <Table.Cell>
                                        <span data-a11y-ratio={row.key}>{row.ratio === null ? "could not measure" : formatRatio(row.ratio)}</span>
                                    </Table.Cell>
                                    <Table.Cell>
                                        {row.needs}:1 ({row.criterion})
                                    </Table.Cell>
                                    <Table.Cell>
                                        <Badge color={row.ratio === null ? "zinc" : pass ? "green" : "red"} variant="soft">
                                            {row.ratio === null ? "unmeasured" : pass ? "passes" : "fails"}
                                        </Badge>
                                    </Table.Cell>
                                </Table.Row>
                            );
                        })}
                    </Table.Body>
                </Table>
            </div>
        </div>
    );
}
