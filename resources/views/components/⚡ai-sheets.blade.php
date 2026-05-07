<?php

use App\Ai\Agents\HolySheetAgent;
use Livewire\Component;

new class extends Component
{
    public string $prompt = '';

    public bool $generating = false;

    /** @var array<int, array{prompt:string, summary:string, url:?string, filename:?string, sheets:?int, bytes:?int, error:?string, ms:?int}> */
    public array $history = [];

    public array $examples = [
        'Create a Q4 sales report with three regions (NA, Europe, APAC), revenue and YoY growth columns, and a totals row.',
        'Build a 12-month revenue forecast for a SaaS startup. Include MRR, new customers, churn rate, and net revenue.',
        'Make a 2026 quarterly budget tracker with categories (Salaries, Marketing, Infrastructure, Travel) — show planned vs actual.',
        'Generate a project timeline workbook with 8 milestones, owners, due dates, and a Status column.',
    ];

    public function generate(): void
    {
        $prompt = trim($this->prompt);
        if ($prompt === '') {
            return;
        }

        $this->generating = true;
        $entry = [
            'prompt' => $prompt,
            'summary' => '',
            'url' => null,
            'filename' => null,
            'sheets' => null,
            'bytes' => null,
            'error' => null,
            'ms' => null,
        ];

        $start = microtime(true);
        try {
            $response = (new HolySheetAgent)->prompt($prompt);
            $entry['summary'] = (string) $response;

            // The agent's final reply may include the download URL inline; the
            // most recent xlsx in storage/app/public/ai-sheets is the result.
            $latest = $this->latestArtifact();
            if ($latest !== null) {
                $entry['url'] = $latest['url'];
                $entry['filename'] = $latest['filename'];
                $entry['bytes'] = $latest['bytes'];
            }
        } catch (\Throwable $e) {
            $entry['error'] = $e->getMessage();
            report($e);
        } finally {
            $entry['ms'] = (int) ((microtime(true) - $start) * 1000);
            $this->generating = false;
            $this->prompt = '';
            array_unshift($this->history, $entry);
        }
    }

    public function useExample(int $i): void
    {
        $this->prompt = $this->examples[$i] ?? '';
    }

    /** @return array{url:string, filename:string, bytes:int}|null */
    private function latestArtifact(): ?array
    {
        $dir = \Illuminate\Support\Facades\Storage::disk('public')->path('ai-sheets');
        if (! is_dir($dir)) {
            return null;
        }
        $files = glob($dir.'/*.xlsx') ?: [];
        if ($files === []) {
            return null;
        }
        usort($files, fn ($a, $b) => filemtime($b) <=> filemtime($a));
        $latest = $files[0];
        $name = basename($latest);

        return [
            'url' => \Illuminate\Support\Facades\Storage::disk('public')->url('ai-sheets/'.$name),
            'filename' => $name,
            'bytes' => (int) filesize($latest),
        ];
    }

    public function with(): array
    {
        return [
            'hasKey' => (bool) config('ai.providers.anthropic.key'),
        ];
    }
};
?>

<div class="mx-auto max-w-4xl px-4 py-10">
    <div class="mb-8">
        <h1 class="text-3xl font-semibold text-zinc-900 dark:text-zinc-100">Holy Sheet · AI agent</h1>
        <p class="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            Describe a spreadsheet in plain English. The agent uses Holy Sheet's tool surface
            (<code class="rounded bg-zinc-100 px-1 py-0.5 text-xs dark:bg-zinc-800">build_spreadsheet_schema</code>,
            <code class="rounded bg-zinc-100 px-1 py-0.5 text-xs dark:bg-zinc-800">write_spreadsheet</code>,
            <code class="rounded bg-zinc-100 px-1 py-0.5 text-xs dark:bg-zinc-800">describe_spreadsheet</code>)
            via the Laravel AI SDK to generate a real .xlsx file with inferred types, totals, and styling.
        </p>
    </div>

    @if (! $hasKey)
        <div class="mb-6 rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-200">
            <strong>Heads up:</strong> No <code>ANTHROPIC_API_KEY</code> in <code>.env</code>. Set one and reload to enable the agent.
        </div>
    @endif

    <form wire:submit="generate" class="space-y-3">
        <textarea
            wire:model="prompt"
            rows="3"
            placeholder="e.g. Create a Q4 sales report with three regions and a totals row"
            class="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
            @disabled($generating)
        ></textarea>

        <div class="flex items-center justify-between gap-3">
            <div class="flex flex-wrap gap-2">
                @foreach ($examples as $i => $example)
                    <button
                        type="button"
                        wire:click="useExample({{ $i }})"
                        class="rounded-full border border-zinc-300 bg-white px-3 py-1 text-xs text-zinc-700 transition hover:border-zinc-400 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:border-zinc-600 dark:hover:bg-zinc-800"
                    >
                        Example {{ $i + 1 }}
                    </button>
                @endforeach
            </div>

            <button
                type="submit"
                @disabled($generating || ! $hasKey)
                class="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
                @if ($generating)
                    <svg class="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" class="opacity-25"></circle>
                        <path fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" class="opacity-75"></path>
                    </svg>
                    Generating…
                @else
                    Generate spreadsheet
                @endif
            </button>
        </div>
    </form>

    <div class="mt-10 space-y-4">
        @forelse ($history as $entry)
            <article class="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                <div class="mb-3 flex items-start justify-between gap-3 border-b border-zinc-100 pb-3 dark:border-zinc-800">
                    <p class="text-sm text-zinc-700 dark:text-zinc-300">{{ $entry['prompt'] }}</p>
                    @if ($entry['ms'] !== null)
                        <span class="shrink-0 rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                            {{ number_format($entry['ms'] / 1000, 1) }}s
                        </span>
                    @endif
                </div>

                @if ($entry['error'])
                    <div class="rounded-lg bg-red-50 p-3 text-sm text-red-900 dark:bg-red-950 dark:text-red-200">
                        <strong>Error:</strong> {{ $entry['error'] }}
                    </div>
                @else
                    <div class="prose prose-sm max-w-none text-zinc-800 dark:prose-invert dark:text-zinc-200">
                        {!! nl2br(e($entry['summary'])) !!}
                    </div>

                    @if ($entry['url'])
                        <a
                            href="{{ $entry['url'] }}"
                            download="{{ $entry['filename'] }}"
                            class="mt-4 inline-flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-900 transition hover:bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-200 dark:hover:bg-emerald-900"
                        >
                            <svg class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m-9 6h12a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v14a2 2 0 002 2z" />
                            </svg>
                            Download {{ $entry['filename'] }}
                            @if ($entry['bytes'])
                                <span class="text-xs text-emerald-700 dark:text-emerald-400">({{ number_format($entry['bytes'] / 1024, 1) }} KB)</span>
                            @endif
                        </a>
                    @endif
                @endif
            </article>
        @empty
            <p class="rounded-lg border border-dashed border-zinc-300 px-4 py-8 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
                Generated workbooks will appear here.
            </p>
        @endforelse
    </div>
</div>
