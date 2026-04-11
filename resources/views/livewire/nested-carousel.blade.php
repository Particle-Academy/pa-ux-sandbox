{{-- Nested Carousel Demo View --}}
{{-- Copy this file to resources/views/livewire/nested-carousel.blade.php --}}

<div class="max-w-4xl mx-auto p-6">
    <flux:heading size="xl" level="1">Nested Carousel Demo</flux:heading>
    <flux:text class="mt-2 mb-6">
        Demonstrates nested carousels inside carousel step items. 
        Each carousel operates independently. The nested wizard can advance the parent wizard when it completes.
    </flux:text>
    
    {{-- Parent Wizard --}}
    <flux:carousel variant="wizard" :loop="false" class="max-w-2xl" name="parent-wizard">
        <flux:carousel.tabs>
            <flux:carousel.tab name="step1" label="Step 1" />
            <flux:carousel.tab name="step2" label="Step 2" />
            <flux:carousel.tab name="step3" label="Step 3" />
        </flux:carousel.tabs>
        
        <flux:carousel.panels>
            <flux:carousel.panel name="step1">
                <div class="p-6">
                    <flux:heading size="md">Parent Step 1</flux:heading>
                    <flux:text class="mt-2">This is the first step of the parent wizard.</flux:text>
                </div>
            </flux:carousel.panel>
            
            <flux:carousel.panel name="step2">
                <div class="p-6">
                    <flux:heading size="md">Parent Step 2 - Contains Nested Wizard</flux:heading>
                    <flux:text class="mt-2 mb-4">This step contains a nested wizard. Navigate through the nested steps.</flux:text>
                    
                    {{-- Nested Wizard --}}
                    <div class="mt-4 border border-zinc-200 dark:border-zinc-700 rounded-lg p-4 bg-white dark:bg-zinc-900">
                        <flux:heading size="sm" class="mb-3">Nested Wizard</flux:heading>
                        <flux:carousel variant="wizard" :loop="false" name="nested-wizard" parentCarousel="parent-wizard">
                            <flux:carousel.tabs>
                                <flux:carousel.tab name="nested1" label="Nested 1" />
                                <flux:carousel.tab name="nested2" label="Nested 2" />
                            </flux:carousel.tabs>
                            
                            <flux:carousel.panels>
                                <flux:carousel.panel name="nested1">
                                    <div class="p-4">
                                        <flux:text class="text-sm">First nested step content.</flux:text>
                                    </div>
                                </flux:carousel.panel>
                                
                                <flux:carousel.panel name="nested2">
                                    <div class="p-4">
                                        <flux:text class="text-sm">Second nested step content. Click "Complete" to advance parent wizard.</flux:text>
                                    </div>
                                </flux:carousel.panel>
                            </flux:carousel.panels>
                            
                            {{-- wire:submit handler can call parent.next() --}}
                            <flux:carousel.controls finishLabel="Complete" wire:submit="completeNestedWizard" />
                        </flux:carousel>
                    </div>
                </div>
            </flux:carousel.panel>
            
            <flux:carousel.panel name="step3">
                <div class="p-6">
                    <flux:heading size="md">Parent Step 3</flux:heading>
                    <flux:text class="mt-2">Final step of the parent wizard.</flux:text>
                </div>
            </flux:carousel.panel>
        </flux:carousel.panels>
        
        <flux:carousel.controls />
    </flux:carousel>
</div>
