@extends('admin.layout')

@section('title', 'Plans')

@section('content')
<div class="space-y-6">
    <div class="flex justify-between items-center">
        <div>
            <h1 class="text-3xl font-bold text-gray-900 dark:text-white">Plans</h1>
            <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">
                Manage recurring subscription plans using Catalog facade
            </p>
        </div>
        <a href="{{ route('admin.plans.create') }}" class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700">
            Create Plan
        </a>
    </div>

    <div class="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-md">
        <ul class="divide-y divide-gray-200 dark:divide-gray-700">
            @forelse($plans as $plan)
                <li>
                    <div class="px-4 py-4 sm:px-6">
                        <div class="flex items-center justify-between">
                            <div class="flex items-center">
                                <div class="flex-shrink-0">
                                    @if($plan->active)
                                        <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                                            Active
                                        </span>
                                    @else
                                        <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                                            Inactive
                                        </span>
                                    @endif
                                    @if(data_get($plan->metadata, 'storefront.plan.recommended'))
                                        <span class="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                                            Recommended
                                        </span>
                                    @endif
                                </div>
                                <div class="ml-4">
                                    <div class="flex items-center">
                                        <p class="text-sm font-medium text-gray-900 dark:text-white">
                                            {{ $plan->name }}
                                        </p>
                                        @if($plan->external_id)
                                            <span class="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                                                Synced
                                            </span>
                                        @endif
                                    </div>
                                    @if($plan->description)
                                        <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                            {{ Str::limit($plan->description, 100) }}
                                        </p>
                                    @endif
                                    <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                        {{ $plan->prices->count() }} recurring price(s)
                                        @if($plan->prices->count() > 0)
                                            - Starting at ${{ number_format($plan->prices->min('unit_amount') / 100, 2) }}/{{ $plan->prices->first()->interval() }}
                                        @endif
                                    </p>
                                </div>
                            </div>
                            <div class="flex items-center space-x-2">
                                <form action="{{ route('admin.plans.sync', $plan) }}" method="POST" class="inline">
                                    @csrf
                                    <button type="submit" class="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 text-sm font-medium">
                                        Sync to Stripe
                                    </button>
                                </form>
                                <a href="{{ route('admin.plans.show', $plan) }}" class="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 text-sm font-medium">
                                    View
                                </a>
                                <a href="{{ route('admin.plans.edit', $plan) }}" class="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300 text-sm font-medium">
                                    Edit
                                </a>
                            </div>
                        </div>
                    </div>
                </li>
            @empty
                <li class="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                    No plans found. <a href="{{ route('admin.plans.create') }}" class="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400">Create one</a>
                </li>
            @endforelse
        </ul>
    </div>

    {{ $plans->links() }}
</div>
@endsection

