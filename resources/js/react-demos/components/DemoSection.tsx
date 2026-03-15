import { type ReactNode, useState } from "react";
import { CodeBlock } from "./CodeBlock";

interface DemoSectionProps {
  title: string;
  description?: string;
  code?: string;
  children: ReactNode;
}

export function DemoSection({ title, description, code, children }: DemoSectionProps) {
  const [showCode, setShowCode] = useState(false);

  return (
    <section className="mb-10">
      <div className="mb-1 flex items-center gap-3">
        <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">{title}</h2>
        {code && (
          <button
            onClick={() => setShowCode((v) => !v)}
            className="rounded-md bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-600 transition-colors hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700"
          >
            {showCode ? "Hide Code" : "Show Code"}
          </button>
        )}
      </div>
      {description && (
        <p className="mb-4 text-sm text-zinc-500">{description}</p>
      )}
      <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-700 dark:bg-zinc-900">
        {children}
      </div>
      {code && showCode && (
        <div className="mt-2">
          <CodeBlock code={code} />
        </div>
      )}
    </section>
  );
}
