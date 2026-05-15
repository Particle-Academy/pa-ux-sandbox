/**
 * Each dream's USAGE example — a short snippet showing how a consumer
 * would import and use the component in their own project. This is the
 * "what does it cost me to adopt this?" view, *not* the demo's internal
 * implementation. Fancy UI's value prop is that adoption is one import
 * + a few props away — these snippets prove it.
 */
const modules = import.meta.glob("./pages/*Demo.tsx", { eager: true }) as Record<
  string,
  { USAGE?: string }
>;

function pascal(slug: string): string {
  return slug
    .split("-")
    .map((p) => (p[0]?.toUpperCase() ?? "") + p.slice(1))
    .join("");
}

export function getUsage(slug: string): string | null {
  const key = `./pages/${pascal(slug)}Demo.tsx`;
  return modules[key]?.USAGE ?? null;
}
