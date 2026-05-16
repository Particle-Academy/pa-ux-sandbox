<?php

namespace App\Jobs;

use App\Models\ShowcaseSubmission;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Http;

class ScanShowcaseSubmission implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(public ShowcaseSubmission $submission)
    {
    }

    public function handle(): void
    {
        $result = match ($this->submission->kind) {
            'repo' => $this->scanRepo($this->submission->url),
            'website' => $this->scanWebsite($this->submission->url),
            default => ['verified' => false, 'reason' => 'unknown kind'],
        };

        $this->submission->update([
            'status' => $result['verified'] ? 'verified' : 'rejected',
            'scan_result' => $result,
            'scanned_at' => now(),
        ]);
    }

    /** @return array<string, mixed> */
    private function scanRepo(string $url): array
    {
        $owner = $repo = null;
        if (preg_match('!github\.com[/:]([\w.-]+)/([\w.-]+?)(?:\.git)?/?$!i', $url, $m)) {
            [, $owner, $repo] = $m;
        } else {
            return ['verified' => false, 'reason' => 'unrecognized GitHub URL'];
        }

        $token = config('services.github.api_token');
        $matches = [];

        foreach (['package.json', 'composer.json'] as $file) {
            $contents = $this->fetchRepoFile($owner, $repo, $file, $token);
            if ($contents === null) continue;
            $json = json_decode($contents, true);
            if (!is_array($json)) continue;

            foreach (['dependencies', 'devDependencies', 'peerDependencies', 'require', 'require-dev'] as $section) {
                foreach (($json[$section] ?? []) as $name => $_version) {
                    if (str_starts_with($name, '@particle-academy/') || str_starts_with($name, 'particle-academy/') || $name === 'wishborn/fancy-flux') {
                        $matches[$name] = $section;
                    }
                }
            }
        }

        if (empty($matches)) {
            return ['verified' => false, 'reason' => 'no Fancy UI dependencies found in package.json/composer.json'];
        }
        return [
            'verified' => true,
            'kind' => 'repo',
            'owner' => $owner,
            'repo' => $repo,
            'matches' => $matches,
        ];
    }

    private function fetchRepoFile(string $owner, string $repo, string $file, ?string $token): ?string
    {
        $branches = ['main', 'master'];
        foreach ($branches as $branch) {
            $url = "https://raw.githubusercontent.com/{$owner}/{$repo}/{$branch}/{$file}";
            $req = $token ? Http::withToken($token) : Http::withHeaders([]);
            $resp = $req->withHeaders(['accept' => 'text/plain'])->get($url);
            if ($resp->successful() && trim((string) $resp->body()) !== '') {
                return (string) $resp->body();
            }
        }
        return null;
    }

    /** @return array<string, mixed> */
    private function scanWebsite(string $url): array
    {
        try {
            $resp = Http::timeout(15)->get($url);
        } catch (\Throwable $e) {
            return ['verified' => false, 'reason' => 'fetch failed: '.$e->getMessage()];
        }

        if (!$resp->successful()) {
            return ['verified' => false, 'reason' => 'HTTP '.$resp->status()];
        }

        $html = (string) $resp->body();
        $hits = [];

        // Look for `@particle-academy/<pkg>` strings (in script tags, bundled chunks, source maps, JSON-LD).
        if (preg_match_all('/@particle-academy\/([a-z0-9-]+)/i', $html, $m)) {
            foreach (array_unique($m[1]) as $pkg) {
                $hits['@particle-academy/'.$pkg] = 'inline reference';
            }
        }
        if (preg_match_all('/particle-academy\/([a-z0-9-]+)/i', $html, $m)) {
            foreach (array_unique($m[1]) as $pkg) {
                $hits['particle-academy/'.$pkg] = $hits['particle-academy/'.$pkg] ?? 'inline reference';
            }
        }
        // Crude check for fancy-flux usage in compiled Blade output.
        if (str_contains($html, 'data-flux-') || str_contains($html, 'data-fancy-')) {
            $hits['flux/fancy data-attributes'] = 'rendered DOM';
        }

        if (empty($hits)) {
            return ['verified' => false, 'reason' => 'no Fancy UI references in homepage HTML'];
        }
        return [
            'verified' => true,
            'kind' => 'website',
            'matches' => $hits,
        ];
    }
}
