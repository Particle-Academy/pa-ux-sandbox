<?php

namespace App\Livewire;

use FancyFlux\Concerns\InteractsWithCarousel;
use Livewire\Component;

/**
 * Nested Carousel Demo
 * 
 * Demonstrates nested carousels with parent.next() functionality.
 * Copy this file to app/Livewire/NestedCarousel.php
 */
class NestedCarousel extends Component
{
    use InteractsWithCarousel;
    
    /**
     * Called when the nested wizard's "Complete" button is clicked.
     * Advances the parent wizard to the next step.
     */
    public function completeNestedWizard(): void
    {
        // Advance the parent wizard to the next step
        // This demonstrates parent.next() functionality
        $this->carousel('parent-wizard')->next();
    }

    public function render()
    {
        return view('livewire.nested-carousel');
    }
}
