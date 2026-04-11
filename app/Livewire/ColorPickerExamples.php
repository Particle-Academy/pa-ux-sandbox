<?php

namespace App\Livewire;

use Livewire\Component;

/**
 * Color Picker Examples Demo
 * 
 * Demonstrates different color picker variants and usage patterns.
 * Copy this file to app/Livewire/ColorPickerExamples.php
 */
class ColorPickerExamples extends Component
{
    // Color values for different pickers
    public string $primaryColor = '#3B82F6';
    public string $secondaryColor = '#8B5CF6';
    public string $smallColor = '#10B981';
    public string $defaultColor = '#F59E0B';
    public string $largeColor = '#EF4444';
    public string $outlineColor = '#6366F1';
    public string $filledColor = '#EC4899';
    public string $brandColor = '#3B82F6';
    public string $standaloneColor = '#06B6D4';

    public function render()
    {
        return view('livewire.color-picker-examples');
    }
}
