import { useState } from "react";
import { CodeEditor } from "@particle-academy/fancy-code";

interface CodeBlockProps {
  code: string;
  /** Language alias passed to CodeEditor — defaults to tsx. */
  language?: string;
}

/**
 * Shared code block used across the react-demos pages. Wraps fancy-code's
 * CodeEditor in read-only mode + a copy button. Originally a raw <pre>;
 * the swap gives us syntax highlighting and line numbers for free.
 */
export function CodeBlock({ code, language = "tsx" }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative overflow-hidden rounded-lg">
      <button
        onClick={handleCopy}
        className="absolute right-3 top-3 z-10 rounded-md bg-zinc-800 px-2 py-1 text-xs text-zinc-300 transition-colors hover:bg-zinc-700"
      >
        {copied ? "Copied!" : "Copy"}
      </button>
      <CodeEditor value={code} language={language} theme="dark" readOnly minHeight={80} maxHeight={500}>
        <CodeEditor.Panel />
      </CodeEditor>
    </div>
  );
}
