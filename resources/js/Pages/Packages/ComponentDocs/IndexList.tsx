import { Link } from "@inertiajs/react";
import type { ComponentDoc } from "./types";
import { IndexList } from "@particle-academy/react-fancy";

export const indexListDoc: ComponentDoc = {
    intro: (
        <p>
            The numbered editorial index — a table of contents, a filmography, a changelog,
            a list of case studies. Rows are <strong>data, not children</strong>, so an
            agent can emit the whole list as JSON. The marker column is rendered tabular, so
            the numbers line up whether they are <code>01</code> or <code>100</code>.
        </p>
    ),
    examples: [
        {
            name: "Default",
            description: "A number and a title is the minimum useful row.",
            render: () => (
                <IndexList
                    className="w-full"
                    items={[
                        { num: "01", title: "Introduction" },
                        { num: "02", title: "The component contract" },
                        { num: "03", title: "Human+ UX" },
                    ]}
                />
            ),
            code: `<IndexList
    items={[
        { num: "01", title: "Introduction" },
        { num: "02", title: "The component contract" },
        { num: "03", title: "Human+ UX" },
    ]}
/>`,
        },
        {
            name: "Meta and value",
            description:
                "meta is secondary text after the title; value is pushed to the far end. The pair is what turns a list of names into a readable index — subject on the left, a year or a count on the right.",
            render: () => (
                <IndexList
                    className="w-full"
                    items={[
                        { num: "01", title: "react-fancy", meta: "Core primitives", value: "5.32.0" },
                        { num: "02", title: "fancy-flow", meta: "Workflow engine", value: "0.79.2" },
                        { num: "03", title: "holy-sheet", meta: "xlsx writer", value: "2.1.0" },
                    ]}
                />
            ),
            code: `<IndexList
    items={[
        { num: "01", title: "react-fancy", meta: "Core primitives", value: "5.32.0" },
        { num: "02", title: "fancy-flow", meta: "Workflow engine", value: "0.79.2" },
    ]}
/>`,
        },
        {
            name: "Without numbers",
            description:
                "num is optional. Leave it off for a list whose order carries no meaning — the rows keep their rhythm without implying a sequence.",
            render: () => (
                <IndexList
                    className="w-full"
                    items={[
                        { title: "Commerce", meta: "laravel-catalog + fancy-catalog-js" },
                        { title: "Feature gating", meta: "laravel-fms + fancy-features-js" },
                        { title: "Documents", meta: "holy-sheet, dark-slide, last-word" },
                    ]}
                />
            ),
            code: `<IndexList
    items={[
        { title: "Commerce", meta: "laravel-catalog + fancy-catalog-js" },
        { title: "Feature gating", meta: "laravel-fms + fancy-features-js" },
    ]}
/>`,
        },
        {
            name: "Linked rows",
            description:
                "href makes the whole row clickable. A plain <a> is fine for an external destination — but inside an SPA it costs a full page load, which is what linkAs is for.",
            render: () => (
                <IndexList
                    className="w-full"
                    items={[
                        { num: "01", title: "Card", href: "/packages/react-fancy/card", value: "docs" },
                        { num: "02", title: "Grid", href: "/packages/react-fancy/grid", value: "docs" },
                        { num: "03", title: "Marquee", href: "/packages/react-fancy/marquee", value: "docs" },
                    ]}
                />
            ),
            code: `<IndexList
    items={[
        { num: "01", title: "Card", href: "/packages/react-fancy/card" },
        { num: "02", title: "Grid", href: "/packages/react-fancy/grid" },
    ]}
/>`,
        },
        {
            name: "linkAs — keeping client-side navigation",
            description:
                "Pass your router's link component and the rows navigate without a reload. This list uses Inertia's Link; next/link and react-router's Link work the same way — the component is handed href, className and children.",
            render: () => (
                <IndexList
                    className="w-full"
                    linkAs={Link}
                    items={[
                        { num: "01", title: "All packages", href: "/packages", value: "index" },
                        { num: "02", title: "Starter kits", href: "/starter-kits", value: "index" },
                        { num: "03", title: "Inspiration", href: "/inspiration", value: "index" },
                    ]}
                />
            ),
            code: `import { Link } from "@inertiajs/react";

<IndexList
    linkAs={Link}
    items={[
        { num: "01", title: "All packages", href: "/packages" },
        { num: "02", title: "Starter kits", href: "/starter-kits" },
    ]}
/>`,
        },
        {
            name: "Stable ids",
            description:
                "id is the row's key, and it defaults to the array index. An index is not an identity — reorder or filter the list and React reuses the wrong row's DOM. Pass id whenever the list can change.",
            render: () => (
                <IndexList
                    className="w-full"
                    items={[
                        { id: "kit-0-5", num: "01", title: "Kit 0.5", value: "2026-08-07" },
                        { id: "kit-0-4", num: "02", title: "Kit 0.4", value: "2026-02-07" },
                    ]}
                />
            ),
            code: `<IndexList
    items={releases.map((r) => ({
        id: r.slug,          // not the index — the list is sortable
        num: r.number,
        title: r.name,
        value: r.date,
    }))}
/>`,
        },
        {
            name: "Rich cells",
            description:
                "Every slot is a node, so a badge, an em dash or emphasis composes without another prop.",
            render: () => (
                <IndexList
                    className="w-full"
                    items={[
                        {
                            num: "01",
                            title: (
                                <>
                                    Container <span className="text-zinc-400">/ Section / Grid</span>
                                </>
                            ),
                            meta: "Layout primitives",
                            value: <span className="text-green-600">new</span>,
                        },
                        {
                            num: "02",
                            title: "Action",
                            meta: "Retired — emit Button",
                            value: <span className="text-zinc-400">deprecated</span>,
                        },
                    ]}
                />
            ),
            code: `<IndexList
    items={[
        { num: "01", title: <>Container <span>/ Section</span></>, value: <Badge>new</Badge> },
    ]}
/>`,
        },
    ],
    props: [
        { name: "items", type: `IndexListItem[]`, default: "—", description: "The rows. `{ num?, title, meta?, value?, href?, id? }`.", required: true },
        { name: "linkAs", type: `ElementType`, default: `"a"`, description: "Component to render for `href` rows. Pass your router's link to keep client-side navigation." },
        { name: "...rest", type: `Omit<HTMLAttributes<HTMLOListElement>, "children">`, default: "—", description: "All standard ol attributes. `children` is omitted — rows come from `items`." },
    ],
    notes: (
        <ul>
            <li>
                Renders a real <code>&lt;ol&gt;</code>, so assistive technology announces the
                row count and position. That is also why <code>children</code> is removed
                from the passthrough props: the list owns its own <code>&lt;li&gt;</code>
                elements, and letting a caller add arbitrary children would break the
                structure it is promising.
            </li>
            <li>
                <code>href</code> makes the whole row a link, so{" "}
                <strong>do not put an anchor inside <code>title</code></strong> as well —
                nested anchors are invalid HTML and the browser's repair silently drops one.
            </li>
            <li>
                <code>id</code> defaults to the array index, which is fine for a static list
                and wrong for anything sortable or filterable.
            </li>
        </ul>
    ),
};
