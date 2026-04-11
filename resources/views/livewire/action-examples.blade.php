{{-- Action Component Examples Demo View --}}
{{-- Copy this file to resources/views/livewire/action-examples.blade.php --}}

<div class="max-w-4xl mx-auto p-6 space-y-8">
    <flux:heading size="xl" level="1">Action Component Examples</flux:heading>
    
    {{-- State Variants --}}
    <flux:card>
        <flux:heading size="lg">State Variants</flux:heading>
        <flux:text class="mt-1 mb-4">Different visual states for various action contexts.</flux:text>
        <div class="flex flex-wrap gap-3" data-testid="state-variants">
            <flux:action>Default</flux:action>
            <flux:action active>Active</flux:action>
            <flux:action warn>Warning</flux:action>
        </div>
    </flux:card>
    
    {{-- Alert (Pulsing) --}}
    <flux:card>
        <flux:heading size="lg">Alert Animation</flux:heading>
        <flux:text class="mt-1 mb-4">The alert prop adds a pulse animation without changing color. Combine with other states for colored alerts.</flux:text>
        <div class="flex flex-wrap gap-3" data-testid="alert-animation">
            <flux:action alert>Default + Alert</flux:action>
            <flux:action alert active>Active + Alert</flux:action>
            <flux:action alert warn>Warning + Alert</flux:action>
        </div>
    </flux:card>
    
    {{-- Size Variants --}}
    <flux:card>
        <flux:heading size="lg">Size Variants</flux:heading>
        <flux:text class="mt-1 mb-4">Three size options: sm, md (default), and lg.</flux:text>
        <div class="flex flex-wrap items-center gap-3" data-testid="size-variants">
            <flux:action size="sm">Small</flux:action>
            <flux:action size="md">Medium</flux:action>
            <flux:action size="lg">Large</flux:action>
        </div>
    </flux:card>
    
    {{-- Icons --}}
    <flux:card>
        <flux:heading size="lg">With Icons</flux:heading>
        <flux:text class="mt-1 mb-4">Icons can be placed on either side of the text.</flux:text>
        <div class="flex flex-wrap gap-3" data-testid="icon-variants">
            <flux:action icon="pencil">Edit</flux:action>
            <flux:action icon="trash" warn>Delete</flux:action>
            <flux:action icon="arrow-right" icon-trailing>Next</flux:action>
            <flux:action icon="check" active>Confirm</flux:action>
        </div>
    </flux:card>
    
    {{-- Icon Placement --}}
    <flux:card>
        <flux:heading size="lg">Icon Placement</flux:heading>
        <flux:text class="mt-1 mb-4">Flexible icon positioning: left, right, top, bottom.</flux:text>
        <div class="flex flex-wrap gap-3" data-testid="icon-placement">
            <flux:action icon="home" icon-place="left">Left</flux:action>
            <flux:action icon="home" icon-place="right">Right</flux:action>
            <flux:action icon="cog" icon-place="top">Top</flux:action>
            <flux:action icon="information-circle" icon-place="bottom">Bottom</flux:action>
        </div>
    </flux:card>
    
    {{-- Alert Icons --}}
    <flux:card>
        <flux:heading size="lg">Alert Icons</flux:heading>
        <flux:text class="mt-1 mb-4">Pulsing alert icons for attention-grabbing states.</flux:text>
        <div class="flex flex-wrap gap-3" data-testid="alert-icons">
            <flux:action alert alert-icon="bell">Notifications</flux:action>
            <flux:action alert alert-icon="exclamation-circle" alert-icon-trailing>3 New Messages</flux:action>
        </div>
    </flux:card>
    
    {{-- Emoji Support --}}
    <flux:card>
        <flux:heading size="lg">Emoji Support</flux:heading>
        <flux:text class="mt-1 mb-4">
            Add emojis using slugs from the FANCY facade. 
            Use <code class="px-1 py-0.5 bg-zinc-100 dark:bg-zinc-800 rounded">emoji="slug"</code> for leading 
            or <code class="px-1 py-0.5 bg-zinc-100 dark:bg-zinc-800 rounded">emoji-trailing="slug"</code> for trailing position.
        </flux:text>
        <div class="flex flex-wrap gap-3" data-testid="emoji-support">
            <flux:action emoji="fire">Hot!</flux:action>
            <flux:action emoji="rocket" active>Launch</flux:action>
            <flux:action emoji="thumbs-up" emoji-trailing="sparkles">Awesome</flux:action>
            <flux:action emoji="red-heart" warn>Love</flux:action>
            <flux:action emoji-trailing="party-popper">Celebrate</flux:action>
        </div>
        <flux:text class="mt-3 text-xs text-zinc-500">
            <strong>Available slugs:</strong> Use <code class="px-1 py-0.5 bg-zinc-100 dark:bg-zinc-800 rounded">FANCY::emoji()->list()</code> 
            to get all {{ count(\FANCY::emoji()->list()) }} available emoji slugs.
        </flux:text>
    </flux:card>
    
    {{-- Disabled State --}}
    <flux:card>
        <flux:heading size="lg">Disabled State</flux:heading>
        <flux:text class="mt-1 mb-4">Disabled buttons show reduced opacity and prevent interaction.</flux:text>
        <div class="flex flex-wrap gap-3" data-testid="disabled-state">
            <flux:action disabled>Disabled</flux:action>
            <flux:action disabled icon="lock-closed">Locked</flux:action>
            <flux:action disabled active>Disabled Active</flux:action>
        </div>
    </flux:card>
    
    {{-- Livewire Integration --}}
    <flux:card>
        <flux:heading size="lg">Livewire Integration</flux:heading>
        <flux:text class="mt-1 mb-4">Works seamlessly with Livewire actions.</flux:text>
        <div class="flex flex-wrap gap-3" data-testid="livewire-actions">
            <flux:action wire:click="increment" icon="plus">Increment ({{ $count }})</flux:action>
            <flux:action wire:click="decrement" icon="minus">Decrement</flux:action>
            <flux:action wire:click="resetCounter" icon="arrow-path">Reset</flux:action>
        </div>
    </flux:card>
    
    {{-- Chat Simulation Example --}}
    <flux:card
        x-data="{ }"
        @simulate-response.window="setTimeout(() => $wire.receiveResponse(), 2000)"
    >
        <flux:heading size="lg">Chat Simulation (Alert State Demo)</flux:heading>
        <flux:text class="mt-1 mb-4">
            Type a message and send. The Send button enters alert state while waiting for a simulated response (2 seconds).
        </flux:text>
        
        {{-- Chat History --}}
        <div class="mb-4 space-y-2 max-h-48 overflow-y-auto p-3 bg-zinc-50 dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-700" data-testid="chat-history">
            @forelse($chatHistory as $message)
                <div class="flex {{ $message['role'] === 'user' ? 'justify-end' : 'justify-start' }}">
                    <div class="max-w-[80%] px-3 py-2 rounded-lg text-sm {{ $message['role'] === 'user' ? 'bg-blue-500 text-white' : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-800 dark:text-zinc-200' }}">
                        {{ $message['content'] }}
                    </div>
                </div>
            @empty
                <div class="text-center text-zinc-400 dark:text-zinc-500 text-sm py-4">
                    No messages yet. Type something below to start.
                </div>
            @endforelse
            
            @if($isWaitingForResponse)
                <div class="flex justify-start">
                    <div class="px-3 py-2 rounded-lg text-sm bg-zinc-200 dark:bg-zinc-700 text-zinc-500 dark:text-zinc-400 animate-pulse">
                        Typing...
                    </div>
                </div>
            @endif
        </div>
        
        {{-- Chat Input --}}
        <div class="flex gap-2" data-testid="chat-simulation">
            <flux:input 
                wire:model.live="chatMessage" 
                wire:keydown.enter="sendChat"
                placeholder="Type a message..." 
                class="flex-1"
                :disabled="$isWaitingForResponse"
            />
            <flux:action 
                wire:click="sendChat" 
                icon="paper-airplane" 
                :alert="$isWaitingForResponse"
                :warn="$isWaitingForResponse"
                :active="!$isWaitingForResponse && !empty($chatMessage)"
            >
                {{ $isWaitingForResponse ? 'Waiting...' : 'Send' }}
            </flux:action>
            <flux:action 
                wire:click="clearChat" 
                icon="trash"
                :disabled="empty($chatHistory) && empty($chatMessage)"
            >
                Clear
            </flux:action>
        </div>
        
        <flux:text class="mt-3 text-xs text-zinc-500">
            <strong>Note:</strong> When you send a message, the Send button shows the <code class="px-1 py-0.5 bg-zinc-100 dark:bg-zinc-800 rounded">alert</code> state (red with pulse) while waiting for a response.
        </flux:text>
    </flux:card>

    {{-- Static Chat Action Bar Example --}}
    <flux:card>
        <flux:heading size="lg">Chat Action Bar</flux:heading>
        <flux:text class="mt-1 mb-4">Example of actions in a chat context.</flux:text>
        <div class="flex gap-2 p-3 bg-zinc-100 dark:bg-zinc-800 rounded-lg" data-testid="chat-actions">
            <flux:action icon="paper-airplane" active size="sm">Send</flux:action>
            <flux:action icon="photo" size="sm">Attach</flux:action>
            <flux:action icon="face-smile" size="sm">Emoji</flux:action>
            <flux:action icon="microphone" size="sm">Voice</flux:action>
        </div>
    </flux:card>
    
    {{-- Toolbar Example --}}
    <flux:card>
        <flux:heading size="lg">Text Formatting Toolbar</flux:heading>
        <flux:text class="mt-1 mb-4">Example of actions in a formatting toolbar.</flux:text>
        <div class="flex gap-1 p-2 bg-zinc-50 dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-700" data-testid="toolbar-actions">
            <flux:action size="sm" icon="bold" :active="$bold" wire:click="toggleBold">B</flux:action>
            <flux:action size="sm" icon="italic" :active="$italic" wire:click="toggleItalic">I</flux:action>
            <flux:action size="sm" icon="underline" :active="$underline" wire:click="toggleUnderline">U</flux:action>
            <div class="w-px bg-zinc-300 dark:bg-zinc-600 mx-1"></div>
            <flux:action size="sm" icon="list-bullet">List</flux:action>
            <flux:action size="sm" icon="link">Link</flux:action>
        </div>
    </flux:card>
</div>
