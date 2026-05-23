<?php

declare(strict_types=1);

namespace DarkSlide\Schema;

/**
 * Schema constants describing the Deck shape DarkSlide reads + writes.
 *
 * Mirrors `@particle-academy/fancy-slides`'s `types.ts` — what the JS editor
 * emits round-trips through here byte-identical. Pure data, no runtime
 * dependencies; usable as a JSON Schema export for LLM tool definitions
 * via {@see jsonSchema()}.
 *
 * The deck shape is intentionally JSON-friendly: scalars, arrays, and
 * objects. No PHP class graph. An LLM can emit a deck verbatim and pass it
 * to {@see \DarkSlide\Agent::write()}.
 */
final class Schema
{
    public const VERSION = '0.1.0';

    /** Supported element types. */
    public const ELEMENT_TYPES = ['text', 'image', 'chart', 'code', 'table', 'shape', 'embed'];

    /** Layout presets the writer recognises. Unknown layouts fall back to free placement. */
    public const SLIDE_LAYOUTS = [
        'blank',
        'title',
        'title-content',
        'two-column',
        'section-divider',
        'image-text',
        'text-image',
        'quote',
    ];

    /** Shape kinds supported by the writer. */
    public const SHAPE_KINDS = [
        'rect',
        'rounded-rect',
        'ellipse',
        'triangle',
        'line',
        'arrow',
    ];

    /** Text format options. */
    public const TEXT_FORMATS = ['markdown', 'html', 'plain'];

    /** Default slide width in EMU (English Metric Units) for 16:9 at 10". 914400 EMU = 1 inch. */
    public const DEFAULT_SLIDE_WIDTH_EMU = 9144000;
    public const DEFAULT_SLIDE_HEIGHT_EMU = 5143500;

    /** Default theme name (matches fancy-slides default). */
    public const DEFAULT_THEME_NAME = 'default';

    /**
     * Required top-level keys on a Deck.
     *
     * @return array<int, string>
     */
    public static function deckRequiredKeys(): array
    {
        return ['id', 'title', 'slides', 'theme'];
    }

    /**
     * Required keys on a Slide.
     *
     * @return array<int, string>
     */
    public static function slideRequiredKeys(): array
    {
        return ['id', 'elements'];
    }

    /**
     * Required keys on every element.
     *
     * @return array<int, string>
     */
    public static function elementRequiredKeys(): array
    {
        return ['id', 'type', 'x', 'y', 'w', 'h'];
    }

    /**
     * JSON Schema export for LLM tool-use registration. Pass this as the
     * `inputSchema` when registering a deck-write tool with an MCP server
     * or an agent SDK — the agent gets exact field hints.
     *
     * @return array<string, mixed>
     */
    public static function jsonSchema(): array
    {
        return [
            '$schema' => 'http://json-schema.org/draft-07/schema#',
            'title' => 'DarkSlide Deck',
            'type' => 'object',
            'required' => self::deckRequiredKeys(),
            'properties' => [
                'id' => ['type' => 'string'],
                'title' => ['type' => 'string'],
                'theme' => [
                    'type' => 'object',
                    'required' => ['name'],
                    'properties' => [
                        'name' => ['type' => 'string'],
                        'aspectRatio' => ['type' => 'number'],
                        'slideWidth' => ['type' => 'number'],
                        'colors' => [
                            'type' => 'object',
                            'properties' => [
                                'background' => ['type' => 'string'],
                                'text' => ['type' => 'string'],
                                'muted' => ['type' => 'string'],
                                'accent' => ['type' => 'string'],
                                'surface' => ['type' => 'string'],
                            ],
                        ],
                        'fonts' => [
                            'type' => 'object',
                            'properties' => [
                                'heading' => ['type' => 'string'],
                                'body' => ['type' => 'string'],
                                'mono' => ['type' => 'string'],
                            ],
                        ],
                    ],
                ],
                'slides' => [
                    'type' => 'array',
                    'items' => [
                        'type' => 'object',
                        'required' => self::slideRequiredKeys(),
                        'properties' => [
                            'id' => ['type' => 'string'],
                            'layout' => ['type' => 'string', 'enum' => self::SLIDE_LAYOUTS],
                            'elements' => [
                                'type' => 'array',
                                'items' => self::elementJsonSchema(),
                            ],
                            'background' => [
                                'type' => 'object',
                                'properties' => [
                                    'color' => ['type' => 'string'],
                                    'image' => ['type' => 'string'],
                                    'imageFit' => ['type' => 'string', 'enum' => ['contain', 'cover', 'fill']],
                                    'gradient' => ['type' => 'string'],
                                ],
                            ],
                            'notes' => ['type' => 'string'],
                            'metadata' => ['type' => 'object'],
                        ],
                    ],
                ],
                'metadata' => ['type' => 'object'],
            ],
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private static function elementJsonSchema(): array
    {
        return [
            'type' => 'object',
            'required' => self::elementRequiredKeys(),
            'properties' => [
                'id' => ['type' => 'string'],
                'type' => ['type' => 'string', 'enum' => self::ELEMENT_TYPES],
                'x' => ['type' => 'number', 'minimum' => 0, 'maximum' => 1],
                'y' => ['type' => 'number', 'minimum' => 0, 'maximum' => 1],
                'w' => ['type' => 'number', 'minimum' => 0, 'maximum' => 1],
                'h' => ['type' => 'number', 'minimum' => 0, 'maximum' => 1],
                'rotation' => ['type' => 'number'],
                'z' => ['type' => 'integer'],
                'locked' => ['type' => 'boolean'],
                'hidden' => ['type' => 'boolean'],
                // Type-specific fields — kept loose since this is a union.
                'content' => ['type' => 'string'],
                'format' => ['type' => 'string', 'enum' => self::TEXT_FORMATS],
                'style' => ['type' => 'object'],
                'src' => ['type' => 'string'],
                'alt' => ['type' => 'string'],
                'fit' => ['type' => 'string', 'enum' => ['contain', 'cover', 'fill', 'scale-down']],
                'shape' => ['type' => 'string', 'enum' => self::SHAPE_KINDS],
                'fill' => ['type' => 'string'],
                'stroke' => ['type' => 'string'],
                'strokeWidth' => ['type' => 'number'],
                'dashed' => ['type' => 'boolean'],
                'radius' => ['type' => 'number'],
                'code' => ['type' => 'string'],
                'language' => ['type' => 'string'],
                'codeTheme' => ['type' => 'string'],
                'columns' => ['type' => 'array'],
                'rows' => ['type' => 'array'],
                'option' => ['type' => 'object'],
                'chartTheme' => ['type' => 'string'],
            ],
        ];
    }
}
