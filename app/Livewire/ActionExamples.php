<?php

namespace App\Livewire;

use Livewire\Component;

/**
 * Action Component Examples Demo
 *
 * Demonstrates different action button variants, states, and usage patterns.
 * Copy this file to app/Livewire/ActionExamples.php
 */
class ActionExamples extends Component
{
    // Counter for Livewire integration demo
    public int $count = 0;

    // Toggle states for toolbar demo
    public bool $bold = true;

    public bool $italic = false;

    public bool $underline = false;

    // Chat simulation state
    public bool $isWaitingForResponse = false;

    public string $chatMessage = '';

    public array $chatHistory = [];

    public function increment(): void
    {
        $this->count++;
    }

    public function decrement(): void
    {
        $this->count--;
    }

    public function resetCounter(): void
    {
        $this->count = 0;
    }

    public function toggleBold(): void
    {
        $this->bold = ! $this->bold;
    }

    public function toggleItalic(): void
    {
        $this->italic = ! $this->italic;
    }

    public function toggleUnderline(): void
    {
        $this->underline = ! $this->underline;
    }

    /**
     * Simulate sending a chat message and waiting for a response.
     * Sets alert state while "waiting" then clears it after simulated response.
     */
    public function sendChat(): void
    {
        if (empty(trim($this->chatMessage))) {
            return;
        }

        // Add user message to history
        $this->chatHistory[] = [
            'role' => 'user',
            'content' => $this->chatMessage,
        ];

        // Clear input and set waiting state
        $this->chatMessage = '';
        $this->isWaitingForResponse = true;

        // Dispatch a delayed event to simulate receiving a response
        $this->dispatch('simulate-response')->self();
    }

    /**
     * Handle the simulated response after a delay.
     * Called via Alpine.js setTimeout to simulate async response.
     */
    public function receiveResponse(): void
    {
        // Simulate AI response
        $responses = [
            'Hello! How can I help you today?',
            'That\'s an interesting question. Let me think about it...',
            'I understand. Here\'s what I can tell you about that.',
            'Great point! I\'d be happy to elaborate.',
            'Thanks for sharing that with me.',
        ];

        $this->chatHistory[] = [
            'role' => 'assistant',
            'content' => $responses[array_rand($responses)],
        ];

        // Clear waiting state
        $this->isWaitingForResponse = false;
    }

    public function clearChat(): void
    {
        $this->chatHistory = [];
        $this->chatMessage = '';
        $this->isWaitingForResponse = false;
    }

    public function render()
    {
        return view('livewire.action-examples');
    }
}
