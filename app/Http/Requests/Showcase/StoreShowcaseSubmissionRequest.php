<?php

namespace App\Http\Requests\Showcase;

use App\Services\Showcase\FancyPixelDetector;
use App\Services\Showcase\SafeUrlFetcher;
use App\Services\Showcase\UnsafeUrlException;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

/**
 * Validates a showcase submission AND, for `website` submissions, gates it on
 * the Fancy Pixel actually being present: we fetch the URL server-side
 * (SSRF-safe) and run the shared FancyPixelDetector before the submission is
 * allowed to be created. If the pixel is missing the submission is rejected
 * with an actionable error keyed to the `url` field.
 *
 * The fetched HTML and detection result are stashed so the controller can
 * pre-seed the submission's scan_result without re-fetching.
 */
class StoreShowcaseSubmissionRequest extends FormRequest
{
    /** Detection outcome for a website submission, cached for the controller. */
    public ?bool $pixelFound = null;

    /** The HTML fetched during the pixel gate, cached for the controller. */
    public ?string $fetchedHtml = null;

    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'kind' => 'required|in:website,repo',
            'url' => 'required|url|max:255',
            'title' => 'nullable|string|max:120',
            'description' => 'nullable|string|max:600',
        ];
    }

    /**
     * After the base rules pass, fetch a `website` URL and require the pixel.
     * Repo submissions skip this gate — they're verified against package
     * manifests by the background scanner instead.
     */
    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            if ($validator->errors()->isNotEmpty()) {
                return;
            }

            if ($this->input('kind') !== 'website') {
                return;
            }

            $url = (string) $this->input('url');
            $host = parse_url($url, PHP_URL_HOST) ?: 'that site';

            try {
                $response = app(SafeUrlFetcher::class)->fetch($url);
            } catch (UnsafeUrlException $e) {
                $validator->errors()->add('url', $e->getMessage());

                return;
            } catch (\Throwable $e) {
                $validator->errors()->add(
                    'url',
                    "We couldn't reach {$host}. Make sure the site is publicly reachable and try again."
                );

                return;
            }

            if (! $response->successful()) {
                $validator->errors()->add(
                    'url',
                    "We couldn't reach {$host} (HTTP {$response->status()}). Make sure the site is publicly reachable and try again."
                );

                return;
            }

            $this->fetchedHtml = (string) $response->body();
            $this->pixelFound = app(FancyPixelDetector::class)->detect($this->fetchedHtml);

            if (! $this->pixelFound) {
                $validator->errors()->add(
                    'url',
                    "We couldn't find the Fancy Pixel on {$host}. Add the embed snippet to your site and try again."
                );
            }
        });
    }
}
