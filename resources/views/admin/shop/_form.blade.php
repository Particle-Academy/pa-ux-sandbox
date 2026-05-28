@php
    /** @var \App\Models\ShopItem|null $item */
    $item = $item ?? null;
    $slot = old('slot', $item?->metadata['slot'] ?? '');
    $value = old('value', $item?->metadata['value'] ?? '');
    $service = old('service', $item?->metadata['service'] ?? '');
    $durationDays = old('duration_days', $item?->metadata['duration_days'] ?? '');
@endphp

@if ($errors->any())
    <div class="mb-4 rounded bg-red-100 px-4 py-3 text-red-700">
        <ul class="list-disc pl-5 text-sm">
            @foreach ($errors->all() as $error)
                <li>{{ $error }}</li>
            @endforeach
        </ul>
    </div>
@endif

<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
    <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Slug</label>
        <input name="slug" value="{{ old('slug', $item?->slug) }}" required pattern="[a-z0-9\-]+"
               class="mt-1 block w-full rounded border-gray-300 shadow-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white" />
    </div>
    <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Name</label>
        <input name="name" value="{{ old('name', $item?->name) }}" required
               class="mt-1 block w-full rounded border-gray-300 shadow-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white" />
    </div>
    <div class="sm:col-span-2">
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
        <textarea name="description" rows="2"
                  class="mt-1 block w-full rounded border-gray-300 shadow-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white">{{ old('description', $item?->description) }}</textarea>
    </div>
    <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Kind</label>
        <select name="kind" id="kind" required
                class="mt-1 block w-full rounded border-gray-300 shadow-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white">
            <option value="cosmetic" @selected(old('kind', $item?->kind) === 'cosmetic')>Cosmetic</option>
            <option value="service" @selected(old('kind', $item?->kind) === 'service')>Service</option>
        </select>
    </div>
    <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Price (coins)</label>
        <input name="price" type="number" min="0" value="{{ old('price', $item?->price) }}" required
               class="mt-1 block w-full rounded border-gray-300 shadow-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white" />
    </div>
    <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Order</label>
        <input name="order" type="number" min="0" value="{{ old('order', $item?->order ?? 0) }}"
               class="mt-1 block w-full rounded border-gray-300 shadow-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white" />
    </div>
    <div class="flex items-center">
        <input id="active" name="active" type="checkbox" value="1" @checked(old('active', $item?->active ?? true))
               class="h-4 w-4 rounded border-gray-300 text-indigo-600" />
        <label for="active" class="ml-2 text-sm text-gray-700 dark:text-gray-300">Active</label>
    </div>
</div>

<fieldset id="cosmetic-fields" class="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
    <legend class="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Cosmetic metadata</legend>
    <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Slot</label>
        <input name="slot" value="{{ $slot }}" placeholder="avatar-frame, name-color, banner"
               class="mt-1 block w-full rounded border-gray-300 shadow-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white" />
    </div>
    <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Value</label>
        <input name="value" value="{{ $value }}" placeholder="gold, rainbow, sunset"
               class="mt-1 block w-full rounded border-gray-300 shadow-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white" />
    </div>
</fieldset>

<fieldset id="service-fields" class="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
    <legend class="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Service metadata</legend>
    <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Service handler</label>
        <input name="service" value="{{ $service }}" placeholder="featured-showcase"
               class="mt-1 block w-full rounded border-gray-300 shadow-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white" />
    </div>
    <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Duration (days)</label>
        <input name="duration_days" type="number" min="1" max="365" value="{{ $durationDays }}"
               class="mt-1 block w-full rounded border-gray-300 shadow-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white" />
    </div>
</fieldset>

<script>
    // Show/hide kind-specific field groups based on the kind dropdown.
    const kindSelect = document.getElementById('kind');
    const cosmeticGroup = document.getElementById('cosmetic-fields');
    const serviceGroup = document.getElementById('service-fields');
    function syncKind() {
        cosmeticGroup.style.display = kindSelect.value === 'cosmetic' ? '' : 'none';
        serviceGroup.style.display = kindSelect.value === 'service' ? '' : 'none';
    }
    kindSelect.addEventListener('change', syncKind);
    syncKind();
</script>
