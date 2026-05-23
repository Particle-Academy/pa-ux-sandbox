<?php

declare(strict_types=1);

namespace DarkSlide\Exceptions;

use RuntimeException;

/**
 * Thrown by Agent::write() when the schema is invalid and cannot be repaired.
 *
 * Carries the structured error list from {@see \DarkSlide\Schema\Validator}
 * so callers can render per-field feedback without re-running validation.
 */
final class SchemaException extends RuntimeException
{
    /**
     * @param  list<array{path: string, expected: string, got: string, value: mixed, hint: string}>  $errors
     */
    public function __construct(
        string $message,
        public readonly array $errors,
    ) {
        parent::__construct($message);
    }
}
