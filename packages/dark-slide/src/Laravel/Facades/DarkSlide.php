<?php

declare(strict_types=1);

namespace DarkSlide\Laravel\Facades;

use Illuminate\Support\Facades\Facade;

/**
 * Laravel facade for the DarkSlide singleton.
 *
 * @method static array  validate(array $deck)
 * @method static array  validateAndRepair(array $deck)
 * @method static array  write(array $deck, string $path)
 * @method static string toBytes(array $deck)
 * @method static array  read(string $path)
 * @method static string describe(array $deck)
 * @method static array  jsonSchema()
 *
 * @see \DarkSlide\DarkSlide
 */
final class DarkSlide extends Facade
{
    protected static function getFacadeAccessor(): string
    {
        return 'dark-slide';
    }
}
