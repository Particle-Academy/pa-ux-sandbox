/**
 * Registry client. Speaks the contract at https://ui.particle.academy/docs/registry.
 * Zero deps — built on Node's global fetch (≥18).
 */

export type RegistryFile = {
  path: string;
  content: string;
  type: string;
  target: string;
};

export type RegistryItem = {
  name: string;
  type: string;
  title: string;
  description: string;
  package: string;
  dependencies: string[];
  registryDependencies: string[];
  files: RegistryFile[];
};

export type RegistrySummary = {
  name: string;
  type: string;
  title: string;
  description: string;
  package: string;
  files: number;
  url: string;
};

export type RegistryIndex = {
  name: string;
  homepage: string;
  items: RegistrySummary[];
};

export class RegistryClient {
  constructor(private readonly base: string) {}

  async index(): Promise<RegistryIndex> {
    const res = await fetch(this.url("/r/index.json"));
    if (!res.ok) {
      throw new Error(`Registry index returned ${res.status}: ${this.url("/r/index.json")}`);
    }
    return (await res.json()) as RegistryIndex;
  }

  async get(name: string): Promise<RegistryItem> {
    const url = this.url(`/r/${encodeURIComponent(name)}.json`);
    const res = await fetch(url);
    if (res.status === 404) {
      throw new Error(`Component "${name}" not found in registry at ${this.base}.`);
    }
    if (!res.ok) {
      throw new Error(`Registry returned ${res.status} for ${name}: ${url}`);
    }
    return (await res.json()) as RegistryItem;
  }

  /**
   * Resolve a list of slugs into a deduped, ordered list of registry items
   * including the full transitive registryDependencies closure. Order is
   * topological — deps first — so writes can apply in array order safely.
   */
  async resolve(slugs: string[]): Promise<RegistryItem[]> {
    const seen = new Map<string, RegistryItem>();
    const ordered: RegistryItem[] = [];

    const visit = async (slug: string) => {
      if (seen.has(slug)) return;
      const item = await this.get(slug);
      seen.set(slug, item);
      for (const dep of item.registryDependencies) {
        await visit(dep);
      }
      ordered.push(item);
    };

    for (const slug of slugs) {
      await visit(slug);
    }

    return ordered;
  }

  private url(path: string): string {
    return this.base.replace(/\/$/, "") + path;
  }
}
