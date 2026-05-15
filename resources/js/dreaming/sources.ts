/**
 * Raw source code for every demo page, keyed by slug. Powered by Vite's
 * `?raw` query so the demo file itself becomes the documentation —
 * what you see is what's running.
 */
const modules = import.meta.glob("./pages/*Demo.tsx", {
  query: "?raw",
  import: "default",
  eager: true,
}) as Record<string, string>;

function pascal(slug: string): string {
  return slug
    .split("-")
    .map((p) => (p[0]?.toUpperCase() ?? "") + p.slice(1))
    .join("");
}

export function getSource(slug: string): string | null {
  const key = `./pages/${pascal(slug)}Demo.tsx`;
  return modules[key] ?? null;
}
