@extends('admin.layout')

@section('title', 'Features')

@section('content')
<div class="space-y-6">
    <div>
        <h1 class="text-3xl font-bold text-gray-900 dark:text-white">Features</h1>
        <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Feature management using FMS facade
        </p>
    </div>

    @if(session('test_result'))
        <div class="bg-blue-50 dark:bg-blue-900 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
            <h3 class="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">Test Result for "{{ session('test_result')['feature'] }}"</h3>
            <dl class="grid grid-cols-2 gap-4 text-sm">
                <div>
                    <dt class="text-blue-600 dark:text-blue-400">Enabled:</dt>
                    <dd class="text-blue-900 dark:text-blue-100">{{ session('test_result')['enabled'] ? 'Yes' : 'No' }}</dd>
                </div>
                <div>
                    <dt class="text-blue-600 dark:text-blue-400">Can Access:</dt>
                    <dd class="text-blue-900 dark:text-blue-100">{{ session('test_result')['canAccess'] ? 'Yes' : 'No' }}</dd>
                </div>
                @if(session('test_result')['remaining'] !== null)
                <div>
                    <dt class="text-blue-600 dark:text-blue-400">Remaining:</dt>
                    <dd class="text-blue-900 dark:text-blue-100">{{ session('test_result')['remaining'] }}</dd>
                </div>
                @endif
            </dl>
        </div>
    @endif

    <!-- Enabled Features Summary -->
    @if(count($enabledFeatures) > 0)
    <div class="bg-white dark:bg-gray-800 shadow rounded-lg">
        <div class="px-4 py-5 sm:p-6">
            <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">Enabled Features</h3>
            <div class="flex flex-wrap gap-2">
                @foreach($enabledFeatures as $feature)
                    <span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                        {{ $feature }}
                    </span>
                @endforeach
            </div>
        </div>
    </div>
    @endif

    <!-- Feature Status Table -->
    <div class="bg-white dark:bg-gray-800 shadow rounded-lg">
        <div class="px-4 py-5 sm:p-6">
            <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">All Features</h3>
            <div class="overflow-hidden">
                <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead class="bg-gray-50 dark:bg-gray-700">
                        <tr>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Feature</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Type</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Remaining</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        @forelse($featureStatus as $key => $status)
                            <tr>
                                <td class="px-6 py-4 whitespace-nowrap">
                                    <div class="text-sm font-medium text-gray-900 dark:text-white">{{ $status['definition']['name'] ?? $key }}</div>
                                    @if(isset($status['definition']['description']))
                                        <div class="text-sm text-gray-500 dark:text-gray-400">{{ $status['definition']['description'] }}</div>
                                    @endif
                                </td>
                                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                    {{ $status['definition']['type'] ?? 'boolean' }}
                                </td>
                                <td class="px-6 py-4 whitespace-nowrap">
                                    @if($status['enabled'])
                                        <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                                            Enabled
                                        </span>
                                    @else
                                        <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                                            Disabled
                                        </span>
                                    @endif
                                </td>
                                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                    @if($status['remaining'] !== null)
                                        {{ $status['remaining'] }}
                                    @else
                                        <span class="text-gray-400">N/A</span>
                                    @endif
                                </td>
                                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                    <form action="{{ route('admin.features.test') }}" method="POST" class="inline">
                                        @csrf
                                        <input type="hidden" name="feature" value="{{ $key }}">
                                        <button type="submit" class="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300">
                                            Test Access
                                        </button>
                                    </form>
                                </td>
                            </tr>
                        @empty
                            <tr>
                                <td colspan="5" class="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                                    No features configured. Check config/fms.php
                                </td>
                            </tr>
                        @endforelse
                    </tbody>
                </table>
            </div>
        </div>
    </div>
</div>
@endsection

