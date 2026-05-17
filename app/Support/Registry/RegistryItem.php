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
