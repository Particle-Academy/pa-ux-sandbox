@extends('admin.layout')

@section('title', 'Users')

@section('content')
<div class="space-y-6">
    <div>
        <h1 class="text-3xl font-bold text-gray-900 dark:text-white">Users</h1>
        <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Manage members, inspect engagement, and issue manual grants.
        </p>
    </div>

    <form method="GET" class="flex flex-wrap items-end gap-3">
        <div>
            <label class="block text-xs font-medium text-gray-500 dark:text-gray-400">Search</label>
            <input name="q" value="{{ $search }}" placeholder="name, email, github"
                   class="mt-1 rounded border-gray-300 text-sm shadow-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white" />
        </div>
        <div>
            <label class="block text-xs font-medium text-gray-500 dark:text-gray-400">Sort</label>
            <select name="sort" class="mt-1 rounded border-gray-300 text-sm shadow-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white">
                <option value="recent" @selected($sort === 'recent')>Most recent</option>
                <option value="coins" @selected($sort === 'coins')>Most coins</option>
                <option value="name" @selected($sort === 'name')>Name (A–Z)</option>
            </select>
        </div>
        <button type="submit" class="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500">
            Apply
        </button>
    </form>

    <div class="overflow-x-auto bg-white shadow rounded-lg dark:bg-gray-800">
        <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead class="bg-gray-50 dark:bg-gray-900">
                <tr>
                    <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">User</th>
                    <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">GitHub</th>
                    <th class="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Coins</th>
                    <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Admin</th>
                    <th class="px-6 py-3"></th>
                </tr>
            </thead>
            <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
                @foreach($users as $u)
                <tr>
                    <td class="px-6 py-3">
                        <div class="text-sm font-medium text-gray-900 dark:text-white">{{ $u->name }}</div>
                        <div class="text-xs text-gray-500">{{ $u->email }}</div>
                    </td>
                    <td class="px-6 py-3 text-sm text-gray-500 dark:text-gray-400">{{ $u->github_username ?? '—' }}</td>
                    <td class="px-6 py-3 text-right text-sm font-semibold text-amber-700 dark:text-amber-300">
                        {{ number_format($u->wallet?->balance ?? 0) }}
                    </td>
                    <td class="px-6 py-3">
                        @if($u->is_admin)
                            <span class="inline-flex rounded-full bg-indigo-100 px-2 text-xs font-semibold text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-200">Admin</span>
                        @endif
                    </td>
                    <td class="px-6 py-3 text-right text-sm">
                        <a href="{{ route('admin.users.show', $u) }}" class="text-indigo-600 hover:text-indigo-500 dark:text-indigo-400">Manage</a>
                    </td>
                </tr>
                @endforeach
            </tbody>
        </table>
    </div>

    {{ $users->links() }}
</div>
@endsection
