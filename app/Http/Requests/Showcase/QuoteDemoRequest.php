<?php

declare(strict_types=1);

namespace App\Http\Requests\Showcase;

use App\Support\Documents\QuoteDemo;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * The quote demo's inputs on /features/documents. Two short strings and three
 * numbers; nothing is stored, so there is nothing to authorize.
 */
final class QuoteDemoRequest extends FormRequest
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
            'company' => ['nullable', 'string', 'max:80'],
            'contact' => ['nullable', 'string', 'max:80'],
            'models' => ['nullable', 'array', 'min:1', 'max:3'],
            'models.*' => ['string', 'distinct', Rule::in(QuoteDemo::MODELS)],
            'seats' => ['nullable', 'integer', 'min:1', 'max:5000'],
            'hours' => ['nullable', 'integer', 'min:1', 'max:160'],
            'months' => ['nullable', 'integer', 'min:1', 'max:24'],
        ];
    }

    /**
     * @return array{company?: string, contact?: string, models?: list<string>, seats?: int, hours?: int, months?: int}
     */
    public function quoteInput(): array
    {
        $valid = $this->validated();
        $input = [];
        foreach (['company', 'contact'] as $key) {
            if (isset($valid[$key])) {
                $input[$key] = trim((string) $valid[$key]);
            }
        }
        if (isset($valid['models'])) {
            $input['models'] = array_values($valid['models']);
        }
        foreach (['seats', 'hours', 'months'] as $key) {
            if (isset($valid[$key])) {
                $input[$key] = (int) $valid[$key];
            }
        }

        return $input;
    }
}
