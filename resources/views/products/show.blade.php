@extends('layouts.app')

@section('title', $product->name)

@section('content')
<div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
    <div class="mb-6">
        <a href="{{ route('products.index') }}" class="text-blue-600 hover:text-blue-800 dark:text-blue-400">
            ← Back to Products
        </a>
    </div>

    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
        @if($product->images && count($product->images) > 0)
            <img src="{{ $product->images[0] }}" alt="{{ $product->name }}" class="w-full h-64 object-cover">
        @endif

        <div class="p-8">
            <h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                {{ $product->name }}
            </h1>

            @if($product->description)
                <div class="prose dark:prose-invert mb-6">
                    <p class="text-gray-600 dark:text-gray-400">{{ $product->description }}</p>
                </div>
            @endif

            @if($product->activePrices->count() > 0)
                <div class="mb-8">
                    <h2 class="text-2xl font-semibold text-gray-900 dark:text-white mb-4">Pricing Options</h2>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        @foreach($product->activePrices as $price)
                            <div class="border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                                <div class="mb-4">
                                    <div class="text-3xl font-bold text-gray-900 dark:text-white">
                                        ${{ number_format($price->unit_amount / 100, 2) }}
                                    </div>
                                    @if($price->isRecurring())
                                        <div class="text-gray-600 dark:text-gray-400">
                                            per {{ $price->interval() }}
                                        </div>
                                        @if($price->trialDays())
                                            <div class="text-sm text-green-600 dark:text-green-400 mt-2">
                                                {{ $price->trialDays() }} day trial
                                            </div>
                                        @endif
                                    @else
                                        <div class="text-gray-600 dark:text-gray-400">One-time payment</div>
                                    @endif
                                </div>

                                @auth
                                    @if($price->isRecurring())
                                        <form method="POST" action="{{ route('subscriptions.create', $price) }}">
                                            @csrf
                                            <button type="submit" class="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded transition-colors">
                                                Subscribe
                                            </button>
                                        </form>
                                    @endif
                                @else
                                    <a href="{{ route('login') }}" class="block w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded transition-colors text-center">
                                        Login to Subscribe
                                    </a>
                                @endauth
                            </div>
                        @endforeach
                    </div>
                </div>
            @else
                <div class="text-gray-500 dark:text-gray-400">
                    No pricing options available for this product.
                </div>
            @endif
        </div>
    </div>
</div>
@endsection

