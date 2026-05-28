@extends('admin.layout')

@section('title', 'Submission #'.$submission->id)

@section('content')
<div class="max-w-4xl space-y-6">
    <div>
        <a href="{{ route('admin.submissions.index') }}" class="text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">&larr; Submissions</a>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">{{ $submission->title ?? '(untitled)' }}</h1>
        <a href="{{ $submission->url }}" target="_blank" rel="noopener" class="text-sm text-indigo-600 hover:underline dark:text-indigo-400">{{ $submission->url }}</a>
    </div>

    <div class="grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
        <div><dt class="text-gray-500">Kind</dt><dd class="font-medium text-gray-900 dark:text-white">{{ $submission->kind }}</dd></div>
        <div><dt class="text-gray-500">Status</dt><dd class="font-medium text-gray-900 dark:text-white">{{ $submission->status }}</dd></div>
        <div><dt class="text-gray-500">By</dt><dd class="font-medium text-gray-900 dark:text-white">{{ $submission->user?->name ?? '—' }}</dd></div>
        <div><dt class="text-gray-500">Rewarded</dt><dd class="font-medium text-gray-900 dark:text-white">{{ $submission->rewarded_at?->format('M j, Y') ?? 'no' }}</dd></div>
    </div>

    @if($submission->description)
        <p class="text-sm text-gray-700 dark:text-gray-300">{{ $submission->description }}</p>
    @endif

    {{-- Scan result inspector --}}
    <div class="rounded-lg bg-white p-5 shadow dark:bg-gray-800">
        <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Scan result</h2>
        <p class="text-xs text-gray-500">{{ $submission->scanned_at?->diffForHumans() ?? 'never scanned' }}</p>
        <pre class="mt-3 overflow-x-auto rounded bg-gray-50 p-3 text-xs text-gray-800 dark:bg-gray-900 dark:text-gray-200">{{ json_encode($submission->scan_result, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES) ?: 'null' }}</pre>
    </div>

    {{-- Moderation actions --}}
    <div class="flex flex-wrap gap-3">
        <form method="POST" action="{{ route('admin.submissions.verify', $submission) }}">
            @csrf
            <button class="rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-500">Verify</button>
        </form>
        <form method="POST" action="{{ route('admin.submissions.reject', $submission) }}">
            @csrf
            <button class="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-500">Reject</button>
        </form>
        <form method="POST" action="{{ route('admin.submissions.rescan', $submission) }}">
            @csrf
            <button class="rounded-md border border-gray-300 px-4 py-2 text-sm dark:border-gray-700 dark:text-gray-200">Re-scan</button>
        </form>
    </div>

    {{-- Feature controls --}}
    <div class="rounded-lg bg-white p-5 shadow dark:bg-gray-800">
        <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Featuring</h2>
        <p class="mt-1 text-sm text-gray-500">
            @if($submission->isFeatured())
                Currently featured until <span class="font-medium">{{ $submission->featured_until->format('M j, Y') }}</span>.
            @else
                Not currently featured.
            @endif
        </p>
        <div class="mt-3 flex flex-wrap items-end gap-3">
            <form method="POST" action="{{ route('admin.submissions.feature', $submission) }}" class="flex items-end gap-2">
                @csrf
                <div>
                    <label class="block text-xs text-gray-500">Days</label>
                    <input name="days" type="number" min="1" max="365" value="7"
                           class="mt-1 w-24 rounded border-gray-300 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white" />
                </div>
                <button class="rounded-md bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-500">Feature (comp)</button>
            </form>
            @if($submission->isFeatured())
                <form method="POST" action="{{ route('admin.submissions.unfeature', $submission) }}">
                    @csrf
                    <button class="rounded-md border border-gray-300 px-4 py-2 text-sm dark:border-gray-700 dark:text-gray-200">Remove feature</button>
                </form>
            @endif
        </div>
    </div>
</div>
@endsection
