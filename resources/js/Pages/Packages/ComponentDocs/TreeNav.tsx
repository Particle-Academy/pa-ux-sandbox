import { useState } from "react";
import type { ComponentDoc } from "./types";
import { TreeNav } from "@particle-academy/react-fancy";

const fileTree = [
    {
        id: "src",
        label: "src",
        type: "folder" as const,
        children: [
            { id: "src/app.tsx", label: "app.tsx", type: "file" as const, ext: "tsx" },
            { id: "src/index.ts", label: "index.ts", type: "file" as const, ext: "ts" },
            {
                id: "src/components",
                label: "components",
                type: "folder" as const,
                children: [
                    { id: "src/components/Button.tsx", label: "Button.tsx", type: "file" as const, ext: "tsx" },
                    { id: "src/components/Card.tsx", label: "Card.tsx", type: "file" as const, ext: "tsx" },
                ],
            },
        ],
    },
    { id: "package.json", label: "package.json", type: "file" as const, ext: "json" },
    { id: "README.md", label: "README.md", type: "file" as const, ext: "md" },
];

type DemoNode = { id: string; label: string; type: "file" | "folder"; ext?: string; children?: DemoNode[] };

/** About 5,000 nodes, 6 levels deep — the size of a real repository listing. */
function bigTree(): DemoNode[] {
    let count = 0;
    const level = (depth: number, prefix: string): DemoNode[] => {
        const out: DemoNode[] = [];
        for (let f = 0; f < (depth < 5 ? 4 : 0) && count < 5000; f++) {
            count++;
            const id = `${prefix}dir${f}`;
            out.push({ id, label: `dir${f}`, type: "folder", children: level(depth + 1, `${id}/`) });
        }
        for (let i = 0; i < 4 && count < 5000; i++) {
            count++;
            out.push({ id: `${prefix}file${i}.ts`, label: `file${i}.ts`, type: "file", ext: "ts" });
        }
        return out;
    };
    return level(0, "");
}

function VirtualTreeDemo() {
    // Built on first render, not at module load, so the docs page stays cheap.
    const [nodes] = useState(bigTree);
    const [selected, setSelected] = useState<string>();
    return (
        <div className="w-full max-w-sm space-y-2">
            <div className="rounded-md border border-zinc-200 dark:border-zinc-700">
                <TreeNav
                    nodes={nodes}
                    defaultExpandAll
                    virtualize
                    height={320}
                    rowHeight={26}
                    selectedId={selected}
                    onSelect={(id) => setSelected(id)}
                />
            </div>
            <p className="text-xs text-zinc-500">Selected: {selected ?? "nothing yet"}</p>
        </div>
    );
}

