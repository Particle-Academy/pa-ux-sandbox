<?php

namespace App\Livewire;

use Livewire\Attributes\On;
use Livewire\Component;

/**
 * Wizard Form Demo
 * 
 * Demonstrates a multi-step wizard form with wire:submit support.
 * Copy this file to app/Livewire/WizardForm.php
 */
class WizardForm extends Component
{
    // Form fields
    public string $email = '';
    public string $password = '';
    public string $fullName = '';
    public string $bio = '';
    
    // Modal state
    public bool $showSuccessModal = false;
    
    // Track current step to restore after re-renders
    public string $currentStep = 'account';
    
    /**
     * Listen for carousel navigation events to track current step.
     */
    #[On('carousel-navigated')]
    public function onCarouselNavigated(string $id, string $name): void
    {
        if ($id === 'wizard-form') {
            $this->currentStep = $name;
        }
    }
    
    /**
     * Called when the wizard's "Complete" button is clicked.
     */
    public function submitWizard(): void
    {
        // Validate and save your data here
        $this->validate([
            'email' => 'required|email',
            'password' => 'required|min:8',
            'fullName' => 'required|min:2',
        ]);
        
        // Save data...
        // $this->save();
        
        // Show success message
        $this->showSuccessModal = true;
    }
    
    /**
     * Reset the wizard form.
     */
    public function resetWizard(): void
    {
        $this->reset(['email', 'password', 'fullName', 'bio', 'showSuccessModal', 'currentStep']);
        $this->js("setTimeout(() => \$dispatch('carousel-goto', { id: 'wizard-form', name: 'account' }), 50)");
    }

    public function render()
    {
        return view('livewire.wizard-form');
    }
}
