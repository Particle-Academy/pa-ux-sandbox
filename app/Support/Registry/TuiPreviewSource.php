<?php

namespace App\Support\Registry;

use Illuminate\Support\Facades\File;

/**
 * fancy-tui's captured preview frames.
 *
 * `fancy-tui` renders to a terminal, so a preview cannot be a React component —
 * it is ANSI. The package already solves this: `npm run showcase` renders every
 * component through real Ink and captures the frame to
 * `showcase/previews.json`. That harness is the reason these are trustworthy —
 * it is what caught the string-slot bug — and it is why previews here are
 * **captured, never hand-authored ANSI art**. Hand-drawn frames drift from the
 * component the moment either changes, and nothing notices.
 *
 * Sourced exactly like {@see ReadmeSource}: the package's own repo first, then
 * a compiled artifact for production, which deploys only this app. Reading
 * `node_modules` instead would tie the docs to whether the showcase happens to
 * install fancy-tui — the coupling that left half the suite undocumented.
 */
class TuiPreviewSource
{
    private const SLUG = 'fancy-tui';

    /** Where the harness writes its captures inside the package repo. */
    private const IN_REPO = 'showcase/previews.json';

    /** @var array<string,array<string,mixed>>|null */
    private ?array $frames = null;

    /**
     * Captured frames keyed by component slug.
     *
     * @return array<string, array{frame:string, columns:int, name:string, group:string}>
     */
    public function all(): array
    {
        if ($this->frames !== null) {
            return $this->frames;
        }

        return $this->frames = $this->fromRepo() ?? $this->fromCompiled();
    }

    /** One component's captured frame, or null when the harness never rendered it. */
    public function forComponent(string $slug): ?array
    {
        return $this->all()[$slug] ?? null;
    }

    /**
     * Read the harness output straight out of the package repo.
     *
     * @return array<string, array<string, mixed>>|null
     */
    public function fromRepo(): ?array
    {
        $dir = (new ReadmeSource)->repoDir(self::SLUG);
        if ($dir === null || ! File::exists("{$dir}/".self::IN_REPO)) {
            return null;
        }

        return $this->index((array) (json_decode(File::get("{$dir}/".self::IN_REPO), true)['components'] ?? []));
    }

    /** @return array<string, array<string, mixed>> */
    private function fromCompiled(): array
    {
        $path = self::compiledPath();

        return File::exists($path)
            ? (array) (json_decode(File::get($path), true)['components'] ?? [])
            : [];
    }

    public static function compiledPath(): string
    {
        return resource_path('registry/tui-previews.json');
    }

    /**
     * Key the harness's list by slug, keeping only what a tile renders.
     *
     * `source` is dropped deliberately: it is the JSX that produced the frame,
     * useful on a detail page and pure weight in a listing payload repeated 52
     * times.
     *
     * @param  list<array<string,mixed>>  $components
     * @return array<string, array<string, mixed>>
     */
    public function index(array $components): array
    {
        $out = [];
        foreach ($components as $component) {
            $slug = (string) ($component['slug'] ?? '');
            if ($slug === '' || ! is_string($component['frame'] ?? null)) {
                continue;
            }

            $out[$slug] = [
                'frame' => $component['frame'],
                'columns' => (int) ($component['columns'] ?? 80),
                'name' => (string) ($component['name'] ?? $slug),
                'group' => (string) ($component['group'] ?? ''),
            ];
        }

        ksort($out);

        return $out;
    }
}