export const treeNavDoc: ComponentDoc = {
    intro: (
        <p>
            File-tree style navigation — collapsible folders, typed file icons, optional
            drag-and-drop reordering, optional external-file drop targets. Data-driven:
            pass a <code>nodes</code> array, get selection + expansion callbacks.
        </p>
    ),
    examples: [
        {
            name: "Default",
            description: "Click a node to select it. Folders toggle their children on click.",
            render: () => (
                <div className="w-full max-w-sm rounded-md border border-zinc-200 p-2 dark:border-zinc-800">
                    <TreeNav nodes={fileTree} defaultExpandAll />
                </div>
            ),
            code: `const fileTree = [
    {
        id: "src",
        label: "src",
        type: "folder",
        children: [
            { id: "src/app.tsx", label: "app.tsx", type: "file", ext: "tsx" },
            { id: "src/index.ts", label: "index.ts", type: "file", ext: "ts" },
        ],
    },
    { id: "package.json", label: "package.json", type: "file", ext: "json" },
];

<TreeNav nodes={fileTree} defaultExpandAll />`,
        },
        {
            name: "Selection callback",
            description: "Pass `selectedId` + `onSelect` to bind selection to your state.",
            render: () => (
                <div className="w-full max-w-sm rounded-md border border-zinc-200 p-2 dark:border-zinc-800">
                    <TreeNav
                        nodes={fileTree}
                        selectedId="src/app.tsx"
                        onSelect={() => {}}
                        defaultExpandAll
                    />
                </div>
            ),
            code: `const [selected, setSelected] = useState<string>();

<TreeNav
    nodes={fileTree}
    selectedId={selected}
    onSelect={(id) => setSelected(id)}
/>`,
        },
        {
            name: "Drag-and-drop reorder",
            description: "Enable `draggable` and handle the move in `onNodeMove`.",
            render: () => (
                <div className="w-full max-w-sm rounded-md border border-zinc-200 p-2 dark:border-zinc-800">
                    <TreeNav
                        nodes={fileTree}
                        draggable
                        onNodeMove={() => {}}
                        defaultExpandAll
                    />
                </div>
            ),
            code: `<TreeNav
    nodes={tree}
    draggable
    onNodeMove={(sourceId, targetId, position) => {
        setTree(moveNode(tree, sourceId, targetId, position));
    }}
/>`,
        },
        {
            name: "External drop target",
            description: "Accept OS file drops or cross-component drags via `acceptExternalDrops`.",
            render: () => (
                <div className="w-full max-w-sm rounded-md border border-zinc-200 p-2 dark:border-zinc-800">
                    <TreeNav
                        nodes={fileTree}
                        acceptExternalDrops
                        onExternalDrop={() => {}}
                        defaultExpandAll
                    />
                </div>
            ),
            code: `<TreeNav
    nodes={tree}
    acceptExternalDrops
    onExternalDrop={(event, target, position) => {
        const files = Array.from(event.dataTransfer.files);
        uploadFilesTo(files, target.id);
    }}
/>`,
        },
        {
            name: "dragCursor",
            description:
                "Whether the row shows the open-hand grab cursor on hover. Defaults to \"none\", because in a tree whose rows are primarily navigation an always-on grab cursor wrongly implies move-first intent — the user reads every row as a thing to drag rather than a thing to open. Opt into \"grab\" when the row genuinely IS a drag handle and reordering is the primary interaction.",
            render: () => (
                <div className="grid w-full gap-6 sm:grid-cols-2">
                    <div>
                        <p className="mb-2 text-xs font-medium text-zinc-500">
                            dragCursor="none" — the default
                        </p>
                        <TreeNav
                            draggable
                            nodes={[
                                { id: "src", label: "src", children: [{ id: "app", label: "App.tsx" }] },
                            ]}
                        />
                    </div>
                    <div>
                        <p className="mb-2 text-xs font-medium text-zinc-500">
                            dragCursor="grab" — reordering is the point
                        </p>
                        <TreeNav
                            draggable
                            dragCursor="grab"
                            nodes={[
                                { id: "a", label: "Section one" },
                                { id: "b", label: "Section two" },
                            ]}
                        />
                    </div>
                </div>
            ),
            code: `{/* A navigation tree that also permits reordering. */}
<TreeNav nodes={nodes} draggable />

{/* A list whose whole purpose is ordering. */}
<TreeNav nodes={sections} draggable dragCursor="grab" />`,
        },
        {
            name: "virtualize — thousands of rows",
            description:
                "This tree has about 5,000 nodes, six levels deep, every folder expanded. With virtualize only the rows in view are rendered (a few dozen, not 5,000), so it mounts and scrolls instantly. height sizes the viewport; rowHeight seeds the row estimate. Selection, expansion, context menus and drag-and-drop work exactly as in the nested tree. Even without virtualize, a click re-renders only the rows it changes, so large nested trees stay responsive.",
            render: () => <VirtualTreeDemo />,
            code: `<TreeNav
    nodes={repositoryListing}
    virtualize
    height={600}
    rowHeight={26}
    selectedId={selected}
    onSelect={(id) => setSelected(id)}
/>`,
        },
    ],
    props: [
        { name: "nodes", type: `TreeNodeData[]`, default: "—", description: "The tree data. Each node has `id`, `label`, optionally `type`, `ext`, `children`, `icon`, `disabled`." },
        { name: "selectedId", type: `string`, default: "—", description: "Currently selected node id." },
        { name: "onSelect", type: `(id, node) => void`, default: "—", description: "Called when the user clicks a node." },
        { name: "onNodeContextMenu", type: `(event, node) => void`, default: "—", description: "Called on right-click — wire your own `ContextMenu` here." },
        { name: "draggable", type: `boolean`, default: `false`, description: "Enable internal drag-and-drop reordering." },
        { name: "onNodeMove", type: `(sourceId, targetId, position) => void`, default: "—", description: "Called after a drag-drop. Apply the move to your data and re-pass `nodes`." },
        { name: "acceptExternalDrops", type: `boolean`, default: `false`, description: "Accept drops from outside the tree (OS files, other components)." },
        { name: "onExternalDrop", type: `(event, target, position) => void`, default: "—", description: "Called on external drops. Read `event.dataTransfer` for the payload." },
        { name: "expandedIds", type: `string[]`, default: "—", description: "Controlled expanded folder ids." },
        { name: "defaultExpandedIds", type: `string[]`, default: `[]`, description: "Initial expansion (uncontrolled)." },
        { name: "onExpandedChange", type: `(ids: string[]) => void`, default: "—", description: "Called when folders are expanded / collapsed." },
        { name: "defaultExpandAll", type: `boolean`, default: `false`, description: "Expand every folder by default." },
        { name: "indentSize", type: `number`, default: `16`, description: "Pixel indent per nesting level." },
        { name: "showIcons", type: `boolean`, default: `true`, description: "Show file / folder icons." },
        { name: "className", type: `string`, default: "—", description: "Extra classes on the root wrapper." },
        { name: "dragCursor", type: `"grab" | "none"`, default: `"none"`, description: "Show the grab cursor on hover. Opt in only where the row genuinely is a drag handle." },
        { name: "virtualize", type: `boolean`, default: `false`, description: "Render only the rows in view — for trees with thousands of expanded nodes. Rows are flat in the DOM, indented by padding." },
        { name: "height", type: `number | string`, default: `400`, description: "Viewport height when `virtualize` is on." },
        { name: "rowHeight", type: `number`, default: `26`, description: "Estimated row height in px when `virtualize` is on; real heights replace it as rows render." },
        { name: "TreeNav.Node — node", type: `TreeNodeData`, default: "—", description: "The row renderer, exposed for custom trees.", required: true },
        { name: "TreeNav.Node — depth", type: `number`, default: "—", description: "Indentation level. Supplied by the parent — you only pass it when rendering nodes yourself.", required: true },
    ],
};
