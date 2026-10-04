import type { CSSProperties } from "react";
import type { ComponentDoc } from "./types";
import { Grid, Text } from "@particle-academy/react-fancy";

/** Numbered cells, so a column count is countable rather than asserted. */
function Cells({ count }: { count: number }) {
    return (
        <>
            {Array.from({ length: count }, (_, i) => (
                <div
                    key={i}
                    className="rounded-lg border border-zinc-200 bg-white p-4 text-center text-sm font-medium text-zinc-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300"
                >
                    {i + 1}
                </div>
            ))}
        </>
    );
}

export const gridDoc: ComponentDoc = {
    intro: (
        <>
            <p>
                The modular grid. Column count travels through a custom property rather than
                a <code>grid-cols-N</code> class, because <code>N</code> is a prop — Tailwind
                cannot generate a class it never sees in source, which is why every
                hand-rolled copy in the gallery worked around it differently.
            </p>
            <p>
                <strong>
                    <code>cols</code> is a ceiling, not a fixed count.
                </strong>{" "}
                With <code>responsive</code> on (the default) the grid uses fewer columns as
                it narrows and never more than <code>cols</code>. Resize this page to watch
                the examples below drop columns.
            </p>
        </>
    ),
    examples: [
        {
            name: "Default",
            description: "No props is a responsive 3-column ceiling with the md gutter.",
            render: () => (
                <Grid className="w-full">
                    <Cells count={6} />
                </Grid>
            ),
            code: `<Grid>
    <Card>…</Card>
    <Card>…</Card>
    <Card>…</Card>
</Grid>`,
        },
        {
            name: "Column ceilings",
            description:
                "Two, three and four, each still collapsing on a narrow viewport. Until 5.23.0 these three rendered identically while responsive was on — cols was published but the track template ignored it, so a grid asked for 2 and a grid asked for 5 produced the same row.",
            render: () => (
                <div className="w-full space-y-6">
                    {([2, 3, 4] as const).map((cols) => (
                        <div key={cols}>
                            <Text className="mb-2 text-xs font-medium text-zinc-500">
                                cols={cols}
                            </Text>
                            <Grid className="w-full" cols={cols}>
                                <Cells count={cols * 2} />
                            </Grid>
                        </div>
                    ))}
                </div>
            ),
            code: `<Grid cols={2}>…</Grid>
<Grid cols={3}>…</Grid>
<Grid cols={4}>…</Grid>`,
        },
        {
            name: "Gutters",
            description:
                "sm (0.75rem), md (1.5rem) and lg (2.5rem). The grid applies the length itself rather than through a gap-* class, because the column cap has to divide by the gutter actually in effect — when those two disagreed by 2px, a 3-up grid silently rendered 2-up.",
            render: () => (
                <div className="w-full space-y-6">
                    {(["sm", "md", "lg"] as const).map((gap) => (
                        <div key={gap}>
                            <Text className="mb-2 text-xs font-medium text-zinc-500">
                                gap="{gap}"
                            </Text>
                            <Grid className="w-full" cols={3} gap={gap}>
                                <Cells count={3} />
                            </Grid>
                        </div>
                    ))}
                </div>
            ),
            code: `<Grid cols={3} gap="sm">…</Grid>
<Grid cols={3} gap="md">…</Grid>
<Grid cols={3} gap="lg">…</Grid>`,
        },
        {
            name: "Fixed, with responsive off",
            description:
                "responsive={false} means exactly cols columns at every width — for grids that are genuinely fixed, like a 2-up of icons, where collapsing looks broken rather than responsive. Narrow the page: this one does not reflow.",
            render: () => (
                <Grid className="w-full" cols={2} responsive={false}>
                    <Cells count={4} />
                </Grid>
            ),
            code: `<Grid cols={2} responsive={false}>
    <Icon name="bolt" />
    <Icon name="cube" />
    <Icon name="globe-alt" />
    <Icon name="sparkles" />
</Grid>`,
        },
        {
            name: "Overriding the property in CSS",
            description:
                "cols and gap are published as --fancy-grid-cols and --fancy-grid-gap, and the track template reads them back — so setting either in CSS genuinely changes the layout, and the gutter moves together with the arithmetic that depends on it. This grid is asked for 3 and overridden to 5.",
            render: () => (
                <Grid
                    className="w-full"
                    cols={3}
                    style={{ "--fancy-grid-cols": "5" } as CSSProperties}
                >
                    <Cells count={5} />
                </Grid>
            ),
            code: `/* A design can retune the grid without fighting a utility class. */
.dense-grid {
    --fancy-grid-cols: 5;
    --fancy-grid-gap: 0.5rem;
}

<Grid cols={3} className="dense-grid">…</Grid>`,
        },
        {
            name: "Uneven content",
            description:
                "Tracks are 1fr, so columns stay equal while rows size to their tallest cell. Nothing needs a fixed height.",
            render: () => (
                <Grid className="w-full" cols={3}>
                    <div className="rounded-lg border border-zinc-200 p-4 text-sm dark:border-zinc-700">
                        Short.
                    </div>
                    <div className="rounded-lg border border-zinc-200 p-4 text-sm dark:border-zinc-700">
                        A considerably longer cell, which sets the height of this row without
                        anyone having to measure it or pass a height prop.
                    </div>
                    <div className="rounded-lg border border-zinc-200 p-4 text-sm dark:border-zinc-700">
                        Medium length cell.
                    </div>
                </Grid>
            ),
            code: `<Grid cols={3}>
    <Card>Short.</Card>
    <Card>A considerably longer cell…</Card>
    <Card>Medium length cell.</Card>
</Grid>`,
        },
    ],
    props: [
        { name: "cols", type: `number`, default: `3`, description: "The most columns the grid may use. A ceiling while `responsive` is on, an exact count when it is off." },
        { name: "gap", type: `"sm" | "md" | "lg"`, default: `"md"`, description: "Gutter — 0.75rem / 1.5rem / 2.5rem, published as `--fancy-grid-gap`." },
        { name: "responsive", type: `boolean`, default: `true`, description: "Collapse toward one column as the grid narrows. Turn off for grids that are genuinely fixed." },
        { name: "children", type: `ReactNode`, default: "—", description: "Grid items. Each child is one cell; the grid adds no wrapper." },
        { name: "...rest", type: `HTMLAttributes<HTMLDivElement>`, default: "—", description: "All standard div attributes. `className` and `style` both merge." },
    ],
    notes: (
        <ul>
            <li>
                Renders <code>data-react-fancy-grid</code> and{" "}
                <code>data-responsive="true|false"</code>, so the mode is readable without
                parsing the computed track list.
            </li>
            <li>
                A column never gets narrower than <strong>16rem</strong> before the grid
                drops one — so a grid asked for six columns inside a narrow panel will show
                three, by design.
            </li>
            <li>
                With <code>responsive</code> on the template is <code>auto-fit</code>, which
                means a row holding fewer items than <code>cols</code> stretches them to
                fill it. Turn <code>responsive</code> off if you need a trailing gap instead.
            </li>
        </ul>
    ),
};
