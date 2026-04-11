<?php

namespace App\Livewire;

use Livewire\Component;

/**
 * Drawer Component Examples Demo
 *
 * Demonstrates different drawer variants, positions, animations, and usage patterns.
 * Copy this file to app/Livewire/DrawerExamples.php
 */
class DrawerExamples extends Component
{
    /** @var bool Drawer open state for wire:model demo */
    public bool $showDrawer = false;

    /** @var bool Modal open state */
    public bool $showModal = false;

    /** @var array Panel data for data-driven mode */
    public array $panels = [
        ['name' => 'general', 'label' => 'General Settings', 'content' => 'General settings content here. Configure your basic preferences.'],
        ['name' => 'advanced', 'label' => 'Advanced Settings', 'content' => 'Advanced settings content here. Fine-tune your experience.'],
        ['name' => 'security', 'label' => 'Security', 'content' => 'Security settings content here. Manage your account security.'],
    ];

    /** @var string Active panel name */
    public string $activePanel = 'general';

    public function render()
    {
        return view('livewire.drawer-examples');
    }
}
