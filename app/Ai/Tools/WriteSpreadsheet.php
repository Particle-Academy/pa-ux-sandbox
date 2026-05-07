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
        (typically produced by build_spreadsheet_schema). Before writing, the
        schema is run through validate_and_repair, so high-confidence typos
        (singular `sheet`, `row`, stringified numerics, etc.) are auto-fixed.
        Returns a JSON object: { url, filename, sheets, bytes, repairs }.
        DESC;
    }

    public function handle(Request $request): Stringable|string
    {
        $raw = $request['schema'];
        $schema = is_string($raw) ? json_decode($raw, true) : $raw;

        if (! is_array($schema)) {
            return json_encode(['error' => 'schema must be a JSON object or stringified JSON']);
        }

        $repaired = HolySheet::validateAndRepair($schema);
        if (! empty($repaired['errors'])) {
            return json_encode([
                'error' => 'schema_invalid',
                'errors' => $repaired['errors'],
                'repairs' => $repaired['repairs'],
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
            'schema' => $schema->any()
                ->description('Holy Sheet workbook schema. Pass the JSON object returned by build_spreadsheet_schema, or a stringified JSON object.')
                ->required(),

            'filename' => $schema->string()
                ->description('Optional filename hint (without extension). Slugged + suffixed with timestamp + random tag.'),
        ];
    }
}
