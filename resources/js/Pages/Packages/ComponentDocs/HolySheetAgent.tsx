import type { ComponentDoc } from "./types";
import { Text } from "@particle-academy/react-fancy";

export const holySheetAgentDoc: ComponentDoc = {
    intro: (
        <p>
            The top-level API for <code>holy-sheet</code> — a PHP 8.2+ xlsx writer designed
            for agentic document creation. <code>Agent</code> handles schema validation,
            cell + chart + style emission, and writes a final xlsx workbook to disk or to a
            byte stream. The full surface is exposed both as static methods and via the
            <code>HolySheet</code> Laravel facade.
        </p>
    ),
    examples: [
        {
            name: "Validate + write",
            description: "Validate first, then write to disk. `validate()` returns an empty array for valid schemas.",
            render: () => (
                <Text size="sm" className="!text-zinc-500">
                    The schema shape is JSON-friendly — perfect for an LLM tool-use payload.
                </Text>
            ),
            code: `use HolySheet\\Agent;

$schema = [
    'sheets' => [
        [
            'name' => 'Sales',
            'cells' => [
                ['A1', 'Item', ['bold' => true]],
                ['B1', 'Qty', ['bold' => true]],
                ['A2', 'Widget'],
                ['B2', 12],
            ],
        ],
    ],
];

$errors = Agent::validate($schema);
if (!empty($errors)) {
    foreach ($errors as $e) {
        echo "{$e['path']}: expected {$e['expected']}, got {$e['got']} ({$e['hint']})\\n";
    }
    exit(1);
}

$result = Agent::write($schema, '/tmp/report.xlsx');
// $result = ['path' => '/tmp/report.xlsx', 'bytes' => 5421, 'sheets' => 1]`,
        },
        {
            name: "From the Laravel facade",
            description: "Same API, registered as a singleton by `HolySheetServiceProvider`.",
            render: () => (
                <Text size="sm" className="!text-zinc-500">
                    The facade is what your application's pipelines see.
                </Text>
            ),
            code: `use HolySheet\\Laravel\\Facades\\HolySheet;

HolySheet::write($schema, storage_path('app/report.xlsx'));

// Or get the bytes directly (no temp file)
$bytes = HolySheet::toBytes($schema);

return response($bytes, 200, [
    'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'Content-Disposition' => 'attachment; filename="report.xlsx"',
]);`,
        },
        {
            name: "Validate-and-repair (Laravel AI SDK)",
            description: "When an agent emits a schema, `validateAndRepair()` returns the cleaned schema or a list of repairable issues — perfect for tool-use feedback loops.",
            render: () => (
                <Text size="sm" className="!text-zinc-500">
                    See <code>app/Ai/Tools/BuildSpreadsheetSchema.php</code> in this repo for the live example.
                </Text>
            ),
            code: `// Inside a Laravel AI tool:
$result = Agent::validateAndRepair($schemaFromAgent);

if ($result['ok']) {
    return [
        'schema' => $result['schema'],
        'sheets' => count($result['schema']['sheets']),
    ];
}

return [
    'error' => 'Schema invalid',
    'errors' => $result['errors'],
];`,
        },
    ],
    props: [
        { name: "Agent::validate($schema)", type: `(array) => list<error>`, default: "—", description: "Validate the schema. Returns an empty array on success or a list of `{ path, expected, got, value, hint }` errors." },
        { name: "Agent::write($schema, $path)", type: `(array, string) => array`, default: "—", description: "Write a workbook to disk. Throws `SchemaException` on validation failure. Returns `{ path, bytes, sheets }`." },
        { name: "Agent::toBytes($schema)", type: `(array) => string`, default: "—", description: "Return the workbook as a binary string (no temp file)." },
        { name: "Agent::describe($schema)", type: `(array) => string`, default: "—", description: "Plain-text summary of the schema — useful as tool-use feedback for the agent." },
        { name: "Agent::validateAndRepair($schema)", type: `(array) => array`, default: "—", description: "Validate + apply heuristic repairs. Returns `{ ok, schema, errors }`." },
    ],
    notes: (
        <p className="text-xs text-zinc-600 dark:text-zinc-300">
            <strong>Live demo:</strong> see <code>/ai-sheets</code> in this app for the
            agentic flow — the Laravel AI SDK calls{" "}
            <code>BuildSpreadsheetSchema</code>, <code>WriteSpreadsheet</code>, and{" "}
            <code>DescribeSpreadsheet</code> tools, each of which wraps an{" "}
            <code>Agent</code> method.
        </p>
    ),
};
