<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ShopItem;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class AdminShopController extends Controller
{
    public function index(): \Illuminate\Contracts\View\View
    {
        $items = ShopItem::query()
            ->orderBy('kind')
            ->orderBy('order')
            ->orderBy('name')
            ->withCount('purchases')
            ->paginate(50);

        return view('admin.shop.index', [
            'items' => $items,
        ]);
    }

    public function create(): \Illuminate\Contracts\View\View
    {
        return view('admin.shop.create');
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $this->validateItem($request);

        ShopItem::create($this->itemPayload($validated));

        return redirect()->route('admin.shop.index')->with('success', 'Shop item created.');
    }

    public function edit(ShopItem $shop): \Illuminate\Contracts\View\View
    {
        return view('admin.shop.edit', ['item' => $shop]);
    }

    public function update(Request $request, ShopItem $shop): RedirectResponse
    {
        $validated = $this->validateItem($request, $shop);

        $shop->update($this->itemPayload($validated));

        return redirect()->route('admin.shop.index')->with('success', 'Shop item updated.');
    }

    public function destroy(ShopItem $shop): RedirectResponse
    {
        // We keep purchase history forever; flip active off instead of
        // deleting so foreign-key references stay valid.
        $shop->update(['active' => false]);

        return redirect()->route('admin.shop.index')->with('success', 'Shop item archived (set inactive).');
    }

    public function toggle(ShopItem $shop): RedirectResponse
    {
        $shop->update(['active' => ! $shop->active]);

        return back()->with('success', $shop->active ? 'Item activated.' : 'Item deactivated.');
    }

    /**
     * @return array<string, mixed>
     */
    protected function validateItem(Request $request, ?ShopItem $existing = null): array
    {
        return $request->validate([
            'slug' => ['required', 'string', 'max:80', 'regex:/^[a-z0-9\-]+$/', $existing
                ? "unique:shop_items,slug,{$existing->id}"
                : 'unique:shop_items,slug',
            ],
            'name' => 'required|string|max:255',
            'description' => 'nullable|string|max:2000',
            'kind' => 'required|in:cosmetic,service',
            'price' => 'required|integer|min:0',
            'active' => 'sometimes|boolean',
            'order' => 'sometimes|integer|min:0',
            // For cosmetics
            'slot' => 'nullable|string|max:80',
            'value' => 'nullable|string|max:80',
            // For services
            'service' => 'nullable|string|max:80',
            'duration_days' => 'nullable|integer|min:1|max:365',
        ]);
    }

    /**
     * @param  array<string, mixed>  $validated
     * @return array<string, mixed>
     */
    protected function itemPayload(array $validated): array
    {
        $metadata = [];
        if ($validated['kind'] === 'cosmetic') {
            if (! empty($validated['slot'])) {
                $metadata['slot'] = $validated['slot'];
            }
            if (! empty($validated['value'])) {
                $metadata['value'] = $validated['value'];
            }
        }
        if ($validated['kind'] === 'service') {
            if (! empty($validated['service'])) {
                $metadata['service'] = $validated['service'];
            }
            if (! empty($validated['duration_days'])) {
                $metadata['duration_days'] = (int) $validated['duration_days'];
            }
        }

        return [
            'slug' => $validated['slug'],
            'name' => $validated['name'],
            'description' => $validated['description'] ?? null,
            'kind' => $validated['kind'],
            'price' => (int) $validated['price'],
            'active' => (bool) ($validated['active'] ?? true),
            'order' => (int) ($validated['order'] ?? 0),
            'metadata' => $metadata ?: null,
        ];
    }
}
