import { useState } from "react";

export const USAGE = `import { CrumbDrop } from "@particle-academy/react-fancy";

<CrumbDrop
  tree={tree}                    // { id, label, children: TreeNode[] }
  path={path}                    // string[] of node ids root → leaf
  onChange={setPath}
/>

// Bridge sketch:
// registerCrumbDropBridge(server, { adapter })
//   → crumb_get()  crumb_navigate(pathIds)  crumb_list_siblings(crumbIndex)
`;

type TreeNode = { id: string; label: string; children?: TreeNode[] };

/**
 * CrumbDrop — breadcrumb where every crumb opens its siblings as a dropdown.
 * Lets users navigate UP (truncate path) and SIDEWAYS (swap a crumb for a
 * sibling) without ever leaving the bar. `tree` is plain JSON, `path` is a
 * stable list of node ids. Agents drive it via crumb_navigate(pathIds).
 */
function CrumbDrop({
  tree,
  path,
  onChange,
}: {
  tree: TreeNode;
  path: string[];
  onChange: (next: string[]) => void;
}) {
  const [open, setOpen] = useState<number | null>(null);

  // Resolve crumb metadata for each path segment.
  const crumbs: { node: TreeNode; siblings: TreeNode[]; pathSoFar: string[] }[] = [];
  let current: TreeNode = tree;
  let parent: TreeNode | null = null;
  crumbs.push({ node: tree, siblings: [tree], pathSoFar: [tree.id] });

  for (let i = 1; i < path.length; i++) {
    parent = current;
    const found = parent.children?.find((c) => c.id === path[i]);
    if (!found) break;
    current = found;
    crumbs.push({
      node: current,
      siblings: parent.children ?? [],
      pathSoFar: path.slice(0, i + 1),
    });
  }

  return (
    <nav data-fancy="crumb-drop" className="inline-flex items-center gap-1 text-sm">
      {crumbs.map((c, i) => {
        const isLast = i === crumbs.length - 1;
        return (
          <span key={c.node.id} className="flex items-center" data-crumb-index={i}>
            <span className="relative inline-block">
              <button
                onClick={() => onChange(c.pathSoFar)}
                onContextMenu={(e) => {
                  e.preventDefault();
                  setOpen(open === i ? null : i);
                }}
                onDoubleClick={() => setOpen(open === i ? null : i)}
                className={`rounded px-2 py-0.5 ${
                  isLast
                    ? "font-semibold text-zinc-900 dark:text-zinc-100"
                    : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
                }`}
              >
                {c.node.label}
              </button>
              {c.siblings.length > 1 && (
                <button
                  onClick={() => setOpen(open === i ? null : i)}
                  aria-label="Show siblings"
                  className="ml-0.5 inline-block rounded px-1 text-[10px] text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
                >
                  ▾
                </button>
              )}
              {open === i && (
                <div
                  className="absolute left-0 top-full z-10 mt-1 min-w-[180px] overflow-hidden rounded-md border border-zinc-200 bg-white shadow-lg dark:border-zinc-700 dark:bg-zinc-900"
                  onMouseLeave={() => setOpen(null)}
                >
                  <div className="border-b border-zinc-100 px-2 py-1 text-[10px] uppercase tracking-wider text-zinc-400 dark:border-zinc-800">
                    Siblings of {c.node.label}
                  </div>
                  <ul>
                    {c.siblings.map((s) => (
                      <li key={s.id}>
                        <button
                          onClick={() => {
                            const nextPath = [...c.pathSoFar.slice(0, -1), s.id];
                            onChange(nextPath);
                            setOpen(null);
                          }}
                          data-sibling-id={s.id}
                          className={`flex w-full items-center gap-2 px-2 py-1 text-left text-xs hover:bg-violet-50 dark:hover:bg-violet-900/30 ${
                            s.id === c.node.id ? "font-semibold text-violet-700 dark:text-violet-300" : ""
                          }`}
                        >
                          {s.label}
                          {s.children && s.children.length > 0 && (
                            <span className="ml-auto text-[10px] text-zinc-400">▸</span>
                          )}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </span>
            {!isLast && <span className="px-1 text-zinc-400">/</span>}
          </span>
        );
      })}

      {/* Show children of last crumb for descent */}
      {current.children && current.children.length > 0 && (
        <span className="relative inline-block">
          <button
            onClick={() => setOpen(open === crumbs.length ? null : crumbs.length)}
            className="rounded px-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
          >
            +
          </button>
          {open === crumbs.length && (
            <div
              className="absolute left-0 top-full z-10 mt-1 min-w-[180px] overflow-hidden rounded-md border border-zinc-200 bg-white shadow-lg dark:border-zinc-700 dark:bg-zinc-900"
              onMouseLeave={() => setOpen(null)}
            >
              <div className="border-b border-zinc-100 px-2 py-1 text-[10px] uppercase tracking-wider text-zinc-400 dark:border-zinc-800">
                Descend into…
              </div>
              <ul>
                {current.children.map((c) => (
                  <li key={c.id}>
                    <button
                      onClick={() => {
                        onChange([...path, c.id]);
                        setOpen(null);
                      }}
                      className="flex w-full items-center gap-2 px-2 py-1 text-left text-xs hover:bg-violet-50 dark:hover:bg-violet-900/30"
                    >
                      {c.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </span>
      )}
    </nav>
  );
}

const TREE: TreeNode = {
  id: "root",
  label: "Workspace",
  children: [
    {
      id: "particle-academy",
      label: "Particle Academy",
      children: [
        {
          id: "fancy-ui",
          label: "Fancy UI",
          children: [
            { id: "react-fancy", label: "react-fancy" },
            { id: "fancy-whiteboard", label: "fancy-whiteboard" },
            { id: "fancy-flow", label: "fancy-flow" },
            { id: "fancy-sheets", label: "fancy-sheets" },
            { id: "agent-integrations", label: "agent-integrations" },
          ],
        },
        {
          id: "human-plus",
          label: "Human+ UX",
          children: [
            { id: "whitepaper", label: "Whitepaper" },
            { id: "demos", label: "Demos" },
          ],
        },
      ],
    },
    {
      id: "impactivism",
      label: "Impactivism",
      children: [{ id: "marketing", label: "Marketing" }],
    },
  ],
};

export function CrumbDropDemo() {
  const [path, setPath] = useState<string[]>([
    "root",
    "particle-academy",
    "fancy-ui",
    "react-fancy",
  ]);
  return (
    <div className="space-y-3">
      <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <CrumbDrop tree={TREE} path={path} onChange={setPath} />
      </div>
      <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3 text-xs dark:border-zinc-800 dark:bg-zinc-950">
        <div className="mb-1 font-medium">Current path</div>
        <code className="block rounded bg-white p-2 font-mono text-[11px] dark:bg-zinc-900">
          {JSON.stringify(path)}
        </code>
        <p className="mt-2 text-[11px] italic text-zinc-500">
          Click the chevron next to any crumb (or double-click the crumb) to swap it for
          a sibling. Click the trailing <code>+</code> to descend into a child.
        </p>
      </div>
    </div>
  );
}
