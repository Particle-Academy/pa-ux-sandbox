<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Support\OgCardRenderer;
use App\Support\PackageRegistry;
use App\Support\Usernames;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use Throwable;

/**
 * Dynamic Open Graph / social-card images: branded 1200×630 PNGs drawn with GD
 * (App\Support\OgCardRenderer), cached to the public disk, and wired into the
 * per-route `og:image` by App\Providers\SeoServiceProvider.
 *
 * GD replaced the old Browsershot/headless-Chrome pipeline deliberately: on
 * Chrome-less hosts that pipeline fell back to the square brand JPEG, so social
 * scrapers (LinkedIn especially) rendered a small square card instead of the
 * large 1200×630 preview. GD needs nothing beyond stock PHP, so the real card
 * renders on every host. The logo fallback remains only as a last-resort guard.
 */
class OgImageController extends Controller
{
    public function default(): Response
    {
        return $this->card('default', [
            'title' => 'Fancy UI',
            'subtitle' => 'Components for the surfaces where humans and agents work together.',
        ]);
    }

    public function package(string $package): Response
    {
        $pkg = PackageRegistry::find($package);
        abort_if($pkg === null, 404);

        return $this->card("packages/{$package}", [
            'eyebrow' => strtoupper((string) ($pkg['language'] ?? '')) ?: null,
            'title' => (string) ($pkg['name'] ?? $package),
            'subtitle' => (string) ($pkg['tagline'] ?? ''),
        ]);
    }

    /**
     * Personalized referral-invite card for /join/{username} shares:
     * inviter name + avatar over the brand canvas.
     */
    public function join(string $username): Response
    {
        $referrer = User::query()
            ->where('username', Usernames::normalize($username))
            ->first();
        abort_if($referrer === null, 404);

        return $this->card('join/'.$referrer->username, [
            'eyebrow' => 'Referral invite',
            'title' => "{$referrer->name} invited you to Fancy UI",
            'subtitle' => 'Join their referral network and build with components made for humans and AI agents working together.',
            'avatarUrl' => $referrer->avatar_url,
        ]);
    }

    /**
     * Render-and-cache. The cache filename carries a hash of the card's inputs
     * (plus the renderer's design version), so a renamed user, retagged package,
     * or redesigned card regenerates instead of serving a stale image.
     *
     * @param  array{eyebrow?: ?string, title: string, subtitle?: ?string, avatarUrl?: ?string}  $spec
     */
    protected function card(string $key, array $spec): Response
    {
        $disk = Storage::disk('public');
        $hash = substr(sha1(OgCardRenderer::VERSION.'|'.json_encode($spec)), 0, 12);
        $path = "og/{$key}-{$hash}.png";

        if (! $disk->exists($path)) {
            try {
                $spec['avatar'] = $this->avatarBytes($spec['avatarUrl'] ?? null);
                $disk->put($path, app(OgCardRenderer::class)->render($spec));
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

    /** Fetch the inviter's avatar; a broken/slow avatar must never break the card. */
    protected function avatarBytes(?string $url): ?string
    {
        if ($url === null || $url === '') {
            return null;
        }

        try {
            $response = Http::timeout(4)->get($url);

            return $response->successful() ? $response->body() : null;
        } catch (Throwable) {
            return null;
        }
    }

    /**
     * Last-resort guard (e.g. GD compiled without FreeType): serve the brand
     * logo rather than a 500 so a page's social preview never hard-breaks.
     */
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
