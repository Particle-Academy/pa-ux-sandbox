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
    ) {}

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
        );
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
        ];
    }
}
