<div wire:poll.15s="$refresh">
    {{-- Page Header --}}
    <div class="mb-4">
        <h1 class="text-sm-2xl font-bold text-gray-900 dark:text-gray-100">Products</h1>
        <p class="text-sm-sm text-gray-600 dark:text-gray-400">Manage Stripe catalog: Products and their Prices</p>
    </div>

    {{-- Navigation Tabs --}}
    <div class="flex gap-1 mb-4 border-b border-gray-200 dark:border-gray-700">
        @php
            // Use ctrl.products.index for published UI, fallback to config
            $baseRoute = 'ctrl.products.index';
        @endphp
        <a href="{{ route($baseRoute, ['tab' => 'plans']) }}" 
           class="px-4 py-2 border-b-2 {{ $activeTab === 'plans' ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400 font-medium' : 'border-transparent text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600' }}"
           wire:navigate>
            Plans
        </a>
        <a href="{{ route($baseRoute, ['tab' => 'products']) }}" 
           class="px-4 py-2 border-b-2 {{ $activeTab === 'products' ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400 font-medium' : 'border-transparent text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600' }}"
           wire:navigate>
            Products
        </a>
        <a href="{{ route($baseRoute, ['tab' => 'features']) }}" 
           class="px-4 py-2 border-b-2 {{ $activeTab === 'features' ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400 font-medium' : 'border-transparent text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600' }}"
           wire:navigate>
            Features
        </a>
        <a href="{{ route($baseRoute, ['tab' => 'settings']) }}" 
           class="px-4 py-2 border-b-2 {{ $activeTab === 'settings' ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400 font-medium' : 'border-transparent text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600' }}"
           wire:navigate>
            Settings
        </a>
    </div>

    {{-- Action Buttons --}}
    <div class="flex items-center justify-between mb-4">
        <div class="flex items-center gap-2">
            @if($activeTab === 'plans' || $activeTab === 'products')
                <button type="button" class="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded border border-transparent transition-colors" wire:click="openCreateProduct">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
                    </svg>
                    {{ $activeTab === 'plans' ? 'New Plan' : 'New Product' }}
                </button>
            @endif

            <button type="button" class="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 rounded border border-gray-300 dark:border-gray-600 transition-colors" 
                    wire:click="syncAllProducts"
                    wire:loading.attr="disabled"
                    wire:target="syncAllProducts">
                <span wire:loading.remove wire:target="syncAllProducts">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                    </svg>
                    Sync all to Stripe
                </span>
                <span wire:loading wire:target="syncAllProducts" class="flex items-center gap-2">
                    <svg class="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Syncing...
                </span>
            </button>
        </div>
    </div>

    {{-- Flash Messages --}}
    @if(session('error'))
        <div class="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-red-800 dark:text-red-200">
            {{ session('error') }}
        </div>
    @endif

    @if(session('message'))
        <div class="mb-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded text-green-800 dark:text-green-200">
            {{ session('message') }}
        </div>
    @endif

    {{-- Plans Tab (Recurring) --}}
    @if($activeTab === 'plans')
        <div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 mt-4">
            <table class="w-full border-collapse">
                <thead>
                    <tr class="bg-gray-50 dark:bg-gray-900 border-b-2 border-gray-200 dark:border-gray-700">
                        <th class="px-4 py-3 text-left text-xs font-semibold text-gray-900 dark:text-gray-100 uppercase tracking-wider">Name</th>
                        <th class="px-4 py-3 text-left text-xs font-semibold text-gray-900 dark:text-gray-100 uppercase tracking-wider">Description</th>
                        <th class="px-4 py-3 text-left text-xs font-semibold text-gray-900 dark:text-gray-100 uppercase tracking-wider">Plans</th>
                        <th class="px-4 py-3 text-left text-xs font-semibold text-gray-900 dark:text-gray-100 uppercase tracking-wider">Status</th>
                        <th class="px-4 py-3 text-right text-xs font-semibold text-gray-900 dark:text-gray-100 uppercase tracking-wider"></th>
                    </tr>
                </thead>
                <tbody>
                    @forelse($products as $product)
                        <tr class="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-900/50">
                            <td class="px-4 py-3">
                                <div class="font-medium text-gray-900 dark:text-gray-100">{{ $product->name }}</div>
                            </td>
                            <td class="px-4 py-3">
                                @if($product->description)
                                    <div class="text-sm-sm text-gray-600 dark:text-gray-400">{{ Str::limit($product->description, 50) }}</div>
                                @else
                                    <span class="text-sm-sm text-gray-600 dark:text-gray-400">—</span>
                                @endif
                            </td>
                            <td class="px-4 py-3">
                                <span class="text-sm-sm text-gray-900 dark:text-gray-300">{{ $product->prices->count() }} {{ $product->prices->count() === 1 ? 'plan' : 'plans' }}</span>
                            </td>
                            <td class="px-4 py-3">
                                @if($product->active)
                                    <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">Active</span>
                                @else
                                    <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">Inactive</span>
                                @endif

                                <div class="mt-1 text-xs text-gray-600 dark:text-gray-400">
                                    @if($product->isOutOfSync())
                                        <span class="text-sm-amber-600 dark:text-amber-400">Out of sync with Stripe</span>
                                    @elseif($product->last_synced_at)
                                        <span class="dark:text-gray-400">Synced {{ $product->last_synced_at->diffForHumans() }}</span>
                                    @else
                                        <span class="dark:text-gray-400">Not yet synced</span>
                                    @endif
                                </div>
                            </td>
                            <td class="px-4 py-3 text-right">
                                <div class="flex items-center justify-end gap-2">
                                    <button type="button" class="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 rounded border border-gray-300 dark:border-gray-600 transition-colors"
                                            wire:click="syncProductNow('{{ $product->id }}')"
                                            wire:loading.attr="disabled"
                                            wire:target="syncProductNow">
                                        <span wire:loading.remove wire:target="syncProductNow">Sync</span>
                                        <span wire:loading wire:target="syncProductNow" class="flex items-center gap-2">
                                            <svg class="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                                                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            Queued...
                                        </span>
                                    </button>
                                    <button type="button" class="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 rounded border border-gray-300 dark:border-gray-600 transition-colors" wire:click="openEditProduct('{{ $product->id }}')">
                                        Edit
                                    </button>
                                </div>
                            </td>
                        </tr>
                    @empty
                        <tr>
                            <td colspan="5" class="px-4 py-8 text-center text-gray-600 dark:text-gray-400">No plans found.</td>
                        </tr>
                    @endforelse
                </tbody>
            </table>
            <div class="mt-4">
                {{ $products->links() }}
            </div>
        </div>
    @endif

    {{-- Products Tab (One-time) --}}
    @if($activeTab === 'products')
        <div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 mt-4">
            <table class="w-full border-collapse">
                <thead>
                    <tr class="bg-gray-50 dark:bg-gray-900 border-b-2 border-gray-200 dark:border-gray-700">
                        <th class="px-4 py-3 text-left text-xs font-semibold text-gray-900 dark:text-gray-100 uppercase tracking-wider">Name</th>
                        <th class="px-4 py-3 text-left text-xs font-semibold text-gray-900 dark:text-gray-100 uppercase tracking-wider">Description</th>
                        <th class="px-4 py-3 text-left text-xs font-semibold text-gray-900 dark:text-gray-100 uppercase tracking-wider">Prices</th>
                        <th class="px-4 py-3 text-left text-xs font-semibold text-gray-900 dark:text-gray-100 uppercase tracking-wider">Status</th>
                        <th class="px-4 py-3 text-right text-xs font-semibold text-gray-900 dark:text-gray-100 uppercase tracking-wider"></th>
                    </tr>
                </thead>
                <tbody>
                    @forelse($products as $product)
                        <tr class="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-900/50">
                            <td class="px-4 py-3">
                                <div class="font-medium text-gray-900 dark:text-gray-100">{{ $product->name }}</div>
                            </td>
                            <td class="px-4 py-3">
                                @if($product->description)
                                    <div class="text-sm-sm text-gray-600 dark:text-gray-400">{{ Str::limit($product->description, 50) }}</div>
                                @else
                                    <span class="text-sm-sm text-gray-600 dark:text-gray-400">—</span>
                                @endif
                            </td>
                            <td class="px-4 py-3">
                                <span class="text-sm-sm text-gray-900 dark:text-gray-300">{{ $product->prices->count() }} {{ $product->prices->count() === 1 ? 'price' : 'prices' }}</span>
                            </td>
                            <td class="px-4 py-3">
                                @if($product->active)
                                    <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">Active</span>
                                @else
                                    <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">Inactive</span>
                                @endif

                                <div class="mt-1 text-xs text-gray-600 dark:text-gray-400">
                                    @if($product->isOutOfSync())
                                        <span class="text-sm-amber-600 dark:text-amber-400">Out of sync with Stripe</span>
                                    @elseif($product->last_synced_at)
                                        <span class="dark:text-gray-400">Synced {{ $product->last_synced_at->diffForHumans() }}</span>
                                    @else
                                        <span class="dark:text-gray-400">Not yet synced</span>
                                    @endif
                                </div>
                            </td>
                            <td class="px-4 py-3 text-right">
                                <div class="flex items-center justify-end gap-2">
                                    <button type="button" class="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 rounded border border-gray-300 dark:border-gray-600 transition-colors"
                                            wire:click="syncProductNow('{{ $product->id }}')"
                                            wire:loading.attr="disabled"
                                            wire:target="syncProductNow">
                                        <span wire:loading.remove wire:target="syncProductNow">Sync</span>
                                        <span wire:loading wire:target="syncProductNow" class="flex items-center gap-2">
                                            <svg class="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                                                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            Queued...
                                        </span>
                                    </button>
                                    <button type="button" class="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 rounded border border-gray-300 dark:border-gray-600 transition-colors" wire:click="openEditProduct('{{ $product->id }}')">
                                        Edit
                                    </button>
                                </div>
                            </td>
                        </tr>
                    @empty
                        <tr>
                            <td colspan="5" class="px-4 py-8 text-center text-gray-600 dark:text-gray-400">No products found.</td>
                        </tr>
                    @endforelse
                </tbody>
            </table>
            <div class="mt-4">
                {{ $products->links() }}
            </div>
        </div>
    @endif

    {{-- Features Tab --}}
    @if($activeTab === 'features')
        <div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 mt-4">
            <div class="flex items-center justify-between mb-4">
                <div>
                    <h2 class="text-sm-lg font-semibold text-gray-900 dark:text-gray-100">Feature Catalog</h2>
                    <p class="text-sm-sm text-gray-600 dark:text-gray-400">
                        Configure system-wide defaults for FMS product features.
                    </p>
                </div>
                <button type="button" class="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded border border-transparent transition-colors" 
                        wire:click="saveCatalogFeatures" 
                        wire:loading.attr="disabled">
                    Save defaults
                </button>
            </div>

            <table class="w-full border-collapse">
                <thead>
                    <tr class="bg-gray-50 dark:bg-gray-900 border-b-2 border-gray-200 dark:border-gray-700">
                        <th class="px-4 py-3 text-left text-xs font-semibold text-gray-900 dark:text-gray-100 uppercase tracking-wider">Key</th>
                        <th class="px-4 py-3 text-left text-xs font-semibold text-gray-900 dark:text-gray-100 uppercase tracking-wider">Name</th>
                        <th class="px-4 py-3 text-left text-xs font-semibold text-gray-900 dark:text-gray-100 uppercase tracking-wider">Type</th>
                        <th class="px-4 py-3 text-left text-xs font-semibold text-gray-900 dark:text-gray-100 uppercase tracking-wider">Default Enabled</th>
                        <th class="px-4 py-3 text-left text-xs font-semibold text-gray-900 dark:text-gray-100 uppercase tracking-wider">Defaults</th>
                    </tr>
                </thead>
                <tbody>
                    @forelse($catalogFeatureSettings as $featureId => $feature)
                        <tr class="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-900/50">
                            <td class="px-4 py-3 font-mono text-xs text-gray-900 dark:text-gray-100">
                                {{ $feature['key'] ?? $featureId }}
                            </td>
                            <td class="px-4 py-3">
                                <input type="text" 
                                       class="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                       wire:model="catalogFeatureSettings.{{ $featureId }}.name" />
                            </td>
                            <td class="px-4 py-3">
                                @php
                                    $featureType = $feature['type'] ?? 'boolean';
                                    $isResource = $featureType === 'resource';
                                @endphp
                                <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium {{ $isResource ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300' }}">
                                    {{ ucfirst($featureType) }}
                                </span>
                            </td>
                            <td class="px-4 py-3">
                                <label class="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" 
                                           class="sr-only peer"
                                           wire:model.live="catalogFeatureSettings.{{ $featureId }}.default_enabled" />
                                    <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                                </label>
                            </td>
                            <td class="px-4 py-3">
                                @if($isResource)
                                    <div class="flex gap-3">
                                        <div>
                                            <label class="block text-xs text-gray-700 dark:text-gray-300 mb-1">Included</label>
                                            <input type="number" 
                                                   min="0" 
                                                   class="w-24 px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                   wire:model="catalogFeatureSettings.{{ $featureId }}.default_included_quantity" />
                                        </div>
                                        <div>
                                            <label class="block text-xs text-gray-700 dark:text-gray-300 mb-1">Overage</label>
                                            <input type="number" 
                                                   min="0" 
                                                   class="w-24 px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                   wire:model="catalogFeatureSettings.{{ $featureId }}.default_overage_limit" />
                                        </div>
                                    </div>
                                @else
                                    <span class="text-sm-xs text-gray-600 dark:text-gray-400">No limits for boolean features.</span>
                                @endif
                            </td>
                        </tr>
                    @empty
                        <tr>
                            <td colspan="5" class="px-4 py-8 text-center text-gray-600 dark:text-gray-400">
                                No Product Features found. Define them in code to configure catalog defaults.
                            </td>
                        </tr>
                    @endforelse
                </tbody>
            </table>
        </div>
    @endif

    {{-- Settings Tab --}}
    @if($activeTab === 'settings')
        <div class="space-y-6">
            {{-- Storefront Plans --}}
            <div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 mt-4">
                <div class="flex items-center justify-between mb-4">
                    <div>
                        <h2 class="text-sm-lg font-semibold text-gray-900 dark:text-gray-100">Storefront Plans</h2>
                        <p class="text-sm-sm text-gray-600 dark:text-gray-400">
                            Choose which recurring products appear on the public Plans page and which one is recommended.
                        </p>
                    </div>
                    <button type="button" class="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded border border-transparent transition-colors" 
                            wire:click="saveStorefrontSettings" 
                            wire:loading.attr="disabled">
                        Save storefront settings
                    </button>
                </div>

                <table class="w-full border-collapse">
                    <thead>
                        <tr class="bg-gray-50 dark:bg-gray-900 border-b-2 border-gray-200 dark:border-gray-700">
                            <th class="px-4 py-3 text-left text-xs font-semibold text-gray-900 dark:text-gray-100 uppercase tracking-wider">Plan</th>
                            <th class="px-4 py-3 text-left text-xs font-semibold text-gray-900 dark:text-gray-100 uppercase tracking-wider">Visibility</th>
                            <th class="px-4 py-3 text-left text-xs font-semibold text-gray-900 dark:text-gray-100 uppercase tracking-wider">Recommended</th>
                        </tr>
                    </thead>
                    <tbody>
                        @php $allProducts = ($allProducts ?? $products); @endphp
                        @forelse($storefrontPlans as $productId => $settings)
                            @php $product = $allProducts->firstWhere('id', $productId); @endphp
                            @if($product)
                                <tr class="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-900/50">
                                    <td class="px-4 py-3">
                                        <div class="flex flex-col text-sm">
                                            <span class="font-medium text-gray-900 dark:text-gray-100">{{ $product->name }}</span>
                                            <span class="text-sm-xs text-gray-600 dark:text-gray-400">{{ $product->description }}</span>
                                        </div>
                                    </td>
                                    <td class="px-4 py-3">
                                        <label class="relative inline-flex items-center cursor-pointer">
                                            <input type="checkbox" 
                                                   class="sr-only peer"
                                                   wire:model.live="storefrontPlans.{{ $productId }}.show" />
                                            <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                                        </label>
                                        <span class="text-sm-xs text-gray-600 dark:text-gray-400 ml-2">Show on Plans page</span>
                                    </td>
                                    <td class="px-4 py-3">
                                        <label class="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                                            <input type="radio" 
                                                   class="accent-blue-500 dark:accent-blue-400"
                                                   wire:model="recommendedPlanProductId"
                                                   value="{{ $productId }}" />
                                            <span>Recommended plan</span>
                                        </label>
                                    </td>
                                </tr>
                            @endif
                        @empty
                            <tr>
                                <td colspan="3" class="px-4 py-8 text-center text-gray-600 dark:text-gray-400 text-sm">
                                    No recurring products found. Create a plan in the Plans tab first.
                                </td>
                            </tr>
                        @endforelse
                    </tbody>
                </table>
            </div>

            {{-- Storefront Add-ons --}}
            <div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 mt-4">
                <div class="mb-4">
                    <h2 class="text-sm-lg font-semibold text-gray-900 dark:text-gray-100">Storefront Add-ons</h2>
                    <p class="text-sm-sm text-gray-600 dark:text-gray-400">
                        Control which one-time products are offered as optional add-ons.
                    </p>
                </div>

                <table class="w-full border-collapse">
                    <thead>
                        <tr class="bg-gray-50 dark:bg-gray-900 border-b-2 border-gray-200 dark:border-gray-700">
                            <th class="px-4 py-3 text-left text-xs font-semibold text-gray-900 dark:text-gray-100 uppercase tracking-wider">Add-on</th>
                            <th class="px-4 py-3 text-left text-xs font-semibold text-gray-900 dark:text-gray-100 uppercase tracking-wider">Visibility</th>
                        </tr>
                    </thead>
                    <tbody>
                        @forelse($storefrontAddons as $productId => $settings)
                            @php $product = $allProducts->firstWhere('id', $productId); @endphp
                            @if($product)
                                <tr class="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-900/50">
                                    <td class="px-4 py-3">
                                        <div class="flex flex-col text-sm">
                                            <span class="font-medium text-gray-900 dark:text-gray-100">{{ $product->name }}</span>
                                            <span class="text-sm-xs text-gray-600 dark:text-gray-400">{{ $product->description }}</span>
                                        </div>
                                    </td>
                                    <td class="px-4 py-3">
                                        <label class="relative inline-flex items-center cursor-pointer">
                                            <input type="checkbox" 
                                                   class="sr-only peer"
                                                   wire:model.live="storefrontAddons.{{ $productId }}.show" />
                                            <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                                        </label>
                                        <span class="text-sm-xs text-gray-600 dark:text-gray-400 ml-2">Show as add-on</span>
                                    </td>
                                </tr>
                            @endif
                        @empty
                            <tr>
                                <td colspan="2" class="px-4 py-8 text-center text-gray-600 dark:text-gray-400 text-sm">
                                    No one-time products found. Create products with one-time prices in the Products tab.
                                </td>
                            </tr>
                        @endforelse
                    </tbody>
                </table>
            </div>
        </div>
    @endif

    {{-- Product Modal --}}
    @if($showCreateProduct)
        <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" wire:click="$set('showCreateProduct', false)">
            <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col" wire:click.stop>
                <div class="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                    <h2 class="text-sm-xl font-bold text-gray-900 dark:text-gray-100">{{ $editingProductId ? 'Edit Product' : 'Add a product' }}</h2>
                    <button type="button" class="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 rounded border border-gray-300 dark:border-gray-600 transition-colors" wire:click="$set('showCreateProduct', false)" aria-label="Close">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                    </button>
                </div>

                <div class="px-6 py-4 overflow-y-auto flex-1">
                    {{-- Tabs --}}
                    <div class="flex gap-1 mb-4 border-b border-gray-200 dark:border-gray-700">
                        <button type="button" 
                                class="px-4 py-2 border-b-2 {{ $productTab === 'details' ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400 font-medium' : 'border-transparent text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600' }}"
                                wire:click="$set('productTab', 'details')">
                            Details
                        </button>
                        <button type="button" 
                                class="px-4 py-2 border-b-2 {{ $productTab === 'pricing' ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400 font-medium' : 'border-transparent text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600' }}"
                                wire:click="$set('productTab', 'pricing')">
                            Pricing
                        </button>
                    </div>

                    {{-- Details Tab --}}
                    @if($productTab === 'details')
                        <div class="space-y-6">
                            <div>
                                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name <span class="text-sm-red-500 dark:text-red-400">*</span></label>
                                <input type="text" 
                                       class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                                       wire:model="productName" 
                                       placeholder="e.g., Pro Plan" />
                                @error('productName') <span class="text-sm-sm text-red-600 dark:text-red-400">{{ $message }}</span> @enderror
                                <span class="text-sm-xs text-gray-600 dark:text-gray-400 mt-1 block">Name of the product or service, visible to customers.</span>
                            </div>

                            <div>
                                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                                <textarea class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                                          wire:model="productDescription" 
                                          rows="4" 
                                          placeholder="Describe what this product includes..."></textarea>
                                @error('productDescription') <span class="text-sm-sm text-red-600 dark:text-red-400">{{ $message }}</span> @enderror
                                <span class="text-sm-xs text-gray-600 dark:text-gray-400 mt-1 block">Appears at checkout, on the customer portal, and in quotes.</span>
                            </div>

                            <div class="">
                                <label class="label">Image</label>
                                <div class="space-y-2">
                                    @forelse($productImages as $index => $image)
                                        <div class="flex items-center gap-2">
                                            <input type="url" 
                                                   class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 flex-1" 
                                                   wire:model="productImages.{{ $index }}" 
                                                   placeholder="https://example.com/image.jpg" />
                                            <button type="button" 
                                                    class="inline-flex items-center gap-2 inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 rounded border border-gray-300 dark:border-gray-600 transition-colors px-3 py-1.5 text-sm" 
                                                    wire:click="removeImage({{ $index }})">
                                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                                                </svg>
                                            </button>
                                        </div>
                                    @empty
                                        <button type="button" 
                                                class="inline-flex items-center gap-2 inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 rounded border border-gray-300 dark:border-gray-600 transition-colors px-3 py-1.5 text-sm" 
                                                wire:click="addImage">
                                            Upload
                                        </button>
                                    @endforelse
                                    @if(count($productImages) > 0 && count($productImages) < 8)
                                        <button type="button" 
                                                class="inline-flex items-center gap-2 inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 rounded border border-gray-300 dark:border-gray-600 transition-colors px-3 py-1.5 text-sm" 
                                                wire:click="addImage">
                                            Add another image
                                        </button>
                                    @endif
                                </div>
                                @error('productImages') <span class="error">{{ $message }}</span> @enderror
                                <span class="description">Appears at checkout. JPEG, PNG, or WEBP under 2MB.</span>
                            </div>

                            {{-- More Options --}}
                            <details class="group">
                                <summary class="cursor-pointer text-sm font-medium text-gray-900 dark:text-gray-100">More options</summary>
                                <div class="mt-4 space-y-4">
                                    <div class="">
                                        <label class="relative inline-flex items-center cursor-pointer">
                                            <input type="checkbox" wire:model.live="productActive" />
                                            <span class="relative inline-flex items-center cursor-pointer-slider"></span>
                                        </label>
                                        <span class="label">Active</span>
                                        @error('productActive') <span class="error">{{ $message }}</span> @enderror
                                        <span class="description">Whether this product is available for purchase</span>
                                    </div>

                                    <div class="">
                                        <label class="label">Statement Descriptor</label>
                                        <input type="text" 
                                               class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                                               wire:model="productStatementDescriptor" 
                                               maxlength="22" 
                                               placeholder="e.g., PRO PLAN" />
                                        @error('productStatementDescriptor') <span class="error">{{ $message }}</span> @enderror
                                        <span class="description">Appears on customer's credit card statement (max 22 characters)</span>
                                    </div>

                                    <div class="">
                                        <label class="label">Unit Label</label>
                                        <input type="text" 
                                               class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                                               wire:model="productUnitLabel" 
                                               maxlength="12" 
                                               placeholder="e.g., seat, license" />
                                        @error('productUnitLabel') <span class="error">{{ $message }}</span> @enderror
                                        <span class="description">Label for the unit of measurement (max 12 characters)</span>
                                    </div>

                                    <div class="">
                                        <label class="label">Display Order</label>
                                        <input type="number" 
                                               class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                                               wire:model="productOrder" 
                                               min="0" />
                                        @error('productOrder') <span class="error">{{ $message }}</span> @enderror
                                        <span class="description">Lower numbers appear first in listings</span>
                                    </div>

                                    <div class="">
                                        <label class="label">Metadata</label>
                                        <div class="space-y-2">
                                            @forelse($productMetadataKeys as $index => $key)
                                                <div class="grid grid-cols-2 gap-2">
                                                    <input type="text" 
                                                           class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                                                           wire:model="productMetadataKeys.{{ $index }}" 
                                                           placeholder="Key" />
                                                    <div class="flex items-center gap-2">
                                                        <input type="text" 
                                                               class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                                                               wire:model="productMetadataValues.{{ $index }}" 
                                                               placeholder="Value" />
                                                        <button type="button" 
                                                                class="inline-flex items-center gap-2 inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 rounded border border-gray-300 dark:border-gray-600 transition-colors px-3 py-1.5 text-sm" 
                                                                wire:click="removeMetadata({{ $index }})">
                                                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                                                            </svg>
                                                        </button>
                                                    </div>
                                                </div>
                                            @empty
                                                <span class="text-sm text-sm text-gray-600 dark:text-gray-400 dark:text-gray-400">No metadata added</span>
                                            @endforelse
                                            <button type="button" 
                                                    class="inline-flex items-center gap-2 inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 rounded border border-gray-300 dark:border-gray-600 transition-colors px-3 py-1.5 text-sm" 
                                                    wire:click="addMetadata">
                                                Add Metadata
                                            </button>
                                        </div>
                                        <span class="description">Custom key-value pairs for storing additional data</span>
                                    </div>
                                </div>
                            </details>
                        </div>
                    @endif

                    {{-- Pricing Tab --}}
                    @if($productTab === 'pricing')
                        <div class="space-y-4">
                            <div class="flex items-center justify-between">
                                <div>
                                    <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100 text-lg font-semibold text-gray-900 dark:text-gray-100">Pricing</h3>
                                    <p class="text-sm text-sm text-gray-600 dark:text-gray-400 dark:text-gray-400">
                                        Manage all prices for this product. A product can have multiple active prices (monthly, yearly, usage-based, etc.).
                                    </p>
                                </div>
                                <button type="button" 
                                        class="inline-flex items-center gap-2 inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded border border-transparent transition-colors px-3 py-1.5 text-sm" 
                                        wire:click="startCreatePriceDraft">
                                    Add price
                                </button>
                            </div>

                            @forelse($productPrices as $index => $price)
                                <div class="flex items-center justify-between rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-4 py-3 text-sm">
                                    <div class="flex flex-col gap-1">
                                        <div class="flex items-center gap-2">
                                            <span class="font-medium text-gray-900 dark:text-gray-100">
                                                ${{ number_format($price['unit_amount_dollars'], 2) }} {{ $price['currency'] }}
                                            </span>
                                            @if(($price['type'] ?? null) === \LaravelCatalog\Models\Price::TYPE_RECURRING)
                                                <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">Recurring / {{ $price['recurring_interval'] }}</span>
                                            @else
                                                <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">One-off</span>
                                            @endif
                                            @if(!empty($price['lookup_key']))
                                                <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">lookup: {{ $price['lookup_key'] }}</span>
                                            @endif
                                        </div>
                                        <div class="flex gap-2 text-xs text-gray-600 dark:text-gray-400 dark:text-gray-400">
                                            @if(!empty($price['nickname']))
                                                <span>{{ $price['nickname'] }}</span>
                                            @endif
                                            <span>Billing scheme: {{ $price['billing_scheme'] ?? 'per_unit' }}</span>
                                            <span>Status: {{ !empty($price['active']) ? 'Active' : 'Inactive' }}</span>
                                        </div>
                                    </div>
                                    <div class="flex items-center gap-2">
                                        <button type="button" 
                                                class="inline-flex items-center gap-2 inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 rounded border border-gray-300 dark:border-gray-600 transition-colors px-2 py-1 text-xs" 
                                                wire:click="startEditPriceDraft({{ $index }})">
                                            Edit
                                        </button>
                                        <button type="button" 
                                                class="inline-flex items-center gap-2 inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 rounded border border-gray-300 dark:border-gray-600 transition-colors px-2 py-1 text-xs" 
                                                wire:click="removePriceDraft({{ $index }})">
                                            Remove
                                        </button>
                                    </div>
                                </div>
                            @empty
                                <div class="rounded-lg border border-dashed border-zinc-300 dark:border-zinc-700 p-6 text-center">
                                    <span class="text-sm text-sm text-gray-600 dark:text-gray-400 dark:text-gray-400">
                                        No prices yet. Click "Add price" to create a pricing model for this product.
                                    </span>
                                </div>
                            @endforelse
                        </div>
                    @endif
                </div>

                <div class="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between gap-2">
                    <div class="flex items-center justify-between gap-2">
                        <div>
                            @if($editingProductId)
                                <button type="button" 
                                        class="inline-flex items-center gap-2 inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 rounded border border-gray-300 dark:border-gray-600 transition-colors text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300" 
                                        wire:click="confirmDeleteProduct"
                                        wire:loading.attr="disabled">
                                    Delete
                                </button>
                            @endif
                        </div>
                        <div class="flex items-center gap-2">
                            <button type="button" 
                                    class="inline-flex items-center gap-2 inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 rounded border border-gray-300 dark:border-gray-600 transition-colors" 
                                    wire:click="$set('showCreateProduct', false)" 
                                    wire:loading.attr="disabled">
                                Cancel
                            </button>
                            <button type="button" 
                                    class="inline-flex items-center gap-2 inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded border border-transparent transition-colors" 
                                    wire:click="saveProduct" 
                                    wire:loading.attr="disabled" 
                                    wire:target="saveProduct">
                                <span wire:loading.remove wire:target="saveProduct">{{ $editingProductId ? 'Save Product' : 'Add product' }}</span>
                                <span wire:loading wire:target="saveProduct" class="flex items-center gap-2">
                                    <span class="animate-spin h-4 w-4"></span>
                                    Saving...
                                </span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    @endif

    {{-- Delete Confirmation Modal --}}
    @if($showDeleteConfirm)
        <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" wire:click="cancelDeleteProduct">
            <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full" wire:click.stop style="max-width: 28rem;">
                <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full-body">
                    <div class="space-y-4">
                        <h2 class="text-lg font-semibold text-gray-900 dark:text-gray-100 text-xl font-bold">Delete Product</h2>
                        <p class="text-sm">
                            Are you sure you want to delete "{{ $productName }}"? This action cannot be undone. All associated prices will also be archived.
                        </p>
                        <div class="flex justify-end gap-2">
                            <button type="button" 
                                    class="inline-flex items-center gap-2 inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 rounded border border-gray-300 dark:border-gray-600 transition-colors" 
                                    wire:click="cancelDeleteProduct" 
                                    wire:loading.attr="disabled">
                                Cancel
                            </button>
                            <button type="button" 
                                    class="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded border border-transparent transition-colors" 
                                    wire:click="deleteProduct" 
                                    wire:loading.attr="disabled" 
                                    wire:target="deleteProduct">
                                <span wire:loading.remove wire:target="deleteProduct">Delete</span>
                                <span wire:loading wire:target="deleteProduct" class="flex items-center gap-2">
                                    <span class="animate-spin h-4 w-4"></span>
                                    Deleting...
                                </span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    @endif

    {{-- Note: Price Modal and Pricing Model Modal are complex and would require the Livewire component class to be available --}}
    {{-- These will need to be completed once the component class structure is confirmed --}}
</div>

