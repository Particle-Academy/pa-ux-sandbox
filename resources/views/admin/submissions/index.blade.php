@extends('admin.layout')

@section('title', 'Showcase Submissions')

@php
    $tabs = ['pending' => $counts['pending'], 'verified' => $counts['verified'], 'rejected' => $counts['rejected'], 'all' => null];
@endphp

@section('content')
<div class="space-y-6">
    <div>
        <h1 class="text-3xl font-bold text-gray-900 dark:text-white">Showcase Submissions</h1>
        <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Moderate community projects. Verifying a project pays the submitter projects-XP (once).
        </p>
    </div>

    <div class="flex flex-wrap gap-2 text-sm">
        @foreach($tabs as $key => $count)
            <a href="{{ route('admin.submissions.index', ['status' => $key]) }}"
               @class([
                   'rounded-full px-3 py-1.5 border',
                   'bg-indigo-600 text-white border-indigo-600' => $status === $key,
                   'border-gray-300 text-gray-600 dark:border-gray-700 dark:text-gray-300' => $status !== $key,
               ])>
                {{ ucfirst($key) }}@if($count !== null) ({{ $count }})@endif
            </a>
        @endforeach
    </div>

    <div class="overflow-x-auto bg-white shadow rounded-lg dark:bg-gray-800">
        <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead class="bg-gray-50 dark:bg-gray-900">
                <tr>
                    <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">#</th>
                    <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Title / URL</th>
                    <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">By</th>
                    <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Status</th>
                    <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Featured</th>
                    <th class="px-6 py-3"></th>
                </tr>
            </thead>
            <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
                @forelse($submissions as $s)
                <tr>
                    <td class="px-6 py-3 text-sm text-gray-500">{{ $s->id }}</td>
                    <td class="px-6 py-3">
                        <div class="text-sm font-medium text-gray-900 dark:text-white">{{ $s->title ?? '(untitled)' }}</div>
                        <a href="{{ $s->url }}" target="_blank" rel="noopener" class="text-xs text-indigo-600 hover:underline dark:text-indigo-400">{{ $s->url }}</a>
                        <span class="ml-2 text-xs text-gray-400">{{ $s->kind }}</span>
                    </td>
                    <td class="px-6 py-3 text-sm text-gray-500">{{ $s->user?->name ?? '—' }}</td>
                    <td class="px-6 py-3">
                        <span @class([
                            'inline-flex rounded-full px-2 text-xs font-semibold',
                            'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-200' => $s->status === 'pending',
                            'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-200' => $s->status === 'verified',
                            'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200' => $s->status === 'rejected',
                        ])>{{ $s->status }}</span>
                    </td>
                    <td class="px-6 py-3 text-xs text-gray-500">
                        @if($s->isFeatured())
                            <span class="text-amber-600 dark:text-amber-400">until {{ $s->featured_until->format('M j') }}</span>
                        @else
                            —
                        @endif
                    </td>
                    <td class="px-6 py-3 text-right text-sm">
                        <a href="{{ route('admin.submissions.show', $s) }}" class="text-indigo-600 hover:text-indigo-500 dark:text-indigo-400">Review</a>
                    </td>
                </tr>
                @empty
                <tr><td colspan="6" class="px-6 py-6 text-center text-sm text-gray-400">No submissions in this bucket.</td></tr>
                @endforelse
            </tbody>
        </table>
    </div>

    {{ $submissions->links() }}
</div>
@endsection
