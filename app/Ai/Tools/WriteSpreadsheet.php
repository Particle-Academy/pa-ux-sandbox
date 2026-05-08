<?php

namespace App\Ai\Tools;

use HolySheet\Agent as HolySheet;
use Illuminate\Contracts\JsonSchema\JsonSchema;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Laravel\Ai\Contracts\Tool;
use Laravel\Ai\Tools\Request;
use Stringable;

class WriteSpreadsheet implements Tool
{
    public function description(): Stringable|string
    {
        return <<<'DESC'
        Write a Holy Sheet workbook schema to an .xlsx file in storage and
        return a download URL. The schema must be valid Holy Sheet JSON
        (typically produced by build_spreadsheet_schema).

        Before writing, the schema goes through three checks:
          1. Formula strings ("=…") are promoted to real formula cells.
          2. Schema is validated + auto-repaired (singular `sheet`, `row`,
             stringified numerics, etc.).
          3. Every formula is evaluated; if any produce Excel errors
             (#VALUE!, #REF!, #DIV/0!, #NAME?, #CIRC!), the write is
             aborted and the issues are returned so you can fix and retry.

        Returns on success: { url, filename, sheets, bytes, repairs }.
        Returns on lint failure: { error: "formula_errors", issues: [{sheet, address, formula, error, hint}, ...] }.
        DESC;
    }

    public function handle(Request $request): Stringable|string
    {
        $raw = $request['schema'];
        $schema = is_string($raw) ? json_decode($raw, true) : $raw;

        if (! is_array($schema)) {
            return json_encode(['error' => 'schema must be a JSON object or stringified JSON']);
        }

        $schema = $this->promoteFormulaStrings($schema);

        $repaired = HolySheet::validateAndRepair($schema);
        if (! empty($repaired['errors'])) {
            return json_encode([
                'error' => 'schema_invalid',
                'errors' => $repaired['errors'],
                'repairs' => $repaired['repairs'],
            ]);
        }

        $issues = HolySheet::lint($repaired['schema']);
        if ($issues !== []) {
            return json_encode([
                'error' => 'formula_errors',
                'issues' => $issues,
                'note' => 'The formulas above evaluate to Excel errors. Fix them and call write_spreadsheet again. Common cause: referencing the header row (e.g. B1) instead of the first data row (B2).',
            ]);
        }

        $base = Str::slug($request['filename'] ?? 'workbook') ?: 'workbook';
        $name = $base.'-'.now()->format('Ymd-His').'-'.Str::random(4).'.xlsx';
        $relative = 'ai-sheets/'.$name;
        $absolute = Storage::disk('public')->path($relative);

        @mkdir(dirname($absolute), 0755, true);

        $result = HolySheet::write($repaired['schema'], $absolute);

        return json_encode([
            'url' => Storage::disk('public')->url($relative),
            'filename' => $name,
            'sheets' => $result['sheets'],
            'bytes' => $result['bytes'],
            'repairs' => $repaired['repairs'],
        ]);
    }

    public function schema(JsonSchema $schema): array
    {
        return [
            'schema' => $schema->string()
                ->description('Holy Sheet workbook schema as a JSON string. Pass the exact JSON returned by build_spreadsheet_schema verbatim, or a hand-built schema for multi-sheet workbooks. To create formula cells, write the formula as a plain string starting with "=" (e.g. "=SUM(B2:B5)" or "=C10*D10") — they are auto-promoted to real formulas.')
                ->required(),

            'filename' => $schema->string()
                ->description('Optional filename hint (without extension). Slugged + suffixed with timestamp + random tag.'),
        ];
    }

    /**
     * Walk the schema and convert any string cell value beginning with "=" into
     * a proper formula cell. Lets the agent write `"=C10*D10"` naturally
     * instead of `{formula: "C10*D10"}` — Holy Sheet's writer would otherwise
     * escape these with a leading apostrophe.
     */
    private function promoteFormulaStrings(array $schema): array
    {
        if (! isset($schema['sheets']) || ! is_array($schema['sheets'])) {
            return $schema;
        }

        foreach ($schema['sheets'] as $i => $sheet) {
            // Row-list mode: rows[][]
            if (isset($sheet['rows']) && is_array($sheet['rows'])) {
                foreach ($sheet['rows'] as $r => $row) {
                    if (! is_array($row)) {
                        continue;
                    }
                    foreach ($row as $c => $cell) {
                        $schema['sheets'][$i]['rows'][$r][$c] = $this->promoteCell($cell);
                    }
                }
            }

            // Sparse mode: cells["A1"]
            if (isset($sheet['cells']) && is_array($sheet['cells'])) {
                foreach ($sheet['cells'] as $addr => $cell) {
                    $schema['sheets'][$i]['cells'][$addr] = $this->promoteCell($cell);
                }
            }
        }

        return $schema;
    }

    private function promoteCell(mixed $cell): mixed
    {
        if (is_string($cell) && str_starts_with($cell, '=') && strlen($cell) > 1) {
            return ['formula' => substr($cell, 1)];
        }
        if (is_array($cell) && isset($cell['value']) && is_string($cell['value'])
            && str_starts_with($cell['value'], '=') && strlen($cell['value']) > 1
            && ! isset($cell['formula'])) {
            $cell['formula'] = substr($cell['value'], 1);
            unset($cell['value']);
        }
        return $cell;
    }
}
