<?php

declare(strict_types=1);

namespace App\Http\Requests\Showcase;

use Illuminate\Foundation\Http\FormRequest;

/** The "What's new" cursor a signed-in person was last shown. */
final class UpdateSeenNoticesRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    /** @return array<string, array<int, string>> */
    public function rules(): array
    {
        return [
            'seen' => ['required', 'string', 'max:191'],
        ];
    }
}
