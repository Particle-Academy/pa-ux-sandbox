{{-- Emoji Select Examples Demo View --}}
{{-- Copy this file to resources/views/livewire/emoji-select-examples.blade.php --}}

<div class="max-w-4xl mx-auto p-6 space-y-8">
    <flux:heading size="xl" level="1">Emoji Select Examples</flux:heading>
    <flux:text class="text-zinc-600 dark:text-zinc-400">
        A composable emoji picker component with category navigation, search, and customizable styling.
    </flux:text>

    {{-- Basic Usage --}}
    <flux:card>
        <flux:heading size="lg">Basic Usage</flux:heading>
        <flux:text class="mt-1 mb-4">Simple emoji picker with search and category navigation.</flux:text>
        <div class="space-y-4">
            <flux:emoji-select wire:model.live="basicEmoji" />
            <div class="text-sm text-zinc-500">
                Selected: <span class="text-2xl">{{ $basicEmoji ?: 'None' }}</span>
            </div>
        </div>
    </flux:card>

    {{-- With Label --}}
    <flux:card>
        <flux:heading size="lg">With Label</flux:heading>
        <flux:text class="mt-1 mb-4">Emoji picker with an integrated label.</flux:text>
        <div class="space-y-4">
            <flux:emoji-select wire:model.live="withLabelEmoji" label="Reaction" placeholder="Choose reaction..." />
            <div class="text-sm text-zinc-500">
                Selected: <span class="text-2xl">{{ $withLabelEmoji ?: 'None' }}</span>
            </div>
        </div>
    </flux:card>

    {{-- Size Variants --}}
    <flux:card>
        <flux:heading size="lg">Size Variants</flux:heading>
        <flux:text class="mt-1 mb-4">Three size options: sm, default, and lg.</flux:text>
        <div class="flex flex-wrap items-end gap-4">
            <div>
                <flux:text class="text-xs mb-1">Small</flux:text>
                <flux:emoji-select wire:model.live="smallEmoji" size="sm" />
            </div>
            <div>
                <flux:text class="text-xs mb-1">Default</flux:text>
                <flux:emoji-select wire:model.live="defaultEmoji" />
            </div>
            <div>
                <flux:text class="text-xs mb-1">Large</flux:text>
                <flux:emoji-select wire:model.live="largeEmoji" size="lg" />
            </div>
        </div>
    </flux:card>

    {{-- Style Variants --}}
    <flux:card>
        <flux:heading size="lg">Style Variants</flux:heading>
        <flux:text class="mt-1 mb-4">Outline (default) and filled variants.</flux:text>
        <div class="flex flex-wrap gap-4">
            <div>
                <flux:text class="text-xs mb-1">Outline</flux:text>
                <flux:emoji-select wire:model.live="outlineEmoji" variant="outline" />
            </div>
            <div>
                <flux:text class="text-xs mb-1">Filled</flux:text>
                <flux:emoji-select wire:model.live="filledEmoji" variant="filled" />
            </div>
        </div>
    </flux:card>

    {{-- Pre-selected Value --}}
    <flux:card>
        <flux:heading size="lg">Pre-selected Value</flux:heading>
        <flux:text class="mt-1 mb-4">Start with an emoji already selected.</flux:text>
        <div class="space-y-4">
            <flux:emoji-select wire:model.live="preselectedEmoji" label="Party Emoji" />
            <div class="text-sm text-zinc-500">
                Selected: <span class="text-2xl">{{ $preselectedEmoji }}</span>
            </div>
        </div>
    </flux:card>

    {{-- Form Example --}}
    <flux:card>
        <flux:heading size="lg">Form Integration</flux:heading>
        <flux:text class="mt-1 mb-4">Use within a form with other Flux components.</flux:text>
        <form class="space-y-4" wire:submit.prevent>
            <div class="grid grid-cols-2 gap-4">
                <flux:input label="Post Title" placeholder="Enter title..." />
                <div>
                    <flux:emoji-select wire:model.live="reactionEmoji" label="Post Reaction" />
                </div>
            </div>
            <flux:textarea label="Content" placeholder="Write your post..." rows="3" />
            <div class="flex items-center gap-4">
                <flux:button type="submit" variant="primary">Create Post</flux:button>
                @if($reactionEmoji)
                    <span class="text-sm text-zinc-500">
                        Reaction: <span class="text-xl">{{ $reactionEmoji }}</span>
                    </span>
                @endif
            </div>
        </form>
    </flux:card>

    {{-- Input Group Example --}}
    <flux:card>
        <flux:heading size="lg">Input Group Integration</flux:heading>
        <flux:text class="mt-1 mb-4">Use emoji-select within an input group alongside other inputs.</flux:text>
        <div class="space-y-4">
            <flux:field>
                <flux:label>Post Reaction</flux:label>
                <flux:input.group>
                    <flux:emoji-select wire:model.live="groupEmoji" variant="group" />
                    <flux:input placeholder="Add a comment..." />
                </flux:input.group>
            </flux:field>
            @if($groupEmoji)
                <div class="text-sm text-zinc-500">
                    Selected: <span class="text-xl">{{ $groupEmoji }}</span>
                </div>
            @endif
        </div>
    </flux:card>

    {{-- Search Feature --}}
    <flux:card>
        <flux:heading size="lg">Search Feature</flux:heading>
        <flux:text class="mt-1 mb-4">
            Type to search across all emoji categories. Try searching for "heart", "smile", or "cat".
        </flux:text>
        <flux:emoji-select wire:model.live="basicEmoji" placeholder="Search for an emoji..." />
    </flux:card>

    {{-- Without Search --}}
    <flux:card>
        <flux:heading size="lg">Without Search</flux:heading>
        <flux:text class="mt-1 mb-4">Disable search for a simpler interface.</flux:text>
        <flux:emoji-select wire:model.live="basicEmoji" :searchable="false" />
    </flux:card>
</div>
