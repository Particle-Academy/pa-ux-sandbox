<?php

namespace App\Support\Registry;

use App\Support\PackageRegistry;
use Illuminate\Support\Facades\File;

/**
 * A package's README, sourced from the package itself rather than from whatever
 * the showcase happens to install.
 *
 * ## The bug this exists to fix
 *
 * READMEs used to be read out of `node_modules/<npm>` and `vendor/<composer>`.
 * That quietly made a package's documentation a **side effect of the showcase's
 * own dependency list**: `fancy-git-js`, the eight `fancy-git-*` adapters,
 * `fancy-mlm-js`, `fancy-x-files-js`, `holy-sheet-js` and `fancy-term-host` are
 * all real, published packages the sandbox does not install — so every one of
 * them had no documentation at all.
 *
 * Worse, it compounded: a member with no components AND no README does not keep
 * its own page, so those packages **301'd to their family page**, taking
 * hand-written `PackageContext` entries down with them. `fancy-term-host` and
 * `holy-sheet-js` both had real Why/What/How prose that nothing rendered.
 *
 * ## Where it reads instead
 *
 * The same two-mode arrangement {@see RegistrySource} uses, for the same reason:
 *
 *  1. **Live** — the package's own repo, a sibling of `px-ui-sandbox` in the
 *     `.agi` workspace. Every package has one, installed or not.
 *  2. **Compiled** — `resources/registry/readmes.json`, built by
 *     `readmes:build` and committed, because production deploys only this app.
 *  3. **Installed** — `node_modules` / `vendor`, kept last as a fallback for a
 *     checkout with neither.
 *
 * Docs stop depending on what the showcase installs, which was never a fact
 * about the package being documented.
 */
class ReadmeSource
{
    private const FILENAMES = ['README.md', 'readme.md', 'README.markdown'];

    /** @var array<string,string|null> */
    private array $memo = [];

    /**
     * The raw markdown for a package, or null when it genuinely has none.
     *
     * @param  array<string,mixed>  $pkg  a PackageRegistry record
     */
    public function markdownFor(array $pkg): ?string
    {
        $slug = (string) ($pkg['slug'] ?? '');
        if ($slug === '') {
            return null;
        }
        if (array_key_exists($slug, $this->memo)) {
            return $this->memo[$slug];
        }

        $markdown = $this->fromRepo($slug)
            ?? $this->fromCompiled($slug)
            ?? $this->fromInstalled($pkg);

        return $this->memo[$slug] = ($markdown !== null && trim($markdown) !== '') ? $markdown : null;
    }

    /** Read from the package's own repo — the authoritative copy. */
    public function fromRepo(string $slug): ?string
    {
        $dir = $this->repoDir($slug);
        if ($dir === null) {
            return null;
        }

        foreach (self::FILENAMES as $name) {
            if (File::exists("{$dir}/{$name}")) {
                return File::get("{$dir}/{$name}");
            }
        }

        return null;
    }

    /**
     * Resolve a package's repo on disk.
     *
     * The `.agi` envelope keeps every repo under `repos/`, so px-ui-sandbox's
     * siblings are its peers there; the flat and legacy nested layouts are kept
     * as fallbacks so this works in any checkout.
     */
    public function repoDir(string $slug): ?string
    {
        foreach ([dirname(base_path()).'/'.$slug, base_path('packages/'.$slug)] as $candidate) {
            if (is_dir($candidate)) {
                return $candidate;
            }
        }

        return null;
    }

    /** Whether repos are on disk — i.e. whether `readmes:build` can run here. */
    public function liveSourceAvailable(): bool
    {
        foreach ($this->everyPackage() as $pkg) {
            if (is_string($pkg['slug'] ?? null) && $this->repoDir($pkg['slug']) !== null) {
                return true;
            }
        }

        return false;
    }

    /**
     * Every package the site knows about, companions included.
     *
     * Companions are the half of the suite most affected by the old sourcing —
     * the `-js` twins and provider adapters the showcase does not install.
     *
     * @return list<array<string,mixed>>
     */
    public function everyPackage(): array
    {
        return array_merge(
            PackageRegistry::all(),
            PackageRegistry::companions(),
        );
    }

    /** @return array<string,string> slug => markdown */
    public function compiled(): array
    {
        static $cache = null;
        if ($cache !== null) {
            return $cache;
        }

        $path = self::compiledPath();

        return $cache = File::exists($path)
            ? (array) (json_decode(File::get($path), true)['readmes'] ?? [])
            : [];
    }

    public static function compiledPath(): string
    {
        return resource_path('registry/readmes.json');
    }

    private function fromCompiled(string $slug): ?string
    {
        $value = $this->compiled()[$slug] ?? null;

        return is_string($value) ? $value : null;
    }

    /**
     * The old path, kept last.
     *
     * Harmless as a fallback, and it covers a checkout with no sibling repos and
     * no compiled artifact — but it must never be the FIRST answer, or the bug
     * above comes straight back for anything the showcase does not install.
     *
     * @param  array<string,mixed>  $pkg
     */
    private function fromInstalled(array $pkg): ?string
    {
        $dirs = array_filter([
            ! empty($pkg['npm']) ? base_path('node_modules/'.$pkg['npm']) : null,
            ! empty($pkg['composer']) ? base_path('vendor/'.$pkg['composer']) : null,
        ]);

        foreach ($dirs as $dir) {
            foreach (self::FILENAMES as $name) {
                if (File::exists("{$dir}/{$name}")) {
                    return File::get("{$dir}/{$name}");
                }
            }
        }

        return null;
    }
}
