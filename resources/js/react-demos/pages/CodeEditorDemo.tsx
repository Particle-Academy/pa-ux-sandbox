import { useState } from "react";
import { CodeEditor, useCodeEditor } from "@particle-academy/fancy-code";
import { Action } from "@particle-academy/react-fancy";
import { DemoSection } from "../components/DemoSection";

// ---------------------------------------------------------------------------
// Sample code from this monorepo
// ---------------------------------------------------------------------------

const SAMPLE_PHP = `<?php

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
}`;

const SAMPLE_TS = `import { useMemo, useRef, useState, useCallback } from "react";
import { useControllableState } from "@particle-academy/react-fancy";

export interface CodeEditorProps {
  children: ReactNode;
  className?: string;
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  language?: string;
  theme?: string;
  readOnly?: boolean;
  lineNumbers?: boolean;
  wordWrap?: boolean;
  tabSize?: number;
  placeholder?: string;
  minHeight?: number;
  maxHeight?: number;
}

export function useCodeEditor(): CodeEditorContextValue {
  const ctx = useContext(CodeEditorContext);
  if (!ctx) {
    throw new Error(
      "useCodeEditor must be used within a <CodeEditor> component"
    );
  }
  return ctx;
}`;

const SAMPLE_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Laravel Catalog - UX Demos</title>
    @viteReactRefresh
    @vite(['resources/css/react-demos.css', 'resources/js/react-demos.tsx'])
</head>
<body class="min-h-screen bg-zinc-50 text-zinc-900 antialiased dark:bg-zinc-950 dark:text-zinc-100">
    <div id="react-demos"></div>
</body>
</html>`;

const SAMPLE_JS = `import { defineConfig } from 'vite';
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
            '@particle-academy/react-echarts':
                path.resolve(__dirname, 'packages/react-echarts/src'),
            '@particle-academy/fancy-code':
                path.resolve(__dirname, 'packages/fancy-code/src'),
        },
    },
});`;

// ---------------------------------------------------------------------------
// Custom toolbar demo
// ---------------------------------------------------------------------------

function RunButton() {
  const { getValue } = useCodeEditor();
  const [output, setOutput] = useState<string | null>(null);

  const handleRun = () => {
    const code = getValue();
    const lines = code.split("\n").length;
    const chars = code.length;
    setOutput(`Parsed ${lines} lines, ${chars} characters`);
    setTimeout(() => setOutput(null), 2000);
  };

  return (
    <div className="flex items-center gap-1.5">
      <Action size="xs" onClick={handleRun} color="green">
        Run
      </Action>
      {output && (
        <span className="text-[11px] text-green-600 dark:text-green-400">{output}</span>
      )}
    </div>
  );
}

function FormatButton() {
  const { getValue, setValue } = useCodeEditor();

  const handleFormat = () => {
    const code = getValue();
    // Simple indent normalization as a demo
    const formatted = code
      .split("\n")
      .map((line) => line.trimEnd())
      .join("\n");
    setValue(formatted);
  };

  return (
    <Action size="xs" onClick={handleFormat}>
      Format
    </Action>
  );
}

const editorClass = "rounded-xl border border-zinc-200 dark:border-zinc-700";

// ---------------------------------------------------------------------------
// Demo page
// ---------------------------------------------------------------------------

export function CodeEditorDemo() {
  const [basicValue, setBasicValue] = useState(SAMPLE_JS);
  const [langValue, setLangValue] = useState(SAMPLE_TS);
  const [selectedLang, setSelectedLang] = useState("TypeScript");

  const langSamples: Record<string, string> = {
    JavaScript: SAMPLE_JS,
    TypeScript: SAMPLE_TS,
    HTML: SAMPLE_HTML,
    PHP: SAMPLE_PHP,
  };

  const handleLangSwitch = (lang: string) => {
    setSelectedLang(lang);
    setLangValue(langSamples[lang] ?? "");
  };

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">CodeEditor</h1>

      <DemoSection
        title="Basic Editor"
        description="Editable code with syntax highlighting, line numbers, and the default toolbar. Showing the monorepo's vite.config.js."
        code={`<CodeEditor value={code} onChange={setCode} language="javascript">
  <CodeEditor.Toolbar />
  <CodeEditor.Panel />
  <CodeEditor.StatusBar />
</CodeEditor>`}
      >
        <div className="max-w-3xl">
          <CodeEditor value={basicValue} onChange={setBasicValue} language="JavaScript" maxHeight={350} className={editorClass}>
            <CodeEditor.Toolbar />
            <CodeEditor.Panel />
            <CodeEditor.StatusBar />
          </CodeEditor>
        </div>
      </DemoSection>

      <DemoSection
        title="Read-Only Code Display"
        description="Read-only mode for displaying code. Showing the CatalogManager PHP class from the laravel-catalog package."
        code={`<CodeEditor value={phpCode} language="php" readOnly>
  <CodeEditor.Panel />
