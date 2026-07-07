import type { ComponentDoc } from "./types";
import { useState } from "react";
import { Button, FileBrowser, Text } from "@particle-academy/react-fancy";
import type { FileBrowserProvider, FileEntry, FileSnapshotNode } from "@particle-academy/react-fancy";

/**
 * Small fake file system for provider-mode demos. `loadChildren` resolves
 * after ~300ms so the per-folder loading states are visible.
 */
const FAKE_FS: Record<string, FileEntry[]> = {
    "/": [
        { path: "/projects", name: "projects", kind: "dir", hasChildren: true },
        { path: "/archive", name: "archive", kind: "dir", hasChildren: true },
        { path: "/scratch", name: "scratch", kind: "dir", hasChildren: false },
        { path: "/notes.md", name: "notes.md", kind: "file", size: 2380, mtime: "2026-06-30T09:15:00Z" },
    ],
    "/projects": [
        { path: "/projects/fieldwork", name: "fieldwork", kind: "dir", hasChildren: true },
        { path: "/projects/atlas", name: "atlas", kind: "dir", hasChildren: false },
        { path: "/projects/brief.pdf", name: "brief.pdf", kind: "file", size: 48210, mtime: "2026-06-12T14:02:00Z" },
    ],
    "/projects/fieldwork": [
        { path: "/projects/fieldwork/index.tsx", name: "index.tsx", kind: "file", size: 1840, mtime: "2026-07-01T08:40:00Z" },
        { path: "/projects/fieldwork/styles.css", name: "styles.css", kind: "file", size: 960, mtime: "2026-06-28T17:22:00Z" },
    ],
    "/archive": [
        { path: "/archive/2025", name: "2025", kind: "dir", hasChildren: false },
        { path: "/archive/legacy.zip", name: "legacy.zip", kind: "file", size: 3145728, mtime: "2025-12-31T23:59:00Z" },
    ],
};

const fakeProvider: FileBrowserProvider = {
    loadChildren: (path) =>
        new Promise((resolve, reject) => {
            setTimeout(() => {
                const entries = FAKE_FS[path];
                if (entries) {
                    resolve(entries);
                } else {
                    reject(new Error("No such directory: " + path));
                }
            }, 300);
        }),
};

function DirectoryPickerDemo() {
    const [dir, setDir] = useState<string | null>(null);
    return (
        <div className="w-full max-w-md space-y-2">
            <FileBrowser
                provider={fakeProvider}
                select="directory"
                value={dir}
                onChange={(value) => setDir(value as string | null)}
                className="h-72"
            />
            <Text size="xs" className="!text-zinc-500">
                {dir ? `Picked: ${dir}` : "Files stay browsable, but only folders are selectable."}
            </Text>
        </div>
    );
}

/**
 * Precomputed snapshot frames — each button press replaces the snapshot with
 * the next frame, standing in for stream chunks arriving from a remote
 * machine. Deterministic on purpose (SSR-safe).
 */
const SRV_LOG: FileSnapshotNode = { path: "/srv/app.log", name: "app.log", kind: "file", size: 1832 };

const STREAM_FRAMES: FileSnapshotNode[][] = [
    // Chunk 1 — the first listing arrives; /srv/config depth is still unknown.
    [
        {
            path: "/srv",
            name: "srv",
            kind: "dir",
            children: [SRV_LOG, { path: "/srv/config", name: "config", kind: "dir" }],
        },
    ],
    // Chunk 2 — the remote walks /srv/config.
    [
        {
            path: "/srv",
            name: "srv",
            kind: "dir",
            children: [
                SRV_LOG,
                {
                    path: "/srv/config",
                    name: "config",
                    kind: "dir",
                    children: [
                        { path: "/srv/config/app.toml", name: "app.toml", kind: "file", size: 412 },
                        { path: "/srv/config/secrets.env", name: "secrets.env", kind: "file", size: 96, disabled: true },
                    ],
                },
            ],
        },
    ],
    // Chunk 3 — a sibling tree lands.
    [
        {
            path: "/srv",
            name: "srv",
            kind: "dir",
            children: [
                SRV_LOG,
                {
                    path: "/srv/config",
                    name: "config",
                    kind: "dir",
                    children: [
                        { path: "/srv/config/app.toml", name: "app.toml", kind: "file", size: 412 },
                        { path: "/srv/config/secrets.env", name: "secrets.env", kind: "file", size: 96, disabled: true },
                    ],
                },
            ],
        },
        {
            path: "/backups",
            name: "backups",
            kind: "dir",
            children: [
                { path: "/backups/2026-07-06.tar.gz", name: "2026-07-06.tar.gz", kind: "file", size: 5242880, mtime: "2026-07-06T02:00:00Z" },
            ],
        },
    ],
];

