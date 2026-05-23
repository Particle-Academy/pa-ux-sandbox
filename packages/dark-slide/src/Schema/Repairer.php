<?php

declare(strict_types=1);

namespace DarkSlide\Schema;

/**
 * Heuristic schema repair for agent-emitted decks. Applies harmless fixes
 * (clamp coords, fill in missing ids, normalise default fields) so a
 * mostly-correct deck doesn't bounce off the validator.
 *
 * Pure functions. Never mutates the input.
 */
final class Repairer
{
    private int $idCounter = 0;

    /**
     * @param  array<string, mixed>  $deck
     * @return array<string, mixed>
     */
    public function repair(array $deck): array
    {
        $this->idCounter = 0;

        // Top-level defaults
        $deck['id'] ??= $this->generateId('deck');
        $deck['title'] ??= 'Untitled';
        $deck['theme'] = $this->repairTheme($deck['theme'] ?? null);
        $deck['slides'] = $this->repairSlides($deck['slides'] ?? []);

        return $deck;
    }

    /**
     * @param  mixed  $theme
     * @return array<string, mixed>
     */
    private function repairTheme(mixed $theme): array
    {
        if (!is_array($theme)) {
            return ['name' => Schema::DEFAULT_THEME_NAME];
        }
        $theme['name'] ??= Schema::DEFAULT_THEME_NAME;

        return $theme;
    }

    /**
     * @param  mixed  $slides
     * @return list<array<string, mixed>>
     */
    private function repairSlides(mixed $slides): array
    {
        if (!is_array($slides)) {
            return [];
        }
        $out = [];
        foreach ($slides as $i => $slide) {
            if (!is_array($slide)) {
                continue;
            }
            $out[] = $this->repairSlide($slide, $i);
        }

        return $out;
    }

    /**
     * @param  array<string, mixed>  $slide
     * @return array<string, mixed>
     */
    private function repairSlide(array $slide, int $index): array
    {
        $slide['id'] ??= $this->generateId('s', $index);
        $slide['elements'] = $this->repairElements($slide['elements'] ?? []);

        if (isset($slide['layout']) && !in_array($slide['layout'], Schema::SLIDE_LAYOUTS, true)) {
            $slide['layout'] = 'blank';
        }

        return $slide;
    }

    /**
     * @param  mixed  $elements
     * @return list<array<string, mixed>>
     */
    private function repairElements(mixed $elements): array
    {
        if (!is_array($elements)) {
            return [];
        }
        $out = [];
        foreach ($elements as $i => $element) {
            if (!is_array($element)) {
                continue;
            }
            $repaired = $this->repairElement($element, $i);
            if ($repaired !== null) {
                $out[] = $repaired;
            }
        }

        return $out;
    }

    /**
     * @param  array<string, mixed>  $element
     * @return array<string, mixed>|null
     */
    private function repairElement(array $element, int $index): ?array
    {
        // Drop elements with unknown / missing type — can't render them safely.
        if (!isset($element['type']) || !in_array($element['type'], Schema::ELEMENT_TYPES, true)) {
            return null;
        }

        $element['id'] ??= $this->generateId('e', $index);

        // Clamp coords to 0..1.
        foreach (['x', 'y', 'w', 'h'] as $coord) {
            $element[$coord] = $this->clamp(
                is_numeric($element[$coord] ?? null) ? (float) $element[$coord] : 0.0,
                0.0,
                1.0,
            );
        }

        // Sensible minimum dimensions — invisible elements aren't useful.
        if ($element['w'] < 0.02) {
            $element['w'] = 0.02;
        }
        if ($element['h'] < 0.02) {
            $element['h'] = 0.02;
        }

        // Type-specific repairs
        match ($element['type']) {
            'text' => $element['content'] = isset($element['content']) && is_string($element['content']) ? $element['content'] : '',
            'image' => $element['src'] = isset($element['src']) && is_string($element['src']) ? $element['src'] : '',
            'shape' => $element['shape'] = isset($element['shape']) && in_array($element['shape'], Schema::SHAPE_KINDS, true) ? $element['shape'] : 'rect',
            'code' => $element['code'] = isset($element['code']) && is_string($element['code']) ? $element['code'] : '',
            default => null,
        };

        return $element;
    }

    private function generateId(string $prefix, int $index = 0): string
    {
        $this->idCounter++;

        return $prefix . '-' . dechex(time() & 0xFFFFFF) . '-' . str_pad((string) ($this->idCounter + $index), 3, '0', STR_PAD_LEFT);
    }

    private function clamp(float $v, float $min, float $max): float
    {
        if (!is_finite($v)) {
            return $min;
        }

        return max($min, min($max, $v));
    }
}
