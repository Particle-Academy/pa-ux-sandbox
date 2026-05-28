@extends('admin.layout')

@section('title', 'Gamification')

@section('content')
<div class="space-y-8">
    <div>
        <h1 class="text-3xl font-bold text-gray-900 dark:text-white">Gamification</h1>
        <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Manage achievements and prizes. XP metrics + levels are structural and stay seeder-defined.
            Archiving keeps existing grants intact (sets inactive).
        </p>
    </div>

    {{-- Achievements --}}
    <section>
        <div class="flex items-center justify-between">
            <h2 class="text-xl font-semibold text-gray-900 dark:text-white">Achievements</h2>
            <a href="{{ route('admin.gamification.achievements.create') }}" class="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500">New achievement</a>
        </div>
        <div class="mt-3 overflow-x-auto bg-white shadow rounded-lg dark:bg-gray-800">
            <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead class="bg-gray-50 dark:bg-gray-900">
                    <tr>
                        <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Slug</th>
                        <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Name</th>
                        <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Active</th>
                        <th class="px-6 py-3"></th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
                    @foreach($achievements as $a)
                    <tr>
                        <td class="px-6 py-3 font-mono text-xs text-gray-600 dark:text-gray-400">{{ $a->slug }}</td>
                        <td class="px-6 py-3 text-sm text-gray-900 dark:text-white">{{ $a->name }}</td>
                        <td class="px-6 py-3">
                            @if($a->is_active)
                                <span class="inline-flex rounded-full bg-green-100 px-2 text-xs font-semibold text-green-800 dark:bg-green-900/40 dark:text-green-200">Active</span>
                            @else
                                <span class="inline-flex rounded-full bg-gray-100 px-2 text-xs font-semibold text-gray-700 dark:bg-gray-700 dark:text-gray-200">Inactive</span>
                            @endif
                        </td>
                        <td class="px-6 py-3 text-right text-sm space-x-3">
                            <a href="{{ route('admin.gamification.achievements.edit', $a) }}" class="text-indigo-600 hover:text-indigo-500 dark:text-indigo-400">Edit</a>
                            <form method="POST" action="{{ route('admin.gamification.achievements.toggle', $a) }}" class="inline">
                                @csrf
                                <button type="submit" class="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">{{ $a->is_active ? 'Archive' : 'Activate' }}</button>
                            </form>
                        </td>
                    </tr>
                    @endforeach
                </tbody>
            </table>
        </div>
    </section>

    {{-- Prizes --}}
    <section>
        <div class="flex items-center justify-between">
            <h2 class="text-xl font-semibold text-gray-900 dark:text-white">Prizes</h2>
            <a href="{{ route('admin.gamification.prizes.create') }}" class="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500">New prize</a>
        </div>
        <div class="mt-3 overflow-x-auto bg-white shadow rounded-lg dark:bg-gray-800">
            <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead class="bg-gray-50 dark:bg-gray-900">
                    <tr>
                        <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Slug</th>
                        <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Name</th>
                        <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Type</th>
                        <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Active</th>
                        <th class="px-6 py-3"></th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
                    @foreach($prizes as $p)
                    <tr>
                        <td class="px-6 py-3 font-mono text-xs text-gray-600 dark:text-gray-400">{{ $p->slug }}</td>
                        <td class="px-6 py-3 text-sm text-gray-900 dark:text-white">{{ $p->name }}</td>
                        <td class="px-6 py-3 text-xs text-gray-500">{{ $p->type }}</td>
                        <td class="px-6 py-3">
                            @if($p->is_active)
                                <span class="inline-flex rounded-full bg-green-100 px-2 text-xs font-semibold text-green-800 dark:bg-green-900/40 dark:text-green-200">Active</span>
                            @else
                                <span class="inline-flex rounded-full bg-gray-100 px-2 text-xs font-semibold text-gray-700 dark:bg-gray-700 dark:text-gray-200">Inactive</span>
                            @endif
                        </td>
                        <td class="px-6 py-3 text-right text-sm space-x-3">
                            <a href="{{ route('admin.gamification.prizes.edit', $p) }}" class="text-indigo-600 hover:text-indigo-500 dark:text-indigo-400">Edit</a>
                            <form method="POST" action="{{ route('admin.gamification.prizes.toggle', $p) }}" class="inline">
                                @csrf
                                <button type="submit" class="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">{{ $p->is_active ? 'Archive' : 'Activate' }}</button>
                            </form>
                        </td>
                    </tr>
                    @endforeach
                </tbody>
            </table>
        </div>
    </section>
</div>
@endsection
