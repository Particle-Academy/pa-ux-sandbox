<?php

namespace App\Livewire;

use FancyFlux\Concerns\InteractsWithCarousel;
use Livewire\Component;

/**
 * Dynamic Carousel Demo
 * 
 * Demonstrates adding/removing slides dynamically without resetting carousel position.
 * Copy this file to app/Livewire/DynamicCarousel.php
 */
class DynamicCarousel extends Component
{
    use InteractsWithCarousel;
    
    /**
     * Collection of slides for the dynamic carousel.
     */
    public array $slides = [];
    
    /**
     * Counter for generating unique slide IDs.
     */
    public int $slideCounter = 0;

    public function mount(): void
    {
        // Initialize with some slides
        $this->slides = [
            ['name' => 'slide-1', 'label' => 'Welcome', 'description' => 'This is a dynamic carousel.', 'color' => 'blue'],
            ['name' => 'slide-2', 'label' => 'Features', 'description' => 'Add or remove slides dynamically.', 'color' => 'purple'],
        ];
        $this->slideCounter = 2;
    }

    /**
     * Generate a new slide with unique ID.
     */
    protected function generateSlide(): array
    {
        $this->slideCounter++;
        $colors = ['green', 'orange', 'pink', 'cyan', 'amber', 'rose', 'indigo', 'teal'];

        return [
            'name' => 'slide-'.$this->slideCounter,
            'label' => 'Slide '.$this->slideCounter,
            'description' => 'Added at '.now()->format('H:i:s'),
            'color' => $colors[array_rand($colors)],
        ];
    }

    /**
     * Append a new slide to the end of the carousel.
     */
    public function appendSlide(): void
    {
        $this->slides[] = $this->generateSlide();
        $this->carousel('dynamic-carousel')->refresh();
    }

    /**
     * Prepend a new slide to the beginning of the carousel.
     */
    public function prependSlide(): void
    {
        array_unshift($this->slides, $this->generateSlide());
        $this->carousel('dynamic-carousel')->refresh();
    }

    /**
     * Remove the first slide from the carousel.
     */
    public function removeFirstSlide(): void
    {
        if (count($this->slides) > 1) {
            array_shift($this->slides);
            $this->carousel('dynamic-carousel')->refresh();
        }
    }

    /**
     * Remove the last slide from the carousel.
     */
    public function removeLastSlide(): void
    {
        if (count($this->slides) > 1) {
            array_pop($this->slides);
            $this->carousel('dynamic-carousel')->refresh();
        }
    }

    public function render()
    {
        return view('livewire.dynamic-carousel');
    }
}
