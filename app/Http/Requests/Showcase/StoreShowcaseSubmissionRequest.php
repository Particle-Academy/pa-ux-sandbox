<?php

namespace App\Http\Requests\Showcase;

use App\Models\ShowcaseSubmission;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * Validates a showcase registration. The GA-style model: registering NEVER
 * blocks. We accept any well-formed submission, create a PENDING row, and let
 * the async ScanShowcaseSubmission job flip it to verified once the Fancy
 * Pixel is detected. There is no submit-time pixel fetch or gate here — the
 * URL is only fetched later, by the background scanner.
 */
class StoreShowcaseSubmissionRequest extends FormRequest
{
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
            'url' => 'required|url:http,https|max:255',
            'title' => 'nullable|string|max:120',
            'description' => 'nullable|string|max:600',
            'category' => ['nullable', Rule::in(array_keys(ShowcaseSubmission::CATEGORIES))],
            'nsfw_declared' => 'boolean',
            'made_for_children' => 'boolean',
            'style' => 'nullable|in:badge,mark,beacon',
            'mode' => 'nullable|in:placed,floating',
        ];
    }
}
