import type { ComponentDoc } from "./types";
import { Breadcrumbs } from "@particle-academy/react-fancy";

export const breadcrumbsDoc: ComponentDoc = {
    intro: (
        <p>
            Navigation trail. <code>Breadcrumbs</code> takes a flat list of
            <code>Breadcrumbs.Item</code> children — the last item is typically
            <code>active</code>. Separator and shrink behavior are configurable.
        </p>
    ),
    examples: [
        {
            name: "Default",
            description: "Two or more items show the full path.",
            render: () => (
                <Breadcrumbs>
                    <Breadcrumbs.Item href="/">Home</Breadcrumbs.Item>
                    <Breadcrumbs.Item href="/packages">Packages</Breadcrumbs.Item>
                    <Breadcrumbs.Item active>Breadcrumbs</Breadcrumbs.Item>
                </Breadcrumbs>
            ),
            code: `<Breadcrumbs>
    <Breadcrumbs.Item href="/">Home</Breadcrumbs.Item>
    <Breadcrumbs.Item href="/packages">Packages</Breadcrumbs.Item>
    <Breadcrumbs.Item active>Breadcrumbs</Breadcrumbs.Item>
</Breadcrumbs>`,
        },
        {
            name: "Custom separator",
            description: "Override `/` with any ReactNode — an arrow, a dot, an icon.",
            render: () => (
                <Breadcrumbs separator={<span className="text-zinc-300">›</span>}>
                    <Breadcrumbs.Item href="/">Docs</Breadcrumbs.Item>
                    <Breadcrumbs.Item href="/components">Components</Breadcrumbs.Item>
                    <Breadcrumbs.Item active>Breadcrumbs</Breadcrumbs.Item>
                </Breadcrumbs>
            ),
            code: `<Breadcrumbs separator={<span>›</span>}>
    <Breadcrumbs.Item href="/">Docs</Breadcrumbs.Item>
    <Breadcrumbs.Item href="/components">Components</Breadcrumbs.Item>
    <Breadcrumbs.Item active>Breadcrumbs</Breadcrumbs.Item>
</Breadcrumbs>`,
        },
        {
            name: "Shrink (long paths)",
            description: "When `shrink` is on, deep paths collapse the middle into an ellipsis.",
            render: () => (
                <Breadcrumbs shrink>
                    <Breadcrumbs.Item href="/">Home</Breadcrumbs.Item>
                    <Breadcrumbs.Item href="/a">A</Breadcrumbs.Item>
                    <Breadcrumbs.Item href="/a/b">B</Breadcrumbs.Item>
                    <Breadcrumbs.Item href="/a/b/c">C</Breadcrumbs.Item>
                    <Breadcrumbs.Item href="/a/b/c/d">D</Breadcrumbs.Item>
                    <Breadcrumbs.Item active>Current</Breadcrumbs.Item>
                </Breadcrumbs>
            ),
            code: `<Breadcrumbs shrink>
    <Breadcrumbs.Item href="/">Home</Breadcrumbs.Item>
    <Breadcrumbs.Item href="/a">A</Breadcrumbs.Item>
    …
    <Breadcrumbs.Item active>Current</Breadcrumbs.Item>
</Breadcrumbs>`,
        },
    ],
    props: [
        { name: "children", type: `ReactNode`, default: "—", description: "One or more `Breadcrumbs.Item` children." },
        { name: "separator", type: `ReactNode`, default: `"/"`, description: "Separator rendered between items. Any element." },
        { name: "shrink", type: `boolean`, default: `false`, description: "Collapse deep paths into a `…` between the first and last items." },
        { name: "className", type: `string`, default: "—", description: "Extra classes on the root nav element." },
    ],
    notes: (
        <p className="text-xs text-zinc-600 dark:text-zinc-300">
            <strong>Item props:</strong> <code>href</code> renders the item as an anchor.
            <code>active</code> marks the current page (typically the last item) and removes
            the link affordance.
        </p>
    ),
};
