{{-- Color Picker Examples Demo View --}}
{{-- Copy this file to resources/views/livewire/color-picker-examples.blade.php --}}

<div class="max-w-4xl mx-auto p-6 space-y-8">
    <flux:heading size="xl" level="1">Color Picker Examples</flux:heading>
    
    {{-- Basic Usage --}}
    <flux:card>
        <flux:heading size="lg">Basic Usage</flux:heading>
        <flux:text class="mt-1 mb-4">Simple color picker with label.</flux:text>
        <div class="space-y-4">
            <flux:color-picker label="Primary Color" wire:model="primaryColor" />
            <flux:color-picker label="Secondary Color" wire:model="secondaryColor" />
        </div>
    </flux:card>
    
    {{-- Size Variants --}}
    <flux:card>
        <flux:heading size="lg">Size Variants</flux:heading>
        <flux:text class="mt-1 mb-4">Three size options: sm, default, and lg.</flux:text>
        <div class="space-y-4">
            <flux:color-picker label="Small" size="sm" wire:model="smallColor" />
            <flux:color-picker label="Default" wire:model="defaultColor" />
            <flux:color-picker label="Large" size="lg" wire:model="largeColor" />
        </div>
    </flux:card>
    
    {{-- Style Variants --}}
    <flux:card>
        <flux:heading size="lg">Style Variants</flux:heading>
        <flux:text class="mt-1 mb-4">Outline (default) and filled variants.</flux:text>
        <div class="space-y-4">
            <flux:color-picker label="Outline" variant="outline" wire:model="outlineColor" />
            <flux:color-picker label="Filled" variant="filled" wire:model="filledColor" />
        </div>
    </flux:card>
    
    {{-- Custom Presets --}}
    <flux:card>
        <flux:heading size="lg">Custom Presets</flux:heading>
        <flux:text class="mt-1 mb-4">Provide custom preset colors for quick selection.</flux:text>
        <flux:color-picker 
            label="Brand Colors" 
            wire:model="brandColor"
            :presets="['3b82f6', '8b5cf6', 'ec4899', 'ef4444', 'f59e0b', '10b981']"
        />
    </flux:card>
    
    {{-- Without Label --}}
    <flux:card>
        <flux:heading size="lg">Standalone</flux:heading>
        <flux:text class="mt-1 mb-4">Use without a label.</flux:text>
        <flux:color-picker wire:model="standaloneColor" />
    </flux:card>
</div>
