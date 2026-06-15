<?php

namespace App\Http\Controllers;

use App\Support\PackageRegistry;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Storage;
use Spatie\Browsershot\Browsershot;
use Throwable;

/**
 * Dynamic Open Graph / social-card images. Renders a branded 1200×630 card
 * (resources/views/og/card.blade.php) to PNG with headless Chrome (the same
 * Browsershot setup the screenshot service uses), caches it to the public disk,
 * and serves it. Wired into per-route `og:image` by App\Providers\SeoServiceProvider.
 *
 * If Chrome isn't available (or generation fails), it falls back to the static
 * brand logo so a page's social preview never breaks.
 */
class OgImageController extends Controller
{
    public function default(): Response
    {
        return $this->card(
            'default',
            null,
            'Fancy UI',
            'Components for the surfaces where humans and agents work together.',
        );
    }

    public function package(string $package): Response
    {
        $pkg = PackageRegistry::find($package);
        abort_if($pkg === null, 404);

        return $this->card(
            "packages/{$package}",
            strtoupper((string) ($pkg['language'] ?? '')) ?: null,
            (string) ($pkg['name'] ?? $package),
            (string) ($pkg['tagline'] ?? ''),
        );
    }

    protected function card(string $key, ?string $eyebrow, string $title, string $subtitle): Response
    {
        // No headless Chrome (CI, locked-down hosts) → serve the brand logo
        // rather than attempting (and timing out on) a screenshot.
        if (! config('screenshots.enabled', true)) {
            return $this->logoFallback();
        }

        $disk = Storage::disk('public');
        $path = "og/{$key}.png";

        if (! $disk->exists($path)) {
            try {
                $disk->put($path, $this->render($eyebrow, $title, $subtitle));
            } catch (Throwable $e) {
                report($e);

                return $this->logoFallback();
            }
        }

        return response((string) $disk->get($path), 200, [
            'Content-Type' => 'image/png',
            'Cache-Control' => 'public, max-age=604800',
        ]);
    }

    protected function render(?string $eyebrow, string $title, string $subtitle): string
    {
        $logo = $this->logoDataUri();
        $html = view('og.card', compact('eyebrow', 'title', 'subtitle', 'logo'))->render();

        $shot = Browsershot::html($html)
            ->windowSize(1200, 630)
            ->setScreenshotType('png')
            ->timeout((int) config('screenshots.timeout', 60));

        foreach (['node_binary' => 'setNodeBinary', 'npm_binary' => 'setNpmBinary', 'chrome_path' => 'setChromePath'] as $cfg => $method) {
            if ($value = config("screenshots.$cfg")) {
                $shot->{$method}($value);
            }
        }
        if (config('screenshots.no_sandbox', false)) {
            $shot->noSandbox();
        }

        return $shot->screenshot();
    }

    protected function logoDataUri(): string
    {
        $file = public_path('showcase-assets/fancy-ui-logo.jpg');

        return is_file($file)
            ? 'data:image/jpeg;base64,'.base64_encode((string) file_get_contents($file))
            : '';
    }

    protected function logoFallback(): Response
    {
        $file = public_path('showcase-assets/fancy-ui-logo.jpg');
        abort_unless(is_file($file), 404);

        return response((string) file_get_contents($file), 200, [
            'Content-Type' => 'image/jpeg',
            'Cache-Control' => 'public, max-age=86400',
        ]);
    }
}
