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
    ],
};
