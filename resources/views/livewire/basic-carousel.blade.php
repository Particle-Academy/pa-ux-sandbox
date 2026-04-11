{{-- Basic Carousel Demo View --}}
{{-- Copy this file to resources/views/livewire/basic-carousel.blade.php --}}

<div class="max-w-4xl mx-auto p-6">
    <flux:heading size="xl" level="1">Basic Carousel</flux:heading>
    <flux:text class="mt-2 mb-6">Simplest usage: pass an array of slides via the data prop.</flux:text>
    
    {{-- One line! All panels, controls, and steps auto-generated --}}
    <flux:carousel :data="$slides" autoplay class="max-w-2xl" />
</div>
