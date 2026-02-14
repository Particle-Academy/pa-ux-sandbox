@extends('layouts.app')

@section('title', 'My Subscriptions')

@section('content')
<div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
    <div class="mb-8">
        <h1 class="text-3xl font-bold text-gray-900 dark:text-white">My Subscriptions</h1>
        <p class="mt-2 text-gray-600 dark:text-gray-400">Manage your active subscriptions</p>
    </div>

    @if($subscriptions->isEmpty())
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 text-center">
            <p class="text-gray-500 dark:text-gray-400 mb-4">You don't have any active subscriptions.</p>
            <a href="{{ route('products.index') }}" class="inline-block bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded transition-colors">
                Browse Products
            </a>
        </div>
    @else
        <div class="space-y-4">
            @foreach($subscriptions as $subscription)
                <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                    <div class="flex justify-between items-start">
                        <div>
                            <h3 class="text-xl font-semibold text-gray-900 dark:text-white">
                                {{ $subscription->name }}
                            </h3>
                            <p class="text-gray-600 dark:text-gray-400 mt-1">
                                Status: <span class="font-medium capitalize">{{ $subscription->stripe_status }}</span>
                            </p>
                            @if($subscription->ends_at)
                                <p class="text-gray-600 dark:text-gray-400 mt-1">
                                    Ends: {{ $subscription->ends_at->format('M d, Y') }}
                                </p>
                            @endif
                        </div>
                        <div class="text-right">
                            @if($subscription->stripe_status === 'active')
                                <span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                                    Active
                                </span>
                            @else
                                <span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200">
                                    {{ ucfirst($subscription->stripe_status) }}
                                </span>
                            @endif
                        </div>
                    </div>
                </div>
            @endforeach
        </div>
    @endif
</div>
@endsection

