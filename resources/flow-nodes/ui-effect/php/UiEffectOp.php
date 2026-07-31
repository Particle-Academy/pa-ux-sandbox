<?php

declare(strict_types=1);

namespace FancyFlow\Nodes\UiEffect;

/**
 * The six operations, mirroring the TypeScript `UiEffectOp` union.
 *
 * Constants rather than an enum because these travel as strings in node config
 * and in the shared fixtures — an enum would just add a conversion at every
 * boundary that JSON already crosses.
 */
final class UiEffectOp
{
    /** Add class(es). Idempotent. */
    public const ADD_CLASS = 'add-class';

    /** Remove class(es). Idempotent. */
    public const REMOVE_CLASS = 'remove-class';

    /** Toggle class(es). NOT idempotent — why the node declares unsafe-to-replay. */
    public const TOGGLE_CLASS = 'toggle-class';

    /** Swap `name` for `value`. */
    public const REPLACE_CLASS = 'replace-class';

    /** Set custom property `name` (theme changes live here). */
    public const SET_VAR = 'set-var';

    /** Set inline style property `name`. */
    public const SET_STYLE = 'set-style';

    /** @return list<string> */
    public static function all(): array
    {
        return [
            self::ADD_CLASS,
            self::REMOVE_CLASS,
            self::TOGGLE_CLASS,
            self::REPLACE_CLASS,
            self::SET_VAR,
            self::SET_STYLE,
        ];
    }

    /** Ops that need `name` as well as `value`. */
    public static function needsName(string $op): bool
    {
        return in_array($op, [self::SET_VAR, self::SET_STYLE, self::REPLACE_CLASS], true);
    }
}
