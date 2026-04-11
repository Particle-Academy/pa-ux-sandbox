{{-- Drawer Component Examples Demo View --}}
{{-- Copy this file to resources/views/livewire/drawer-examples.blade.php --}}

<div class="max-w-6xl mx-auto p-6 space-y-8">
    <flux:heading size="xl" level="1">Drawer Component Examples</flux:heading>
    
    {{-- Basic Drawer (Slot-based) --}}
    <flux:card>
        <flux:heading size="lg">Basic Drawer (Slot-based)</flux:heading>
        <flux:text class="mt-1 mb-4">A simple drawer with nested components using the slot-based pattern.</flux:text>
        
        <flux:drawer name="basic-drawer" variant="drawer" position="inside-right">
            <flux:drawer.trigger name="general">Open Settings</flux:drawer.trigger>
            
            <flux:drawer.panels>
                <flux:drawer.panel name="general" label="General">
                    <div class="space-y-4">
                        <flux:heading size="md">General Settings</flux:heading>
                        <flux:text>Configure your general preferences here.</flux:text>
                        <div class="space-y-2">
                            <flux:input label="Theme" placeholder="Select theme..." />
                            <flux:input label="Language" placeholder="Select language..." />
                        </div>
                    </div>
                </flux:drawer.panel>
                <flux:drawer.panel name="advanced" label="Advanced">
                    <div class="space-y-4">
                        <flux:heading size="md">Advanced Settings</flux:heading>
                        <flux:text>Advanced configuration options.</flux:text>
                        <div class="space-y-2">
                            <flux:switch label="Enable notifications" />
                            <flux:switch label="Auto-save drafts" />
                        </div>
                    </div>
                </flux:drawer.panel>
            </flux:drawer.panels>
            
            <flux:drawer.controls />
        </flux:drawer>
    </flux:card>

    {{-- Data-Driven Drawer --}}
    <flux:card>
        <flux:heading size="lg">Data-Driven Drawer</flux:heading>
        <flux:text class="mt-1 mb-4">Drawer with panels defined via data prop. Perfect for dynamic content.</flux:text>
        
        <flux:drawer 
            name="data-drawer" 
            variant="drawer" 
            position="inside-right"
            :data="$panels"
        >
            <flux:drawer.trigger>Open Data Drawer</flux:drawer.trigger>
            <flux:drawer.controls />
        </flux:drawer>
    </flux:card>

    {{-- Modal Variant --}}
    <flux:card>
        <flux:heading size="lg">Modal Variant</flux:heading>
        <flux:text class="mt-1 mb-4">Drawer opens as a centered modal overlay with backdrop.</flux:text>
        
        <flux:drawer name="modal-drawer" variant="modal">
            <flux:drawer.trigger>Open Modal</flux:drawer.trigger>
            
            <flux:drawer.panels>
                <flux:drawer.panel name="modal-panel" label="Modal Content">
                    <div class="space-y-4">
                        <flux:heading size="md">Modal Drawer</flux:heading>
                        <flux:text>This drawer opens as a modal overlay in the center of the screen.</flux:text>
                        <flux:button wire:click="$dispatch('drawer-close', { id: 'modal-drawer' })">Close</flux:button>
                    </div>
                </flux:drawer.panel>
            </flux:drawer.panels>
        </flux:drawer>
    </flux:card>

    {{-- Attached Variant --}}
    <flux:card>
        <flux:heading size="lg">Attached Variant</flux:heading>
        <flux:text class="mt-1 mb-4">Drawer attaches to its parent container and expands upward without causing layout shifts. Perfect for chat interfaces, search bars, and form inputs.</flux:text>
        
        <div class="max-w-md mx-auto">
            <flux:drawer name="attached-drawer" variant="attached" anchor-position="top">
                <flux:drawer.panels>
                    <flux:drawer.panel name="quick-actions">
                        <div class="p-3">
                            <div class="mb-3">
                                <flux:heading size="sm">Quick Actions</flux:heading>
                            </div>
                            <div class="grid grid-cols-2 gap-2">
                                <flux:button size="sm" variant="ghost" class="justify-start">
                                    <flux:icon name="sparkles" variant="micro" class="mr-2" />
                                    Analyze
                                </flux:button>
                                <flux:button size="sm" variant="ghost" class="justify-start">
                                    <flux:icon name="document-text" variant="micro" class="mr-2" />
                                    Summarize
                                </flux:button>
                                <flux:button size="sm" variant="ghost" class="justify-start">
                                    <flux:icon name="magnifying-glass" variant="micro" class="mr-2" />
                                    Search
                                </flux:button>
                                <flux:button size="sm" variant="ghost" class="justify-start">
                                    <flux:icon name="bolt" variant="micro" class="mr-2" />
                                    Quick Reply
                                </flux:button>
                            </div>
                        </div>
                    </flux:drawer.panel>
                    <flux:drawer.panel name="tools">
                        <div class="p-3">
                            <div class="mb-3">
                                <flux:heading size="sm">Available Tools</flux:heading>
                            </div>
                            <div class="space-y-2">
                                <flux:button size="sm" variant="ghost" class="w-full justify-start">
                                    <flux:icon name="wrench-screwdriver" variant="micro" class="mr-2 text-purple-500" />
                                    Tool A
                                </flux:button>
                                <flux:button size="sm" variant="ghost" class="w-full justify-start">
                                    <flux:icon name="wrench-screwdriver" variant="micro" class="mr-2 text-purple-500" />
                                    Tool B
                                </flux:button>
                                <flux:button size="sm" variant="ghost" class="w-full justify-start">
                                    <flux:icon name="wrench-screwdriver" variant="micro" class="mr-2 text-purple-500" />
                                    Tool C
                                </flux:button>
                            </div>
                        </div>
                    </flux:drawer.panel>
                </flux:drawer.panels>
                
                <flux:drawer.controls />
                
                <flux:drawer.anchor>
                    <div class="flex items-center gap-2 p-3 border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 rounded-2xl shadow-sm">
                        <flux:drawer.trigger for="attached-drawer">
                            <flux:icon name="sparkles" variant="micro" class="w-4 h-4 text-zinc-500" />
                        </flux:drawer.trigger>
                        <input 
                            type="text" 
                            placeholder="Type a message..." 
                            class="flex-1 px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                        />
                        <flux:button size="sm">Send</flux:button>
                    </div>
                </flux:drawer.anchor>
            </flux:drawer>
        </div>
        
        <flux:text class="mt-4 text-sm text-zinc-500 dark:text-zinc-400">
            The drawer expands upward from the input area without causing layout shifts. Notice how the border-radius and borders adjust for visual continuity when expanded.
        </flux:text>
    </flux:card>

    {{-- Position Variants --}}
    <flux:card>
        <flux:heading size="lg">Position Variants</flux:heading>
        <flux:text class="mt-1 mb-4">Drawers can be positioned on any edge of the viewport.</flux:text>
        
        <div class="grid grid-cols-2 gap-4">
            <flux:drawer name="top-drawer" variant="drawer" position="inside-top">
                <flux:drawer.trigger>Top</flux:drawer.trigger>
                <flux:drawer.panels>
                    <flux:drawer.panel name="top-panel">
                        <flux:heading size="sm">Top Drawer</flux:heading>
                        <flux:text class="text-sm">This drawer slides down from the top.</flux:text>
                    </flux:drawer.panel>
                </flux:drawer.panels>
            </flux:drawer>
            
            <flux:drawer name="bottom-drawer" variant="drawer" position="inside-bottom">
                <flux:drawer.trigger>Bottom</flux:drawer.trigger>
                <flux:drawer.panels>
                    <flux:drawer.panel name="bottom-panel">
                        <flux:heading size="sm">Bottom Drawer</flux:heading>
                        <flux:text class="text-sm">This drawer slides up from the bottom.</flux:text>
                    </flux:drawer.panel>
                </flux:drawer.panels>
            </flux:drawer>
            
            <flux:drawer name="left-drawer" variant="drawer" position="inside-left">
                <flux:drawer.trigger>Left</flux:drawer.trigger>
                <flux:drawer.panels>
                    <flux:drawer.panel name="left-panel">
                        <flux:heading size="sm">Left Drawer</flux:heading>
                        <flux:text class="text-sm">This drawer slides in from the left.</flux:text>
                    </flux:drawer.panel>
                </flux:drawer.panels>
            </flux:drawer>
            
            <flux:drawer name="right-drawer" variant="drawer" position="inside-right">
                <flux:drawer.trigger>Right</flux:drawer.trigger>
                <flux:drawer.panels>
                    <flux:drawer.panel name="right-panel">
                        <flux:heading size="sm">Right Drawer</flux:heading>
                        <flux:text class="text-sm">This drawer slides in from the right (default).</flux:text>
                    </flux:drawer.panel>
                </flux:drawer.panels>
            </flux:drawer>
        </div>
    </flux:card>

    {{-- Animation Variants --}}
    <flux:card>
        <flux:heading size="lg">Animation Variants</flux:heading>
        <flux:text class="mt-1 mb-4">Different opening animations for various UX patterns.</flux:text>
        
        <div class="flex flex-wrap gap-4">
            <flux:drawer name="grow-drawer" variant="drawer" open-animation="grow">
                <flux:drawer.trigger>Grow</flux:drawer.trigger>
                <flux:drawer.panels>
                    <flux:drawer.panel name="grow-panel">
                        <flux:heading size="sm">Grow Animation</flux:heading>
                        <flux:text class="text-sm">Content grows from the direction of the drawer.</flux:text>
                    </flux:drawer.panel>
                </flux:drawer.panels>
            </flux:drawer>
            
            <flux:drawer name="fade-drawer" variant="drawer" open-animation="fade">
                <flux:drawer.trigger>Fade</flux:drawer.trigger>
                <flux:drawer.panels>
                    <flux:drawer.panel name="fade-panel">
                        <flux:heading size="sm">Fade Animation</flux:heading>
                        <flux:text class="text-sm">Smooth opacity transition (default for modals).</flux:text>
                    </flux:drawer.panel>
                </flux:drawer.panels>
            </flux:drawer>
            
            <flux:drawer name="scroll-drawer" variant="drawer" open-animation="scroll">
                <flux:drawer.trigger>Scroll</flux:drawer.trigger>
                <flux:drawer.panels>
                    <flux:drawer.panel name="scroll-panel">
                        <flux:heading size="sm">Scroll Animation</flux:heading>
                        <flux:text class="text-sm">Drawer "unfurls" to reveal content.</flux:text>
                    </flux:drawer.panel>
                </flux:drawer.panels>
            </flux:drawer>
            
            <flux:drawer name="delayed-drawer" variant="drawer" open-animation="delayed">
                <flux:drawer.trigger>Delayed</flux:drawer.trigger>
                <flux:drawer.panels>
                    <flux:drawer.panel name="delayed-panel">
                        <flux:heading size="sm">Delayed Animation</flux:heading>
                        <flux:text class="text-sm">Bounce trigger feedback, then grow after delay.</flux:text>
                    </flux:drawer.panel>
                </flux:drawer.panels>
            </flux:drawer>
        </div>
    </flux:card>

    {{-- Opening Speed --}}
    <flux:card>
        <flux:heading size="lg">Opening Speed</flux:heading>
        <flux:text class="mt-1 mb-4">Control how quickly drawers open with the open-speed prop.</flux:text>
        
        <div class="flex flex-wrap gap-4">
            <flux:drawer name="fast-drawer" variant="drawer" open-speed="fast">
                <flux:drawer.trigger>Fast (150ms)</flux:drawer.trigger>
                <flux:drawer.panels>
                    <flux:drawer.panel name="fast-panel">
                        <flux:heading size="sm">Fast Speed</flux:heading>
                        <flux:text class="text-sm">Quick, snappy animation.</flux:text>
                    </flux:drawer.panel>
                </flux:drawer.panels>
            </flux:drawer>
            
            <flux:drawer name="normal-drawer" variant="drawer" open-speed="normal">
                <flux:drawer.trigger>Normal (300ms)</flux:drawer.trigger>
                <flux:drawer.panels>
                    <flux:drawer.panel name="normal-panel">
                        <flux:heading size="sm">Normal Speed</flux:heading>
                        <flux:text class="text-sm">Balanced animation (default).</flux:text>
                    </flux:drawer.panel>
                </flux:drawer.panels>
            </flux:drawer>
            
            <flux:drawer name="slow-drawer" variant="drawer" open-speed="slow">
                <flux:drawer.trigger>Slow (500ms)</flux:drawer.trigger>
                <flux:drawer.panels>
                    <flux:drawer.panel name="slow-panel">
                        <flux:heading size="sm">Slow Speed</flux:heading>
                        <flux:text class="text-sm">Smooth, deliberate animation.</flux:text>
                    </flux:drawer.panel>
                </flux:drawer.panels>
            </flux:drawer>
        </div>
    </flux:card>

    {{-- Wire:model Integration --}}
    <flux:card>
        <flux:heading size="lg">Livewire Integration</flux:heading>
        <flux:text class="mt-1 mb-4">Drawer state controlled via wire:model for server-side state management.</flux:text>
        
        <flux:button wire:click="$set('showDrawer', true)">Open Drawer (wire:model)</flux:button>
        
        <flux:drawer name="wire-drawer" variant="drawer" wire:model="showDrawer">
            <flux:drawer.panels>
                <flux:drawer.panel name="wire-panel">
                    <div class="space-y-4">
                        <flux:heading size="md">Livewire Controlled</flux:heading>
                        <flux:text>This drawer is controlled by Livewire state. The open/close state is synced with the server.</flux:text>
                        <flux:button wire:click="$set('showDrawer', false)">Close</flux:button>
                    </div>
                </flux:drawer.panel>
            </flux:drawer.panels>
        </flux:drawer>
    </flux:card>

    {{-- Programmatic Control --}}
    <flux:card>
        <flux:heading size="lg">Programmatic Control</flux:heading>
        <flux:text class="mt-1 mb-4">Control drawers programmatically using the FANCY facade or Flux.drawer() JavaScript API.</flux:text>
        
        <div class="flex flex-wrap gap-3">
            <flux:button x-on:click="$dispatch('drawer-open', { id: 'programmatic-drawer' })">Open via Event</flux:button>
            <flux:button x-on:click="$dispatch('drawer-close', { id: 'programmatic-drawer' })">Close via Event</flux:button>
            <flux:button x-on:click="$dispatch('drawer-goto', { id: 'programmatic-drawer', name: 'panel-2' })">Go to Panel 2</flux:button>
        </div>
        
        <flux:drawer name="programmatic-drawer" variant="drawer">
            <flux:drawer.panels>
                <flux:drawer.panel name="panel-1">
                    <flux:heading size="sm">Panel 1</flux:heading>
                    <flux:text class="text-sm">First panel content.</flux:text>
                </flux:drawer.panel>
                <flux:drawer.panel name="panel-2">
                    <flux:heading size="sm">Panel 2</flux:heading>
                    <flux:text class="text-sm">Second panel content.</flux:text>
                </flux:drawer.panel>
            </flux:drawer.panels>
        </flux:drawer>
    </flux:card>
</div>
