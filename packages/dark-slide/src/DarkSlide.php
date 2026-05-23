<?php

declare(strict_types=1);

namespace DarkSlide;

/**
 * Top-level instance API for the Laravel facade + DI consumers. Static
 * methods on {@see Agent} are the preferred surface for agent-emitted
 * decks; this class exists so the Laravel facade can resolve a singleton
 * with familiar instance semantics.
 */
final class DarkSlide
{
    public const VERSION = '0.1.0';

    /**
     * Validate a deck. See {@see Agent::validate()}.
     *
     * @param  array<string, mixed>  $deck
     * @return list<array{path: string, expected: string, got: string, value: mixed, hint: string}>
     */
    public function validate(array $deck): array
    {
        return Agent::validate($deck);
    }

    /**
     * Validate + repair. See {@see Agent::validateAndRepair()}.
     *
     * @param  array<string, mixed>  $deck
     * @return array{ok: bool, schema: array<string, mixed>, errors: list<array<string, mixed>>}
     */
    public function validateAndRepair(array $deck): array
    {
        return Agent::validateAndRepair($deck);
    }

    /**
     * Write a deck to disk. See {@see Agent::write()}.
     *
     * @param  array<string, mixed>  $deck
     * @return array{path: string, bytes: int, slides: int}
     */
    public function write(array $deck, string $path): array
    {
        return Agent::write($deck, $path);
    }

    /**
     * Return the bytes. See {@see Agent::toBytes()}.
     *
     * @param  array<string, mixed>  $deck
     */
    public function toBytes(array $deck): string
    {
        return Agent::toBytes($deck);
    }

    /**
     * Read a PPTX file. See {@see Agent::read()}.
     *
     * @return array<string, mixed>
     */
    public function read(string $path): array
    {
        return Agent::read($path);
    }

    /**
     * Plain-text summary. See {@see Agent::describe()}.
     *
     * @param  array<string, mixed>  $deck
     */
    public function describe(array $deck): string
    {
        return Agent::describe($deck);
    }

    /**
     * JSON Schema export. See {@see Agent::jsonSchema()}.
     *
     * @return array<string, mixed>
     */
    public function jsonSchema(): array
    {
        return Agent::jsonSchema();
    }
}
