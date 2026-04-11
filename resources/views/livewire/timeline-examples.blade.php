<div class="max-w-4xl mx-auto p-6 space-y-12">
    <flux:heading size="xl" level="1">Timeline Examples</flux:heading>
    <flux:text class="text-zinc-600 dark:text-zinc-400">
        A lightweight timeline component with stacked, alternating, and horizontal layouts.
    </flux:text>

    {{-- Horizontal --}}
    <flux:card>
        <flux:heading size="lg">Horizontal Layout</flux:heading>
        <flux:text class="mt-1 mb-6">Scrollable horizontal timeline. Great for roadmaps and milestones.</flux:text>
        <flux:timeline :events="$companyTimeline" variant="horizontal" />
    </flux:card>

    {{-- Horizontal Minimal --}}
    <flux:card>
        <flux:heading size="lg">Horizontal Minimal</flux:heading>
        <flux:text class="mt-1 mb-6">Simple horizontal timeline with just dates and titles.</flux:text>
        <flux:timeline :events="$simpleEvents" variant="horizontal" />
    </flux:card>

    {{-- Stacked (Default) --}}
    <flux:card>
        <flux:heading size="lg">Stacked Layout (Default)</flux:heading>
        <flux:text class="mt-1 mb-6">Events displayed vertically with icons, emojis, and color accents.</flux:text>
        <flux:timeline :events="$companyTimeline" />
    </flux:card>

    {{-- Alternating --}}
    <flux:card>
        <flux:heading size="lg">Alternating Layout</flux:heading>
        <flux:text class="mt-1 mb-6">Events alternate left and right on desktop, stacked on mobile.</flux:text>
        <flux:timeline :events="$companyTimeline" variant="alternating" />
    </flux:card>

    {{-- With Heading --}}
    <flux:card>
        <flux:heading size="lg">With Heading</flux:heading>
        <flux:text class="mt-1 mb-6">Timeline with a built-in heading and description.</flux:text>
        <flux:timeline
            :events="$roadmap"
            heading="Product Roadmap"
            description="What we're building next."
        />
    </flux:card>

    {{-- Simple / Minimal --}}
    <flux:card>
        <flux:heading size="lg">Minimal</flux:heading>
        <flux:text class="mt-1 mb-6">Just dates and titles, no colors or icons.</flux:text>
        <flux:timeline :events="$simpleEvents" />
    </flux:card>

    {{-- No Animation --}}
    <flux:card>
        <flux:heading size="lg">Without Animation</flux:heading>
        <flux:text class="mt-1 mb-6">Scroll-reveal animation disabled.</flux:text>
        <flux:timeline :events="$roadmap" :animated="false" />
    </flux:card>

    {{-- With Slot --}}
    <flux:card>
        <flux:heading size="lg">With Slot Content</flux:heading>
        <flux:text class="mt-1 mb-6">Custom content above the timeline via the default slot.</flux:text>
        <flux:timeline :events="$roadmap" heading="Roadmap">
            <div class="flex items-center gap-2 text-sm text-zinc-500">
                <flux:icon.information-circle variant="micro" class="size-4" />
                <span>Dates are approximate and subject to change.</span>
            </div>
        </flux:timeline>
    </flux:card>
</div>
