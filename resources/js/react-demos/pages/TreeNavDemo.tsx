import { useState } from "react";
import { TreeNav } from "@particle-academy/react-fancy";
import type { TreeNodeData } from "@particle-academy/react-fancy";
import { DemoSection } from "../components/DemoSection";

const MONOREPO_TREE: TreeNodeData[] = [
  {
    id: "packages", label: "packages", type: "folder", children: [
      {
        id: "fancy-code", label: "fancy-code", type: "folder", children: [
          {
            id: "fc-src", label: "src", type: "folder", children: [
              {
                id: "fc-components", label: "components", type: "folder", children: [
                  {
                    id: "fc-codeeditor", label: "CodeEditor", type: "folder", children: [
                      { id: "fc-ce-tsx", label: "CodeEditor.tsx", ext: "tsx" },
                      { id: "fc-ce-types", label: "CodeEditor.types.ts", ext: "ts" },
                      { id: "fc-ce-ctx", label: "CodeEditor.context.ts", ext: "ts" },
                      { id: "fc-ce-panel", label: "CodeEditorPanel.tsx", ext: "tsx" },
                      { id: "fc-ce-toolbar", label: "CodeEditorToolbar.tsx", ext: "tsx" },
                      { id: "fc-ce-status", label: "CodeEditorStatusBar.tsx", ext: "tsx" },
                      { id: "fc-ce-index", label: "index.ts", ext: "ts" },
                    ],
                  },
                ],
              },
              {
                id: "fc-engine", label: "engine", type: "folder", children: [
                  { id: "fc-tokenizer", label: "tokenizer.ts", ext: "ts" },
                  { id: "fc-highlight", label: "highlight.ts", ext: "ts" },
                  {
                    id: "fc-tokenizers", label: "tokenizers", type: "folder", children: [
                      { id: "fc-tok-js", label: "javascript.ts", ext: "ts" },
                      { id: "fc-tok-html", label: "html.ts", ext: "ts" },
                      { id: "fc-tok-php", label: "php.ts", ext: "ts" },
                    ],
                  },
                ],
              },
              { id: "fc-index", label: "index.ts", ext: "ts" },
              { id: "fc-styles", label: "styles.css", ext: "css" },
            ],
          },
          { id: "fc-pkg", label: "package.json", ext: "json" },
          { id: "fc-tsconfig", label: "tsconfig.json", ext: "json" },
        ],
      },
      {
        id: "react-fancy", label: "react-fancy", type: "folder", children: [
          {
            id: "rf-src", label: "src", type: "folder", children: [
              { id: "rf-index", label: "index.ts", ext: "ts" },
              { id: "rf-styles", label: "styles.css", ext: "css" },
            ],
          },
          { id: "rf-pkg", label: "package.json", ext: "json" },
          { id: "rf-readme", label: "README.md", ext: "md" },
        ],
      },
    ],
  },
  {
    id: "resources", label: "resources", type: "folder", children: [
      {
        id: "res-js", label: "js", type: "folder", children: [
          { id: "res-demos", label: "react-demos.tsx", ext: "tsx" },
        ],
      },
      {
        id: "res-css", label: "css", type: "folder", children: [
          { id: "res-css-demos", label: "react-demos.css", ext: "css" },
        ],
      },
    ],
  },
  { id: "root-pkg", label: "package.json", ext: "json" },
  { id: "root-vite", label: "vite.config.js", ext: "js" },
  { id: "root-composer", label: "composer.json", ext: "json" },
];

export function TreeNavDemo() {
  const [selectedId, setSelectedId] = useState<string>("");

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">TreeNav</h1>

      <DemoSection
        title="File Tree"
        description="Hierarchical tree navigation with file/folder icons, expand/collapse, and selection. Showing this monorepo's package structure."
        code={`<TreeNav
  nodes={treeData}
  selectedId={selectedId}
  onSelect={(id) => setSelectedId(id)}
  defaultExpandedIds={["packages", "fancy-code", "fc-src"]}
/>`}
      >
        <div className="max-w-sm">
          <div className="rounded-lg border border-zinc-200 bg-white p-2 dark:border-zinc-700 dark:bg-zinc-900">
            <TreeNav
              nodes={MONOREPO_TREE}
              selectedId={selectedId}
              onSelect={(id) => setSelectedId(id)}
              defaultExpandedIds={["packages", "fancy-code", "fc-src"]}
            />
          </div>
          {selectedId && (
            <p className="mt-2 text-xs text-zinc-500">Selected: <code className="rounded bg-zinc-100 px-1 py-0.5 dark:bg-zinc-800">{selectedId}</code></p>
          )}
        </div>
      </DemoSection>

      <DemoSection
        title="Expand All"
        description="All folders expanded by default."
        code={`<TreeNav nodes={treeData} defaultExpandAll />`}
      >
        <div className="max-w-sm">
          <div className="rounded-lg border border-zinc-200 bg-white p-2 dark:border-zinc-700 dark:bg-zinc-900">
            <TreeNav
              nodes={MONOREPO_TREE.slice(0, 1)}
              defaultExpandAll
            />
          </div>
        </div>
      </DemoSection>

      <DemoSection
        title="No Icons"
        description="Plain text tree without file/folder icons."
        code={`<TreeNav nodes={treeData} showIcons={false} />`}
      >
        <div className="max-w-sm">
          <div className="rounded-lg border border-zinc-200 bg-white p-2 dark:border-zinc-700 dark:bg-zinc-900">
            <TreeNav
              nodes={MONOREPO_TREE.slice(0, 1)}
              showIcons={false}
              defaultExpandedIds={["packages", "fancy-code"]}
            />
          </div>
        </div>
      </DemoSection>
    </div>
  );
}