function SnapshotStreamDemo() {
    const [frame, setFrame] = useState(0);
    const done = frame >= STREAM_FRAMES.length - 1;
    return (
        <div className="w-full max-w-md space-y-2">
            <FileBrowser
                snapshot={STREAM_FRAMES[frame]}
                select="file"
                defaultExpandedPaths={["/srv", "/srv/config", "/backups"]}
                className="h-64"
            />
            <div className="flex items-center gap-2">
                <Button
                    disabled={done}
                    onClick={() => setFrame((f) => Math.min(f + 1, STREAM_FRAMES.length - 1))}
                >
                    Simulate stream update
                </Button>
                <Button variant="ghost" disabled={frame === 0} onClick={() => setFrame(0)}>
                    Reset
                </Button>
                <Text size="xs" className="!text-zinc-500">
                    Chunk {frame + 1} of {STREAM_FRAMES.length}
                </Text>
            </div>
        </div>
    );
}

function MultiSelectDemo() {
    const [paths, setPaths] = useState<string[]>([]);
    return (
        <div className="w-full max-w-md space-y-2">
            <FileBrowser
                provider={fakeProvider}
                select="both"
                multiple
                value={paths}
                onChange={(value) => setPaths((value as string[]) ?? [])}
                className="h-64"
            />
            <Text size="xs" className="!text-zinc-500">
                {paths.length > 0 ? `${paths.length} selected: ${paths.join(", ")}` : "Click or Space toggles membership."}
            </Text>
        </div>
    );
}

