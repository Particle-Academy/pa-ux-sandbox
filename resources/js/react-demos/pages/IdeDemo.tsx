import { useState, useCallback } from "react";
import { TreeNav, ContextMenu } from "@particle-academy/react-fancy";
import type { TreeNodeData } from "@particle-academy/react-fancy";
import { CodeEditor } from "@particle-academy/fancy-code";
import { DemoSection } from "../components/DemoSection";

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
  "CodeEditor.types.ts": {
    lang: "TypeScript",
    code: `import type { ReactNode } from "react";
import type { UseEditorEngineReturn } from "../../hooks/use-editor-engine";

export interface CodeEditorProps {
  children: ReactNode;
  className?: string;
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  language?: string;
  onLanguageChange?: (lang: string) => void;
  theme?: string;
  readOnly?: boolean;
  lineNumbers?: boolean;
  wordWrap?: boolean;
  tabSize?: number;
  placeholder?: string;
  minHeight?: number;
  maxHeight?: number;
}

export interface CodeEditorContextValue {
  getValue: () => string;
  getSelection: () => string;
  setValue: (value: string) => void;
  replaceSelection: (text: string) => void;
  focus: () => void;
  language: string;
  setLanguage: (lang: string) => void;
  theme: string;
  readOnly: boolean;
  lineNumbers: boolean;
  wordWrap: boolean;
  tabSize: number;
  toggleWordWrap: () => void;
  toggleLineNumbers: () => void;
  copyToClipboard: () => Promise<void>;
  cursorPosition: { line: number; col: number };
  selectionLength: number;
}`,
  },
  "CodeEditorPanel.tsx": {
    lang: "TypeScript",
    code: `import { useMemo } from "react";
import { cn } from "@particle-academy/react-fancy";
import { useCodeEditor } from "./CodeEditor.context";
import type { CodeEditorPanelProps } from "./CodeEditor.types";

export function CodeEditorPanel({ className }: CodeEditorPanelProps) {
  const {
    _engineReturn: engine,
    lineNumbers, wordWrap, readOnly,
    placeholder, _maxHeight, _minHeight,
  } = useCodeEditor();

  if (!engine) return null;

  const {
    textareaRef, highlightedHtml, lineCount,
    activeLine, themeColors,
    handleKeyDown, handleInput,
    handleScroll, handleSelect,
  } = engine;

  // Renders textarea + highlighted overlay
  return (
    <div data-fancy-code-panel="" className={cn("relative overflow-auto", className)}>
      {/* Line numbers gutter */}
      {/* Highlighted code overlay (pre > code) */}
      {/* Transparent textarea for actual input */}
    </div>
  );
}`,
  },
  "CodeEditorToolbar.tsx": {
    lang: "TypeScript",
    code: `import { useState } from "react";
import { cn } from "@particle-academy/react-fancy";
import { useCodeEditor } from "./CodeEditor.context";
import { CodeEditorToolbarSeparator } from "./CodeEditorToolbarSeparator";
import { getRegisteredLanguages } from "../../languages";

export function CodeEditorToolbar({ children, className }: CodeEditorToolbarProps) {
  const hasChildren = children != null;

  return (
    <div data-fancy-code-toolbar="" className={cn(
      "flex items-center gap-0.5 border-b border-zinc-200 px-2 py-1 dark:border-zinc-700",
      className,
    )}>
      {hasChildren ? children : <DefaultToolbarActions />}
    </div>
  );
}`,
  },
  "CodeEditorStatusBar.tsx": {
    lang: "TypeScript",
    code: `import { cn } from "@particle-academy/react-fancy";
import { useCodeEditor } from "./CodeEditor.context";

export function CodeEditorStatusBar({ children, className }: CodeEditorStatusBarProps) {
  const { cursorPosition, selectionLength, language, tabSize } = useCodeEditor();

  return (
    <div data-fancy-code-statusbar="" className={cn(
      "flex items-center gap-3 border-t border-zinc-200 px-3 py-1 text-[11px]",
      className,
    )}>
      {children ?? (
        <>
          <span>Ln {cursorPosition.line}, Col {cursorPosition.col}</span>
          {selectionLength > 0 && <span>{selectionLength} selected</span>}
          <span className="ml-auto">{language}</span>
          <span>{tabSize} spaces</span>
        </>
      )}
    </div>
  );
}`,
  },
  "highlight.ts": {
    lang: "TypeScript",
    code: `import type { Token, TokenType } from "./tokenizer";
import type { ThemeColors } from "../themes/types";

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export function highlightCode(
  source: string,
  tokens: Token[],
  colors: ThemeColors,
): string {
  if (tokens.length === 0) return escapeHtml(source);

  const parts: string[] = [];
  let pos = 0;

  for (const token of tokens) {
    if (token.start > pos) {
      parts.push(escapeHtml(source.slice(pos, token.start)));
    }
    const text = escapeHtml(source.slice(token.start, token.end));
    const color = colorMap[token.type];
    parts.push(\`<span style="color:\${color}">\${text}</span>\`);
    pos = token.end;
  }

  return parts.join("");
}`,
  },
  "html.ts": {
    lang: "TypeScript",
    code: `import type { Token, Tokenizer } from "../tokenizer";

export const tokenizeHtml: Tokenizer = (source: string): Token[] => {
  const tokens: Token[] = [];
  const len = source.length;
  let i = 0;

  while (i < len) {
    // HTML comment: <!-- ... -->
    if (source[i] === "<" && source.slice(i, i + 4) === "<!--") {
      const pos = i;
      i += 4;
      while (i < len && source.slice(i, i + 3) !== "-->") i++;
      i += 3;
      tokens.push({ type: "comment", start: pos, end: i });
      continue;
    }

    // Tags: <tagName attr="value">
    if (source[i] === "<") {
      // Parse tag name, attributes, values...
    }

    // Text content
    const pos = i;
    while (i < len && source[i] !== "<") i++;
    if (i > pos) tokens.push({ type: "plain", start: pos, end: i });
  }

  return tokens;
};`,
  },
  "php.ts": {
    lang: "TypeScript",
    code: `import type { Token, Tokenizer } from "../tokenizer";
import { tokenizeHtml } from "./html";

const PHP_KEYWORDS = new Set([
  "abstract", "class", "const", "echo", "else", "extends",
  "final", "foreach", "function", "if", "implements",
  "interface", "namespace", "new", "private", "protected",
  "public", "return", "static", "use", "while", "yield",
]);

export const tokenizePhp: Tokenizer = (source: string): Token[] => {
  const tokens: Token[] = [];
  const len = source.length;
  let i = 0;
  let htmlChunkStart = 0;

  while (i < len) {
    // Detect <?php open tag
    if (source[i] === "<" && source[i + 1] === "?") {
      // Tokenize HTML before this block
      // Tokenize PHP content (keywords, $variables, strings, comments)
      // Detect ?> close tag
    }
    i++;
  }

  return tokens;
};`,
  },
  "use-editor-engine.ts": {
    lang: "TypeScript",
    code: `import { useEffect, useRef, useCallback, useState, useMemo } from "react";
import { getLanguage } from "../languages";
import { getTheme } from "../themes";
import { highlightCode } from "../engine/highlight";
import type { ThemeColors } from "../themes/types";
import type { Tokenizer } from "../engine/tokenizer";

export function useEditorEngine({
  value, onChange, language, theme,
  readOnly, tabSize, onCursorChange,
}: UseEditorEngineOptions): UseEditorEngineReturn {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Resolve theme colors
  const themeColors = useMemo<ThemeColors>(() => {
    const def = getTheme(theme);
    return def?.colors ?? DEFAULT_COLORS;
  }, [theme]);

  // Resolve tokenizer
  const tokenizer = useMemo<Tokenizer | null>(() => {
    const def = getLanguage(language);
    return def?.tokenize ?? null;
  }, [language]);

  // Generate highlighted HTML
  const highlightedHtml = useMemo(() => {
    if (!tokenizer) return escapeHtml(value);
    const tokens = tokenizer(value);
    return highlightCode(value, tokens, themeColors);
  }, [value, tokenizer, themeColors]);

  // Tab key, Enter auto-indent, cursor tracking...

  return {
    textareaRef, highlightedHtml, lineCount,
    activeLine, themeColors,
    handleKeyDown, handleInput, handleScroll, handleSelect,
    scrollTop, scrollLeft,
  };
}`,
  },
  "use-dark-mode.ts": {
    lang: "TypeScript",
    code: `import { useSyncExternalStore } from "react";

function subscribe(callback: () => void): () => void {
  const mq = window.matchMedia("(prefers-color-scheme: dark)");
  mq.addEventListener("change", callback);
  return () => mq.removeEventListener("change", callback);
}

function getSnapshot(): boolean {
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

export function useDarkMode(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, () => false);
}`,
  },
  "fc-index.ts": {
    lang: "TypeScript",
    code: `// Components
export { CodeEditor, useCodeEditor } from "./components/CodeEditor";
export type {
  CodeEditorProps,
  CodeEditorContextValue,
  CodeEditorToolbarProps,
  CodeEditorPanelProps,
  CodeEditorStatusBarProps,
} from "./components/CodeEditor";

// Language registration
export { registerLanguage, getLanguage, getRegisteredLanguages } from "./languages";
export type { LanguageDefinition } from "./languages";

// Theme registration
export { registerTheme, getTheme, getRegisteredThemes } from "./themes";
export type { ThemeDefinition, ThemeColors } from "./themes";

// Tokenizer types (for custom language authors)
export type { Token, TokenType, Tokenizer } from "./engine/tokenizer";`,
  },
  "fc-package.json": {
    lang: "JavaScript",
    code: `{
  "name": "@particle-academy/fancy-code",
  "version": "0.2.0",
  "description": "Lightweight embedded code editor with syntax highlighting",
  "type": "module",
  "main": "./dist/index.cjs",
  "module": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "peerDependencies": {
    "react": "^18.0.0 || ^19.0.0",
    "react-dom": "^18.0.0 || ^19.0.0",
    "@particle-academy/react-fancy": "^1.5.0"
  },
  "dependencies": {},
  "scripts": {
    "build": "tsup",
    "dev": "tsup --watch",
    "lint": "tsc --noEmit"
  }
}`,
  },
  "CatalogServiceProvider.php": {
    lang: "PHP",
    code: `<?php

namespace LaravelCatalog;

use Illuminate\\Support\\ServiceProvider;
use LaravelCatalog\\Livewire\\Admin\\Products\\Index;
use Livewire\\Livewire;

class CatalogServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->mergeConfigFrom(__DIR__ . '/../config/catalog.php', 'catalog');

        $this->app->singleton(CatalogManager::class, function ($app) {
            return new CatalogManager(
                $app->make(StripeCatalogService::class),
                $app->make(StripeCheckoutService::class),
            );
        });

        $this->app->alias(CatalogManager::class, 'catalog');
    }

    public function boot(): void
    {
        $this->loadMigrationsFrom(__DIR__ . '/../database/migrations');

        if (config('catalog.enable_ui')) {
            Livewire::component('catalog-products', Index::class);
            $this->loadRoutesFrom(__DIR__ . '/../routes/catalog.php');
            $this->loadViewsFrom(__DIR__ . '/../resources/views', 'catalog');
        }
    }
}`,
  },
  "rf-index.ts": {
    lang: "TypeScript",
    code: `// Phase 1: Core Components
export { Action } from "./components/Action";
export { Carousel } from "./components/Carousel";
export { Table } from "./components/Table";

// Phase 2: Display
export { Heading } from "./components/Heading";
export { Text } from "./components/Text";
export { Badge } from "./components/Badge";
export { Card } from "./components/Card";

// Phase 3: Overlay
export { Modal } from "./components/Modal";
export { Toast, useToast } from "./components/Toast";
export { Dropdown } from "./components/Dropdown";

// Phase 6: Rich Content
export { Editor, useEditor } from "./components/Editor";
export { Canvas } from "./components/Canvas";
export { Diagram } from "./components/Diagram";
export { TreeNav, useTreeNav } from "./components/TreeNav";

// Utilities
export { cn } from "./utils/cn";
export { useControllableState } from "./hooks";`,
  },
  "rf-package.json": {
    lang: "JavaScript",
    code: `{
  "name": "@particle-academy/react-fancy",
  "version": "1.7.4",
  "type": "module",
  "main": "./dist/index.cjs",
  "module": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "peerDependencies": {
    "react": "^18.0.0 || ^19.0.0",
    "react-dom": "^18.0.0 || ^19.0.0",
    "tailwindcss": "^4.0.0"
  },
  "dependencies": {
    "clsx": "^2.1.0",
    "tailwind-merge": "^3.0.0",
    "marked": "^15.0.0",
    "lucide-react": "^0.511.0"
  }
}`,
  },
  "rf-README.md": {
    lang: "HTML",
    code: `# @particle-academy/react-fancy

React UI component library with 48+ components.

## Installation
npm install @particle-academy/react-fancy

## Components
- Action, Carousel, Table, Inputs
- Heading, Text, Badge, Card, Timeline
- Modal, Toast, Dropdown, Popover
- Tabs, Accordion, Navbar, Pagination
- Editor, Chart, Kanban, Canvas, Diagram
- TreeNav (file tree navigation)

## Usage
import { Action, Modal, TreeNav } from "@particle-academy/react-fancy";
import "@particle-academy/react-fancy/styles.css";`,
  },
  "react-demos.tsx": {
    lang: "TypeScript",
    code: `import { StrictMode, lazy, Suspense } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router";
import { DemoLayout } from "./react-demos/layouts/DemoLayout";
import { Home } from "./react-demos/pages/Home";

const l = (loader: () => Promise<any>, name: string) =>
  lazy(() => loader().then((m: any) => ({ default: m[name] })));

const ActionDemo = l(() => import("./react-demos/pages/ActionDemo"), "ActionDemo");
const EditorDemo = l(() => import("./react-demos/pages/EditorDemo"), "EditorDemo");
const TreeNavDemo = l(() => import("./react-demos/pages/TreeNavDemo"), "TreeNavDemo");
const IdeDemo = l(() => import("./react-demos/pages/IdeDemo"), "IdeDemo");
const CodeEditorDemo = l(() => import("./react-demos/pages/CodeEditorDemo"), "CodeEditorDemo");

const root = document.getElementById("react-demos");
if (root) {
  createRoot(root).render(
    <StrictMode>
      <BrowserRouter basename="/react-demos">
        <Suspense fallback={<Loading />}>
          <Routes>
            <Route element={<DemoLayout />}>
              <Route index element={<Home />} />
              <Route path="action" element={<ActionDemo />} />
              <Route path="editor" element={<EditorDemo />} />
              <Route path="tree-nav" element={<TreeNavDemo />} />
              <Route path="ide" element={<IdeDemo />} />
              <Route path="code-editor" element={<CodeEditorDemo />} />
            </Route>
          </Routes>
        </Suspense>
      </BrowserRouter>
    </StrictMode>
  );
}`,
  },
  "composer.json": {
    lang: "JavaScript",
    code: `{
  "name": "particle-academy/laravel-catalog-sandbox",
  "type": "project",
  "require": {
    "php": "^8.2",
    "laravel/framework": "^12.0",
    "particle-academy/laravel-catalog": "@dev",
    "particle-academy/laravel-fms": "@dev",
    "wishborn/fancy-flux": "@dev"
  },
  "repositories": [
    { "type": "path", "url": "./packages/laravel-catalog", "options": { "symlink": true } },
    { "type": "path", "url": "./packages/laravel-fms", "options": { "symlink": true } },
    { "type": "path", "url": "./packages/fancy-flux", "options": { "symlink": true } }
  ]
}`,
  },
  "package.json": {
    lang: "JavaScript",
    code: `{
  "private": true,
  "type": "module",
  "scripts": {
    "build": "vite build",
    "dev": "vite",
    "dev:react": "pnpm --filter react-demo dev"
  },
  "dependencies": {
    "@vitejs/plugin-react": "^4.7.0",
    "react": "^19.2.4",
    "react-dom": "^19.2.4",
    "react-router": "^7.13.1"
  }
}`,
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

  // Context menu state — tracks which node was right-clicked
  const [ctxNode, setCtxNode] = useState<TreeNodeData | null>(null);

  const handleNodeContextMenu = useCallback((e: React.MouseEvent, node: TreeNodeData) => {
    setCtxNode(node);
  }, []);

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
      // Switch to another tab when closing the active file
      setSelectedFile((current) => {
        if (current !== tabId) return current;
        return next.length > 0 ? next[next.length - 1].id : "";
      });
      return next;
    });
  }, []);

  const currentContent = fileContents[selectedFile] ?? `// ${selectedFile}\n// File not loaded`;
  const currentLang = FILE_CONTENTS[selectedFile]?.lang ?? "JavaScript";

  const handleCodeChange = useCallback((value: string) => {
    setFileContents((prev) => ({ ...prev, [selectedFile]: value }));
  }, [selectedFile]);

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">IDE</h1>

      <DemoSection
        title="Full IDE Layout"
        description="TreeNav + ContextMenu + Tabs + CodeEditor. Click files to open, right-click for context menu."
        code={`import { TreeNav, ContextMenu } from "@particle-academy/react-fancy";
import { CodeEditor } from "@particle-academy/fancy-code";

const [ctxNode, setCtxNode] = useState(null);

<ContextMenu>
  <ContextMenu.Trigger>
    <TreeNav
      nodes={fileTree}
      selectedId={selectedFile}
      onSelect={handleFileSelect}
      onNodeContextMenu={(e, node) => setCtxNode(node)}
    />
  </ContextMenu.Trigger>
  <ContextMenu.Content>
    {ctxNode?.type === "folder" ? (
      <>
        <ContextMenu.Item onClick={() => copyName(ctxNode)}>
          Copy Folder Name
        </ContextMenu.Item>
        <ContextMenu.Separator />
        <ContextMenu.Item>New File</ContextMenu.Item>
      </>
    ) : (
      <>
        <ContextMenu.Item onClick={() => openFile(ctxNode)}>
          Open File
        </ContextMenu.Item>
        <ContextMenu.Item onClick={() => copyName(ctxNode)}>
          Copy File Name
        </ContextMenu.Item>
        <ContextMenu.Separator />
        <ContextMenu.Item onClick={() => closeTab(ctxNode)}>
          Close Tab
        </ContextMenu.Item>
        <ContextMenu.Separator />
        <ContextMenu.Item danger>Delete File</ContextMenu.Item>
      </>
    )}
  </ContextMenu.Content>
</ContextMenu>`}
      >
        <div
          className="flex overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-700"
          style={{ height: 600 }}
        >
          {/* File tree sidebar */}
          <div className="w-56 shrink-0 overflow-y-auto border-r border-zinc-200 bg-zinc-50 p-2 dark:border-zinc-700 dark:bg-zinc-900/50">
            <p className="mb-1 px-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
              Explorer
            </p>
            <ContextMenu>
              <ContextMenu.Trigger>
                <TreeNav
                  nodes={FILE_TREE}
                  selectedId={selectedFile}
                  onSelect={handleFileSelect}
                  onNodeContextMenu={handleNodeContextMenu}
                  defaultExpandedIds={["packages", "fancy-code", "fc-src", "fc-engine"]}
                  indentSize={12}
                />
              </ContextMenu.Trigger>
              <ContextMenu.Content>
                {ctxNode && (ctxNode.type === "folder" || (ctxNode.children && ctxNode.children.length > 0)) ? (
                  <>
                    <ContextMenu.Item onClick={() => navigator.clipboard.writeText(ctxNode.label)}>
                      Copy Folder Name
                    </ContextMenu.Item>
                    <ContextMenu.Separator />
                    <ContextMenu.Item disabled>New File</ContextMenu.Item>
                    <ContextMenu.Item disabled>New Folder</ContextMenu.Item>
                  </>
                ) : ctxNode ? (
                  <>
                    <ContextMenu.Item onClick={() => handleFileSelect(ctxNode.id, ctxNode)}>
                      Open File
                    </ContextMenu.Item>
                    <ContextMenu.Item onClick={() => navigator.clipboard.writeText(ctxNode.label)}>
                      Copy File Name
                    </ContextMenu.Item>
                    <ContextMenu.Separator />
                    <ContextMenu.Item
                      onClick={() => handleCloseTab(ctxNode.id)}
                      disabled={!openTabs.some((t) => t.id === ctxNode.id)}
                    >
                      Close Tab
                    </ContextMenu.Item>
                    <ContextMenu.Separator />
                    <ContextMenu.Item danger disabled>Delete File</ContextMenu.Item>
                  </>
                ) : null}
              </ContextMenu.Content>
            </ContextMenu>
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
            <div className="flex min-h-0 flex-1 flex-col">
              <CodeEditor
                value={currentContent}
                onChange={handleCodeChange}
                language={currentLang}
                theme="dark"
                className="flex flex-1 flex-col"
              >
                <CodeEditor.Toolbar />
                <CodeEditor.Panel className="flex-1" />
                <CodeEditor.StatusBar />
              </CodeEditor>
            </div>
          </div>
        </div>
      </DemoSection>
    </div>
  );
}
