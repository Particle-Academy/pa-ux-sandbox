import type { ReactNode } from "react";

interface DemoSectionProps {
  title: string;
  description?: string;
  children: ReactNode;
}

export function DemoSection({ title, description, children }: DemoSectionProps) {
  return (
    <section className="mb-10">
      <h2 className="mb-1 text-xl font-semibold text-zinc-900 dark:text-zinc-100">{title}</h2>
      {description && (
        <p className="mb-4 text-sm text-zinc-500">{description}</p>
      )}
      <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-700 dark:bg-zinc-900">
        {children}
      </div>
    </section>
  );
}
