@extends('admin.layout')

@section('title', 'Shop')

@section('content')
<div class="space-y-6">
    <div class="flex items-center justify-between">
        <div>
            <h1 class="text-3xl font-bold text-gray-900 dark:text-white">Coin Shop Items</h1>
            <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">
                Cosmetics (one-time) and services (time-bounded). Price changes don't
                rewrite history — old purchases keep their paid_amount.
            </p>
        </div>
        <a href="{{ route('admin.shop.create') }}" class="inline-flex items-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500">
            New item
        </a>
    </div>

    <div class="overflow-x-auto bg-white shadow rounded-lg dark:bg-gray-800">
        <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead class="bg-gray-50 dark:bg-gray-900">
                <tr>
                    <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Slug</th>
                    <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Name</th>
                    <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Kind</th>
                    <th class="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Price</th>
                    <th class="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Sold</th>
                    <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Active</th>
                    <th class="px-6 py-3"></th>
                </tr>
            </thead>
            <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
                @foreach($items as $item)
                <tr>
                    <td class="px-6 py-3 font-mono text-xs text-gray-600 dark:text-gray-400">{{ $item->slug }}</td>
                    <td class="px-6 py-3 text-sm font-medium text-gray-900 dark:text-white">{{ $item->name }}</td>
                    <td class="px-6 py-3 text-xs">
                        <span @class([
                            'inline-block rounded px-2 py-0.5 text-xs',
                            'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-200' => $item->isCosmetic(),
                            'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200' => $item->isService(),
                        ])>
                            {{ ucfirst($item->kind) }}
                        </span>
                    </td>
                    <td class="px-6 py-3 text-sm text-right text-gray-900 dark:text-white">{{ number_format($item->price) }}</td>
                    <td class="px-6 py-3 text-sm text-right text-gray-500 dark:text-gray-400">{{ $item->purchases_count }}</td>
                    <td class="px-6 py-3">
                        @if($item->active)
                            <span class="inline-flex rounded-full bg-green-100 px-2 text-xs font-semibold text-green-800 dark:bg-green-900/40 dark:text-green-200">Active</span>
                        @else
                            <span class="inline-flex rounded-full bg-gray-100 px-2 text-xs font-semibold text-gray-800 dark:bg-gray-700 dark:text-gray-200">Inactive</span>
                        @endif
                    </td>
                    <td class="px-6 py-3 text-right text-sm space-x-3">
                        <a href="{{ route('admin.shop.edit', $item) }}" class="text-indigo-600 hover:text-indigo-500 dark:text-indigo-400">Edit</a>
                        <form method="POST" action="{{ route('admin.shop.toggle', $item) }}" class="inline">
                            @csrf
                            <button type="submit" class="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                                {{ $item->active ? 'Deactivate' : 'Activate' }}
                            </button>
                        </form>
                    </td>
                </tr>
                @endforeach
            </tbody>
        </table>
    </div>

    {{ $items->links() }}
</div>
@endsection
