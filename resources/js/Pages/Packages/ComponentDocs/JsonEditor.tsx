import { useState } from "react";
import type { ComponentDoc } from "./types";
import { JsonEditor } from "@particle-academy/react-fancy";
import type {
    JsonEditorEdit,
    JsonEditorIssue,
    JsonEditorPendingEdit,
    JsonValue,
} from "@particle-academy/react-fancy";

const DOC: JsonValue = {
    name: "Acme Ltd",
    role: "member",
    seats: 12,
    active: true,
    tags: ["commerce", "beta"],
    billing: { plan: "pro", renews: "2027-01-01" },
};

const KEY_MAP = JSON.stringify(
    {
        seats: "number",
        active: "boolean",
        "tags.*": "string",
        role: { type: "enum", options: ["admin", "member", "viewer"] },
    },
    null,
    2,
);

export const jsonEditorDoc: ComponentDoc = {
    intro: (
        <>
            <p>
                A JSON document as a row-per-key surface rather than a text area — so a value
                can be typed, validated and addressed by path. Fully controlled: the editor
                keeps no copy of the document, and <code>onChange</code> hands back the whole
                next value plus <strong>the edit that produced it</strong>, which is what a
                bridge logs, replays or undoes.
            </p>
            <p>
                It is the component in the kit most shaped by the Human+ contract: paths are
                plain <code>string[]</code>, the type map crosses a wire as a string, and{" "}
                <code>pendingMode</code> lets an agent propose edits a human then accepts.
            </p>
        </>
    ),
    examples: [
        {
            name: "Default",
            description:
                "A document and a change handler. Values render as text and become a control when clicked — that is view mode, which this component defaults to even though the kit default is edit.",
            render: () => {
                function Basic() {
                    const [value, setValue] = useState<JsonValue>(DOC);

                    return (
                        <div className="w-full">
                            <JsonEditor value={value} onChange={(next) => setValue(next)} />
                        </div>
                    );
                }

                return <Basic />;
            },
            code: `const [value, setValue] = useState(doc);

<JsonEditor value={value} onChange={(next) => setValue(next)} />`,
        },
        {
            name: "The edit, not just the value",
            description:
                "onChange's second argument describes what happened — the path, the kind of change, the before and after. Click a value and watch the log fill; this is exactly what a bridge would record for undo.",
            render: () => {
                function WithLog() {
                    const [value, setValue] = useState<JsonValue>(DOC);
                    const [log, setLog] = useState<JsonEditorEdit[]>([]);

                    return (
                        <div className="w-full space-y-2">
                            <JsonEditor
                                value={value}
                                onChange={(next, edit) => {
                                    setValue(next);
                                    setLog((l) => [edit, ...l].slice(0, 4));
                                }}
                            />
                            <pre className="overflow-x-auto rounded-md bg-zinc-50 p-2 text-[11px] leading-relaxed text-zinc-600 dark:bg-zinc-900 dark:text-zinc-300">
                                {log.length === 0
                                    ? "// edit a value to see the edit record"
                                    : log.map((e) => JSON.stringify(e)).join("\n")}
                            </pre>
                        </div>
                    );
                }

                return <WithLog />;
            },
            code: `<JsonEditor
    value={value}
    onChange={(next, edit) => {
        setValue(next);
        history.push(edit);   // replayable, undoable
    }}
/>`,
        },
        {
            name: "mode — view against edit",
            description:
                "view (the default here) reads as a document; edit renders every control at once. The kit default is edit and this component deliberately differs, because a forty-key document drawn as forty boxed inputs is not a document you can read — and reading is most of what a JSON editor is for.",
            render: () => {
                function Modes() {
                    const [a, setA] = useState<JsonValue>(DOC);
                    const [b, setB] = useState<JsonValue>(DOC);

                    return (
                        <div className="w-full space-y-4">
                            <div>
                                <p className="mb-1 text-xs font-medium text-zinc-500">mode="view"</p>
                                <JsonEditor value={a} onChange={(n) => setA(n)} mode="view" />
                            </div>
                            <div>
                                <p className="mb-1 text-xs font-medium text-zinc-500">mode="edit"</p>
                                <JsonEditor value={b} onChange={(n) => setB(n)} mode="edit" />
                            </div>
                        </div>
                    );
                }

                return <Modes />;
            },
            code: `<JsonEditor value={value} onChange={onChange} mode="view" />
<JsonEditor value={value} onChange={onChange} mode="edit" />`,
        },
        {
            name: "keyMap — declaring types",
            description:
                "A JSON STRING, not an object, and an object is not accepted as a convenience overload. A string survives every boundary this prop actually crosses — an MCP tool argument, a config column, a data-* attribute, a form field — and a live object survives none of them. Accepting both would make the documented form the second-class one.",
            render: () => {
                function Typed() {
                    const [value, setValue] = useState<JsonValue>(DOC);

                    return (
                        <div className="w-full space-y-2">
                            <JsonEditor
                                value={value}
                                onChange={(n) => setValue(n)}
                                keyMap={KEY_MAP}
                                mode="edit"
                            />
                            <pre className="overflow-x-auto rounded-md bg-zinc-50 p-2 text-[11px] text-zinc-600 dark:bg-zinc-900 dark:text-zinc-300">
                                {KEY_MAP}
                            </pre>
                        </div>
                    );
                }

                return <Typed />;
            },
            code: `const keyMap = JSON.stringify({
    seats: "number",
    active: "boolean",
    "tags.*": "string",                                  // every array element
    role: { type: "enum", options: ["admin", "member"] },
});

<JsonEditor value={value} onChange={onChange} keyMap={keyMap} />`,
        },
        {
            name: "Issues",
            description:
                "A malformed keyMap is never thrown and never silently ignored — it surfaces as issues. showIssues renders the panel; onIssuesChange gives you the list regardless, so a host can count them without displaying ours.",
            render: () => {
                function Broken() {
                    const [value, setValue] = useState<JsonValue>(DOC);
                    const [issues, setIssues] = useState<JsonEditorIssue[]>([]);

                    return (
                        <div className="w-full space-y-2">
                            <JsonEditor
                                value={value}
                                onChange={(n) => setValue(n)}
                                keyMap={'{ "seats": "nmber", "role": { "type": "enum" } }'}
                                showIssues
                                onIssuesChange={setIssues}
                            />
                            <p className="text-xs text-zinc-500">
                                {issues.length} issue(s) reported to the host
                            </p>
                        </div>
                    );
                }

                return <Broken />;
            },
            code: `<JsonEditor
    value={value}
    onChange={onChange}
    keyMap={keyMap}
    showIssues
    onIssuesChange={(issues) => setBlocked(issues.length > 0)}
/>`,
        },
        {
            name: "pendingMode — agents propose, humans accept",
            description:
                "With pendingMode on, an edit is STAGED rather than applied: onChange does not fire until a human accepts it. This is the trust-but-verify affordance the component contract asks of anything destructive — and because pending is controlled, an agent's proposals are inspectable before they land.",
            render: () => {
                function Staged() {
                    const [value, setValue] = useState<JsonValue>(DOC);
                    const [pending, setPending] = useState<JsonEditorPendingEdit[]>([]);

                    return (
                        <div className="w-full space-y-2">
                            <JsonEditor
                                value={value}
                                onChange={(n) => setValue(n)}
                                pendingMode
                                pending={pending}
                                onPendingChange={setPending}
                                mode="edit"
                            />
                            <p className="text-xs text-zinc-500">
                                {pending.length} staged edit(s) — the document is untouched until
                                they are accepted.
                            </p>
                        </div>
                    );
                }

                return <Staged />;
            },
            code: `const [pending, setPending] = useState([]);

<JsonEditor
    value={value}
    onChange={apply}
    pendingMode
    pending={pending}
    onPendingChange={setPending}
/>`,
        },
        {
            name: "readOnly",
            description:
                "Shows every value and offers no control. It overrides mode and every allow* flag, so one prop freezes the surface rather than four.",
            render: () => (
                <div className="w-full">
                    <JsonEditor value={DOC} readOnly />
                </div>
            ),
            code: `<JsonEditor value={value} readOnly />`,
        },
        {
            name: "Structural permissions",
            description:
                "allowAdd, allowRemove, allowRename and allowReorder gate the structural operations independently of value editing — the shape a settings document wants, where values are yours to change and keys are not.",
            render: () => {
                function Gated() {
                    const [value, setValue] = useState<JsonValue>(DOC);

                    return (
                        <div className="w-full">
                            <JsonEditor
                                value={value}
                                onChange={(n) => setValue(n)}
                                mode="edit"
                                allowAdd={false}
                                allowRemove={false}
                                allowRename={false}
                                allowReorder={false}
                            />
                        </div>
                    );
                }

                return <Gated />;
            },
            code: `{/* Values are editable; the schema is not. */}
<JsonEditor
    value={value}
    onChange={onChange}
    allowAdd={false}
    allowRemove={false}
    allowRename={false}
/>`,
        },
        {
            name: "Expansion",
            description:
                "expanded is a list of dotted paths, controlled. Omitting both it and defaultExpanded expands everything — fine for a small document and wrong for a large one, where defaultExpanded={[]} starts collapsed.",
            render: () => {
                function Expansion() {
                    const [value, setValue] = useState<JsonValue>(DOC);
                    const [expanded, setExpanded] = useState<string[]>(["billing"]);

                    return (
                        <div className="w-full space-y-2">
                            <div className="flex flex-wrap gap-2">
                                <button
                                    type="button"
                                    onClick={() => setExpanded(["billing", "tags"])}
                                    className="rounded-md border border-zinc-200 px-2 py-1 text-xs hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
                                >
                                    Expand all
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setExpanded([])}
                                    className="rounded-md border border-zinc-200 px-2 py-1 text-xs hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
                                >
                                    Collapse all
                                </button>
                                <code className="ml-auto text-xs text-zinc-500">
                                    {JSON.stringify(expanded)}
                                </code>
                            </div>
                            <JsonEditor
                                value={value}
                                onChange={(n) => setValue(n)}
                                expanded={expanded}
                                onExpandedChange={setExpanded}
                            />
                        </div>
                    );
                }

                return <Expansion />;
            },
            code: `{/* A large document should not open fully expanded. */}
<JsonEditor value={value} onChange={onChange} defaultExpanded={[]} />

{/* Or drive it: */}
<JsonEditor
    value={value}
    onChange={onChange}
    expanded={expanded}
    onExpandedChange={setExpanded}
/>`,
        },
        {
            name: "Labels and control ids",
            description:
                "rootLabel names a scalar root document, emptyLabel covers the no-keys case, and idPrefix prefixes every generated control id as <idPrefix>-<dotted path> — which is how a test or an agent addresses one field without a selector.",
            render: () => (
                <div className="w-full space-y-4">
                    <div>
                        <p className="mb-1 text-xs font-medium text-zinc-500">
                            scalar root, with rootLabel
                        </p>
                        <JsonEditor value="just a string" readOnly rootLabel="greeting" />
                    </div>
                    <div>
                        <p className="mb-1 text-xs font-medium text-zinc-500">empty document</p>
                        <JsonEditor value={{}} readOnly emptyLabel="No settings yet." />
                    </div>
                </div>
            ),
            code: `<JsonEditor value={value} rootLabel="greeting" />
<JsonEditor value={{}} emptyLabel="No settings yet." />
<JsonEditor value={value} idPrefix="org-settings" />
{/* -> #org-settings-billing.plan */}`,
        },
        {
            name: "Activity",
            description:
                "onActivity fires for every mutation, staged or applied — the stream the presence and undo layers subscribe to, so a coaching or co-browsing layer composes without the host wiring anything.",
            render: () => {
                function WithActivity() {
                    const [value, setValue] = useState<JsonValue>(DOC);
                    const [count, setCount] = useState(0);

                    return (
                        <div className="w-full space-y-2">
                            <JsonEditor
                                value={value}
                                onChange={(n) => setValue(n)}
                                onActivity={() => setCount((c) => c + 1)}
                            />
                            <p className="text-xs text-zinc-500">{count} activity event(s)</p>
                        </div>
                    );
                }

                return <WithActivity />;
            },
            code: `<JsonEditor
    value={value}
    onChange={onChange}
    onActivity={(event) => broadcast(event)}
/>`,
        },
    ],
    props: [
        { name: "value", type: `JsonValue`, default: "—", description: "The document. Controlled — the editor keeps no copy.", required: true },
        { name: "onChange", type: `(value, edit) => void`, default: "—", description: "The whole next document, plus the edit that produced it." },
        { name: "keyMap", type: `string | null`, default: "—", description: "Type declarations as a JSON **string**. An object is not accepted." },
        { name: "mode", type: `FieldMode`, default: `"view"`, description: "`view` renders text that becomes a control on click; `edit` renders every control at once." },
        { name: "size", type: `Size`, default: "—", description: "Control size, as elsewhere in the kit." },
        { name: "readOnly", type: `boolean`, default: `false`, description: "Show every value, offer no control. Overrides `mode` and every `allow*`." },
        { name: "expanded", type: `string[]`, default: "—", description: "Dotted paths of the expanded containers. Controlled." },
        { name: "defaultExpanded", type: `string[]`, default: "—", description: "Uncontrolled initial expansion. Omit both to expand everything." },
        { name: "onExpandedChange", type: `(expanded: string[]) => void`, default: "—", description: "Called when a container opens or closes." },
        { name: "showIssues", type: `boolean`, default: `false`, description: "Render the issues panel. The `data-issues` count is unaffected." },
        { name: "onIssuesChange", type: `(issues: JsonEditorIssue[]) => void`, default: "—", description: "Called with the current issues, panel or no panel." },
        { name: "pendingMode", type: `boolean`, default: `false`, description: "Stage edits into `pending` instead of applying them. `onChange` waits for a human." },
        { name: "pending", type: `JsonEditorPendingEdit[]`, default: "—", description: "Staged edits. Controlled, so proposals are inspectable." },
        { name: "onPendingChange", type: `(pending) => void`, default: "—", description: "Called when the staged set changes." },
        { name: "onActivity", type: `(event: JsonEditorActivity) => void`, default: "—", description: "Every mutation, staged or applied — what presence and undo listen on." },
        { name: "allowAdd", type: `boolean`, default: `true`, description: "Permit adding keys or elements." },
        { name: "allowRemove", type: `boolean`, default: `true`, description: "Permit removing keys or elements." },
        { name: "allowRename", type: `boolean`, default: `true`, description: "Permit renaming keys." },
        { name: "allowReorder", type: `boolean`, default: `true`, description: "Permit reordering array elements." },
        { name: "rootLabel", type: `string`, default: `"value"`, description: "Label for a scalar root document." },
        { name: "emptyLabel", type: `string`, default: "—", description: "Shown when the document has no keys." },
        { name: "idPrefix", type: `string`, default: "—", description: "Prefix for generated control ids — `<idPrefix>-<dotted path>`." },
    ],
    notes: (
        <ul>
            <li>
                <strong><code>keyMap</code> is a string on purpose.</strong> It crosses MCP
                tool arguments, config columns, <code>data-*</code> attributes and form
                fields — none of which carry a live object. Accepting an object too would
                quietly make the documented form the second-class one.
            </li>
            <li>
                A <code>JsonPath</code> is a plain <code>string[]</code> with array indices
                as decimal strings (<code>["orders", "0", "total"]</code>), so object keys
                and array indices are addressed identically and an agent needs no tagged
                union to emit one.
            </li>
            <li>
                A malformed <code>keyMap</code> neither throws nor is ignored. It becomes a{" "}
                <code>JsonEditorIssue</code> — which is the only one of the three behaviours
                a host can actually act on.
            </li>
            <li>
                <code>pendingMode</code> is this component&rsquo;s trust-but-verify hook. With
                it on, <code>onChange</code> is the record of what a <em>human</em> accepted,
                not what an agent attempted.
            </li>
        </ul>
    ),
};