</CodeEditor>`}
      >
        <div className="max-w-3xl">
          <CodeEditor value={SAMPLE_PHP} language="PHP" readOnly maxHeight={300} className={editorClass}>
            <CodeEditor.Panel />
          </CodeEditor>
        </div>
      </DemoSection>

      <DemoSection
        title="Custom Toolbar"
        description="Custom toolbar buttons via useCodeEditor() hook — Run parses the code, Format trims trailing whitespace."
        code={`function RunButton() {
  const { getValue } = useCodeEditor();
  return <Action onClick={() => run(getValue())}>Run</Action>;
}

<CodeEditor value={code} onChange={setCode} language="typescript">
  <CodeEditor.Toolbar>
    <RunButton />
    <CodeEditor.Toolbar.Separator />
    <FormatButton />
  </CodeEditor.Toolbar>
  <CodeEditor.Panel />
  <CodeEditor.StatusBar />
</CodeEditor>`}
      >
        <div className="max-w-3xl">
          <CodeEditor value={langValue} onChange={setLangValue} language="TypeScript" maxHeight={300} className={editorClass}>
            <CodeEditor.Toolbar>
              <RunButton />
              <CodeEditor.Toolbar.Separator />
              <FormatButton />
            </CodeEditor.Toolbar>
            <CodeEditor.Panel />
            <CodeEditor.StatusBar />
          </CodeEditor>
        </div>
      </DemoSection>

      <DemoSection
        title="Language Switching"
        description="Switch between the 4 built-in languages. Each shows a real file from this monorepo."
        code={`<CodeEditor
  value={code}
  language={selectedLang}
  onLanguageChange={handleLangSwitch}
>
  <CodeEditor.Toolbar />
  <CodeEditor.Panel />
  <CodeEditor.StatusBar />
</CodeEditor>`}
      >
        <div className="max-w-3xl">
          <div className="mb-3 flex gap-2">
            {Object.keys(langSamples).map((lang) => (
              <button
                key={lang}
                onClick={() => handleLangSwitch(lang)}
                className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                  selectedLang === lang
                    ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                    : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700"
                }`}
              >
                {lang}
              </button>
            ))}
          </div>
          <CodeEditor
            value={langValue}
            onChange={setLangValue}
            language={selectedLang}
            onLanguageChange={handleLangSwitch}
            maxHeight={300}
            className={editorClass}
          >
            <CodeEditor.Toolbar />
            <CodeEditor.Panel />
            <CodeEditor.StatusBar />
          </CodeEditor>
        </div>
      </DemoSection>

      <DemoSection
        title="Theme Showcase"
        description="Built-in light and dark color schemes side by side."
        code={`<CodeEditor value={code} language="typescript" theme="light">
  <CodeEditor.Panel />
</CodeEditor>

<CodeEditor value={code} language="typescript" theme="dark">
  <CodeEditor.Panel />
</CodeEditor>`}
      >
        <div className="grid max-w-5xl grid-cols-2 gap-4">
          <div>
            <p className="mb-2 text-xs font-medium text-zinc-500">theme=&quot;light&quot;</p>
            <CodeEditor value={SAMPLE_TS.slice(0, 400)} language="TypeScript" theme="light" readOnly className={editorClass}>
              <CodeEditor.Panel />
            </CodeEditor>
          </div>
          <div>
            <p className="mb-2 text-xs font-medium text-zinc-500">theme=&quot;dark&quot;</p>
            <CodeEditor value={SAMPLE_TS.slice(0, 400)} language="TypeScript" theme="dark" readOnly className={editorClass}>
              <CodeEditor.Panel />
            </CodeEditor>
          </div>
        </div>
      </DemoSection>

      <DemoSection
        title="Word Wrap & Configuration"
        description="Toggle word wrap, line numbers, and configure tab size. Long lines wrap instead of scrolling."
        code={`<CodeEditor
  value={code}
  language="html"
  wordWrap
  tabSize={4}
>
  <CodeEditor.Toolbar />
  <CodeEditor.Panel />
  <CodeEditor.StatusBar />
</CodeEditor>`}
      >
        <div className="max-w-3xl">
          <CodeEditor value={SAMPLE_HTML} language="HTML" wordWrap tabSize={4} maxHeight={300} className={editorClass}>
            <CodeEditor.Toolbar />
            <CodeEditor.Panel />
            <CodeEditor.StatusBar />
          </CodeEditor>
        </div>
      </DemoSection>

      <DemoSection
        title="Minimal (No Toolbar, No StatusBar)"
        description="Just the editing surface — useful for inline code snippets."
        code={`<CodeEditor value={code} language="javascript" readOnly lineNumbers={false}>
  <CodeEditor.Panel />
</CodeEditor>`}
      >
        <div className="max-w-lg">
          <CodeEditor
            value={`const greeting = "Hello, world!";\nconsole.log(greeting);`}
            language="JavaScript"
            readOnly
            lineNumbers={false}
            className={editorClass}
          >
            <CodeEditor.Panel />
          </CodeEditor>
        </div>
      </DemoSection>
    </div>
  );
}
