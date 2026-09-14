<?php

namespace Database\Factories\Support;

use Illuminate\Container\Container;
use Random\Engine\Secure;
use Random\Engine\Xoshiro256StarStar;
use Random\Randomizer;

/**
 * Fake data for factories, seeders and tests.
 *
 * This application does not install fakerphp/faker, and Laravel only
 * defines the global `fake()` helper when Faker is installed, so calling it
 * fails with "Call to undefined function fake()". Use this class where the
 * Laravel docs use `fake()`:
 *
 *     FakeData::shared()->name();               // fake()->name()
 *     FakeData::shared()->unique()->safeEmail(); // fake()->unique()->safeEmail()
 *
 * It covers only the formatters this application uses. It is application
 * code, not a library: when a factory needs another kind of value, add a
 * public method here and a test for its shape.
 *
 * Values are random by default. Seed the generator for a repeatable
 * sequence, for example in a seeder whose output you want to be stable:
 *
 *     FakeData::shared()->seed(1234);
 *
 * Prefer Faker? `composer require --dev fakerphp/faker` makes `fake()`
 * work again, and nothing here needs to change.
 */
final class FakeData
{
    private const FIRST_NAMES = [
        'Aaliyah', 'Abdul', 'Ada', 'Adrian', 'Aisha', 'Alejandro', 'Alice', 'Amara', 'Amir', 'Ana',
        'Anya', 'Arjun', 'Ava', 'Benjamin', 'Bianca', 'Carlos', 'Chen', 'Chloe', 'Clara', 'Daniel',
        'Dara', 'David', 'Diego', 'Elena', 'Eli', 'Emeka', 'Emma', 'Esther', 'Ethan', 'Fatima',
        'Felix', 'Freya', 'Gabriel', 'Grace', 'Hana', 'Hassan', 'Helen', 'Hugo', 'Ibrahim', 'Imani',
        'Ines', 'Isaac', 'Ivy', 'Jamal', 'James', 'Javier', 'Jin', 'Joanna', 'Jonah', 'Julia',
        'Kai', 'Kenji', 'Kofi', 'Kwame', 'Layla', 'Lena', 'Leo', 'Liam', 'Luca', 'Lucia',
        'Marcus', 'Mateo', 'Maya', 'Mei', 'Mia', 'Miguel', 'Nadia', 'Naomi', 'Nia', 'Noah',
        'Nora', 'Olivia', 'Omar', 'Oscar', 'Owen', 'Priya', 'Rafael', 'Rania', 'Ravi', 'Rosa',
        'Ruth', 'Sakura', 'Samuel', 'Santiago', 'Sara', 'Sofia', 'Tariq', 'Thea', 'Theo', 'Tomas',
        'Uma', 'Valentina', 'Victor', 'Wei', 'Yara', 'Yusuf', 'Zara', 'Zoe',
    ];

    private const LAST_NAMES = [
        'Abbott', 'Adeyemi', 'Alvarez', 'Anderson', 'Bailey', 'Banerjee', 'Barnes', 'Becker', 'Bennett', 'Brooks',
        'Campbell', 'Castillo', 'Chen', 'Clarke', 'Cohen', 'Cruz', 'Das', 'Diaz', 'Dubois', 'Edwards',
        'Evans', 'Fischer', 'Flores', 'Foster', 'Garcia', 'Gomez', 'Gupta', 'Hall', 'Hansen', 'Harris',
        'Hayes', 'Hernandez', 'Hughes', 'Ibrahim', 'Ito', 'Jackson', 'Jensen', 'Johnson', 'Kaur', 'Kelly',
        'Khan', 'Kim', 'Kowalski', 'Kumar', 'Larsen', 'Lee', 'Lopez', 'Mahmoud', 'Martin', 'Mendes',
        'Mensah', 'Meyer', 'Mitchell', 'Morales', 'Morgan', 'Murphy', 'Nakamura', 'Nguyen', 'Novak', 'Okafor',
        'Olsen', 'Ortiz', 'Park', 'Patel', 'Perez', 'Peterson', 'Price', 'Quinn', 'Ramirez', 'Reyes',
        'Rivera', 'Roberts', 'Rossi', 'Russo', 'Sanchez', 'Santos', 'Sato', 'Schmidt', 'Shah', 'Silva',
        'Singh', 'Sullivan', 'Tanaka', 'Taylor', 'Thompson', 'Torres', 'Turner', 'Vasquez', 'Wagner', 'Walker',
        'Wang', 'Ward', 'Watson', 'Weber', 'Williams', 'Wong', 'Wright', 'Yamamoto', 'Young', 'Zhang',
    ];

    /**
     * Reserved for documentation by RFC 2606, so no generated address can
     * reach a real inbox.
     */
    private const SAFE_EMAIL_DOMAINS = ['example.com', 'example.net', 'example.org'];

    private Randomizer $randomizer;

    private ?UniqueFakeData $unique = null;

    public function __construct(?int $seed = null)
    {
        $this->seed($seed);
    }

    /**
     * The application's shared generator, the equivalent of `fake()`.
     *
     * There is one per service container. The test suite builds a fresh
     * application for every test, so `unique()` starts empty in each one.
     */
    public static function shared(): self
    {
        $container = Container::getInstance();

        if (! $container->bound(self::class)) {
            $container->instance(self::class, new self);
        }

        return $container->make(self::class);
    }

    /**
     * Make the sequence repeatable: the same seed always yields the same
     * values, on every machine. Pass null to go back to unpredictable values.
     */
    public function seed(?int $seed): self
    {
        $this->randomizer = new Randomizer($seed === null ? new Secure : new Xoshiro256StarStar($seed));

        return $this;
    }

    /**
     * A view of this generator that never returns the same value twice for
     * the same formatter. It remembers what it has returned until `$reset`
     * is passed, and throws an \OverflowException when `$maxRetries` draws
     * in a row are all values it has already given out.
     */
    public function unique(bool $reset = false, int $maxRetries = 10_000): UniqueFakeData
    {
        if ($reset || $this->unique === null) {
            $this->unique = new UniqueFakeData($this, $maxRetries);
        }

        return $this->unique;
    }

    /**
     * A first and last name, such as "Amara Okafor".
     */
    public function name(): string
    {
        return $this->pick(self::FIRST_NAMES).' '.$this->pick(self::LAST_NAMES);
    }

    /**
     * A lowercase address on an example.com / .net / .org domain, such as
     * "amara.okafor@example.net".
     */
    public function safeEmail(): string
    {
        $first = strtolower($this->pick(self::FIRST_NAMES));
        $last = strtolower($this->pick(self::LAST_NAMES));

        $local = match ($this->randomizer->getInt(0, 4)) {
            0 => "{$first}.{$last}",
            1 => "{$last}.{$first}",
            2 => "{$first}_{$last}",
            3 => $first.$this->randomizer->getInt(10, 99),
            default => $first[0].$last,
        };

        return $local.'@'.$this->pick(self::SAFE_EMAIL_DOMAINS);
    }

    /**
     * @param  list<string>  $values
     */
    private function pick(array $values): string
    {
        return $values[$this->randomizer->getInt(0, count($values) - 1)];
    }
}
