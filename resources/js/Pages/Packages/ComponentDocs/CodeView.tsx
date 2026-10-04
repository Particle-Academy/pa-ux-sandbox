import { useState } from "react";
import type { ComponentDoc } from "./types";
import { CodeView } from "@particle-academy/react-fancy";

const HTML = `<section class="hero">
  <h1>Make it fancy</h1>
  <p>Humans and agents, one surface.</p>
  <button type="button" data-action="start">Start</button>
</section>`;

const SQL = `select p.name, count(*) as installs
from packages p
join installs i on i.package_id = p.id
group by p.name
order by installs desc`;

export const codeViewDoc: ComponentDoc = {
    intro: (
        <p>
            A small source surface — read-only or editable — for the cases where a full code
            editor is too much. It ships <strong>one grammar</strong>:{" "}
            <code>"html"</code>, from <code>fancy-file-commons</code>. Everything else,
            including <code>"markdown"</code> and <code>"plaintext"</code>, renders
            un-highlighted and that is deliberate — bundling a highlighter into a core
            primitive would put it in every consumer&rsquo;s tree. For real language support
            reach for <code>fancy-code</code>&rsquo;s <code>CodeEditor</code>.
        </p>
    ),
    examples: [
        {
            name: "Read-only",
            description:
                "Pass value with no onChange and the view is read-only. The most common use: showing a snippet you do not want edited.",
            render: () => (
                <div className="w-full">
                    <CodeView value={SQL} />
                </div>
            ),
            code: `<CodeView value={snippet} />`,
        },
        {
            name: "HTML highlighting",
            description:
                "The one grammar that ships. Compare it with the same markup declared as plaintext below — the difference is the whole of what language does here.",
            render: () => (
                <div className="w-full space-y-3">
                    <div>
                        <p className="mb-1 text-xs font-medium text-zinc-500">language="html"</p>
                        <CodeView value={HTML} language="html" />
                    </div>
                    <div>
                        <p className="mb-1 text-xs font-medium text-zinc-500">
                            language="plaintext" — the default
                        </p>
                        <CodeView value={HTML} />
                    </div>
                </div>
            ),
            code: `<CodeView value={markup} language="html" />`,
        },
        {
            name: "Editable",
            description:
                "Provide onChange and the view becomes an editable surface — a transparent textarea over the highlight overlay. Controlled, so the value is always yours.",
            render: () => {
                function Editable() {
                    const [value, setValue] = useState(HTML);

                    return (
                        <div className="w-full space-y-2">
                            <CodeView value={value} onChange={setValue} language="html" />
                            <p className="text-xs text-zinc-500">{value.length} characters</p>
                        </div>
                    );
                }

                return <Editable />;
            },
            code: `const [value, setValue] = useState(initial);

<CodeView value={value} onChange={setValue} language="html" />`,
        },
        {
            name: "readOnly wins over onChange",
            description:
                "readOnly blocks editing even when onChange is passed — so a surface can be frozen by a permission check without the caller having to strip the handler and remember to put it back.",
            render: () => {
                function Lockable() {
                    const [value, setValue] = useState(SQL);
                    const [locked, setLocked] = useState(true);

                    return (
                        <div className="w-full space-y-2">
                            <label className="flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-300">
                                <input
                                    type="checkbox"
                                    checked={locked}
                                    onChange={(e) => setLocked(e.target.checked)}
                                />
                                readOnly
                            </label>
                            <CodeView value={value} onChange={setValue} readOnly={locked} />
                        </div>
                    );
                }

                return <Lockable />;
            },
            code: `<CodeView
    value={value}
    onChange={setValue}
    readOnly={!can("edit-query")}
/>`,
        },
        {
            name: "Placeholder",
            description: "Shown while the value is empty — same role as on an input.",
            render: () => {
                function Empty() {
                    const [value, setValue] = useState("");

                    return (
                        <div className="w-full">
                            <CodeView
                                value={value}
                                onChange={setValue}
                                placeholder="Paste your query here…"
                            />
                        </div>
                    );
                }

                return <Empty />;
            },
            code: `<CodeView value={value} onChange={setValue} placeholder="Paste your query here…" />`,
        },
        {
            name: "Height bounds",
            description:
                "minHeight is the floor before the view grows with its content; maxHeight is the ceiling before it scrolls internally. Set both when the surface sits in a fixed layout and must not push the page around.",
            render: () => (
                <div className="w-full space-y-3">
                    <div>
                        <p className="mb-1 text-xs font-medium text-zinc-500">
                            minHeight={"{60}"} — short content, small box
                        </p>
                        <CodeView value="select 1;" minHeight={60} />
                    </div>
                    <div>
                        <p className="mb-1 text-xs font-medium text-zinc-500">
                            maxHeight={"{96}"} — long content, scrolls inside
                        </p>
                        <CodeView value={`${SQL}\n\n${SQL}`} maxHeight={96} />
                    </div>
                </div>
            ),
            code: `<CodeView value={value} minHeight={60} maxHeight={320} />`,
        },
        {
            name: "Filling a flex layout",
            description:
                "className lands on the scroll container, so h-full or flex-auto make the view take the space a panel gives it instead of sizing to content.",
            render: () => (
                <div className="flex h-48 w-full flex-col rounded-md border border-zinc-200 dark:border-zinc-800">
                    <div className="border-b border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-500 dark:border-zinc-800">
                        query.sql
                    </div>
                    <CodeView value={SQL} className="flex-auto" />
                </div>
            ),
            code: `<div className="flex h-full flex-col">
    <Toolbar />
    <CodeView value={value} onChange={setValue} className="flex-auto" />
</div>`,
        },
    ],
    props: [
        { name: "value", type: `string`, default: "—", description: "Source text. Controlled.", required: true },
        { name: "onChange", type: `(value: string) => void`, default: "—", description: "Called on edit. Omit for a read-only view." },
        { name: "language", type: `"html" | "markdown" | "plaintext" | string`, default: `"plaintext"`, description: "Grammar id. Only `html` is highlighted; everything else renders plain." },
        { name: "readOnly", type: `boolean`, default: `false`, description: "Block editing even when `onChange` is passed." },
        { name: "placeholder", type: `string`, default: "—", description: "Shown when the value is empty." },
        { name: "minHeight", type: `number`, default: `120`, description: "Minimum height in px before the view grows with content." },
        { name: "maxHeight", type: `number`, default: "—", description: "Height in px before the view scrolls internally." },
        { name: "className", type: `string`, default: "—", description: "Classes on the scroll container — e.g. `h-full`, `flex-auto`." },
    ],
    notes: (
        <ul>
            <li>
                <strong>Only HTML is highlighted.</strong> Passing{" "}
                <code>language="typescript"</code> is not an error and not a no-op to be
                surprised by — it renders readable, un-highlighted source. If you need the
                colours, that is a different component and a real dependency.
            </li>
            <li>
                Fully controlled: the view keeps no copy of <code>value</code>. An edit that
                does not come back through <code>onChange</code> will not appear.
            </li>
            <li>
                For multi-file editing, a gutter, folding or language servers, use{" "}
                <code>@particle-academy/fancy-code</code>. This component is deliberately the
                small one.
            </li>
        </ul>
    ),
};