export const fileBrowserDoc: ComponentDoc = {
    intro: (
        <p>
            Remote-capable file/folder browser + directory picker. Two feeding modes,
            combinable: <strong>provider</strong> (lazy pull — <code>loadChildren(path)</code>{" "}
            per folder, on first expand) and <strong>snapshot</strong> (streamed push — a
            JSON-friendly tree you replace or patch as chunks arrive from a relay,
            WebSocket, or MCP bridge). Fully controlled; every row carries a{" "}
            <code>data-path</code> stable handle. Read-only in v1 — pair with
            fancy-code&apos;s <code>FileViewer</code> for content preview.
        </p>
    ),
    examples: [
        {
            name: "Directory picker (provider mode)",
            description:
                "`select=\"directory\"` over an async provider — folders lazy-load on first expand (~300ms fake latency shows the per-node loading states).",
            render: () => <DirectoryPickerDemo />,
            code: `const FS: Record<string, FileEntry[]> = {
    "/": [
        { path: "/projects", name: "projects", kind: "dir", hasChildren: true },
        { path: "/notes.md", name: "notes.md", kind: "file", size: 2380 },
    ],
    "/projects": [
        { path: "/projects/brief.pdf", name: "brief.pdf", kind: "file", size: 48210 },
    ],
};

const provider: FileBrowserProvider = {
    loadChildren: async (path) => {
        await new Promise((r) => setTimeout(r, 300)); // network latency
        const entries = FS[path];
        if (!entries) throw new Error("No such directory: " + path);
        return entries;
    },
};

const [dir, setDir] = useState<string | null>(null);

<FileBrowser
    provider={provider}
    select="directory"
    value={dir}
    onChange={(value) => setDir(value as string | null)}
    className="h-72"
/>`,
        },
        {
            name: "Snapshot mode (streamed tree)",
            description:
                "A JSON tree fed via `snapshot` — press the button to simulate the next chunk arriving from a remote machine. Selection and expansion survive updates because paths are the identity.",
            render: () => <SnapshotStreamDemo />,
            code: `const [tree, setTree] = useState<FileSnapshotNode[]>([
    { path: "/srv", name: "srv", kind: "dir" }, // depth unknown so far
]);

// As the remote machine pushes chunks over your transport:
socket.on("fs-chunk", (chunk: FileSnapshotNode[]) => {
    setTree((prev) => mergeChunk(prev, chunk)); // host-side merge — any shape works
});

// children: [] = known-empty; children: undefined = unknown depth
<FileBrowser snapshot={tree} select="file" className="h-64" />`,
        },
        {
            name: "Multiple selection",
            description:
                "`select=\"both\"` + `multiple` — `value` becomes `string[]`; click or Space toggles membership. Disabled entries can never be selected.",
            render: () => <MultiSelectDemo />,
            code: `const [paths, setPaths] = useState<string[]>([]);

<FileBrowser
    provider={provider}
    select="both"
    multiple
    value={paths}
    onChange={(value) => setPaths(value as string[])}
    className="h-64"
/>`,
        },
    ],
    props: [
        { name: "provider", type: `FileBrowserProvider`, default: "—", description: "Async data source — `loadChildren(path) => Promise<FileEntry[]>`, called lazily per folder; never an eager walk." },
        { name: "snapshot", type: `FileSnapshotNode[]`, default: "—", description: "JSON-friendly tree value, replaceable/patchable from outside. Combinable with `provider` (hybrid) — where the snapshot speaks, it wins." },
        { name: "select", type: `"file" | "directory" | "both"`, default: `"file"`, description: "Which entry kinds are selectable. Non-selectable entries stay browsable." },
        { name: "multiple", type: `boolean`, default: `false`, description: "Multi-select; `value` becomes `string[]`." },
        { name: "value", type: `string | string[] | null`, default: "—", description: "Controlled selection (paths)." },
        { name: "defaultValue", type: `string | string[] | null`, default: "—", description: "Initial selection (uncontrolled)." },
        { name: "onChange", type: `(value, entries) => void`, default: "—", description: "Called with the next selection and the matching known `FileEntry[]`." },
        { name: "path", type: `string`, default: "—", description: "Controlled current directory." },
        { name: "defaultPath", type: `string`, default: `"/"`, description: "Initial current directory (uncontrolled)." },
        { name: "onPathChange", type: `(path) => void`, default: "—", description: "Called on navigation — breadcrumb click, path input, double-clicked folder." },
        { name: "expandedPaths", type: `string[]`, default: "—", description: "Controlled expanded folder paths." },
        { name: "defaultExpandedPaths", type: `string[]`, default: "—", description: "Initially expanded folders (uncontrolled)." },
        { name: "onExpandedChange", type: `(paths: string[]) => void`, default: "—", description: "Called when the expanded set changes." },
        { name: "sort", type: `FileSort`, default: "—", description: "Controlled sort order — `{ by: \"name\" | \"size\" | \"mtime\", direction: \"asc\" | \"desc\" }`. Directories always sort before files." },
        { name: "defaultSort", type: `FileSort`, default: `{ by: "name", direction: "asc" }`, description: "Initial sort order (uncontrolled)." },
        { name: "onSortChange", type: `(sort) => void`, default: "—", description: "Called when the sort order changes." },
        { name: "filter", type: `string`, default: "—", description: "Controlled name filter — client-side substring match over loaded nodes only; never triggers loads." },
        { name: "defaultFilter", type: `string`, default: `""`, description: "Initial name filter (uncontrolled)." },
        { name: "onFilterChange", type: `(filter) => void`, default: "—", description: "Called when the name filter changes." },
        { name: "onError", type: `(path, error) => void`, default: "—", description: "Called when a provider load rejects; the failed folder shows an inline error with a Retry button." },
        { name: "indentSize", type: `number`, default: `16`, description: "Pixel indent per nesting level." },
        { name: "showIcons", type: `boolean`, default: `true`, description: "Show file / folder icons." },
        { name: "className", type: `string`, default: "—", description: "Extra classes on the outer shell." },
        { name: "children", type: `ReactNode`, default: "PathBar + Toolbar + Tree", description: "Custom compound layout — rearrange or omit `FileBrowser.PathBar` / `FileBrowser.Toolbar` / `FileBrowser.Tree`." },
    ],
    notes: (
        <div className="space-y-2 text-xs text-zinc-600 dark:text-zinc-300">
            <p>
                <strong>Entries:</strong> a <code>FileEntry</code> is <code>path</code> (stable
                POSIX-style identity), <code>name</code>, <code>kind</code>, plus optional{" "}
                <code>size</code>, <code>mtime</code>, <code>disabled</code>, and — for dirs —{" "}
                <code>hasChildren</code> (<code>false</code> = known-empty, <code>undefined</code> ={" "}
                unknown, loadable with a provider). Snapshot nodes add <code>children</code>:{" "}
                <code>[]</code> = known-empty, <code>undefined</code> = unknown depth.
            </p>
            <p>
                <strong>Keyboard:</strong> ARIA <code>tree</code> semantics with a roving tabindex —
                arrows move / expand / collapse, <code>Home</code>/<code>End</code> jump,{" "}
                <code>Enter</code> selects and toggles folders, <code>Space</code> toggles selection.
                The path bar breadcrumb is editable: type a path, <code>Enter</code> navigates.
            </p>
            <p>
                <strong>Human+:</strong> every row carries a <code>data-path</code> stable handle —
                paths, never indexes, are the agent surface. Fully custom subcomponents can read the
                whole context via <code>useFileBrowser()</code>. SSR-safe: rendering is deterministic
                and the first provider load kicks off at hydration.
            </p>
        </div>
    ),
};
