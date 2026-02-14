@extends('layouts.app')

@section('title', 'Subscription Success')

@section('content')
<div class="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 text-center">
        <div class="mb-6">
            <svg class="mx-auto h-16 w-16 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
        </div>
        <h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-4">Subscription Successful!</h1>
        <p class="text-gray-600 dark:text-gray-400 mb-6">
            Your subscription has been activated. You can now manage it from your subscriptions page.
        </p>
        <div class="flex gap-4 justify-center">
            <a href="{{ route('subscriptions.index') }}" class="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded transition-colors">
                View Subscriptions
            </a>
            <a href="{{ route('products.index') }}" class="bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white font-medium py-2 px-6 rounded transition-colors">
                Browse More Products
            </a>
        </div>
    </div>
</div>
@endsection

