<?php

namespace App\Ai\Tools;

use HolySheet\Agent as HolySheet;
use Illuminate\Contracts\JsonSchema\JsonSchema;
use Illuminate\Support\Facades\Storage;
use Laravel\Ai\Contracts\Tool;
use Laravel\Ai\Tools\Request;
use Stringable;

class DescribeSpreadsheet implements Tool
{
    public function description(): Stringable|string
    {
        return <<<'DESC'
        Read an existing .xlsx file (one the user uploaded earlier in this
        session) back into a Holy Sheet schema for inspection or modification.
        Use this when the user wants to "open this file and add a column",
        "show me what's in this spreadsheet", or modify an existing workbook.
        Pass the storage filename returned by an earlier upload — the tool
        resolves it relative to the public disk's `ai-sheets/uploads`
        directory. Returns the full schema JSON.
        DESC;
    }

    public function handle(Request $request): Stringable|string
    {
        $filename = basename((string) $request['filename']);
        $relative = 'ai-sheets/uploads/'.$filename;

        if (! Storage::disk('public')->exists($relative)) {
            return json_encode(['error' => 'not_found', 'filename' => $filename]);
        }

        $schema = HolySheet::describe(Storage::disk('public')->path($relative));

        return json_encode($schema, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    }

    public function schema(JsonSchema $schema): array
    {
        return [
            'filename' => $schema->string()
                ->description('Filename of an uploaded xlsx in ai-sheets/uploads. Returned by the upload step.')
                ->required(),
        ];
    }
}
