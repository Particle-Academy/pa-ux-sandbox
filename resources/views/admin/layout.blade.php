<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>@yield('title', 'Admin') - {{ config('app.name', 'Laravel') }}</title>
    
    @vite(['resources/css/app.css', 'resources/js/app.js'])
    @stack('styles')
</head>
<body class="bg-gray-50 dark:bg-gray-900">
    <nav class="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="flex justify-between h-16">
                <div class="flex">
                    <div class="flex-shrink-0 flex items-center">
                        <a href="{{ route('admin.dashboard') }}" class="text-xl font-bold text-gray-900 dark:text-white">
                            Admin Panel
                        </a>
                    </div>
                    <div class="hidden sm:ml-6 sm:flex sm:space-x-8">
                        <a href="{{ route('admin.dashboard') }}" class="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-300 dark:hover:text-gray-100 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium {{ request()->routeIs('admin.dashboard') ? 'border-indigo-500 text-gray-900 dark:text-white' : '' }}">
                            Dashboard
                        </a>
                        <a href="{{ route('admin.plans.index') }}" class="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-300 dark:hover:text-gray-100 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium {{ request()->routeIs('admin.plans.*') ? 'border-indigo-500 text-gray-900 dark:text-white' : '' }}">
                            Plans
                        </a>
                        <a href="{{ route('admin.products.index') }}" class="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-300 dark:hover:text-gray-100 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium {{ request()->routeIs('admin.products.*') ? 'border-indigo-500 text-gray-900 dark:text-white' : '' }}">
                            Products
                        </a>
                        <a href="{{ route('admin.features.index') }}" class="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-300 dark:hover:text-gray-100 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium {{ request()->routeIs('admin.features.*') ? 'border-indigo-500 text-gray-900 dark:text-white' : '' }}">
                            Features
                        </a>
                        @if(Route::has('ctrl.products.index'))
                            <a href="{{ route('ctrl.products.index') }}" class="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-300 dark:hover:text-gray-100 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                                Catalog UI
                            </a>
                        @endif
                    </div>
                </div>
                <div class="flex items-center space-x-4">
                    <a href="{{ route('home') }}" class="text-gray-500 hover:text-gray-700 dark:text-gray-300 dark:hover:text-gray-100 text-sm">
                        Storefront
                    </a>
                    <span class="text-gray-700 dark:text-gray-300">{{ Auth::user()->name }}</span>
                    <form method="POST" action="{{ route('logout') }}">
                        @csrf
                        <button type="submit" class="text-gray-500 hover:text-gray-700 dark:text-gray-300 dark:hover:text-gray-100 text-sm">
                            Logout
                        </button>
                    </form>
                </div>
            </div>
        </div>
    </nav>

    <main class="py-10">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            @if (session('success'))
                <div class="mb-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
                    {{ session('success') }}
                </div>
            @endif

            @if (session('error'))
                <div class="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                    {{ session('error') }}
                </div>
            @endif

            @yield('content')
        </div>
    </main>
</body>
</html>

