<?php

namespace App\Ai\Tools;

use HolySheet\Agent as HolySheet;
use Illuminate\Contracts\JsonSchema\JsonSchema;
use Laravel\Ai\Contracts\Tool;
use Laravel\Ai\Tools\Request;
use Stringable;

class BuildSpreadsheetSchema implements Tool
{
    public function description(): Stringable|string
    {
        return <<<'DESC'
        Build a Holy Sheet workbook schema from headers + row data. The tool runs
        type inference on column headers (e.g. "Revenue" → currency, "Growth"
        with values in [0,1] → percent, "Date" with ISO strings → date) and
        returns a JSON schema you can pass to write_spreadsheet. Use this as
        step 1 whenever the user wants a new workbook generated from data.
        DESC;
    }

    public function handle(Request $request): Stringable|string
    {
        $rows = $this->decodeJson($request['rows'] ?? null);
        if (! is_array($rows)) {
            return json_encode(['error' => 'rows must be a JSON-encoded array of arrays']);
        }

        $headers = null;
        if (! empty($request['headers'])) {
            $headers = is_array($request['headers'])
                ? $request['headers']
                : $this->decodeJson($request['headers']);
        }

        $sheetName = $request['sheet_name'] ?? 'Sheet 1';

        $options = [];
        if (! empty($request['currency'])) {
            $options['currency'] = $request['currency'];
        }
        if (! empty($request['theme'])) {
            $options['theme'] = $request['theme'];
        }
        if (isset($request['frozen_rows'])) {
            $options['frozenRows'] = (int) $request['frozen_rows'];
        }
        if (! empty($request['totals'])) {
            $totals = is_array($request['totals'])
                ? $request['totals']
                : $this->decodeJson($request['totals']);
            if (is_array($totals)) {
                $options['totals'] = $totals;
            }
        }

        $schema = HolySheet::fromArray($rows, $headers, $sheetName, $options);

        return json_encode($schema, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    }

    public function schema(JsonSchema $schema): array
    {
        return [
            'rows' => $schema->string()
                ->description('Row data as a JSON-encoded array of arrays — e.g. `[["NA",4820000,0.124],["EU",3210000,0.081]]`. Each inner array is one row in column order. Numbers must be raw numbers, not strings.')
                ->required(),

            'headers' => $schema->array()
                ->items($schema->string())
                ->description('Column headers. If omitted, the first row of `rows` is treated as the header row.'),

            'sheet_name' => $schema->string()
                ->description('Sheet name (≤31 chars, no /\\?*[]:). Defaults to "Sheet 1".'),

            'currency' => $schema->string()
                ->description('Default ISO-4217 currency code for inferred currency columns. Defaults to USD.'),

            'theme' => $schema->string()
                ->enum(['default', 'business', 'minimal', 'plain'])
                ->description('Optional theme. "default" = bold headers + banded rows, "business" = professional, "minimal" = subtle, "plain" = no styling.'),

            'frozen_rows' => $schema->integer()
                ->min(0)
                ->description('Lock the first N rows on scroll. Use 1 to keep the header visible.'),

            'totals' => $schema->string()
                ->description('Optional totals row as JSON object — e.g. `{"Revenue":"sum","YoY":"avg"}`. Aggregations: sum | avg | count | min | max.'),
        ];
    }

    private function decodeJson(mixed $value): mixed
    {
        if (is_array($value)) {
            return $value;
        }
        if (! is_string($value) || $value === '') {
            return null;
        }
        $decoded = json_decode($value, true);
        return is_array($decoded) ? $decoded : null;
    }
}
