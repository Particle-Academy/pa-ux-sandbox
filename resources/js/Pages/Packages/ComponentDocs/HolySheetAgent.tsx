import type { ComponentDoc } from "./types";
import { Text } from "@particle-academy/react-fancy";

export const holySheetAgentDoc: ComponentDoc = {
    intro: (
        <p>
            The top-level API for <code>holy-sheet</code> — a PHP 8.4+ xlsx writer designed
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
            description: "When an agent emits a schema, `validateAndRepair()` returns the repaired schema, the original errors and the repairs it applied — perfect for tool-use feedback loops. Re-validate the repaired schema to know whether it is now writable.",
            render: () => (
                <Text size="sm" className="!text-zinc-500">
                    Wrap it in a tool your agent calls, and hand the errors back as the tool result.
                </Text>
            ),
            code: `// Inside a Laravel AI tool:
$result = Agent::validateAndRepair($schemaFromAgent);
// $result = ['schema' => [...], 'errors' => [...], 'repairs' => ['...']]

$remaining = Agent::validate($result['schema']);

if ($remaining === []) {
    return [
        'schema' => $result['schema'],
        'repairs' => $result['repairs'],
        'sheets' => count($result['schema']['sheets']),
    ];
}

return [
    'error' => 'Schema invalid',
    'errors' => $remaining,
];`,
        },
    ],
    props: [
        { name: "Agent::validate($schema)", type: `(array) => list<error>`, default: "—", description: "Validate the schema. Returns an empty array on success or a list of `{ path, expected, got, value, hint }` errors." },
        { name: "Agent::write($schema, $path)", type: `(array, string) => array`, default: "—", description: "Write a workbook to disk. Throws `SchemaException` on validation failure. Returns `{ path, bytes, sheets }`." },
        { name: "Agent::toBytes($schema)", type: `(array) => string`, default: "—", description: "Return the workbook as a binary string (no temp file)." },
        { name: "Agent::describe($path, $options)", type: `(string $path, array $options = []) => array`, default: "—", description: "Read an existing .xlsx or .ods back to a Holy Sheet schema you can feed to `write()`. Options: `sheet` (one sheet by name), `limits`. Returns `{ error: 'not_found', path }` for a missing file." },
        { name: "Agent::validateAndRepair($schema)", type: `(array) => array`, default: "—", description: "Validate + apply heuristic repairs. Returns `{ schema, errors, repairs }`." },
    ],
    notes: (
        <p className="text-xs text-zinc-600 dark:text-zinc-300">
            <strong>Tool use:</strong> <code>Agent::toolDefinition()</code> returns the
            tool schema to register with your agent; give each tool one{" "}
            <code>Agent</code> method to wrap (build with <code>validateAndRepair</code>,
            save with <code>write</code>, read back with <code>describe</code>).
        </p>
    ),
};
