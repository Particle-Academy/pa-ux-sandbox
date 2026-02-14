@extends('layouts.app')

@section('title', 'Products')

@section('content')
<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div class="mb-8">
        <h1 class="text-3xl font-bold text-gray-900 dark:text-white">Products</h1>
        <p class="mt-2 text-gray-600 dark:text-gray-400">Browse our available products and pricing plans</p>
    </div>

    @if($products->isEmpty())
        <div class="text-center py-12">
            <p class="text-gray-500 dark:text-gray-400">No products available at this time.</p>
        </div>
    @else
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            @foreach($products as $product)
                <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                    @if($product->images && count($product->images) > 0)
                        <img src="{{ $product->images[0] }}" alt="{{ $product->name }}" class="w-full h-48 object-cover">
                    @endif
                    <div class="p-6">
                        <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                            {{ $product->name }}
                        </h2>
                        @if($product->description)
                            <p class="text-gray-600 dark:text-gray-400 mb-4 line-clamp-3">
                                {{ $product->description }}
                            </p>
                        @endif

                        @if($product->activePrices->count() > 0)
                            <div class="mb-4">
                                <p class="text-sm text-gray-500 dark:text-gray-400 mb-2">Pricing:</p>
                                @foreach($product->activePrices->take(2) as $price)
                                    <div class="text-lg font-bold text-gray-900 dark:text-white">
                                        ${{ number_format($price->unit_amount / 100, 2) }}
                                        @if($price->isRecurring())
                                            / {{ $price->interval() }}
                                        @endif
                                    </div>
                                @endforeach
                            </div>
                        @endif

                        <a href="{{ route('products.show', $product) }}" class="inline-block bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded transition-colors">
                            View Details
                        </a>
                    </div>
                </div>
            @endforeach
        </div>
    @endif
</div>
@endsection

