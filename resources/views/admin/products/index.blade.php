@extends('admin.layout')

@section('title', 'Products')

@section('content')
<div class="space-y-6">
    <div class="flex justify-between items-center">
        <div>
            <h1 class="text-3xl font-bold text-gray-900 dark:text-white">Products</h1>
            <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">
                Manage products using Catalog facade
            </p>
        </div>
        <div class="flex gap-3">
            <form action="{{ route('admin.products.sync-all') }}" method="POST" class="inline">
                @csrf
                <button type="submit" class="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
                    Sync All to Stripe
                </button>
            </form>
            <a href="{{ route('admin.products.create') }}" class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700">
                Create Product
            </a>
        </div>
    </div>

    <div class="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-md">
        <ul class="divide-y divide-gray-200 dark:divide-gray-700">
            @forelse($products as $product)
                <li>
                    <div class="px-4 py-4 sm:px-6">
                        <div class="flex items-center justify-between">
                            <div class="flex items-center">
                                <div class="flex-shrink-0">
                                    @if($product->active)
                                        <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                                            Active
                                        </span>
                                    @else
                                        <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                                            Inactive
                                        </span>
                                    @endif
                                </div>
                                <div class="ml-4">
                                    <div class="flex items-center">
                                        <p class="text-sm font-medium text-gray-900 dark:text-white">
                                            {{ $product->name }}
                                        </p>
                                        @if($product->external_id)
                                            <span class="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                                                Synced
                                            </span>
                                        @endif
                                    </div>
                                    @if($product->description)
                                        <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                            {{ Str::limit($product->description, 100) }}
                                        </p>
                                    @endif
                                    <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                        {{ $product->prices->count() }} price(s)
                                    </p>
                                </div>
                            </div>
                            <div class="flex items-center space-x-2">
                                <form action="{{ route('admin.products.sync', $product) }}" method="POST" class="inline">
                                    @csrf
                                    <button type="submit" class="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 text-sm font-medium">
                                        Sync to Stripe
                                    </button>
                                </form>
                                <a href="{{ route('admin.products.show', $product) }}" class="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 text-sm font-medium">
                                    View
                                </a>
                                <a href="{{ route('admin.products.edit', $product) }}" class="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300 text-sm font-medium">
                                    Edit
                                </a>
                            </div>
                        </div>
                    </div>
                </li>
            @empty
                <li class="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                    No products found. <a href="{{ route('admin.products.create') }}" class="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400">Create one</a>
                </li>
            @endforelse
        </ul>
    </div>

    {{ $products->links() }}
</div>
@endsection

