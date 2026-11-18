<?php

declare(strict_types=1);

namespace App\Http\Requests\Showcase;

use Closure;
use Illuminate\Foundation\Http\FormRequest;

/**
 * The template builder's exact preview: one fancy-template envelope and the
 * data to render it with. Bounded here so the public showcase never renders an
 * unbounded document; fancy-template and fine-print apply their own limits on
 * top (tokens, iterations, output size, render time).
 */
final class TemplatePreviewRequest extends FormRequest
{
    /** The largest template accepted, as JSON. fancy-template's own default is 256 KiB plus the editor key's 256 KiB. */
    public const MAX_TEMPLATE_BYTES = 512 * 1024;

    /** The largest data object accepted, as JSON. */
    public const MAX_DATA_BYTES = 64 * 1024;

    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'template' => ['required', 'array', $this->maxJson(self::MAX_TEMPLATE_BYTES)],
            'data' => ['nullable', 'array', $this->maxJson(self::MAX_DATA_BYTES)],
        ];
    }

    /** @return array<string, mixed> */
    public function template(): array
    {
        return (array) $this->validated('template');
    }

    /** @return array<string, mixed> */
    public function renderData(): array
    {
        return (array) ($this->validated('data') ?? []);
    }

    private function maxJson(int $bytes): Closure
    {
        return static function (string $attribute, mixed $value, Closure $fail) use ($bytes): void {
            $json = json_encode($value);
            if ($json === false || strlen($json) > $bytes) {
                $fail("The {$attribute} is larger than {$bytes} bytes.");
            }
        };
    }
}
