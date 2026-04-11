<?php

namespace App\Livewire;

use Livewire\Component;

/**
 * Basic Carousel Demo
 * 
 * Demonstrates the simplest carousel usage with data-driven slides.
 * Copy this file to app/Livewire/BasicCarousel.php
 */
class BasicCarousel extends Component
{
    public array $slides = [
        [
            'name' => 'mountains',
            'label' => 'Explore Nature',
            'description' => 'Discover breathtaking mountain views.',
            'src' => 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=400&fit=crop',
        ],
        [
            'name' => 'city',
            'label' => 'Urban Adventure',
            'description' => 'Experience the vibrant city life.',
            'src' => 'https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?w=800&h=400&fit=crop',
        ],
        [
            'name' => 'beach',
            'label' => 'Beach Paradise',
            'description' => 'Relax on pristine sandy shores.',
            'src' => 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&h=400&fit=crop',
        ],
    ];

    public function render()
    {
        return view('livewire.basic-carousel');
    }
}
