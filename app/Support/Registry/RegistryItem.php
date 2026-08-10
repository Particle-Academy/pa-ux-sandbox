<?php

namespace App\Support\Registry;

/**
 * One installable component, in the shadcn-compatible registry-item.json
 * schema. Serializable to JSON for the /r/{slug}.json endpoint.
 *
 * @phpstan-type RegistryFile array{path: string, content: string, type: string, target: string}
 */
class RegistryItem
{
    /**
     * @param  list<RegistryFile>  $files
     * @param  list<string>  $dependencies  npm package names
     * @param  list<string>  $registryDependencies  other registry slugs
     */
    public function __construct(
        public readonly string $name,
        public readonly string $title,
        public readonly string $description,
        public readonly string $package,
        public readonly array $files,
        public readonly array $dependencies = [],
        public readonly array $registryDependencies = [],
        public readonly string $type = 'registry:ui',
        /**
         * First kit version this item exists in. Null = it has always been here.
         */
        public readonly ?string $since = null,
        /**
         * Last kit version this item exists in. Null = still current.
         *
         * This is what a bare `since` cannot express, and the 0.5 cut will need
         * it: without `until`, an item removed from the kit keeps being served
         * to consumers of the version that removed it — the CLI vendors source
         * for something that is gone, and an agent is told about an API it
         * cannot call.
         */
        public readonly ?string $until = null,
    ) {}

    /**
     * Clone this item with its kit lifecycle stamped on.
     *
     * Authored in {@see RegistryLifecycle}, not at the construction sites —
     * "when did this arrive?" is a fact about the kit's history rather than
     * about how the item happens to be built.
     */
    public function withLifecycle(?string $since, ?string $until): self
    {
        return new self(
            name: $this->name,
            title: $this->title,
            description: $this->description,
            package: $this->package,
            files: $this->files,
            dependencies: $this->dependencies,
            registryDependencies: $this->registryDependencies,
            type: $this->type,
            since: $since,
            until: $until,
        );
    }

    /** Clone this item with a different registry name (used to de-collide). */
    public function withName(string $name): self
    {
        return new self(
            name: $name,
            title: $this->title,
            description: $this->description,
            package: $this->package,
            files: $this->files,
            dependencies: $this->dependencies,
            registryDependencies: $this->registryDependencies,
            type: $this->type,
            since: $this->since,
            until: $this->until,
        );
    }

    /** @return array<string, mixed> */
    /**
     * Rebuild an item from its {@see toArray()} payload — used to load the
     * precompiled registry artifact in production (where the sibling package
     * source isn't on disk).
     *
     * @param  array<string, mixed>  $data
     */
    public static function fromArray(array $data): self
    {
        return new self(
            name: (string) ($data['name'] ?? ''),
            title: (string) ($data['title'] ?? ''),
            description: (string) ($data['description'] ?? ''),
            package: (string) ($data['package'] ?? ''),
            files: $data['files'] ?? [],
            dependencies: $data['dependencies'] ?? [],
            registryDependencies: $data['registryDependencies'] ?? [],
            type: (string) ($data['type'] ?? 'registry:ui'),
            since: isset($data['since']) ? (string) $data['since'] : null,
            until: isset($data['until']) ? (string) $data['until'] : null,
        );
    }

    /**
     * Whether this item existed in kit version `$version`.
     *
     * Compared with {@see version_compare} rather than string equality so that
     * "0.10" sorts after "0.9" — the point at which a lexical comparison would
     * start quietly excluding everything.
     */
    public function existsIn(string $version): bool
    {
        if ($this->since !== null && version_compare($version, $this->since, '<')) {
            return false;
        }

        return ! ($this->until !== null && version_compare($version, $this->until, '>'));
    }

    public function toArray(): array
    {
        return [
            '$schema' => 'https://ui.particle.academy/schema/registry-item.json',
            'name' => $this->name,
            'type' => $this->type,
            'title' => $this->title,
            'description' => $this->description,
            'package' => $this->package,
            'dependencies' => $this->dependencies,
            'registryDependencies' => $this->registryDependencies,
            'files' => $this->files,
            ...$this->versionFields(),
        ];
    }

    /** @return array<string, mixed> Lightweight summary for the index. */
    public function toSummary(): array
    {
        return [
            'name' => $this->name,
            'type' => $this->type,
            'title' => $this->title,
            'description' => $this->description,
            'package' => $this->package,
            'files' => count($this->files),
            'url' => "/r/{$this->name}.json",
            ...$this->versionFields(),
        ];
    }

    /**
     * Emitted only when set, so the common case — an item present in every
     * version — stays exactly the payload it was before versioning existed.
     *
     * @return array<string, string>
     */
    private function versionFields(): array
    {
        return array_filter(['since' => $this->since, 'until' => $this->until], fn (?string $v): bool => $v !== null);
    }
}
