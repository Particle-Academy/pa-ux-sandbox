import { Link } from "react-router";
import { reactDemos, type DemoEntry } from "../data/demos";

function DemoCard({ demo }: { demo: DemoEntry }) {
  return (
    <Link
      to={`/${demo.slug}`}
      className="rounded-xl border border-zinc-200 p-4 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800/50"
    >
      <h3 className="font-medium text-zinc-900 dark:text-zinc-100">{demo.name}</h3>
      <p className="mt-1 text-sm text-zinc-500">{demo.description}</p>
    </Link>
  );
}

export function Home() {
  return (
    <div>
      <h1 className="mb-2 text-3xl font-bold text-zinc-900 dark:text-zinc-100">@particle-academy/react-fancy</h1>
      <p className="mb-6 text-zinc-500">
        A Tailwind-first React component library. Browse the components using
        the sidebar.
      </p>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        {reactDemos.map((demo) => (
          <DemoCard key={demo.slug} demo={demo} />
        ))}
      </div>
    </div>
  );
}
