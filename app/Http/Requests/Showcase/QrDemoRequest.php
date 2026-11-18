<?php

declare(strict_types=1);

namespace App\Http\Requests\Showcase;

use Illuminate\Foundation\Http\FormRequest;

/**
 * The server QR demo on /features/documents: one value, bounded well under a
 * QR code's capacity so a request cannot ask for a version-40 symbol.
 */
final class QrDemoRequest extends FormRequest
{
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
            'value' => ['required', 'string', 'max:300'],
            'label' => ['nullable', 'string', 'max:120'],
        ];
    }
}
