import { useState, useCallback } from "react";
import { TreeNav, Tabs, Badge } from "@particle-academy/react-fancy";
import type { TreeNodeData } from "@particle-academy/react-fancy";
import { CodeEditor } from "@particle-academy/fancy-code";

// ---------------------------------------------------------------------------
// Monorepo file tree
// ---------------------------------------------------------------------------

const FILE_TREE: TreeNodeData[] = [
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
                      { id: "CodeEditor.tsx", label: "CodeEditor.tsx", ext: "tsx" },
                      { id: "CodeEditor.types.ts", label: "CodeEditor.types.ts", ext: "ts" },
                      { id: "CodeEditorPanel.tsx", label: "CodeEditorPanel.tsx", ext: "tsx" },
                      { id: "CodeEditorToolbar.tsx", label: "CodeEditorToolbar.tsx", ext: "tsx" },
                      { id: "CodeEditorStatusBar.tsx", label: "CodeEditorStatusBar.tsx", ext: "tsx" },
                    ],
                  },
                ],
              },
              {
                id: "fc-engine", label: "engine", type: "folder", children: [
                  { id: "tokenizer.ts", label: "tokenizer.ts", ext: "ts" },
                  { id: "highlight.ts", label: "highlight.ts", ext: "ts" },
                  {
                    id: "fc-tokenizers", label: "tokenizers", type: "folder", children: [
                      { id: "javascript.ts", label: "javascript.ts", ext: "ts" },
                      { id: "html.ts", label: "html.ts", ext: "ts" },
                      { id: "php.ts", label: "php.ts", ext: "ts" },
                    ],
                  },
                ],
              },
              {
                id: "fc-hooks", label: "hooks", type: "folder", children: [
                  { id: "use-editor-engine.ts", label: "use-editor-engine.ts", ext: "ts" },
                  { id: "use-dark-mode.ts", label: "use-dark-mode.ts", ext: "ts" },
                ],
              },
              { id: "fc-index.ts", label: "index.ts", ext: "ts" },
            ],
          },
          { id: "fc-package.json", label: "package.json", ext: "json" },
        ],
      },
      {
        id: "react-fancy", label: "react-fancy", type: "folder", children: [
          {
            id: "rf-src", label: "src", type: "folder", children: [
              { id: "rf-index.ts", label: "index.ts", ext: "ts" },
            ],
          },
          { id: "rf-package.json", label: "package.json", ext: "json" },
          { id: "rf-README.md", label: "README.md", ext: "md" },
        ],
      },
      {
        id: "laravel-catalog", label: "laravel-catalog", type: "folder", children: [
          {
            id: "lc-src", label: "src", type: "folder", children: [
              { id: "CatalogManager.php", label: "CatalogManager.php", ext: "php" },
              { id: "CatalogServiceProvider.php", label: "CatalogServiceProvider.php", ext: "php" },
            ],
          },
        ],
      },
    ],
  },
  {
    id: "resources", label: "resources", type: "folder", children: [
      {
        id: "res-js", label: "js", type: "folder", children: [
          { id: "react-demos.tsx", label: "react-demos.tsx", ext: "tsx" },
        ],
      },
      {
        id: "res-views", label: "views", type: "folder", children: [
          { id: "ux-demos.blade.php", label: "ux-demos.blade.php", ext: "php" },
        ],
      },
    ],
  },
  { id: "vite.config.js", label: "vite.config.js", ext: "js" },
  { id: "composer.json", label: "composer.json", ext: "json" },
  { id: "package.json", label: "package.json", ext: "json" },
];

// ---------------------------------------------------------------------------
// File contents (real code from this monorepo)
// ---------------------------------------------------------------------------

