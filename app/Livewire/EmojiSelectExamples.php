<?php

namespace App\Livewire;

use Livewire\Component;

/**
 * Emoji Select Examples Demo
 *
 * Demonstrates different emoji select variants and usage patterns.
 * Copy this file to app/Livewire/EmojiSelectExamples.php
 */
class EmojiSelectExamples extends Component
{
    public string $basicEmoji = '';
    public string $withLabelEmoji = '';
    public string $smallEmoji = '';
    public string $defaultEmoji = '';
    public string $largeEmoji = '';
    public string $outlineEmoji = '';
    public string $filledEmoji = '';
    public string $preselectedEmoji = '🎉';
    public string $reactionEmoji = '';
    public string $groupEmoji = '';

    public function render()
    {
        return view('livewire.emoji-select-examples');
    }
}
