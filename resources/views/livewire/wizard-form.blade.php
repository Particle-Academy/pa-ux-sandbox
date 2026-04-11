{{-- Wizard Form Demo View --}}
{{-- Copy this file to resources/views/livewire/wizard-form.blade.php --}}

<div
    x-data
    x-init="$nextTick(() => {
        const step = '{{ $currentStep }}';
        if (step && step !== 'account') {
            $dispatch('carousel-goto', { id: 'wizard-form', name: step });
        }
    })"
>
    <flux:carousel variant="wizard" :loop="false" class="max-w-2xl" name="wizard-form">
        <flux:carousel.tabs>
            <flux:carousel.tab name="account" label="Account" />
            <flux:carousel.tab name="profile" label="Profile" />
            <flux:carousel.tab name="review" label="Review" />
        </flux:carousel.tabs>
        
        <flux:carousel.panels>
            <flux:carousel.panel name="account">
                <div class="p-6">
                    <flux:heading size="md">Create Your Account</flux:heading>
                    <flux:text class="mt-2 mb-4">Enter your email and password to get started.</flux:text>
                    <div class="space-y-4 max-w-sm">
                        <flux:input label="Email" type="email" placeholder="you@example.com" wire:model.blur="email" />
                        <flux:input label="Password" type="password" placeholder="••••••••" wire:model.blur="password" />
                    </div>
                </div>
            </flux:carousel.panel>
            
            <flux:carousel.panel name="profile">
                <div class="p-6">
                    <flux:heading size="md">Complete Your Profile</flux:heading>
                    <flux:text class="mt-2 mb-4">Tell us a bit about yourself.</flux:text>
                    <div class="space-y-4 max-w-sm">
                        <flux:input label="Full Name" placeholder="John Doe" wire:model.blur="fullName" />
                        <flux:textarea label="Bio" placeholder="A short bio..." rows="3" wire:model.blur="bio" />
                    </div>
                </div>
            </flux:carousel.panel>
            
            <flux:carousel.panel name="review">
                <div class="p-6">
                    <flux:heading size="md">Review & Confirm</flux:heading>
                    <flux:text class="mt-2 mb-4">Review your information before submitting.</flux:text>
                    <div class="space-y-2 text-sm">
                        <div class="flex justify-between py-2 border-b border-zinc-200 dark:border-zinc-700">
                            <span class="text-zinc-500">Email</span>
                            <span>{{ $email ?: 'Not provided' }}</span>
                        </div>
                        <div class="flex justify-between py-2 border-b border-zinc-200 dark:border-zinc-700">
                            <span class="text-zinc-500">Name</span>
                            <span>{{ $fullName ?: 'Not provided' }}</span>
                        </div>
                        <div class="flex justify-between py-2 border-b border-zinc-200 dark:border-zinc-700">
                            <span class="text-zinc-500">Bio</span>
                            <span class="max-w-xs truncate">{{ $bio ?: 'Not provided' }}</span>
                        </div>
                    </div>
                </div>
            </flux:carousel.panel>
        </flux:carousel.panels>
        
        {{-- wire:submit calls submitWizard() when Complete is clicked --}}
        <flux:carousel.controls finishLabel="Complete" wire:submit="submitWizard" />
    </flux:carousel>
    
    {{-- Success Modal --}}
    <flux:modal wire:model="showSuccessModal" class="max-w-md">
        <div class="text-center py-4">
            <div class="mx-auto flex items-center justify-center size-16 rounded-full bg-green-100 dark:bg-green-900/30 mb-4">
                <flux:icon.check class="size-8 text-green-600 dark:text-green-400" />
            </div>
            
            <flux:heading size="lg">Wizard Complete!</flux:heading>
            <flux:text class="mt-2">
                Your wizard form has been submitted successfully.
            </flux:text>
            
            <div class="mt-6 flex gap-3 justify-center">
                <flux:button wire:click="resetWizard">
                    Start Over
                </flux:button>
                <flux:button variant="primary" wire:click="$set('showSuccessModal', false)">
                    Done
                </flux:button>
            </div>
        </div>
    </flux:modal>
</div>