const FILE_CONTENTS: Record<string, { code: string; lang: string }> = {
  "CodeEditor.tsx": {
    lang: "TypeScript",
    code: `import { useMemo, useRef, useState, useCallback } from "react";
import { cn, useControllableState } from "@particle-academy/react-fancy";
import { CodeEditorContext } from "./CodeEditor.context";
import { CodeEditorPanel } from "./CodeEditorPanel";
import { CodeEditorToolbar } from "./CodeEditorToolbar";
import { CodeEditorStatusBar } from "./CodeEditorStatusBar";
import { useEditorEngine } from "../../hooks/use-editor-engine";
import { useDarkMode } from "../../hooks/use-dark-mode";
import { getLanguage } from "../../languages";

function CodeEditorRoot({
  children, className, value: valueProp, defaultValue = "",
  onChange, language: languageProp = "javascript",
  theme = "auto", readOnly = false,
  lineNumbers: lineNumbersProp = true,
  wordWrap: wordWrapProp = false,
  tabSize: tabSizeProp = 2,
  placeholder, minHeight, maxHeight,
}: CodeEditorProps) {
  const [currentValue, setCurrentValue] = useControllableState(
    valueProp, defaultValue, onChange
  );
  const isDark = useDarkMode();
  const resolvedTheme = theme === "auto"
    ? (isDark ? "dark" : "light") : theme;
  // ...
}`,
  },
  "tokenizer.ts": {
    lang: "TypeScript",
    code: `export type TokenType =
  | "keyword" | "string" | "comment" | "number"
  | "operator" | "tag" | "attribute" | "attributeValue"
  | "punctuation" | "function" | "type" | "variable" | "plain";

export interface Token {
  type: TokenType;
  start: number;
  end: number;
}

export type Tokenizer = (source: string) => Token[];

export function tok(type: TokenType, s: number, e: number): Token {
  return { type: type, start: s, end: e };
}`,
  },
  "CatalogManager.php": {
    lang: "PHP",
    code: `<?php

namespace LaravelCatalog;

use LaravelCatalog\\Models\\Product;
use LaravelCatalog\\Models\\Price;

class CatalogManager
{
    public function __construct(
        private StripeCatalogService $catalog,
        private StripeCheckoutService $checkout,
    ) {}

    public function syncProduct(Product $product): void
    {
        $this->catalog->syncProduct($product);

        foreach ($product->prices as $price) {
            $this->catalog->syncPrice($price);
        }
    }

    public function createCheckout(Price $price, array $options = []): string
    {
        return $this->checkout->createSession($price, $options);
    }
}`,
  },
  "vite.config.js": {
    lang: "JavaScript",
    code: `import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
    plugins: [
        laravel({
            input: [
                'resources/css/app.css',
                'resources/js/app.js',
                'resources/css/react-demos.css',
                'resources/js/react-demos.tsx',
            ],
            refresh: true,
        }),
        react(),
        tailwindcss(),
    ],
    resolve: {
        alias: {
            '@particle-academy/react-fancy':
                path.resolve(__dirname, 'packages/react-fancy/src'),
            '@particle-academy/fancy-code':
                path.resolve(__dirname, 'packages/fancy-code/src'),
        },
    },
});`,
  },
  "ux-demos.blade.php": {
    lang: "HTML",
    code: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>UX Demos - Laravel Catalog</title>
    @viteReactRefresh
    @vite(['resources/css/react-demos.css', 'resources/js/react-demos.tsx'])
</head>
<body class="min-h-screen bg-zinc-50 text-zinc-900 antialiased dark:bg-zinc-950 dark:text-zinc-100">
    <div id="react-demos"></div>
</body>
</html>`,
  },
  "javascript.ts": {
    lang: "TypeScript",
    code: `import type { Token, Tokenizer } from "../tokenizer";

const KEYWORDS = new Set([
  "abstract", "async", "await", "break", "case", "catch",
  "class", "const", "continue", "default", "delete", "do",
  "else", "export", "extends", "false", "finally", "for",
  "function", "if", "import", "in", "instanceof", "let",
  "new", "null", "return", "static", "super", "switch",
  "this", "throw", "true", "try", "typeof", "var", "void",
  "while", "with", "yield",
]);

export const tokenizeJavaScript: Tokenizer = (source) => {
  const tokens: Token[] = [];
  const len = source.length;
  let i = 0;

  while (i < len) {
    const ch = source[i];
    // ... tokenization logic
  }

  return tokens;
};`,
  },
};

// Default file to show
const DEFAULT_FILE = "vite.config.js";

// ---------------------------------------------------------------------------
// Tab type
// ---------------------------------------------------------------------------

interface OpenTab {
  id: string;
  label: string;
  lang: string;
}

// ---------------------------------------------------------------------------
// IDE Demo
// ---------------------------------------------------------------------------

export function IdeDemo() {
  const [selectedFile, setSelectedFile] = useState(DEFAULT_FILE);
  const [openTabs, setOpenTabs] = useState<OpenTab[]>([
    { id: DEFAULT_FILE, label: DEFAULT_FILE, lang: "JavaScript" },
  ]);
  const [fileContents, setFileContents] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    for (const [key, val] of Object.entries(FILE_CONTENTS)) {
      initial[key] = val.code;
    }
    return initial;
  });

  const handleFileSelect = useCallback((id: string, node: TreeNodeData) => {
    if (node.type === "folder" || (node.children && node.children.length > 0)) return;
    setSelectedFile(id);

    // Add tab if not already open
    setOpenTabs((prev) => {
      if (prev.some((t) => t.id === id)) return prev;
      const content = FILE_CONTENTS[id];
      return [...prev, { id, label: node.label, lang: content?.lang ?? "JavaScript" }];
    });
  }, []);

  const handleCloseTab = useCallback((tabId: string) => {
    setOpenTabs((prev) => {
      const next = prev.filter((t) => t.id !== tabId);
      if (tabId === selectedFile && next.length > 0) {
        setSelectedFile(next[next.length - 1].id);
      }
      return next;
    });
  }, [selectedFile]);

  const currentContent = fileContents[selectedFile] ?? `// ${selectedFile}\n// File not loaded`;
  const currentLang = FILE_CONTENTS[selectedFile]?.lang ?? "JavaScript";

  const handleCodeChange = useCallback((value: string) => {
    setFileContents((prev) => ({ ...prev, [selectedFile]: value }));
  }, [selectedFile]);

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">IDE</h1>
      <p className="mb-4 text-sm text-zinc-500">
        Full IDE layout combining TreeNav, Tabs, and CodeEditor with real files from this monorepo. Click files in the tree to open them.
      </p>

      <div
        className="flex overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-700"
        style={{ height: 600 }}
      >
        {/* File tree sidebar */}
        <div className="w-56 shrink-0 overflow-y-auto border-r border-zinc-200 bg-zinc-50 p-2 dark:border-zinc-700 dark:bg-zinc-900/50">
          <p className="mb-1 px-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
            Explorer
          </p>
          <TreeNav
            nodes={FILE_TREE}
            selectedId={selectedFile}
            onSelect={handleFileSelect}
            defaultExpandedIds={["packages", "fancy-code", "fc-src", "fc-engine"]}
            indentSize={12}
          />
        </div>

        {/* Editor area */}
        <div className="flex min-w-0 flex-1 flex-col">
          {/* Tabs */}
          {openTabs.length > 0 && (
            <div className="flex items-center gap-0 border-b border-zinc-200 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900/50">
              {openTabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setSelectedFile(tab.id)}
                  className={`group flex items-center gap-1.5 border-r border-zinc-200 px-3 py-1.5 text-[12px] transition-colors dark:border-zinc-700 ${
                    tab.id === selectedFile
                      ? "bg-white text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100"
                      : "text-zinc-500 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800/50"
                  }`}
                >
                  <span className="truncate">{tab.label}</span>
                  <span
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCloseTab(tab.id);
                    }}
                    className="ml-1 rounded p-0.5 opacity-0 transition-opacity hover:bg-zinc-200 group-hover:opacity-100 dark:hover:bg-zinc-700"
                  >
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* Code editor */}
          <div className="flex-1">
            <CodeEditor
              value={currentContent}
              onChange={handleCodeChange}
              language={currentLang}
              theme="dark"
              maxHeight={550}
            >
              <CodeEditor.Panel />
              <CodeEditor.StatusBar />
            </CodeEditor>
          </div>
        </div>
      </div>
    </div>
  );
}
